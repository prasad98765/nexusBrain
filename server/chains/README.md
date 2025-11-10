# Conversational RAG Pipeline - LangChain Implementation

## Overview

This implementation provides a production-ready conversational RAG (Retrieval-Augmented Generation) pipeline using LangChain's `ConversationalRetrievalChain`. It integrates seamlessly with our existing `rag_service.retrieve_context()` function while adding conversational memory and context-aware retrieval.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Conversational RAG Pipeline                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  User Question                                                   │
│       ↓                                                          │
│  Prompt Enhancement (No LLM Call)                               │
│       ↓                                                          │
│  Custom RAG Retriever                                            │
│       ↓                                                          │
│  rag_service.retrieve_context()                                 │
│       ↓                                                          │
│  Document Retrieval (Qdrant)                                    │
│       ↓                                                          │
│  LLM Response Generation (OpenRouter)                           │
│       ↓                                                          │
│  Conversation Memory (Buffer k=3)                               │
│       ↓                                                          │
│  Response                                                        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. CustomRagRetriever (rag_chain.py)

A LangChain `BaseRetriever` that wraps our existing RAG service:

```python
class CustomRagRetriever(BaseRetriever):
    def __init__(self, rag_service, workspace_id, top_k=5, threshold=0.5):
        self.rag_service = rag_service
        self.workspace_id = workspace_id
        self.top_k = top_k
        self.threshold = threshold

    def _get_relevant_documents(self, query):
        # Calls rag_service.retrieve_context()
        contexts = self.rag_service.retrieve_context(
            query=query,
            workspace_id=self.workspace_id,
            top_k=self.top_k,
            similarity_threshold=self.threshold
        )
        
        # Converts to LangChain Documents
        return [Document(page_content=ctx['text'], metadata={...}) for ctx in contexts]
```

**Features:**
- ✅ Integrates with existing `rag_service`
- ✅ Workspace-based filtering
- ✅ Configurable top_k and similarity threshold
- ✅ Detailed logging for debugging

### 2. Prompt Enhancement (No LLM Call)

Instead of using an LLM to rewrite queries, we use a **prompt-style approach** that combines conversation history with the current question:

```python
def build_prompt_query(user_question, chat_history):
    """
    Build enhanced query using conversation context
    NO LLM CALL - just string formatting
    """
    recent_history = chat_history[-3:]  # Last 3 turns
    
    history_summary = "\n".join([
        f"User: {user_msg}\nAssistant: {assistant_msg}"
        for user_msg, assistant_msg in recent_history
    ])
    
    return f"""You are retrieving information from a knowledge base.
Use the previous conversation only if it clarifies the current question.
Otherwise, focus on the latest query.

Previous conversation (optional):
{history_summary}

User's current question:
{user_question}

Return only information directly relevant to the user's question."""
```

**Benefits:**
- ✅ Zero additional LLM API calls
- ✅ Fast query enhancement
- ✅ Contextual retrieval without polluting embeddings
- ✅ Smart handling of topic changes

### 3. ConversationalRAGPipeline

Main pipeline class that orchestrates everything:

```python
pipeline = ConversationalRAGPipeline(
    rag_service=rag_service,
    workspace_id="workspace_123",
    model="gpt-4o",
    temperature=0.7,
    top_k=5,
    threshold=0.5,
    memory_k=3,  # Keep last 3 conversation turns
    use_prompt_enhancement=True
)

# Ask questions
answer = pipeline.ask("Tell me about Tesla stock.")
answer = pipeline.ask("What was its performance last quarter?")  # Uses context
```

**Features:**
- ✅ Conversation memory (LangChain `ConversationBufferMemory`)
- ✅ Automatic context management
- ✅ Source document tracking
- ✅ Detailed logging
- ✅ Metadata return option

## Usage

### Basic Usage

```python
from rag_service import rag_service
from chains.rag_chain import create_conversational_rag

# Create pipeline
rag_pipeline = create_conversational_rag(
    rag_service=rag_service,
    workspace_id="your_workspace_id",
    model="gpt-4o",
    top_k=5,
    threshold=0.5
)

# Ask questions
answer = rag_pipeline.ask("What is the revenue growth?")
print(answer)
```

### With Metadata

```python
response = rag_pipeline.ask(
    "What is the revenue growth?",
    return_metadata=True
)

print(response['answer'])
print(f"Sources: {response['num_sources']}")

for doc in response['source_documents']:
    print(f"- {doc['filename']} (similarity: {doc['similarity']:.4f})")
```

### Memory Management

```python
# Get memory stats
stats = rag_pipeline.get_memory_stats()
print(f"Turns: {stats['conversation_turns']}")

# Clear memory
rag_pipeline.clear_memory()
```

## Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `rag_service` | RAGService | Required | Instance of RAG service |
| `workspace_id` | str | Required | Workspace ID for filtering |
| `model` | str | "gpt-4o" | LLM model (via OpenRouter) |
| `temperature` | float | 0.7 | LLM temperature |
| `top_k` | int | 5 | Number of documents to retrieve |
| `threshold` | float | 0.5 | Similarity threshold |
| `memory_k` | int | 3 | Number of conversation turns to keep |
| `use_prompt_enhancement` | bool | True | Enable prompt-style query enhancement |

## Expected Behavior

