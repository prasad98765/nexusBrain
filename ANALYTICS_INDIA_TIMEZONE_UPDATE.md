# Analytics Routes - India Timezone Implementation

## Overview

Updated all analytics API endpoints to consistently use **Asia/Kolkata (India timezone)** for date handling, ensuring all date operations, filters, and groupings align with India Standard Time (IST, UTC+5:30).

---

## Changes Made

### 1. Enhanced `parse_date_filters()` Function

**File**: `server/analytics_routes.py`

**Changes**:
- Now returns 4 values instead of 2: `(start_date_utc, end_date_utc, start_date_ist, end_date_ist)`
- Maintains IST dates for logging and response formatting
- Converts to UTC only for database queries

**Before**:
```python
def parse_date_filters(params: dict) -> tuple:
    # ...
    return start_date_utc, end_date_utc
```

**After**:
```python
def parse_date_filters(params: dict) -> tuple:
    # ...
    start_date_ist = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date_ist = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    start_date_utc = start_date_ist.astimezone(pytz.UTC).replace(tzinfo=None)
    end_date_utc = end_date_ist.astimezone(pytz.UTC).replace(tzinfo=None)
    
    return start_date_utc, end_date_utc, start_date_ist, end_date_ist
```

---

### 2. Updated `build_base_query()` Function

**Changes**:
- Now returns IST dates along with the query
- Query uses UTC dates for database filtering
- IST dates available for response formatting

**Before**:
```python
def build_base_query(params: dict, workspace_id: str = None):
    start_date, end_date = parse_date_filters(params)
    query = db.session.query(ApiUsageLog).filter(...)
    return query
```

**After**:
```python
def build_base_query(params: dict, workspace_id: str = None):
    start_date_utc, end_date_utc, start_date_ist, end_date_ist = parse_date_filters(params)
    query = db.session.query(ApiUsageLog).filter(
        ApiUsageLog.created_at.between(start_date_utc, end_date_utc)
    )
    return query, start_date_ist, end_date_ist
```

---

### 3. Updated All Analytics Endpoints

All 12 analytics endpoints now unpack IST dates from `build_base_query()`:

```python
# Before (all endpoints)
query = build_base_query(params, workspace_id=workspace_id)

# After (all endpoints)  
query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id)
```

**Affected Endpoints**:
1. `/analytics/overview` - Summary statistics
2. `/analytics/trends` - Time-series data
3. `/analytics/models` - Model-wise breakdown
4. `/analytics/providers` - Provider comparison
5. `/analytics/errors` - Error statistics
6. `/analytics/caching` - Caching statistics
7. `/analytics/rag` - RAG usage stats
8. `/analytics/endpoints` - Endpoint-level stats
9. `/analytics/user_agents` - Client usage
10. `/analytics/performance` - Performance metrics
11. `/analytics/ip` - Per-IP statistics
12. `/analytics/export` - CSV export

---

## How It Works

### Timezone Handling Flow

```
Frontend (YYYY-MM-DD)
    ↓
Parse as IST (Asia/Kolkata)
    ↓
Set time bounds in IST
    - start: 00:00:00 IST
    - end: 23:59:59.999999 IST
    ↓
Convert to UTC for DB query
    ↓
Database query with UTC timestamps
    ↓
PostgreSQL converts UTC → IST for grouping
    ↓
Return dates in IST format
```

### Example

**Frontend Request**:
```bash
GET /analytics/overview?start_date=2025-01-20&end_date=2025-01-21
```

**Backend Processing**:
```python
# Parse dates as IST
start_date_ist = 2025-01-20 00:00:00+05:30
end_date_ist   = 2025-01-21 23:59:59.999999+05:30

# Convert to UTC for DB query
start_date_utc = 2025-01-19 18:30:00  # (IST - 5:30)
end_date_utc   = 2025-01-21 18:29:59.999999

# Database query
WHERE created_at BETWEEN '2025-01-19 18:30:00' AND '2025-01-21 18:29:59.999999'
```

**PostgreSQL Grouping** (in `/analytics/trends`):
```sql
-- Convert UTC timestamps to IST before grouping
DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')

-- This ensures dates match India timezone, not UTC
```

---

## Key Features

### ✅ Consistent Timezone Handling

All date operations now use `Asia/Kolkata` timezone:
- Input dates treated as IST
- Database queries use UTC (internal storage)
- Grouping and aggregation use IST
- Response dates formatted in IST

### ✅ PostgreSQL Timezone Conversion

The `/analytics/trends` endpoint uses PostgreSQL's `AT TIME ZONE` for proper grouping:

```python
# Convert UTC to IST using PostgreSQL's timezone support
india_time_expr = func.timezone('Asia/Kolkata', func.timezone('UTC', ApiUsageLog.created_at))

# Group by day/week/month in IST
date_group = func.date_trunc('day', india_time_expr)
```

This ensures:
- Daily aggregations match IST dates (not UTC)
- Weekly/monthly groupings align with IST calendar
- No date shifts due to timezone mismatch

### ✅ Accurate Date Ranges

**Example**: Query for "2025-01-20" (India time)
- Includes: 2025-01-20 00:00:00 IST → 2025-01-20 23:59:59 IST
- Covers: Full day in India timezone
- UTC range: 2025-01-19 18:30:00 → 2025-01-20 18:29:59

### ✅ Backward Compatibility

- Accepts both `YYYY-MM-DD` and ISO datetime formats
- Handles timezone-aware and timezone-naive inputs
- Converts all inputs to IST consistently

---

## API Examples

### Example 1: Get Overview for Today (IST)

