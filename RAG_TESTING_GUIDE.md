# RAG Improvements Testing Guide

## Quick Start Testing

### Prerequisites
1. Backend running: `docker compose up backend -d`
2. Document uploaded to RAG system
3. Valid API token with Bearer format

---

## Test 1: Completions with RAG ✅

### Test Original Query Caching in Completions

```bash
# First request - Cache MISS
curl -X POST http://localhost:5001/api/v1/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "prompt": "What is the company leave policy?",
    "max_tokens": 100,
    "use_rag": true,
    "rag_top_k": 5,
    "rag_threshold": 0.3,
    "is_cached": true
  }'
```

**Expected Result:**
- ✅ RAG contexts retrieved from Qdrant
- ✅ Prompt augmented with document contexts
- ✅ Response from OpenRouter
- ✅ Backend logs show "Cache MISS"

```bash
# Second request - Same question, Cache HIT
curl -X POST http://localhost:5001/api/v1/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "prompt": "What is the company leave policy?",
    "max_tokens": 100,
    "use_rag": true,
    "rag_top_k": 5,
    "rag_threshold": 0.3,
    "is_cached": true
  }'
```

**Expected Result:**
- ✅ Backend logs show "Cache HIT"
- ✅ Same response as first request
- ✅ Much faster response time
- ✅ **Original query** was cached (not augmented version)

---

## Test 2: Chat with RAG System Prompt ✅

### Test RAG as System Message

```bash
# Test chat completion with RAG
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [
      {"role": "user", "content": "What is the annual leave entitlement?"}
    ],
    "use_rag": true,
    "rag_top_k": 5,
    "rag_threshold": 0.3,
    "is_cached": true
  }'
```

**Expected Result:**
- ✅ RAG contexts added as **system message**
- ✅ Original messages cached (without RAG context)
- ✅ Response includes information from documents

**Verify in Backend Logs:**
```
INFO: RAG augmentation enabled (mode=system)
INFO: Found 3 RAG contexts
INFO: Augmented messages with 3 RAG contexts (mode=system)
```

---

## Test 3: Document Contexts Logging ✅

### Verify document_contexts Field

After running the above tests, check the database:

```sql
SELECT 
  id, 
  endpoint, 
  model, 
  cached, 
  cache_type, 
  document_contexts,
  created_at
FROM api_usage_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Result:**
```
| endpoint          | cached | cache_type | document_contexts |
|-------------------|--------|------------|-------------------|
| /v1/create        | false  | null       | true              |
| /v1/create        | true   | exact      | true              |
| /v1/chat/create   | false  | null       | true              |
```

---

## Test 4: UI Verification ✅

### Check Usage Logs Page

1. **Navigate to Usage Logs**: http://localhost:5173/usage-logs

2. **Verify Table Display:**
   - ✅ New "RAG" column visible
   - ✅ Purple badge "📚 RAG" for RAG-enabled requests
   - ✅ "-" badge for non-RAG requests

3. **Click "View Details" on a RAG request:**
   - ✅ "Caching & RAG Information" section
   - ✅ "RAG Context: Used" badge visible

4. **Verify Non-RAG Request:**
   - ✅ "RAG Context: Not Used" badge

---

## Test 5: Cache Effectiveness ✅

### Test Same Query, Different Retrieved Docs

```bash
# First: Upload a document
curl -X POST http://localhost:5001/api/rag/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@HR_Policy_v1.pdf"

# Query 1: First request
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [{"role": "user", "content": "leave policy"}],
    "use_rag": true,
    "is_cached": true
  }'

# Upload another version with different content
curl -X POST http://localhost:5001/api/rag/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@HR_Policy_v2.pdf"

# Query 2: Same question (might retrieve different docs)
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [{"role": "user", "content": "leave policy"}],
    "use_rag": true,
    "is_cached": true
  }'
```

**Expected Result:**
- ✅ Query 2 gets **Cache HIT** even if different docs retrieved
- ✅ Proves original query caching works correctly

---

## Test 6: Streaming with RAG ✅

### Test Streaming Completion

```bash
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "model": "openai/gpt-4",
    "messages": [{"role": "user", "content": "What are the sick leave rules?"}],
    "stream": true,
    "use_rag": true,
    "rag_top_k": 5,
    "rag_threshold": 0.3,
    "is_cached": true
  }'
