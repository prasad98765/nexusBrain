import os
import requests
import logging
import hashlib
import time
import json
from datetime import datetime
from flask import Blueprint, request, jsonify, Response, stream_with_context

from .auth_utils import require_auth, require_auth_for_expose_api
from .redis_cache_service import get_cache_service
from .models import db, ApiToken, ApiUsageLog, Workspace

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_llm_routes = Blueprint("api_llm_routes", __name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
# OPENROUTER_API_KEY =  # Replace with your actual key or use environment variable
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

def format_cost(value: float) -> str:
    """Format cost with adaptive precision."""
    if value == 0:
        return "$0.000000"
    elif value < 1e-6:
        return f"${value:.15f}"
    else:
        return f"${value:.6f}"
    
def check_workspace_balance(workspace_id, estimated_cost=0.01):
    """Check if workspace has sufficient balance. Returns (has_balance, current_balance, error_msg)"""
    try:
        workspace = Workspace.query.get(workspace_id)
        if not workspace:
            return False, 0, "Workspace not found"
        
        if workspace.balance < estimated_cost:
            return False, workspace.balance, f"Insufficient balance. Current balance: ${workspace.balance:.6f}. Please add more funds."
        
        return True, workspace.balance, None
    except Exception as e:
        logger.error(f"Error checking workspace balance: {e}")
        return False, 0, "Error checking balance"

def deduct_workspace_balance(workspace_id, cost):
    """Deduct cost from workspace balance"""
    try:
        workspace = Workspace.query.get(workspace_id)
        if workspace:
            workspace.balance = max(0, workspace.balance - cost)
            db.session.commit()
            logger.info(f"Deducted ${cost:.6f} from workspace {workspace_id}. New balance: ${workspace.balance:.6f}")
            return True
    except Exception as e:
        logger.error(f"Error deducting workspace balance: {e}")
        db.session.rollback()
    return False

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
            import json

            # Load model pricing
            with open("shared/llm_details.json") as f:
                llm_details = json.load(f)

            model_pricing = next(
                (item for item in llm_details.get("data", []) if item.get("canonical_slug") == model_permaslug),
                None,
            )
            
            # Extract per-token rates with safe defaults if model pricing not found
            if model_pricing and "pricing" in model_pricing:
                prompt_price = float(model_pricing["pricing"].get("prompt", 0))
                completion_price = float(model_pricing["pricing"].get("completion", 0))
                reasoning_price = float(model_pricing["pricing"].get("internal_reasoning", 0))
            else:
                logger.warning(f"Pricing not found for model: {model_permaslug}, using zero cost")
                prompt_price = 0.0
                completion_price = 0.0
                reasoning_price = 0.0

            # Extract token counts
            prompt_tokens = usage.get("prompt_tokens", 0)
            completion_tokens = usage.get("completion_tokens", 0)
            reasoning_tokens = usage.get("completion_tokens_details", {}).get("reasoning_tokens", 0)

            # Calculate base cost
            base_cost = (
                prompt_tokens * prompt_price +
                completion_tokens * completion_price +
                reasoning_tokens * reasoning_price
            )

            # Apply platform fee (5.5% for non-crypto)
            final_cost = base_cost * 1.055

            logger.info(f"API Usage - Model: {final_cost}")


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
                'usage': final_cost,
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
        
        # Deduct balance from workspace if not cached and cost is calculated
        if not cached and usage_data.get('usage'):
            deduct_workspace_balance(api_token.workspace_id, usage_data.get('usage'))
        
    except Exception as e:
        logger.error(f"Failed to log API usage: {e}")
        db.session.rollback()


def get_openrouter_headers():
    return {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }


def forward_to_openrouter(endpoint: str, payload: dict):
    """Forward POST request and return response in Flask form."""
    url = f"{OPENROUTER_BASE_URL}{endpoint}"
    try:
        resp = requests.post(url, headers=get_openrouter_headers(), json=payload)
        
        # Handle different error cases
        if resp.status_code != 200:
            error_msg = ""
            if resp.status_code == 429:
                error_msg = "Service is busy. Please wait a moment and try again."
                logger.warning(f"Rate limit hit for model: {payload.get('model')}")
            elif resp.status_code == 401:
                error_msg = "Invalid API credentials. Please check your configuration."
                logger.error("Authentication failed with API provider")
            elif resp.status_code >= 500:
                error_msg = "Service is temporarily unavailable. Please try again later."
                logger.error(f"External service error: {resp.status_code}")
            else:
                error_msg = "An unexpected error occurred. Please try again later."
                logger.error(f"API error: {resp.status_code}")
            return jsonify({"error": error_msg}), resp.status_code
            
        # Handle successful response
        try:
            body = resp.json()
        except ValueError:
            logger.error("Failed to parse JSON response")
            return jsonify({"error": "Invalid response format"}), 500
        return jsonify(body), resp.status_code
        
    except requests.exceptions.ConnectionError:
        error_msg = "Unable to connect to service. Please check your internet connection."
        logger.error("Connection failed to API provider")
        return jsonify({"error": error_msg}), 503
    except requests.exceptions.Timeout:
        error_msg = "Request timed out. Please try again."
        logger.error("Request timeout to API provider")
        return jsonify({"error": error_msg}), 504
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500
    

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


def forward_to_openrouter_stream(endpoint: str, payload: dict):
    """Forward streaming requests and return a proper SSE response."""
    url = f"{OPENROUTER_BASE_URL}{endpoint}"
    headers = get_openrouter_headers()

    def generate():
        try:
            resp = requests.post(url, headers=headers, json=payload, stream=True)
            
            # Handle HTTP errors
            if resp.status_code != 200:
                error_msg = ""
                if resp.status_code == 429:
                    error_msg = "Service is busy. Please wait a moment and try again."
                    logger.warning(f"Rate limit hit for model: {payload.get('model')}")
                elif resp.status_code == 401:
                    error_msg = "Invalid API credentials. Please check your configuration."
                    logger.error("Authentication failed with API provider")
                elif resp.status_code >= 500:
                    error_msg = "Service is temporarily unavailable. Please try again later."
                    logger.error(f"External service error: {resp.status_code}")
                else:
                    # Sanitize error message to remove sensitive information
                    error_msg = "An unexpected error occurred. Please try again later."
                    logger.error(f"API error: {resp.status_code} - {resp.text}")
                
                yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"
                return

            # Process the stream
            for line in resp.iter_lines(decode_unicode=True):
                if not line:
                    continue
                    
                # Skip comments
                if line.startswith(":"):
                    continue
                    
                # Handle SSE data
                if line.startswith("data: "):
                    line = line[len("data: "):].strip()
                    if not line:
                        continue
                        
                    # Handle stream end
                    if line == "[DONE]":
                        logger.info("Stream completed")
                        break
                        
                    try:
                        # Parse and validate JSON
                        chunk_json = json.loads(line)
                        
                        # Format as proper SSE
                        yield f"data: {json.dumps(chunk_json)}\n\n"
                    except json.JSONDecodeError as je:
                        logger.error(f"JSON decode error in stream: {str(je)}")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing stream chunk: {str(e)}")
                        continue

        except requests.exceptions.ConnectionError:
            error_msg = "Unable to connect to service. Please check your internet connection."
            logger.error("Connection failed to API provider")
            yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"
        except requests.exceptions.Timeout:
            error_msg = "Request timed out. Please try again."
            logger.error("Request timeout to API provider")
            yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"
        except Exception as e:
            # Sanitize the error message to avoid exposing internal details
            error_msg = "An unexpected error occurred. Please try again later."
            logger.error(f"Unexpected error in stream: {str(e)}")
            yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


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
# @require_auth_for_expose_api
def get_models():
    return forward_to_openrouter_for_model_and_provider("/models")


@api_llm_routes.route("/v1/providers", methods=["GET"])
# @require_auth_for_expose_api
def get_providers():
    return forward_to_openrouter_for_model_and_provider("/providers")


@api_llm_routes.route("/v1/create", methods=["POST"])
@require_auth_for_expose_api
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
    if payload.get("stream"):
        logger.info(f"Cache MISS for completion model: {payload['model']} with streaming - forwarding to OpenRouter")
        start_stream_time = time.time()
        
        def stream_and_cache():
            combined_response = {
                "id": None,
                "model": payload["model"],
                "choices": [],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }
            combined_text = ""
            
            # Get the generator from forward_to_openrouter_stream
            response = forward_to_openrouter_stream("/completions", payload)
            
            # Wrap the generator to collect and combine chunks
            def wrapped_generator():
                nonlocal combined_text, combined_response
                
                for chunk in response.response:  # response.response contains the generator
                    # Forward the chunk to client
                    yield chunk
                    
                    # Process chunk for combining
                    try:
                        if chunk.startswith("data: "):
                            chunk_data = json.loads(chunk[6:])  # Remove "data: " prefix
                            
                            # Update combined response
                            if "id" in chunk_data and not combined_response["id"]:
                                combined_response["id"] = chunk_data["id"]
                            
                            if "choices" in chunk_data and chunk_data["choices"]:
                                text = chunk_data["choices"][0].get("text", "")
                                combined_text += text
                                
                            # Update usage if present
                            if "usage" in chunk_data:
                                for key in ["prompt_tokens", "completion_tokens", "total_tokens"]:
                                    if key in chunk_data["usage"]:
                                        combined_response["usage"][key] = chunk_data["usage"][key]
                    
                    except json.JSONDecodeError:
                        logger.error("Failed to parse streaming chunk")
                        continue
                
                # After stream completes, store in cache and log
                combined_response["choices"] = [{
                    "text": combined_text,
                    "index": 0,
                    "finish_reason": "stop"  # or extract from last chunk if available
                }]
                
                # Add provider information if available in any chunk
                if "provider" in chunk_data:
                    combined_response["provider"] = chunk_data["provider"]
                elif "model_info" in chunk_data and "provider" in chunk_data["model_info"]:
                    combined_response["provider"] = chunk_data["model_info"]["provider"]
                
                # Add other model info if available
                if "model_info" in chunk_data:
                    combined_response["model_info"] = chunk_data["model_info"]
                
                # Store in cache if enabled
                if api_token.caching_enabled:
                    try:
                        cache_service = get_cache_service()
                        cache_service.store_response(payload, combined_response, "completion")
                        logger.info(f"Stored combined streaming response in cache for model: {payload['model']}")
                    except Exception as e:
                        logger.error(f"Failed to store streaming response in cache: {e}")
                
                # Log API usage
                response_time_ms = int((time.time() - start_stream_time) * 1000)
                log_api_usage(
                    api_token=api_token,
                    endpoint="/v1/create",
                    method="POST",
                    payload=payload,
                    response_data=combined_response,
                    status_code=200,
                    response_time_ms=response_time_ms,
                    cached=False,
                    cache_type=None
                )
            
            # Return a new Response with our wrapped generator
            return Response(
                stream_with_context(wrapped_generator()),
                mimetype="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        
        return stream_and_cache()
    else:
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
@require_auth_for_expose_api
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

    # Check workspace balance before processing (skip for cached responses)
    # We'll do a proper check after cache miss
    has_balance, current_balance, balance_error = check_workspace_balance(api_token.workspace_id, 0.0001)
    if not has_balance:
        return jsonify({"error": balance_error}), 402  # 402 Payment Required

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
    if payload.get("stream"):
        logger.info(f"Cache MISS for chat model: {payload['model']} with streaming - forwarding to OpenRouter")
        start_stream_time = time.time()
        
        def stream_and_cache():
            combined_response = {
                "id": None,
                "model": payload["model"],
                "choices": [],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }
            combined_content = ""
            last_chunk_data = None
            
            # Get the generator from forward_to_openrouter_stream
            response = forward_to_openrouter_stream("/chat/completions", payload)
            
            # Wrap the generator to collect and combine chunks
            def wrapped_generator():
                nonlocal combined_content, combined_response, last_chunk_data
                
                for chunk in response.response:
                    # Forward the chunk to client
                    yield chunk
                    
                    # Process chunk for combining
                    try:
                        if chunk.startswith("data: "):
                            chunk_data = json.loads(chunk[6:])  # Remove "data: " prefix
                            last_chunk_data = chunk_data  # Store the last chunk for metadata
                            
                            # Update combined response
                            if "id" in chunk_data and not combined_response["id"]:
                                combined_response["id"] = chunk_data["id"]
                            
                            if "choices" in chunk_data and chunk_data["choices"]:
                                content = chunk_data["choices"][0].get("delta", {}).get("content", "")
                                if content:
                                    combined_content += content
                            
                            # Update usage if present
                            if "usage" in chunk_data:
                                for key in ["prompt_tokens", "completion_tokens", "total_tokens"]:
                                    if key in chunk_data["usage"]:
                                        combined_response["usage"][key] = chunk_data["usage"][key]
                            
                            # Capture provider info as soon as it's available
                            if "provider" in chunk_data and "provider" not in combined_response:
                                combined_response["provider"] = chunk_data["provider"]
                            if "model_info" in chunk_data:
                                combined_response["model_info"] = chunk_data["model_info"]
                                if "provider" not in combined_response and "provider" in chunk_data["model_info"]:
                                    combined_response["provider"] = chunk_data["model_info"]["provider"]
                    
                    except json.JSONDecodeError:
                        logger.error("Failed to parse streaming chunk")
                        continue
                
                # After stream completes, store in cache and log
                finish_reason = "stop"
                if last_chunk_data and "choices" in last_chunk_data and last_chunk_data["choices"]:
                    finish_reason = last_chunk_data["choices"][0].get("finish_reason", "stop")
                
                combined_response["choices"] = [{
                    "message": {
                        "role": "assistant",
                        "content": combined_content
                    },
                    "index": 0,
                    "finish_reason": finish_reason
                }]
                
                # Store in cache if enabled
                if api_token.caching_enabled:
                    try:
                        cache_service = get_cache_service()
                        cache_service.store_response(payload, combined_response, "chat")
                        logger.info(f"Stored combined streaming chat response in cache for model: {payload['model']}")
                    except Exception as e:
                        logger.error(f"Failed to store streaming chat response in cache: {e}")
                
                # Log API usage
                response_time_ms = int((time.time() - start_stream_time) * 1000)
                log_api_usage(
                    api_token=api_token,
                    endpoint="/v1/chat/create",
                    method="POST",
                    payload=payload,
                    response_data=combined_response,
                    status_code=200,
                    response_time_ms=response_time_ms,
                    cached=False,
                    cache_type=None
                )
            
            # Return a new Response with our wrapped generator
            return Response(
                stream_with_context(wrapped_generator()),
                mimetype="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "X-Accel-Buffering": "no"
                }
            )
        
        return stream_and_cache()
    else:
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
