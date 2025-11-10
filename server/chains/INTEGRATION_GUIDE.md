# Integration Guide - Conversational RAG Pipeline

## Quick Start Integration

### 1. Add Route to Existing API

Create a new endpoint in your Flask app (e.g., in `llm_routes.py` or a new `conversational_rag_routes.py`):

```python
from flask import Blueprint, request, jsonify
from auth_utils import require_auth
from rag_service import rag_service
from chains.rag_chain import create_conversational_rag
import logging

logger = logging.getLogger(__name__)

# In-memory storage for active RAG pipelines (session-based)
active_rag_sessions = {}

conversational_rag_bp = Blueprint('conversational_rag', __name__)


@conversational_rag_bp.route('/api/rag/conversation/ask', methods=['POST'])
@require_auth
def conversational_rag_ask():
    """
    Ask a question using conversational RAG
    
    Request body:
    {
        "question": "What is the revenue growth?",
        "session_id": "user_session_123",  // Optional, for conversation continuity
        "top_k": 5,                         // Optional, default 5
        "threshold": 0.5,                   // Optional, default 0.5
        "model": "gpt-4o",                  // Optional, default gpt-4o
        "temperature": 0.7,                 // Optional, default 0.7
        "memory_k": 3                       // Optional, default 3
    }
    
    Response:
    {
        "answer": "The revenue growth was...",
        "sources": [
            {
                "filename": "report.pdf",
                "similarity": 0.85,
                "chunk_index": 2,
                "text": "..."
            }
        ],
        "num_sources": 3,
        "session_id": "user_session_123",
        "conversation_turns": 2
    }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        data = request.get_json()
        question = data.get('question')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Get or generate session ID
        session_id = data.get('session_id', f"{workspace_id}_{os.urandom(8).hex()}")
        
        # Get configuration
        top_k = data.get('top_k', 5)
        threshold = data.get('threshold', 0.5)
        model = data.get('model', 'gpt-4o')
        temperature = data.get('temperature', 0.7)
        memory_k = data.get('memory_k', 3)
        
        # Get or create RAG pipeline for this session
        pipeline_key = f"{workspace_id}_{session_id}"
        
        if pipeline_key not in active_rag_sessions:
            logger.info(f"Creating new RAG pipeline for session: {session_id}")
            active_rag_sessions[pipeline_key] = create_conversational_rag(
                rag_service=rag_service,
                workspace_id=workspace_id,
                model=model,
                temperature=temperature,
                top_k=top_k,
                threshold=threshold,
                memory_k=memory_k,
                use_prompt_enhancement=True
            )
        
        pipeline = active_rag_sessions[pipeline_key]
        
        # Ask question with metadata
        response = pipeline.ask(question, return_metadata=True)
        
        # Get memory stats
        stats = pipeline.get_memory_stats()
        
        return jsonify({
            'answer': response['answer'],
            'sources': response['source_documents'],
            'num_sources': response['num_sources'],
            'session_id': session_id,
            'conversation_turns': stats['conversation_turns'],
            'query_enhanced': response.get('query_enhanced', False)
        }), 200
        
    except Exception as e:
        logger.error(f"Conversational RAG error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@conversational_rag_bp.route('/api/rag/conversation/clear', methods=['POST'])
@require_auth
def clear_conversation():
    """
    Clear conversation memory for a session
    
    Request body:
    {
        "session_id": "user_session_123"
    }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        pipeline_key = f"{workspace_id}_{session_id}"
        
        if pipeline_key in active_rag_sessions:
            active_rag_sessions[pipeline_key].clear_memory()
            logger.info(f"Cleared memory for session: {session_id}")
        
        return jsonify({
            'status': 'cleared',
            'session_id': session_id
        }), 200
        
    except Exception as e:
        logger.error(f"Clear conversation error: {e}")
        return jsonify({'error': str(e)}), 500


@conversational_rag_bp.route('/api/rag/conversation/stats', methods=['GET'])
@require_auth
def get_conversation_stats():
    """
    Get conversation statistics for a session
    
    Query params:
    - session_id: Session ID
    """
    try:
        workspace_id = request.user.get('workspace_id')
        session_id = request.args.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        pipeline_key = f"{workspace_id}_{session_id}"
        
        if pipeline_key not in active_rag_sessions:
            return jsonify({
                'exists': False,
                'message': 'Session not found'
            }), 404
        
        pipeline = active_rag_sessions[pipeline_key]
        stats = pipeline.get_memory_stats()
        
        return jsonify({
            'exists': True,
            'session_id': session_id,
            **stats
        }), 200
        
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        return jsonify({'error': str(e)}), 500


@conversational_rag_bp.route('/api/rag/conversation/sessions', methods=['GET'])
@require_auth
def list_active_sessions():
    """
    List all active conversational RAG sessions for the workspace
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        # Filter sessions by workspace
        workspace_sessions = []
        for pipeline_key in active_rag_sessions.keys():
            if pipeline_key.startswith(f"{workspace_id}_"):
                session_id = pipeline_key.replace(f"{workspace_id}_", "")
                stats = active_rag_sessions[pipeline_key].get_memory_stats()
                workspace_sessions.append({
                    'session_id': session_id,
                    'conversation_turns': stats['conversation_turns'],
                    'has_history': stats['has_history']
                })
        
        return jsonify({
            'sessions': workspace_sessions,
            'count': len(workspace_sessions)
        }), 200
        
    except Exception as e:
        logger.error(f"List sessions error: {e}")
        return jsonify({'error': str(e)}), 500
```

