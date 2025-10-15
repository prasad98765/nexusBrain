# ChatBot Messages Array Refactor

## ✅ Changes Implemented

### 1. **Messages Array Format (Instead of Prompt)**

The ChatBot now sends conversation history using the `messages` array format instead of a simple `prompt` string.

#### Before (Old Format)
```json
{
  "model": "meta-llama/llama-3.3-8b-instruct:free",
  "prompt": "System: You are a helpful assistant.\n\nUser: Hello\nAssistant:",
  "max_tokens": 200,
  "temperature": 0.5,
  "stream": true
}
```

#### After (New Format)
```json
{
  "model": "meta-llama/llama-3.3-8b-instruct:free",
  "messages": [
    {
      "role": "system",
      "content": "You are Nexus AI Assistant, a helpful AI assistant for the Nexus AI Hub platform. Provide clear, concise, and helpful responses. Use markdown formatting for better readability."
    },
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you today?"
    },
    {
      "role": "user",
      "content": "What is Nexus AI Hub?"
    }
  ],
  "max_tokens": 200,
  "temperature": 0.5,
  "stream": true
}
```

---

## 🎯 Key Features

### 1. **System Prompt Integration**
```typescript
const apiMessages = [
  {
    role: 'system',
    content: 'You are Nexus AI Assistant, a helpful AI assistant for the Nexus AI Hub platform. Provide clear, concise, and helpful responses. Use markdown formatting for better readability.'
  },
  // ... conversation history
];
```

**System Prompt Content:**
- Defines bot personality: "Nexus AI Assistant"
- Sets behavior: "helpful AI assistant for the Nexus AI Hub platform"
- Instructions: "Provide clear, concise, and helpful responses"
- Formatting: "Use markdown formatting for better readability"

---

### 2. **Full Conversation History**

Every API call now includes the entire conversation history:

```typescript
// Build messages array from chat history
const apiMessages = [
  { role: 'system', content: '...' },          // System prompt (always first)
  { role: 'user', content: 'First message' },   // User's first message
  { role: 'assistant', content: 'Response' },   // Bot's first response
  { role: 'user', content: 'Second message' },  // User's second message
  { role: 'assistant', content: 'Response' },   // Bot's second response
  { role: 'user', content: 'Latest message' }   // Current user message
];
```

**Benefits:**
- ✅ **Context-aware responses** - Bot remembers previous messages
- ✅ **Better conversations** - Can reference earlier topics
- ✅ **Follow-up questions** - Understands conversation flow
- ✅ **Consistent personality** - System prompt applied to all messages

---

### 3. **Role Mapping**

UI roles are mapped to API-compatible roles:

| UI Role    | API Role    | Description                    |
|------------|-------------|--------------------------------|
| `system`   | (excluded)  | UI-only messages (warnings)    |
| `user`     | `user`      | User's messages                |
| `bot`      | `assistant` | Bot's responses                |

```typescript
...messages
  .filter(msg => msg.role !== 'system')  // Exclude UI system messages
  .map(msg => ({
    role: msg.role === 'bot' ? 'assistant' : 'user',
    content: msg.content
  }))
```

**Why exclude UI 'system' messages?**
- UI system messages are warnings/info for the user
- Example: "This bot does not maintain any session..."
- Not part of the AI conversation context

---

### 4. **Session Management**

#### Session Reset on Close
```typescript
const handleClose = () => {
  // Abort any ongoing requests
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  setIsOpen(false);
  
  // Clear all chat history (session ends)
  setTimeout(() => {
    setHasStarted(false);
    setMessages([]);           // ← All messages cleared
    setInputValue('');
    setIsLoading(false);
    setIsStreaming(false);
    abortControllerRef.current = null;
  }, 300);
};
```

**Behavior:**
- ✅ Closing chat = End session
- ✅ All messages cleared
- ✅ Next open = Fresh start
- ✅ No conversation history retained

---

## 📡 API Request Example

### Complete Request Payload
```json
{
  "model": "meta-llama/llama-3.3-8b-instruct:free",
  "messages": [
    {
      "role": "system",
      "content": "You are Nexus AI Assistant, a helpful AI assistant for the Nexus AI Hub platform. Provide clear, concise, and helpful responses. Use markdown formatting for better readability."
    },
    {
      "role": "user",
      "content": "What is Nexus AI Hub?"
    },
    {
      "role": "assistant",
      "content": "**Nexus AI Hub** is an AI-powered developer platform that provides:\n\n- Access to 400+ LLM models\n- Single API key integration\n- RAG capabilities\n- Prompt management\n- Caching system\n\nIt's built for scalability and flexibility!"
    },
    {
      "role": "user",
      "content": "How does the caching work?"
    }
  ],
  "max_tokens": 200,
  "temperature": 0.5,
  "stream": true,
  "cache_threshold": 0.50,
  "is_cached": false,
  "use_rag": false
}
```

---

## 🔄 Conversation Flow Example

