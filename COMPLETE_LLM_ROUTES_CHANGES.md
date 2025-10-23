# Complete LLM Routes Changes Summary

## What Needs to Be Done

Due to file complexity, I need to apply the following changes to `server/llm_routes.py`:

### 1. Update Logging Functions (Lines ~44-58)

**In `log_api_usage_background` function:**

Change FROM:
```python
def log_api_usage_background(...):
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
```

Change TO:
```python
def log_api_usage_background(...):
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
```

AND at the end of the function, change the final log from:
```python
logger.info(f"Logged API usage (background) - Model: {model}, Tokens: ...")
```

TO:
```python
logger.info(f"Logged API usage (background) - Requested: {requested_models_str}, Used: {actual_model_used or 'N/A'}, Tokens: ...")
```

---

### 2. Add Profile Patterns (After line ~172 - after httpx_client)

Add this complete section:
```python
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
```

---

### 3. Update `/v1/create` Endpoint (Around line ~723-750)

Change the payload construction from:
```python
    payload = {
        "model": data["model"],
        "prompt": data["prompt"],
    }
```

TO:
```python
    # Resolve nexus/auto model routing
    resolved_model = resolve_nexus_model(
        model=data["model"],
        workspace_id=api_token.workspace_id,
        prompt=data.get("prompt", "")
    )
    logger.info(f"Resolved model: {data['model']} → {resolved_model}")
    
    # Construct payload
    payload = {
        "prompt": data["prompt"],
    }
    
    # If resolved_model is an array, use 'models' field, otherwise use 'model' field
    if isinstance(resolved_model, list):
        payload["models"] = resolved_model
        logger.info(f"Using models array for routing: {resolved_model}")
    else:
        payload["model"] = resolved_model
```

---

### 4. Update `/v1/chat/create` Endpoint (Around line ~1189-1230)

BEFORE the payload construction, add:
```python
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
```

Then change the payload construction from:
```python
    payload = {
        "model": data["model"],
        "messages": data["messages"],
    }
```

TO:
```python
    payload = {
        "messages": data["messages"],
    }
    
    # If resolved_model is an array, use 'models' field, otherwise use 'model' field
    if isinstance(resolved_model, list):
        payload["models"] = resolved_model
        logger.info(f"Using models array for routing: {resolved_model}")
    else:
        payload["model"] = resolved_model
```

---

## Status

These changes need to be carefully applied to avoid corruption. The key improvements are:

1. ✅ Logging now tracks requested models vs actual model used by OpenRouter
2. ✅ Intent detection from prompts
3. ✅ Model resolution (nexus/auto routing)
4. ✅ Proper handling of model arrays in payload
5. ✅ Workspace-specific model configurations

The user's request to "handle logs side also if we pass array" is addressed by tracking both the requested models array and the actual model OpenRouter selected (which is returned in the response).