### Scenario 1: Follow-up Questions
```python
# Question 1
pipeline.ask("Tell me about Tesla stock.")
# Retrieves: Tesla-related documents

# Question 2 (follow-up)
pipeline.ask("What about its performance?")
# Uses context: "Tesla" + "performance" → retrieves relevant Tesla performance docs
```

### Scenario 2: Topic Change
```python
# Question 1
pipeline.ask("Tell me about Tesla stock.")
# Retrieves: Tesla documents

# Question 2 (new topic)
pipeline.ask("What about Apple?")
# New topic detected → retrieves Apple documents, ignores Tesla context
```

### Scenario 3: Unrelated Question
```python
# After discussing stocks
pipeline.ask("What's the weather?")
# No relevant documents found → LLM responds without RAG context
```

## Logging Output

The pipeline provides comprehensive logging:

```
🚀 Initializing ConversationalRAGPipeline
   Workspace: workspace_123
   Model: gpt-4o
   RAG top_k: 5, threshold: 0.5
   Memory: 3 turns
   Prompt enhancement: True

✅ LLM initialized: gpt-4o
✅ CustomRagRetriever initialized - workspace: workspace_123
✅ Memory initialized with k=3
✅ ConversationalRetrievalChain initialized

🎯 New question: Tell me about Tesla stock.
📝 No chat history - using raw question for retrieval
🔍 CustomRagRetriever - Retrieving documents for query: 'Tell me about Tesla stock.'
📄 Retrieved 3 contexts from RAG service
  📄 Doc 1: tesla_report.pdf (similarity: 0.8542)
  📄 Doc 2: stock_analysis.pdf (similarity: 0.7821)
  📄 Doc 3: market_overview.pdf (similarity: 0.6543)

✅ Answer generated:
   Length: 245 chars
   Sources: 3 documents

📚 Source documents retrieved:
   1. tesla_report.pdf (chunk 2, similarity: 0.8542)
   2. stock_analysis.pdf (chunk 5, similarity: 0.7821)
   3. market_overview.pdf (chunk 1, similarity: 0.6543)
```

## Testing

Run the demo script:

```bash
cd server/chains
python demo_rag.py
```

This will:
1. Initialize the pipeline
2. Ask 4 test questions (2 topics with follow-ups)
3. Display answers and source documents
4. Show memory statistics

## Integration with Existing Code

### Option 1: Direct Integration

```python
from chains.rag_chain import create_conversational_rag

# In your route handler
@app.route('/api/chat/rag', methods=['POST'])
def chat_with_rag():
    workspace_id = request.user.get('workspace_id')
    question = request.json.get('question')
    
    pipeline = create_conversational_rag(
        rag_service=rag_service,
        workspace_id=workspace_id
    )
    
    response = pipeline.ask(question, return_metadata=True)
    
    return jsonify({
        'answer': response['answer'],
        'sources': response['source_documents'],
        'num_sources': response['num_sources']
    })
```

### Option 2: Session-based (Persistent Memory)

```python
# Store pipelines per session
rag_pipelines = {}

@app.route('/api/chat/rag', methods=['POST'])
def chat_with_rag():
    session_id = request.json.get('session_id')
    workspace_id = request.user.get('workspace_id')
    question = request.json.get('question')
    
    # Get or create pipeline for session
    if session_id not in rag_pipelines:
        rag_pipelines[session_id] = create_conversational_rag(
            rag_service=rag_service,
            workspace_id=workspace_id
        )
    
    pipeline = rag_pipelines[session_id]
    response = pipeline.ask(question, return_metadata=True)
    
    return jsonify(response)

@app.route('/api/chat/rag/clear', methods=['POST'])
def clear_rag_memory():
    session_id = request.json.get('session_id')
    if session_id in rag_pipelines:
        rag_pipelines[session_id].clear_memory()
    return jsonify({'status': 'cleared'})
```

## Performance Considerations

1. **No Extra LLM Calls**: Query enhancement is done via string formatting, not LLM calls
2. **Memory Efficient**: Only keeps last `k` conversation turns
3. **Fast Retrieval**: Uses existing optimized `rag_service.retrieve_context()`
4. **Workspace Isolation**: Documents filtered by workspace_id

## Troubleshooting

### Issue: No documents retrieved

**Check:**
1. Documents exist in workspace: `rag_service.list_documents(workspace_id)`
2. Similarity threshold not too high: try `threshold=0.3`
3. Query embedding generated successfully (check logs)

### Issue: Wrong context retrieved

**Check:**
1. Prompt enhancement is working (check logs for "📝 Built prompt query")
2. Conversation history is correct: `pipeline.get_memory_stats()`
3. Similarity scores in logs

### Issue: Memory not working

**Check:**
1. `memory_k` parameter set correctly
2. Memory stats: `pipeline.get_memory_stats()`
3. Clear and restart if needed: `pipeline.clear_memory()`

## Future Enhancements

- [ ] Hybrid retrieval (semantic + keyword)
- [ ] Metadata filtering (by document type, date, etc.)
- [ ] Multi-workspace queries
- [ ] Custom prompt templates
- [ ] Streaming responses
- [ ] Redis-based memory persistence

## Dependencies

Required packages (added to `requirements.txt`):
```
langchain==0.1.20
langchain-core==0.1.52
langchain-community==0.0.38
langchain-openai==0.1.7
```

All other dependencies already exist in the project.
