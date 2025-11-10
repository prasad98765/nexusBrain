# Conversational RAG - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Register Routes in `app.py`
```python
from chains.conversational_rag_routes import conversational_rag_bp
app.register_blueprint(conversational_rag_bp)
```

### 3. Use in Code
```python
from chains.rag_chain import create_conversational_rag
from rag_service import rag_service

pipeline = create_conversational_rag(
    rag_service=rag_service,
    workspace_id="workspace_123"
)

answer = pipeline.ask("What is the revenue growth?")
print(answer)
```

## 📡 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/rag/conversation/ask` | POST | Ask question |
| `/api/rag/conversation/clear` | POST | Clear memory |
| `/api/rag/conversation/stats` | GET | Get stats |
| `/api/rag/conversation/sessions` | GET | List sessions |
| `/api/rag/conversation/delete` | DELETE | Delete session |

## 💻 Code Examples

### Basic Usage
```python
from chains.rag_chain import create_conversational_rag
from rag_service import rag_service

pipeline = create_conversational_rag(
    rag_service=rag_service,
    workspace_id="workspace_123"
)

answer = pipeline.ask("Tell me about Tesla.")
```

### With Metadata
```python
response = pipeline.ask(
    "What is the revenue?",
    return_metadata=True
)

print(response['answer'])
print(f"Sources: {response['num_sources']}")
for doc in response['source_documents']:
    print(f"- {doc['filename']}")
```

### Custom Configuration
```python
pipeline = create_conversational_rag(
    rag_service=rag_service,
    workspace_id="workspace_123",
    model="gpt-4o",           # Model
    temperature=0.7,          # Temperature
    top_k=5,                  # Docs to retrieve
    threshold=0.5,            # Similarity threshold
    memory_k=3                # Conversation turns
)
```

### API Request (cURL)
```bash
curl -X POST http://localhost:5000/api/rag/conversation/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the revenue growth?",
    "session_id": "session_123",
    "top_k": 5,
    "threshold": 0.5
  }'
```

### API Request (JavaScript)
```javascript
const response = await fetch('/api/rag/conversation/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    question: "What is the revenue growth?",
    session_id: sessionId
  })
});

const data = await response.json();
console.log(data.answer);
```

## ⚙️ Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `rag_service` | RAGService | Required | RAG service instance |
| `workspace_id` | str | Required | Workspace ID |
| `model` | str | "gpt-4o" | LLM model |
| `temperature` | float | 0.7 | LLM temperature |
| `top_k` | int | 5 | Docs to retrieve |
| `threshold` | float | 0.5 | Similarity threshold |
| `memory_k` | int | 3 | Conversation turns |
| `use_prompt_enhancement` | bool | True | Enable context |

## 🧪 Testing

### Run Demo
```bash
cd server/chains
python demo_rag.py
```

### Run Examples
```bash
cd server/chains
python example_usage.py
```

### Test API
```bash
curl -X POST http://localhost:5000/api/rag/conversation/ask \
  -H "Authorization: Bearer TOKEN" \
  -d '{"question": "What is the revenue?"}'
```

## 📊 Response Format

```json
{
  "answer": "The revenue growth was 15% in Q4...",
  "sources": [
    {
      "filename": "financial_report.pdf",
      "similarity": 0.85,
      "chunk_index": 2,
      "text": "Revenue increased..."
    }
  ],
  "num_sources": 3,
  "session_id": "session_123",
  "conversation_turns": 2
}
```

## 🛠️ Common Tasks

### Clear Memory
```python
pipeline.clear_memory()
```

### Get Stats
```python
stats = pipeline.get_memory_stats()
print(f"Turns: {stats['conversation_turns']}")
```

### Change Configuration
```python
# Create new pipeline with different settings
pipeline = create_conversational_rag(
    rag_service=rag_service,
    workspace_id="workspace_123",
    top_k=10,              # More documents
    threshold=0.3,         # Lower threshold
    memory_k=5             # More history
)
```

## 🔍 Troubleshooting

### No documents retrieved?
- Check: `rag_service.list_documents(workspace_id)`
- Try: Lower threshold (e.g., `threshold=0.3`)
- Verify: Documents exist in workspace

### Wrong context retrieved?
- Check logs for prompt enhancement
- Verify: `pipeline.get_memory_stats()`
- Try: Clear memory and restart

### Memory not working?
- Check: `memory_k` parameter
- Get stats: `pipeline.get_memory_stats()`
- Clear: `pipeline.clear_memory()`

## 📁 File Locations

```
server/chains/
├── rag_chain.py                 # Main implementation
├── conversational_rag_routes.py # API routes
├── demo_rag.py                  # Demo script
├── example_usage.py             # Examples
├── README.md                    # Full docs
└── INTEGRATION_GUIDE.md         # Integration guide
```

## 🎯 Key Features

✅ Zero extra LLM calls for query enhancement  
✅ Uses existing `rag_service.retrieve_context()`  
✅ Smart conversation memory (last 3 turns)  
✅ Source document tracking  
✅ Session management  
✅ Complete API with 5 endpoints  
✅ Production-ready error handling  
✅ Comprehensive logging  

## 📖 Full Documentation

- **Complete Guide**: `README.md`
- **Integration Steps**: `INTEGRATION_GUIDE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **This Quick Ref**: `QUICK_REFERENCE.md`

## 💡 Tips

1. **First time?** Run `demo_rag.py` to see it in action
2. **Need examples?** Check `example_usage.py`
3. **Integrating?** Follow `INTEGRATION_GUIDE.md`
4. **Debugging?** Enable verbose logging in config
5. **Optimizing?** Adjust `top_k` and `threshold` based on results

## 🔗 Resources

- LangChain Docs: https://python.langchain.com/
- OpenRouter API: https://openrouter.ai/docs
- Qdrant Docs: https://qdrant.tech/documentation/

---

**Need help?** Check `README.md` for detailed documentation or `INTEGRATION_GUIDE.md` for step-by-step integration instructions.
