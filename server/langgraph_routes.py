from flask import Blueprint, request, jsonify
from server.auth_utils import require_auth
from server.langgraph_flow_service import (
    execute_single_node,
    find_entry_node,
    clear_graph_cache,
    get_conversation_state,
    get_checkpoint_history,
    replay_from_checkpoint,
    get_conversation_graph_visualization,
    get_long_term_memory_summary,
    is_execution_deterministic
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


@langgraph_bp.route('/langgraph/clear-cache', methods=['POST'])
@require_auth
def clear_cache():
    """
    Clear the graph cache for a specific agent or all agents.
    Call this when a flow is updated to ensure changes are reflected.
    
    Request Body:
        {
            "agent_id": str  # Optional: If provided, clear only this agent's cache
        }
    
    Response:
        {
            "success": bool,
            "message": str
        }
    """
    try:
        data = request.get_json() or {}
        agent_id = data.get('agent_id')
        
        clear_graph_cache(agent_id)
        
        if agent_id:
            message = f"Cache cleared for agent {agent_id}"
        else:
            message = "All graph caches cleared"
        
        logger.info(f"[LANGGRAPH CACHE] {message}")
        
        return jsonify({
            'success': True,
            'message': message
        }), 200
        
    except Exception as e:
        logger.error(f"[LANGGRAPH CACHE] Error: {e}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ============================================================================
# DEBUGGING & MONITORING ENDPOINTS
# ============================================================================

@langgraph_bp.route('/langgraph/debug/state', methods=['POST'])
@require_auth
def get_conversation_state_endpoint():
    """
    Get the complete current state of a conversation for debugging.
    
    Request Body:
        {
            "agent_id": str,
            "conversation_id": str
        }
    
    Response:
        {
            "success": bool,
            "state": dict,           # Complete conversation state
            "next_node": list,       # Next nodes to execute
            "metadata": dict,
            "created_at": str,
            "parent_config": dict
        }
    """
    try:
        user_data_auth: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data_auth.get('workspace_id')
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        agent_id = data.get('agent_id')
        conversation_id = data.get('conversation_id')
        
        if not agent_id or not conversation_id:
            return jsonify({'error': 'agent_id and conversation_id are required'}), 400
        
        # Fetch flow agent
        flow_agent = FlowAgent.query.filter_by(
            id=agent_id,
            workspace_id=workspace_id
        ).first()
        
        if not flow_agent:
            return jsonify({'success': False, 'error': 'Agent not found'}), 404
        
        flow_data = flow_agent.flow_data or {}
        flow_nodes = flow_data.get('nodes', [])
        flow_edges = flow_data.get('edges', [])
        
        # Get conversation state
        state = get_conversation_state(agent_id, conversation_id, flow_nodes, flow_edges)
        
        if state:
            return jsonify({
                'success': True,
                **state
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'No state found for this conversation'
            }), 404
        
    except Exception as e:
        logger.error(f"[DEBUG STATE] Error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@langgraph_bp.route('/langgraph/debug/history', methods=['POST'])
@require_auth
def get_checkpoint_history_endpoint():
    """
    Get all checkpoints for a conversation (time-travel debugging).
    
    Request Body:
        {
            "agent_id": str,
            "conversation_id": str
        }
    
    Response:
        {
            "success": bool,
            "total_checkpoints": int,
            "checkpoints": [
                {
                    "checkpoint_id": str,
                    "state": dict,
                    "next_node": list,
                    "metadata": dict,
                    "created_at": str,
                    "parent_config": dict
                },
                ...
            ]
        }
    """
    try:
        user_data_auth: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data_auth.get('workspace_id')
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        agent_id = data.get('agent_id')
        conversation_id = data.get('conversation_id')
        
        if not agent_id or not conversation_id:
            return jsonify({'error': 'agent_id and conversation_id are required'}), 400
        
        # Fetch flow agent
        flow_agent = FlowAgent.query.filter_by(
            id=agent_id,
            workspace_id=workspace_id
        ).first()
        
        if not flow_agent:
            return jsonify({'success': False, 'error': 'Agent not found'}), 404
        
        flow_data = flow_agent.flow_data or {}
        flow_nodes = flow_data.get('nodes', [])
        flow_edges = flow_data.get('edges', [])
        
        # Get checkpoint history
        history = get_checkpoint_history(agent_id, conversation_id, flow_nodes, flow_edges)
        
        return jsonify({
            'success': True,
            'total_checkpoints': len(history),
            'checkpoints': history
        }), 200
        
    except Exception as e:
        logger.error(f"[DEBUG HISTORY] Error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@langgraph_bp.route('/langgraph/debug/replay', methods=['POST'])
@require_auth
def replay_checkpoint_endpoint():
    """
    Restore a conversation to a specific checkpoint (time-travel).
    
    Request Body:
        {
            "agent_id": str,
            "conversation_id": str,
            "checkpoint_id": str
        }
    
    Response:
        {
            "success": bool,
            "state": dict,
            "next_node": list,
            "metadata": dict,
            "message": str
        }
    """
    try:
        user_data_auth: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data_auth.get('workspace_id')
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        agent_id = data.get('agent_id')
        conversation_id = data.get('conversation_id')
        checkpoint_id = data.get('checkpoint_id')
        
        if not agent_id or not conversation_id or not checkpoint_id:
            return jsonify({'error': 'agent_id, conversation_id, and checkpoint_id are required'}), 400
        
        # Fetch flow agent
        flow_agent = FlowAgent.query.filter_by(
            id=agent_id,
            workspace_id=workspace_id
        ).first()
        
        if not flow_agent:
            return jsonify({'success': False, 'error': 'Agent not found'}), 404
        
        flow_data = flow_agent.flow_data or {}
        flow_nodes = flow_data.get('nodes', [])
        flow_edges = flow_data.get('edges', [])
        
        # Replay from checkpoint
        restored_state = replay_from_checkpoint(
            agent_id, conversation_id, checkpoint_id, flow_nodes, flow_edges
        )
        
        if restored_state:
            return jsonify({
                'success': True,
                'message': f'Conversation restored to checkpoint {checkpoint_id}',
                **restored_state
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Checkpoint not found'
            }), 404
        
    except Exception as e:
        logger.error(f"[DEBUG REPLAY] Error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@langgraph_bp.route('/langgraph/debug/visualization', methods=['POST'])
@require_auth
def get_visualization_endpoint():
    """
    Get visual representation of conversation flow with execution path.
    
    Request Body:
        {
            "agent_id": str,
            "conversation_id": str
        }
    
    Response:
        {
            "success": bool,
            "nodes": list,           # All flow nodes
            "edges": list,           # All flow edges
            "execution_path": [      # Nodes that were executed
                {
                    "node_id": str,
                    "timestamp": str,
                    "response": str
                },
                ...
            ],
            "current_node": str,
            "current_state": dict
        }
    """
    try:
        user_data_auth: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data_auth.get('workspace_id')
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        agent_id = data.get('agent_id')
        conversation_id = data.get('conversation_id')
        
        if not agent_id or not conversation_id:
            return jsonify({'error': 'agent_id and conversation_id are required'}), 400
        
        # Fetch flow agent
        flow_agent = FlowAgent.query.filter_by(
            id=agent_id,
            workspace_id=workspace_id
        ).first()
        
        if not flow_agent:
            return jsonify({'success': False, 'error': 'Agent not found'}), 404
        
        flow_data = flow_agent.flow_data or {}
        flow_nodes = flow_data.get('nodes', [])
        flow_edges = flow_data.get('edges', [])
        
        # Get visualization data
        viz = get_conversation_graph_visualization(
            agent_id, conversation_id, flow_nodes, flow_edges
        )
        
        return jsonify({
            'success': True,
            **viz
        }), 200
        
    except Exception as e:
        logger.error(f"[DEBUG VISUALIZATION] Error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@langgraph_bp.route('/langgraph/debug/memory', methods=['POST'])
@require_auth
def get_memory_summary_endpoint():
    """
    Get long-term memory summary for a conversation.
    
    Request Body:
        {
            "agent_id": str,
            "conversation_id": str
        }
    
    Response:
        {
            "success": bool,
            "exists": bool,
            "conversation_id": str,
            "agent_id": str,
            "total_checkpoints": int,
            "total_messages": int,
            "collected_data": dict,
            "message_history": list,
            "current_node": str,
            "is_complete": bool,
            "last_updated": str
        }
    """
    try:
        user_data_auth: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data_auth.get('workspace_id')
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        agent_id = data.get('agent_id')
        conversation_id = data.get('conversation_id')
        
        if not agent_id or not conversation_id:
            return jsonify({'error': 'agent_id and conversation_id are required'}), 400
        
        # Fetch flow agent
        flow_agent = FlowAgent.query.filter_by(
            id=agent_id,
            workspace_id=workspace_id
        ).first()
        
        if not flow_agent:
            return jsonify({'success': False, 'error': 'Agent not found'}), 404
        
        flow_data = flow_agent.flow_data or {}
        flow_nodes = flow_data.get('nodes', [])
        flow_edges = flow_data.get('edges', [])
        
        # Get memory summary
        memory = get_long_term_memory_summary(
            agent_id, conversation_id, flow_nodes, flow_edges
        )
        
        return jsonify({
            'success': True,
            **memory
        }), 200
        
    except Exception as e:
        logger.error(f"[DEBUG MEMORY] Error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500


@langgraph_bp.route('/langgraph/debug/determinism', methods=['POST'])
@require_auth
def check_determinism_endpoint():
    """
    Check if a flow's execution is deterministic.
    
    Request Body:
        {
            "agent_id": str
        }
    
    Response:
        {
            "success": bool,
            "is_deterministic": bool,
            "has_conditional_routing": bool,
            "has_loops": bool,
            "has_random_elements": bool,
            "note": str
        }
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
        
        # Fetch flow agent
        flow_agent = FlowAgent.query.filter_by(
            id=agent_id,
            workspace_id=workspace_id
        ).first()
        
        if not flow_agent:
            return jsonify({'success': False, 'error': 'Agent not found'}), 404
        
        flow_data = flow_agent.flow_data or {}
        flow_nodes = flow_data.get('nodes', [])
        flow_edges = flow_data.get('edges', [])
        
        # Check determinism
        determinism = is_execution_deterministic(agent_id, flow_nodes, flow_edges)
        
        return jsonify({
            'success': True,
            **determinism
        }), 200
        
    except Exception as e:
        logger.error(f"[DEBUG DETERMINISM] Error: {e}", exc_info=True)
        return jsonify({'success': False, 'error': str(e)}), 500
