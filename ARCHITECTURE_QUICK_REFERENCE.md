# Nexus AI Hub - Architecture Quick Reference

## 🏗️ System Overview

```
┌──────────────┐
│   Browser    │ ← React + Vite + Tailwind CSS
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐
│ Flask API    │ ← Python + Flask + JWT Auth
└──────┬───────┘
       │
       ├─────────────┬─────────────┬─────────────┐
       ▼             ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│PostgreSQL│  │  Redis   │  │  Qdrant  │  │OpenRouter│
│(Primary) │  │ (Cache)  │  │ (Vectors)│  │(400+LLMs)│
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

## 📊 Core Components

### Frontend Stack
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **Shadcn/UI**
- **React Query** (data fetching)
- **Zustand** (state management)
- **React Router** (navigation)

### Backend Stack
- **Python 3.12** + **Flask**
- **SQLAlchemy** (ORM)
- **Flask-JWT-Extended** (auth)
- **Flask-CORS** (cross-origin)

### Database Layer
- **PostgreSQL 15** - Relational data
- **Redis 7** - Cache + sessions
- **Qdrant** - Vector embeddings
- **MongoDB** - Future/optional

### AI/ML Layer
- **OpenRouter API** - 400+ LLM models
- **all-MiniLM-L6-v2** - Embeddings
- **RAG** - Document processing

## 🔄 Request Flow (Simplified)

```
User Query
    ↓
Frontend (chat-playground.tsx)
    ↓
POST /api/v1/create
    ↓
Flask (llm_routes.py)
    ↓
Check Redis Cache ─── Hit? ──→ Return cached
    ↓ Miss
Get System Prompt (PostgreSQL)
    ↓
RAG Service (if enabled)
    ├─ Query Qdrant
    └─ Get context chunks
    ↓
OpenRouter API
    ↓
Stream Response ──→ Cache (Redis) ──→ Return
```

## 🗂️ Key Files Map

### Frontend (`/client/src/`)
```
pages/
├── landing-new.tsx          ← Landing page
├── chat-playground.tsx      ← Main chat interface
├── model-configuration.tsx  ← Model settings
├── scripts-page.tsx         ← Embed script generator
├── knowledge-base.tsx       ← RAG document upload
├── system-prompts.tsx       ← System prompt management
├── qa-section.tsx           ← Q&A management
└── analytics-dashboard.tsx  ← Usage analytics

components/
├── ChatBot.tsx              ← Floating chat widget
├── chat/
│   ├── chat-interface.tsx   ← Chat UI
│   ├── message.tsx          ← Message component
│   └── message-input.tsx    ← Input component
└── ui/                      ← Shadcn components
```

### Backend (`/server/`)
```
├── app.py                   ← Flask application entry
├── llm_routes.py            ← LLM API endpoints
├── rag_routes.py            ← RAG endpoints
├── rag_service.py           ← RAG processing
├── redis_cache_service.py   ← Caching logic
├── qa_routes.py             ← Q&A endpoints
├── system_prompts_routes.py ← System prompts API
├── script_routes.py         ← Embed script API
├── analytics_routes.py      ← Analytics API
├── contacts_routes.py       ← CRM endpoints
├── auth_utils.py            ← JWT auth
├── database.py              ← Database connection
└── models.py                ← SQLAlchemy models
```

## 🔑 Key Endpoints

```
Auth:
POST   /auth/register        - User registration
POST   /auth/login           - User login
POST   /auth/verify-email    - Email verification

LLM:
POST   /api/v1/create        - Completions (with RAG)
POST   /api/v1/chat          - Chat completions
GET    /api/v1/models        - List available models

RAG:
POST   /api/rag/upload       - Upload document
POST   /api/rag/query        - Query with RAG
DELETE /api/rag/document/:id - Delete document

Q&A:
GET    /api/qa/              - List Q&A pairs
POST   /api/qa/              - Create Q&A
PUT    /api/qa/:id           - Update Q&A
DELETE /api/qa/:id           - Delete Q&A

System Prompts:
GET    /api/system-prompts   - List prompts
POST   /api/system-prompts   - Create prompt
PUT    /api/system-prompts/:id/activate - Activate prompt

Scripts:
GET    /api/script/:workspace_id - Get settings
POST   /api/script/:workspace_id - Save settings

