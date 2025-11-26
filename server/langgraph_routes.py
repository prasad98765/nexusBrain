from flask import Blueprint, request, jsonify
from server.auth_utils import require_auth
from server.langgraph_flow_service import (
    execute_single_node,
    find_entry_node
)
from server.models import db, FlowAgent
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

langgraph_bp = Blueprint('langgraph', __name__)



@langgraph_bp.route('/langgraph/health', methods=['GET'])
def health_check():
    """
    Health check endpoint (no auth required).
    
    Returns:
        {
            "status": str,
            "service": str,
            "version": str
        }
    """
    return jsonify({
        'status': 'healthy',
        'service': 'langgraph_interactive_flow',
        'version': '1.0.0'
    }), 200


@langgraph_bp.route('/langgraph/step', methods=['POST'])
@require_auth
def execute_flow_step():
    """
    Execute a single step in the flow (server-driven execution).
    
    This endpoint enables bidirectional UI communication where the server
    controls which node to execute next and the client responds with user input.
    
    Request Body:
        {
            "agent_id": str,           # Required: Agent/flow ID
            "node_id": str,            # Optional: Specific node to execute (or start from beginning)
            "user_input": str,         # Optional: User's input for this step
            "user_data": dict,         # Optional: Previously collected data
            "messages": list,          # Optional: Previous conversation messages
            "conversation_id": str     # Optional: Conversation ID for context
        }
    
    Response:
        {
            "success": bool,
            "current_node_id": str,
            "current_node": dict,       # Node details
            "next_node_id": str,        # Next node to execute (null if complete)
            "state": dict,              # Updated state
            "ui_schema": dict,          # UI rendering instructions
            "response": str,
            "is_complete": bool         # Whether flow is finished
        }
    
    Status Codes:
        200: Success
        400: Bad request
        404: Agent not found
        500: Internal server error
    """
    try:
        user_data_auth: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data_auth.get('workspace_id')
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        agent_id = data.get('agent_id')
        
        if not agent_id:
            return jsonify({'error': 'agent_id is required'}), 400
        
        logger.info(f"[LANGGRAPH STEP] Executing step for agent: {agent_id}")
        
        # Fetch flow agent from database
        flow_agent = FlowAgent.query.filter_by(
            id=agent_id,
            workspace_id=workspace_id
        ).first()
        
        if not flow_agent:
            return jsonify({
                'success': False,
                'error': 'Agent not found',
                'response': 'The specified agent was not found.'
            }), 404
        
        flow_data = flow_agent.flow_data or {}
        flow_nodes = flow_data.get('nodes', [])
        flow_edges = flow_data.get('edges', [])
        
        if not flow_nodes:
            return jsonify({
                'success': False,
                'error': 'No flow configured',
                'response': 'This agent has no flow configured yet.'
            }), 400
        
        # Get node_id - if not provided, start from entry node
        node_id = data.get('node_id')
        if not node_id:
            node_id = find_entry_node(flow_nodes, flow_edges)
            logger.info(f"[LANGGRAPH STEP] Starting from entry node: {node_id}")
        
        # Execute single node
        result = execute_single_node(
            node_id=node_id,
            user_input=data.get('user_input', ''),
            flow_nodes=flow_nodes,
            flow_edges=flow_edges,
            user_data=data.get('user_data', {}),
            messages=data.get('messages', []),
            workspace_id=workspace_id,
            agent_id=agent_id,
            conversation_id=data.get('conversation_id')
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"[LANGGRAPH STEP] Error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e),
            'response': 'An error occurred while executing the flow step'
        }), 500
