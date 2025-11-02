import os
import logging
import hashlib
import time
import json
import threading
import re
from datetime import datetime
from flask import Blueprint, request, jsonify, Response, stream_with_context, current_app

import httpx

from .auth_utils import require_auth, require_auth_for_expose_api
from .redis_cache_service import get_cache_service
from .models import db, ApiToken, ApiUsageLog, Workspace, SystemPrompt
from .rag_service import rag_service
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# Async logging to prevent blocking
def async_log_api_usage(api_token_id, workspace_id, endpoint, method, payload, response_data, status_code,
                        response_time_ms, cached=False, cache_type=None, error_message=None, document_contexts=False):
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
                                   status_code, response_time_ms, cached, cache_type, error_message, req_meta, document_contexts)

    threading.Thread(target=_log_with_context, daemon=True).start()

def log_api_usage_background(api_token, workspace, endpoint, method, payload, response_data, status_code,
                           response_time_ms, cached=False, cache_type=None, error_message=None, request_meta=None, document_contexts=False):
    """Background version of log_api_usage that handles its own DB operations."""
    try:
        # Extract model information from payload
        # Handle both 'model' (string) and 'models' (array) fields
        requested_model = payload.get('model') or payload.get('models', 'unknown')
        
        # Convert array to string for logging requested models
        if isinstance(requested_model, list):
            requested_models_str = ', '.join(requested_model)
            logger.info(f"Requested models array: [{requested_models_str}]")
        else:
            requested_models_str = requested_model
        
        ip_address = request_meta.get("ip") if request_meta else None
        user_agent = request_meta.get("user_agent") if request_meta else None

        # Parse OpenRouter response for detailed information
        usage_data = {}
        actual_model_used = None  # Track which model was actually used
        
        if response_data and isinstance(response_data, dict):
            generation_id = response_data.get('id')
            
            # IMPORTANT: OpenRouter returns the actual model used in response
            # When 'models' array is provided, this tells us which one succeeded
            model_permaslug = response_data.get('model')
            actual_model_used = model_permaslug  # This is the model that actually processed the request
            
            if isinstance(requested_model, list):
                logger.info(f"OpenRouter selected model '{actual_model_used}' from array: [{requested_models_str}]")
            
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
            cache_type=cache_type,
            document_contexts=document_contexts
        )
        logger.info(f"Prepared log entry for API usage: {log_entry}")
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
        logger.info(f"Logged API usage (background) - Requested: {requested_models_str}, Used: {actual_model_used or 'N/A'}, Tokens: {usage_data.get('prompt_tokens', 0) + usage_data.get('completion_tokens', 0)}, Cached: {cached}")

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

# Profile patterns for intent detection
profile_patterns = {
    "teacher": {
        "keywords": [
            "explain", "teach", "understand", "concept", "learn",
            "tutorial", "guide", "education", "lesson", "clarify",
            "what is", "how does", "why does", "help me understand",
            "diagram", "visualize", "chart", "illustration", "sketch", 
            "draw this", "image explanation", "infographic"
        ],
        "patterns": [
            r"explain\s+(?:to me|how|why)",
            r"what\s+(?:is|are|does)",
            r"help\s+(?:me)?\s*understand",
            r"can\s+you\s+teach",
            r"(?:make|generate|draw)\s+(?:a\s+)?diagram"
        ]
    },
    "coder": {
        "keywords": [
            "code", "program", "function", "bug", "error",
            "debug", "implement", "algorithm", "api", "class",
            "module", "library", "framework", "syntax", "compile",
            "flowchart", "uml diagram", "architecture diagram", "visual code"
        ],
        "patterns": [
            r"(?:write|create|implement)\s+(?:a|the)?\s*(?:function|code|program)",
            r"(?:fix|debug)\s+(?:this)?\s*(?:code|error|bug)",
            r"(?:how\s+to|help\s+(?:me)?\s+with)\s+coding",
            r"(?:draw|make)\s+(?:a\s+)?(flowchart|uml|diagram)"
        ]
    },
    "summarizer": {
        "keywords": [
            "summarize", "summary", "brief", "overview", "tldr",
            "key points", "main ideas", "recap", "condense", "shorten",
            "infographic", "visual summary", "chart summary", "diagram overview"
        ],
        "patterns": [
            r"(?:can\s+you)?\s*summarize",
            r"give\s+(?:me)?\s*(?:a|the)?\s*summary",
            r"tldr",
            r"what\s+are\s+the\s+key\s+points",
            r"(?:visual|image)\s+summary"
        ]
    },
    "fact_checker": {
        "keywords": [
            "verify", "fact", "check", "accurate", "truth",
            "source", "evidence", "proof", "validate", "correct",
            "image authenticity", "is this picture real", "verify photo", 
            "deepfake check", "visual fact check"
        ],
        "patterns": [
            r"(?:is|are)\s+(?:this|these|that|those)\s+(?:fact|statement).?\s*(?:true|correct|accurate)",
            r"(?:can\s+you)?\s*verify",
            r"(?:what\s+are)?\s*the\s+facts",
            r"(?:verify|check)\s+(?:this)?\s*(?:image|photo|picture)"
        ]
    },
    "creative": {
        "keywords": [
            "create", "creative", "story", "imagine", "generate",
            "design", "innovative", "unique", "artistic", "write",
            "prompt", "image", "picture", "drawing", "illustration",
            "digital art", "painting", "fantasy scene", "sci-fi concept",
            "one line prompt", "five line prompt", "30 line prompt",
            "photorealistic", "render", "3d art", "pixel art"
        ],
        "patterns": [
            r"(?:write|create)\s+(?:a|an)?\s*(?:story|poem|creative|image prompt)",
            r"(?:help\s+me)?\s*(?:be|get)\s*creative",
            r"imagine\s+(?:if|what|how)",
            r"(?:generate|make|draw)\s+(?:an?\s+)?(?:image|art|picture|prompt)"
        ]
    }
}

