# System Prompts Integration with OpenRouter API

## Overview
This document describes the implementation of system prompts integration with the OpenRouter API endpoints (`/v1/create` and `/v1/chat/create`).

## Feature Description
The system now automatically retrieves and injects the active system prompt from the `system_prompts` table into OpenRouter API requests. This allows users to set a workspace-wide system prompt that is applied to all API calls.

## Key Behaviors

### 1. Active System Prompt Selection
- **Only one prompt active at a time**: The system enforces that only one system prompt per workspace can have `is_active=true`
- **Automatic retrieval**: The active system prompt is automatically fetched for each API request
- **Graceful fallback**: If no active prompt exists or no records are found, the API works as it currently does (without system prompt)

### 2. System Prompt Injection

#### For `/v1/create` (Completions API)
- The active system prompt is **prepended** to the user's prompt
- Format: `{system_prompt}\n\n{user_prompt}`
- This happens before RAG augmentation (if enabled)

#### For `/v1/chat/create` (Chat Completions API)
- The active system prompt is **injected as a system message**
- Two scenarios:
  1. **No existing system message**: A new system message is inserted at the beginning of the messages array
  2. **Existing system message**: The active prompt is prepended to the existing system message content

### 3. Integration Flow

```
Request received
    ↓
Get API token & workspace_id
    ↓
Retrieve active system prompt (if exists)
    ↓
Inject system prompt into payload
    ↓
Check cache (using original payload)
    ↓
Apply RAG augmentation (if enabled)
    ↓
Forward to OpenRouter
    ↓
Cache response & log usage
```

## Implementation Details

### New Helper Function
```python
def get_active_system_prompt(workspace_id):
    """
    Retrieve the active system prompt for a workspace.
    
    Args:
        workspace_id: The workspace ID to query
    
    Returns:
        The active system prompt text, or None if no active prompt exists
    """
```

### Modified Endpoints

1. **`/v1/create`** (Completions)
   - Retrieves active system prompt
   - Prepends to user prompt before processing
   - Maintains original payload for caching

2. **`/v1/chat/create`** (Chat Completions)
   - Retrieves active system prompt
   - Injects as system message (first position or prepended to existing)
   - Maintains original payload for caching

### Code Changes

**File**: `server/llm_routes.py`

**Changes**:
1. Added import for `SystemPrompt` model
2. Created `get_active_system_prompt()` helper function
3. Modified `/v1/create` endpoint to prepend system prompt to prompt
4. Modified `/v1/chat/create` endpoint to inject system prompt as system message

## Usage Example

### Setting an Active System Prompt
```bash
# Create a system prompt
POST /api/system_prompts
{
  "title": "Professional Assistant",
  "prompt": "You are a professional AI assistant. Always be helpful, accurate, and concise.",
  "is_active": true
}

# The prompt will now be automatically applied to all API calls
```

### API Request (Completions)
```bash
POST /api/v1/create
{
  "model": "openai/gpt-4",
  "prompt": "What is the capital of France?"
}

# Actual prompt sent to OpenRouter:
# "You are a professional AI assistant. Always be helpful, accurate, and concise.\n\nWhat is the capital of France?"
```

### API Request (Chat Completions)
```bash
POST /api/v1/chat/create
{
  "model": "openai/gpt-4",
  "messages": [
    {"role": "user", "content": "What is the capital of France?"}
  ]
}

# Actual messages sent to OpenRouter:
# [
#   {"role": "system", "content": "You are a professional AI assistant. Always be helpful, accurate, and concise."},
#   {"role": "user", "content": "What is the capital of France?"}
# ]
```

## Database Schema

The `system_prompts` table structure:
```python
class SystemPrompt(db.Model):
    id = db.Column(db.String, primary_key=True)
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'))
    title = db.Column(db.String(255))
    prompt = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime)
    updated_at = db.Column(db.DateTime)
```

## Management Endpoints

Existing system prompt management endpoints (from `system_prompts_routes.py`):

- `GET /api/system_prompts` - List all system prompts (paginated, searchable)
- `POST /api/system_prompts` - Create a new system prompt
- `PUT /api/system_prompts/<id>` - Update a system prompt
- `DELETE /api/system_prompts/<id>` - Delete a system prompt
- `POST /api/system_prompts/<id>/activate` - Activate a specific prompt (deactivates others)
- `GET /api/system_prompts/active` - Get the currently active prompt
- `POST /api/system_prompts/enhance` - Enhance a prompt using AI

## Important Notes

1. **Single Active Prompt**: The system ensures only one prompt is active per workspace at any time
2. **No Performance Impact**: System prompt retrieval is a simple database query that doesn't affect API performance
3. **Cache Friendly**: System prompts are included in the payload before caching, so cached responses respect the prompt
4. **RAG Compatible**: System prompts work seamlessly with RAG augmentation
5. **Backward Compatible**: If no active prompt exists, the API behaves exactly as before

## Testing

To test the implementation:

1. Create a system prompt and activate it
2. Make API calls to `/v1/create` or `/v1/chat/create`
3. Verify the system prompt is included in the OpenRouter request
4. Check that responses reflect the system prompt's instructions
5. Deactivate the prompt and verify API works normally

## Error Handling

- If database query fails, the error is logged and the request continues without system prompt
- No errors are returned to the user for system prompt issues
- The API gracefully falls back to normal operation if system prompt retrieval fails

## Future Enhancements

Potential improvements:
- Per-model system prompts
- System prompt versioning
- System prompt analytics (usage tracking)
- Template variables in system prompts
- A/B testing for system prompts
