"""
LangChain Conversational RAG Pipeline
Using ConversationalRetrievalChain with custom retriever that wraps our existing RAG service
"""
from __future__ import annotations

import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_openai import ChatOpenAI

logger = logging.getLogger(__name__)


class CustomRagRetriever(BaseRetriever):
    """
    Custom LangChain retriever that wraps our existing RAG service
    """
    
    rag_service: Any
    workspace_id: str
    top_k: int = 5
    threshold: float = 0.5
    
    class Config:
        arbitrary_types_allowed = True
    
    def __init__(
        self,
        rag_service,
        workspace_id: str,
        top_k: int = 5,
        threshold: float = 0.5,
        **kwargs
    ):
        """
        Initialize custom retriever
        
        Args:
            rag_service: Instance of RAGService
            workspace_id: Workspace ID for filtering documents
            top_k: Number of documents to retrieve
            threshold: Similarity threshold for filtering results
        """
        super().__init__(
            rag_service=rag_service,
            workspace_id=workspace_id,
            top_k=top_k,
            threshold=threshold,
            **kwargs
        )
        logger.info(f"✅ CustomRagRetriever initialized - workspace: {workspace_id}, top_k: {top_k}, threshold: {threshold}")
    
    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: Optional[CallbackManagerForRetrieverRun] = None
    ) -> List[Document]:
        """
        Retrieve relevant documents using our RAG service
        
        Args:
            query: Search query (may be prompt-enhanced)
            run_manager: Optional callback manager
            
        Returns:
            List of LangChain Document objects
        """
        logger.info(f"🔍 CustomRagRetriever - Retrieving documents for query: '{query[:100]}...'")
        
        try:
            # Call our existing RAG service retrieve_context function
            contexts = self.rag_service.retrieve_context(
                query=query,
                workspace_id=self.workspace_id,
                top_k=self.top_k,
                similarity_threshold=self.threshold
            )
            
            logger.info(f"📄 Retrieved {len(contexts)} contexts from RAG service")
            
            # Convert contexts to LangChain Document objects
            docs = []
            for idx, ctx in enumerate(contexts):
                doc = Document(
                    page_content=ctx['text'],
                    metadata={
                        "filename": ctx.get("filename", "unknown"),
                        "similarity": ctx.get("similarity", 0.0),
                        "chunk_index": ctx.get("chunk_index", 0),
                        "source": f"{ctx.get('filename', 'unknown')} (chunk {ctx.get('chunk_index', 0)})"
                    }
                )
                docs.append(doc)
                logger.info(f"  📄 Doc {idx+1}: {ctx.get('filename')} (similarity: {ctx.get('similarity', 0):.4f})")
            
            return docs
            
        except Exception as e:
            logger.error(f"❌ Error in CustomRagRetriever: {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return []


def build_prompt_query(user_question: str, chat_history: List[Tuple[str, str]]) -> str:
    """
    Build a prompt-style query that includes conversation context
    This is done WITHOUT an LLM call - just string formatting
    
    Args:
        user_question: Current user question
        chat_history: List of (user_msg, assistant_msg) tuples
        
    Returns:
        Enhanced query string for retrieval
    """
    # If no history, just return the question
    if not chat_history or len(chat_history) == 0:
        logger.info("📝 No chat history - using raw question for retrieval")
        return user_question
    
    # Build history summary from last 3 turns
    recent_history = chat_history[-3:] if len(chat_history) > 3 else chat_history
    history_lines = []
    
    for user_msg, assistant_msg in recent_history:
        history_lines.append(f"User: {user_msg}")
        history_lines.append(f"Assistant: {assistant_msg}")
    
    history_summary = "\n".join(history_lines)
    
    # Create prompt-enhanced query
    prompt_query = f"""You are retrieving information from a knowledge base.
Use the previous conversation only if it clarifies the current question.
Otherwise, focus on the latest query.

Previous conversation (optional):
{history_summary}

User's current question:
{user_question}

Return only information directly relevant to the user's question."""
    
    logger.info(f"📝 Built prompt query with {len(recent_history)} conversation turns")
    logger.debug(f"Prompt query:\n{prompt_query}")
    
    return prompt_query


class ConversationalRAGPipeline:
    """
    Conversational RAG Pipeline using LangChain
    """
    
    def __init__(
        self,
        rag_service,
        workspace_id: str,
        model: str = "gpt-4o",
        temperature: float = 0.7,
        top_k: int = 5,
        threshold: float = 0.5,
        memory_k: int = 3,
        use_prompt_enhancement: bool = True,
        openrouter_api_key: Optional[str] = None
    ):
        """
        Initialize conversational RAG pipeline
        
        Args:
            rag_service: Instance of RAGService
            workspace_id: Workspace ID for document filtering
            model: LLM model to use (via OpenRouter)
            temperature: LLM temperature
            top_k: Number of RAG documents to retrieve
            threshold: Similarity threshold for retrieval
            memory_k: Number of conversation turns to keep in memory
            use_prompt_enhancement: Whether to enhance queries with conversation context
            openrouter_api_key: OpenRouter API key (optional, falls back to env)
        """
        self.rag_service = rag_service
        self.workspace_id = workspace_id
        self.model = model
        self.top_k = top_k
        self.threshold = threshold
        self.memory_k = memory_k
        self.use_prompt_enhancement = use_prompt_enhancement
        
        logger.info(f"🚀 Initializing ConversationalRAGPipeline")
        logger.info(f"   Workspace: {workspace_id}")
        logger.info(f"   Model: {model}")
        logger.info(f"   RAG top_k: {top_k}, threshold: {threshold}")
        logger.info(f"   Memory: {memory_k} turns")
        logger.info(f"   Prompt enhancement: {use_prompt_enhancement}")
        
        # Initialize OpenRouter LLM
        api_key = openrouter_api_key or os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OpenRouter API key is required")
        
        # Configure for OpenRouter
        self.llm = ChatOpenAI(
            model=model,
            temperature=temperature,
            openai_api_key=api_key,
            openai_api_base="https://openrouter.ai/api/v1",
            model_kwargs={
                "extra_headers": {
                    "HTTP-Referer": "https://nexusaihub.com",
                    "X-Title": "Nexus AI Hub"
                }
            }
        )
        logger.info(f"✅ LLM initialized: {model}")
        
        # Initialize custom retriever
        self.retriever = CustomRagRetriever(
            rag_service=rag_service,
            workspace_id=workspace_id,
            top_k=top_k,
            threshold=threshold
        )
        
        # Initialize conversation memory (keeps last k turns)
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            output_key="answer",
            k=memory_k
        )
        logger.info(f"✅ Memory initialized with k={memory_k}")
        
        # Build the conversational retrieval chain
        self.qa_chain = ConversationalRetrievalChain.from_llm(
            llm=self.llm,
            retriever=self.retriever,
            memory=self.memory,
            return_source_documents=True,
            verbose=True,
            output_key="answer"
        )
        logger.info("✅ ConversationalRetrievalChain initialized")
    
    def _get_chat_history_tuples(self) -> List[Tuple[str, str]]:
        """
        Extract chat history as list of (user, assistant) tuples
        
        Returns:
            List of conversation tuples
        """
        try:
            # Get messages from memory
            messages = self.memory.chat_memory.messages
            
            # Convert to tuples
            history = []
            user_msg = None
            
            for msg in messages:
                if msg.type == "human":
                    user_msg = msg.content
                elif msg.type == "ai" and user_msg is not None:
                    history.append((user_msg, msg.content))
                    user_msg = None
            
            return history
        except Exception as e:
            logger.warning(f"Failed to extract chat history: {e}")
            return []
    
    def ask(
        self,
        question: str,
        return_metadata: bool = False
    ) -> str | Dict[str, Any]:
        """
        Ask a question using conversational RAG
        
        Args:
            question: User question
            return_metadata: If True, return dict with answer and metadata
            
        Returns:
            Answer string or dict with answer and metadata
        """
        logger.info(f"\n{'='*80}")
        logger.info(f"🎯 New question: {question}")
        logger.info(f"{'='*80}")
        
        try:
            # Build prompt-enhanced query if enabled
            query = question
            if self.use_prompt_enhancement:
                chat_history = self._get_chat_history_tuples()
                query = build_prompt_query(question, chat_history)
                logger.info(f"📝 Prompt-enhanced query built (length: {len(query)} chars)")
            
            # Log retrieval details
            logger.info(f"🔍 Retrieving documents...")
            logger.info(f"   Query (first 200 chars): {query[:200]}...")
            
            # Run the chain
            response = self.qa_chain({
                "question": query
            })
            
            answer = response.get("answer", "")
            source_docs = response.get("source_documents", [])
            
            # Log results
            logger.info(f"\n{'='*80}")
            logger.info(f"✅ Answer generated:")
            logger.info(f"   Length: {len(answer)} chars")
            logger.info(f"   Sources: {len(source_docs)} documents")
            logger.info(f"{'='*80}")
            
            # Log source details
            if source_docs:
                logger.info(f"\n📚 Source documents retrieved:")
                for idx, doc in enumerate(source_docs):
                    filename = doc.metadata.get("filename", "unknown")
                    similarity = doc.metadata.get("similarity", 0.0)
                    chunk_idx = doc.metadata.get("chunk_index", 0)
                    logger.info(f"   {idx+1}. {filename} (chunk {chunk_idx}, similarity: {similarity:.4f})")
                    logger.info(f"      Preview: {doc.page_content[:100]}...")
            else:
                logger.warning("⚠️ No source documents retrieved")
            
            # Return based on metadata flag
            if return_metadata:
                return {
                    "answer": answer,
                    "source_documents": [
                        {
                            "filename": doc.metadata.get("filename", "unknown"),
                            "similarity": doc.metadata.get("similarity", 0.0),
                            "chunk_index": doc.metadata.get("chunk_index", 0),
                            "text": doc.page_content
                        }
                        for doc in source_docs
                    ],
                    "num_sources": len(source_docs),
                    "query_enhanced": self.use_prompt_enhancement,
                    "original_question": question
                }
            
            return answer
            
        except Exception as e:
            logger.error(f"❌ Error in ask(): {e}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            if return_metadata:
                return {
                    "answer": f"Error: {str(e)}",
                    "source_documents": [],
                    "num_sources": 0,
                    "error": str(e)
                }
            return f"Error: {str(e)}"
    
    def clear_memory(self):
        """Clear conversation memory"""
        self.memory.clear()
        logger.info("🗑️ Conversation memory cleared")
    
    def get_memory_stats(self) -> Dict[str, Any]:
        """
        Get memory statistics
        
        Returns:
            Dict with memory info
        """
        try:
            messages = self.memory.chat_memory.messages
            return {
                "total_messages": len(messages),
                "conversation_turns": len(messages) // 2,
                "memory_k": self.memory_k,
                "has_history": len(messages) > 0
            }
        except Exception as e:
            logger.error(f"Failed to get memory stats: {e}")
            return {
                "total_messages": 0,
                "conversation_turns": 0,
                "memory_k": self.memory_k,
                "has_history": False,
                "error": str(e)
            }


def create_conversational_rag(
    rag_service,
    workspace_id: str,
    **kwargs
) -> ConversationalRAGPipeline:
    """
    Factory function to create a conversational RAG pipeline
    
    Args:
        rag_service: Instance of RAGService
        workspace_id: Workspace ID
        **kwargs: Additional arguments for ConversationalRAGPipeline
        
    Returns:
        ConversationalRAGPipeline instance
    """
    return ConversationalRAGPipeline(
        rag_service=rag_service,
        workspace_id=workspace_id,
        **kwargs
    )
