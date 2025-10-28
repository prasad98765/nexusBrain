# Nexus AI Hub - System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                     React Frontend (Vite)                           │    │
│  │                     Port: 5173 (Dev) / 80 (Prod)                   │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  Pages Layer:                                                       │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │ Landing Page │  │Chat Playground│  │ Model Config │            │    │
│  │  │ (landing-new)│  │               │  │              │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │ Q&A Section  │  │  Scripts/     │  │  Settings    │            │    │
│  │  │              │  │  Embed Gen    │  │  (Prompts)   │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │                                                                     │    │
│  │  Components:                                                        │    │
│  │  • ChatBot (floating widget)                                       │    │
│  │  • ThemeProvider (global theming)                                  │    │
│  │  • Message components (streaming support)                          │    │
│  │                                                                     │    │
│  │  State Management:                                                  │    │
│  │  • React Query (API caching & data fetching)                       │    │
│  │  • Zustand (modelStore.ts - model selection state)                │    │
│  │                                                                     │    │
│  │  UI Framework:                                                      │    │
│  │  • Tailwind CSS (utility-first styling)                            │    │
│  │  • Shadcn/UI components (Button, Card, Input, etc.)               │    │x`
│  │  • Lucide React (icon library)                                     │    │
│  │                                                                     │    │
│  └─────────────────────────────┬───────────────────────────────────────┘    │
│                                │                                            │
│                                │ HTTP/HTTPS                                 │
│                                │ (Vite Proxy in Dev)                        │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                  Flask Application (Python)                         │    │
│  │                  Port: 5000                                         │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  Route Handlers:                                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │ llm_routes   │  │ rag_routes   │  │ qa_routes    │            │    │
│  │  │ /api/v1/     │  │ /api/rag/    │  │ /api/qa/     │            │    │
│  │  │  - /create   │  │  - /upload   │  │  - CRUD      │            │    │
│  │  │  - /chat     │  │  - /query    │  │  - /search   │            │    │
│  │  │  - /models   │  │  - /delete   │  │              │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │script_routes │  │system_prompts│  │ auth_utils   │            │    │
│  │  │ /api/script/ │  │  /api/       │  │ JWT Auth     │            │    │
│  │  │  - theme     │  │  prompts/    │  │ Middleware   │            │    │
│  │  │  - settings  │  │  - CRUD      │  │              │            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │                                                                     │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │    │
│  │  │analytics_    │  │ contacts_    │  │ conversation_│            │    │
│  │  │  routes      │  │  routes      │  │  routes      │            │    │
│  │  │ /api/        │  │ /api/        │  │ /api/        │            │    │
│  │  │ analytics/   │  │ contacts/    │  │ conversations│            │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘            │    │
│  │                                                                     │    │
│  │  Middleware:                                                        │    │
│  │  • CORS (cross-origin support)                                     │    │
│  │  • JWT Authentication                                               │    │
│  │  • Request logging                                                  │    │
│  │  • Error handling                                                   │    │
│  │                                                                     │    │
│  └─────────────────────────────┬───────────────────────────────────────┘    │
└─────────────────────────────────┼────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │ Redis Cache Service  │  │  RAG Service         │  │ Email Service   │  │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤  │
│  │ • Semantic Caching   │  │ • Document Processing│  │ • Email verify  │  │
│  │ • Exact Match Cache  │  │ • PDF/DOCX/PPT Parse │  │ • Notifications │  │
│  │ • Embeddings Store   │  │ • Text Chunking      │  │                 │  │
│  │ • Cache Threshold    │  │ • Vector Embeddings  │  │                 │  │
│  │   (0.5 default)      │  │ • Context Retrieval  │  │                 │  │
│  │ • TTL Management     │  │   (top_k, threshold) │  │                 │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │ QA Redis Service     │  │ Mongo Service        │  │ Conversation    │  │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤  │
│  │ • Q&A Storage        │  │ • Workspace Data     │  │ Memory Service  │  │
│  │ • Query Matching     │  │ • User Metadata      │  │ • Context Track │  │
│  │ • Answer Retrieval   │  │ • API Tokens         │  │ • Session Mgmt  │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                              │
└─────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │  PostgreSQL          │  │   Redis              │  │  Qdrant         │  │
│  │  (Primary DB)        │  │   (Cache & Queue)    │  │  (Vector DB)    │  │
│  ├──────────────────────┤  ├──────────────────────┤  ├─────────────────┤  │
│  │ Tables:              │  │ • LLM Response Cache │  │ • RAG Vectors   │  │
│  │ • users              │  │ • Semantic Cache     │  │ • Embeddings    │  │
│  │ • workspaces         │  │ • Session Store      │  │ • workspace_id  │  │
│  │ • api_tokens         │  │ • Q&A Pairs          │  │   index         │  │
│  │ • system_prompts     │  │ • Rate Limiting      │  │ • Similarity    │  │
│  │ • script_settings    │  │                      │  │   Search        │  │
│  │ • quick_buttons      │  │ Embedding Model:     │  │                 │  │
│  │ • model_config       │  │ all-MiniLM-L6-v2     │  │ Collection per  │  │
│  │ • conversations      │  │                      │  │ workspace       │  │
│  │ • analytics_logs     │  │                      │  │                 │  │
│  │ • contacts (CRM)     │  │                      │  │                 │  │
│  │ • qa_entries         │  │                      │  │                 │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                     MongoDB (Optional/Future)                         │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │ • Workspace Documents                                                 │  │
│  │ • Unstructured Data                                                   │  │
│  │ • Analytics Events                                                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

                                  ▲
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    │             │             │
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │                        OpenRouter API                               │    │
│  │                  (LLM Gateway - 400+ Models)                       │    │
│  ├────────────────────────────────────────────────────────────────────┤    │
│  │                                                                     │    │
│  │  Supported Providers:                                               │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │ OpenAI   │  │ Anthropic│  │  Google  │  │ Mistral  │          │    │
│  │  │ GPT-4    │  │ Claude   │  │  Gemini  │  │  Mixtral │          │    │
│  │  │ GPT-3.5  │  │  Sonnet  │  │  Pro     │  │  Large   │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │    │
│  │                                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │    │
│  │  │ Meta     │  │ Cohere   │  │ Perplexity│  │ Others   │          │    │
│  │  │ Llama 3  │  │ Command  │  │  Sonar   │  │ (400+)   │          │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │    │
│  │                                                                     │    │
│  │  Features:                                                          │    │
│  │  • Single API Key for all models                                   │    │
│  │  • Intelligent Model Routing                                       │    │
│  │  • Streaming Support                                                │    │
│  │  • Cost Optimization                                                │    │
│  │  • Fallback Mechanisms                                              │    │
│  │                                                                     │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────┐  │
│  │ MCP Server           │  │ Email Service        │  │ Future: OAuth   │  │
│  │ (Model Context       │  │ (SMTP/SendGrid)      │  │ Providers       │  │
│  │  Protocol)           │  │                      │  │                 │  │
│  └──────────────────────┘  └──────────────────────┘  └─────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Request Flow Diagrams

### 1. Chat/Completion Request Flow

```
┌─────────┐
│ Client  │
│ Browser │
└────┬────┘
     │ 1. POST /api/v1/create
     │    (prompt, model, params)
     ▼