# Helpers
def detect_intent_from_prompt(prompt: str) -> str:
    """
    Detect the intent/category from a prompt using pattern matching.
    
    Args:
        prompt: The user's prompt text
        
    Returns:
        Category string: "teacher", "coder", "creative", "summarizer", "fact_checker", or "general"
    """
    prompt_lower = prompt.lower()
    
    # Score each category
    category_scores = {category: 0 for category in profile_patterns.keys()}
    category_scores["general"] = 0
    
    for category, config in profile_patterns.items():
        # Check keywords
        for keyword in config["keywords"]:
            if keyword.lower() in prompt_lower:
                category_scores[category] += 1
        
        # Check regex patterns (higher weight)
        for pattern in config["patterns"]:
            if re.search(pattern, prompt_lower):
                category_scores[category] += 3
    
    # Get the category with highest score
    max_score = max(category_scores.values())
    if max_score > 0:
        detected_category = max(category_scores, key=category_scores.get)
        logger.info(f"Detected intent: {detected_category} (score: {max_score}) from prompt: '{prompt[:50]}...'")
        return detected_category
    else:
        logger.info(f"No specific intent detected, using 'general' for prompt: '{prompt[:50]}...'")
        return "general"


def resolve_nexus_model(model: str, workspace_id: int, prompt: str = None):
    """
    Resolve nexus/auto model routing to actual OpenRouter models.
    
    Args:
        model: The model string (e.g., "nexus/auto", "nexus/auto:teacher", "nexus/auto:intent")
        workspace_id: The workspace ID for fetching model_config
        prompt: The user's prompt (required for intent detection)
        
    Returns:
        Resolved model string or list of models, or original model if not a nexus model
    """
    if not model.startswith("nexus/auto"):
        return model
    
    try:
        # Case 1: nexus/auto → openrouter/auto
        if model == "nexus/auto":
            logger.info(f"Resolving nexus/auto → openrouter/auto")
            return "openrouter/auto"
        
        # Case 2: nexus/auto:teacher → get teacher models from workspace config
        if model.startswith("nexus/auto:"):
            category = model.split(":", 1)[1]  # Extract category after colon
            
            # Special case: intent detection
            if category == "intent":
                if not prompt:
                    logger.warning("Intent detection requested but no prompt provided, defaulting to 'general'")
                    category = "general"
                else:
                    category = detect_intent_from_prompt(prompt)
                    logger.info(f"Intent-based routing: detected category '{category}' for model selection")
            
            # Fetch workspace model_config from database
            workspace = Workspace.query.get(workspace_id)
            if not workspace:
                logger.error(f"Workspace {workspace_id} not found, falling back to openrouter/auto")
                return "openrouter/auto"
            
            # Parse model_config JSON
            model_config = workspace.model_config
            if not model_config:
                logger.warning(f"No model_config found for workspace {workspace_id}, falling back to openrouter/auto")
                return "openrouter/auto"
            
            # model_config is already a dict (stored as JSON in DB)
            if not isinstance(model_config, dict):
                try:
                    model_config = json.loads(model_config)
                except Exception as e:
                    logger.error(f"Failed to parse model_config for workspace {workspace_id}: {e}")
                    return "openrouter/auto"
            
            # Get models for the category
            category_models = model_config.get(category)
            if not category_models:
                logger.warning(f"Category '{category}' not found in model_config for workspace {workspace_id}, falling back to 'general'")
                category_models = model_config.get("general", ["openrouter/auto"])
            
            logger.info(f"Resolved {model} → category '{category}' with models: {category_models}")
            return category_models
        
        # Default fallback
        logger.warning(f"Unrecognized nexus model format: {model}, falling back to openrouter/auto")
        return "openrouter/auto"
        
    except Exception as e:
        logger.error(f"Error resolving nexus model '{model}': {e}, falling back to openrouter/auto")
        return "openrouter/auto"


def get_api_token_from_request():
    """Extract and validate API token from Authorization header."""
    api_token = {}
    if request.headers.get('internal') == "false" or request.headers.get('internal') is None:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None, "Missing or invalid Authorization header"

        token = auth_header[7:]  # Remove 'Bearer ' prefix
        if not token.startswith('nxs-'):
            return None, "Invalid token format"

        # Hash the token to find it in database
        token_hash = hashlib.sha256(token.encode()).hexdigest()
    else:
        token_hash = request.headers.get('Authorization')

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
    """Forward POST request to OpenRouter, injecting RAG context if document_contexts is True."""

    url = f"{OPENROUTER_BASE_URL}{endpoint}"
    # messages = payload.get("messages", [])
    original_prompt = payload.get("rag_question", "")
    # --- 1. Inject RAG context if document_contexts is True ---
    if payload.get("document_contexts") and payload.get("rag_contexts"):
        rag_context = payload["rag_contexts"]
        combined_rag = "\n".join([r.get("content", "") for r in rag_context])

        if endpoint == "/chat/completions":
            # Inject as system message
            # messages = payload.get("messages", [])
            system_msg = {
                "role": "system",
                "content": f"You are a helpful assistant. Use this context:\n{combined_rag}"
            }
            payload["messages"] = [system_msg] + original_prompt
        else:
            # For regular completions, prepend to prompt
            # original_prompt = payload.get("prompt", "")
            payload["prompt"] = f"{combined_rag}\n\n{original_prompt}"

    # --- 2. Forward request ---
    # check payload model is array 
    if isinstance(payload.get("model"), list):
        payload["models"] = payload.get("model")
    else:
        payload["model"] = payload.get("model")
    try:
        # logger.info(f"Forwarding request to OpenRouter endpoint: {endpoint} with model: {payload}")
        resp = httpx_client.post(url, headers=get_openrouter_headers(), json=payload)

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

        try:
            body = resp.json()
            if endpoint == "/chat/completions":
                payload["messages"] = payload.get("rag_question")
            else:
                payload["prompt"] = payload.get("rag_question")
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
            
        # Add Nexus auto models to the response
        nexus_models = [
            {
                "id": "nexus/auto",
                "name": "Nexus Auto",
                "canonical_slug": "nexus/auto",
                "description": "Automatically routes to the best model"
            },
            {
                "id": "nexus/auto:intent",
                "name": "Nexus Auto Intent",
                "canonical_slug": "nexus/auto:intent", 
                "description": "Intelligently routes based on detected intent"
            },
            {
                "id": "nexus/auto:teacher",
                "name": "Nexus Auto Teacher",
                "canonical_slug": "nexus/auto:teacher",
                "description": "Specialized for teaching and explanations"
            },
            {
                "id": "nexus/auto:coder",
                "name": "Nexus Auto Coder",
                "canonical_slug": "nexus/auto:coder",
                "description": "Optimized for coding and technical tasks"
            },
            {
                "id": "nexus/auto:summarizer",
                "name": "Nexus Auto Summarizer",
                "canonical_slug": "nexus/auto:summarizer",
                "description": "Specialized for summarization tasks"
            },
            {
                "id": "nexus/auto:creative",
                "name": "Nexus Auto Creative",
                "canonical_slug": "nexus/auto:creative",
                "description": "Optimized for creative tasks"
            },
            {
                "id": "nexus/auto:fact_checker",
                "name": "Nexus Auto Fact Checker",
                "canonical_slug": "nexus/auto:fact_checker",
                "description": "Specialized for fact checking and verification"
            },
            {
                "id": "nexus/auto:general",
                "name": "Nexus Auto General",
                "canonical_slug": "nexus/auto:general",
                "description": "General purpose model routing"
            }
        ]

        if endpoint == "/models" and "data" in body:
            # Add Nexus models to the beginning of the models list
            body["data"] = nexus_models + body["data"]

        return jsonify(body), resp.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def forward_to_openrouter_stream(endpoint: str, payload: dict):
    """Forward streaming requests and return a proper SSE response."""
    url = f"{OPENROUTER_BASE_URL}{endpoint}"
    headers = get_openrouter_headers()

    if isinstance(payload.get("model"), list):
        payload["models"] = payload.get("model")
    else:
        payload["model"] = payload.get("model")

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

