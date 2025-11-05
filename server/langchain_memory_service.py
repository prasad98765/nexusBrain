"""
LangChain-based conversation memory service using Redis.
Handles conversation history persistence and context management per workspace.

Note: This implementation uses LangChain's legacy Memory classes which are deprecated.
The functionality remains stable and working. Future migration to LangGraph's state management
is planned but not required for current operation.
"""

import os
import logging
import warnings
from typing import Dict, List, Optional

# Suppress all LangChain deprecation warnings
# The Memory classes work fine but are deprecated in favor of LangGraph
warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', message='.*langchain.*')

from langchain.memory import ConversationSummaryMemory, ConversationBufferWindowMemory, CombinedMemory
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain_openai import ChatOpenAI

# Set tokenizers parallelism to avoid fork warnings
os.environ["TOKENIZERS_PARALLELISM"] = "false"

logger = logging.getLogger(__name__)

# Redis connection from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# LLM for summarization (using OpenRouter-compatible endpoint)
SUMMARIZATION_MODEL = "google/gemini-2.5-flash-lite"  # Fast and cheap model for summarization


class LangChainMemoryService:
    """
    Manages conversation memory using LangChain's Redis-backed memory system.
    """
    
    def __init__(self):
        """Initialize the memory service."""
        self.redis_url = REDIS_URL
        logger.info(f"Initialized LangChain Memory Service with Redis URL: {self.redis_url}")
    
    def get_memory_for_workspace(
        self, 
        workspace_id: str,
        use_summary: bool = True,
        window_size: int = 5
    ) -> CombinedMemory:
        """
        Get or create memory instance for a workspace.
        
        Args:
            workspace_id: The workspace identifier
            use_summary: Whether to use conversation summarization
            window_size: Number of recent messages to keep verbatim
            
        Returns:
            CombinedMemory instance with Redis-backed storage
        """
        try:
            # Create Redis message history for this workspace
            redis_history = RedisChatMessageHistory(
                session_id=f"workspace:{workspace_id}",
                url=self.redis_url,
                key_prefix="langchain:chat_history:",
                # ttl=2592000  # 30 days TTL
            )
            
            # Create window memory for recent messages (verbatim)
            window_memory = ConversationBufferWindowMemory(
                k=window_size,
                chat_memory=redis_history,
                return_messages=True,
                memory_key="recent_history",
                input_key="input",
                output_key="output"
            )
            
            memories = [window_memory]
            
            # Add summarization memory if enabled
            if use_summary:
                try:
                    # Create LLM for summarization using OpenRouter
                    llm = ChatOpenAI(
                        model=SUMMARIZATION_MODEL,
                        temperature=0,
                        openai_api_key=OPENROUTER_API_KEY,
                        openai_api_base="https://openrouter.ai/api/v1",
                        default_headers={
                            "HTTP-Referer": "https://nexusaihub.co.in",
                            "X-Title": "Nexus AI Hub"
                        }
                    )
                    
                    summary_memory = ConversationSummaryMemory(
                        llm=llm,
                        chat_memory=redis_history,
                        return_messages=True,
                        memory_key="conversation_summary",
                        input_key="input",
                        output_key="output"
                    )
                    
                    memories.append(summary_memory)
                    logger.info(f"Created summarization memory for workspace {workspace_id}")
                except Exception as e:
                    logger.warning(f"Failed to create summarization memory (falling back to window-only): {e}")
            
            # Combine memories
            combined_memory = CombinedMemory(memories=memories)
            
            logger.info(f"Created combined memory for workspace {workspace_id} (window={window_size}, summary={use_summary})")
            return combined_memory
            
        except Exception as e:
            logger.error(f"Failed to create memory for workspace {workspace_id}: {e}")
            raise
    
    def save_conversation_turn(
        self,
        workspace_id: str,
        user_message: str,
        assistant_response: str,
        use_summary: bool = True,
        window_size: int = 5
    ) -> bool:
        """
        Save a conversation turn (user message + assistant response) to Redis.
        
        Args:
            workspace_id: The workspace identifier
            user_message: The user's message
            assistant_response: The assistant's response
            use_summary: Whether to use summarization (kept for API compatibility but not used)
            window_size: Number of recent messages to keep (kept for API compatibility but not used)
            
        Returns:
            True if saved successfully, False otherwise
        """
        try:
            # IMPORTANT: Save directly to Redis history to avoid duplicates
            # Do NOT use CombinedMemory.save_context() as it saves twice
            # (once for BufferWindow, once for Summary)
            
            from langchain_core.messages import HumanMessage, AIMessage
            
            redis_history = RedisChatMessageHistory(
                session_id=f"workspace:{workspace_id}",
                url=self.redis_url,
                key_prefix="langchain:chat_history:",
                ttl=2592000  # 30 days TTL
            )
            
            # Add user message
            redis_history.add_message(HumanMessage(content=user_message))
            
            # Add assistant response
            redis_history.add_message(AIMessage(content=assistant_response))
            
            logger.info(f"Saved conversation turn directly to Redis for workspace {workspace_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save conversation for workspace {workspace_id}: {e}")
            return False
    
    def get_conversation_context(
        self,
        workspace_id: str,
        use_summary: bool = True,
        window_size: int = 5
    ) -> Dict[str, str]:
        """
        Retrieve conversation context for a workspace.
        
        Args:
            workspace_id: The workspace identifier
            use_summary: Whether to include summary
            window_size: Number of recent messages
            
        Returns:
            Dictionary with conversation context (recent_history, conversation_summary)
        """
        try:
            # Get memory for this workspace
            memory = self.get_memory_for_workspace(
                workspace_id=workspace_id,
                use_summary=use_summary,
                window_size=window_size
            )
            
            # Load memory variables
            context = memory.load_memory_variables({})
            
            logger.info(f"Retrieved conversation context for workspace {workspace_id}")
            return context
            
        except Exception as e:
            logger.error(f"Failed to retrieve conversation context for workspace {workspace_id}: {e}")
            return {}
    
    def get_formatted_context(
        self,
        workspace_id: str,
        use_summary: bool = True,
        window_size: int = 5,
        include_recent: bool = True
    ) -> str:
        """
        Get formatted conversation context as a string for prompt injection.
        
        Args:
            workspace_id: The workspace identifier
            use_summary: Whether to include summary
            window_size: Number of recent messages
            include_recent: Whether to include recent message history
            
        Returns:
            Formatted context string
        """
        try:
            context = self.get_conversation_context(
                workspace_id=workspace_id,
                use_summary=use_summary,
                window_size=window_size
            )
            
            formatted_parts = []
            
            # Add conversation summary if available
            if use_summary and "conversation_summary" in context:
                summary = context["conversation_summary"]
                if summary:
                    formatted_parts.append(f"Conversation Summary:\n{summary}")
            
            # Add recent message history if available and requested
            if include_recent and "recent_history" in context:
                recent = context["recent_history"]
                if recent:
                    # Format messages from LangChain message objects
                    recent_messages = []
                    for msg in recent:
                        role = msg.type if hasattr(msg, 'type') else 'unknown'
                        content = msg.content if hasattr(msg, 'content') else str(msg)
                        recent_messages.append(f"{role.capitalize()}: {content}")
                    
                    if recent_messages:
                        formatted_parts.append(f"Recent Conversation:\n" + "\n".join(recent_messages))
            
            formatted_context = "\n\n".join(formatted_parts)
            
            logger.info(f"Formatted context for workspace {workspace_id}: {len(formatted_context)} chars")
            return formatted_context
            
        except Exception as e:
            logger.error(f"Failed to format context for workspace {workspace_id}: {e}")
            return ""
    
    def clear_workspace_memory(self, workspace_id: str) -> bool:
        """
        Clear all conversation memory for a workspace.
        
        Args:
            workspace_id: The workspace identifier
            
        Returns:
            True if cleared successfully, False otherwise
        """
        try:
            # Create a fresh Redis history instance
            redis_history = RedisChatMessageHistory(
                session_id=f"workspace:{workspace_id}",
                url=self.redis_url,
                key_prefix="langchain:chat_history:"
            )
            
            # Clear all messages
            redis_history.clear()
            
            logger.info(f"Cleared conversation memory for workspace {workspace_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear memory for workspace {workspace_id}: {e}")
            return False
    
    def get_message_count(self, workspace_id: str) -> int:
        """
        Get the number of messages stored for a workspace.
        
        Args:
            workspace_id: The workspace identifier
            
        Returns:
            Number of messages
        """
        try:
            redis_history = RedisChatMessageHistory(
                session_id=f"workspace:{workspace_id}",
                url=self.redis_url,
                key_prefix="langchain:chat_history:"
            )
            
            messages = redis_history.messages
            count = len(messages)
            
            logger.info(f"Workspace {workspace_id} has {count} messages in memory")
            return count
            
        except Exception as e:
            logger.error(f"Failed to get message count for workspace {workspace_id}: {e}")
            return 0


# Singleton instance
_memory_service = None

def get_langchain_memory_service() -> LangChainMemoryService:
    """Get or create the singleton memory service instance."""
    global _memory_service
    if _memory_service is None:
        _memory_service = LangChainMemoryService()
    return _memory_service
