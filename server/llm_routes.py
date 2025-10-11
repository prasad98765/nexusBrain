import os
import logging
import hashlib
import time
import json
import threading
from datetime import datetime
from flask import Blueprint, request, jsonify, Response, stream_with_context, current_app

import httpx

from .auth_utils import require_auth, require_auth_for_expose_api
from .redis_cache_service import get_cache_service
from .models import db, ApiToken, ApiUsageLog, Workspace

# Async logging to prevent blocking
def async_log_api_usage(api_token_id, workspace_id, endpoint, method, payload, response_data, status_code,
                        response_time_ms, cached=False, cache_type=None, error_message=None):
    """Log API usage in a background thread to avoid blocking the main request."""
    app = current_app._get_current_object()

    # Capture request data before leaving the context
    req_meta = {
        "ip": request.remote_addr,
        "user_agent": request.headers.get("User-Agent"),
    }

    def _log_with_context():
        with app.app_context():
            # Refetch objects in the background thread to avoid session conflicts
            api_token = ApiToken.query.get(api_token_id)
            if not api_token:
                logger.error(f"API token {api_token_id} not found in background thread")
                return

            workspace = Workspace.query.get(workspace_id) if workspace_id else None

            log_api_usage_background(api_token, workspace, endpoint, method, payload, response_data,
                                   status_code, response_time_ms, cached, cache_type, error_message, req_meta)

    threading.Thread(target=_log_with_context, daemon=True).start()

def log_api_usage_background(api_token, workspace, endpoint, method, payload, response_data, status_code,
                           response_time_ms, cached=False, cache_type=None, error_message=None, request_meta=None):
    """Background version of log_api_usage that handles its own DB operations."""
    try:
        # Extract model information
        model = payload.get('model', 'unknown')
        ip_address = request_meta.get("ip") if request_meta else None
        user_agent = request_meta.get("user_agent") if request_meta else None

        # Parse OpenRouter response for detailed information
        usage_data = {}
        if response_data and isinstance(response_data, dict):
            generation_id = response_data.get('id')
            model_permaslug = response_data.get('model')
            provider = response_data.get('provider')

            usage = response_data.get('usage', {})
            prompt_tokens = usage.get('prompt_tokens', 0)
            completion_tokens = usage.get('completion_tokens', 0)
            reasoning_tokens = usage.get('completion_tokens_details', {}).get('reasoning_tokens', 0)

            model_pricing = next(
                (item for item in LLM_DETAILS.get("data", []) if item.get("id") == model_permaslug),
                None,
            )
            logger.info(f"Model pricing lookup for {model_permaslug}: {model_pricing}")

            if model_pricing and "pricing" in model_pricing:
                prompt_price = float(model_pricing["pricing"].get("prompt", 0))
                completion_price = float(model_pricing["pricing"].get("completion", 0))
                reasoning_price = float(model_pricing["pricing"].get("internal_reasoning", 0))
            else:
                prompt_price = 0.0
                completion_price = 0.0
                reasoning_price = 0.0

            logger.info(f"Pricing for {model_permaslug} - Prompt: {prompt_price}, Completion: {completion_price}, Reasoning: {reasoning_price}")
            base_cost = (
                prompt_tokens * prompt_price +
                completion_tokens * completion_price +
                reasoning_tokens * reasoning_price
            )
            logger.info(f"Base cost before fees: ${base_cost:.6f} for model {model_permaslug}")
            final_cost = base_cost * 1.055
            logger.info(f"Calculated cost: ${final_cost:.6f} for model {model_permaslug}")
            finish_reason = None
            throughput = None
            if 'choices' in response_data and response_data['choices']:
                first_choice = response_data['choices'][0]
                finish_reason = first_choice.get('finish_reason')
                if response_time_ms and completion_tokens:
                    throughput = (completion_tokens / response_time_ms) * 1000

            usage_data = {
                'generation_id': generation_id,
                'model_permaslug': model_permaslug,
                'provider': provider,
                'prompt_tokens': prompt_tokens,
                'completion_tokens': completion_tokens,
                'reasoning_tokens': reasoning_tokens,
                'usage': final_cost,
                'finish_reason': finish_reason,
                'throughput': throughput
            }

        # Create log entry
        log_entry = ApiUsageLog(
            token_id=api_token.id,
            workspace_id=api_token.workspace_id,
            endpoint=endpoint,
            model=model_permaslug,
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
            throughput=usage_data.get('throughput'),
            response_time_ms=response_time_ms,
            error_message=error_message,
            ip_address=ip_address,
            user_agent=user_agent,
            cached=cached,
            cache_type=cache_type
        )

        if not cached and usage_data.get('usage'):
            deduct_workspace_balance(api_token.workspace_id, usage_data.get('usage'))
        # Batch DB operations
        db.session.add(log_entry)
        api_token.last_used_at = datetime.utcnow()
        db.session.add(api_token)

        if not cached and usage_data.get('usage') and workspace:
            workspace.balance = max(0, workspace.balance - usage_data.get('usage'))
            db.session.add(workspace)

        db.session.commit()
        logger.info(f"Logged API usage (background) - Model: {model}, Tokens: {usage_data.get('prompt_tokens', 0) + usage_data.get('completion_tokens', 0)}, Cached: {cached}")

    except Exception as e:
        logger.error(f"Failed to log API usage in background: {e}")
        db.session.rollback()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