def augment_with_rag_context(messages, workspace_id, use_rag=False, top_k=5, threshold=0.5, mode="system"):
    """
    Augment messages with RAG context if enabled
    
    Args:
        messages: List of message objects for chat
        workspace_id: Workspace ID for filtering documents
        use_rag: Whether to use RAG
        top_k: Number of contexts to retrieve
        threshold: Similarity threshold
        mode: "system" (for chat - adds as system prompt) or "assistant" (for completions - adds as assistant message)
    
    Returns: (augmented_messages, rag_contexts_used, original_messages)
    """
    if not use_rag or not messages:
        return messages, [], messages
    
    # Build a comprehensive query from conversation history
    # Include last few user messages for context
    conversation_parts = []
    user_message_count = 0
    max_context_messages = 3  # Include last 3 user messages for context
    
    # Iterate through messages in reverse to get recent context
    # Add System message also
    # system_context = next((m.get("content") for m in reversed(messages) if m.get("role") == "system"), "")

    for msg in reversed(messages):
        if msg.get('role') == 'user':
            conversation_parts.insert(0, msg.get('content', ''))
            user_message_count += 1
            if user_message_count >= max_context_messages:
                break
        elif msg.get('role') == 'assistant' and user_message_count > 0:
            # Include assistant responses for better context understanding
            conversation_parts.insert(0, f"Previous answer: {msg.get('content', '')[:200]}...")
    # if system_context:
    #     conversation_parts.insert(0, f"System: {system_context[:300]}...")

    # Build the RAG query with conversation context
    if len(conversation_parts) > 1:
        # Multiple messages - combine with context markers
        rag_query = "\n".join(conversation_parts)
        logger.info(f"RAG query built from {len(conversation_parts)} conversation turns")
    else:
        # Single message - use as is
        rag_query = conversation_parts[0] if conversation_parts else ""
        logger.info(f"RAG query built from single message")
    
    if not rag_query:
        return messages, [], messages
    
    logger.info(f"RAG augmentation enabled (mode={mode}). Query with context: {rag_query[:200]}...")
    
    # Retrieve relevant contexts from RAG
    try:
        contexts = rag_service.retrieve_context(
            query=rag_query,
            workspace_id=workspace_id,
            top_k=top_k,
            similarity_threshold=threshold
        )
        
        if not contexts:
            logger.info("No RAG contexts found for query")
            return messages, [], messages
        
        # Build context string
        logger.info(f"Found {len(contexts)} RAG contexts")
        context_text = "Context from your documents:\n\n"
        for idx, ctx in enumerate(contexts, 1):
            context_text += f"[Source {idx}: {ctx['filename']}]\n{ctx['text']}\n\n"
        
        # Store original messages for caching
        original_messages = messages.copy()
        
        # Create augmented messages based on mode
        augmented_messages = messages.copy()
        
        if mode == "system":
            # For chat completions - add as system message at the beginning
            system_message = {
                "role": "system",
                "content": context_text
            }
            # Check if there's already a system message
            has_system = any(msg.get('role') == 'system' for msg in augmented_messages)
            if has_system:
                # Prepend to existing system message
                for msg in augmented_messages:
                    if msg.get('role') == 'system':
                        msg['content'] = context_text + "\n\n" + msg['content']
                        break
            else:
                # Add new system message at the beginning
                augmented_messages.insert(0, system_message)
        else:
            # For completions - add as assistant message before the last user message
            assistant_message = {
                "role": "assistant",
                "content": context_text
            }
            # Find the last user message index and insert before it
            for i in range(len(augmented_messages) - 1, -1, -1):
                if augmented_messages[i].get('role') == 'user':
                    augmented_messages.insert(i, assistant_message)
                    break
        
        logger.info(f"Augmented messages with {len(contexts)} RAG contexts (mode={mode})")
        return augmented_messages, contexts, original_messages
        
    except Exception as e:
        logger.error(f"Failed to augment with RAG context: {e}")
        return messages, [], messages


def augment_prompt_with_rag_context(prompt, workspace_id, use_rag=False, top_k=5, threshold=0.5):
    """
    Augment a prompt string with RAG context (for completions endpoint)
    
    Returns: (augmented_prompt, rag_contexts_used, original_prompt)
    """
    if not use_rag or not prompt:
        return prompt, [], prompt
    
    # Retrieve relevant contexts from RAG
    try:
        contexts = rag_service.retrieve_context(
            query=prompt,
            workspace_id=workspace_id,
            top_k=top_k,
            similarity_threshold=threshold
        )
        
        if not contexts:
            logger.info("No RAG contexts found for prompt")
            return prompt, [], prompt
        
        # Build context string
        logger.info(f"Found {len(contexts)} RAG contexts for prompt")
        context_text = "Context from your documents:\n\n"
        for idx, ctx in enumerate(contexts, 1):
            context_text += f"[Source {idx}: {ctx['filename']}]\n{ctx['text']}\n\n"
        
        # Augment prompt with context
        augmented_prompt = f"{context_text}\nPrompt:\n{prompt}"
        
        logger.info(f"Augmented prompt with {len(contexts)} RAG contexts")
        return augmented_prompt, contexts, prompt
        
    except Exception as e:
        logger.error(f"Failed to augment prompt with RAG context: {e}")
        return prompt, [], prompt


