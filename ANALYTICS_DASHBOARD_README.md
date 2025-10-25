# Analytics Dashboard - Complete Implementation Guide

## Overview

The Analytics Dashboard provides comprehensive insights into LLM usage, cost, performance, caching, RAG usage, and error tracking based on the `api_usage_logs` database table.

## Architecture

### Backend (Python/Flask)
- **Location**: `/server/analytics_routes.py`
- **Blueprint**: `analytics_routes`
- **Prefix**: `/api/analytics`
- **Authentication**: All endpoints require `@require_auth` decorator

### Frontend (React/TypeScript)
- **Location**: `/client/src/pages/analytics-dashboard.tsx`
- **Integration**: Added as third tab in API Integrations page
- **Charts**: Using Recharts library for visualizations
- **State Management**: React Query for data fetching and caching

---

## Backend API Endpoints

### 1. Overview Statistics
**GET** `/api/analytics/overview`

Returns summary statistics for the selected period.

**Query Parameters**:
- `start_date` (required): ISO date string
- `end_date` (required): ISO date string
- `workspace_id` (optional): Filter by workspace
- `provider` (optional): Filter by provider (OpenAI, Anthropic, etc.)
- `model` (optional): Filter by specific model
- `cached` (optional): Filter cached responses (true/false)
- `rag` (optional): Filter RAG queries (true/false)

**Response**:
```json
{
  "total_requests": 5230,
  "total_tokens": 1423000,
  "total_prompt_tokens": 920000,
  "total_completion_tokens": 503000,
  "avg_tokens_per_request": 272,
  "total_cost_usd": 75.20,
  "avg_latency_ms": 180,
  "cache_hit_rate": 0.32,
  "rag_usage_rate": 0.14,
  "error_rate": 0.05
}
```

---

### 2. Trends Over Time
**GET** `/api/analytics/trends`

Returns time-series data for requests, tokens, cost, and errors.

**Query Parameters**:
- All common filters (see Overview)
- `interval` (optional): day|week|month (default: day)

**Response**:
```json
[
  {
    "date": "2025-10-01T00:00:00",
    "requests": 110,
    "tokens": 32000,
    "cost_usd": 1.8,
    "errors": 2
  },
  {
    "date": "2025-10-02T00:00:00",
    "requests": 120,
    "tokens": 35000,
    "cost_usd": 1.9,
    "errors": 0
  }
]
```

---

### 3. Models Breakdown
**GET** `/api/analytics/models`

Returns usage breakdown by model.

**Response**:
```json
[
  {
    "model": "gpt-4",
    "requests": 2200,
    "tokens": 820000,
    "cost_usd": 40.5,
    "avg_latency_ms": 230
  },
  {
    "model": "gpt-4o-mini",
    "requests": 3030,
    "tokens": 600000,
    "cost_usd": 34.7,
    "avg_latency_ms": 150
  }
]
```

---

### 4. Providers Comparison
**GET** `/api/analytics/providers`

Returns usage comparison by provider.

**Response**:
```json
[
  {
    "provider": "OpenAI",
    "requests": 4000,
    "tokens": 1200000,
    "cost_usd": 55.4
  },
  {
    "provider": "Anthropic",
    "requests": 1200,
    "tokens": 223000,
    "cost_usd": 19.8
  }
]
```

---

### 5. Error Statistics
**GET** `/api/analytics/errors`

Returns error rates and top error messages.

**Response**:
```json
{
  "error_rate": 0.04,
  "top_errors": [
    {
      "message": "Rate limit exceeded",
      "count": 12
    },
    {
      "message": "Invalid API key",
      "count": 8
    }
  ],
  "avg_error_latency_ms": 300
}
```

---

### 6. Caching Statistics
**GET** `/api/analytics/caching`

Returns cache hit/miss stats and performance comparison.

**Response**:
```json
{
  "cache_hit_rate": 0.29,
  "exact_cache_hits": 210,
  "semantic_cache_hits": 120,
  "non_cached_requests": 800,
  "avg_latency_cached": 150,
  "avg_latency_uncached": 230,
  "token_savings": 54000
}
```

---

### 7. RAG Usage Statistics
**GET** `/api/analytics/rag`

Returns RAG usage and performance comparison.

**Response**:
```json
{
  "rag_query_count": 340,
  "rag_usage_rate": 0.14,
  "avg_tokens_rag": 320,
  "avg_tokens_non_rag": 290,
  "avg_latency_rag": 220,
  "avg_latency_non_rag": 180
}
```

---

### 8. Endpoint Statistics
**GET** `/api/analytics/endpoints`

