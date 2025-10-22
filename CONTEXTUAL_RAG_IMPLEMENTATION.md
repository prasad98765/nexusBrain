# Contextual RAG Implementation - Conversation Memory Support

## Overview

This implementation adds **contextual RAG (Retrieval-Augmented Generation)** with conversation memory support to Nexus AI Hub. It enables the system to understand follow-up questions by maintaining conversation context and rewriting queries to be fully standalone before document retrieval.

## Problem Solved

### Before (Without Context):
```
User: "What is Prasad Chaudhari's salary?"
System: "$120,000" ✅

User: "What about her basic salary?"
System: "I don't have information about 'her'." ❌
```

### After (With Contextual RAG):
```
User: "What is Prasad Chaudhari's salary?"
System: "$120,000" ✅

User: "What about her basic salary?"  
→ Rewritten to: "What is Prasad Chaudhari's basic salary?"
System: "Prasad Chaudhari's basic salary is $80,000" ✅
```

---

## Architecture

### Components

1. **Conversation Memory Service** (`conversation_memory_service.py`)
   - Stores conversation turns in Redis
   - Maintains last N turns (configurable, default: 5)
   - TTL-based expiration (24 hours)
   - Workspace-isolated storage

2. **Query Rewriting** (`rag_service.py`)
   - Uses LLM to rewrite queries with context
   - Resolves pronouns (her, his, it, they)
   - Creates standalone questions
   - Falls back to original query on failure

3. **Enhanced RAG Retrieval** (`rag_service.py`)
   - Accepts conversation history
   - Rewrites queries before embedding
   - Performs semantic search with rewritten query
   - Returns relevant document chunks

4. **Chat Endpoint Integration** (`llm_routes.py`)
   - Extracts conversation history from messages
   - Passes history to RAG service
   - Stores turns after each response

---

## Implementation Details

### 1. Conversation Memory Service

**File**: `server/conversation_memory_service.py`

**Key Methods**:

```python
# Add a conversation turn
add_turn(workspace_id, conversation_id, user_message, assistant_message)

# Get conversation history  
get_history(workspace_id, conversation_id, max_turns=5)

# Get formatted context string
get_recent_context(workspace_id, conversation_id, num_turns=3)

# Clear conversation
clear_conversation(workspace_id, conversation_id)
```

**Redis Key Format**:
```
conversation:ws:{workspace_id}:conv:{conversation_id}
```

**Data Structure**:
```json
{
  "turns": [
    {
      "user": "What is Prasad Chaudhari's salary?",
      "assistant": "Prasad Chaudhari's salary is $120,000.",
      "timestamp": "2025-10-19T10:30:00Z"
    }
  ]
}
```

**Features**:
- ✅ Automatic cleanup (TTL: 24 hours)
- ✅ Max turns limit (keeps last 5 by default)
- ✅ Workspace isolation
- ✅ Session-based conversations
- ✅ SSL support for Redis

---

### 2. Query Rewriting Function

**File**: `server/rag_service.py`

**Function**: `_rewrite_query_with_context(current_query, conversation_history)`

**How It Works**:

1. **Builds context** from conversation history
2. **Creates rewrite prompt** for LLM
3. **Calls OpenRouter** with fast model (llama-3.3-8b)
4. **Returns rewritten query** or falls back to original

**Example Prompt**:
```
Given the following conversation history, rewrite the latest user question to be fully self-contained and standalone.

Conversation history:
User: What is Prasad Chaudhari's salary?
Assistant: Prasad Chaudhari's salary is $120,000.

Latest user question: What about her basic salary?

Rewritten standalone question (include all necessary context, resolve pronouns):
```

**Expected Output**:
```
What is Prasad Chaudhari's basic salary?
```

**Model Used**:
- `meta-llama/llama-3.3-8b-instruct:free` (fast, free, efficient)
- Temperature: 0.3 (low for consistent rewrites)
- Max tokens: 150
- Timeout: 10 seconds

**Error Handling**:
- ❌ API failure → Returns original query
- ❌ Empty response → Returns original query
- ❌ Timeout → Returns original query

---

### 3. Enhanced RAG Retrieval

**File**: `server/rag_service.py`

**Function**: `retrieve_context(query, workspace_id, top_k, similarity_threshold, conversation_history)`

**New Parameter**:
```python
conversation_history: Optional[List[Dict[str, str]]] = None
```

**Process Flow**:

```
1. Check if conversation_history provided
   ├─ Yes → Rewrite query with context
   └─ No  → Use original query

2. Generate embedding for query (rewritten or original)

3. Search Qdrant vector database

4. Return relevant document chunks
```

