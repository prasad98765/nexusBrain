# Analytics Dashboard - Visual Structure Guide

## Dashboard Layout Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ANALYTICS DASHBOARD                           [Export CSV Button]      │
│  Comprehensive insights into your LLM usage, cost, and performance      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  FILTERS & CONTROLS                                                      │
│  ┌────────────┬────────────┬────────────┬────────────┐                 │
│  │ Date Range │  Interval  │  Provider  │  Filters   │                 │
│  │            │            │            │            │                 │
│  │ [From] >   │ ☐ Daily    │ All        │ □ Cached   │                 │
│  │ Oct 1, 25  │ □ Weekly   │ OpenAI     │ □ RAG Only │                 │
│  │            │ ☑ Monthly  │ Anthropic  │            │                 │
│  │ [To] >     │            │ Google     │            │                 │
│  │ Oct 23, 25 │            │            │            │                 │
│  │            │            │            │            │                 │
│  │ Quick:     │            │            │            │                 │
│  │ [7d][30d]  │            │            │            │                 │
│  │ [90d]      │            │            │            │                 │
│  └────────────┴────────────┴────────────┴────────────┘                 │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  OVERVIEW CARDS (7 metrics)                                             │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │ Activity │ Database │  Dollar  │  Clock   │   Zap    │ Trending │  │
│  │          │          │          │          │          │          │  │
│  │  5,230   │ 1.42M    │ $75.20   │  180ms   │  32.45%  │  14.23%  │  │
│  │ Requests │  Tokens  │   Cost   │ Latency  │  Cache   │   RAG    │  │
│  │          │          │          │          │   Hit    │  Usage   │  │
│  │ Avg: 272 │          │          │          │   Rate   │   Rate   │  │
│  │ per req  │          │          │          │          │          │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘  │
│                                                                          │
│  ┌──────────┐                                                           │
│  │  Alert   │                                                           │
│  │          │                                                           │
│  │  5.12%   │                                                           │
│  │  Error   │                                                           │
│  │   Rate   │                                                           │
│  │          │                                                           │
│  └──────────┘                                                           │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CHARTS ROW 1: TRENDS                                                   │
│  ┌─────────────────────────────────┬──────────────────────────────────┐│
│  │ Usage Trends                    │  Cost Trends                     ││
│  │ Requests and tokens over time   │  Spending over time              ││
│  ├─────────────────────────────────┼──────────────────────────────────┤│
│  │                                 │                                  ││
│  │     │                           │     │                            ││
│  │  T  │    ╱╲     ╱╲              │  C  │        ╱╲                  ││
│  │  o  │   ╱  ╲   ╱  ╲     ╱╲      │  o  │       ╱  ╲      ╱╲         ││
│  │  k  │  ╱    ╲ ╱    ╲   ╱  ╲     │  s  │      ╱    ╲    ╱  ╲        ││
│  │  e  │ ╱      ╲      ╲ ╱    ╲    │  t  │     ╱      ╲  ╱    ╲       ││
│  │  n  │╱        ╲      ╲      ╲   │     │    ╱        ╲╱      ╲      ││
│  │  s  │          ╲      ╲      ╲  │  $  │   ╱                  ╲     ││
│  │     │                          ╲│     │  ╱                    ╲    ││
│  │     └───────────────────────────│     └──────────────────────────   ││
│  │          Oct 1 - Oct 23        │          Oct 1 - Oct 23          ││
│  │                                 │                                  ││
│  │  Legend: ─── Requests           │  Legend: ─── Cost (USD)          ││
│  │          ─── Tokens             │                                  ││
│  └─────────────────────────────────┴──────────────────────────────────┘│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CHARTS ROW 2: MODELS & PROVIDERS                                       │
│  ┌─────────────────────────────────┬──────────────────────────────────┐│
│  │ Top Models                      │  Provider Distribution           ││
│  │ Usage by model                  │  Cost by provider                ││
│  ├─────────────────────────────────┼──────────────────────────────────┤│
│  │                                 │                                  ││
│  │  Requests                       │              ╱─────────╲         ││
│  │    │                            │          ╱───     40%   ───╲     ││
│  │ 3K │  ████████                  │      ╱───   OpenAI         ───╲  ││
│  │    │  ████████                  │    ╱─                          ─╲││
│  │ 2K │  ████████  ████████        │   │          ┌─────────┐        │││
│  │    │  ████████  ████████        │   │          │   35%   │        │││
│  │ 1K │  ████████  ████████  ████  │   │          │Anthropic│        │││
│  │    │  ████████  ████████  ████  │    ╲─        └─────────┘       ─╱││
│  │  0 └──────────────────────────  │      ╲───     25%          ───╱  ││
│  │      gpt-4    gpt-4o-  claude3  │          ╲─── Google    ───╱     ││
│  │               mini               │              ╲─────────╱         ││
│  │                                 │                                  ││
│  └─────────────────────────────────┴──────────────────────────────────┘│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TABLES ROW 1: ERRORS & PERFORMANCE                                     │
│  ┌─────────────────────────────────┬──────────────────────────────────┐│
│  │ Top Errors                      │  Slowest Models                  ││
│  │ Most frequent error messages    │  Models with highest latency     ││
│  ├─────────────────────────────────┼──────────────────────────────────┤│
│  │ Error Message           | Count │  Model          | Avg Latency    ││
│  ├─────────────────────────┼───────┼──────────────────┼───────────────┤│
│  │ Rate limit exceeded     │  12   │  gpt-4          │  290ms        ││
│  │ Invalid API key         │   8   │  claude-3       │  260ms        ││
│  │ Timeout                 │   4   │  gpt-4-turbo    │  245ms        ││
│  │ Service unavailable     │   3   │  claude-2       │  220ms        ││
│  │ Invalid request         │   2   │  gpt-3.5-turbo  │  150ms        ││
│  └─────────────────────────────────┴──────────────────────────────────┘│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TABLE: ENDPOINT USAGE                                                  │
│  ┌────────────────────────────────────────────────────────────────────┐│
│  │ Endpoint Usage                                                     ││
│  │ API endpoint statistics                                            ││
│  ├──────────────────────┬──────────┬──────────┬──────────────────────┤│
│  │ Endpoint             │ Requests │  Tokens  │  Cost                ││
│  ├──────────────────────┼──────────┼──────────┼──────────────────────┤│
│  │ /chat/completions    │  3,000   │  900K    │  $40.10              ││
│  │ /completions         │  2,000   │  523K    │  $22.40              ││
│  │ /embeddings          │    200   │   50K    │   $2.50              ││
│  │ /images/generations  │     30   │    0     │  $12.00              ││
│  └──────────────────────┴──────────┴──────────┴──────────────────────┘│
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  CACHING PERFORMANCE                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐│
│  │ Caching Performance                                                 ││
│  │ Cache hit rates and latency improvements                            ││
│  ├──────────────┬──────────────┬──────────────┬──────────────────────┤│
│  │ Exact Cache  │ Semantic     │ Avg Latency  │ Avg Latency          ││
│  │ Hits         │ Cache Hits   │ (Cached)     │ (Uncached)           ││
│  ├──────────────┼──────────────┼──────────────┼──────────────────────┤│
│  │    210       │     120      │    150ms     │     230ms            ││
│  │              │              │              │                      ││
│  │  Savings: 54,000 tokens     │  Cache hit rate: 29.17%             ││
│  └─────────────────────────────────────────────────────────────────────┘│
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Color Scheme