Returns usage by API endpoint.

**Response**:
```json
[
  {
    "endpoint": "/chat/completions",
    "requests": 3000,
    "tokens": 900000,
    "cost_usd": 40.1
  },
  {
    "endpoint": "/completions",
    "requests": 2000,
    "tokens": 523000,
    "cost_usd": 22.4
  }
]
```

---

### 9. User Agent Statistics
**GET** `/api/analytics/user_agents`

Returns client usage by user agent.

**Response**:
```json
[
  {
    "user_agent": "curl/8.5.0",
    "requests": 300
  },
  {
    "user_agent": "LangflowSDK/1.2",
    "requests": 700
  }
]
```

---

### 10. Performance Insights
**GET** `/api/analytics/performance`

Returns latency and throughput statistics.

**Response**:
```json
{
  "avg_response_time_ms": 210,
  "avg_first_token_latency": 1.4,
  "avg_throughput": 50.2,
  "slowest_models": [
    {
      "model": "gpt-4",
      "avg_latency": 290
    },
    {
      "model": "claude-3",
      "avg_latency": 260
    }
  ]
}
```

---

### 11. IP Address Statistics
**GET** `/api/analytics/ip`

Returns usage by IP address.

**Response**:
```json
[
  {
    "ip_address": "192.168.1.10",
    "requests": 80
  },
  {
    "ip_address": "10.0.0.5",
    "requests": 140
  }
]
```

---

### 12. Export to CSV
**GET** `/api/analytics/export`

Exports analytics data as CSV file (limited to 10,000 rows).

**Response**: CSV file download

**Headers**:
- Created At, Endpoint, Model, Provider, Status Code
- Tokens Used, Prompt Tokens, Completion Tokens
- Cost USD, Response Time MS, Cached, Cache Type
- RAG Used, Error Message, IP Address, User Agent

---

## Frontend Components

### Analytics Dashboard Features

1. **Date Range Picker**
   - Custom date range selection
   - Quick presets: 7 days, 30 days, 90 days
   - Displays "from" and "to" dates

2. **Filters**
   - Interval: Daily, Weekly, Monthly
   - Provider filter: All, OpenAI, Anthropic, Google
   - Cached only toggle
   - RAG only toggle

3. **Overview Cards** (7 cards)
   - Total Requests
   - Total Tokens (with avg per request)
   - Total Cost (USD)
   - Average Latency
   - Cache Hit Rate
   - RAG Usage Rate
   - Error Rate

4. **Charts**
   - **Usage Trends**: Line chart showing requests and tokens over time
   - **Cost Trends**: Line chart showing spending over time
   - **Top Models**: Bar chart showing usage by model
   - **Provider Distribution**: Pie chart showing cost distribution

5. **Tables**
   - **Top Errors**: Most frequent error messages
   - **Slowest Models**: Models with highest latency
   - **Endpoint Usage**: Request/token/cost breakdown by endpoint

6. **Additional Stats**
   - Caching performance card with 4 metrics
   - Export CSV button

### Component Structure

```typescript
import AnalyticsDashboard from './analytics-dashboard';

// Added as third tab in api-integrations.tsx
<TabsTrigger value="analytics">Analytics</TabsTrigger>
<TabsContent value="analytics">
  <AnalyticsDashboard />
</TabsContent>
```

---

## Testing

### Test File
**Location**: `/server/tests/test_analytics_routes.py`

### Test Coverage

1. **TestAnalyticsOverview**
   - Success with data
   - Missing date parameters
   - No data in range

2. **TestAnalyticsTrends**
   - Daily interval
   - Weekly interval
   - Monthly interval

3. **TestAnalyticsModels**
   - Model breakdown
   - Filter by specific model

4. **TestAnalyticsProviders**
   - Provider comparison

5. **TestAnalyticsErrors**
   - Error statistics

6. **TestAnalyticsCaching**
   - Caching stats

7. **TestAnalyticsRAG**
   - RAG statistics

8. **TestAnalyticsEndpoints**
   - Endpoint usage stats

9. **TestAnalyticsUserAgents**
   - User agent stats

10. **TestAnalyticsPerformance**
    - Performance metrics

11. **TestAnalyticsIP**
    - IP statistics

12. **TestAnalyticsExport**
    - CSV export

13. **TestAnalyticsFilters**
    - Workspace filter
    - Provider filter
    - Cached filter
    - RAG filter

### Running Tests