### 2. Register Blueprint in `app.py`

```python
from chains.conversational_rag_routes import conversational_rag_bp

# Register blueprint
app.register_blueprint(conversational_rag_bp)
```

## Frontend Integration Examples

### JavaScript/TypeScript (Fetch API)

```typescript
interface RAGResponse {
  answer: string;
  sources: {
    filename: string;
    similarity: number;
    chunk_index: number;
    text: string;
  }[];
  num_sources: number;
  session_id: string;
  conversation_turns: number;
}

class ConversationalRAGClient {
  private sessionId: string | null = null;
  private apiUrl: string;

  constructor(apiUrl: string = '/api/rag/conversation') {
    this.apiUrl = apiUrl;
  }

  async ask(question: string, options?: {
    top_k?: number;
    threshold?: number;
    model?: string;
  }): Promise<RAGResponse> {
    const response = await fetch(`${this.apiUrl}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({
        question,
        session_id: this.sessionId,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store session ID for conversation continuity
    if (data.session_id) {
      this.sessionId = data.session_id;
    }

    return data;
  }

  async clearMemory(): Promise<void> {
    if (!this.sessionId) return;

    await fetch(`${this.apiUrl}/clear`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({
        session_id: this.sessionId
      })
    });

    this.sessionId = null;
  }

  private getAuthToken(): string {
    // Implement your auth token retrieval
    return localStorage.getItem('auth_token') || '';
  }
}

// Usage
const ragClient = new ConversationalRAGClient();

// Ask first question
const response1 = await ragClient.ask("What is the revenue growth?");
console.log(response1.answer);
console.log(`Sources: ${response1.num_sources}`);

// Ask follow-up (uses conversation context)
const response2 = await ragClient.ask("What about last quarter?");
console.log(response2.answer);

// Clear conversation
await ragClient.clearMemory();
```

### React Hook Example

```tsx
import { useState, useCallback } from 'react';

interface RAGMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
}

export function useConversationalRAG() {
  const [messages, setMessages] = useState<RAGMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ask = useCallback(async (question: string) => {
    setIsLoading(true);
    
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: question
    }]);

    try {
      const response = await fetch('/api/rag/conversation/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          question,
          session_id: sessionId
        })
      });

      const data = await response.json();

      // Store session ID
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      // Add assistant message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        sources: data.sources
      }]);

      return data;
    } catch (error) {
      console.error('RAG error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clearConversation = useCallback(async () => {
    if (sessionId) {
      await fetch('/api/rag/conversation/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ session_id: sessionId })
      });
    }
    
    setMessages([]);
    setSessionId(null);
  }, [sessionId]);

  return {
    messages,
    ask,
    clearConversation,
    isLoading,
    sessionId
  };
}

