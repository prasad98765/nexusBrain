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
    """Redis service for storing and retrieving Q/A data"""
    
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
            
            self.redis_client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            
            # Test connection
            self.redis_client.ping()
            logger.info("Connected to Redis for Q/A service")
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None
    
    def _generate_qa_id(self, workspace_id: str, model: str, question: str) -> str:
        """Generate a unique ID for Q/A entry"""
        content = f"{workspace_id}:{model}:{question}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def _get_qa_key(self, workspace_id: str, qa_id: str) -> str:
        """Generate Redis key for Q/A entry"""
        return f"qa:{workspace_id}:{qa_id}"
    
    def _get_workspace_index_key(self, workspace_id: str) -> str:
        """Generate Redis key for workspace Q/A index"""
        return f"qa_index:{workspace_id}"
    
    def store_qa(self, workspace_id: str, model: str, question: str, answer: str) -> Optional[str]:
        """
        Store a Q/A entry in Redis
        
        Args:
            workspace_id: Workspace identifier
            model: AI model that generated the answer
            question: User question
            answer: Generated answer
        
        Returns:
            QA entry ID if stored successfully, None otherwise
        """
        if not self.redis_client:
            return None
        
        try:
            qa_id = self._generate_qa_id(workspace_id, model, question)
            now = datetime.utcnow().isoformat()
            
            qa_entry = {
                "id": qa_id,
                "workspace_id": workspace_id,
                "model": model,
                "question": question,
                "answer": answer,
                "created_at": now,
                "updated_at": now
            }
            
            # Store the Q/A entry
            qa_key = self._get_qa_key(workspace_id, qa_id)
            self.redis_client.setex(qa_key, 86400 * 30, json.dumps(qa_entry))  # 30 days TTL
            
            # Add to workspace index for efficient retrieval
            index_key = self._get_workspace_index_key(workspace_id)
            self.redis_client.sadd(index_key, qa_id)
            self.redis_client.expire(index_key, 86400 * 30)  # 30 days TTL
            
            logger.info(f"Stored Q/A entry {qa_id} for workspace {workspace_id}")
            return qa_id
            
        except Exception as e:
            logger.error(f"Failed to store Q/A entry: {e}")
            return None
    
    def get_qa_by_id(self, workspace_id: str, qa_id: str) -> Optional[QAEntry]:
        """
        Get a specific Q/A entry by ID
        
        Args:
            workspace_id: Workspace identifier
            qa_id: Q/A entry ID
        
        Returns:
            QAEntry if found, None otherwise
        """
        if not self.redis_client:
            return None
        
        try:
            qa_key = self._get_qa_key(workspace_id, qa_id)
            data = self.redis_client.get(qa_key)
            
            if not data:
                return None
            
            qa_data = json.loads(data)
            return QAEntry(**qa_data)
            
        except Exception as e:
            logger.error(f"Failed to get Q/A entry {qa_id}: {e}")
            return None
    
    def update_qa_answer(self, workspace_id: str, qa_id: str, new_answer: str) -> bool:
        """
        Update the answer for a Q/A entry
        
        Args:
            workspace_id: Workspace identifier
            qa_id: Q/A entry ID
            new_answer: Updated answer text
        
        Returns:
            True if updated successfully, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            qa_key = self._get_qa_key(workspace_id, qa_id)
            data = self.redis_client.get(qa_key)
            
            if not data:
                logger.warning(f"Q/A entry {qa_id} not found for update")
                return False
            
            qa_data = json.loads(data)
            qa_data["answer"] = new_answer
            qa_data["updated_at"] = datetime.utcnow().isoformat()
            
            # Update with same TTL as original
            ttl = self.redis_client.ttl(qa_key)
            if ttl > 0:
                self.redis_client.setex(qa_key, ttl, json.dumps(qa_data))
            else:
                self.redis_client.setex(qa_key, 86400 * 30, json.dumps(qa_data))
            
            logger.info(f"Updated Q/A entry {qa_id} for workspace {workspace_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to update Q/A entry {qa_id}: {e}")
            return False
    
    def get_workspace_qa_list(self, workspace_id: str, page: int = 1, limit: int = 25, 
                             model_filter: str = None, search_query: str = None) -> Dict[str, Any]:
        """
        Get paginated list of Q/A entries for a workspace
        
        Args:
            workspace_id: Workspace identifier
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
            index_key = self._get_workspace_index_key(workspace_id)
            qa_ids = self.redis_client.smembers(index_key)
            
            if not qa_ids:
                return {"entries": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}
            
            # Fetch all Q/A entries
            qa_entries = []
            for qa_id in qa_ids:
                qa_entry = self.get_qa_by_id(workspace_id, qa_id)
                if qa_entry:
                    qa_entries.append(qa_entry)
            
            # Apply filters
            filtered_entries = qa_entries
            
            if model_filter and model_filter.lower() != 'all':
                filtered_entries = [entry for entry in filtered_entries if entry.model == model_filter]
            
            if search_query:
                search_lower = search_query.lower()
                filtered_entries = [
                    entry for entry in filtered_entries 
                    if search_lower in entry.question.lower() or search_lower in entry.answer.lower()
                ]
            
            # Sort by updated_at (most recent first)
            filtered_entries.sort(key=lambda x: x.updated_at, reverse=True)
            
            # Apply pagination
            total = len(filtered_entries)
            total_pages = (total + limit - 1) // limit if total > 0 else 1
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_entries = filtered_entries[start_idx:end_idx]
            
            # Convert to dictionaries for JSON serialization
            entries_data = []
            for entry in paginated_entries:
                entries_data.append({
                    "id": entry.id,
                    "workspace_id": entry.workspace_id,
                    "model": entry.model,
                    "question": entry.question,
                    "answer": entry.answer,
                    "created_at": entry.created_at,
                    "updated_at": entry.updated_at
                })
            
            return {
                "entries": entries_data,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages
            }
            
        except Exception as e:
            logger.error(f"Failed to get Q/A list for workspace {workspace_id}: {e}")
            return {"entries": [], "total": 0, "page": page, "limit": limit, "total_pages": 0}
    
    def delete_qa(self, workspace_id: str, qa_id: str) -> bool:
        """
        Delete a Q/A entry
        
        Args:
            workspace_id: Workspace identifier
            qa_id: Q/A entry ID
        
        Returns:
            True if deleted successfully, False otherwise
        """
        if not self.redis_client:
            return False
        
        try:
            qa_key = self._get_qa_key(workspace_id, qa_id)
            index_key = self._get_workspace_index_key(workspace_id)
            
            # Remove from Redis
            deleted = self.redis_client.delete(qa_key)
            
            # Remove from index
            self.redis_client.srem(index_key, qa_id)
            
            if deleted:
                logger.info(f"Deleted Q/A entry {qa_id} from workspace {workspace_id}")
                return True
            else:
                logger.warning(f"Q/A entry {qa_id} not found for deletion")
                return False
            
        except Exception as e:
            logger.error(f"Failed to delete Q/A entry {qa_id}: {e}")
            return False

# Global instance
qa_redis_service = QARedisService()