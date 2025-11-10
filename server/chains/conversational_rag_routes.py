"""
Flask routes for Conversational RAG Pipeline
"""
import os
import sys
import logging
from flask import Blueprint, request, jsonify

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from auth_utils import require_auth
from rag_service import rag_service
from chains.rag_chain import create_conversational_rag

logger = logging.getLogger(__name__)

# In-memory storage for active RAG pipelines (session-based)
active_rag_sessions = {}

conversational_rag_bp = Blueprint('conversational_rag', __name__)


@conversational_rag_bp.route('/api/rag/conversation/ask', methods=['POST'])
@require_auth
def conversational_rag_ask():
    """
    Ask a question using conversational RAG
    
    Request body:
    {
        "question": "What is the revenue growth?",
        "session_id": "user_session_123",  // Optional, for conversation continuity
        "top_k": 5,                         // Optional, default 5
        "threshold": 0.5,                   // Optional, default 0.5
        "model": "gpt-4o",                  // Optional, default gpt-4o
        "temperature": 0.7,                 // Optional, default 0.7
        "memory_k": 3                       // Optional, default 3
    }
    
    Response:
    {
        "answer": "The revenue growth was...",
        "sources": [
            {
                "filename": "report.pdf",
                "similarity": 0.85,
                "chunk_index": 2,
                "text": "..."
            }
        ],
        "num_sources": 3,
        "session_id": "user_session_123",
        "conversation_turns": 2
    }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
        
        data = request.get_json()
        question = data.get('question')
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Get or generate session ID
        session_id = data.get('session_id', f"{workspace_id}_{os.urandom(8).hex()}")
        
        # Get configuration
        top_k = data.get('top_k', 5)
        threshold = data.get('threshold', 0.5)
        model = data.get('model', 'gpt-4o')
        temperature = data.get('temperature', 0.7)
        memory_k = data.get('memory_k', 3)
        
        # Get or create RAG pipeline for this session
        pipeline_key = f"{workspace_id}_{session_id}"
        
        if pipeline_key not in active_rag_sessions:
            logger.info(f"Creating new RAG pipeline for session: {session_id}")
            active_rag_sessions[pipeline_key] = create_conversational_rag(
                rag_service=rag_service,
                workspace_id=workspace_id,
                model=model,
                temperature=temperature,
                top_k=top_k,
                threshold=threshold,
                memory_k=memory_k,
                use_prompt_enhancement=True
            )
        
        pipeline = active_rag_sessions[pipeline_key]
        
        # Ask question with metadata
        response = pipeline.ask(question, return_metadata=True)
        
        # Get memory stats
        stats = pipeline.get_memory_stats()
        
        return jsonify({
            'answer': response['answer'],
            'sources': response['source_documents'],
            'num_sources': response['num_sources'],
            'session_id': session_id,
            'conversation_turns': stats['conversation_turns'],
            'query_enhanced': response.get('query_enhanced', False)
        }), 200
        
    except Exception as e:
        logger.error(f"Conversational RAG error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@conversational_rag_bp.route('/api/rag/conversation/clear', methods=['POST'])
@require_auth
def clear_conversation():
    """
    Clear conversation memory for a session
    
    Request body:
    {
        "session_id": "user_session_123"
    }
    
    Response:
    {
        "status": "cleared",
        "session_id": "user_session_123"
    }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        pipeline_key = f"{workspace_id}_{session_id}"
        
        if pipeline_key in active_rag_sessions:
            active_rag_sessions[pipeline_key].clear_memory()
            logger.info(f"Cleared memory for session: {session_id}")
        
        return jsonify({
            'status': 'cleared',
            'session_id': session_id
        }), 200
        
    except Exception as e:
        logger.error(f"Clear conversation error: {e}")
        return jsonify({'error': str(e)}), 500


@conversational_rag_bp.route('/api/rag/conversation/stats', methods=['GET'])
@require_auth
def get_conversation_stats():
    """
    Get conversation statistics for a session
    
    Query params:
    - session_id: Session ID
    
    Response:
    {
        "exists": true,
        "session_id": "user_session_123",
        "total_messages": 6,
        "conversation_turns": 3,
        "memory_k": 3,
        "has_history": true
    }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        session_id = request.args.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        pipeline_key = f"{workspace_id}_{session_id}"
        
        if pipeline_key not in active_rag_sessions:
            return jsonify({
                'exists': False,
                'message': 'Session not found'
            }), 404
        
        pipeline = active_rag_sessions[pipeline_key]
        stats = pipeline.get_memory_stats()
        
        return jsonify({
            'exists': True,
            'session_id': session_id,
            **stats
        }), 200
        
    except Exception as e:
        logger.error(f"Get stats error: {e}")
        return jsonify({'error': str(e)}), 500


@conversational_rag_bp.route('/api/rag/conversation/sessions', methods=['GET'])
@require_auth
def list_active_sessions():
    """
    List all active conversational RAG sessions for the workspace
    
    Response:
    {
        "sessions": [
            {
                "session_id": "session_123",
                "conversation_turns": 3,
                "has_history": true
            }
        ],
        "count": 1
    }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        
        # Filter sessions by workspace
        workspace_sessions = []
        for pipeline_key in active_rag_sessions.keys():
            if pipeline_key.startswith(f"{workspace_id}_"):
                session_id = pipeline_key.replace(f"{workspace_id}_", "")
                stats = active_rag_sessions[pipeline_key].get_memory_stats()
                workspace_sessions.append({
                    'session_id': session_id,
                    'conversation_turns': stats['conversation_turns'],
                    'has_history': stats['has_history']
                })
        
        return jsonify({
            'sessions': workspace_sessions,
            'count': len(workspace_sessions)
        }), 200
        
    except Exception as e:
        logger.error(f"List sessions error: {e}")
        return jsonify({'error': str(e)}), 500


@conversational_rag_bp.route('/api/rag/conversation/delete', methods=['DELETE'])
@require_auth
def delete_session():
    """
    Delete a conversational RAG session
    
    Request body:
    {
        "session_id": "user_session_123"
    }
    
    Response:
    {
        "status": "deleted",
        "session_id": "user_session_123"
    }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
        
        pipeline_key = f"{workspace_id}_{session_id}"
        
        if pipeline_key in active_rag_sessions:
            del active_rag_sessions[pipeline_key]
            logger.info(f"Deleted session: {session_id}")
            
            return jsonify({
                'status': 'deleted',
                'session_id': session_id
            }), 200
        else:
            return jsonify({
                'status': 'not_found',
                'session_id': session_id
            }), 404
        
    except Exception as e:
        logger.error(f"Delete session error: {e}")
        return jsonify({'error': str(e)}), 500
