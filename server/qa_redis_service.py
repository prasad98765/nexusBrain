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
                socket_timeout=5,
                retry_on_timeout=True
            )
            
            # Test connection
            if self.redis_client:
                self.redis_client.ping()
            logger.info("Connected to Redis for Q/A service")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    def _get_all_llm_cache_keys(self) -> List[str]:
        """Get all LLM cache keys (both completion and chat)"""
        if not self.redis_client:
            return []
        
        try:
            # Get both completion and chat keys
            completion_keys = self.redis_client.keys("llm_cache:completion:*")
            chat_keys = self.redis_client.keys("llm_cache:chat:*")
            
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
    
    def _parse_cache_entry(self, key: str, data: str) -> Optional[Dict[str, Any]]:
        """Parse LLM cache entry into Q/A format"""
        try:
            cache_data = json.loads(data)
            logger.info(f"Parsing cache entry: {key}")
            logger.debug(f"Cache data: {cache_data}")
            
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
            logger.info(f"Successfully parsed {key} - Model: {model}")
            
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
                'workspace_id': 'default'  # TODO: Extract from cache if stored
            }
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.warning(f"Failed to parse cache entry {key}: {e}")
            return None
    
    def get_qa_by_id(self, workspace_id: str, qa_id: str) -> Optional[QAEntry]:
        """
        Get a specific Q/A entry by ID from LLM cache
        
        Args:
            workspace_id: Workspace identifier (currently not used in LLM cache)
            qa_id: Cache key hash
        
        Returns:
            QAEntry if found, None otherwise
        """
        if not self.redis_client:
            return None
        
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
                return None
            
            qa_data = self._parse_cache_entry(cache_key, str(data))
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
        Get paginated list of Q/A entries from LLM cache
        
        Args:
            workspace_id: Workspace identifier (currently not filtered in LLM cache)
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
            # Get all LLM cache keys
            cache_keys = self._get_all_llm_cache_keys()
            
            if not cache_keys:
                return {"entries": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}
            
            # Parse all cache entries into Q/A format
            qa_entries = []
            for key in cache_keys:
                try:
                    data = self.redis_client.get(key)
                    if data:
                        parsed_entry = self._parse_cache_entry(key, str(data))
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
    
    # Legacy methods for backward compatibility (not applicable to LLM cache approach)
    def store_qa(self, workspace_id: str, model: str, question: str, answer: str) -> Optional[str]:
        """
        Store a Q/A entry - not used with LLM cache approach
        Q/A entries are created automatically when LLM responses are cached
        """
        logger.info("Q/A entries are created automatically from LLM cache - no manual storage needed")
        return None
    
    def delete_qa(self, workspace_id: str, qa_id: str) -> bool:
        """
        Delete a Q/A entry - deletes the underlying LLM cache entry
        WARNING: This will affect cache performance
        """
        if not self.redis_client:
            return False
            
        try:
            # Try to delete both completion and chat cache keys
            completion_key = f"llm_cache:completion:{qa_id}"
            chat_key = f"llm_cache:chat:{qa_id}"
            
            deleted_completion = self.redis_client.delete(completion_key)
            deleted_chat = self.redis_client.delete(chat_key)
            
            deleted = deleted_completion or deleted_chat
            
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