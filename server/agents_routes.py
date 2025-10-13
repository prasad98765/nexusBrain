from flask import Blueprint, request, jsonify, send_file, send_from_directory
from models import db, Agent
from auth_utils import require_auth
from typing import Dict, Any
import os

agents_bp = Blueprint('agents', __name__)

@agents_bp.route('/agents', methods=['POST'])
@require_auth
def create_agent():
    """Create a new agent"""
    try:
        data = request.get_json()
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not data.get('type'):
            return jsonify({'error': 'Agent type is required'}), 400
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID is required'}), 400
        
        # Validate agent type
        valid_types = ['web', 'whatsapp', 'voice']
        if data['type'] not in valid_types:
            return jsonify({'error': f'Invalid agent type. Must be one of: {valid_types}'}), 400
        
        # Create new agent
        agent = Agent()
        agent.name = data.get('name', f"{data['type'].title()} Agent")
        agent.type = data['type']
        agent.description = data.get('description', '')
        agent.status = data.get('status', 'draft')
        agent.configuration = data.get('configuration', {})
        agent.workspace_id = workspace_id
        
        db.session.add(agent)
        db.session.commit()
        
        return jsonify({
            'id': agent.id,
            'name': agent.name,
            'type': agent.type,
            'description': agent.description,
            'status': agent.status,
            'configuration': agent.configuration,
            'workspaceId': agent.workspace_id,
            'createdAt': agent.created_at.isoformat(),
            'updatedAt': agent.updated_at.isoformat() if agent.updated_at else agent.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agents_bp.route('/agents', methods=['GET'])
@require_auth
def get_agents():
    """Get agents for a workspace"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Build query
        query = Agent.query.filter_by(workspace_id=workspace_id)
        
        # Order by created_at desc to show latest first
        query = query.order_by(Agent.created_at.desc())
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        agents = query.offset((page - 1) * limit).limit(limit).all()
        
        agents_data = []
        for agent in agents:
            agent_dict = {
                'id': agent.id,
                'name': agent.name,
                'type': agent.type,
                'description': agent.description,
                'status': agent.status,
                'configuration': agent.configuration or {},
                'workspaceId': agent.workspace_id,
                'createdAt': agent.created_at.isoformat(),
                'updatedAt': agent.updated_at.isoformat() if agent.updated_at else agent.created_at.isoformat()
            }
            agents_data.append(agent_dict)
        
        return jsonify({
            'agents': agents_data,
            'total': total_count,
            'page': page,
            'totalPages': (total_count + limit - 1) // limit
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agents_bp.route('/agents/<agent_id>', methods=['GET'])
@require_auth
def get_agent(agent_id):
    """Get a specific agent"""
    try:
        agent = Agent.query.get_or_404(agent_id)
        
        return jsonify({
            'id': agent.id,
            'name': agent.name,
            'type': agent.type,
            'description': agent.description,
            'status': agent.status,
            'configuration': agent.configuration or {},
            'workspaceId': agent.workspace_id,
            'createdAt': agent.created_at.isoformat(),
            'updatedAt': agent.updated_at.isoformat() if agent.updated_at else agent.created_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agents_bp.route('/agents/<agent_id>', methods=['PATCH'])
@require_auth
def update_agent(agent_id):
    """Update an agent"""
    try:
        agent = Agent.query.get_or_404(agent_id)
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            agent.name = data['name']
        if 'description' in data:
            agent.description = data['description']
        if 'status' in data:
            agent.status = data['status']
        if 'configuration' in data:
            agent.configuration = data['configuration']
        
        db.session.commit()
        
        return jsonify({
            'id': agent.id,
            'name': agent.name,
            'type': agent.type,
            'description': agent.description,
            'status': agent.status,
            'configuration': agent.configuration or {},
            'workspaceId': agent.workspace_id,
            'createdAt': agent.created_at.isoformat(),
            'updatedAt': agent.updated_at.isoformat() if agent.updated_at else agent.created_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agents_bp.route('/agents/<agent_id>', methods=['DELETE'])
@require_auth
def delete_agent(agent_id):
    """Delete an agent"""
    try:
        agent = Agent.query.get_or_404(agent_id)
        db.session.delete(agent)
        db.session.commit()
        
        return jsonify({'message': 'Agent deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agents_bp.route('/agents/<agent_id>/flow', methods=['POST'])
@require_auth
def save_agent_flow(agent_id):
    """Save agent flow configuration"""
    try:
        agent = Agent.query.get_or_404(agent_id)
        data = request.get_json()
        
        if not data.get('flow'):
            return jsonify({'error': 'Flow data is required'}), 400
        
        # Update agent configuration with flow data
        if not agent.configuration:
            agent.configuration = {}
        
        agent.configuration['flow'] = data['flow']
        db.session.commit()
        
        return jsonify({
            'message': 'Flow saved successfully',
            'flowId': f"flow-{agent_id}"
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@agents_bp.route('/agents/<agent_id>/flow', methods=['GET'])
@require_auth
def get_agent_flow(agent_id):
    """Get agent flow configuration"""
    try:
        agent = Agent.query.get_or_404(agent_id)
        
        flow = None
        if agent.configuration and 'flow' in agent.configuration:
            flow = agent.configuration['flow']
        
        return jsonify({
            'flow': flow,
            'agentId': agent_id
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@agents_bp.route('/agent.js', methods=['GET'])
def serve_agent_script():
    """Serve the embed script"""
    try:
        script_path = os.path.join(os.getcwd(), 'public', 'agent.js')
        return send_file(script_path, mimetype='application/javascript')
    except Exception as e:
        return jsonify({'error': 'Script not found'}), 404

@agents_bp.route('/agents/<agent_id>/embed-info', methods=['GET'])
def get_agent_embed_info(agent_id):
    """Get agent details for embed script (no auth required for public access)"""
    try:
        workspace_id = request.args.get('workspace_id')
        print("agent_id",agent_id,workspace_id)
        if not workspace_id:
            return jsonify({'error': 'Workspace ID is required'}), 400
        
        agent = Agent.query.filter_by(id=agent_id, workspace_id=workspace_id).first()
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        # Only allow published agents to be embedded
        if agent.status != 'published':
            return jsonify({'error': 'Agent is not published'}), 403
        
        # Get theme configuration from agent configuration
        config = agent.configuration or {}
        theme = config.get('theme', {})
        
        # Default theme settings
        default_theme = {
            'primaryColor': '#6366f1',
            'backgroundColor': '#ffffff',
            'textColor': '#1f2937',
            'fontFamily': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            'borderRadius': '12px',
            'iconSize': '60px',
            'position': 'bottom-right'
        }
        
        # Merge with custom theme
        final_theme = {**default_theme, **theme}
        
        return jsonify({
            'id': agent.id,
            'name': agent.name,
            'type': agent.type,
            'description': agent.description,
            'workspaceId': agent.workspace_id,
            'theme': final_theme,
            'welcomeMessage': config.get('welcomeMessage', f"Hi! I'm {agent.name}. How can I help you today?"),
            'flow': config.get('flow', None)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500