import os
import json
import hashlib
import time
import logging
import redis
from typing import Optional, Dict, Any, Tuple, List

from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.vectorstores import Redis as LangchainRedis
from langchain_community.embeddings import SentenceTransformerEmbeddings
from langchain_openai import ChatOpenAI  # works for OpenRouter if set via env
from langchain.schema import HumanMessage, AIMessage

from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# -----------------------------------------------------------
# LangChain + Redis + OpenRouter Unified Caching Class
# -----------------------------------------------------------
class RedisCacheService:
    def __init__(
        self,
        redis_url: Optional[str] = os.getenv("REDIS_URL"),
        similarity_threshold: float = 0.50,
        embedding_model: str = "all-MiniLM-L6-v2",
    ):
        self.redis_url = redis_url
        self.similarity_threshold = similarity_threshold
        self.embedding_model_name = embedding_model

        # Redis Connection
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.embedding_model = SentenceTransformer(embedding_model)
        self.embedding = SentenceTransformerEmbeddings(model_name=embedding_model)

        # For LangChain memory-based conversation context
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )

        logger.info("✅ LangChainRedisCacheService initialized successfully")

    # -----------------------------------------------------------
    # Utility: Cache key generation (same as your structure)
    # -----------------------------------------------------------
    def _generate_cache_key(self, request_data: Dict[str, Any], endpoint_type: str, workspace_id: str = None) -> str:
        serialized = json.dumps(request_data, sort_keys=True)
        cache_key = hashlib.sha256(serialized.encode()).hexdigest()
        workspace_prefix = f"ws:{workspace_id}:" if workspace_id else ""
        return f"llm_cache:{workspace_prefix}{endpoint_type}:{cache_key}"

    # -----------------------------------------------------------
    # Exact match cache lookup
    # -----------------------------------------------------------
    def _get_exact_match(self, cache_key: str):
        data = self.redis_client.get(cache_key)
        if not data:
            return None
        try:
            obj = json.loads(data)
            return obj
        except Exception:
            return None

    # -----------------------------------------------------------
    # Semantic cache lookup using embeddings
    # -----------------------------------------------------------
    def _find_semantic_match(
        self, query_text: str, endpoint_type: str, workspace_id: str
    ) -> Tuple[Optional[Dict[str, Any]], float]:
        workspace_prefix = f"ws:{workspace_id}:" if workspace_id else ""
        keys = self.redis_client.keys(f"llm_cache:{workspace_prefix}{endpoint_type}:*")

        if not keys:
            return None, 0.0

        query_emb = self.embedding_model.encode(query_text)
        best_match = None
        best_similarity = 0.0

        for key in keys:
            data = self.redis_client.get(key)
            if not data:
                continue
            entry = json.loads(data)
            emb = entry.get("embedding")
            if not emb:
                continue
            sim = cosine_similarity(
                np.array(query_emb).reshape(1, -1), np.array(emb).reshape(1, -1)
            )[0][0]
            if sim > best_similarity:
                best_similarity = sim
                best_match = entry

        if best_similarity >= self.similarity_threshold:
            return best_match, best_similarity
        return None, best_similarity

    # -----------------------------------------------------------
    # Get cached response (exact + semantic)
    # -----------------------------------------------------------
    def get_cached_response(
        self, request_data: Dict[str, Any], endpoint_type: str, workspace_id: str,
        threshold: Optional[float] = None, conversation_context: Optional[str] = None
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """Legacy method for backward compatibility - use call_llm or ask_followup instead"""
        cache_key = self._generate_cache_key(request_data, endpoint_type, workspace_id)
        # Try exact match
        exact = self._get_exact_match(cache_key)
        if exact:
            return exact["response"], "exact"

        # Try semantic match
        if endpoint_type == "chat":
            text = request_data["messages"][-1]["content"]
        else:
            text = request_data.get("prompt", "")
        semantic, score = self._find_semantic_match(text, endpoint_type, workspace_id)
        if semantic:
            return semantic["response"], f"semantic ({score:.2f})"

        return None, None

    # -----------------------------------------------------------
    # Store response in Redis (with embedding)
    # -----------------------------------------------------------
    def store_response(
        self, request_data: Dict[str, Any], response_data: Dict[str, Any],
        endpoint_type: str, workspace_id: str
    ) -> bool:
        cache_key = self._generate_cache_key(request_data, endpoint_type, workspace_id)

        # Extract text for embedding
        text = (
            request_data["messages"][-1]["content"]
            if endpoint_type == "chat"
            else request_data.get("prompt", "")
        )
        emb = self.embedding_model.encode(text).tolist()

        entry = {
            "request": request_data,
            "response": response_data,
            "embedding": emb,
            "timestamp": time.time(),
            "workspace_id": workspace_id,
        }

        self.redis_client.setex(cache_key, 2592000, json.dumps(entry))  # 30 days
        logger.info(f"✅ Stored LLM response in Redis cache [{cache_key}]")
        return True

    # -----------------------------------------------------------
    # LangChain-powered LLM call with cache
    # -----------------------------------------------------------
    def call_llm(
        self, user_input: str, workspace_id: str, endpoint_type: str = "chat"
    ) -> Dict[str, Any]:
        """Main entry: handles cache lookup, LLM call, and store."""
        request_data = {
            "messages": [{"role": "user", "content": user_input}]
        }

        # Check cache (exact or semantic)
        cached, cache_type = self.get_cached_response(request_data, endpoint_type, workspace_id)
        if cached:
            # Extract answer from cached response
            answer = cached.get('choices', [{}])[0].get('message', {}).get('content', '')
            if not answer:  # Fallback for different response formats
                answer = cached.get('answer', '')
            return {
                "answer": answer,
                "cache_hit": cache_type,
                "cached_data": cached  # Return full cached response with usage/provider
            }

        # No cache — return empty result (let the existing pipeline handle LLM call)
        # This allows the existing OpenRouter integration to work
        return {"answer": None, "cache_hit": False, "cached_data": {}}

    # -----------------------------------------------------------
    # For follow-up (context-aware) conversation
    # -----------------------------------------------------------
    def ask_followup(self, user_input: str, workspace_id: str):
        """Handles context using LangChain memory (previous chat retained)."""
        # Build request with conversation history from memory
        messages = self.memory.load_memory_variables({}).get("chat_history", [])
        if messages:
            request_data = {
                "messages": [{"role": m.type, "content": m.content} for m in messages] + [{"role": "user", "content": user_input}]
            }
        else:
            request_data = {"messages": [{"role": "user", "content": user_input}]}

        # Check cache with conversation context
        cached, cache_type = self.get_cached_response(request_data, "chat", workspace_id)
        if cached:
            # Extract answer from cached response
            answer = cached.get('choices', [{}])[0].get('message', {}).get('content', '')
            if not answer:  # Fallback for different response formats
                answer = cached.get('answer', '')
            
            # Update memory with cached result
            self.memory.chat_memory.add_user_message(user_input)
            self.memory.chat_memory.add_ai_message(answer)
            
            return {
                "answer": answer,
                "cache_hit": cache_type,
                "cached_data": cached  # Return full cached response with usage/provider
            }

        # No cache - return empty result (let existing pipeline handle it)
        return {"answer": None, "cache_hit": False, "cached_data": {}}

# Global cache service instance
cache_service = None

def get_cache_service(cache_threshold: Optional[float] = None) -> RedisCacheService:
    """
    Get or create the global cache service instance.
    
    Args:
        cache_threshold: Optional float between 0 and 1 to set semantic similarity threshold.
                        Higher values mean stricter matching (e.g., 0.8 requires 80% similarity).
                        Lower values allow more flexible matching (e.g., 0.6 allows 60% similarity).
                        Default is None, which uses the service's default threshold (0.75).
    
    Returns:
        RedisCacheService instance
    """
    global cache_service
    if cache_service is None:
        # Map cache_threshold to similarity_threshold parameter
        if cache_threshold is not None and not (0.1 <= cache_threshold <= 0.99):
            logger.warning(f"Invalid cache_threshold {cache_threshold}, must be between 0.1 and 0.99. Using default.")
            cache_threshold = None
        cache_service = RedisCacheService(similarity_threshold=cache_threshold if cache_threshold else 0.50)
    elif cache_threshold is not None and cache_threshold != cache_service.similarity_threshold:
        logger.info(f"Updating similarity threshold from {cache_service.similarity_threshold} to {cache_threshold}")
        cache_service.similarity_threshold = cache_threshold
    return cache_service