import os
import json
import hashlib
import time
import logging
import ssl
import re
from typing import Optional, Dict, Any, List, Tuple, Union
from dataclasses import dataclass

# Try to import Redis and ML libraries with fallbacks
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    SentenceTransformer = None
    np = None
    cosine_similarity = None

logger = logging.getLogger(__name__)

@dataclass
class CacheEntry:
    request: Dict[str, Any]
    response: Dict[str, Any]
    timestamp: float
    embedding: Optional[List[float]] = None

class RedisCacheService:
    def __init__(self, 
                 redis_url: Optional[str] = os.getenv("REDIS_URL"),
                 similarity_threshold: float = 0.75,
                 embedding_model: str = "all-MiniLM-L6-v2"):
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        self.similarity_threshold = similarity_threshold
        self.embedding_model_name = embedding_model
        ML_AVAILABLE = True

        # Initialize Redis connection
        self.redis_client = None
        if REDIS_AVAILABLE and self.redis_url:
            try:
                # Configure SSL properly for security
                ssl_options = {}
                if self.redis_url.startswith('rediss://'):
                    # For SSL connections, require certificate validation by default
                    # Only disable for explicit local development (via env var)
                    disable_ssl_verification = os.getenv('REDIS_DISABLE_SSL_VERIFICATION', 'false').lower() == 'true'
                    
                    if disable_ssl_verification:
                        logger.warning("SSL certificate verification disabled for Redis - not recommended for production!")
                        ssl_options['ssl_cert_reqs'] = ssl.CERT_NONE
                    else:
                        # Secure by default - validate certificates using proper SSL constants
                        ssl_options['ssl_cert_reqs'] = ssl.CERT_REQUIRED
                        logger.info("SSL certificate verification enabled for Redis connection")
                        
                        # Try to use system CA bundle for better compatibility with managed Redis services
                        try:
                            import certifi
                            ssl_options['ssl_ca_certs'] = certifi.where()
                            logger.info(f"Using CA bundle: {ssl_options['ssl_ca_certs']}")
                        except ImportError:
                            logger.info("certifi not available, using system default CA bundle")
                
                # Use redis.from_url which properly handles authentication and SSL
                self.redis_client = redis.from_url(
                    self.redis_url,
                    decode_responses=True,
                    socket_connect_timeout=10,
                    socket_timeout=10,
                    retry_on_timeout=True,
                    health_check_interval=30,
                    **ssl_options
                )
                
                # Test connection
                self.redis_client.ping()
                logger.info(f"Redis connection established successfully to {self.redis_url}")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                logger.error(f"Redis URL format should be: redis://[:password@]host:port[/db] or rediss://[:password@]host:port[/db]")
                self.redis_client = None
        
        # Initialize embedding model
        self.embedding_model = None
        try:
            self.embedding_model = SentenceTransformer(self.embedding_model_name)
            logger.info(f"Embedding model '{self.embedding_model_name}' loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load embedding model: {e}")
            self.embedding_model = None
    
    def _generate_cache_key(self, request_data: Dict[str, Any], endpoint_type: str) -> str:
        """Generate a hash-based cache key for exact matching."""
        # Create a normalized request for hashing
        if endpoint_type == "completion":
            key_data = {
                "model": request_data.get("model"),
                "prompt": request_data.get("prompt"),
                "temperature": request_data.get("temperature", 1.0),
                "max_tokens": request_data.get("max_tokens"),
                "top_p": request_data.get("top_p", 1.0),
                "frequency_penalty": request_data.get("frequency_penalty", 0.0),
                "presence_penalty": request_data.get("presence_penalty", 0.0),
            }
        else:  # chat completion
            key_data = {
                "model": request_data.get("model"),
                "messages": request_data.get("messages"),
                "temperature": request_data.get("temperature", 1.0),
                "max_tokens": request_data.get("max_tokens"),
                "top_p": request_data.get("top_p", 1.0),
                "frequency_penalty": request_data.get("frequency_penalty", 0.0),
                "presence_penalty": request_data.get("presence_penalty", 0.0),
            }
        
        # Sort and serialize for consistent hashing
        serialized = json.dumps(key_data, sort_keys=True)
        cache_key = hashlib.sha256(serialized.encode()).hexdigest()
        return f"llm_cache:{endpoint_type}:{cache_key}"
    
    def _clean_text(self, text: str) -> str:
        """Lowercase, remove punctuation and extra spaces."""
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text
    
    def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for semantic search."""
        if not self.embedding_model or not ML_AVAILABLE:
            return None
        
        try:
            text = self._clean_text(text)
            embedding = self.embedding_model.encode(text)
            return embedding.tolist() if hasattr(embedding, 'tolist') else list(embedding)
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return None
    
    def _extract_text_for_embedding(self, request: Dict[str, Any], endpoint_type: str) -> str:
        if endpoint_type == "completion":
            return request.get("prompt", "")
        # only consider as last message for embedding
        messages = request.get("messages", [])
        return messages[-1].get("content", "") if messages else ""

    def _get_exact_match(self, cache_key: str) -> Optional[CacheEntry]:
        """Get exact cache match from Redis."""
        if not self.redis_client:
            return None
        
        try:
            cached_data = self.redis_client.get(cache_key)
            if cached_data:
                data = json.loads(cached_data)
                return CacheEntry(
                    request=data["request"],
                    response=data["response"],
                    timestamp=data["timestamp"],
                    embedding=data.get("embedding")
                )
        except Exception as e:
            logger.error(f"Failed to get exact match from Redis: {e}")
        
        return None
    
    def _find_semantic_match(self, query_embedding: List[float], model: str, endpoint_type: str) -> Tuple[Optional[CacheEntry], float]:
        """Return best semantic match and similarity %."""
        if not self.redis_client or not self.embedding_model:
            return None, 0.0
        try:
            keys = self.redis_client.keys(f"llm_cache:{endpoint_type}:*")
            best_match = None
            best_similarity = 0.0
            query_np = np.array(query_embedding).reshape(1, -1)

            for key in keys:
                try:
                    data = self.redis_client.get(key)
                    if not data:
                        continue
                    entry = json.loads(data)
                    if entry["request"].get("model") != model or not entry.get("embedding"):
                        continue
                    cached_np = np.array(entry["embedding"]).reshape(1, -1)
                    similarity = cosine_similarity(query_np, cached_np)[0][0]
                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_match = CacheEntry(**entry)
                except Exception as e:
                    logger.error(f"Error processing key {key}: {e}")

            return best_match, best_similarity * 100  # return % similarity
        except Exception as e:
            logger.error(f"Semantic search failed: {e}")
            return None, 0.0
    
    def get_cached_response(self, request_data: Dict[str, Any], endpoint_type: str, threshold: float = None) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Get cached response with exact match first, then semantic search.
        
        Args:
            request_data: The request payload
            endpoint_type: "completion" or "chat"
            threshold: Custom semantic similarity threshold (overrides default)
        
        Returns:
            Tuple of (cached response data, cache type) or (None, None) if no match found
        """
        if not self.redis_client:
            return None, None
        
        # Try exact match first
        cache_key = self._generate_cache_key(request_data, endpoint_type)
        exact_match = self._get_exact_match(cache_key)
        
        if exact_match:
            logger.info(f"Cache HIT (exact match): {cache_key}")
            return exact_match.response, "exact"
        
        # Try semantic search if embedding model is available
        if self.embedding_model:
            text_content = self._extract_text_for_embedding(request_data, endpoint_type)
            query_embedding = self._generate_embedding(text_content)
            if query_embedding:
                semantic_match, similarity = self._find_semantic_match(
                    query_embedding, 
                    request_data.get("model"), 
                    endpoint_type
                )
                if semantic_match and similarity >= self.similarity_threshold * 100:
                    logger.info(f"Cache HIT (semantic match): {cache_key}")
                    return semantic_match.response, "semantic"
        
        logger.info(f"Cache MISS: {cache_key}")
        return None, None
    
    def store_response(self, request_data: Dict[str, Any], response_data: Dict[str, Any], endpoint_type: str) -> bool:
        """
        Store request/response pair in cache with embedding for semantic search.
        
        Args:
            request_data: The original request payload
            response_data: The LLM response
            endpoint_type: "completion" or "chat"
        
        Returns:
            True if stored successfully, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            # Generate cache key
            cache_key = self._generate_cache_key(request_data, endpoint_type)
            
            # Generate embedding for semantic search
            text_content = self._extract_text_for_embedding(request_data, endpoint_type)
            embedding = self._generate_embedding(text_content)
            
            # Prepare cache entry
            cache_entry = {
                "request": request_data,
                "response": response_data,
                "timestamp": time.time(),
                "embedding": embedding
            }

            # Store in Redis with TTL (30 days = 2592000 seconds)
            self.redis_client.setex(
                cache_key,
                2592000,  # 30 days TTL
                json.dumps(cache_entry)
            )
            
            logger.info(f"Stored response in cache: {cache_key}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store response in cache: {e}")
            return False
    
    def clear_cache(self, pattern: str = "llm_cache:*") -> int:
        """Clear cache entries matching pattern."""
        if not self.redis_client:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                deleted = self.redis_client.delete(*keys)
                logger.info(f"Cleared {deleted} cache entries")
                return deleted
            return 0
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return 0
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        if not self.redis_client:
            return {"status": "unavailable", "redis_connected": False}
        
        try:
            info = self.redis_client.info()
            pattern_keys = self.redis_client.keys("llm_cache:*")
            
            return {
                "status": "available",
                "redis_connected": True,
                "total_cache_entries": len(pattern_keys),
                "redis_memory_used": info.get("used_memory_human", "unknown"),
                "redis_connected_clients": info.get("connected_clients", 0),
                "embedding_model_loaded": self.embedding_model is not None,
                "similarity_threshold": self.similarity_threshold
            }
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {"status": "error", "error": str(e)}

# Global cache service instance
cache_service = None

def get_cache_service() -> RedisCacheService:
    """Get or create the global cache service instance."""
    global cache_service
    if cache_service is None:
        # Let RedisCacheService read REDIS_URL from environment
        # User should set REDIS_URL like: rediss://:password@redis-14311.crce206.ap-south-1-1.ec2.redns.redis-cloud.com:14311/0
        cache_service = RedisCacheService()
    return cache_service