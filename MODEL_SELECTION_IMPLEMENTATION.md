# Model Selection Logic Implementation

## Overview
Implemented intelligent model routing for `nexus/auto` model variants in both `/v1/create` (completions) and `/v1/chat/create` (chat completions) endpoints.

## Features

### 1. **nexus/auto → openrouter/auto**
Simple routing that converts `nexus/auto` to `openrouter/auto` for automatic model selection.

**Example:**
```json
{
  "model": "nexus/auto",
  "prompt": "Hello, world!"
}
```
→ Routes to `openrouter/auto`

---

### 2. **nexus/auto:teacher → Category-based Model Array**
Fetches model configuration from workspace database and routes to specific category models.

**Example:**
```json
{
  "model": "nexus/auto:teacher",
  "messages": [{"role": "user", "content": "Explain quantum physics"}]
}
```
→ Routes to workspace model_config["teacher"] array: `["z-ai/glm-4.5-air:free", "anthropic/claude-3-opus", "inclusionai/ring-1t"]`

**Supported Categories:**
- `teacher` - Educational/explanatory content
- `coder` - Code-related tasks
- `creative` - Creative writing, art prompts
- `summarizer` - Summarization tasks
- `fact_checker` - Fact verification
- `general` - General purpose tasks

---

### 3. **nexus/auto:intent → Intent-based Routing**
Automatically detects user intent from the prompt and routes to appropriate category models.

**Example:**
```json
{
  "model": "nexus/auto:intent",
  "prompt": "Can you help me debug this Python function?"
}
```
→ Detects intent: `coder` → Routes to workspace model_config["coder"] array: `["openai/gpt-4o"]`

**Intent Detection Method:**
- **Keyword Matching**: Scans prompt for category-specific keywords (weight: +1 per match)
- **Pattern Matching**: Uses regex patterns for more precise detection (weight: +3 per match)
- **Scoring**: Category with highest score wins
- **Fallback**: Defaults to "general" if no clear intent detected

---

## Implementation Details

### Helper Functions

#### 1. `detect_intent_from_prompt(prompt: str) -> str`
Analyzes the prompt and returns the detected category.

**Process:**
1. Convert prompt to lowercase
2. Score each category based on keyword and pattern matches
3. Return category with highest score
4. Default to "general" if no matches

**Example Detection:**
```python
# Prompt: "Explain how neural networks work"
# Keywords matched: "explain" (+1 teacher)
# Pattern matched: r"explain\s+(?:to me|how|why)" (+3 teacher)
# Result: "teacher" (score: 4)
```

#### 2. `resolve_nexus_model(model: str, workspace_id: int, prompt: str = None)`
Resolves nexus model strings to actual OpenRouter models.

**Logic:**
```python
if model == "nexus/auto":
    return "openrouter/auto"
elif model.startswith("nexus/auto:"):
    category = extract_category(model)
    if category == "intent":
        category = detect_intent_from_prompt(prompt)
    return workspace.model_config[category]
else:
    return model  # Pass through non-nexus models
```

---

## Integration Points

### /v1/create (Completions)
```python
# Resolve model first
resolved_model = resolve_nexus_model(
    model=data["model"],
    workspace_id=api_token.workspace_id,
    prompt=data.get("prompt", "")
)

# Construct payload
payload = {
    "prompt": data["prompt"],
}

# If resolved_model is an array, use 'models' field, otherwise use 'model' field
if isinstance(resolved_model, list):
    payload["models"] = resolved_model  # Array for OpenRouter fallback/load balancing
    logger.info(f"Using models array for routing: {resolved_model}")
else:
    payload["model"] = resolved_model  # Single model string
```

### /v1/chat/create (Chat Completions)
```python
# Extract last user message for intent detection
last_user_message = ""
for msg in reversed(data.get("messages", [])):
    if msg.get("role") == "user":
        last_user_message = msg.get("content", "")
        break

# Resolve model
resolved_model = resolve_nexus_model(
    model=data["model"],
    workspace_id=api_token.workspace_id,
    prompt=last_user_message
)

# Construct payload
payload = {
    "messages": data["messages"],
}

# If resolved_model is an array, use 'models' field, otherwise use 'model' field
if isinstance(resolved_model, list):
    payload["models"] = resolved_model  # Array for OpenRouter fallback/load balancing
    logger.info(f"Using models array for routing: {resolved_model}")
else:
    payload["model"] = resolved_model  # Single model string
```

---

## Profile Patterns Configuration

The intent detection uses comprehensive pattern matching:

### Teacher Category
- **Keywords**: explain, teach, understand, concept, diagram, visualize
- **Patterns**: `explain\s+(?:to me|how|why)`, `what\s+(?:is|are|does)`

### Coder Category
- **Keywords**: code, program, function, bug, debug, implement, algorithm
- **Patterns**: `(?:write|create|implement)\s+(?:a|the)?\s*(?:function|code)`

### Creative Category
- **Keywords**: create, story, imagine, art, prompt, illustration
- **Patterns**: `(?:write|create)\s+(?:a|an)?\s*(?:story|poem|creative)`

### Summarizer Category
- **Keywords**: summarize, summary, brief, overview, tldr, key points
- **Patterns**: `(?:can\s+you)?\s*summarize`, `tldr`

