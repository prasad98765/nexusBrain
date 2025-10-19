# Q&A Workspace Migration Guide

## Quick Start for Users

### What Changed?

Your Q&A system has been upgraded with workspace isolation and custom Q&A support! Here's what you need to know:

## For End Users

### New Features Available NOW:

#### 1. **Add Custom Q&A** 
You can now create your own Q&A entries!

**How to use:**
1. Navigate to **API Integration** → **Question & Answer** tab
2. Click the **"Add Q&A"** button (top right)
3. Fill in:
   - **Model**: Select which AI model this Q&A is for
   - **Question**: Enter your question (max 1000 characters)
   - **Answer**: Enter the answer (max 10,000 characters)
4. Click **"Add Q&A"**

**Use Cases:**
- Company-specific FAQs ("What is our refund policy?")
- Product documentation ("How do I configure feature X?")
- Support responses ("How to reset password?")
- Knowledge base entries ("What is our office address?")

#### 2. **Workspace Privacy**
Your Q&A entries are now completely private to your workspace!

**What this means:**
- ✅ Other workspaces cannot see your Q&A entries
- ✅ Cache hits only come from your workspace's data
- ✅ Semantic search only searches your workspace
- ✅ Enhanced security and privacy

#### 3. **Improved Cache Performance**
The caching system is now workspace-aware:

**Benefits:**
- Faster lookups (workspace-filtered keys)
- More accurate semantic matching
- Better cache hit rates
- No cross-workspace pollution

---

## For Developers

### API Changes

#### 1. New Endpoint: Create Custom Q&A

**Endpoint:** `POST /api/qa/entries`

**Headers:**
```
Authorization: Bearer <your-api-token>
Content-Type: application/json
```

**Body:**
```json
{
  "model": "openai/gpt-4o-mini",
  "question": "What is machine learning?",
  "answer": "Machine learning is a subset of artificial intelligence..."
}
```

**Response:**
```json
{
  "id": "abc123",
  "workspace_id": "workspace-uuid",
  "model": "openai/gpt-4o-mini",
  "question": "What is machine learning?",
  "answer": "Machine learning is a subset of...",
  "created_at": "2025-10-18T12:00:00",
  "updated_at": "2025-10-18T12:00:00"
}
```

#### 2. Updated Behavior: All Existing Endpoints

All Q&A endpoints now filter by workspace automatically:

- `GET /api/qa/entries` - Returns only your workspace's Q&A
- `GET /api/qa/entries/<id>` - Verifies ownership
- `PUT /api/qa/entries/<id>` - Only updates your workspace's entries
- `DELETE /api/qa/entries/<id>` - Only deletes your workspace's entries

**No code changes required** - workspace filtering is automatic!

### Cache System Changes

#### Old Cache Behavior:
```python
# This would return ANY matching cache entry from ANY workspace
cache_service.get_cached_response(request, "chat")
```

#### New Cache Behavior:
```python
# This returns ONLY your workspace's cache entries
cache_service.get_cached_response(
    request, 
    "chat",
    workspace_id="your-workspace-id"
)
```

**Note:** The system automatically extracts workspace_id from your API token - no manual passing required in API routes!

---

## Migration Checklist

### For Administrators:

- [x] ✅ **No database migration needed** - Uses existing Redis
- [x] ✅ **No downtime required** - Changes are backward compatible
- [x] ✅ **Existing cache entries still work** - Legacy format supported
- [x] ✅ **No user action required** - Automatic workspace assignment

### Post-Deployment Verification:

#### 1. Test Workspace Isolation

**Test Script:**
```bash
# As Workspace A user
curl -X POST /api/qa/entries \
  -H "Authorization: Bearer <workspace-a-token>" \
  -d '{"model":"gpt-4","question":"Test A","answer":"Answer A"}'

# As Workspace B user
curl -X POST /api/qa/entries \
  -H "Authorization: Bearer <workspace-b-token>" \
  -d '{"model":"gpt-4","question":"Test B","answer":"Answer B"}'

# Verify Workspace A only sees "Test A"
curl -X GET /api/qa/entries -H "Authorization: Bearer <workspace-a-token>"
# Should NOT contain "Test B"

# Verify Workspace B only sees "Test B"
curl -X GET /api/qa/entries -H "Authorization: Bearer <workspace-b-token>"
# Should NOT contain "Test A"
```

#### 2. Test Custom Q&A Creation

**Via UI:**
1. Login to your workspace
2. Go to API Integration → Q&A tab
3. Click "Add Q&A" button (should be enabled, not grayed out)
4. Fill form and submit
5. Verify entry appears in table

**Via API:**
```bash
curl -X POST /api/qa/entries \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4o-mini",
    "question": "What is the meaning of life?",
    "answer": "42"
  }'
```

#### 3. Test Cache Performance

**Monitor Redis:**
```bash
# Check workspace-prefixed keys are being created
redis-cli KEYS "llm_cache:ws:*"

# Should show entries like:
# llm_cache:ws:workspace-uuid:chat:abc123
# llm_cache:ws:workspace-uuid:completion:def456
```

**Check Application Logs:**
```bash
# Look for workspace-aware cache operations
tail -f logs/app.log | grep "workspace"

# Expected log messages:
# "Stored response in cache: llm_cache:ws:xxx for workspace: yyy"
# "Cache HIT (exact match): llm_cache:ws:xxx"
```