### Overview Cards
- **Activity Icon**: Purple (#8b5cf6)
- **Database Icon**: Cyan (#06b6d4)
- **Dollar Icon**: Green (#10b981)
- **Clock Icon**: Amber (#f59e0b)
- **Zap Icon**: Yellow (#eab308)
- **Trending Icon**: Blue (#3b82f6)
- **Alert Icon**: Red (#ef4444)

### Charts
- **Primary Line**: Purple (#8b5cf6)
- **Secondary Line**: Cyan (#06b6d4)
- **Tertiary Line**: Green (#10b981)
- **Bars**: Purple (#8b5cf6)
- **Pie Segments**: 
  - Segment 1: Purple (#8b5cf6)
  - Segment 2: Cyan (#06b6d4)
  - Segment 3: Green (#10b981)
  - Segment 4: Amber (#f59e0b)
  - Segment 5: Red (#ef4444)
  - Segment 6: Pink (#ec4899)

---

## Responsive Breakpoints

### Desktop (lg: 1024px+)
```
┌─────────────────────────────────────────────────────────┐
│  [4 Filter Controls in Grid]                            │
│  [7 Overview Cards in Grid (4 cols)]                    │
│  [2 Charts Side by Side]                                │
│  [2 Charts Side by Side]                                │
│  [2 Tables Side by Side]                                │
│  [1 Full Width Table]                                   │
│  [1 Full Width Caching Card]                            │
└─────────────────────────────────────────────────────────┘
```

### Tablet (md: 768px+)
```
┌────────────────────────────────┐
│  [2 Filter Controls in Grid]   │
│  [2 Overview Cards per Row]    │
│  [1 Chart Full Width]          │
│  [1 Chart Full Width]          │
│  [1 Table Full Width]          │
│  [1 Table Full Width]          │
│  [1 Full Width Table]          │
│  [1 Full Width Caching Card]   │
└────────────────────────────────┘
```

### Mobile (sm: 640px-)
```
┌─────────────────┐
│  [1 Filter]     │
│  [1 Card]       │
│  [1 Card]       │
│  [1 Card]       │
│  [1 Chart]      │
│  [1 Chart]      │
│  [1 Table]      │
│  [1 Table]      │
│  [1 Caching]    │
└─────────────────┘
```

---

## Interactive Elements

### Filters
```
┌────────────────────────────────────┐
│ Date Range                         │
├────────────────────────────────────┤
│ ┌──────────┐     ┌──────────┐     │
│ │📅 From   │     │📅 To     │     │
│ │ Oct 1 ▼  │     │ Oct 23 ▼ │     │
│ └──────────┘     └──────────┘     │
│                                    │
│ Quick Presets:                     │
│ [7 days] [30 days] [90 days]      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Interval                           │
├────────────────────────────────────┤
│ ┌─────────────────────┐            │
│ │ Daily           ▼   │            │
│ └─────────────────────┘            │
│ Options:                           │
│ • Daily                            │
│ • Weekly                           │
│ • Monthly                          │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Provider                           │
├────────────────────────────────────┤
│ ┌─────────────────────┐            │
│ │ All providers   ▼   │            │
│ └─────────────────────┘            │
│ Options:                           │
│ • All                              │
│ • OpenAI                           │
│ • Anthropic                        │
│ • Google                           │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Filters                            │
├────────────────────────────────────┤
│ ○────○ Cached Only                 │
│                                    │
│ ○────○ RAG Only                    │
└────────────────────────────────────┘
```

### Chart Interactions
```
┌────────────────────────────────────┐
│ Usage Trends                       │
├────────────────────────────────────┤
│        ↑ Hover to see tooltip      │
│        │                           │
│   ╭────┴────╮                      │
│   │ Oct 15  │                      │
│   │ 150 req │                      │
│   │ 45K tok │                      │
│   ╰─────────╯                      │
│                                    │
│  Legend (clickable to hide):       │
│  ─── Requests                      │
│  ─── Tokens                        │
└────────────────────────────────────┘
```

### Export Button
```
┌────────────────────────┐
│ ⬇ Export CSV          │
└────────────────────────┘
        ↓ Click
┌────────────────────────┐
│ 📥 Downloading...      │
│ analytics_20251023.csv │
└────────────────────────┘
```

---

## Loading States

### Card Loading
```
┌────────────────┐
│ Activity  ⏳   │
│                │
│  ...           │
│ Requests       │
│                │
│ Loading...     │
└────────────────┘
```

### Chart Loading
```
┌────────────────────────────────┐
│ Usage Trends                   │
├────────────────────────────────┤
│                                │
│        ⏳ Loading chart...     │
│                                │
└────────────────────────────────┘
```

### Table Loading
```
┌────────────────────────────────┐
│ Top Errors                     │
├────────────────────────────────┤
│ Error Message      | Count     │
├────────────────────┼───────────┤
│ ⏳ Loading data...             │
└────────────────────────────────┘
```

---

## Empty States

### No Data Card
```
┌────────────────────────────────┐
│ Activity                       │
│                                │
│  0                             │
│ Requests                       │
│                                │
│ No data for selected period    │
└────────────────────────────────┘
```

### No Chart Data
```
┌────────────────────────────────┐
│ Usage Trends                   │
├────────────────────────────────┤
│                                │
│  📊 No data available          │
│  Try selecting a different     │
│  date range or filters         │
│                                │
└────────────────────────────────┘
```

### Empty Table
```
┌────────────────────────────────┐
│ Top Errors                     │
├────────────────────────────────┤
│ Error Message      | Count     │
├────────────────────┼───────────┤
│                                │
│  ✅ No errors found            │
│                                │
└────────────────────────────────┘
```

---

## Tooltip Examples

### Card Tooltip
```
        ╭──────────────────────╮
        │ Cache Hit Rate       │
        │                      │
        │ Percentage of        │
        │ requests served      │
        │ from cache           │
        ╰──────────────────────╯
              ↓
┌────────────────┐
│ Zap            │
│                │
│  32.45%        │
│ Cache Hit Rate │
└────────────────┘
```

### Chart Tooltip
```
        ╭──────────────────────╮
        │ Oct 15, 2025         │
        │                      │
        │ Requests: 150        │
        │ Tokens: 45,000       │
        ╰──────────────────────╯
              ↓
         ━━●━━  (hover point)
```

---

## Navigation Flow

```
API Integrations Page
         │
         ├─ Usage Logs Tab
         │
         ├─ Question & Answer Tab
         │
         └─ Analytics Tab ← NEW
                  │
                  ├─ Filters Section
                  │    │
                  │    ├─ Date Range Picker
                  │    ├─ Interval Selector
                  │    ├─ Provider Filter
                  │    └─ Toggle Filters
                  │
                  ├─ Overview Cards
                  │    │
                  │    └─ 7 Metric Cards
                  │
                  ├─ Charts Section
                  │    │
                  │    ├─ Usage Trends (Line)
                  │    ├─ Cost Trends (Line)
                  │    ├─ Top Models (Bar)
                  │    └─ Providers (Pie)
                  │
                  ├─ Tables Section
                  │    │
                  │    ├─ Top Errors
                  │    ├─ Slowest Models
                  │    └─ Endpoint Usage
                  │
                  └─ Export Button
```

---

## Animation & Transitions

### Page Load
1. Filters fade in (0.2s)
2. Cards stagger in from left (0.1s each)
3. Charts animate from bottom (0.5s)
4. Tables fade in (0.3s)

### Filter Change
1. Loading spinner appears
2. Data fades out (0.2s)
3. New data fades in (0.3s)
4. Charts re-animate (0.5s)

### Chart Interactions
- Hover: Scale up 1.05x
- Click legend: Fade line (0.3s)
- Tooltip: Fade in (0.1s)

---

This visual guide provides a comprehensive overview of the Analytics Dashboard layout, design, and user interactions!
