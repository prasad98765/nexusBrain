"""
System Prompts Routes - Manage AI system prompts
"""
import logging
import time
from flask import Blueprint, request, jsonify
from sqlalchemy import or_
from .auth_utils import require_auth
from .models import ApiToken, db, SystemPrompt, Workspace
from .llm_routes import async_log_api_usage, forward_to_openrouter, get_api_token_from_request

logger = logging.getLogger(__name__)

system_prompts_bp = Blueprint('system_prompts', __name__)


@system_prompts_bp.route('/system_prompts', methods=['GET'])
@require_auth
def get_system_prompts():
    """
    Get paginated list of system prompts with search functionality
    Query params: search, page, limit
    """
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401

        # Get query parameters
        search = request.args.get('search', '').strip()
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 10)), 100)  # Max 100 per page
        
        # Base query
        query = SystemPrompt.query.filter_by(workspace_id=workspace_id)
        
        # Add search filter
        if search:
            query = query.filter(
                or_(
                    SystemPrompt.title.ilike(f'%{search}%'),
                    SystemPrompt.prompt.ilike(f'%{search}%')
                )
            )
        
        # Order by created_at desc (newest first)
        query = query.order_by(SystemPrompt.created_at.desc())
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        prompts = query.offset((page - 1) * limit).limit(limit).all()
        
        # Format response
        prompts_data = []
        for prompt in prompts:
            prompts_data.append({
                'id': prompt.id,
                'title': prompt.title,
                'prompt': prompt.prompt,
                'is_active': prompt.is_active,
                'created_at': prompt.created_at.isoformat(),
                'updated_at': prompt.updated_at.isoformat()
            })
        
        return jsonify({
            'prompts': prompts_data,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching system prompts: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@system_prompts_bp.route('/system_prompts', methods=['POST'])
@require_auth
def create_system_prompt():
    """
    Create a new system prompt
    Body: { title, prompt, is_active? }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
            
        title = data.get('title', '').strip()
        prompt = data.get('prompt', '').strip()
        is_active = data.get('is_active', False)
        
        if not title:
            return jsonify({'error': 'Title is required'}), 400
            
        if not prompt:
            return jsonify({'error': 'Prompt is required'}), 400
            
        # If setting this as active, deactivate all others
        if is_active:
            SystemPrompt.query.filter_by(workspace_id=workspace_id, is_active=True).update({'is_active': False})
        
        # Create new prompt
        new_prompt = SystemPrompt(
            workspace_id=workspace_id,
            title=title,
            prompt=prompt,
            is_active=is_active
        )
        
        db.session.add(new_prompt)
        db.session.commit()
        
        return jsonify({
            'id': new_prompt.id,
            'title': new_prompt.title,
            'prompt': new_prompt.prompt,
            'is_active': new_prompt.is_active,
            'created_at': new_prompt.created_at.isoformat(),
            'updated_at': new_prompt.updated_at.isoformat(),
            'message': 'System prompt created successfully'
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating system prompt: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@system_prompts_bp.route('/system_prompts/<prompt_id>', methods=['PUT'])
@require_auth
def update_system_prompt(prompt_id):
    """
    Update an existing system prompt
    Body: { title?, prompt?, is_active? }
    """
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
            
        # Find the prompt
        prompt = SystemPrompt.query.filter_by(id=prompt_id, workspace_id=workspace_id).first()
        if not prompt:
            return jsonify({'error': 'System prompt not found'}), 404
            
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400
        
        # Update fields if provided
        if 'title' in data:
            title = data['title'].strip()
            if not title:
                return jsonify({'error': 'Title cannot be empty'}), 400
            prompt.title = title
            
        if 'prompt' in data:
            prompt_text = data['prompt'].strip()
            if not prompt_text:
                return jsonify({'error': 'Prompt cannot be empty'}), 400
            prompt.prompt = prompt_text
            
        if 'is_active' in data:
            is_active = data['is_active']
            if is_active and not prompt.is_active:
                # Deactivate all other prompts in this workspace
                SystemPrompt.query.filter_by(workspace_id=workspace_id, is_active=True).update({'is_active': False})
            prompt.is_active = is_active
        
        db.session.commit()
        
        return jsonify({
            'id': prompt.id,
            'title': prompt.title,
            'prompt': prompt.prompt,
            'is_active': prompt.is_active,
            'created_at': prompt.created_at.isoformat(),
            'updated_at': prompt.updated_at.isoformat(),
            'message': 'System prompt updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating system prompt: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@system_prompts_bp.route('/system_prompts/<prompt_id>', methods=['DELETE'])
@require_auth
def delete_system_prompt(prompt_id):
    """
    Delete a system prompt by ID
    """
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
            
        # Find the prompt
        prompt = SystemPrompt.query.filter_by(id=prompt_id, workspace_id=workspace_id).first()
        if not prompt:
            return jsonify({'error': 'System prompt not found'}), 404
        
        db.session.delete(prompt)
        db.session.commit()
        
        return jsonify({'message': 'System prompt deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting system prompt: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@system_prompts_bp.route('/system_prompts/<prompt_id>/activate', methods=['POST'])
@require_auth
def activate_system_prompt(prompt_id):
    """
    Activate a system prompt (deactivates all others)
    """
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
            
        # Find the prompt
        prompt = SystemPrompt.query.filter_by(id=prompt_id, workspace_id=workspace_id).first()
        if not prompt:
            return jsonify({'error': 'System prompt not found'}), 404
        
        # Deactivate all prompts in this workspace
        SystemPrompt.query.filter_by(workspace_id=workspace_id, is_active=True).update({'is_active': False})
        
        # Activate this prompt
        prompt.is_active = True
        db.session.commit()
        
        return jsonify({
            'id': prompt.id,
            'title': prompt.title,
            'prompt': prompt.prompt,
            'is_active': prompt.is_active,
            'created_at': prompt.created_at.isoformat(),
            'updated_at': prompt.updated_at.isoformat(),
            'message': 'System prompt activated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error activating system prompt: {e}")
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500


@system_prompts_bp.route('/system_prompts/enhance', methods=['POST'])
@require_auth
def enhance_system_prompt():
    """
    Enhance a system prompt using AI
    Body: { prompt }
    Returns: { enhanced_prompt }
    """
    try:
        start_time = time.time()
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body must be JSON'}), 400

        user_prompt = data.get('prompt', '').strip()
        if not user_prompt:
            return jsonify({'error': 'Prompt is required'}), 400
        
        # Create enhancement prompt
        enhancement_context = """You are an expert at crafting effective AI system prompts. 
Your task is to enhance and refine the given prompt to be more valuable, context-aware, and effective.

Guidelines for enhancement:
1. Make the prompt more specific and actionable
2. Add context about the AI's role and capabilities
3. Include guidelines for tone, style, and behavior
4. Ensure clarity and remove ambiguity
5. Add relevant constraints or boundaries if needed
6. Make it more professional and comprehensive

Please enhance the following prompt:"""
        
        # Prepare request for OpenRouter
        payload = {
            "model": "openai/gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": enhancement_context},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 1000,
            "temperature": 0.7
        }
        
        # Call OpenRouter
        response, status_code = forward_to_openrouter("/chat/completions", payload)
        
        if status_code != 200:
            logger.error(f"OpenRouter API error: {status_code}")
            return jsonify({'error': 'Failed to enhance prompt'}), 500
            
        response_data = response.get_json() if hasattr(response, 'get_json') else response.json
        
        if not response_data or 'choices' not in response_data or not response_data['choices']:
            return jsonify({'error': 'Invalid response from AI service'}), 500
            
        enhanced_prompt = response_data['choices'][0]['message']['content'].strip()
        
        return jsonify({
            'original_prompt': user_prompt,
            'enhanced_prompt': enhanced_prompt,
            'message': 'Prompt enhanced successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error enhancing system prompt: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@system_prompts_bp.route('/system_prompts/active', methods=['GET'])
@require_auth
def get_active_system_prompt():
    """
    Get the currently active system prompt for the workspace
    """
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'Workspace ID required'}), 401
            
        # Find active prompt
        active_prompt = SystemPrompt.query.filter_by(
            workspace_id=workspace_id, 
            is_active=True
        ).first()
        
        if not active_prompt:
            return jsonify({
                'active_prompt': None,
                'message': 'No active system prompt found'
            }), 200
        
        return jsonify({
            'active_prompt': {
                'id': active_prompt.id,
                'title': active_prompt.title,
                'prompt': active_prompt.prompt,
                'is_active': active_prompt.is_active,
                'created_at': active_prompt.created_at.isoformat(),
                'updated_at': active_prompt.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching active system prompt: {e}")
        return jsonify({'error': 'Internal server error'}), 500