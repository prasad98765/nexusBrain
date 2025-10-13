# RAG Troubleshooting Guide

## Problem: Getting 0 contexts from Qdrant

You uploaded an HR policy document and are asking about "leave policy" but getting 0 results.

### Most Common Cause: **Similarity Threshold Too High**

The default threshold was set to **0.75 (75% similarity)**, which is very strict. Most production RAG systems use **0.3-0.5** for good results.

---

## ✅ What I Fixed

1. **Lowered default threshold from 0.75 → 0.5** in:
   - `server/rag_service.py` - `retrieve_context()` method
   - `server/llm_routes.py` - `augment_with_rag_context()` function
   - `server/rag_routes.py` - `/rag/search` endpoint

2. **Created diagnostic tool**: `quick_rag_test.py`

---

## 🔍 How to Diagnose

### Option 1: Run the Quick Test Script (Recommended)

```bash
python3 quick_rag_test.py
```

This will:
- ✅ List your uploaded documents
- ✅ Test retrieval with thresholds: 0.0, 0.3, 0.5, 0.75
- ✅ Show similarity scores for each result
- ✅ Give you specific recommendations

### Option 2: Use the Debug Endpoint via curl

```bash
curl -X POST http://localhost:5001/api/rag/debug \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "what is the leave policy?",
    "top_k": 10,
    "threshold": 0.0
  }'
```

### Option 3: Check Backend Logs

Look for lines starting with:
- 🔍 RAG Search
- 📚 Total chunks in workspace
- 📊 Search params
- 📈 Best available scores

---

## 🎯 Understanding Similarity Scores

| Score Range | Meaning | Action |
|-------------|---------|--------|
| **0.8 - 1.0** | Excellent match | Use threshold 0.7+ |
| **0.6 - 0.8** | Good match | Use threshold 0.5-0.6 |
| **0.4 - 0.6** | Moderate match | Use threshold 0.3-0.5 |
| **0.2 - 0.4** | Weak match | Lower threshold or rephrase query |
| **0.0 - 0.2** | Very weak match | Document may not contain relevant info |

---

## 💡 Solutions

### If you get results at threshold 0.0 but not 0.75:

**The threshold is too high!** You have two options:

#### Option A: Lower threshold in chat requests (Recommended)

When calling the chat API, specify a lower threshold:

```json
{
  "model": "openai/gpt-4",
  "messages": [{"role": "user", "content": "What is the leave policy?"}],
  "use_rag": true,
  "rag_top_k": 5,
  "rag_threshold": 0.3
}
```

#### Option B: Update default threshold (Already done!)

I've already lowered the default from 0.75 → 0.5. Restart your backend:

```bash
docker compose restart backend
```

### If you get NO results even at threshold 0.0:

This means the document wasn't properly embedded. Try:

1. **Re-upload the document** via the UI
2. **Check backend logs** for embedding errors
3. **Verify Qdrant connection**: Check if `QDRANT_API_KEY` is set correctly

---

## 🚀 Quick Fix to Try Right Now

1. **Restart backend** to apply new default threshold:
   ```bash
   docker compose restart backend
   ```

2. **Test in your chat**:
   ```bash
   curl -X POST http://localhost:5001/api/v1/chat/create \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "openai/gpt-4",
       "messages": [{"role": "user", "content": "What is the company leave policy?"}],
       "use_rag": true,
       "rag_top_k": 5,
       "rag_threshold": 0.3
     }'
   ```

3. **Check results** - you should now see contexts being retrieved!

---

## 📊 Expected Behavior After Fix

With the new default threshold of **0.5**:

- ✅ More relevant results will be returned
- ✅ Better balance between precision and recall
- ✅ Works well for most semantic search use cases

---

## 🔧 Advanced: Custom Thresholds per Use Case

You can fine-tune the threshold based on your needs:

| Use Case | Recommended Threshold |
|----------|----------------------|
| **Strict factual retrieval** | 0.6 - 0.7 |
| **General Q&A** | 0.4 - 0.5 |
| **Exploratory search** | 0.2 - 0.3 |
| **Testing/debugging** | 0.0 |

---

## 📝 Example: Testing Different Queries

Try these queries with different phrasings to see how similarity changes:

```python
queries = [
    "what is the leave policy?",              # Direct question
    "leave policy",                           # Keywords only
    "how many days of vacation can I take?",  # Indirect phrasing
    "annual leave entitlement",               # Formal phrasing
    "PTO policy"                              # Acronym
]
```

Each will have different similarity scores depending on how your document is written.

---

## 🐛 Still Not Working?

If you've tried everything above:

1. **Check the embedding model is loaded**:
   - Look for: `INFO: Embedding model 'all-MiniLM-L6-v2' loaded successfully`

2. **Verify document was chunked**:
   - Upload response should show: `"chunks": 15` (or some number > 0)

3. **Test Qdrant connection**:
   ```python
   from server.rag_service import rag_service
   print(rag_service.qdrant_client)  # Should not be None
   ```

4. **Check workspace_id matches**:
   - Ensure you're querying with the same workspace_id used during upload

---

## 📚 Additional Resources

- [Qdrant Documentation](https://qdrant.tech/documentation/)
- [Sentence Transformers](https://www.sbert.net/)
- [Understanding Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity)

---

**Created:** 2025-10-12  
**Last Updated:** After threshold fix from 0.75 → 0.5