┌────────────────┐
│  Flask API     │
│  (llm_routes)  │
└────┬───────────┘
     │
     │ 2. Check Cache
     ▼
┌──────────────────┐        Cache Hit?
│ Redis Cache      │───────────────────┐
│ Service          │                   │
└──────────────────┘                   │
     │ Cache Miss                      │
     │                                 │ Yes
     │ 3. Check System Prompt          │
     ▼                                 │
┌──────────────────┐                   │
│ PostgreSQL       │                   │
│ (system_prompts) │                   │
└────┬─────────────┘                   │
     │                                 │
     │ 4. Check RAG (if use_rag=true) │
     ▼                                 │
┌──────────────────┐                   │
│ RAG Service      │                   │
│ • Query Qdrant   │                   │
│ • Get Context    │                   │
└────┬─────────────┘                   │
     │                                 │
     │ 5. Build Request                │
     ▼                                 │
┌──────────────────┐                   │
│ OpenRouter API   │                   │
│ • Send prompt    │                   │
│ • Stream response│                   │
└────┬─────────────┘                   │
     │                                 │
     │ 6. Cache Response               │
     ▼                                 │
┌──────────────────┐                   │
│ Redis Cache      │◄──────────────────┘
│ (semantic + exact)│
└────┬─────────────┘
     │
     │ 7. Return Response
     ▼
