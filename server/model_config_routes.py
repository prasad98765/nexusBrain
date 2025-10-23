"""
Model Configuration Routes
Handles workspace model configuration for different categories
"""
from flask import Blueprint, request, jsonify
from .models import db, Workspace
from .auth_utils import require_auth

model_config_bp = Blueprint('model_config', __name__)

# Default model configuration
DEFAULT_MODEL_CONFIG = {
    "teacher": [
        "anthropic/claude-3-opus",
        "openai/gpt-4o"
    ],
    "coder": [
        "openai/gpt-4o",
        "anthropic/claude-sonnet-4.5"
    ],
    "summarizer": [
        "openai/gpt-4o-mini",
        "anthropic/claude-3.5-sonnet"
    ],
    "creative": [
        "google/gemini-2.5-flash",
        "openai/gpt-4o"
    ],
    "fact_checker": [
        "x-ai/grok-code-fast-1",
        "anthropic/claude-3.5-sonnet"
    ],
    "general": [
        "openai/gpt-4o-mini",
        "google/gemini-2.5-pro"
    ]
}


@model_config_bp.route('/workspace/model-config', methods=['GET'])
@require_auth
def get_model_config():
    """Get current workspace model configuration"""
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID is required'}), 400
        
        workspace = Workspace.query.get(workspace_id)
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        
        # Return model_config or default if not set
        model_config = workspace.model_config or DEFAULT_MODEL_CONFIG
        
        return jsonify({
            'model_config': model_config
        }), 200
        
    except Exception as e:
        print(f"Get model config error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@model_config_bp.route('/workspace/model-config', methods=['POST'])
@require_auth
def create_or_update_model_config():
    """Create or update workspace model configuration"""
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID is required'}), 400
        
        data = request.get_json()
        if not data or 'model_config' not in data:
            return jsonify({'error': 'model_config is required'}), 400
        
        model_config = data['model_config']
        
        # Validate model_config structure
        required_categories = ['teacher', 'coder', 'summarizer', 'creative', 'fact_checker', 'general']
        for category in required_categories:
            if category not in model_config:
                return jsonify({'error': f'Missing category: {category}'}), 400
            if not isinstance(model_config[category], list):
                return jsonify({'error': f'Category {category} must be an array'}), 400
        
        workspace = Workspace.query.get(workspace_id)
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        
        # Update model configuration
        workspace.model_config = model_config
        db.session.commit()
        
        return jsonify({
            'message': 'Model configuration updated successfully',
            'model_config': model_config
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Update model config error: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@model_config_bp.route('/workspace/model-config', methods=['DELETE'])
@require_auth
def reset_model_config():
    """Reset workspace model configuration to default"""
    try:
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID is required'}), 400
        
        workspace = Workspace.query.get(workspace_id)
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        
        # Reset to default configuration
        workspace.model_config = DEFAULT_MODEL_CONFIG
        db.session.commit()
        
        return jsonify({
            'message': 'Model configuration reset to defaults',
            'model_config': DEFAULT_MODEL_CONFIG
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Reset model config error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
