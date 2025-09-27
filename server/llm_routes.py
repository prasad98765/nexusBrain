import os
import requests
import logging
import hashlib
import time
from datetime import datetime
from flask import Blueprint, request, jsonify

from .auth_utils import require_auth
from .redis_cache_service import get_cache_service
from .models import db, ApiToken, ApiUsageLog

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_llm_routes = Blueprint("api_llm_routes", __name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_BASE_URL_FOR_MODELS_AND_PROVIDERS = "https://openrouter.ai/api/v1"


# ——— Helpers ———

def get_api_token_from_request():
    """Extract and validate API token from Authorization header."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None, "Missing or invalid Authorization header"
    
    token = auth_header[7:]  # Remove 'Bearer ' prefix
    if not token.startswith('nxs-'):
        return None, "Invalid token format"
    
    # Hash the token to find it in database
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # Look up token in database
    api_token = ApiToken.query.filter_by(token=token_hash, is_active=True).first()
    if not api_token:
        return None, "Invalid or inactive API token"
    
    # Update last used timestamp
    api_token.last_used_at = datetime.utcnow()
    db.session.commit()
    
    return api_token, None


def log_api_usage(api_token, endpoint, method, payload, response_data, status_code, 
                  response_time_ms, cached=False, cache_type=None, error_message=None):
    """Create comprehensive API usage log entry."""
    try:
        # Extract model information
        model = payload.get('model', 'unknown')
        
        # Parse OpenRouter response for detailed information
        usage_data = {}
        if response_data and isinstance(response_data, dict):
            # Extract generation ID
            generation_id = response_data.get('id')
            
            # Extract model information
            model_permaslug = response_data.get('model')
            provider = response_data.get('provider')
            
            # Extract usage information
            usage = response_data.get('usage', {})
            prompt_tokens = usage.get('prompt_tokens', 0)
            completion_tokens = usage.get('completion_tokens', 0)
            reasoning_tokens = usage.get('completion_tokens_details', {}).get('reasoning_tokens', 0)
            total_tokens = usage.get('total_tokens', prompt_tokens + completion_tokens)
            
            # Calculate cost based on tokens (simplified - would need pricing data)
            cost = total_tokens * 0.00001  # Placeholder cost calculation
            
            # Extract performance metrics
            first_token_latency = None
            throughput = None
            finish_reason = None
            
            if 'choices' in response_data and response_data['choices']:
                first_choice = response_data['choices'][0]
                finish_reason = first_choice.get('finish_reason')
                
                # Calculate throughput if we have timing data
                if response_time_ms and completion_tokens:
                    throughput = (completion_tokens / response_time_ms) * 1000  # tokens per second
            
            usage_data = {
                'generation_id': generation_id,
                'model_permaslug': model_permaslug,
                'provider': provider,
                'prompt_tokens': prompt_tokens,
                'completion_tokens': completion_tokens,
                'reasoning_tokens': reasoning_tokens,
                'usage': cost,
                'finish_reason': finish_reason,
                'first_token_latency': first_token_latency,
                'throughput': throughput
            }
        
        # Create log entry
        log_entry = ApiUsageLog(
            token_id=api_token.id,
            workspace_id=api_token.workspace_id,
            endpoint=endpoint,
            model=model,
            model_permaslug=usage_data.get('model_permaslug'),
            provider=usage_data.get('provider'),
            method=method,
            status_code=status_code,
            tokens_used=usage_data.get('prompt_tokens', 0) + usage_data.get('completion_tokens', 0),
            prompt_tokens=usage_data.get('prompt_tokens'),
            completion_tokens=usage_data.get('completion_tokens'),
            reasoning_tokens=usage_data.get('reasoning_tokens'),
            usage=usage_data.get('usage'),
            requests=1,
            generation_id=usage_data.get('generation_id'),
            finish_reason=usage_data.get('finish_reason'),
            first_token_latency=usage_data.get('first_token_latency'),
            throughput=usage_data.get('throughput'),
            response_time_ms=response_time_ms,
            error_message=error_message,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            cached=cached,
            cache_type=cache_type
        )
        
        db.session.add(log_entry)
        db.session.commit()
        
        logger.info(f"Logged API usage - Model: {model}, Tokens: {usage_data.get('prompt_tokens', 0) + usage_data.get('completion_tokens', 0)}, Cached: {cached}")
        
    except Exception as e:
        logger.error(f"Failed to log API usage: {e}")
        db.session.rollback()


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
def create_completion():
    start_time = time.time()
    
    # Get and validate API token
    api_token, token_error = get_api_token_from_request()
    if token_error:
        return jsonify({"error": token_error}), 401
    
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    # According to OpenRouter docs, completions require at least `model` and `prompt`
    err = validate_fields(data, {
        "model": is_nonempty_string,
        "prompt": is_nonempty_string,
    })
    if err:
        return jsonify({"error": err}), 400

    # Construct payload with all supported (and optionally passed) parameters
    payload = {
        "model": data["model"],
        "prompt": data["prompt"],
    }

    # Optional parameters (per docs) — only include if present
    for opt in [
        "max_tokens", "temperature", "top_p", "stop", "stream", "seed", "logit_bias",
        "top_logprobs", "presence_penalty", "frequency_penalty", "repetition_penalty",
        "min_p", "top_k", "top_a", "response_format", "transforms", "models",
        "tools", "tool_choice", "prediction",
    ]:
        if opt in data:
            payload[opt] = data[opt]

    # Also optional fields for user and metadata
    if "user" in data:
        payload["user"] = data["user"]
    if "metadata" in data:
        payload["metadata"] = data["metadata"]

    # Check cache if caching is enabled
    cached_response = None
    cache_type = None
    
    if api_token.caching_enabled:
        cache_service = get_cache_service()
        # Pass the semantic cache threshold from the API token
        cached_response, cache_type = cache_service.get_cached_response(
            payload, "completion", threshold=api_token.semantic_cache_threshold
        )
    
    response_time_ms = int((time.time() - start_time) * 1000)
    
    if cached_response:
        logger.info(f"Cache HIT ({cache_type}) for completion model: {payload['model']}")
        
        # Log cache hit
        log_api_usage(
            api_token=api_token,
            endpoint="/v1/create",
            method="POST",
            payload=payload,
            response_data=cached_response,
            status_code=200,
            response_time_ms=response_time_ms,
            cached=True,
            cache_type=cache_type
        )
        
        return jsonify(cached_response), 200
    
    # Cache miss - forward to OpenRouter
    logger.info(f"Cache MISS for completion model: {payload['model']} - forwarding to OpenRouter")
    response, status_code = forward_to_openrouter("/completions", payload)
    
    response_time_ms = int((time.time() - start_time) * 1000)
    response_data = None
    error_message = None
    
    # Store successful responses in cache and extract data for logging
    if status_code == 200:
        try:
            response_data = response.get_json() if hasattr(response, 'get_json') else response.json
            
            if api_token.caching_enabled:
                cache_service.store_response(payload, response_data, "completion")
                logger.info(f"Stored completion response in cache for model: {payload['model']}")
                
        except Exception as e:
            logger.error(f"Failed to store completion response in cache: {e}")
    else:
        # Handle error responses
        try:
            response_data = response.get_json() if hasattr(response, 'get_json') else response.json
            error_message = response_data.get('error', 'Unknown error') if response_data else 'Unknown error'
        except:
            error_message = 'Failed to parse error response'
    
    # Log API usage
    log_api_usage(
        api_token=api_token,
        endpoint="/v1/create",
        method="POST",
        payload=payload,
        response_data=response_data,
        status_code=status_code,
        response_time_ms=response_time_ms,
        cached=False,
        error_message=error_message
    )
    
    return response, status_code


@api_llm_routes.route("/v1/chat/create", methods=["POST"])
def create_chat_completion():
    start_time = time.time()
    
    # Get and validate API token
    api_token, token_error = get_api_token_from_request()
    if token_error:
        return jsonify({"error": token_error}), 401
    
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

    # Check cache if caching is enabled
    cached_response = None
    cache_type = None
    
    if api_token.caching_enabled:
        cache_service = get_cache_service()
        # Pass the semantic cache threshold from the API token
        cached_response, cache_type = cache_service.get_cached_response(
            payload, "chat", threshold=api_token.semantic_cache_threshold
        )
    
    response_time_ms = int((time.time() - start_time) * 1000)
    
    if cached_response:
        logger.info(f"Cache HIT ({cache_type}) for chat model: {payload['model']}")
        
        # Log cache hit
        log_api_usage(
            api_token=api_token,
            endpoint="/v1/chat/create",
            method="POST",
            payload=payload,
            response_data=cached_response,
            status_code=200,
            response_time_ms=response_time_ms,
            cached=True,
            cache_type=cache_type
        )
        
        return jsonify(cached_response), 200
    
    # Cache miss - forward to OpenRouter
    logger.info(f"Cache MISS for chat model: {payload['model']} - forwarding to OpenRouter")
    response, status_code = forward_to_openrouter("/chat/completions", payload)
    
    response_time_ms = int((time.time() - start_time) * 1000)
    response_data = None
    error_message = None
    
    # Store successful responses in cache and extract data for logging
    if status_code == 200:
        try:
            response_data = response.get_json() if hasattr(response, 'get_json') else response.json
            
            if api_token.caching_enabled:
                cache_service.store_response(payload, response_data, "chat")
                logger.info(f"Stored chat response in cache for model: {payload['model']}")
                
        except Exception as e:
            logger.error(f"Failed to store chat response in cache: {e}")
    else:
        # Handle error responses
        try:
            response_data = response.get_json() if hasattr(response, 'get_json') else response.json
            error_message = response_data.get('error', 'Unknown error') if response_data else 'Unknown error'
        except:
            error_message = 'Failed to parse error response'
    
    # Log API usage
    log_api_usage(
        api_token=api_token,
        endpoint="/v1/chat/create",
        method="POST",
        payload=payload,
        response_data=response_data,
        status_code=status_code,
        response_time_ms=response_time_ms,
        cached=False,
        error_message=error_message
    )
    
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