┌──────────────────┐
│ Client (Stream   │
│  or Complete)    │
└──────────────────┘
```

### 2. RAG Document Upload & Query Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. POST /api/rag/upload
     │    (file: PDF/DOCX/TXT)
     ▼
┌────────────────┐
│  Flask API     │
│  (rag_routes)  │
└────┬───────────┘
     │
     │ 2. Parse Document
     ▼
┌──────────────────┐
│ RAG Service      │
│ • PyPDF2         │
│ • python-docx    │
│ • pdfplumber     │
└────┬─────────────┘
     │
     │ 3. Chunk Text
     │    (overlap, max_length)
     ▼
┌──────────────────┐
│ Text Chunker     │
│ • Split strategy │
│ • Context aware  │
└────┬─────────────┘
     │
     │ 4. Generate Embeddings
     ▼
┌──────────────────┐
│ Embedding Model  │
│ all-MiniLM-L6-v2 │
└────┬─────────────┘
     │
     │ 5. Store Vectors
     ▼
┌──────────────────┐
│ Qdrant           │
│ • workspace_id   │
│ • document_id    │
│ • vectors        │
└────┬─────────────┘
     │
     │ 6. Store Metadata
     ▼
┌──────────────────┐
│ PostgreSQL       │
│ (documents table)│
└──────────────────┘

─────────────────────────

┌─────────┐
│ Query   │
└────┬────┘
     │ 1. POST /api/v1/create
     │    (use_rag=true, rag_threshold=0.5)
     ▼
┌──────────────────┐
│ RAG Service      │
│ • Embed query    │
└────┬─────────────┘
     │
     │ 2. Similarity Search
     ▼
┌──────────────────┐
│ Qdrant           │
│ • Filter by      │
│   workspace_id   │
│ • top_k results  │
│ • threshold > 0.5│
└────┬─────────────┘
     │
     │ 3. Retrieve Chunks
     ▼
┌──────────────────┐
│ Context Builder  │
│ • Rank by score  │
│ • Format context │
└────┬─────────────┘
     │
     │ 4. Augment Prompt
     ▼
┌──────────────────┐
│ LLM Request      │
│ (with context)   │
└──────────────────┘
```

### 3. Caching System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Dual-Layer Caching                       │
└─────────────────────────────────────────────────────────────┘

Request → Check Exact Match Cache
           │
           ├─ Hit? → Return Cached Response
           │
           ├─ Miss → Check Semantic Cache
                     │
                     ├─ Similarity > Threshold (0.5)?
                     │   │
                     │   ├─ Yes → Return Similar Response
                     │   │
                     │   └─ No → Call LLM API
                     │           │
                     │           ├─ Get Response
                     │           │
                     │           ├─ Store in Exact Cache
                     │           │   (key: hash(prompt+model))
                     │           │
                     │           └─ Store in Semantic Cache
                     │               (embedding + response)
                     │
                     └─ Return Response

Cache Keys:
━━━━━━━━━━
Exact Match: 
  workspace_id:model:hash(prompt+params)

