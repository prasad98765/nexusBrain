from datetime import datetime
from flask import Blueprint, request, jsonify
from .models import db, ScriptSettings, Workspace
from .auth_utils import require_auth

script_bp = Blueprint('script', __name__)

@script_bp.route('/script/<workspace_id>', methods=['GET'])
def get_script_settings(workspace_id):
    """Get script/theme settings for a workspace"""
    try:
        # Check if workspace exists
        workspace = Workspace.query.filter_by(id=workspace_id).first()
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        
        # Get script settings
        settings = ScriptSettings.query.filter_by(workspace_id=workspace_id).first()
        
        if not settings:
            # Return default theme settings if none exist
            default_theme = {
                'primary_color': '#6366f1',
                'secondary_color': '#8b5cf6',
                'background_color': '#ffffff',
                'font_style': 'Inter',
                'button_style': 'rounded',
                'logo_url': '',
                'ai_search_engine_name': 'AI Search Engine',
                'theme_preset': 'light',
                'welcome_message': 'Hello! How can I help you today?'
            }
            default_model_config = {
                'model': 'meta-llama/llama-3.3-8b-instruct:free',
                'max_tokens': 300,
                'temperature': 0.5,
                'stream': True,
                'cache_threshold': 0.5,
                'is_cached': False,
                'use_rag': False
            }
            return jsonify({
                'workspace_id': workspace_id,
                'theme_settings': default_theme,
                'quick_buttons': [],
                'model_config': default_model_config,
                'created_at': None,
                'updated_at': None
            })
        
        return jsonify({
            'workspace_id': settings.workspace_id,
            'theme_settings': settings.theme_settings,
            'quick_buttons': settings.quick_buttons or [],
            'model_config': settings.model_config or {
                'model': 'meta-llama/llama-3.3-8b-instruct:free',
                'max_tokens': 300,
                'temperature': 0.5,
                'stream': True,
                'cache_threshold': 0.5,
                'is_cached': False,
                'use_rag': False
            },
            'created_at': settings.created_at.isoformat() if settings.created_at else None,
            'updated_at': settings.updated_at.isoformat() if settings.updated_at else None
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@script_bp.route('/script/<workspace_id>', methods=['POST'])
@require_auth
def save_script_settings(workspace_id):
    """Save or update script/theme settings for a workspace"""
    try:
        # Verify user has access to this workspace
        user_workspace_id = request.user.get('workspace_id')
        if user_workspace_id != workspace_id:
            return jsonify({'error': 'Unauthorized access to workspace'}), 403
        
        data = request.get_json()
        theme_settings = data.get('theme_settings')
        quick_buttons = data.get('quick_buttons', [])
        model_config = data.get('model_config')
        
        if not theme_settings:
            return jsonify({'error': 'theme_settings is required'}), 400
        
        # Validate required theme fields
        required_fields = [
            'primary_color', 'secondary_color', 'background_color', 
            'font_style', 'button_style', 'ai_search_engine_name',
            'theme_preset', 'welcome_message'
        ]
        
        for field in required_fields:
            if field not in theme_settings:
                return jsonify({'error': f'{field} is required in theme_settings'}), 400
        
        # Check if workspace exists
        workspace = Workspace.query.filter_by(id=workspace_id).first()
        if not workspace:
            return jsonify({'error': 'Workspace not found'}), 404
        
        # Check if settings already exist
        settings = ScriptSettings.query.filter_by(workspace_id=workspace_id).first()
        
        if settings:
            # Update existing settings
            settings.theme_settings = theme_settings
            settings.quick_buttons = quick_buttons
            if model_config is not None:
                settings.model_config = model_config
            settings.updated_at = datetime.utcnow()
        else:
            # Create new settings
            settings = ScriptSettings(
                workspace_id=workspace_id,
                theme_settings=theme_settings,
                quick_buttons=quick_buttons,
                model_config=model_config
            )
            db.session.add(settings)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Settings saved successfully',
            'workspace_id': settings.workspace_id,
            'theme_settings': settings.theme_settings,
            'quick_buttons': settings.quick_buttons or [],
            'model_config': settings.model_config or {},
            'created_at': settings.created_at.isoformat(),
            'updated_at': settings.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