```

**Expected Result:**
- ✅ Streaming chunks received
- ✅ RAG contexts used in generation
- ✅ After completion, response cached with **original messages**
- ✅ `document_contexts: true` logged

---

## Test 7: Backend Logs Verification ✅

### Check Logs for Correct Behavior

**Start watching logs:**
```bash
docker compose logs -f backend | grep -E "RAG|Cache|document_contexts"
```

**Expected Log Output:**
```
INFO: RAG augmentation enabled (mode=system). Last user message: What is the leave policy?
INFO: 🔍 RAG Search - Query: 'What is the leave policy?' | Workspace: abc123
INFO: 📚 Total chunks in workspace: 45
INFO: 📊 Search params - top_k: 5, threshold: 0.3
INFO: 🎯 Qdrant returned 3 results above threshold 0.3
INFO: Found 3 RAG contexts
INFO: Augmented messages with 3 RAG contexts (mode=system)
INFO: Cache MISS for chat model: openai/gpt-4 - forwarding to OpenRouter
INFO: Stored chat response in cache for model: openai/gpt-4
INFO: Logged API usage (background) - Cached: False, document_contexts: True
```

---

## Test 8: Error Handling ✅

### Test RAG with No Documents

```bash
# Delete all documents first
curl -X DELETE http://localhost:5001/api/rag/documents/FILENAME \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Try to query with RAG
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [{"role": "user", "content": "What is the policy?"}],
    "use_rag": true
  }'
```

**Expected Result:**
- ✅ Request succeeds (RAG gracefully degraded)
- ✅ No contexts retrieved
- ✅ Original messages sent to OpenRouter
- ✅ `document_contexts: false` logged
- ✅ Backend logs: "No RAG contexts found for query"

---

## Test 9: Different Thresholds ✅

### Test Threshold Impact

```bash
# High threshold (strict)
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [{"role": "user", "content": "leave"}],
    "use_rag": true,
    "rag_threshold": 0.8
  }'

# Low threshold (permissive)
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [{"role": "user", "content": "leave"}],
    "use_rag": true,
    "rag_threshold": 0.2
  }'
```

**Expected Result:**
- ✅ High threshold: Fewer or no contexts
- ✅ Low threshold: More contexts
- ✅ Both cached separately (same original query)

---

## Test 10: Migration Verification ✅

### Verify Database Column

```bash
# Connect to PostgreSQL
docker compose exec db psql -U nexus -d nexusbrain

# Check column exists
\d api_usage_logs

# Check data
SELECT document_contexts, COUNT(*) 
FROM api_usage_logs 
GROUP BY document_contexts;
```

**Expected Result:**
```
 document_contexts | count
-------------------+-------
 f                 |   150
 t                 |    25
```

---

## Performance Benchmarks

### Measure Cache Improvement

```bash
# Test script
for i in {1..10}; do
  echo "Request $i:"
  time curl -X POST http://localhost:5001/api/v1/chat/create \
    -H "Authorization: Bearer YOUR_TOKEN_HERE" \
    -H "Content-Type: application/json" \
    -d '{
      "model": "openai/gpt-3.5-turbo",
      "messages": [{"role": "user", "content": "What is the leave policy?"}],
      "use_rag": true,
      "is_cached": true
    }' > /dev/null 2>&1
  sleep 1
done
```

**Expected Results:**
- Request 1: ~2-5 seconds (Cache MISS + OpenRouter call)
- Request 2-10: ~50-200ms (Cache HIT from Redis)

---

## Troubleshooting

### Issue: No RAG contexts retrieved

**Check:**
1. Documents uploaded:
   ```bash
   curl http://localhost:5001/api/rag/documents \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

2. Lower threshold:
   ```json
   {"rag_threshold": 0.0}
   ```

3. Run diagnostic:
   ```bash
   python quick_rag_test.py
   ```

### Issue: Cache not working

**Check:**
1. Redis connection:
   ```bash
   docker compose exec backend python -c "from server.redis_cache_service import get_cache_service; print(get_cache_service().redis_client.ping())"
   ```

2. `is_cached: true` in request

3. Check cache stats:
   ```bash
   curl http://localhost:5001/api/v1/cache/stats \
     -H "Authorization: Bearer YOUR_TOKEN_HERE"
   ```

### Issue: UI not showing RAG badge

**Check:**
1. Hard refresh: Ctrl+Shift+R
2. Check backend response includes `document_contexts`
3. Verify TypeScript schema updated

---

## Success Criteria

✅ All tests pass  
✅ No errors in backend logs  
✅ UI displays RAG badge correctly  
✅ Cache hit rate improved  
✅ Database migration successful  
✅ Performance within acceptable range  

---

**Last Updated**: 2025-10-12  
**Status**: Ready for Testing