### Example Chat Sequence

```
User opens chat
↓
[UI System Message]
"This bot does not maintain any session..."
↓
User clicks "Start Conversation"
↓
[Bot Message]
"💬 Welcome to Nexus AI Hub! What can we help you with today?"

───────────────────────────────────────────────────────

User: "What is RAG?"
↓
API Request:
{
  "messages": [
    {"role": "system", "content": "You are Nexus AI Assistant..."},
    {"role": "user", "content": "What is RAG?"}
  ]
}
↓
Bot: "**RAG (Retrieval-Augmented Generation)** is a technique..."

───────────────────────────────────────────────────────

User: "How do I use it in Nexus?"
↓
API Request:
{
  "messages": [
    {"role": "system", "content": "You are Nexus AI Assistant..."},
    {"role": "user", "content": "What is RAG?"},
    {"role": "assistant", "content": "**RAG (Retrieval-Augmented Generation)** is a technique..."},
    {"role": "user", "content": "How do I use it in Nexus?"}  ← Context maintained!
  ]
}
↓
Bot: "To use RAG in Nexus AI Hub:\n1. Upload your documents..."

───────────────────────────────────────────────────────

User closes chat
↓
Session reset: All messages cleared
↓
User reopens chat
↓
Fresh start: No previous context
```

---

## 🧩 Technical Implementation

### Message Building Logic

```typescript
// 1. Start with system prompt
const apiMessages = [
  {
    role: 'system',
    content: 'You are Nexus AI Assistant...'
  }
];

// 2. Add conversation history (exclude UI system messages)
const historyMessages = messages
  .filter(msg => msg.role !== 'system')  // Skip UI warnings
  .map(msg => ({
    role: msg.role === 'bot' ? 'assistant' : 'user',  // Map roles
    content: msg.content
  }));

apiMessages.push(...historyMessages);

// 3. Add current user message
apiMessages.push({
  role: 'user',
  content: userMessage
});

// 4. Send to API
fetch('/api/v1/create', {
  body: JSON.stringify({
    model: '...',
    messages: apiMessages,  // ← Complete conversation
    stream: true
  })
});
```

---

## 📊 Comparison: Before vs After

### Before (Prompt-based)
```typescript
// Only current message sent
{
  "prompt": "User: What is RAG?\nAssistant:",
  // No context from previous messages
}
```

**Issues:**
- ❌ No conversation context
- ❌ Can't reference previous messages
- ❌ Each message is independent
- ❌ Poor follow-up responses

### After (Messages Array)
```typescript
// Full conversation history sent
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "What is RAG?"},
    {"role": "assistant", "content": "RAG is..."},
    {"role": "user", "content": "How do I use it?"}
  ]
  // Bot knows context: "it" refers to RAG
}
```

**Benefits:**
- ✅ Full conversation context
- ✅ Can reference previous messages
- ✅ Better follow-up responses
- ✅ Natural conversation flow

---

## 🎯 Message Roles Explained

### System Role
```json
{
  "role": "system",
  "content": "You are Nexus AI Assistant..."
}
```
- **Purpose**: Define bot behavior and personality
- **Position**: Always first in messages array
- **Frequency**: Once per request
- **Visibility**: Not shown in chat UI

### User Role
```json
{
  "role": "user",
  "content": "What is Nexus AI Hub?"
}
```
- **Purpose**: User's questions/messages
- **Position**: After system, alternates with assistant
- **Visibility**: Right-aligned purple/pink bubble in UI

### Assistant Role
```json
{
  "role": "assistant",
  "content": "Nexus AI Hub is..."
}
```
- **Purpose**: Bot's responses
- **Position**: After user messages
- **Visibility**: Left-aligned dark slate bubble in UI
- **Note**: UI uses 'bot' internally, converted to 'assistant' for API

---

## 🔧 Configuration

### System Prompt Customization

You can modify the system prompt to change bot behavior:

```typescript
const apiMessages = [
  {
    role: 'system',
    content: `You are Nexus AI Assistant, a helpful AI assistant for the Nexus AI Hub platform.

Key guidelines:
- Provide clear, concise, and helpful responses
- Use markdown formatting for better readability
- Be friendly and professional
- Focus on Nexus AI Hub features
- Provide code examples when relevant`
  },
  // ... rest of conversation
];
```

**Example Variations:**

**Technical Support Bot:**
```typescript
content: 'You are a technical support specialist for Nexus AI Hub. Provide detailed troubleshooting steps and technical guidance. Ask clarifying questions when needed.'
```

**Sales/Marketing Bot:**
```typescript
content: 'You are a sales assistant for Nexus AI Hub. Highlight platform benefits, explain features enthusiastically, and guide users toward signing up.'
```

**Developer Bot:**
```typescript
content: 'You are a developer advocate for Nexus AI Hub. Provide code examples, API documentation links, and best practices for integration.'
```

---

## 🧪 Testing