// Usage in component
function ChatWithRAG() {
  const { messages, ask, clearConversation, isLoading } = useConversationalRAG();
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await ask(input);
    setInput('');
  };

  return (
    <div>
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <p>{msg.content}</p>
            {msg.sources && (
              <div className="sources">
                <strong>Sources:</strong>
                {msg.sources.map((src, i) => (
                  <span key={i}>{src.filename}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>

      <button onClick={clearConversation}>
        Clear Conversation
      </button>
    </div>
  );
}
```

### Python Client Example

```python
import requests

class ConversationalRAGClient:
    def __init__(self, api_url, auth_token):
        self.api_url = api_url
        self.auth_token = auth_token
        self.session_id = None
    
    def ask(self, question, **kwargs):
        """Ask a question"""
        response = requests.post(
            f"{self.api_url}/api/rag/conversation/ask",
            headers={
                'Authorization': f'Bearer {self.auth_token}',
                'Content-Type': 'application/json'
            },
            json={
                'question': question,
                'session_id': self.session_id,
                **kwargs
            }
        )
        
        response.raise_for_status()
        data = response.json()
        
        # Store session ID
        self.session_id = data.get('session_id')
        
        return data
    
    def clear(self):
        """Clear conversation memory"""
        if not self.session_id:
            return
        
        requests.post(
            f"{self.api_url}/api/rag/conversation/clear",
            headers={
                'Authorization': f'Bearer {self.auth_token}',
                'Content-Type': 'application/json'
            },
            json={'session_id': self.session_id}
        )
        
        self.session_id = None

# Usage
client = ConversationalRAGClient(
    api_url='http://localhost:5000',
    auth_token='your_token_here'
)

# Start conversation
response = client.ask("What is the revenue growth?")
print(response['answer'])
print(f"Sources: {response['num_sources']}")

# Follow-up question
response = client.ask("What about last quarter?")
print(response['answer'])

# Clear memory
client.clear()
```

## Session Management Strategies

### Strategy 1: Auto-cleanup (Recommended)

Add a cleanup function that removes old sessions:

```python
from datetime import datetime, timedelta
import threading

# Track session last access time
session_last_access = {}

def cleanup_old_sessions():
    """Remove sessions inactive for > 30 minutes"""
    cutoff_time = datetime.now() - timedelta(minutes=30)
    
    to_remove = []
    for session_key, last_access in session_last_access.items():
        if last_access < cutoff_time:
            to_remove.append(session_key)
    
    for session_key in to_remove:
        if session_key in active_rag_sessions:
            del active_rag_sessions[session_key]
        del session_last_access[session_key]
    
    logger.info(f"Cleaned up {len(to_remove)} inactive sessions")

# Run cleanup every 10 minutes
def start_cleanup_thread():
    cleanup_old_sessions()
    threading.Timer(600, start_cleanup_thread).start()

start_cleanup_thread()
```

### Strategy 2: Redis-based Persistence

For production, store session data in Redis:

```python
import redis
import pickle

redis_client = redis.Redis(host='localhost', port=6379, db=0)

def get_or_create_pipeline(workspace_id, session_id, **config):
    """Get pipeline from Redis or create new"""
    key = f"rag_session:{workspace_id}:{session_id}"
    
    # Try to load from Redis
    cached = redis_client.get(key)
    if cached:
        return pickle.loads(cached)
    
    # Create new pipeline
    pipeline = create_conversational_rag(
        rag_service=rag_service,
        workspace_id=workspace_id,
        **config
    )
    
    # Save to Redis (expire in 1 hour)
    redis_client.setex(
        key,
        3600,
        pickle.dumps(pipeline)
    )
    
    return pipeline
```

## Testing

Test the endpoint:

```bash
curl -X POST http://localhost:5000/api/rag/conversation/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is the revenue growth?",
    "top_k": 5,
    "threshold": 0.5
  }'
```

## Monitoring and Logging

Add monitoring to track usage:

```python
import time

@conversational_rag_bp.route('/api/rag/conversation/ask', methods=['POST'])
@require_auth
def conversational_rag_ask():
    start_time = time.time()
    
    
    # Log metrics
    duration = time.time() - start_time
    logger.info(f"RAG query completed in {duration:.2f}s - sources: {response['num_sources']}")
    
    return jsonify(response)
```

## Production Checklist

- [ ] Add rate limiting (e.g., max 10 requests/minute per user)
- [ ] Implement session cleanup (remove inactive sessions)
- [ ] Add request validation
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Add caching for frequently asked questions
- [ ] Implement session persistence (Redis)
- [ ] Add usage analytics
- [ ] Set up load balancing for high traffic
- [ ] Configure request timeouts
- [ ] Add CORS configuration if needed

## Next Steps

1. Create the routes file: `server/chains/conversational_rag_routes.py`
2. Register blueprint in `app.py`
3. Test with Postman or curl
4. Integrate into frontend
5. Monitor and optimize based on usage
