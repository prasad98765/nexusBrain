#!/usr/bin/env python3
"""
RAG Debug Script - Test document retrieval
"""
import requests
import json
import sys

# Configuration
API_BASE = "http://localhost:5001/api"
TOKEN = input("Enter your Bearer token: ").strip()

if not TOKEN:
    print("Error: Token required")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

print("\n" + "="*60)
print("RAG DEBUGGING TOOL")
print("="*60)

# 1. List documents
print("\n📚 Step 1: Checking uploaded documents...")
response = requests.get(f"{API_BASE}/rag/documents", headers=headers)
if response.ok:
    data = response.json()
    docs = data.get('documents', [])
    print(f"✅ Found {len(docs)} document(s):")
    for doc in docs:
        print(f"  - {doc['filename']}: {doc['chunks']} chunks")
else:
    print(f"❌ Error: {response.status_code} - {response.text}")
    sys.exit(1)

if len(docs) == 0:
    print("\n⚠️ No documents found! Please upload a document first.")
    sys.exit(0)

# 2. Test search with different thresholds
print("\n🔍 Step 2: Testing RAG search...")
query = input("\nEnter your question (or press Enter for 'leave policy'): ").strip()
if not query:
    query = "leave policy"

print(f"\nTesting query: '{query}'")

thresholds = [0.0, 0.3, 0.5, 0.75]

for threshold in thresholds:
    print(f"\n--- Testing with threshold: {threshold} ---")
    
    payload = {
        "query": query,
        "top_k": 10,
        "threshold": threshold
    }
    
    response = requests.post(
        f"{API_BASE}/rag/debug",
        headers=headers,
        json=payload
    )
    
    if response.ok:
        data = response.json()
        results = data.get('results', [])
        print(f"Results: {len(results)}")
        
        for idx, result in enumerate(results[:3], 1):
            print(f"\n  {idx}. Score: {result['similarity']:.4f}")
            print(f"     File: {result['filename']}")
            print(f"     Preview: {result['text'][:100]}...")
    else:
        print(f"❌ Error: {response.status_code} - {response.text}")

print("\n" + "="*60)
print("✅ Debug complete! Check backend logs for detailed information.")
print("="*60)
