# RAG Issue Fix Summary

## 🐛 Problem
You uploaded an HR policy document and asked about "leave policy" but got **0 contexts from Qdrant**.

## 🔍 Root Cause
**Similarity threshold was too high (0.75)**

The system was only returning chunks with ≥75% similarity to your query. This is extremely strict - most production RAG systems use 0.3-0.5 for good results.

## ✅ What Was Fixed

### 1. Lowered Default Similarity Threshold: 0.75 → 0.5

Changed in 3 files:

**`server/rag_service.py`** (Line ~421)
```python
# Before
def retrieve_context(..., similarity_threshold: float = 0.75):

# After  
def retrieve_context(..., similarity_threshold: float = 0.5):
```

**`server/llm_routes.py`** (Line ~523)
```python
# Before
def augment_with_rag_context(..., threshold=0.75):

# After
def augment_with_rag_context(..., threshold=0.5):
```

**`server/rag_routes.py`** (Line ~203)
```python
# Before
threshold = data.get('threshold', 0.75)

# After
threshold = data.get('threshold', 0.5)
```

### 2. Improved Debug Logging

Enhanced embedding generation logging to avoid verbose output:
- Shows text preview (first 100 chars) instead of full text
- Confirms embedding dimension (should be 384 for all-MiniLM-L6-v2)

### 3. Created Diagnostic Tools

**`quick_rag_test.py`** - Quick diagnostic script that:
- Lists your uploaded documents
- Tests retrieval with multiple thresholds (0.0, 0.3, 0.5, 0.75)
- Shows similarity scores for each result
- Provides specific recommendations

**`RAG_TROUBLESHOOTING.md`** - Comprehensive troubleshooting guide

## 🚀 Next Steps

### Step 1: Restart Backend (Apply the fixes)

```bash
cd /Users/prasadchaudhari/Desktop/Nexus\ Ai\ Hub/nexusBrain
docker compose restart backend
```

Wait for backend to restart (~10-15 seconds).

### Step 2: Run Diagnostic Test

```bash
python3 quick_rag_test.py
```

You'll be prompted for:
1. Your Bearer token
2. Your question (default: "what is the leave policy?")

The script will show you:
- ✅ Documents in your workspace
- ✅ Similarity scores at different thresholds
- ✅ Actual retrieved text snippets

### Step 3: Interpret Results

**If you see results at threshold 0.5:**
- ✅ **Working perfectly!** The fix is applied.
- Use the default settings or specify `rag_threshold: 0.5` in chat requests.

**If you see results at threshold 0.3 but not 0.5:**
- ⚠️ **Query phrasing could be better**
- Try rephrasing: "what is the leave policy?" → "leave policy" or "annual leave"
- Or lower threshold to 0.3 in chat requests

**If you see results ONLY at threshold 0.0:**
- ⚠️ **Weak semantic match**
- Document might use very different terminology
- Try different query phrasings
- Check if document actually contains leave policy info

**If NO results even at threshold 0.0:**
- ❌ **Document not properly embedded**
- Re-upload the document
- Check backend logs for errors during upload

## 📊 Understanding Similarity Scores

| Score | Match Quality | Recommendation |
|-------|---------------|----------------|
| 0.7+ | Excellent | Very relevant, use high threshold |
| 0.5-0.7 | Good | Relevant, default threshold |
| 0.3-0.5 | Moderate | Somewhat relevant, lower threshold |
| 0.1-0.3 | Weak | Barely relevant, might be noise |
| <0.1 | Very Weak | Not relevant |

## 💡 How to Use Custom Thresholds

### In Chat Requests

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
    "rag_threshold": 0.3
  }'
```

### In Direct Search

```bash
curl -X POST http://localhost:5001/api/rag/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "leave policy",
    "top_k": 10,
    "threshold": 0.3
  }'
```

## 🔧 Backend Logs to Check

After restart, watch for these log lines:

```
INFO: Embedding model 'all-MiniLM-L6-v2' loaded successfully
INFO: Qdrant client initialized successfully
INFO: Created workspace_id index
🔍 RAG Search - Query: 'leave policy' | Workspace: xxx
📚 Total chunks in workspace: 25
📊 Search params - top_k: 5, threshold: 0.5
🎯 Qdrant returned 3 results above threshold 0.5
```

## 🎯 Expected Behavior After Fix

**Before (threshold 0.75):**
- Very strict matching
- Only near-identical text returned
- Many false negatives (missed relevant content)

**After (threshold 0.5):**
- Balanced precision/recall
- Returns semantically similar content
- Better user experience
- Standard for production RAG systems

## 📈 Performance Impact

No negative performance impact:
- ✅ Same query speed
- ✅ Same embedding quality  
- ✅ More results returned = better context for LLM
- ✅ Better user experience

## 🐛 Troubleshooting

### Issue: Still getting 0 results after restart

**Check:**
1. Backend actually restarted: `docker compose ps`
2. Logs show new threshold: Look for `threshold: 0.5` in logs
3. Document exists: Run `quick_rag_test.py` to verify

### Issue: Getting too many irrelevant results

**Solution:**
- Increase threshold back to 0.6-0.7
- Reduce `top_k` to 3 instead of 5
- Improve query phrasing to be more specific

### Issue: Different results each time

**This is normal:**
- Embeddings are deterministic
- But different queries get different scores
- Try to use consistent query phrasing

## 📚 Files Modified

1. `/server/rag_service.py` - Core RAG logic (threshold + logging)
2. `/server/llm_routes.py` - Chat integration (threshold)
3. `/server/rag_routes.py` - RAG endpoints (threshold)

## 📚 Files Created

1. `/quick_rag_test.py` - Diagnostic tool
2. `/RAG_TROUBLESHOOTING.md` - Detailed guide
3. `/RAG_FIX_SUMMARY.md` - This file

---

**Last Updated:** 2025-10-12  
**Status:** ✅ Ready to test  
**Action Required:** Restart backend and run diagnostic test