Semantic Match:
  embedding(prompt) → similarity search
  workspace_id filter
```

## Component Interactions

### Authentication Flow

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. POST /auth/register or /auth/login
     ▼
┌────────────────┐
│ auth_utils.py  │
│ • Validate     │
│ • Hash password│
└────┬───────────┘
     │
     │ 2. Create/Verify User
     ▼
┌──────────────────┐
│ PostgreSQL       │
│ (users table)    │
└────┬─────────────┘
     │
     │ 3. Generate JWT
     ▼
┌────────────────┐
│ JWT Token      │
│ • user_id      │
│ • workspace_id │
│ • exp          │
└────┬───────────┘
     │
     │ 4. Return Token
     ▼
┌──────────────────┐
│ Client Storage   │
│ (localStorage)   │
└──────────────────┘

Protected Requests:
━━━━━━━━━━━━━━━━━━
┌─────────┐
│ Request │
└────┬────┘
     │ Authorization: Bearer <token>
     ▼
┌────────────────┐
│ JWT Middleware │
│ • Verify token │
│ • Extract user │
└────┬───────────┘
     │
     │ Valid?
     ▼
┌────────────────┐
│ Route Handler  │
│ (req.user set) │
└────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOCKER CONTAINERS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────────┐  │
│  │  Frontend          │  │  Backend           │  │  PostgreSQL         │  │
│  │  (Nginx + Static)  │  │  (Python/Flask)    │  │  (Primary DB)       │  │
│  │  Port: 80          │  │  Port: 5000        │  │  Port: 5432         │  │
│  │                    │  │                    │  │                     │  │
│  │  Built from:       │  │  Built from:       │  │  Official Image:    │  │
│  │  client/Dockerfile │  │  server/Dockerfile │  │  postgres:15        │  │
│  │                    │  │                    │  │                     │  │
│  │  Contains:         │  │  Contains:         │  │  Volumes:           │  │
│  │  • React app       │  │  • Flask app       │  │  • postgres_data    │  │
│  │  • Built assets    │  │  • Dependencies    │  │                     │  │
│  │  • Nginx config    │  │  • Services        │  │                     │  │
│  └────────────────────┘  └────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  ┌────────────────────┐  ┌────────────────────┐  ┌─────────────────────┐  │
│  │  Redis             │  │  Qdrant            │  │  MongoDB (Optional) │  │
│  │  (Cache/Queue)     │  │  (Vector DB)       │  │  (Future)           │  │
│  │  Port: 6379        │  │  Port: 6333        │  │  Port: 27017        │  │
│  │                    │  │                    │  │                     │  │
│  │  Official Image:   │  │  Official Image:   │  │  Official Image:    │  │
│  │  redis:7-alpine    │  │  qdrant/qdrant     │  │  mongo:6            │  │
│  │                    │  │                    │  │                     │  │
│  │  Volumes:          │  │  Volumes:          │  │  Volumes:           │  │
│  │  • redis_data      │  │  • qdrant_storage  │  │  • mongo_data       │  │
│  └────────────────────┘  └────────────────────┘  └─────────────────────┘  │
│                                                                              │
│  Docker Network: nexus_network (bridge)                                     │
│  • All containers communicate via service names                             │
│  • Isolated from host network                                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                          DOCKER COMPOSE STRUCTURE                            │
└─────────────────────────────────────────────────────────────────────────────┘

services:
  frontend:
    build: ./client
    ports: ["80:80"]
    depends_on: [backend]
    environment:
      - VITE_API_URL=http://backend:5000
    
  backend:
    build: ./server
    ports: ["5000:5000"]
    depends_on: [postgres, redis, qdrant]
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
      - QDRANT_URL=http://qdrant:6333
      - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
    
  postgres:
    image: postgres:15
    volumes: ["postgres_data:/var/lib/postgresql/data"]
    environment:
      - POSTGRES_DB=nexus_ai_hub
    
  redis:
    image: redis:7-alpine
    volumes: ["redis_data:/data"]
    
  qdrant:
    image: qdrant/qdrant
    volumes: ["qdrant_storage:/qdrant/storage"]
```

## Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TECHNOLOGY STACK                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Frontend:                                                                   │
│  ├─ React 18                      (UI framework)                            │
│  ├─ TypeScript                    (type safety)                             │
│  ├─ Vite                          (build tool)                              │
│  ├─ Tailwind CSS                  (styling)                                 │
│  ├─ Shadcn/UI                     (component library)                       │
│  ├─ React Query (TanStack Query)  (data fetching)                           │
│  ├─ React Router                  (routing)                                 │
│  ├─ Zustand                       (state management)                        │
│  ├─ Lucide React                  (icons)                                   │
│  └─ Emoji Picker React            (emoji support)                           │
│                                                                              │
│  Backend:                                                                    │
│  ├─ Python 3.12                   (runtime)                                 │
│  ├─ Flask                         (web framework)                           │
│  ├─ Flask-CORS                    (CORS support)                            │
│  ├─ Flask-JWT-Extended            (authentication)                          │
│  ├─ SQLAlchemy                    (ORM)                                     │
│  ├─ Psycopg2                      (PostgreSQL driver)                       │
│  ├─ Redis-py                      (Redis client)                            │
│  ├─ Qdrant-client                 (vector DB client)                        │
│  ├─ Requests                      (HTTP client)                             │
│  ├─ Sentence-transformers         (embeddings)                              │
│  ├─ PyPDF2                        (PDF parsing)                             │
│  ├─ python-docx                   (Word parsing)                            │
│  ├─ python-pptx                   (PowerPoint parsing)                      │
│  ├─ pdfplumber                    (advanced PDF)                            │
│  └─ python-dotenv                 (environment vars)                        │
│                                                                              │
│  Databases:                                                                  │
│  ├─ PostgreSQL 15                 (relational data)                         │
│  ├─ Redis 7                       (caching, sessions)                       │
│  ├─ Qdrant                        (vector storage)                          │
│  └─ MongoDB                       (optional/future)                         │
│                                                                              │
│  AI/ML:                                                                      │
│  ├─ OpenRouter API                (LLM gateway)                             │
│  ├─ all-MiniLM-L6-v2             (embedding model)                          │
│  └─ 400+ LLM Models               (via OpenRouter)                          │
│                                                                              │
│  DevOps:                                                                     │
│  ├─ Docker                        (containerization)                        │
│  ├─ Docker Compose                (orchestration)                           │
│  ├─ Nginx                         (web server)                              │
│  └─ Git                           (version control)                         │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Key Features Implementation Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FEATURE → COMPONENT MAPPING                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Multi-LLM Access (400+ Models)                                          │
│     ├─ Frontend: model-configuration.tsx, chat-playground.tsx              │
│     ├─ Backend: llm_routes.py                                               │
│     ├─ Service: OpenRouter API integration                                  │
│     └─ Storage: modelStore.ts (Zustand)                                     │
│                                                                              │
│  2. RAG (Retrieval-Augmented Generation)                                    │
│     ├─ Frontend: knowledge-base.tsx                                         │
│     ├─ Backend: rag_routes.py, rag_service.py                              │
│     ├─ Processing: PyPDF2, python-docx, pdfplumber                          │
│     ├─ Embeddings: all-MiniLM-L6-v2                                         │
│     └─ Storage: Qdrant (vectors), PostgreSQL (metadata)                    │
│                                                                              │
│  3. Dual-Layer Caching                                                       │
│     ├─ Backend: redis_cache_service.py                                      │
│     ├─ Strategy: Semantic (embeddings) + Exact match                        │
│     ├─ Storage: Redis                                                        │
│     └─ Threshold: 0.5 (configurable)                                        │
│                                                                              │
│  4. System Prompts Management                                                │
│     ├─ Frontend: system-prompts.tsx (Settings)                              │
│     ├─ Backend: system_prompts_routes.py                                    │
│     ├─ Storage: PostgreSQL (system_prompts table)                           │
│     └─ Rule: One active prompt per workspace                                │
│                                                                              │
│  5. Q&A System                                                               │
│     ├─ Frontend: qa-section.tsx, QATable.tsx                                │
│     ├─ Backend: qa_routes.py, qa_redis_service.py                          │
│     ├─ Storage: PostgreSQL + Redis                                          │
│     └─ Features: CRUD, search, workspace filtering                          │
│                                                                              │
│  6. Embed Script Generation                                                  │
│     ├─ Frontend: scripts-page.tsx                                           │
│     ├─ Backend: script_routes.py                                            │
│     ├─ Storage: PostgreSQL (script_settings)                                │
│     └─ Features: Theme, quick buttons, model config                         │
│                                                                              │
│  7. Chat Playground                                                          │
│     ├─ Frontend: chat-playground.tsx                                        │
│     ├─ Backend: llm_routes.py (/v1/create, /v1/chat)                       │
│     ├─ Features: Streaming, caching, RAG, prompts                           │
│     └─ UI: Message components, model selector                               │
│                                                                              │
│  8. Analytics Dashboard                                                      │
│     ├─ Frontend: analytics-dashboard.tsx                                    │
│     ├─ Backend: analytics_routes.py                                         │
│     ├─ Storage: PostgreSQL (analytics_logs)                                 │
│     └─ Timezone: Asia/Kolkata (IST)                                         │
│                                                                              │
│  9. Authentication & Authorization                                           │
│     ├─ Frontend: auth-page.tsx, useAuth.ts                                  │
│     ├─ Backend: auth_utils.py, routes.py                                    │
│     ├─ Method: JWT tokens                                                   │
│     └─ Storage: PostgreSQL (users, workspaces)                              │
│                                                                              │
│  10. Contact Management (Mini CRM)                                           │
│      ├─ Frontend: ContactsTable.tsx, ContactDrawer.tsx                      │
│      ├─ Backend: contacts_routes.py                                         │
│      ├─ Storage: PostgreSQL (contacts table)                                │
│      └─ Features: CRUD, AI search integration                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: User Asks Question with RAG