**Logging**:
```
🧠 Contextual RAG enabled with 4 history messages
🔄 Query rewritten: 'What about her salary?' → 'What is Prasad Chaudhari's salary?'
🔍 RAG Search - Query: 'What is Prasad Chaudhari's salary?'
✅ Retrieved 3 relevant chunks for query
```

---

### 4. Chat Endpoint Integration

**File**: `server/llm_routes.py`

**Function**: `augment_with_rag_context(messages, workspace_id, use_rag, top_k, threshold, mode)`

**Enhanced Logic**:

```python
# 1. Extract conversation history from messages
conversation_history = []
for msg in messages:
    if msg.get('role') in ['user', 'assistant']:
        conversation_history.append({
            "role": msg.get('role'),
            "content": msg.get('content', '')
        })

# 2. Keep only recent history (last 5 turns = 10 messages)
if len(conversation_history) > 10:
    conversation_history = conversation_history[-10:]

# 3. Remove current query from history
if conversation_history and conversation_history[-1].get('role') == 'user':
    conversation_history = conversation_history[:-1]

# 4. Call RAG with conversation history
contexts = rag_service.retrieve_context(
    query=last_user_msg,
    workspace_id=workspace_id,
    top_k=top_k,
    similarity_threshold=threshold,
    conversation_history=conversation_history if conversation_history else None
)
```

---

## API Usage

### Basic RAG (No Context)

```bash
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [
      {"role": "user", "content": "What is the leave policy?"}
    ],
    "use_rag": true,
    "rag_top_k": 5,
    "rag_threshold": 0.4
  }'
```

### Contextual RAG (With Conversation History)

```bash
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type": application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [
      {"role": "user", "content": "What is Prasad Chaudhari'\''s salary?"},
      {"role": "assistant", "content": "Prasad Chaudhari'\''s salary is $120,000."},
      {"role": "user", "content": "What about her basic salary?"}
    ],
    "use_rag": true,
    "rag_top_k": 5,
    "rag_threshold": 0.4
  }'
```

**Backend Processing**:
1. Extracts: `["What is Prasad Chaudhari's salary?", "assistant response"]`
2. Rewrites: `"What about her basic salary?"` → `"What is Prasad Chaudhari's basic salary?"`
3. Searches documents with rewritten query
4. Returns answer with document context

---

## Configuration

### Environment Variables

```bash
# Redis (required for conversation memory)
REDIS_URL=rediss://user:password@host:port

# OpenRouter (required for query rewriting)
OPENROUTER_API_KEY=your_api_key

# Qdrant (required for RAG)
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your_qdrant_key
```

### Service Configuration

**Conversation Memory**:
```python
ConversationMemoryService(
    max_turns=5,           # Keep last 5 conversation turns
    ttl_seconds=86400      # 24-hour expiration
)
```

**RAG Service**:
```python
retrieve_context(
    query="...",
    workspace_id="...",
    top_k=5,                        # Top 5 documents
    similarity_threshold=0.4,       # 40% minimum similarity
    conversation_history=[...]      # Recent conversation
)
```

---

## Testing

### Test Scenario 1: Pronoun Resolution

**Upload Document** (`employee_data.txt`):
```
Prasad Chaudhari
Position: Software Engineer
Total Salary: $120,000
Basic Salary: $80,000
Allowances: $40,000
```

**Test Conversation**:
```python
# Turn 1
User: "What is Prasad Chaudhari's salary?"
→ Query used: "What is Prasad Chaudhari's salary?"
→ Response: "Prasad Chaudhari's total salary is $120,000."

# Turn 2 (with pronoun)
User: "What about her basic salary?"
→ Rewritten: "What is Prasad Chaudhari's basic salary?"
→ Query used for RAG: "What is Prasad Chaudhari's basic salary?"
→ Response: "Prasad Chaudhari's basic salary is $80,000."
```

### Test Scenario 2: Multi-turn Context

```python
User: "Who are the software engineers?"
→ Response: "Prasad Chaudhari and John Doe are software engineers."

User: "What are their salaries?"
→ Rewritten: "What are the salaries of Prasad Chaudhari and John Doe?"
→ Response: "Prasad: $120,000, John: $110,000"

User: "Who earns more?"
→ Rewritten: "Who earns more between Prasad Chaudhari and John Doe?"
→ Response: "Prasad Chaudhari earns more."
```

### Backend Logs

