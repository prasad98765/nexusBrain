import os
import requests
import logging
from flask import Blueprint, request, jsonify

from .auth_utils import require_auth
from .redis_cache_service import get_cache_service

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_llm_routes = Blueprint("api_llm_routes", __name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_BASE_URL_FOR_MODELS_AND_PROVIDERS = "https://openrouter.ai/api/v1"


# ——— Helpers ———

def get_openrouter_headers():
    return {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }


def forward_to_openrouter(endpoint: str, payload: dict):
    """Forward POST to OpenRouter with proper headers and return response in Flask form."""
    url = f"{OPENROUTER_BASE_URL}{endpoint}"
    try:
        resp = requests.post(url, headers=get_openrouter_headers(), json=payload)
        # Forward status codes and JSON or text
        try:
            body = resp.json()
        except ValueError:
            body = {"error": resp.text}
        return jsonify(body), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

def forward_to_openrouter_for_model_and_provider(endpoint: str):
    """Forward POST to OpenRouter with proper headers and return response in Flask form."""
    url = f"{OPENROUTER_BASE_URL_FOR_MODELS_AND_PROVIDERS}{endpoint}"
    try:
        resp = requests.get(url)
        # Forward status codes and JSON or text
        try:
            body = resp.json()
        except ValueError:
            body = {"error": resp.text}
        return jsonify(body), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def validate_fields(data: dict, required: dict):
    """
    Validate existence and basic types of required fields.
    `required` is a dict: field_name → a callable for validating (or None for simple presence).
    Returns error message str or None if okay.
    """
    for field, validator in required.items():
        if field not in data:
            return f"Field '{field}' is required"
        if validator:
            valid, msg = validator(data[field])
            if not valid:
                return msg
    return None


# Validators
def is_nonempty_string(x):
    if not isinstance(x, str) or not x.strip():
        return False, "must be a non-empty string"
    return True, None


def is_list_of_messages(x):
    if not isinstance(x, list):
        return False, "must be a list"
    # minimal check: each item is dict with "role" and "content"
    for i, msg in enumerate(x):
        if not isinstance(msg, dict):
            return False, f"message at index {i} is not an object"
        if "role" not in msg or "content" not in msg:
            return False, f"message at index {i} missing 'role' or 'content'"
        if not isinstance(msg["role"], str) or not isinstance(msg["content"], str):
            return False, f"message at index {i} has invalid types"
    return True, None


# ——— Routes ———

@api_llm_routes.route("/v1/models", methods=["GET"])
@require_auth
def get_models():
    return forward_to_openrouter_for_model_and_provider("/models")


@api_llm_routes.route("/v1/providers", methods=["GET"])
@require_auth
def get_providers():
    return forward_to_openrouter_for_model_and_provider("/providers")


@api_llm_routes.route("/v1/create", methods=["POST"])
@require_auth
def create_completion():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    # According to OpenRouter docs, completions require at least `model` and `prompt` :contentReference[oaicite:1]{index=1}
    err = validate_fields(data, {
        "model": is_nonempty_string,
        "prompt": is_nonempty_string,
    })
    if err:
        return jsonify({"error": err}), 400

    # Construct payload with all supported (and optionally passed) parameters
    # Based on OpenRouter "Completion" docs — only `model`, `prompt`, plus optional fields allowed
    payload = {
        "model": data["model"],
        "prompt": data["prompt"],
    }

    # Optional parameters (per docs) — only include if present
    for opt in [
        "max_tokens",
        "temperature",
        "top_p",
        "stop",
        "stream",
        "seed",
        "logit_bias",
        "top_logprobs",
        "presence_penalty",
        "frequency_penalty",
        "repetition_penalty",
        "min_p",
        "top_k",
        "top_a",
        "response_format",
        "transforms",
        "models",  # routing override
        "tools",
        "tool_choice",
        "prediction",
    ]:
        if opt in data:
            payload[opt] = data[opt]

    # Also optional fields for user and metadata (OpenRouter supports user) :contentReference[oaicite:2]{index=2}
    if "user" in data:
        payload["user"] = data["user"]
    if "metadata" in data:
        payload["metadata"] = data["metadata"]

    # Check Redis cache first (requires REDIS_URL environment variable)
    cache_service = get_cache_service()
    cached_response = cache_service.get_cached_response(payload, "completion")
    
    if cached_response:
        logger.info(f"Cache HIT for completion model: {payload['model']}")
        return jsonify(cached_response), 200
    
    # Cache miss - forward to OpenRouter
    logger.info(f"Cache MISS for completion model: {payload['model']} - forwarding to OpenRouter")
    response, status_code = forward_to_openrouter("/completions", payload)
    
    # Store successful responses in cache
    if status_code == 200:
        try:
            response_data = response.get_json() if hasattr(response, 'get_json') else response.json
            cache_service.store_response(payload, response_data, "completion")
            logger.info(f"Stored completion response in cache for model: {payload['model']}")
        except Exception as e:
            logger.error(f"Failed to store completion response in cache: {e}")
    
    return response, status_code


@api_llm_routes.route("/v1/chat/create", methods=["POST"])
@require_auth
def create_chat_completion():
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    # According to docs, chat completions require `model` and `messages` :contentReference[oaicite:3]{index=3}
    err = validate_fields(data, {
        "model": is_nonempty_string,
        "messages": is_list_of_messages,
    })
    if err:
        return jsonify({"error": err}), 400

    payload = {
        "model": data["model"],
        "messages": data["messages"],
    }

    # Optional fields supported by chat endpoint (from docs) :contentReference[oaicite:4]{index=4}
    for opt in [
        "max_tokens",
        "temperature",
        "top_p",
        "stream",
        "seed",
        "logit_bias",
        "top_logprobs",
        "presence_penalty",
        "frequency_penalty",
        "repetition_penalty",
        "min_p",
        "top_k",
        "top_a",
        # Also “provider”, “models” override, “transforms”, reasoning etc.
        "provider",
        "models",
        "transforms",
        "usage",
        "reasoning",
    ]:
        if opt in data:
            payload[opt] = data[opt]

    # Optional user & metadata
    if "user" in data:
        payload["user"] = data["user"]
    if "metadata" in data:
        payload["metadata"] = data["metadata"]

    # Check Redis cache first (requires REDIS_URL environment variable)
    cache_service = get_cache_service()
    cached_response = cache_service.get_cached_response(payload, "chat")
    
    if cached_response:
        logger.info(f"Cache HIT for chat model: {payload['model']}")
        return jsonify(cached_response), 200
    
    # Cache miss - forward to OpenRouter
    logger.info(f"Cache MISS for chat model: {payload['model']} - forwarding to OpenRouter")
    response, status_code = forward_to_openrouter("/chat/completions", payload)
    
    # Store successful responses in cache
    if status_code == 200:
        try:
            response_data = response.get_json() if hasattr(response, 'get_json') else response.json
            cache_service.store_response(payload, response_data, "chat")
            logger.info(f"Stored chat response in cache for model: {payload['model']}")
        except Exception as e:
            logger.error(f"Failed to store chat response in cache: {e}")
    
    return response, status_code


@api_llm_routes.route("/v1/cache/stats", methods=["GET"])
@require_auth
def get_cache_stats():
    """Get Redis cache statistics and status."""
    cache_service = get_cache_service()
    stats = cache_service.get_cache_stats()
    return jsonify(stats), 200


@api_llm_routes.route("/v1/cache/clear", methods=["POST"])
@require_auth
def clear_cache():
    """Clear all cached LLM responses."""
    cache_service = get_cache_service()
    cleared_count = cache_service.clear_cache()
    return jsonify({
        "message": f"Cleared {cleared_count} cache entries",
        "cleared_count": cleared_count
    }), 200