### Fact Checker Category
- **Keywords**: verify, fact, check, accurate, truth, evidence
- **Patterns**: `(?:is|are)\s+(?:this|these).*(?:true|correct|accurate)`

---

## OpenRouter Models Array Support

When the resolved model is an **array** (returned from workspace `model_config` categories), the implementation automatically uses OpenRouter's `models` field instead of the `model` field.

### Why This Matters

OpenRouter supports two ways to specify models:

1. **Single Model** (`model` field):
   ```json
   {
     "model": "openai/gpt-4o",
     "messages": [...]
   }
   ```

2. **Model Array** (`models` field) - For fallback and load balancing:
   ```json
   {
     "models": ["openai/gpt-4o", "anthropic/claude-3-opus"],
     "messages": [...]
   }
   ```

### Automatic Field Selection

The implementation automatically detects the type and uses the correct field:

```python
if isinstance(resolved_model, list):
    payload["models"] = resolved_model  # Array → use 'models' field
else:
    payload["model"] = resolved_model   # String → use 'model' field
```

### Examples

**Example 1: Single Model** (nexus/auto)
```python
resolved_model = "openrouter/auto"  # String
payload = {
    "model": "openrouter/auto",  # Uses 'model' field
    "prompt": "..."
}
```

**Example 2: Model Array** (nexus/auto:teacher)
```python
resolved_model = ["z-ai/glm-4.5-air:free", "anthropic/claude-3-opus"]  # List
payload = {
    "models": ["z-ai/glm-4.5-air:free", "anthropic/claude-3-opus"],  # Uses 'models' field
    "messages": [...]
}
```

### Benefits

1. **Automatic Fallback**: If first model is unavailable, OpenRouter tries the next
2. **Load Balancing**: OpenRouter can distribute requests across models
3. **Cost Optimization**: Can prioritize cheaper models with fallback to premium
4. **Reliability**: Increased uptime with multiple model options

---

## Workspace Model Configuration

The workspace database should have a `model_config` field (JSON) like:

```json
{
  "coder": ["openai/gpt-4o"],
  "creative": ["google/gemini-2.5-flash"],
  "fact_checker": ["x-ai/grok-code-fast-1"],
  "general": ["openai/gpt-4o-mini"],
  "summarizer": ["openai/gpt-4o-mini", "qwen/qwen3-14b:free"],
  "teacher": ["z-ai/glm-4.5-air:free", "anthropic/claude-3-opus", "inclusionai/ring-1t"]
}
```

---

## Error Handling

### Graceful Fallbacks
1. **Workspace not found** → `openrouter/auto`
2. **model_config missing** → `openrouter/auto`
3. **Category not in config** → Try "general" category
4. **No prompt for intent** → Default to "general"
5. **JSON parse error** → `openrouter/auto`

### Logging
- All routing decisions logged with INFO level
- Errors logged with ERROR level
- Intent detection results logged with category scores

---

## Testing Examples

### Example 1: Direct Category
```bash
curl -X POST http://localhost:5000/v1/chat/create \
  -H "Authorization: Bearer nxs-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nexus/auto:teacher",
    "messages": [{"role": "user", "content": "Explain quantum entanglement"}]
  }'
```
→ Routes to teacher models from workspace config

### Example 2: Intent Detection
```bash
curl -X POST http://localhost:5000/v1/create \
  -H "Authorization: Bearer nxs-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nexus/auto:intent",
    "prompt": "Write a Python function to sort a list"
  }'
```
→ Detects "coder" intent → Routes to coder models

### Example 3: Simple Auto
```bash
curl -X POST http://localhost:5000/v1/chat/create \
  -H "Authorization: Bearer nxs-xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "nexus/auto",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```
→ Routes to openrouter/auto

---

## Benefits

1. **Intelligent Routing**: Automatically selects best-fit models based on task type
2. **Workspace Customization**: Each workspace can define their own model preferences
3. **Intent Detection**: No need for users to specify category manually
4. **Fallback Safety**: Always defaults to working models if configuration issues occur
5. **Logging**: Comprehensive logging for debugging and analytics
6. **Flexibility**: Supports arrays of models for load balancing/fallback

---

## Files Modified

1. **llm_routes.py**:
   - Added `profile_patterns` configuration (78 lines)
   - Added `detect_intent_from_prompt()` function (37 lines)
   - Added `resolve_nexus_model()` function (73 lines)
   - Integrated into `/v1/create` endpoint (7 lines)
   - Integrated into `/v1/chat/create` endpoint (15 lines)
   - Total additions: ~210 lines

---

## Performance Considerations

- Intent detection uses compiled regex (efficient)
- Database query only when nexus model is used
- Model config cached in workspace object
- Minimal overhead for non-nexus models (simple startswith check)

---

## Future Enhancements

1. **Cache Intent Detection**: Cache detected intents for repeated prompts
2. **User Feedback Loop**: Learn from user preferences over time
3. **Custom Patterns**: Allow workspaces to define custom detection patterns
4. **Multi-Intent Support**: Handle prompts with multiple intents
5. **Confidence Scores**: Return confidence level with routing decision