---

## Rollback Plan (If Needed)

### Emergency Rollback Steps:

**Option 1: Code Rollback**
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

**Option 2: Feature Flag**
If issues occur, you can temporarily disable workspace isolation:

```python
# In redis_cache_service.py
def _generate_cache_key(..., workspace_id: str = None):
    # Temporarily disable workspace prefix
    workspace_prefix = ""  # Changed from: f"ws:{workspace_id}:" if workspace_id else ""
    return f"llm_cache:{workspace_prefix}{endpoint_type}:{cache_key}"
```

**Note:** This is NOT recommended - only for emergency use!

---

## FAQ

### Q: Will my existing Q&A entries be lost?

**A:** No! All existing cache entries remain accessible. The system supports both old and new key formats.

### Q: Do I need to clear my Redis cache?

**A:** No! The system is backward compatible. Old entries will naturally expire (30-day TTL) and be replaced with workspace-aware entries.

### Q: Can I migrate my old cache entries to the new format?

**A:** Not necessary - the system handles both formats. However, if you want to force migration:

```bash
# Optional: Clear all cache (will be rebuilt with new format)
redis-cli FLUSHDB
# Warning: This clears ALL cache, causing temporary performance impact
```

### Q: How do I verify my workspace is isolated?

**A:** Try this test:
1. Create a custom Q&A entry
2. Ask another workspace admin to check their Q&A list
3. Your entry should NOT appear in their workspace

### Q: What happens if I use the same question in different workspaces?

**A:** Each workspace gets its own independent cache entry:
```
Workspace A: llm_cache:ws:workspace-a:chat:hash-a
Workspace B: llm_cache:ws:workspace-b:chat:hash-b
```

Both workspaces maintain separate entries even for identical questions.

### Q: Can I share Q&A entries between workspaces?

**A:** Not currently. Each workspace maintains complete isolation. This is a security feature.

**Future Enhancement:** We plan to add optional Q&A sharing with explicit permissions.

### Q: How do I bulk import Q&A entries?

**A:** Currently, you can use the API to create entries programmatically:

```python
import requests

qa_entries = [
    {"model": "gpt-4", "question": "Q1", "answer": "A1"},
    {"model": "gpt-4", "question": "Q2", "answer": "A2"},
    # ... more entries
]

for entry in qa_entries:
    response = requests.post(
        "https://your-domain.com/api/qa/entries",
        headers={"Authorization": f"Bearer {token}"},
        json=entry
    )
    print(f"Created: {response.json()['id']}")
```

### Q: How is workspace_id determined?

**A:** The workspace_id is automatically extracted from your authenticated API token. You don't need to manually specify it in requests.

```python
# Backend extracts workspace_id from token
api_token = get_api_token_from_request()
workspace_id = api_token.workspace_id  # Automatic!
```

---

## Performance Expectations

### Cache Hit Rates:

| Scenario | Expected Hit Rate |
|----------|------------------|
| Exact same question (same workspace) | 95-100% |
| Similar questions (semantic, same workspace) | 60-80% |
| Same question (different workspace) | 0% (isolated) |

### Response Times:

| Operation | Expected Time |
|-----------|---------------|
| Cache hit (exact) | < 50ms |
| Cache hit (semantic) | < 150ms |
| Cache miss | 1-5 seconds (depends on model) |
| Custom Q/A creation | < 100ms |

### Storage Impact:

**Before:** ~1 global cache namespace  
**After:** ~1 cache namespace per workspace

**Estimated Redis Memory:**
- Average Q/A entry: ~2KB
- 1000 entries: ~2MB per workspace
- 100 workspaces: ~200MB total

---

## Support

### Issues or Questions?

1. **Check Logs:**
   ```bash
   tail -f logs/app.log | grep -E "cache|workspace|qa"
   ```

2. **Redis Debug:**
   ```bash
   redis-cli INFO keyspace
   redis-cli DBSIZE
   redis-cli KEYS "llm_cache:*" | head -10
   ```

3. **Contact Support:**
   - Email: support@nexusaihub.com
   - Include: workspace_id, timestamp, error logs

### Report Issues:

**GitHub Issues:** Include:
- Workspace ID (sanitized)
- Steps to reproduce
- Expected vs actual behavior
- Relevant log snippets

---

## Success Criteria

✅ **Deployment Successful If:**

1. Custom Q&A creation works via UI
2. Q&A entries are isolated per workspace
3. No errors in application logs
4. Redis shows workspace-prefixed keys
5. Existing cache entries still accessible
6. Cache hit rates maintained or improved

---

## Next Steps

### Recommended Actions:

1. **Test custom Q&A creation** in your workspace
2. **Import your FAQs** using the new feature
3. **Monitor cache performance** over 48 hours
4. **Provide feedback** on the new functionality

### Upcoming Features:

- 📊 Workspace cache analytics
- 📤 Q&A export/import (CSV, JSON)
- 🤖 AI-powered answer suggestions
- 🔍 Advanced search and filtering
- 🏷️ Category/tag support for Q&A

---

**Deployment Date:** 2025-10-18  
**Version:** 2.0.0  
**Status:** ✅ Production Ready