```
User: "What is our return policy?"
  │
  ├─ Frontend (chat-playground.tsx)
  │   └─ Sends: POST /api/v1/create
  │       {
  │         "prompt": "What is our return policy?",
  │         "model": "meta-llama/llama-3.3-8b-instruct",
  │         "use_rag": true,
  │         "rag_top_k": 5,
  │         "rag_threshold": 0.5
  │       }
  │
  ├─ Backend (llm_routes.py)
  │   │
  │   ├─ 1. Check Redis Cache (cache miss)
  │   │
  │   ├─ 2. Get Active System Prompt
  │   │   └─ PostgreSQL: system_prompts WHERE active=true
  │   │
  │   ├─ 3. RAG Service (rag_service.py)
  │   │   │
  │   │   ├─ Embed query using all-MiniLM-L6-v2
  │   │   │
  │   │   ├─ Search Qdrant
  │   │   │   └─ Filter: workspace_id
  │   │   │   └─ top_k: 5
  │   │   │   └─ threshold: > 0.5
  │   │   │
  │   │   └─ Return relevant chunks:
  │   │       [
  │   │         "Return policy: 30 days...",
  │   │         "Refund process: Contact...",
  │   │         ...
  │   │       ]
  │   │
  │   ├─ 4. Build Augmented Prompt
  │   │   └─ System: [System prompt]
  │   │   └─ Context: [RAG chunks]
  │   │   └─ User: "What is our return policy?"
  │   │
  │   ├─ 5. Call OpenRouter API
  │   │   └─ Model: meta-llama/llama-3.3-8b-instruct
  │   │   └─ Stream: true
  │   │
  │   ├─ 6. Cache Response
  │   │   ├─ Exact: workspace:model:hash
  │   │   └─ Semantic: embedding → response
  │   │
  │   └─ 7. Stream back to frontend
  │
  └─ Frontend displays response
      └─ Streaming text with typing effect
```

