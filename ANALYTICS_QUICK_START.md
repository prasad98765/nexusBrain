# Analytics Dashboard - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- ✅ Backend server running (Flask)
- ✅ Frontend client running (React)
- ✅ Database with `api_usage_logs` table
- ✅ User authentication working

---

## Step 1: Verify Backend is Running

```bash
# Test if analytics endpoints are registered
curl http://localhost:5000/api/analytics/overview?start_date=2025-10-01T00:00:00Z&end_date=2025-10-23T23:59:59Z \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "total_requests": 0,
  "total_tokens": 0,
  "total_cost_usd": 0,
  "avg_latency_ms": 0,
  "cache_hit_rate": 0,
  "rag_usage_rate": 0,
  "error_rate": 0
}
```

✅ If you see this JSON, backend is working!

---

## Step 2: Access the Dashboard

1. **Navigate to**: `http://localhost:5173` (or your frontend URL)
2. **Login** with your credentials
3. **Go to**: API Integrations page
4. **Click**: "Analytics" tab (third tab)

You should now see the Analytics Dashboard!

---

## Step 3: Select Date Range

1. Click the **first date picker** (From date)
2. Select a date with usage data (e.g., last 30 days)
3. Click the **second date picker** (To date)
4. Select today's date
5. Or use **quick presets**: 7 days, 30 days, or 90 days

---

## Step 4: Explore the Dashboard

### Overview Cards
- **Total Requests**: See how many API calls you made
- **Total Tokens**: Check token consumption
- **Total Cost**: Monitor spending
- **Avg Latency**: Track performance
- **Cache Hit Rate**: See caching effectiveness
- **RAG Usage Rate**: Monitor RAG usage
- **Error Rate**: Track failures

### Charts
- **Usage Trends**: Line chart showing requests/tokens over time
- **Cost Trends**: See spending patterns
- **Top Models**: Bar chart of most used models
- **Provider Distribution**: Pie chart of provider costs

### Tables
- **Top Errors**: Most common error messages
- **Slowest Models**: Identify performance bottlenecks
- **Endpoint Usage**: See which endpoints are used most

### Filters
- **Interval**: Switch between daily, weekly, monthly views
- **Provider**: Filter by OpenAI, Anthropic, Google
- **Cached Only**: See only cached requests
- **RAG Only**: See only RAG queries

---

## Step 5: Export Data

Click the **"Export CSV"** button in the top-right to download all analytics data for the selected date range.

---

## 🧪 Testing the Implementation

### Backend Tests

```bash
# Install pytest
pip install pytest

# Run all analytics tests
cd server
pytest tests/test_analytics_routes.py -v

# Run specific endpoint test
pytest tests/test_analytics_routes.py::TestAnalyticsOverview -v
```

**Expected Output**:
```
test_analytics_routes.py::TestAnalyticsOverview::test_overview_success PASSED
test_analytics_routes.py::TestAnalyticsOverview::test_overview_missing_dates PASSED
test_analytics_routes.py::TestAnalyticsOverview::test_overview_no_data PASSED
...
======================== 40 passed in 5.23s ========================
```

---

## 🔧 Troubleshooting

### Issue: No data showing in charts

**Solution**:
1. Check date range includes data
2. Verify `api_usage_logs` table has records
3. Check filters aren't too restrictive
4. Look at browser console for errors

**SQL Check**:
```sql
SELECT COUNT(*) FROM api_usage_logs 
WHERE created_at BETWEEN '2025-10-01' AND '2025-10-23';
```

---

### Issue: Charts not loading

**Solution**:
1. Open browser DevTools (F12)
2. Check Network tab for API calls
3. Verify calls return 200 status
4. Check Console for JavaScript errors

**Common Fix**:
- Clear browser cache
- Refresh page (Ctrl+R)
- Check React Query DevTools

---

### Issue: Export CSV fails

**Solution**:
1. Check row count < 10,000
2. Verify server has write permissions
3. Check browser allows downloads