### Test Conversation Context

1. **Open chat**
2. **Send message**: "What is RAG?"
3. **Send follow-up**: "How do I use it?" (should understand "it" refers to RAG)
4. **Send another**: "Give me an example" (should provide RAG example)
5. **Verify**: Bot maintains context across all messages

### Test Session Reset

1. **Have a conversation** (multiple messages)
2. **Close chat** (X button)
3. **Reopen chat**
4. **Verify**: No previous messages shown
5. **Send new message**
6. **Verify**: Bot doesn't remember previous conversation

---

## 📝 Backend API Requirements

### Endpoint Must Support Messages Array

```python
# Backend should accept this format
@app.route('/api/v1/create', methods=['POST'])
def create():
    data = request.json
    
    # NEW: Accept messages array
    messages = data.get('messages', [])
    
    # OLD: Also support legacy prompt format
    prompt = data.get('prompt', None)
    
    if messages:
        # Use messages array (preferred)
        response = openrouter_client.chat.completions.create(
            model=data['model'],
            messages=messages,  # ← Pass messages directly
            stream=data.get('stream', False),
            max_tokens=data.get('max_tokens', 200),
            temperature=data.get('temperature', 0.5)
        )
    elif prompt:
        # Fallback to prompt (legacy)
        response = openrouter_client.completions.create(
            model=data['model'],
            prompt=prompt,
            stream=data.get('stream', False),
            max_tokens=data.get('max_tokens', 200),
            temperature=data.get('temperature', 0.5)
        )
    
    return stream_response(response)
```

---

## 🚀 Benefits Summary

### User Experience
- ✅ **Natural conversations** - Bot remembers context
- ✅ **Better follow-ups** - Can reference previous messages
- ✅ **Smarter responses** - Understands conversation flow
- ✅ **Session control** - Clear reset when chat closes

### Developer Experience
- ✅ **Standard format** - Follows OpenAI/OpenRouter conventions
- ✅ **Easy debugging** - Clear message structure in requests
- ✅ **Flexible** - Easy to modify system prompt
- ✅ **Maintainable** - Clean separation of roles

### Technical Benefits
- ✅ **Context preservation** - Full conversation in each request
- ✅ **Stateless backend** - No session storage needed
- ✅ **Streaming compatible** - Works with SSE streaming
- ✅ **Model agnostic** - Works with any chat model

---

## 🔄 Migration Notes

### Breaking Changes
**None!** This is backward compatible if your backend supports both `messages` and `prompt` parameters.

### What Changed
1. Request payload now uses `messages` array instead of `prompt` string
2. Session reset now explicitly clears all messages
3. System prompt moved from string interpolation to messages array

### What Stayed the Same
- UI component structure
- Message display logic
- Streaming functionality
- Error handling
- Auto-scroll behavior
- Markdown rendering

---

## 📖 Example: Multi-turn Conversation

```
User: "What models does Nexus support?"

API Request 1:
{
  "messages": [
    {"role": "system", "content": "You are Nexus AI Assistant..."},
    {"role": "user", "content": "What models does Nexus support?"}
  ]
}

Bot: "Nexus AI Hub supports 400+ models including OpenAI, Claude, Gemini, Mistral, and more!"

─────────────────────────────────────────

User: "Which one is best for coding?"

API Request 2:
{
  "messages": [
    {"role": "system", "content": "You are Nexus AI Assistant..."},
    {"role": "user", "content": "What models does Nexus support?"},
    {"role": "assistant", "content": "Nexus AI Hub supports 400+ models..."},
    {"role": "user", "content": "Which one is best for coding?"}  ← Knows context!
  ]
}

Bot: "For coding, I recommend:\n1. **GPT-4** - Best overall\n2. **Claude 3** - Great for refactoring\n3. **CodeLlama** - Specialized for code"

─────────────────────────────────────────

User: "Show me how to use the first one"

API Request 3:
{
  "messages": [
    {"role": "system", "content": "You are Nexus AI Assistant..."},
    {"role": "user", "content": "What models does Nexus support?"},
    {"role": "assistant", "content": "Nexus AI Hub supports 400+ models..."},
    {"role": "user", "content": "Which one is best for coding?"},
    {"role": "assistant", "content": "For coding, I recommend:\n1. **GPT-4**..."},
    {"role": "user", "content": "Show me how to use the first one"}  ← Knows "first one" = GPT-4!
  ]
}

Bot: "Here's how to use **GPT-4** in Nexus:\n\n```javascript\nconst response = await fetch('/api/v1/create', {...});\n```"
```

---

## ✅ Ready for Production

All changes are:
- ✅ TypeScript error-free
- ✅ Backward compatible (if backend supports both formats)
- ✅ Context-aware conversations enabled
- ✅ Session management improved
- ✅ Standard OpenAI/OpenRouter format
- ✅ Fully tested and documented

**The ChatBot now uses industry-standard messages array format with full conversation context!** 🎉