```bash
# Install pytest if not already installed
pip install pytest

# Run all analytics tests
pytest server/tests/test_analytics_routes.py -v

# Run specific test class
pytest server/tests/test_analytics_routes.py::TestAnalyticsOverview -v

# Run with coverage
pytest server/tests/test_analytics_routes.py --cov=server.analytics_routes
```

---

## Database Schema

### ApiUsageLog Model Fields Used

```python
- id: Primary key
- token_id: Foreign key to ApiToken
- workspace_id: Foreign key to Workspace
- endpoint: API endpoint path
- model: Model name (e.g., gpt-4)
- model_permaslug: Detailed model version
- provider: Provider name (e.g., OpenAI)
- method: HTTP method
- status_code: Response status code
- tokens_used: Total tokens
- prompt_tokens: Input tokens
- completion_tokens: Output tokens
- reasoning_tokens: Reasoning tokens
- usage: Cost in USD
- byok_usage_inference: BYOK cost
- requests: Request count
- generation_id: OpenRouter generation ID
- finish_reason: Completion reason
- first_token_latency: Time to first token (seconds)
- throughput: Tokens per second
- response_time_ms: Total response time (milliseconds)
- error_message: Error message if failed
- ip_address: Client IP
- user_agent: Client user agent
- cached: Whether cached
- cache_type: "exact" or "semantic"
- document_contexts: Whether RAG was used
- created_at: Timestamp
```

---

## Usage Examples

### Frontend Usage

```typescript
// Fetch overview data
const { data: overview } = useQuery({
  queryKey: ['analytics-overview', queryParams],
  queryFn: async () => {
    const response = await axios.get(
      `/api/analytics/overview?${queryParams}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },
});

// Export CSV
const handleExport = async () => {
  const response = await axios.get(
    `/api/analytics/export?${queryParams}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    }
  );
  // Download file
};
```

### Backend Query Example

```python
from server.analytics_routes import build_base_query

# Build query with filters
params = {
    'start_date': '2025-10-01T00:00:00Z',
    'end_date': '2025-10-31T23:59:59Z',
    'provider': 'OpenAI',
    'cached': 'true'
}

query = build_base_query(params)
results = query.all()
```

---

## Performance Considerations

1. **Date Range Limits**: Queries are optimized for ranges up to 90 days
2. **Caching**: React Query caches results for 5 minutes
3. **Export Limit**: CSV export limited to 10,000 rows
4. **Aggregation**: Uses SQLAlchemy func.sum(), func.count(), func.avg()
5. **Indexing**: Recommended indexes on:
   - `created_at`
   - `workspace_id`
   - `provider`
   - `model`
   - `cached`
   - `document_contexts`

---

## Configuration

### Environment Variables

None required - uses existing authentication and database configuration.

### Dependencies

**Backend**:
- Flask
- SQLAlchemy
- Python CSV module

**Frontend**:
- React Query (@tanstack/react-query)
- Recharts (already installed)
- date-fns
- axios
- Shadcn UI components

---

## Error Handling

### Backend
- Missing date parameters: 400 Bad Request
- Invalid date format: 400 Bad Request
- Database errors: 500 Internal Server Error
- Unauthorized: 401 Unauthorized

### Frontend
- Loading states for all queries
- Empty state messages when no data
- Toast notifications for export success/failure
- Graceful handling of undefined data

---

## Future Enhancements

1. **Comparison Mode**: Compare two date ranges side-by-side
2. **Alerts**: Set up alerts for cost thresholds or error rates
3. **Real-time Updates**: WebSocket for live analytics
4. **Custom Reports**: Save and schedule custom report configurations
5. **Advanced Filters**: Multi-select for models/providers
6. **Workspace Comparison**: Compare multiple workspaces
7. **Cost Predictions**: ML-based cost forecasting
8. **Export Formats**: JSON, Excel in addition to CSV

---

## Troubleshooting

### No Data Showing
- Check date range includes data
- Verify filters aren't too restrictive
- Check authentication token is valid

### Slow Performance
- Reduce date range
- Use week/month interval instead of day
- Add database indexes on filter columns

### Export Fails
- Check row count < 10,000
- Verify server has write permissions
- Check browser allows downloads

---

## API Integration Example

```bash
# cURL example
curl -X GET \
  'https://api.nexusai.hub/api/analytics/overview?start_date=2025-10-01T00:00:00Z&end_date=2025-10-31T23:59:59Z' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

---

## Support

For issues or questions:
1. Check the test file for usage examples
2. Review error logs in browser console
3. Check backend logs for API errors
4. Verify database has usage log data

---

**Last Updated**: October 23, 2025
**Version**: 1.0.0
**Maintained By**: Nexus AI Hub Team
