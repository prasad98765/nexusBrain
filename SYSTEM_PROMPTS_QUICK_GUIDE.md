# System Prompts - Quick Reference Guide

## Overview
System prompts allow you to set workspace-wide AI behavior that automatically applies to all OpenRouter API calls.

## Quick Start

### 1. Create a System Prompt
```bash
POST /api/system_prompts
Authorization: Bearer <your-token>

{
  "title": "Professional Assistant",
  "prompt": "You are a professional AI assistant. Always be helpful, accurate, and concise.",
  "is_active": true
}
```

### 2. Make API Calls
Once a system prompt is active, it's automatically applied to all API requests:

#### Completions API
```bash
POST /api/v1/create
Authorization: Bearer nxs-your-api-key

{
  "model": "openai/gpt-4",
  "prompt": "What is the capital of France?"
}
```

**What gets sent to OpenRouter:**
```
You are a professional AI assistant. Always be helpful, accurate, and concise.

What is the capital of France?
```

#### Chat Completions API
```bash
POST /api/v1/chat/create
Authorization: Bearer nxs-your-api-key

{
  "model": "openai/gpt-4",
  "messages": [
    {"role": "user", "content": "What is the capital of France?"}
  ]
}
```

**What gets sent to OpenRouter:**
```json
{
  "messages": [
    {"role": "system", "content": "You are a professional AI assistant. Always be helpful, accurate, and concise."},
    {"role": "user", "content": "What is the capital of France?"}
  ]
}
```

## Management Operations

### List All System Prompts
```bash
GET /api/system_prompts?page=1&limit=10&search=assistant
```

### Get Active Prompt
```bash
GET /api/system_prompts/active
```

### Update a System Prompt
```bash
PUT /api/system_prompts/<prompt-id>

{
  "title": "Updated Title",
  "prompt": "Updated prompt text",
  "is_active": true
}
```

### Activate a Prompt
```bash
POST /api/system_prompts/<prompt-id>/activate
```
*Note: This automatically deactivates all other prompts*

### Delete a System Prompt
```bash
DELETE /api/system_prompts/<prompt-id>
```

### Enhance a Prompt with AI
```bash
POST /api/system_prompts/enhance

{
  "prompt": "Be helpful"
}
```
Returns an AI-enhanced version of your prompt.

## Important Rules

1. **Only ONE active prompt per workspace** - When you activate a prompt, all others are automatically deactivated
2. **Automatic application** - No code changes needed, just activate a prompt and it works
3. **Works with RAG** - System prompts are applied before RAG context is added
4. **Works with caching** - System prompts are included in cache keys
5. **No performance impact** - Minimal database lookup per request

## Use Cases

### Customer Support Bot
```json
{
  "title": "Customer Support Agent",
  "prompt": "You are a friendly customer support agent for our company. Always be empathetic, professional, and solution-focused. If you don't know the answer, direct the customer to contact our support team at support@company.com.",
  "is_active": true
}
```

### Code Assistant
```json
{
  "title": "Senior Developer",
  "prompt": "You are a senior software developer with expertise in modern web technologies. Provide clear, concise code examples with explanations. Follow best practices and consider security, performance, and maintainability.",
  "is_active": true
}
```

### Content Writer
```json
{
  "title": "Professional Writer",
  "prompt": "You are a professional content writer. Write in a clear, engaging style with proper grammar and structure. Adapt your tone based on the context - formal for business, casual for social media.",
  "is_active": true
}
```

### Medical Assistant
```json
{
  "title": "Medical Information Assistant",
  "prompt": "You are a medical information assistant. Provide accurate, evidence-based information but always remind users to consult healthcare professionals for medical advice. Never diagnose or prescribe treatments.",
  "is_active": true
}
```

## Troubleshooting

### System prompt not being applied?
1. Check if the prompt is marked as `is_active: true`
2. Verify you're using the correct workspace
3. Check server logs for any errors

### Want to disable system prompts temporarily?
Simply deactivate all prompts:
```bash
PUT /api/system_prompts/<prompt-id>
{
  "is_active": false
}
```

### Multiple prompts active by mistake?
The system should prevent this, but if it happens, use the activate endpoint to set the correct one:
```bash
POST /api/system_prompts/<correct-prompt-id>/activate
```

## Best Practices

1. **Be Specific** - Clear instructions yield better results
2. **Set Boundaries** - Define what the AI should and shouldn't do
3. **Define Tone** - Specify the desired communication style
4. **Test Thoroughly** - Try various inputs to ensure the prompt works as expected
5. **Version Your Prompts** - Keep track of what works by saving different versions
6. **Use AI Enhancement** - Use the `/enhance` endpoint to improve your prompts

## Technical Details

- System prompts are stored in the `system_prompts` table
- Enforced at the API level (not client-side)
- Applied before RAG augmentation
- Included in cache keys for consistency
- Minimal performance overhead (~1ms database query)

## API Response Format

All system prompt endpoints return data in this format:
```json
{
  "id": "uuid",
  "title": "Prompt Title",
  "prompt": "Prompt content...",
  "is_active": true,
  "created_at": "2025-10-21T10:00:00",
  "updated_at": "2025-10-21T12:00:00"
}
```

For list endpoints:
```json
{
  "prompts": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

## Security Notes

- System prompts are workspace-scoped (isolated between workspaces)
- Requires authentication to manage
- Cannot be accessed by other workspaces
- Changes take effect immediately

---

**Questions or Issues?** Check the full documentation in `SYSTEM_PROMPTS_INTEGRATION.md`