### Example 2: Generate Embed Script

```
User configures theme and clicks "Save"
  │
  ├─ Frontend (scripts-page.tsx)
  │   └─ Sends: POST /api/script/{workspace_id}
  │       {
  │         "theme_settings": {
  │           "primary_color": "#6366f1",
  │           "logo_url": "data:image/...",
  │           ...
  │         },
  │         "quick_buttons": [...],
  │         "model_config": {...}
  │       }
  │
  ├─ Backend (script_routes.py)
  │   │
  │   ├─ 1. Validate workspace ownership
  │   │   └─ Check JWT workspace_id
  │   │
  │   ├─ 2. Upsert to PostgreSQL
  │   │   └─ script_settings table
  │   │       ├─ workspace_id (PK)
  │   │       ├─ theme_settings (JSONB)
  │   │       ├─ quick_buttons (JSONB)
  │   │       ├─ model_config (JSONB)
  │   │       └─ updated_at
  │   │
  │   └─ 3. Return success
  │
  └─ Frontend displays iframe code
      <iframe src="/chat-playground?
        token={api_token}&
        client_id={workspace_id}&
        site_id=1" />
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Authentication Layer                                                     │
│     ├─ JWT tokens (access + refresh)                                        │
│     ├─ Password hashing (bcrypt)                                            │
│     ├─ Email verification                                                   │
│     └─ Token expiration (configurable)                                      │
│                                                                              │
│  2. Authorization Layer                                                      │
│     ├─ Workspace isolation                                                  │
│     ├─ Role-based access (future)                                           │
│     ├─ API token scoping                                                    │
│     └─ Resource ownership validation                                        │
│                                                                              │
│  3. Network Layer                                                            │
│     ├─ CORS configuration                                                   │
│     ├─ HTTPS/TLS (production)                                               │
│     ├─ Docker network isolation                                             │
│     └─ Rate limiting (planned)                                              │
│                                                                              │
│  4. Data Layer                                                               │
│     ├─ SQL injection prevention (SQLAlchemy)                                │
│     ├─ Input validation                                                     │
│     ├─ Data encryption at rest (future)                                     │
│     └─ Workspace data segregation                                           │
│                                                                              │
│  5. API Layer                                                                │
│     ├─ API key management                                                   │
│     ├─ OpenRouter API key protection                                        │
│     ├─ Request signing (future)                                             │
│     └─ Audit logging                                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Scalability Considerations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     SCALABILITY ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Horizontal Scaling:                                                         │
│  ├─ Frontend: Multiple Nginx instances behind load balancer                 │
│  ├─ Backend: Multiple Flask workers (Gunicorn/uWSGI)                        │
│  ├─ Database: PostgreSQL read replicas                                      │
│  ├─ Redis: Redis Cluster for distributed caching                            │
│  └─ Qdrant: Distributed mode for large vector datasets                      │
│                                                                              │
│  Vertical Scaling:                                                           │
│  ├─ Increase container resources (CPU, RAM)                                 │
│  ├─ Optimize queries and indexes                                            │
│  └─ Connection pooling                                                       │
│                                                                              │
│  Caching Strategy:                                                           │
│  ├─ Multi-level caching (Redis + application cache)                         │
│  ├─ CDN for static assets                                                   │
│  └─ Browser caching headers                                                  │
│                                                                              │
│  Future Optimizations:                                                       │
│  ├─ Message queue (RabbitMQ/Celery) for async tasks                        │
│  ├─ Microservices architecture                                              │
│  ├─ Serverless functions for specific tasks                                 │
│  └─ Edge computing for global distribution                                  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-26  
**Maintained By**: Nexus AI Hub Team