Analytics:
GET    /api/analytics/stats  - Get statistics
GET    /api/analytics/usage  - Usage metrics
```

## 💾 Database Schema (Key Tables)

```sql
-- Users & Workspaces
users (id, email, password_hash, workspace_id)
workspaces (id, name, created_at)

-- LLM & AI
system_prompts (id, workspace_id, name, content, active)
script_settings (workspace_id, theme_settings, quick_buttons, model_config)
model_config (workspace_id, model, temperature, max_tokens, etc.)

-- Content
qa_entries (id, workspace_id, question, answer, category)
contacts (id, workspace_id, name, email, phone, etc.)
conversations (id, workspace_id, messages, metadata)

-- Analytics
analytics_logs (id, workspace_id, endpoint, model, tokens, timestamp)
api_tokens (id, workspace_id, token, created_at)
```

## 🔐 Security Flow

```
Request → JWT Middleware → Verify Token → Extract User → Route Handler
                ↓ Invalid
            401 Unauthorized
```

## 🐳 Docker Architecture

```
docker-compose.yml
├── frontend (Nginx + React build)
├── backend (Python + Flask)
├── postgres (PostgreSQL 15)
├── redis (Redis 7)
└── qdrant (Vector DB)

Network: nexus_network (bridge)
Volumes: postgres_data, redis_data, qdrant_storage
```

## ⚡ Caching Strategy

```
Dual-Layer Cache:

1. Exact Match
   Key: workspace:model:hash(prompt)
   Use: Identical queries

2. Semantic Match
   Key: embedding(prompt)
   Use: Similar queries
   Threshold: > 0.5 (configurable)

Storage: Redis
TTL: Configurable per cache type
```

## 📦 Key Dependencies

### Frontend
```json
{
  "react": "^18.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "@tanstack/react-query": "^5.x",
  "zustand": "^4.x",
  "lucide-react": "^0.x"
}
```

### Backend
```txt
Flask==3.0.0
SQLAlchemy==2.0.x
psycopg2-binary==2.9.x
redis==5.0.x
qdrant-client==1.7.x
sentence-transformers==2.2.x
PyPDF2==3.0.x
python-docx==1.1.x
```

## 🚀 Deployment Checklist

- [ ] Set environment variables (.env)
- [ ] Configure OpenRouter API key
- [ ] Set up PostgreSQL database
- [ ] Initialize Redis cache
- [ ] Configure Qdrant collections
- [ ] Build frontend (`npm run build`)
- [ ] Run database migrations
- [ ] Start Docker containers
- [ ] Verify all services are running
- [ ] Test API endpoints
- [ ] Configure domain/SSL (production)

## 📈 Performance Optimization

### Current Optimizations
- ✅ Dual-layer caching (Redis)
- ✅ React Query for client-side caching
- ✅ Database indexing (workspace_id, user_id)
- ✅ Streaming responses
- ✅ Code splitting (Vite)
- ✅ Connection pooling (SQLAlchemy)

### Planned Optimizations
- [ ] CDN for static assets
- [ ] Redis Cluster for distributed caching
- [ ] PostgreSQL read replicas
- [ ] Message queue (Celery) for async tasks
- [ ] Horizontal scaling (load balancer)

## 🔍 Monitoring Points

### Backend
- API response times
- Database query performance
- Cache hit rates
- OpenRouter API latency
- Error rates

### Frontend
- Page load times
- React Query cache hits
- User interactions
- Network requests

### Infrastructure
- Container health
- Database connections
- Redis memory usage
- Qdrant storage

## 📚 Documentation Files

- `ARCHITECTURE_DIAGRAM.md` - Complete architecture (this doc's parent)
- `LANDING_PAGE_ENHANCEMENTS.md` - Landing page details
- `CHAT_PLAYGROUND_DOCUMENTATION.md` - Chat interface
- `RAG_IMPLEMENTATION.md` - RAG system
- `CACHING_SYSTEM_REQUIREMENTS.md` - Cache details
- `SYSTEM_PROMPTS_INTEGRATION.md` - System prompts
- `ANALYTICS_DASHBOARD_README.md` - Analytics

---

**Quick Navigation**:
- [Full Architecture](./ARCHITECTURE_DIAGRAM.md)
- [Landing Page](./LANDING_PAGE_VISUAL_GUIDE.md)
- [Chat System](./CHAT_PLAYGROUND_ARCHITECTURE.md)
- [RAG Guide](./RAG_IMPLEMENTATION.md)
