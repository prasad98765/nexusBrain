#!/usr/bin/env python3
"""
Test script for Redis caching functionality.
This script tests the caching system without requiring a full Flask app.
"""

import os
import sys
import json
import logging

# Add server directory to path
sys.path.append('server')

from redis_cache_service import RedisCacheService

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_cache_service():
    """Test the Redis cache service functionality."""
    print("🧪 Testing Redis Cache Service...")
    
    # Test 1: Initialize cache service (should handle missing Redis gracefully)
    print("\n1️⃣ Testing cache service initialization...")
    cache_service = RedisCacheService()
    
    # Test 2: Get cache stats
    print("\n2️⃣ Testing cache stats...")
    stats = cache_service.get_cache_stats()
    print(f"Cache stats: {json.dumps(stats, indent=2)}")
    
    # Test 3: Test exact matching logic
    print("\n3️⃣ Testing exact match cache key generation...")
    test_request_completion = {
        "model": "openai/gpt-3.5-turbo-instruct",
        "prompt": "Hello, world!",
        "temperature": 0.7,
        "max_tokens": 100
    }
    
    test_request_chat = {
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "user", "content": "Hello, how are you?"}
        ],
        "temperature": 0.7
    }
    
    # Generate cache keys
    completion_key = cache_service._generate_cache_key(test_request_completion, "completion")
    chat_key = cache_service._generate_cache_key(test_request_chat, "chat")
    
    print(f"Completion cache key: {completion_key}")
    print(f"Chat cache key: {chat_key}")
    
    # Test 4: Test embedding generation (should handle missing ML gracefully)
    print("\n4️⃣ Testing embedding generation...")
    embedding = cache_service._generate_embedding("Hello, world!")
    if embedding:
        print(f"Generated embedding (length: {len(embedding)})")
    else:
        print("Embedding generation not available (missing dependencies)")
    
    # Test 5: Test cache operations (should handle missing Redis gracefully)
    print("\n5️⃣ Testing cache operations...")
    
    # Try to get cached response (should return None if Redis unavailable)
    cached_response = cache_service.get_cached_response(test_request_completion, "completion")
    print(f"Cached response (should be None): {cached_response}")
    
    # Try to store response (should handle gracefully if Redis unavailable)
    mock_response = {
        "id": "cmpl-test",
        "object": "text_completion",
        "created": 1234567890,
        "model": "openai/gpt-3.5-turbo-instruct",
        "choices": [{
            "text": "Hello! I'm doing well, thank you for asking.",
            "index": 0,
            "finish_reason": "stop"
        }],
        "usage": {
            "prompt_tokens": 5,
            "completion_tokens": 11,
            "total_tokens": 16
        }
    }
    
    stored = cache_service.store_response(test_request_completion, mock_response, "completion")
    print(f"Response stored: {stored}")
    
    # Test 6: Test cache clearing
    print("\n6️⃣ Testing cache clearing...")
    cleared = cache_service.clear_cache()
    print(f"Cache entries cleared: {cleared}")
    
    print(f"\n✅ Cache service test completed!")
    print(f"Redis connected: {cache_service.redis_client is not None}")
    print(f"Embedding model loaded: {cache_service.embedding_model is not None}")
    
    return stats

def print_setup_instructions():
    """Print setup instructions for Redis."""
    print("\n📋 Redis Setup Instructions:")
    print("=" * 50)
    print("To enable Redis caching, set the REDIS_URL environment variable:")
    print("For Redis Cloud (with SSL and authentication):")
    print("  export REDIS_URL='rediss://:password@redis-14311.crce206.ap-south-1-1.ec2.redns.redis-cloud.com:14311/0'")
    print("\nFor local Redis:")
    print("  export REDIS_URL='redis://localhost:6379/0'")
    print("\nTo install required dependencies:")
    print("  pip install redis sentence-transformers numpy scikit-learn")
    print("=" * 50)

if __name__ == "__main__":
    print("🚀 Redis Cache System Test")
    print("=" * 40)
    
    # Check environment
    redis_url = os.getenv("REDIS_URL")
    if redis_url:
        print(f"✅ REDIS_URL is set: {redis_url[:20]}...")
    else:
        print("⚠️  REDIS_URL is not set")
    
    # Run tests
    try:
        stats = test_cache_service()
        print(f"\n📊 Final Status:")
        print(f"- Cache Status: {stats.get('status', 'unknown')}")
        print(f"- Redis Connected: {stats.get('redis_connected', False)}")
        print(f"- Embedding Model: {stats.get('embedding_model_loaded', False)}")
        
        if not stats.get('redis_connected', False):
            print_setup_instructions()
            
    except Exception as e:
        logger.error(f"Test failed: {e}")
        print_setup_instructions()