**SQL Check**:
```sql
SELECT COUNT(*) FROM api_usage_logs 
WHERE created_at BETWEEN '2025-10-01' AND '2025-10-23';
-- If > 10,000, reduce date range
```

---

### Issue: 401 Unauthorized errors

**Solution**:
1. Verify you're logged in
2. Check auth token in localStorage
3. Try logging out and back in

**Browser Console Check**:
```javascript
localStorage.getItem('auth_token')
// Should return a token string
```

---

### Issue: Slow loading

**Solution**:
1. Reduce date range (try 7 or 30 days)
2. Use weekly/monthly interval instead of daily
3. Clear filters
4. Check database has indexes

**Recommended Indexes**:
```sql
CREATE INDEX idx_api_usage_created_at ON api_usage_logs(created_at);
CREATE INDEX idx_api_usage_workspace ON api_usage_logs(workspace_id);
```

---

## 📊 Sample Data Generation

If you have no usage data, generate sample data for testing:

```python
# Run in Python shell
from server.app import create_app
from server.models import db, ApiUsageLog, ApiToken, Workspace
from datetime import datetime, timedelta
import random

app = create_app()
with app.app_context():
    # Get your token and workspace IDs
    token = ApiToken.query.first()
    workspace = Workspace.query.first()
    
    # Generate 100 sample logs
    for i in range(100):
        log = ApiUsageLog(
            token_id=token.id,
            workspace_id=workspace.id,
            endpoint='/chat/completions',
            model=random.choice(['gpt-4', 'gpt-4o-mini', 'claude-3']),
            provider=random.choice(['OpenAI', 'Anthropic']),
            status_code=random.choice([200] * 9 + [400]),  # 90% success
            tokens_used=random.randint(100, 1000),
            prompt_tokens=random.randint(50, 500),
            completion_tokens=random.randint(50, 500),
            usage=random.uniform(0.001, 0.1),
            response_time_ms=random.randint(100, 500),
            cached=random.choice([True, False]),
            cache_type=random.choice(['exact', 'semantic', None]),
            document_contexts=random.choice([True, False]),
            created_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
        )
        db.session.add(log)
    
    db.session.commit()
    print("✅ Generated 100 sample usage logs")
```

---

## 🎯 Common Use Cases

### 1. Monitor Daily Costs

**Steps**:
1. Set date range to last 30 days
2. Set interval to "Daily"
3. Look at "Cost Trends" chart
4. Identify cost spikes

**Insight**: See which days had highest spending

---

### 2. Compare Model Performance

**Steps**:
1. Look at "Top Models" bar chart
2. Click on "Slowest Models" table
3. Compare latency vs usage

**Insight**: Identify if expensive models are faster

---

### 3. Optimize Cache Hit Rate

**Steps**:
1. Check current cache hit rate in overview
2. Enable "Cached Only" filter
3. Look at caching performance card
4. Compare exact vs semantic hits

**Insight**: See if semantic caching is effective

---

### 4. Track Error Rates

**Steps**:
1. Check error rate in overview
2. Look at "Top Errors" table
3. Set interval to daily
4. Check if errors are increasing

**Insight**: Identify and fix recurring issues

---

### 5. Analyze RAG Usage

**Steps**:
1. Enable "RAG Only" filter
2. Look at RAG usage rate
3. Compare token usage (RAG vs non-RAG)
4. Check latency impact

**Insight**: Understand cost/benefit of RAG

---

## 🔐 Security Best Practices

### 1. Authentication Required
All analytics endpoints require authentication. Never disable `@require_auth`.

### 2. Workspace Isolation
Filter by workspace_id to ensure users only see their data:

```python
# In analytics_routes.py
if params.get('workspace_id'):
    query = query.filter(ApiUsageLog.workspace_id == params['workspace_id'])
```

### 3. Rate Limiting
Consider adding rate limiting to analytics endpoints:

