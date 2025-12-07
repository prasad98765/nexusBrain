from flask import Blueprint, request, jsonify
from server.models import db, FlowAgent
from server.auth_utils import require_auth
from typing import Dict, Any

flow_agents_bp = Blueprint('flow_agents', __name__)

@flow_agents_bp.route('/flow-agents', methods=['GET'])
@require_auth
def get_flow_agents():
    """Get all flow agents for a workspace with pagination and search"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        search = request.args.get('search', '').strip()
        
        # Build query
        query = FlowAgent.query.filter_by(workspace_id=workspace_id)
        
        # Apply search filter
        if search:
            search_pattern = f'%{search}%'
            query = query.filter(
                db.or_(
                    FlowAgent.name.ilike(search_pattern),
                    FlowAgent.description.ilike(search_pattern)
                )
            )
        
        # Order by created_at desc to show latest first
        query = query.order_by(FlowAgent.created_at.desc())
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        agents = query.offset((page - 1) * limit).limit(limit).all()
        
        agents_data = []
        for agent in agents:
            agent_dict = {
                'id': agent.id,
                'name': agent.name,
                'description': agent.description,
                'flowData': agent.flow_data,
                'workspaceId': agent.workspace_id,
                'isActive': agent.is_active,
                'agentType' : agent.agent_type,
                'configuration': agent.configuration or {},
                'createdAt': agent.created_at.isoformat(),
                'updatedAt': agent.updated_at.isoformat() if agent.updated_at else agent.created_at.isoformat()
            }
            agents_data.append(agent_dict)
        
        return jsonify({
            'agents': agents_data,
            'total': total_count,
            'page': page,
            'limit': limit,
            'totalPages': (total_count + limit - 1) // limit
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@flow_agents_bp.route('/flow-agents', methods=['POST'])
@require_auth
def create_flow_agent():
    """Create a new flow agent"""
    try:
        data = request.get_json()
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'Workspace ID is required'}), 400
        
        if not data.get('name'):
            return jsonify({'error': 'Agent name is required'}), 400
        
        # Create new flow agent
        agent = FlowAgent()
        agent.name = data['name']
        agent.description = data.get('description', '')
        agent.flow_data = data.get('flowData', None)
        agent.workspace_id = workspace_id
        agent.is_active = data.get('isActive', True)
        agent.configuration = data.get('configuration', {})
        
        db.session.add(agent)
        db.session.commit()
        
        return jsonify({
            'id': agent.id,
            'name': agent.name,
            'description': agent.description,
            'flowData': agent.flow_data,
            'workspaceId': agent.workspace_id,
            'isActive': agent.is_active,
            'configuration': agent.configuration,
            'createdAt': agent.created_at.isoformat(),
            'updatedAt': agent.updated_at.isoformat() if agent.updated_at else agent.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@flow_agents_bp.route('/flow-agents/<agent_id>', methods=['GET'])
@require_auth
def get_flow_agent(agent_id):
    """Get a specific flow agent"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        agent = FlowAgent.query.filter_by(id=agent_id, workspace_id=workspace_id).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        return jsonify({
            'id': agent.id,
            'name': agent.name,
            'description': agent.description,
            'flowData': agent.flow_data,
            'workspaceId': agent.workspace_id,
            'isActive': agent.is_active,
            'configuration': agent.configuration or {},
            'createdAt': agent.created_at.isoformat(),
            'updatedAt': agent.updated_at.isoformat() if agent.updated_at else agent.created_at.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@flow_agents_bp.route('/flow-agents/<agent_id>', methods=['PATCH'])
@require_auth
def update_flow_agent(agent_id):
    """Update a flow agent"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        agent = FlowAgent.query.filter_by(id=agent_id, workspace_id=workspace_id).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            agent.name = data['name']
        if 'description' in data:
            agent.description = data['description']
        if 'flowData' in data:
            agent.flow_data = data['flowData']
        if 'isActive' in data:
            agent.is_active = data['isActive']
        if 'configuration' in data:
            agent.configuration = data['configuration']
        
        db.session.commit()
        
        return jsonify({
            'id': agent.id,
            'name': agent.name,
            'description': agent.description,
            'flowData': agent.flow_data,
            'workspaceId': agent.workspace_id,
            'isActive': agent.is_active,
            'configuration': agent.configuration or {},
            'createdAt': agent.created_at.isoformat(),
            'updatedAt': agent.updated_at.isoformat() if agent.updated_at else agent.created_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@flow_agents_bp.route('/flow-agents/<agent_id>', methods=['DELETE'])
@require_auth
def delete_flow_agent(agent_id):
    """Delete a flow agent"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        agent = FlowAgent.query.filter_by(id=agent_id, workspace_id=workspace_id).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        db.session.delete(agent)
        db.session.commit()
        
        return jsonify({'message': 'Agent deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@flow_agents_bp.route('/flow-agents/<agent_id>/flow', methods=['PATCH'])
@require_auth
def update_flow_data(agent_id):
    """Update only the flow data for a flow agent"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        agent = FlowAgent.query.filter_by(id=agent_id, workspace_id=workspace_id).first()
        
        if not agent:
            return jsonify({'error': 'Agent not found'}), 404
        
        data = request.get_json()
        
        if 'flowData' not in data:
            return jsonify({'error': 'flowData is required'}), 400
        
        agent.flow_data = data['flowData']
        db.session.commit()
        
        return jsonify({
            'message': 'Flow data updated successfully',
            'flowData': agent.flow_data
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