api_llm_routes = Blueprint("api_llm_routes", __name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
OPENROUTER_BASE_URL_FOR_MODELS_AND_PROVIDERS = "https://openrouter.ai/api/v1"

# Preload LLM details for performance
LLM_DETAILS = {}
try:
    with open("shared/llm_details.json") as f:
        LLM_DETAILS = json.load(f)
except Exception as e:
    logger.error(f"Failed to load LLM details: {e}")

# Global httpx client for connection pooling
httpx_client = httpx.Client(timeout=30.0, limits=httpx.Limits(max_keepalive_connections=20, max_connections=100))

# Helpers
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

    # Update last used timestamp (will be committed in log_api_usage)
    api_token.last_used_at = datetime.utcnow()

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
        logger.info(f"Checking balance for workspace {workspace_id}, current balance: ${workspace.balance if workspace else 'N/A'}, estimated cost: ${estimated_cost}")
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
                  response_time_ms, cached=False, cache_type=None, error_message=None, request_meta=None):
    """Create comprehensive API usage log entry."""
    try:
        # Extract model information
        model = payload.get('model', 'unknown')
        ip_address = request_meta.get("ip") if request_meta else None
        user_agent = request_meta.get("user_agent") if request_meta else None
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

            # Get model pricing from preloaded data
            model_pricing = next(
                (item for item in LLM_DETAILS.get("data", []) if item.get("canonical_slug") == model_permaslug),
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

            # Calculate base cost
            base_cost = (
                prompt_tokens * prompt_price +
                completion_tokens * completion_price +
                reasoning_tokens * reasoning_price
            )

            # Apply platform fee (5.5% for non-crypto)
            final_cost = base_cost * 1.055

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
            ip_address=ip_address,
            user_agent=user_agent,
            cached=cached,
            cache_type=cache_type
        )

        # Batch DB operations to reduce commits
        db.session.add(log_entry)

        # Update token last used
        api_token.last_used_at = datetime.utcnow()
        db.session.add(api_token)

        # Deduct balance from workspace if not cached and cost is calculated
        if not cached and usage_data.get('usage'):
            workspace = Workspace.query.get(api_token.workspace_id)
            if workspace:
                workspace.balance = max(0, workspace.balance - usage_data.get('usage'))
                db.session.add(workspace)

        # Single commit for all operations
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
    """Forward POST request and return response in Flask form."""
    url = f"{OPENROUTER_BASE_URL}{endpoint}"
    try:
        resp = httpx_client.post(url, headers=get_openrouter_headers(), json=payload)

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

    except httpx.ConnectError:
        error_msg = "Unable to connect to service. Please check your internet connection."
        logger.error("Connection failed to API provider")
        return jsonify({"error": error_msg}), 503
    except httpx.TimeoutException:
        error_msg = "Request timed out. Please try again."
        logger.error("Request timeout to API provider")
        return jsonify({"error": error_msg}), 504
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