```python
from flask_limiter import Limiter

limiter = Limiter(app, key_func=get_remote_address)

@analytics_routes.route("/analytics/overview")
@limiter.limit("100 per hour")
@require_auth
def get_overview():
    # ... endpoint logic
```

---

## 📝 API Quick Reference

### All Endpoints
```
GET /api/analytics/overview          - Summary statistics
GET /api/analytics/trends            - Time series data
GET /api/analytics/models            - Model breakdown
GET /api/analytics/providers         - Provider comparison
GET /api/analytics/errors            - Error statistics
GET /api/analytics/caching           - Cache performance
GET /api/analytics/rag               - RAG statistics
GET /api/analytics/endpoints         - Endpoint usage
GET /api/analytics/user_agents       - Client stats
GET /api/analytics/performance       - Performance metrics
GET /api/analytics/ip                - IP statistics
GET /api/analytics/export            - CSV export
```

### Common Query Parameters
```
start_date     - ISO date (required)
end_date       - ISO date (required)
interval       - day|week|month
workspace_id   - Workspace ID
provider       - Provider name
model          - Model name
cached         - true|false
rag            - true|false
```

### Example Request
```bash
curl "http://localhost:5000/api/analytics/overview?\
start_date=2025-10-01T00:00:00Z&\
end_date=2025-10-23T23:59:59Z&\
provider=OpenAI&\
cached=true" \
-H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Customization Tips

### Change Date Presets

Edit `analytics-dashboard.tsx`:

```typescript
// Change from 7, 30, 90 days to custom values
<Button onClick={() => setDateRange({ from: subDays(new Date(), 14), to: new Date() })}>
  14 days
</Button>
<Button onClick={() => setDateRange({ from: subDays(new Date(), 60), to: new Date() })}>
  60 days
</Button>
```

### Add New Metric Card

```typescript
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">Your Metric</CardTitle>
    <YourIcon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {overview?.your_metric || 0}
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      Description
    </p>
  </CardContent>
</Card>
```

### Change Chart Colors

```typescript
const COLORS = [
  '#8b5cf6',  // Purple
  '#06b6d4',  // Cyan
  '#10b981',  // Green
  '#f59e0b',  // Amber
  '#ef4444',  // Red
  '#ec4899'   // Pink
];
```

---

## 📚 Additional Resources

### Documentation
- Full API Documentation: `ANALYTICS_DASHBOARD_README.md`
- Visual Guide: `ANALYTICS_VISUAL_GUIDE.md`
- Implementation Summary: `ANALYTICS_IMPLEMENTATION_SUMMARY.md`

### Code Files
- Backend API: `/server/analytics_routes.py`
- Frontend Dashboard: `/client/src/pages/analytics-dashboard.tsx`
- Tests: `/server/tests/test_analytics_routes.py`

### Support
- Check test files for usage examples
- Review browser console for errors
- Check backend logs for API issues

---

## ✅ Verification Checklist

Before using in production:

- [ ] All 12 endpoints return data
- [ ] Authentication works correctly
- [ ] Date filters work properly
- [ ] Charts render without errors
- [ ] Tables show data correctly
- [ ] Export CSV downloads successfully
- [ ] Filters update data correctly
- [ ] Loading states display properly
- [ ] Empty states show when no data
- [ ] Mobile responsive layout works
- [ ] Tests pass (pytest)
- [ ] Database indexes created
- [ ] Performance is acceptable
- [ ] Error handling works

---

## 🎉 Success Criteria

You've successfully set up the Analytics Dashboard when:

✅ You can see overview cards with real data
✅ Charts display usage and cost trends
✅ Tables show errors and performance metrics
✅ Filters update the dashboard correctly
✅ CSV export downloads your data
✅ Backend tests all pass
✅ No console errors in browser

---

**Congratulations!** 🎊

You now have a fully functional Analytics Dashboard for tracking LLM usage, costs, performance, and more!

---

**Quick Start Guide Version**: 1.0.0
**Last Updated**: October 23, 2025
**Estimated Setup Time**: 5 minutes
