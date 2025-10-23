# Nexus Model Routing - Quick Reference

## Three Model Routing Options

### 1️⃣ nexus/auto
**What it does**: Simple automatic model selection  
**Routes to**: `openrouter/auto`  
**Use when**: You want OpenRouter to pick the best model automatically

```json
{
  "model": "nexus/auto",
  "messages": [{"role": "user", "content": "Any question"}]
}
```

---

### 2️⃣ nexus/auto:{category}
**What it does**: Routes to specific category models from workspace config  
**Routes to**: Workspace `model_config[category]` array  
**Use when**: You know the task category

**Available Categories**:
- `teacher` - Educational content
- `coder` - Programming tasks
- `creative` - Creative writing/art
- `summarizer` - Text summarization
- `fact_checker` - Fact verification
- `general` - General purpose

```json
{
  "model": "nexus/auto:coder",
  "messages": [{"role": "user", "content": "Write a function"}]
}
```

---

### 3️⃣ nexus/auto:intent
**What it does**: Auto-detects intent and routes to appropriate category  
**Routes to**: Auto-detected category models  
**Use when**: You want the system to figure out the task type

```json
{
  "model": "nexus/auto:intent",
  "messages": [{"role": "user", "content": "Explain how React hooks work"}]
}
```
→ Detects: `teacher` → Routes to workspace teacher models

---

## Intent Detection Examples

| Prompt | Detected Category | Why? |
|--------|------------------|------|
| "Explain quantum physics" | `teacher` | Keywords: "explain" + Pattern match |
| "Debug this Python code" | `coder` | Keywords: "debug", "code" |
| "Write a sci-fi story" | `creative` | Keywords: "write", "story" |
| "Summarize this article" | `summarizer` | Keyword: "summarize" |
| "Is this fact true?" | `fact_checker` | Pattern: "is this...true" |
| "Hello, how are you?" | `general` | No specific patterns |

---

## Workspace Model Config

Store in workspace database as JSON:

```json
{
  "teacher": ["z-ai/glm-4.5-air:free", "anthropic/claude-3-opus"],
  "coder": ["openai/gpt-4o"],
  "creative": ["google/gemini-2.5-flash"],
  "fact_checker": ["x-ai/grok-code-fast-1"],
  "general": ["openai/gpt-4o-mini"],
  "summarizer": ["openai/gpt-4o-mini", "qwen/qwen3-14b:free"]
}
```

---

## API Usage

### Completions Endpoint
```bash
POST /v1/create
{
  "model": "nexus/auto:intent",
  "prompt": "Your prompt here"
}
```

### Chat Completions Endpoint
```bash
POST /v1/chat/create
{
  "model": "nexus/auto:teacher",
  "messages": [
    {"role": "user", "content": "Explain neural networks"}
  ]
}
```

---

## Fallback Behavior

All errors gracefully fallback to `openrouter/auto`:
- Workspace not found
- model_config missing
- Category not in config
- JSON parse errors
- No prompt provided for intent detection

---

## Logging

Check logs for routing decisions:
```
INFO - Resolved nexus/auto:intent → category 'teacher' with models: ['z-ai/glm-4.5-air:free', ...]
INFO - Detected intent: coder (score: 7) from prompt: 'Write a function...'
```