```bash
# Request (IST)
GET /analytics/overview?start_date=2025-01-20&end_date=2025-01-20
Authorization: Bearer YOUR_TOKEN

# Backend logs
INFO: Date filter - IST: 2025-01-20 00:00:00+05:30 to 2025-01-20 23:59:59+05:30 | 
                    UTC: 2025-01-19 18:30:00 to 2025-01-20 18:29:59

# Response
{
  "total_requests": 1234,
  "total_tokens": 567890,
  "total_cost_usd": 12.34,
  "avg_latency_ms": 234.56
}
```

### Example 2: Get Trends (Daily, IST)

```bash
# Request
GET /analytics/trends?start_date=2025-01-18&end_date=2025-01-20&interval=day
Authorization: Bearer YOUR_TOKEN

# Response (dates in IST)
[
  {
    "date": "2025-01-18",  // IST date
    "requests": 450,
    "tokens": 89000,
    "cost_usd": 4.32,
    "errors": 2
  },
  {
    "date": "2025-01-19",  // IST date
    "requests": 523,
    "tokens": 102000,
    "cost_usd": 5.67,
    "errors": 1
  },
  {
    "date": "2025-01-20",  // IST date
    "requests": 261,
    "tokens": 48000,
    "cost_usd": 2.35,
    "errors": 0
  }
]
```

### Example 3: Get Yesterday's Data (IST)

```bash
# PostgreSQL equivalent
SELECT DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') as date,
       COUNT(*) as requests
FROM api_usage_logs
WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') 
      = CURRENT_DATE - INTERVAL '1 day'
GROUP BY date;
```

---

## Benefits

### 1. **User-Friendly Date Handling**
- Users in India see dates in their local timezone
- No confusion about date boundaries
- "Today" means "today in India", not UTC

### 2. **Accurate Aggregations**
- Daily/weekly/monthly stats align with IST calendar
- No data split across dates due to UTC grouping
- Consistent with user expectations

### 3. **Proper Workspace Isolation**
- All queries still filtered by workspace_id
- Timezone handling doesn't affect data security
- Each workspace sees only their data

### 4. **PostgreSQL Efficiency**
- Uses PostgreSQL's native timezone conversion
- Efficient `AT TIME ZONE` operations
- Proper index usage with BETWEEN queries

---

## Testing

### Test 1: Date Range Filter (IST)

```python
# Test that IST dates are handled correctly
params = {
    'start_date': '2025-01-20',
    'end_date': '2025-01-20'
}

start_utc, end_utc, start_ist, end_ist = parse_date_filters(params)

assert start_ist == datetime(2025, 1, 20, 0, 0, 0, tzinfo=INDIA_TZ)
assert end_ist == datetime(2025, 1, 20, 23, 59, 59, 999999, tzinfo=INDIA_TZ)
assert start_utc == datetime(2025, 1, 19, 18, 30, 0)  # UTC
assert end_utc == datetime(2025, 1, 20, 18, 29, 59, 999999)  # UTC
```

### Test 2: Trends Grouping (IST)

```sql
-- Test daily grouping in IST
SELECT DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata') as date,
       COUNT(*) as count
FROM api_usage_logs
WHERE workspace_id = 'test_workspace'
  AND created_at BETWEEN '2025-01-19 18:30:00' AND '2025-01-20 18:29:59.999999'
GROUP BY date
ORDER BY date;

-- Expected: Single row with date '2025-01-20' (IST)
```

### Test 3: Midnight Boundary

```python
# Test that midnight in IST is handled correctly
params = {
    'start_date': '2025-01-20',
    'end_date': '2025-01-20'
}

# IST midnight = UTC 18:30 (previous day)
# Logs at 2025-01-19 19:00 UTC should be included
# Logs at 2025-01-19 18:00 UTC should be excluded
```

---

## Logging

Enhanced logging shows both IST and UTC for debugging:

```
INFO: Date filter - IST: 2025-01-20 00:00:00+05:30 to 2025-01-20 23:59:59+05:30 
                  | UTC: 2025-01-19 18:30:00 to 2025-01-20 18:29:59
```

This helps developers:
- Verify timezone conversion is correct
- Debug date range issues
- Understand UTC ↔ IST mapping

---

## Migration Notes

### No Database Changes Required

- Database continues to store timestamps in UTC
- All timezone conversion happens at query time
- Existing data remains unchanged

### Frontend Changes

No frontend changes required:
- Send dates in `YYYY-MM-DD` format (same as before)
- Dates are automatically treated as IST
- Response dates are in IST format

### Backward Compatibility

✅ Maintains compatibility with:
- Existing API clients
- Current date format (`YYYY-MM-DD`)
- ISO datetime format (legacy support)

---

## Performance Considerations

### PostgreSQL Optimization

```sql
-- Efficient: Uses index on created_at
WHERE created_at BETWEEN '2025-01-19 18:30:00' AND '2025-01-20 18:29:59'

-- Efficient: Timezone conversion in SELECT
SELECT DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')

-- Index-friendly: UTC range query + IST grouping
```

### Query Performance

- UTC BETWEEN queries use indexes efficiently
- Timezone conversion only in GROUP BY (not WHERE)
- No performance degradation from IST handling

---

## Conclusion

All analytics endpoints now:

✅ Use Asia/Kolkata timezone consistently  
✅ Handle date boundaries correctly (IST midnight)  
✅ Group data by IST dates (not UTC)  
✅ Return dates in IST format  
✅ Maintain backward compatibility  
✅ Preserve workspace isolation  
✅ Optimize PostgreSQL queries  

Users in India now see analytics data aligned with their local timezone, eliminating confusion about date boundaries and ensuring accurate daily/weekly/monthly aggregations.
