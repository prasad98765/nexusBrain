# RAG Implementation - Environment Variables

## Required Environment Variables

Add these to your `.env` file:

```bash
# Qdrant Configuration
QDRANT_URL=https://b98b3cb8-72f9-437c-97a7-31cee495b1d8.us-east-1-1.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key_here
```

## Installation

1. Install new Python dependencies:
```bash
cd server
pip install -r requirements.txt
```

2. Rebuild Docker containers:
```bash
docker-compose down
docker-compose up --build
```

## API Endpoints

### 1. Upload Document - `/api/rag/upload` (POST)

Upload and index documents into the knowledge base.

**Request (File Upload):**
```bash
curl -X POST http://localhost:5001/api/rag/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf"
```

**Request (Text Upload):**
```bash
curl -X POST http://localhost:5001/api/rag/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your text content here...",
    "title": "My Document"
  }'
```

**Response:**
```json
{
  "message": "Document stored successfully",
  "filename": "document.pdf",
  "chunks": 15,
  "file_size_mb": 2.34
}
```

**Supported File Types:**
- PDF (`.pdf`)
- Word Document (`.docx`)
- Text File (`.txt`)
- PowerPoint (`.pptx`)

**File Size Limit:** 10 MB

---

### 2. Chat with RAG - `/api/v1/chat/create` (POST)

Enhanced chat endpoint with RAG context retrieval.

**Request:**
```bash
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "What does the document say about pricing?"
      }
    ],
    "use_rag": true,
    "rag_top_k": 5,
    "rag_threshold": 0.75,
    "is_cached": true
  }'
```

**Parameters:**
- `use_rag` (boolean): Enable RAG retrieval (default: false)
- `rag_top_k` (integer): Number of chunks to retrieve (default: 5)
- `rag_threshold` (float): Similarity threshold 0-1 (default: 0.75)
- `is_cached` (boolean): Enable caching (default: false)

**Response:**
```json
{
  "id": "gen-xyz123",
  "model": "openai/gpt-4",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Based on your documents, the pricing is..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 450,
    "completion_tokens": 120,
    "total_tokens": 570
  }
}
```

---

### 3. Search Documents - `/api/rag/search` (POST)

Search through uploaded documents.

**Request:**
```bash
curl -X POST http://localhost:5001/api/rag/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "pricing information",
    "top_k": 5,
    "threshold": 0.75
  }'
```

**Response:**
```json
{
  "query": "pricing information",
  "results": [
    {
      "text": "Relevant chunk text...",
      "filename": "pricing_guide.pdf",
      "similarity": 0.87,
      "chunk_index": 3
    }
  ],
  "count": 5
}
```

---

## Frontend Usage

### Access Knowledge Base Page

Navigate to: `http://localhost:5173/nexus/knowledge-base`

### Features:
1. **File Upload Tab**
   - Drag & drop or click to upload
   - Supports PDF, DOCX, TXT, PPTX
   - Shows upload progress and status

2. **Text Upload Tab**
   - Paste any text content
   - Optional title for organization
   - Real-time size validation

### Using RAG in Chat

After uploading documents, enable RAG in API requests:

```javascript
const response = await fetch('/api/v1/chat/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'openai/gpt-4',
    messages: [
      { role: 'user', content: 'Your question here' }
    ],
    use_rag: true,          // Enable RAG
    rag_top_k: 5,          // Number of chunks
    rag_threshold: 0.75    // Similarity threshold
  })
});
```

---

## How It Works

1. **Document Upload**
   - File is uploaded via API endpoint
   - Text is extracted based on file type
   - Content is split into chunks (~350 tokens)

2. **Embedding & Indexing**
   - Each chunk is embedded using `all-MiniLM-L6-v2`
   - Embeddings stored in Qdrant vector database
   - Metadata includes user_id, filename, timestamp

3. **RAG Retrieval**
   - User query is embedded
   - Top-K similar chunks retrieved from Qdrant
   - Chunks filtered by similarity threshold

4. **Context Augmentation**
   - Retrieved chunks added to user message
   - Format: "Context: [chunks]\n\nQuestion: [query]"
   - Sent to LLM for generation

5. **Caching Integration**
   - Redis cache checks happen before RAG
   - RAG-augmented responses can be cached
   - Both exact and semantic caching supported

---

## Technical Details

### Chunking Strategy
- Default chunk size: 350 tokens
- Overlap: 50 tokens
- Smart paragraph-aware splitting

### Embedding Model
- Model: `all-MiniLM-L6-v2`
- Dimension: 384
- Same model used for Redis semantic cache

### Vector Database
- Database: Qdrant Cloud
- Collection: "documents"
- Distance metric: Cosine similarity

### Document Processing
- **PDF**: PyPDF2 / pdfplumber
- **DOCX**: python-docx
- **PPTX**: python-pptx
- **TXT**: Direct file read

---

## Testing

### 1. Test Document Upload
```bash
# Create a test document
echo "This is a test document about AI and machine learning." > test.txt

# Upload it
curl -X POST http://localhost:5001/api/rag/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.txt"
```

### 2. Test RAG Retrieval
```bash
curl -X POST http://localhost:5001/api/v1/chat/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openai/gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "What is this document about?"}],
    "use_rag": true
  }'
```

### 3. Test Search
```bash
curl -X POST http://localhost:5001/api/rag/search \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning"}'
```

---

## Troubleshooting

### Issue: "RAG service not properly initialized"
**Solution:** Check QDRANT_API_KEY is set in `.env`

### Issue: "No text could be extracted from document"
**Solution:** Ensure document is not encrypted/password protected

### Issue: "File size exceeds maximum"
**Solution:** Compress or split file (max 10 MB)

### Issue: "No RAG contexts found for query"
**Solution:** 
- Upload documents first
- Lower `rag_threshold` (try 0.5-0.6)
- Increase `rag_top_k`

---

## Performance Considerations

- **Optimal chunk size**: 300-400 tokens
- **Recommended top_k**: 3-5 chunks
- **Similarity threshold**: 0.75 for high precision, 0.5 for high recall
- **File processing**: Async recommended for files >5 MB

---

## Security

- User-specific data isolation (user_id filtering)
- Bearer token authentication required
- File type validation
- File size limits enforced
- Secure Qdrant Cloud connection

---

## Future Enhancements

- [ ] Document management (list, delete)
- [ ] Async file processing for large documents
- [ ] Advanced chunking strategies
- [ ] Multi-language support
- [ ] Document metadata tagging
- [ ] Hybrid search (keyword + semantic)