def get_active_system_prompt(workspace_id):
    """
    Retrieve the active system prompt for a workspace.
    
    Args:
        workspace_id: The workspace ID to query
    
    Returns:
        The active system prompt text, or None if no active prompt exists
    """
    try:
        active_prompt = SystemPrompt.query.filter_by(
            workspace_id=workspace_id,
            is_active=True
        ).first()
        
        if active_prompt:
            logger.info(f"Found active system prompt '{active_prompt.title}' for workspace {workspace_id}")
            return active_prompt.prompt
        else:
            logger.info(f"No active system prompt found for workspace {workspace_id}")
            return None
    except Exception as e:
        logger.error(f"Error retrieving active system prompt: {e}")
        return None


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

    # Resolve nexus/auto model routing
    resolved_model = resolve_nexus_model(
        model=data["model"],
        workspace_id=api_token.workspace_id,
        prompt=data.get("prompt", "")
    )
    logger.info(f"Resolved model: {data['model']} → {resolved_model}")
    
    # Construct payload with all supported (and optionally passed) parameters
    payload = {
        "model": resolved_model,
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

    # RAG Integration - augment prompt with retrieved context
    rag_contexts = []
    original_payload = payload.copy()  # Store original for caching
    document_contexts = False
    
    # Get active system prompt and prepend to the prompt if exists
    active_system_prompt = get_active_system_prompt(str(api_token.workspace_id))
    if active_system_prompt:
        # Prepend system prompt to user prompt
        original_user_prompt = payload["prompt"]
        payload["prompt"] = f"{active_system_prompt}\n\n{original_user_prompt}"
        logger.info(f"Prepended active system prompt to completion request")
    

    # Check cache if caching is enabled (use original payload, not augmented)
    cached_response = None
    cache_type = None

    if data.get("is_cached"):
        cache_service = get_cache_service(data.get("cache_threshold", 0.70))
        # Pass the semantic cache threshold and workspace_id from the API token
        cached_response, cache_type = cache_service.get_cached_response(
            original_payload, "completion", 
            workspace_id=str(api_token.workspace_id),
            threshold=api_token.semantic_cache_threshold
        )

    response_time_ms = int((time.time() - start_time) * 1000)

    if cached_response:
        logger.info(f"Cache HIT ({cache_type}) for completion model: {original_payload['model']}")

        # Log cache hit
        async_log_api_usage(
            api_token_id=api_token.id,
            workspace_id=api_token.workspace_id,
            endpoint="/v1/create",
            method="POST",
            payload=original_payload,
            response_data=cached_response,
            status_code=200,
            response_time_ms=response_time_ms,
            cached=True,
            cache_type=cache_type,
            document_contexts=document_contexts
        )

        return jsonify(cached_response), 200
    else:
        if data.get("use_rag", False):
        # Get workspace_id from API token
            workspace_id = str(api_token.workspace_id)
            rag_top_k = data.get("rag_top_k", 3)
            rag_threshold = data.get("rag_threshold", 0.50)
            
            # Get the current prompt (which may already have system prompt prepended)
            current_prompt = payload["prompt"]
            
            augmented_prompt, rag_contexts, original_prompt = augment_prompt_with_rag_context(
                prompt=current_prompt,
                workspace_id=workspace_id,
                use_rag=True,
                top_k=rag_top_k,
                threshold=rag_threshold
            )
            
            if rag_contexts:
                # Update payload with augmented prompt for OpenRouter
                payload["prompt"] = augmented_prompt
                # Keep original prompt for caching (without RAG context but with system prompt)
                # Note: original_payload already has the system prompt if it was added
                document_contexts = True
                logger.info(f"Augmented prompt with {len(rag_contexts)} RAG contexts")

    # Cache miss - forward to OpenRouter
    if payload.get("stream"):
        # Get the model info for logging (handle both 'model' and 'models' fields)
        requested_model = payload.get('model') or payload.get('models', 'unknown')
        requested_model_str = ', '.join(requested_model) if isinstance(requested_model, list) else requested_model
        
        logger.info(f"Cache MISS for completion - Requested: {requested_model_str} with streaming - forwarding to OpenRouter")
        start_stream_time = time.time()

        def stream_and_cache():
            combined_response = {
                "id": None,
                "model": None,  # Will be populated from response
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

                            # Update combined response metadata
                            if "id" in chunk_data and not combined_response["id"]:
                                combined_response["id"] = chunk_data["id"]
                            
                            # Capture the actual model used by OpenRouter
                            if "model" in chunk_data and not combined_response["model"]:
                                combined_response["model"] = chunk_data["model"]
                                if isinstance(requested_model, list):
                                    logger.info(f"OpenRouter selected '{chunk_data['model']}' from models array")

                            if "choices" in chunk_data and chunk_data["choices"]:
                                text = chunk_data["choices"][0].get("text", "")
                                combined_text += text

                            # Update usage if present
                            if "usage" in chunk_data:
                                for key in ["prompt_tokens", "completion_tokens", "total_tokens"]:
                                    if key in chunk_data["usage"]:
                                        combined_response["usage"][key] = chunk_data["usage"][key]

                            combined_response["model"] = chunk_data['model']
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

                # Store in cache if enabled (use original payload, not augmented)
                if data.get("is_cached") and combined_response:
                    try:
                        cache_service = get_cache_service(data.get("cache_threshold", 0.70))
                        cache_service.store_response(
                            original_payload, combined_response, "completion",
                            workspace_id=str(api_token.workspace_id)
                        )
                        logger.info(f"Stored combined streaming response in cache for model: {original_payload['model']}")
                    except Exception as e:
                        logger.error(f"Failed to store streaming response in cache: {e}")

                # Context-aware caching for streaming responses
                # try:
                #     use_context_cache = data.get("use_context_cache", True)
                #     if use_context_cache:
                #         context_cache = get_context_aware_cache()
                        
                #         # Extract question and answer
                #         prompt_content = original_payload.get("prompt", "")
                #         assistant_answer = combined_text
                        
                #         if prompt_content and assistant_answer:
                #             cache_result = context_cache.cache_response(
                #                 question=prompt_content,
                #                 answer=assistant_answer,
                #                 workspace_id=str(api_token.workspace_id)
                #             )
                #             logger.info(f"Context cache result for streaming: {cache_result}")
                # except Exception as ctx_err:
                #     logger.error(f"Context-aware caching failed for streaming (non-critical): {ctx_err}")

                # Log API usage
                response_time_ms = int((time.time() - start_stream_time) * 1000)
                async_log_api_usage(
                    api_token_id=api_token.id,
                    workspace_id=api_token.workspace_id,
                    endpoint="/v1/create",
                    method="POST",
                    payload=original_payload,
                    response_data=combined_response,
                    status_code=200,
                    response_time_ms=response_time_ms,
                    cached=False,
                    cache_type=None,
                    document_contexts=document_contexts
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
        # Get the model info for logging (handle both 'model' and 'models' fields)
        requested_model = payload.get('model') or payload.get('models', 'unknown')
        requested_model_str = ', '.join(requested_model) if isinstance(requested_model, list) else requested_model
        
        logger.info(f"Cache MISS for completion - Requested: {requested_model_str} - forwarding to OpenRouter")
        response, status_code = forward_to_openrouter("/completions", payload)

    response_time_ms = int((time.time() - start_time) * 1000)
    response_data = None
    error_message = None

    # Store successful responses in cache and extract data for logging
    if status_code == 200:
        try:
            response_data = response.get_json() if hasattr(response, 'get_json') else response.json

            if data.get("is_cached") and response_data:
                cache_service.store_response(
                    original_payload, response_data, "completion",
                    workspace_id=str(api_token.workspace_id)
                )
                logger.info(f"Stored completion response in cache for model: {original_payload['model']}")

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
        payload=original_payload,
        response_data=response_data,
        status_code=status_code,
        response_time_ms=response_time_ms,
        cached=False,
        error_message=error_message,
        document_contexts=document_contexts
    )

    return response, status_code


# Initialize embedding model for follow-up detection
embedding_model = None
try:
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    logger.info("Loaded embedding model for follow-up detection")
except Exception as e:
    logger.warning(f"Failed to load embedding model for follow-up detection: {e}")


def is_follow_up_question(current_question: str, conversation_history: list) -> bool:
    """
    Detect if the current question is a follow-up based on conversation history.
    Uses semantic similarity and linguistic patterns.
    
    Args:
        current_question: The current user message
        conversation_history: List of previous messages [{"role": "user/assistant", "content": "..."}]
    
    Returns:
        True if it's likely a follow-up question, False otherwise
    """
    if not current_question or not conversation_history:
        return False
    
    # Pattern-based detection for obvious follow-ups
    follow_up_patterns = [
        r'^(and|but|also|what about|how about|tell me (more )?about)\s',
        r'\b(it|that|this|them|they|those|these|its|his|her|their)\b',
        r'^(why|how|when|where|who|what)\s+(is|are|was|were|does|did)\s+(it|that|this|they|them)',
        r'\b(more|else|another|other|similar)\b(?!\w)',  # Word boundary to prevent false matches
        r'^(yes|no|ok|okay|sure|right|exactly)',
    ]
    
    current_lower = current_question.lower().strip()
    for pattern in follow_up_patterns:
        if re.search(pattern, current_lower):
            logger.info(f"Follow-up detected via pattern: '{pattern}'")
            return True
    
    # Short questions are often follow-ups
    word_count = len(current_question.split())
    if word_count < 5 and len(conversation_history) > 0:
        logger.info(f"Follow-up detected: short question ({word_count} words) with conversation history")
        return True
    
    # Semantic similarity check using embeddings
    if embedding_model and len(conversation_history) >= 2:
        try:
            # Get the last user question from history
            last_user_question = None
            for msg in reversed(conversation_history):
                if msg.get('role') == 'user':
                    last_user_question = msg.get('content', '')
                    break
            
            if last_user_question:
                # Generate embeddings
                current_embedding = embedding_model.encode(current_question)
                previous_embedding = embedding_model.encode(last_user_question)
                
                # Calculate cosine similarity
                similarity = cosine_similarity(
                    current_embedding.reshape(1, -1),
                    previous_embedding.reshape(1, -1)
                )[0][0]
                
                # High similarity suggests related topics (follow-up)
                if similarity > 0.85:
                    logger.info(f"Follow-up detected via semantic similarity: {similarity:.2f}")
                    return True
        except Exception as e:
            logger.error(f"Error in semantic follow-up detection: {e}")
    
    return False


def generate_related_questions(user_message: str, assistant_response: str, conversation_context: str = "") -> list:
    """
    Generate 3 related follow-up questions based on the conversation.
    Questions are generated as standalone, complete questions without pronouns or follow-up indicators.
    
    Args:
        user_message: The user's question
        assistant_response: The assistant's response
        conversation_context: Optional context from previous messages
    
    Returns:
        List of 3 standalone question strings
    """
        # Pattern-based detection for obvious follow-ups
    follow_up_patterns = [
        r'^(and|but|also|what about|how about|tell me (more )?about)\s',
        r'\b(it|that|this|them|they|those|these|its|his|her|their)\b',
        r'^(why|how|when|where|who|what)\s+(is|are|was|were|does|did)\s+(it|that|this|they|them)',
        r'\b(more|else|another|other|similar)\b(?!\w)',  # Word boundary to prevent false matches
        r'^(yes|no|ok|okay|sure|right|exactly)',
    ]

    def is_followup_like_question(q: str) -> bool:
        """Check if the question matches any follow-up or pronoun pattern."""
        q_lower = q.lower().strip()
        for pat in follow_up_patterns:
            if re.search(pat, q_lower):
                return True
        return False
    try:
        # Prepare a concise prompt for generating follow-up questions
        prompt = f"""Based on this conversation, generate exactly 3 relevant follow-up questions that expand on the topic.

IMPORTANT RULES:
1. Each question must be a complete, standalone question
- NOT use pronouns (it, that, this, they, etc.)
- NOT start with continuation words (and, but, also, what about, how about, etc.)
4. DO NOT use vague references - be specific and explicit
5. Each question should be self-contained and make sense on its own

User asked: {user_message}

Assistant replied: {assistant_response[:500]}...

Generate 3 specific, standalone questions (one per line, no numbering or bullets):"""
        
        # Use a fast, efficient model for question generation
        question_gen_payload = {
            "model": "google/gemini-2.5-flash-lite",
            "messages": [
                {"role": "system", "content": "You are a helpful assistant that generates standalone, specific questions. Never use pronouns or vague references. Always be explicit and complete. Respond with exactly 3 questions, one per line, without numbering or formatting."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 150,
            "temperature": 0.7
        }
        
        # Call OpenRouter to generate questions
        url = f"{OPENROUTER_BASE_URL}/chat/completions"
        resp = httpx_client.post(url, headers=get_openrouter_headers(), json=question_gen_payload, timeout=10.0)
        
        if resp.status_code == 200:
            response_data = resp.json()
            generated_text = response_data.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # Parse the questions
            questions = []
            for line in generated_text.strip().split('\n'):
                line = line.strip()
                # Remove numbering, bullets, and formatting
                line = re.sub(r'^[\d\.\-\*\•]\s*', '', line)
                if line and len(line) > 10:  # Valid question
                    # Ensure it ends with a question mark
                    if not line.endswith('?'):
                        line += '?'

                    # Filter: skip any that look like follow-ups
                    if is_followup_like_question(line):
                        logger.warning(f"Skipped follow-up style question: {line}")
                        continue
                    
                    # Validate: Check if it's truly standalone (no pronouns at start)
                    # Convert to lowercase for checking
                    line_lower = line.lower()
                    
                    # Skip questions that start with follow-up indicators
                    follow_up_starts = ['and ', 'but ', 'also ', 'what about ', 'how about ', 'tell me more']
                    if any(line_lower.startswith(indicator) for indicator in follow_up_starts):
                        logger.warning(f"Skipping follow-up style question: {line}")
                        continue
                    
                    # Skip questions with pronouns in first few words (likely context-dependent)
                    first_words = ' '.join(line_lower.split()[:5])
                    pronouns = ['it ', 'that ', 'this ', 'them ', 'they ', 'those ', 'these ']
                    has_pronoun = any(pronoun in first_words for pronoun in pronouns)
                    if has_pronoun:
                        logger.warning(f"Skipping question with pronoun: {line}")
                        continue
                    
                    questions.append(line)
            
            # Return exactly 3 questions
            if len(questions) >= 3:
                return questions[:3]
            elif len(questions) > 0:
                # Pad with generic standalone questions if needed
                while len(questions) < 3:
                    generic = [
                        "What are the key concepts to understand about this topic?",
                        "How can this be applied in practice?",
                        "What are common misconceptions about this subject?"
                    ]
                    for q in generic:
                        if q not in questions:
                            questions.append(q)
                            if len(questions) >= 3:
                                break
                return questions[:3]
        
        logger.warning(f"Failed to generate related questions: status {resp.status_code}")
    except Exception as e:
        logger.error(f"Error generating related questions: {e}")
    
    # Fallback generic standalone questions (no pronouns or follow-up words)
    return [
        "What are the main benefits of this approach?",
        "How does this concept work in real-world applications?",
        "What are some common challenges related to this topic?"
    ]


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

    # Extract last user message for intent detection (if needed)
    last_user_message = ""
    for msg in reversed(data.get("messages", [])):
        if msg.get("role") == "user":
            last_user_message = msg.get("content", "")
            break

    # Resolve nexus/auto model routing
    resolved_model = resolve_nexus_model(
        model=data["model"],
        workspace_id=api_token.workspace_id,
        prompt=last_user_message
    )
    
    logger.info(f"Resolved model: {data['model']} → {resolved_model}")

    payload = {
        "model" : resolved_model,
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

    # RAG Integration - augment messages with retrieved context
    rag_contexts = []
    original_payload = payload.copy()  # Store original for caching
    document_contexts = False
    
    # Get active system prompt and inject as system message if exists
    active_system_prompt = get_active_system_prompt(str(api_token.workspace_id))
    disable_system_prompt = data.get("disable_system_prompt", False)
    if active_system_prompt and not disable_system_prompt:
        # Check if there's already a system message
        has_system_message = any(msg.get('role') == 'system' for msg in payload['messages'])
        
        if has_system_message:
            # Prepend to existing system message
            for msg in payload['messages']:
                if msg.get('role') == 'system':
                    msg['content'] = f"{active_system_prompt}\n\n{msg['content']}"
                    logger.info(f"Prepended active system prompt to existing system message")
                    break
        else:
            # Add new system message at the beginning
            system_message = {
                "role": "system",
                "content": active_system_prompt
            }
            payload['messages'].insert(0, system_message)
            logger.info(f"Added active system prompt as new system message")
    
    # Create simplified cache payload (last user message + system message)
    # This ensures cache lookup and storage use the same key format
    cache_payload = None
    skip_cache = False
    last_user_content = ""
    is_follow_up = False
    
    if data.get("is_cached"):
        # Extract last user message content
        for msg in reversed(payload.get("messages", [])):
            if msg.get("role") == "user":
                last_user_content = msg.get("content", "")
                break
        
        # Check if this is a follow-up question
        # Extract conversation history (all messages except the last user message)
        conversation_history = []
        for i, msg in enumerate(payload.get("messages", [])):
            if i < len(payload.get("messages", [])) - 1:  # Exclude last message
                conversation_history.append(msg)
        
        is_follow_up = is_follow_up_question(last_user_content, conversation_history)
        
        if is_follow_up:
            skip_cache = True
            logger.info(f"Skipping cache for follow-up question: '{last_user_content[:50]}...'")
        else:
            # Check word count - skip cache if less than 3 words
            word_count = len(last_user_content.split())
            if word_count < 3:
                skip_cache = True
                logger.info(f"Skipping cache for short question (word count: {word_count}): '{last_user_content}'")
            else:
                # Extract system message content if exists
                system_content = ""
                for msg in payload.get("messages", []):
                    if msg.get("role") == "system":
                        system_content = msg.get("content", "")
                        break
                
                # Create simplified payload with only last user message and system message
                cache_payload = {
                    "messages": []
                }
                
                # Copy model or models field from payload
                if "models" in payload:
                    cache_payload["models"] = payload["models"]
                elif "model" in payload:
                    cache_payload["model"] = payload["model"]
                
                # Copy request parameters for cache key generation
                for param in ["temperature", "max_tokens", "top_p", "frequency_penalty", "presence_penalty"]:
                    if param in payload:
                        cache_payload[param] = payload[param]
                
                # Add system message if exists
                if system_content:
                    cache_payload["messages"].append({
                        "role": "system",
                        "content": system_content
                    })
                
                # Add last user message
                cache_payload["messages"].append({
                    "role": "user",
                    "content": last_user_content
                })
                
                logger.info(f"Created cache payload with last user message ({word_count} words) + system message for cache lookup")

    # Check cache if caching is enabled and not skipped (use simplified cache payload)
    cached_response = None
    cache_type = None

    if data.get("is_cached") and not skip_cache and cache_payload:
        cache_service = get_cache_service(data.get("cache_threshold", 0.70))
        # Pass the semantic cache threshold and workspace_id from the API token
        # This checks exact match first, then semantic match with workspace isolation
        cached_response, cache_type = cache_service.get_cached_response(
            cache_payload, "chat", 
            workspace_id=str(api_token.workspace_id),
            threshold=api_token.semantic_cache_threshold
        )
        
        if cached_response:
            logger.info(f"Cache HIT ({cache_type}) for workspace {api_token.workspace_id}, question: '{last_user_content[:50]}...'")
        else:
            logger.info(f"Cache MISS for workspace {api_token.workspace_id}, proceeding to LLM call for: '{last_user_content[:50]}...'")  

    response_time_ms = int((time.time() - start_time) * 1000)

    if cached_response:
        logger.info(f"Returning cached response ({cache_type} match) for chat model: {payload['model']}, workspace: {api_token.workspace_id}")

        # Generate related questions for cached response
        try:
            assistant_content = cached_response.get('choices', [{}])[0].get('message', {}).get('content', '')
            related_questions = generate_related_questions(
                user_message=last_user_content,
                assistant_response=assistant_content
            )
            # Add related questions to response
            cached_response['related_questions'] = related_questions
            logger.info(f"Added {len(related_questions)} related questions to cached response")
        except Exception as e:
            logger.error(f"Failed to generate related questions for cached response: {e}")
            cached_response['related_questions'] = []

        # Log cache hit
        async_log_api_usage(
            api_token_id=api_token.id,
            workspace_id=api_token.workspace_id,
            endpoint="/v1/chat/create",
            method="POST",
            payload=cache_payload if cache_payload else original_payload,
            response_data=cached_response,
            status_code=200,
            response_time_ms=response_time_ms,
            cached=True,
            cache_type=cache_type,
            document_contexts=document_contexts
        )

        return jsonify(cached_response), 200
    else:
        if data.get("use_rag", False):
            # Get workspace_id from API token
            workspace_id = str(api_token.workspace_id)
            rag_top_k = data.get("rag_top_k", 3)
            rag_threshold = data.get("rag_threshold", 0.50)
            
            # Get the current messages (which may already have system prompt added)
            current_messages = payload["messages"]
            
            augmented_messages, rag_contexts, original_messages = augment_with_rag_context(
                messages=current_messages,
                workspace_id=workspace_id,
                use_rag=True,
                top_k=rag_top_k,
                threshold=rag_threshold,
                mode="system"  # Use system prompt for chat completions
            )
            
            if rag_contexts:
                # Update payload with augmented messages for OpenRouter
                payload["messages"] = augmented_messages
                # Keep original messages for caching (without RAG context but with system prompt)
                # Note: original_payload already has the system prompt if it was added
                document_contexts = True
                logger.info(f"Augmented chat with {len(rag_contexts)} RAG contexts as system prompt")

    # Check workspace balance before processing (skip for cached responses)
    has_balance, current_balance, balance_error = check_workspace_balance(api_token.workspace_id, 0.0001)
    if not has_balance:
        return jsonify({"error": balance_error}), 402  # 402 Payment Required


    # Cache miss - forward to OpenRouter
    if payload.get("stream"):
        logger.info(f"Cache MISS for chat model: {payload['model']} with streaming - forwarding to OpenRouter")
        start_stream_time = time.time()

        def stream_and_cache():
            combined_response = {
                "id": None,
                "model": payload["model"] ,
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
                combined_response["model"] = last_chunk_data['model']

                # Generate related questions for streaming response
                try:
                    related_questions = generate_related_questions(
                        user_message=last_user_content,
                        assistant_response=combined_content
                    )
                    combined_response['related_questions'] = related_questions
                    logger.info(f"Added {len(related_questions)} related questions to streaming response")
                except Exception as e:
                    logger.error(f"Failed to generate related questions for streaming response: {e}")
                    combined_response['related_questions'] = []

                # Store in cache if enabled (reuse the cache_payload from earlier)
                # This ensures cache lookup and storage use the same key format
                if data.get("is_cached") and not skip_cache and cache_payload and combined_response["choices"]:
                    try:
                        cache_service = get_cache_service(data.get("cache_threshold", 0.70))
                        cache_service.store_response(
                            cache_payload, combined_response, "chat",
                            workspace_id=str(api_token.workspace_id)
                        )
                        logger.info(f"Stored combined streaming chat response in cache for workspace {api_token.workspace_id}, model: {payload['model']} (last user message + system message only)")
                    except Exception as e:
                        logger.error(f"Failed to store streaming chat response in cache: {e}")

                # Context-aware caching for streaming chat responses
                # try:
                #     use_context_cache = data.get("use_context_cache", True)
                #     if use_context_cache:
                #         context_cache = get_context_aware_cache()
                        
                #         # Extract question and answer
                #         last_user_question = ""
                #         for msg in reversed(payload.get("messages", [])):
                #             if msg.get('role') == 'user':
                #                 last_user_question = msg.get('content', '')
                #                 break
                        
                #         assistant_answer = combined_content
                        
                #         if last_user_question and assistant_answer:
                #             cache_result = context_cache.cache_response(
                #                 question=last_user_question,
                #                 answer=assistant_answer,
                #                 workspace_id=str(api_token.workspace_id),
                #                 conversation_history=payload.get("messages", [])
                #             )
                #             logger.info(f"Context cache result for streaming chat: {cache_result}")
                # except Exception as ctx_err:
                #     logger.error(f"Context-aware caching failed for streaming chat (non-critical): {ctx_err}")

                # Log API usage
                response_time_ms = int((time.time() - start_stream_time) * 1000)
                async_log_api_usage(
                    api_token_id=api_token.id,
                    workspace_id=api_token.workspace_id,
                    endpoint="/v1/chat/create",
                    method="POST",
                    payload=original_payload,
                    response_data=combined_response,
                    status_code=200,
                    response_time_ms=response_time_ms,
                    cached=False,
                    cache_type=None,
                    document_contexts=document_contexts
                )
                
                # Send related questions as a final SSE event
                if 'related_questions' in combined_response:
                    related_questions_event = {
                        "related_questions": combined_response['related_questions']
                    }
                    yield f"data: {json.dumps(related_questions_event)}\n\n"

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
        logger.info(f"Cache MISS for chat model: {payload['model']}, making non-streaming LLM call for workspace {api_token.workspace_id}")
        response, status_code = forward_to_openrouter("/chat/completions", payload)
        
    response_time_ms = int((time.time() - start_time) * 1000)
    response_data = None
    error_message = None

    # Store successful responses in cache and extract data for logging
    if status_code == 200:
        try:
            response_data = response.get_json() if hasattr(response, 'get_json') else response.json
            
            # Generate related questions for non-streaming response
            try:
                assistant_content = response_data.get('choices', [{}])[0].get('message', {}).get('content', '')
                related_questions = generate_related_questions(
                    user_message=last_user_content,
                    assistant_response=assistant_content
                )
                # Add related questions to response
                response_data['related_questions'] = related_questions
                logger.info(f"Added {len(related_questions)} related questions to non-streaming response")
            except Exception as e:
                logger.error(f"Failed to generate related questions: {e}")
                response_data['related_questions'] = []
            
            # Context-aware caching (runs in parallel with traditional cache)
            # try:
            #     use_context_cache = data.get("use_context_cache", True)  # Enabled by default
            #     if use_context_cache:
            #         context_cache = get_context_aware_cache()
                    
            #         # Extract question and answer
            #         last_user_question = ""
            #         for msg in reversed(payload.get("messages", [])):
            #             if msg.get('role') == 'user':
            #                 last_user_question = msg.get('content', '')
            #                 break
                    
            #         assistant_answer = ""
            #         if response_data and 'choices' in response_data and response_data['choices']:
            #             assistant_answer = response_data['choices'][0].get('message', {}).get('content', '')
                    
            #         if last_user_question and assistant_answer:
            #             cache_result = context_cache.cache_response(
            #                 question=last_user_question,
            #                 answer=assistant_answer,
            #                 workspace_id=str(api_token.workspace_id),
            #                 conversation_history=payload.get("messages", [])
            #             )
            #             logger.info(f"Context cache result: {cache_result}")
            # except Exception as ctx_err:
            #     logger.error(f"Context-aware caching failed (non-critical): {ctx_err}")
            
            # Store in cache if enabled (reuse the cache_payload from earlier)
            # This ensures cache lookup and storage use the same key format
            if data.get("is_cached") and not skip_cache and cache_payload and response_data:
                logger.info(f"Caching chat response for workspace {api_token.workspace_id}, model: {payload['model']} (last user message + system message only)")
                cache_service.store_response(
                    cache_payload, response_data, "chat",
                    workspace_id=str(api_token.workspace_id)
                )
                logger.info(f"Stored chat response in cache for workspace {api_token.workspace_id}, model: {payload['model']}")

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
        payload=original_payload,
        response_data=response_data,
        status_code=status_code,
        response_time_ms=response_time_ms,
        cached=False,
        error_message=error_message,
        document_contexts=document_contexts
    )

    return response, status_code


# @api_llm_routes.route("/v1/cache/stats", methods=["GET"])
# @require_auth
# def get_cache_stats():
#     """Get Redis cache statistics and status."""
#     cache_service = get_cache_service()
#     stats = cache_service.get_cache_stats()
#     return jsonify(stats), 200


# @api_llm_routes.route("/v1/cache/clear", methods=["POST"])
# @require_auth
# def clear_cache():
#     """Clear all cached LLM responses."""
#     cache_service = get_cache_service()
#     cleared_count = cache_service.clear_cache()
#     return jsonify({
#         "message": f"Cleared {cleared_count} cache entries",
#         "cleared_count": cleared_count
#     }), 200


# @api_llm_routes.route("/v1/cache/context/stats", methods=["GET"])
# @require_auth
# def get_context_cache_stats():
#     """Get context-aware cache statistics."""
#     try:
#         # Get workspace_id from request user
#         workspace_id = request.user.get('workspace_id')
        
#         context_cache = get_context_aware_cache()
#         stats = context_cache.get_stats(workspace_id=str(workspace_id) if workspace_id else None)
        
#         return jsonify(stats), 200
#     except Exception as e:
#         logger.error(f"Failed to get context cache stats: {e}")
#         return jsonify({"error": str(e)}), 500


# @api_llm_routes.route("/v1/cache/context/history/<context_id>", methods=["GET"])
# @require_auth
# def get_context_history(context_id: str):
#     """Get conversation history for a specific context."""
#     try:
#         workspace_id = request.user.get('workspace_id')
#         if not workspace_id:
#             return jsonify({"error": "Workspace ID required"}), 401
        
#         context_cache = get_context_aware_cache()
#         context = context_cache.get_context_history(context_id, str(workspace_id))
        
#         if not context:
#             return jsonify({"error": "Context not found"}), 404
        
#         return jsonify({
#             "context_id": context.context_id,
#             "workspace_id": context.workspace_id,
#             "topic_summary": context.topic_summary,
#             "qa_pairs": context.qa_pairs,
#             "created_at": context.created_at,
#             "updated_at": context.updated_at,
#             "total_turns": len(context.qa_pairs)
#         }), 200
        
#     except Exception as e:
#         logger.error(f"Failed to get context history: {e}")
#         return jsonify({"error": str(e)}), 500