```
INFO: 🧠 Contextual RAG enabled with 2 history messages
INFO: 🔄 Query rewritten: 'What about her basic salary?' → 'What is Prasad Chaudhari's basic salary?'
INFO: 🔍 RAG Search - Query: 'What is Prasad Chaudhari's basic salary?'
INFO: ✅ Query embedding generated (dim: 384)
INFO: 📚 Total chunks in workspace: 12
INFO: 🎯 Qdrant returned 3 results above threshold 0.4
INFO:   Result 1: score=0.8523, file='employee_data.txt', chunk=0
INFO:   Result 2: score=0.7891, file='employee_data.txt', chunk=1
INFO:   Result 3: score=0.6734, file='hr_policies.txt', chunk=5
INFO: ✅ Retrieved 3 relevant chunks for query
```

---

## Performance Considerations

### Query Rewriting Latency

| Operation | Latency |
|-----------|---------|
| Query Rewriting (LLM call) | ~500-1000ms |
| Embedding Generation | ~50-100ms |
| Vector Search (Qdrant) | ~20-50ms |
| **Total Overhead** | **~570-1150ms** |

**Optimization**:
- Use fast, free model (llama-3.3-8b)
- Low temperature (0.3) for quick inference
- 10-second timeout
- Fallback to original query on failure

### Memory Usage

| Component | Storage |
|-----------|---------|
| Conversation Memory (Redis) | ~1-2 KB per conversation |
| Max Turns (5) | ~500 bytes per turn |
| TTL | 24 hours (auto-cleanup) |

**Scaling**:
- 1M conversations × 2 KB = 2 GB Redis memory
- Auto-expiration keeps memory bounded
- Workspace isolation prevents leaks

---

## Limitations & Future Enhancements

### Current Limitations

1. **No Persistent Conversations**
   - Conversations expire after 24 hours
   - No long-term chat history

2. **Single Model for Rewriting**
   - Uses llama-3.3-8b for all rewrites
   - No model selection based on complexity

3. **No Multi-language Support**
   - Query rewriting works best in English
   - May struggle with non-English conversations

### Future Enhancements

1. **Database Storage** for conversations
   - Store in PostgreSQL for persistence
   - Enable conversation retrieval and export

2. **Adaptive Model Selection**
   - Use simple model for easy rewrites
   - Use GPT-4 for complex contextual queries

3. **Multi-turn RAG Optimization**
   - Cache rewritten queries
   - Batch embedding generation
   - Parallel LLM + RAG calls

4. **Conversation Analytics**
   - Track pronoun resolution success rate
   - Measure query rewrite quality
   - Monitor context relevance

---

## Troubleshooting

### Issue: Query not being rewritten

**Symptoms**:
```
INFO: RAG Search - Query: 'What about her salary?'  (original, not rewritten)
```

**Causes**:
1. OPENROUTER_API_KEY not set
2. Conversation history empty
3. LLM call failed/timeout

**Solution**:
```bash
# Check environment
echo $OPENROUTER_API_KEY

# Check logs
grep "Query rewritten" backend.log

# Verify conversation history passed
# Should see: "🧠 Contextual RAG enabled with N history messages"
```

### Issue: No conversation context

**Symptoms**:
```
INFO: RAG Search - Query: '...'  (no "Contextual RAG enabled" log)
```

**Cause**: Conversation history not extracted from messages

**Solution**:
- Ensure messages array includes previous turns
- Check that messages have correct `role` field ("user"/"assistant")

### Issue: Poor pronoun resolution

**Symptoms**: Rewritten query still contains pronouns

**Solution**:
- Increase conversation history window
- Use better model for rewriting (e.g., GPT-4)
- Improve rewrite prompt with more examples

---

## Files Modified

### New Files
1. `server/conversation_memory_service.py` - Conversation memory management

### Modified Files
1. `server/rag_service.py`:
   - Added `_rewrite_query_with_context()` method
   - Updated `retrieve_context()` to accept conversation_history
   
2. `server/llm_routes.py`:
   - Updated `augment_with_rag_context()` to extract and pass conversation history

---

## Security Considerations

1. **Workspace Isolation**
   - Conversations isolated by workspace_id
   - No cross-workspace data leakage

2. **API Key Security**
   - OpenRouter API key from environment only
   - No API keys in conversation data

3. **Data Privacy**
   - Conversations auto-expire (24h TTL)
   - No conversation data sent to external services except query rewriting

4. **Rate Limiting**
   - LLM calls have 10s timeout
   - Fallback to original query prevents blocking

---

## Conclusion

This contextual RAG implementation enables Nexus AI Hub to:

✅ Understand follow-up questions  
✅ Resolve pronouns and references  
✅ Maintain conversation context  
✅ Provide accurate document-based answers  
✅ Scale to multiple workspaces and conversations  

The system gracefully degrades when conversation memory is unavailable, ensuring reliability while maximizing contextual understanding when possible.
