#!/usr/bin/env python3
"""
Quick RAG Test - Check if documents are retrievable
"""
import requests
import json

# Configuration
API_BASE = "http://localhost:5001/api"

print("\n" + "="*70)
print("QUICK RAG DIAGNOSTIC TEST")
print("="*70)

# Get token from user
token = input("\n🔑 Enter your Bearer token: ").strip()
if not token:
    print("❌ Token required")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Step 1: Check documents
print("\n" + "-"*70)
print("📚 STEP 1: Checking uploaded documents...")
print("-"*70)

try:
    response = requests.get(f"{API_BASE}/rag/documents", headers=headers)
    response.raise_for_status()
    data = response.json()
    docs = data.get('documents', [])
    
    print(f"✅ Found {len(docs)} document(s)")
    for i, doc in enumerate(docs, 1):
        print(f"   {i}. {doc['filename']}")
        print(f"      - Chunks: {doc['chunks']}")
        print(f"      - Uploaded: {doc.get('timestamp', 'N/A')}")
    
    if len(docs) == 0:
        print("\n⚠️  No documents found! Upload a document first via the UI.")
        exit(0)
        
except Exception as e:
    print(f"❌ Error checking documents: {e}")
    exit(1)

# Step 2: Test with different thresholds
print("\n" + "-"*70)
print("🔍 STEP 2: Testing RAG retrieval with different thresholds...")
print("-"*70)

query = input("\nEnter your question (or press Enter for 'what is the leave policy?'): ").strip()
if not query:
    query = "what is the leave policy?"

print(f"\n📝 Query: '{query}'\n")

thresholds = [0.0, 0.3, 0.5, 0.75]

for threshold in thresholds:
    print(f"\n{'='*70}")
    print(f"Testing with threshold: {threshold} (similarity >= {threshold*100}%)")
    print(f"{'='*70}")
    
    payload = {
        "query": query,
        "top_k": 5,
        "threshold": threshold
    }
    
    try:
        response = requests.post(
            f"{API_BASE}/rag/debug",
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        data = response.json()
        
        results = data.get('results', [])
        print(f"\n📊 Results: {len(results)} chunks found")
        
        if results:
            print(f"\n{'─'*70}")
            for idx, result in enumerate(results, 1):
                score = result.get('similarity', 0)
                filename = result.get('filename', 'Unknown')
                text_preview = result.get('text', '')[:150]
                
                # Color code based on score
                score_display = f"{score:.4f} ({score*100:.1f}%)"
                
                print(f"\n   Result {idx}:")
                print(f"   📈 Similarity: {score_display}")
                print(f"   📄 Source: {filename}")
                print(f"   📝 Preview: {text_preview}...")
                print(f"   {'-'*66}")
        else:
            print(f"   ❌ No results found at this threshold level")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")

# Step 3: Summary and recommendations
print("\n" + "="*70)
print("📋 SUMMARY & RECOMMENDATIONS")
print("="*70)

print("""
✅ What to do next:

1. Check the backend logs for detailed embedding information:
   - Look for lines starting with 🔍, 📚, 📊, 📈
   
2. If no results at threshold 0.0:
   - Document might not be properly embedded
   - Try re-uploading the document
   
3. If results only appear at low thresholds (0.0-0.3):
   - Lower the threshold in your chat requests
   - Add this to your chat request:
     {
       "use_rag": true,
       "rag_threshold": 0.3,
       "rag_top_k": 5
     }
   
4. If results appear at threshold 0.5+:
   - Your embeddings are working well!
   - Use threshold 0.5 for production

💡 The default threshold is 0.75 which is very strict!
   Most semantic search systems use 0.3-0.5 for good results.
""")

print("="*70)
print("✅ Test complete!")
print("="*70 + "\n")
