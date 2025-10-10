from flask import Blueprint, request, jsonify
from typing import Dict, Any
import logging
from qa_redis_service import qa_redis_service
from auth_utils import (
    require_auth
)
logger = logging.getLogger(__name__)

qa_bp = Blueprint('qa', __name__)

@qa_bp.route('/qa/entries', methods=['GET'])
@require_auth
def get_qa_entries():
    """Get Q/A entries for a workspace with pagination and filtering"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 25)), 100)  # Max 100 per page
        
        # Get filter parameters
        model_filter = request.args.get('model', 'all')
        search_query = request.args.get('search', '')
        
        # Validate parameters
        if page < 1:
            page = 1
        if limit < 1:
            limit = 25
        
        # Get Q/A entries from Redis
        result = qa_redis_service.get_workspace_qa_list(
            workspace_id=workspace_id,
            page=page,
            limit=limit,
            model_filter=model_filter if model_filter != 'all' else None,
            search_query=search_query if search_query else None
        )
        
        logger.info(f"Retrieved {len(result['entries'])} Q/A entries for workspace {workspace_id}")
        
        return jsonify({
            'entries': result['entries'],
            'total': result['total'],
            'page': result['page'],
            'limit': result['limit'],
            'totalPages': result['total_pages']
        })
        
    except ValueError as e:
        logger.error(f"Invalid parameter in Q/A entries request: {e}")
        return jsonify({'error': 'Invalid parameters provided'}), 400
    except Exception as e:
        logger.error(f"Failed to get Q/A entries: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@qa_bp.route('/qa/entries/<qa_id>', methods=['PUT'])
@require_auth
def update_qa_answer(qa_id: str):
    """Update the answer for a specific Q/A entry"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        new_answer = data.get('answer')
        if not new_answer or not isinstance(new_answer, str):
            return jsonify({'error': 'answer is required and must be a string'}), 400
        
        # Validate answer length (max 10000 characters)
        if len(new_answer) > 10000:
            return jsonify({'error': 'Answer too long (max 10000 characters)'}), 400
        
        # Check if Q/A entry exists and belongs to this workspace
        qa_entry = qa_redis_service.get_qa_by_id(workspace_id, qa_id)
        if not qa_entry:
            return jsonify({'error': 'Q/A entry not found'}), 404
        
        # Update the answer
        success = qa_redis_service.update_qa_answer(workspace_id, qa_id, new_answer)
        
        if not success:
            return jsonify({'error': 'Failed to update Q/A entry'}), 500
        
        # Get the updated entry to return
        updated_entry = qa_redis_service.get_qa_by_id(workspace_id, qa_id)
        if not updated_entry:
            return jsonify({'error': 'Failed to retrieve updated entry'}), 500
        
        logger.info(f"Updated Q/A entry {qa_id} for workspace {workspace_id}")
        
        return jsonify({
            'id': updated_entry.id,
            'workspace_id': updated_entry.workspace_id,
            'model': updated_entry.model,
            'question': updated_entry.question,
            'answer': updated_entry.answer,
            'created_at': updated_entry.created_at,
            'updated_at': updated_entry.updated_at
        })
        
    except Exception as e:
        logger.error(f"Failed to update Q/A entry {qa_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@qa_bp.route('/qa/entries/<qa_id>', methods=['GET'])
@require_auth
def get_qa_entry(qa_id: str):
    """Get a specific Q/A entry by ID"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get Q/A entry from Redis
        qa_entry = qa_redis_service.get_qa_by_id(workspace_id, qa_id)
        if not qa_entry:
            return jsonify({'error': 'Q/A entry not found'}), 404
        
        logger.info(f"Retrieved Q/A entry {qa_id} for workspace {workspace_id}")
        
        return jsonify({
            'id': qa_entry.id,
            'workspace_id': qa_entry.workspace_id,
            'model': qa_entry.model,
            'question': qa_entry.question,
            'answer': qa_entry.answer,
            'created_at': qa_entry.created_at,
            'updated_at': qa_entry.updated_at
        })
        
    except Exception as e:
        logger.error(f"Failed to get Q/A entry {qa_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@qa_bp.route('/qa/entries', methods=['POST'])
@require_auth
def create_qa_entry():
    """Create a new Q/A entry (placeholder for future implementation)"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        model = data.get('model')
        question = data.get('question')
        answer = data.get('answer')
        
        if not all([model, question, answer]):
            return jsonify({'error': 'model, question, and answer are required'}), 400
        
        # Validate input lengths
        if len(question) > 1000:
            return jsonify({'error': 'Question too long (max 1000 characters)'}), 400
        if len(answer) > 10000:
            return jsonify({'error': 'Answer too long (max 10000 characters)'}), 400
        
        # Store Q/A entry
        qa_id = qa_redis_service.store_qa(workspace_id, model, question, answer)
        
        if not qa_id:
            return jsonify({'error': 'Failed to create Q/A entry'}), 500
        
        # Get the created entry to return
        created_entry = qa_redis_service.get_qa_by_id(workspace_id, qa_id)
        if not created_entry:
            return jsonify({'error': 'Failed to retrieve created entry'}), 500
        
        logger.info(f"Created Q/A entry {qa_id} for workspace {workspace_id}")
        
        return jsonify({
            'id': created_entry.id,
            'workspace_id': created_entry.workspace_id,
            'model': created_entry.model,
            'question': created_entry.question,
            'answer': created_entry.answer,
            'created_at': created_entry.created_at,
            'updated_at': created_entry.updated_at
        }), 201
        
    except Exception as e:
        logger.error(f"Failed to create Q/A entry: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@qa_bp.route('/qa/entries/<qa_id>', methods=['DELETE'])
@require_auth
def delete_qa_entry(qa_id: str):
    """Delete a Q/A entry (placeholder for future implementation)"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Check if Q/A entry exists and belongs to this workspace
        qa_entry = qa_redis_service.get_qa_by_id(workspace_id, qa_id)
        if not qa_entry:
            return jsonify({'error': 'Q/A entry not found'}), 404
        
        # Delete the entry
        success = qa_redis_service.delete_qa(workspace_id, qa_id)
        
        if not success:
            return jsonify({'error': 'Failed to delete Q/A entry'}), 500
        
        logger.info(f"Deleted Q/A entry {qa_id} for workspace {workspace_id}")
        
        return jsonify({'message': 'Q/A entry deleted successfully'})
        
    except Exception as e:
        logger.error(f"Failed to delete Q/A entry {qa_id}: {e}")
        return jsonify({'error': 'Internal server error'}), 500