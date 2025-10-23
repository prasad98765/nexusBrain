import json
import logging
import time
import hashlib
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

# Try to import Redis with fallback
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

@dataclass
class QAEntry:
    """Data class for Q/A entries"""
    id: str
    workspace_id: str
    model: str
    question: str
    answer: str
    created_at: str
    updated_at: str

class QARedisService:
    """Redis service for accessing Q/A data from LLM cache"""
    
    def __init__(self):
        self.redis_client = None
        self._connect()
    
    def _connect(self):
        """Initialize Redis connection"""
        if not REDIS_AVAILABLE:
            logger.warning("Redis not available - Q/A functionality will be disabled")
            return
        
        try:
            # Use Replit's Redis URL if available, otherwise localhost
            import os
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
            
            if redis:
                self.redis_client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=10,
                retry_on_timeout=True
            )
            
            # Test connection
            if self.redis_client:
                self.redis_client.ping()
            logger.info("Connected to Redis for Q/A service")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    def _get_all_llm_cache_keys(self, workspace_id: str = None) -> List[str]:
        """Get all LLM cache keys (both completion and chat) for a workspace"""
        if not self.redis_client:
            return []
        
        try:
            # If workspace_id provided, filter by workspace
            if workspace_id:
                workspace_prefix = f"llm_cache:ws:{workspace_id}:"
                completion_keys = self.redis_client.keys(f"{workspace_prefix}completion:*")
                chat_keys = self.redis_client.keys(f"{workspace_prefix}chat:*")
            else:
                # Get both completion and chat keys (all workspaces)
                completion_keys = self.redis_client.keys("llm_cache:*:completion:*")
                chat_keys = self.redis_client.keys("llm_cache:*:chat:*")
            
            # Combine and convert to list
            all_keys = []
            if completion_keys:
                all_keys.extend(completion_keys)
            if chat_keys:
                all_keys.extend(chat_keys)
                
            return all_keys
        except Exception as e:
            logger.error(f"Failed to get LLM cache keys: {e}")
            return []
    
    def _parse_cache_entry(self, key: str, data: str, workspace_id: str = None) -> Optional[Dict[str, Any]]:
        """Parse LLM cache entry into Q/A format"""
        try:
            cache_data = json.loads(data)
            
            # Filter by workspace if provided
            entry_workspace_id = cache_data.get('workspace_id', 'default')
            if workspace_id and entry_workspace_id != workspace_id:
                logger.debug(f"Skipping entry from different workspace: {entry_workspace_id}")
                return None
            
            logger.debug(f"Parsing cache entry: {key}")
            
            # Extract data from cache structure
            request = cache_data.get('request', {})
            response = cache_data.get('response', {})
            
            # Handle both completion and chat formats
            question = ''
            if 'prompt' in request:  # Completion format
                question = request.get('prompt', '')
            elif 'messages' in request:  # Chat format
                messages = request.get('messages', [])
                if messages:
                    # Get the last user message
                    for msg in reversed(messages):
                        if msg.get('role') == 'user':
                            question = msg.get('content', '')
                            break
            
            if not question:
                logger.warning(f"No question found in cache entry: {key}")
                return None
            
            # Handle both completion and chat response formats
            answer = ''
            choices = response.get('choices', [])
            if choices:
                # Try different formats
                if 'text' in choices[0]:  # Completion format
                    answer = choices[0]['text']
                elif 'message' in choices[0]:  # Chat format
                    answer = choices[0].get('message', {}).get('content', '')
                elif 'content' in choices[0]:  # Alternative chat format
                    answer = choices[0]['content']
            
            if not answer:
                logger.warning(f"No answer found in cache entry: {key}")
                return None
                
            answer = answer.strip()
            model = request.get('model', response.get('model', 'unknown'))
            logger.debug(f"Successfully parsed {key} - Model: {model}")
            
            # Extract timestamp
            timestamp = cache_data.get('timestamp')
            if timestamp:
                if isinstance(timestamp, (int, float)):
                    created_at = datetime.fromtimestamp(timestamp).isoformat()
                else:
                    created_at = str(timestamp)
            else:
                created_at = datetime.utcnow().isoformat()
            
            # Use updated_at if available, otherwise use created_at
            updated_at = cache_data.get('updated_at', created_at)
            
            # Extract cache key hash as ID
            cache_id = key.split(':')[-1] if ':' in key else key
            
            return {
                'id': cache_id,
                'cache_key': key,
                'model': model,
                'question': question,
                'answer': answer,
                'created_at': created_at,
                'updated_at': updated_at,
                'workspace_id': entry_workspace_id
            }
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.warning(f"Failed to parse cache entry {key}: {e}")
            return None
    
    def get_qa_by_id(self, workspace_id: str, qa_id: str) -> Optional[QAEntry]:
        """
        Get a specific Q/A entry by ID from LLM cache
        
        Args:
            workspace_id: Workspace identifier for filtering
            qa_id: Cache key hash
        
        Returns:
            QAEntry if found, None otherwise
        """
        if not self.redis_client:
            return None
        
        try:
            # Try both with and without workspace prefix for backward compatibility
            possible_keys = [
                f"llm_cache:ws:{workspace_id}:completion:{qa_id}",
                f"llm_cache:ws:{workspace_id}:chat:{qa_id}",
                f"llm_cache:completion:{qa_id}",  # Legacy format
                f"llm_cache:chat:{qa_id}"  # Legacy format
            ]
            
            data = None
            cache_key = None
            for key in possible_keys:
                data = self.redis_client.get(key)
                if data is not None:
                    cache_key = key
                    break
            
            if not data:
                return None
            
            qa_data = self._parse_cache_entry(cache_key, str(data), workspace_id)
            if not qa_data:
                return None
                
            return QAEntry(
                id=qa_data.get('id', ''),
                workspace_id=qa_data.get('workspace_id', ''),
                model=qa_data.get('model', ''),
                question=qa_data.get('question', ''),
                answer=qa_data.get('answer', ''),
                created_at=qa_data.get('created_at', ''),
                updated_at=qa_data.get('updated_at', '')
            )
            
        except Exception as e:
            logger.error(f"Failed to get Q/A entry {qa_id}: {e}")
            return None
    
    def update_qa_answer(self, workspace_id: str, qa_id: str, new_answer: str) -> bool:
        """
        Update the answer in the original LLM cache entry
        
        Args:
            workspace_id: Workspace identifier
            qa_id: Cache key hash
            new_answer: Updated answer text
        
        Returns:
            True if updated successfully, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            # Try both completion and chat cache keys
            completion_key = f"llm_cache:completion:{qa_id}"
            chat_key = f"llm_cache:chat:{qa_id}"
            
            data = self.redis_client.get(completion_key)
            if data is None:
                data = self.redis_client.get(chat_key)
                if data is not None:
                    cache_key = chat_key
            else:
                cache_key = completion_key
            
            if not data:
                logger.warning(f"Cache entry {qa_id} not found for update")
                return False
            
            cache_data = json.loads(str(data))
            
            # Update the answer in the response choices
            if 'response' not in cache_data or 'choices' not in cache_data['response']:
                logger.warning(f"Invalid cache structure in {qa_id}")
                return False
                
            if not cache_data['response']['choices']:
                logger.warning(f"No choices in cache entry {qa_id}")
                return False
            
            # Update the answer and timestamp
            cache_data['response']['choices'][0]['text'] = new_answer
            cache_data['updated_at'] = datetime.utcnow().isoformat()
            
            # Save back to Redis with original TTL if any
            ttl = self.redis_client.ttl(cache_key)
            ttl_value = int(ttl) if ttl is not None and isinstance(ttl, (int, float)) and int(ttl) > 0 else None

            # Handle chat format if needed
            if 'message' in cache_data['response']['choices'][0]:
                cache_data['response']['choices'][0]['message']['content'] = new_answer
            elif 'content' in cache_data['response']['choices'][0]:
                cache_data['response']['choices'][0]['content'] = new_answer
            else:
                cache_data['response']['choices'][0]['text'] = new_answer

            if ttl_value and ttl_value > 0:
                self.redis_client.setex(cache_key, ttl_value, json.dumps(cache_data))
            else:
                self.redis_client.set(cache_key, json.dumps(cache_data))
            
            logger.info(f"Updated answer in cache entry {qa_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update cache entry {qa_id}: {e}")
            return False
    
    def get_workspace_qa_list(self, workspace_id: str, page: int = 1, limit: int = 25, 
                             model_filter: str = None, search_query: str = None) -> Dict[str, Any]:
        """
        Get paginated list of Q/A entries from LLM cache for a specific workspace
        
        Args:
            workspace_id: Workspace identifier for filtering
            page: Page number (1-based)
            limit: Number of entries per page
            model_filter: Filter by model name (optional)
            search_query: Search in questions/answers (optional)
        
        Returns:
            Dictionary with entries, total count, and pagination info
        """
        if not self.redis_client:
            return {"entries": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}
        
        try:
            # Get all LLM cache keys for this workspace
            cache_keys = self._get_all_llm_cache_keys(workspace_id)
            
            if not cache_keys:
                return {"entries": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}
            
            # Parse all cache entries into Q/A format
            qa_entries = []
            for key in cache_keys:
                try:
                    data = self.redis_client.get(key)
                    if data:
                        parsed_entry = self._parse_cache_entry(key, str(data), workspace_id)
                        if parsed_entry:
                            qa_entries.append(parsed_entry)
                except Exception as e:
                    logger.warning(f"Failed to process cache key {key}: {e}")
                    continue
            
            # Apply filters
            filtered_entries = qa_entries
            
            if model_filter and model_filter.lower() != 'all':
                filtered_entries = [
                    entry for entry in filtered_entries 
                    if model_filter.lower() in entry['model'].lower()
                ]
            
            if search_query:
                search_lower = search_query.lower()
                filtered_entries = [
                    entry for entry in filtered_entries 
                    if search_lower in entry['question'].lower() or search_lower in entry['answer'].lower()
                ]
            
            # Sort by created_at (most recent first)
            filtered_entries.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            
            # Apply pagination
            total = len(filtered_entries)
            total_pages = (total + limit - 1) // limit if total > 0 else 1
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_entries = filtered_entries[start_idx:end_idx]
            
            return {
                "entries": paginated_entries,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages
            }
            
        except Exception as e:
            logger.error(f"Failed to get Q/A list from LLM cache: {e}")
            return {"entries": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}
    
    def store_qa(self, workspace_id: str, model: str, question: str, answer: str) -> Optional[str]:
        """
        Store a custom Q/A entry directly in Redis cache
        This allows users to add their own Q/A pairs
        
        Args:
            workspace_id: Workspace identifier
            model: Model name to associate with this Q/A
            question: Question text
            answer: Answer text
        
        Returns:
            Cache ID if stored successfully, None otherwise
        """
        if not self.redis_client:
            logger.error("Redis client not available")
            return None
        
        try:
            # Create a unique cache key for custom Q/A
            qa_hash = hashlib.sha256(f"{workspace_id}:{model}:{question}".encode()).hexdigest()
            cache_key = f"llm_cache:ws:{workspace_id}:chat:{qa_hash}"
            
            # Create a cache entry structure similar to LLM responses
            cache_entry = {
                "request": {
                    "model": model,
                    "messages": [
                        {"role": "user", "content": question}
                    ]
                },
                "response": {
                    "choices": [
                        {
                            "message": {
                                "role": "assistant",
                                "content": answer
                            }
                        }
                    ],
                    "model": model
                },
                "timestamp": time.time(),
                "embedding": None,  # Will be generated if needed for semantic search
                "workspace_id": workspace_id,
                "custom_entry": True  # Flag to identify manually created entries
            }
            
            # Store in Redis with TTL (30 days)
            self.redis_client.setex(
                cache_key,
                2592000,  # 30 days TTL
                json.dumps(cache_entry)
            )
            
            logger.info(f"Stored custom Q/A entry for workspace {workspace_id}: {qa_hash}")
            return qa_hash
            
        except Exception as e:
            logger.error(f"Failed to store custom Q/A entry: {e}")
            return None
    def delete_qa(self, workspace_id: str, qa_id: str) -> bool:
        """
        Delete a Q/A entry - deletes the underlying LLM cache entry
        WARNING: This will affect cache performance for auto-generated entries
        
        Args:
            workspace_id: Workspace identifier
            qa_id: Cache key hash
        
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.redis_client:
            return False
            
        try:
            # Try both with and without workspace prefix
            possible_keys = [
                f"llm_cache:ws:{workspace_id}:completion:{qa_id}",
                f"llm_cache:ws:{workspace_id}:chat:{qa_id}",
                f"llm_cache:completion:{qa_id}",  # Legacy format
                f"llm_cache:chat:{qa_id}"  # Legacy format
            ]
            
            deleted = False
            for key in possible_keys:
                if self.redis_client.delete(key):
                    deleted = True
                    logger.info(f"Deleted cache entry: {key}")
                    break
            
            if deleted:
                logger.warning(f"Deleted LLM cache entry {qa_id} - this may affect cache performance")
                return True
            else:
                logger.warning(f"Cache entry {qa_id} not found for deletion")
                return False
                
        except Exception as e:
            logger.error(f"Failed to delete cache entry {qa_id}: {e}")
            return False

# Global instance
qa_redis_service = QARedisService()