def forward_to_openrouter_for_model_and_provider(endpoint: str):
    """Forward GET to OpenRouter with proper headers and return response in Flask form."""
    url = f"{OPENROUTER_BASE_URL_FOR_MODELS_AND_PROVIDERS}{endpoint}"
    try:
        resp = httpx_client.get(url)
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
            with httpx_client.stream("POST", url, headers=headers, json=payload) as resp:

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
                        error_msg = "An unexpected error occurred. Please try again later."
                        logger.error(f"API error: {resp.status_code}")
                    yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"
                    return

                # Process the stream with proper type handling
                for raw_line in resp.iter_lines():
                    if not raw_line:
                        continue
                        
                    # Handle the line based on its type
                    if isinstance(raw_line, bytes):
                        try:
                            line = raw_line.decode('utf-8')
                        except UnicodeDecodeError:
                            logger.error("Failed to decode response line")
                            continue
                    else:
                        line = raw_line

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
                            
                            # Log the chunk for debugging if needed
                            logger.debug(f"Received chunk: {json.dumps(chunk_json)[:100]}...")

                            # Format as proper SSE
                            yield f"data: {json.dumps(chunk_json)}\n\n"
                        except json.JSONDecodeError as je:
                            logger.error(f"JSON decode error in stream: {str(je)}, line: {line[:100]}...")
                            continue
                        except Exception as e:
                            logger.error(f"Error processing stream chunk: {str(e)}, line: {line[:100]}...")
                            continue

        except httpx.ConnectError:
            error_msg = "Unable to connect to service. Please check your internet connection."
            logger.error("Connection failed to API provider")
            yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"
        except httpx.TimeoutException:
            error_msg = "Request timed out. Please try again."
            logger.error("Request timeout to API provider")
            yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"
        except Exception as e:
            error_msg = "An unexpected error occurred. Please try again later."
            logger.error(f"Unexpected error in stream: {str(e)}")
            yield f"data: {{\"error\": \"{error_msg}\"}}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# Routes
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
    if not data.get("model") or not data.get("prompt"):
        return jsonify({"error": "Fields 'model' and 'prompt' are required"}), 400

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

    if data.get("is_cached"):
        cache_service = get_cache_service(data.get("cache_threshold", 0.50))
        # Pass the semantic cache threshold from the API token
        cached_response, cache_type = cache_service.get_cached_response(
            payload, "completion", threshold=api_token.semantic_cache_threshold
        )

    response_time_ms = int((time.time() - start_time) * 1000)

    if cached_response:
        logger.info(f"Cache HIT ({cache_type}) for completion model: {payload['model']}")

        # Log cache hit
        async_log_api_usage(
            api_token_id=api_token.id,
            workspace_id=api_token.workspace_id,
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
                if data.get("is_cached") and combined_response:
                    try:
                        cache_service = get_cache_service()
                        cache_service.store_response(payload, combined_response, "completion")
                        logger.info(f"Stored combined streaming response in cache for model: {payload['model']}")
                    except Exception as e:
                        logger.error(f"Failed to store streaming response in cache: {e}")

                # Log API usage
                response_time_ms = int((time.time() - start_stream_time) * 1000)
                async_log_api_usage(
                    api_token_id=api_token.id,
                    workspace_id=api_token.workspace_id,
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

            if data.get("is_cached") and response_data:
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
    async_log_api_usage(
        api_token_id=api_token.id,
        workspace_id=api_token.workspace_id,
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

    # According to docs, chat completions require `model` and `messages`
    if not data.get("model") or not data.get("messages"):
        return jsonify({"error": "Fields 'model' and 'messages' are required"}), 400

    payload = {
        "model": data["model"],
        "messages": data["messages"],
    }

    # Optional fields supported by chat endpoint (from docs)
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
        # Also "provider", "models" override, "transforms", reasoning etc.
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

    if data.get("is_cached"):
        cache_service = get_cache_service()
        # Pass the semantic cache threshold from the API token
        cached_response, cache_type = cache_service.get_cached_response(
            payload, "chat", threshold=api_token.semantic_cache_threshold
        )

    response_time_ms = int((time.time() - start_time) * 1000)

    if cached_response:
        logger.info(f"Cache HIT ({cache_type}) for chat model: {payload['model']}")

        # Log cache hit
        async_log_api_usage(
            api_token_id=api_token.id,
            workspace_id=api_token.workspace_id,
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
                            logger.debug(f"Processing chunk: {chunk[:100]}...")

                            # Update response metadata
                            for key in ["id", "model", "provider"]:
                                if key in chunk_data and not combined_response.get(key):
                                    combined_response[key] = chunk_data[key]
                            
                            # Handle streaming message content
                            if "choices" in chunk_data and chunk_data["choices"]:
                                choice = chunk_data["choices"][0]
                                if "delta" in choice:
                                    delta = choice["delta"]
                                    if "content" in delta:
                                        content = delta["content"]
                                        combined_content += content
                                        logger.debug(f"Added content: {content[:50]}...")
                                        
                            # Update usage if present
                            if "usage" in chunk_data:
                                usage = chunk_data["usage"]
                                for key in ["prompt_tokens", "completion_tokens", "total_tokens"]:
                                    if key in usage:
                                        combined_response["usage"][key] = usage[key]
                                        logger.debug(f"Updated {key}: {usage[key]}")
                    except json.JSONDecodeError as je:
                        logger.error(f"Failed to parse streaming chunk: {str(je)}, chunk: {chunk[:100]}...")
                        continue
                    except Exception as e:
                        logger.error(f"Error processing chunk: {str(e)}, chunk: {chunk[:100]}...")
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
                if data.get("is_cached") and combined_response["choices"]:
                    try:
                        cache_service = get_cache_service()
                        cache_service.store_response(payload, combined_response, "chat")
                        logger.info(f"Stored combined streaming chat response in cache for model: {payload['model']}")
                    except Exception as e:
                        logger.error(f"Failed to store streaming chat response in cache: {e}")

                # Log API usage
                response_time_ms = int((time.time() - start_stream_time) * 1000)
                async_log_api_usage(
                    api_token_id=api_token.id,
                    workspace_id=api_token.workspace_id,
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

            if data.get("is_cached") and response_data:
                cache_service.store_response(payload, response_data, "chat")
                logger.info(f"Stored chat response in cache for model: {data['model']}")

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
    async_log_api_usage(
        api_token_id=api_token.id,
        workspace_id=api_token.workspace_id,
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
