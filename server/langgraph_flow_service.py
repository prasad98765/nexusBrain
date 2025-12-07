"""
LangGraph Dynamic Flow Service

This module implements a dynamic LangGraph + LangChain pipeline
that reads flow configurations from the database and creates
custom workflows based on user-defined node arrangements.

Architecture:
- Dynamic node creation from database flow data
- Support for multiple node types (interactive, input, AI, button, etc.)
- Flexible flow routing based on user connections
- State-based execution with custom flow logic

Supported Node Types:
1. Interactive/Button Nodes - Message with action buttons
2. Input Nodes - Collect user text input
3. AI/Language Model Nodes - LLM processing
4. API Library Nodes - External API calls
5. Knowledge Base Nodes - RAG retrieval
6. Engine Nodes - Final output generation

=============================================================================
⭐ REFACTOR PLAN (Production Robustness & Scalability) ⭐
=============================================================================

1. VALIDATION & ERROR HANDLING:
   - Add strict validation for flow_nodes, flow_edges, button_action parameters
   - Ensure referenced node IDs exist in flow configuration
   - Validate button_index bounds when button_action provided
   - Return structured error objects with context (workspace_id, agent_id, conversation_id)

2. SCALABLE CACHING & NAMESPACING:
   - Introduce composite cache keys: (workspace_id, agent_id) to prevent tenant leakage
   - Update clear_graph_cache to accept optional agent_id and conversation_id
   - Support selective clearing: all graphs vs specific conversation checkpoints

3. UNIFIED NODE EXECUTION:
   - Extract single run_node() helper containing all node type logic
   - Eliminate duplication between LangGraph executors and execute_node_logic
   - Ensure consistent behavior across execution paths

4. ROBUST ROUTING & DETERMINISM:
   - Implement deterministic routing with per-node router functions
   - Use add_conditional_edges for multi-path nodes based on state
   - Improve is_execution_deterministic to handle button-based branching
   - Avoid non-deterministic 'first edge wins' behavior

5. MEMORY & OBSERVABILITY:
   - Implement get_conversation_state() for full state access
   - Implement get_checkpoint_history() for time-travel debugging
   - Implement replay_from_checkpoint() for state restoration
   - Implement get_long_term_memory_summary() with LLM summarization
   - Implement get_conversation_graph_visualization() for path visualization

6. RESOURCE SAFETY:
   - Clamp AI temperature to safe range (0.0-2.0)
   - Clamp max_tokens to reasonable upper bound (4000)
   - Add MAX_STEPS_PER_CONVERSATION guard for infinite loop prevention

=============================================================================

=============================================================================
⭐ LANGGRAPH MEMORY FEATURES ⭐
=============================================================================

Feature                  Status    Implementation
-----------------------------------------------------------------------------
1. TRANSPARENCY          ✅ Yes    - Full explicit state access via get_conversation_state()
                                   - Complete state inspection at any time
                                   - All data visible and accessible

2. DETERMINISM           ✅ Yes    - Consistent execution paths
                                   - Reproducible results (set AI temp=0)
                                   - Verification via is_execution_deterministic()

3. CHECKPOINTS           ✅ Built-in - MemorySaver for automatic checkpointing
                                     - State persisted after each node
                                     - Manual save/restore capabilities

4. LONG-TERM MEMORY      ✅ Native  - Persistent conversation state
                                    - User data accumulation across sessions
                                    - Message history preservation
                                    - Summary via get_long_term_memory_summary()

5. DEBUGGING             ⭐ Advanced - Time travel: replay_from_checkpoint()
                                     - History: get_checkpoint_history()
                                     - Visualization: get_conversation_graph_visualization()
                                     - Step-by-step execution tracking

6. COMPLEX FLOWS         ⭐ Excellent - Multi-node workflows
                                      - Conditional routing support
                                      - Loop handling
                                      - Graph-based orchestration

=============================================================================
USAGE EXAMPLES
=============================================================================

# 1. Execute a single node with memory
result = execute_single_node(
    node_id="node_1",
    user_input="Hello",
    flow_nodes=nodes,
    flow_edges=edges,
    agent_id="agent_123",
    conversation_id="conv_456"
)

# 2. Get full conversation state (TRANSPARENCY)
state = get_conversation_state(
    agent_id="agent_123",
    conversation_id="conv_456",
    flow_nodes=nodes,
    flow_edges=edges
)

# 3. Time travel debugging (REPLAY)
history = get_checkpoint_history(
    agent_id="agent_123",
    conversation_id="conv_456",
    flow_nodes=nodes,
    flow_edges=edges
)

# 4. Restore to previous checkpoint
restored = replay_from_checkpoint(
    agent_id="agent_123",
    conversation_id="conv_456",
    checkpoint_id="checkpoint_789",
    flow_nodes=nodes,
    flow_edges=edges
)

# 5. Get long-term memory summary
memory = get_long_term_memory_summary(
    agent_id="agent_123",
    conversation_id="conv_456",
    flow_nodes=nodes,
    flow_edges=edges
)

# 6. Visualize execution path
graph_viz = get_conversation_graph_visualization(
    agent_id="agent_123",
    conversation_id="conv_456",
    flow_nodes=nodes,
    flow_edges=edges
)

# 7. Check determinism
determinism = is_execution_deterministic(
    agent_id="agent_123",
    flow_nodes=nodes,
    flow_edges=edges
)

=============================================================================
"""

import os
import logging
import re
import html
import time
from typing import TypedDict, Annotated, Sequence, Optional, Dict, Any, List, Callable
from typing_extensions import TypedDict

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

# LangGraph imports
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

# Variable resolution utility
from .variable_resolver import resolve_variables, VariableResolverOptions

# Database imports for variable label lookup
from .database import db
from .models import VariableMapping

logger = logging.getLogger(__name__)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Resource safety limits
MAX_AI_TEMPERATURE = 2.0
MIN_AI_TEMPERATURE = 0.0
MAX_TOKENS_LIMIT = 4000
DEFAULT_MAX_TOKENS = 300
MAX_STEPS_PER_CONVERSATION = 100  # Prevent infinite loops

# Graph cache to avoid rebuilding on every step
# Now using composite keys: f"{workspace_id}:{agent_id}"
_graph_cache: Dict[str, Any] = {}

# Node executor cache - stores the actual callable functions
# Keyed by composite: f"{workspace_id}:{agent_id}"
_node_executor_cache: Dict[str, Dict[str, Callable]] = {}

# Checkpoint history cache - stores all checkpoints for time-travel debugging
# Keyed by thread_id: f"{workspace_id}:{agent_id}:{conversation_id}"
_checkpoint_history: Dict[str, List[Dict[str, Any]]] = {}

# ============================================================================
# STATE DEFINITION
# ============================================================================

class StepExecutionState(TypedDict):
    """State for step-by-step flow execution using LangGraph."""
    node_id: str  # Current node being executed
    user_input: str  # User's input for this step
    user_data: Dict[str, Any]  # Collected user data across steps
    messages: List[Dict[str, Any]]  # Conversation history
    response: str  # Generated response from current node
    ui_schema: Dict[str, Any]  # UI rendering instructions
    next_node_id: Optional[str]  # Next node to execute
    is_complete: bool  # Whether flow is finished
    workspace_id: Optional[str]  # Workspace identifier
    agent_id: Optional[str]  # Agent identifier
    conversation_id: Optional[str]  # Conversation identifier

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def strip_html_tags(text: str) -> str:
    """
    Remove HTML tags and decode HTML entities from text.
    
    Args:
        text: Text that may contain HTML
        
    Returns:
        Clean text without HTML tags
    """
    if not text:
        return text
    
    # Decode HTML entities (e.g., &nbsp; -> space)
    text = html.unescape(text)
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text


def get_node_label_map(flow_nodes: List[Dict[str, Any]]) -> Dict[str, str]:
    """
    Create a mapping of node IDs to their configured labels/variable names.
    
    Args:
        flow_nodes: List of node configurations
        
    Returns:
        Dictionary mapping node_id to label
    """
    label_map = {}
    for node in flow_nodes:
        node_id = node.get('id')
        node_data = node.get('data', {})
        
        # Try to get a meaningful label
        label = (
            node_data.get('save_response_variable_id') or  # Variable ID if configured
            node_data.get('label') or  # Node label
            node_data.get('placeholder') or  # Input placeholder
            node_id  # Fallback to node ID
        )
        
        label_map[node_id] = label
    
    return label_map


def get_variable_name_from_id(variable_id: str, workspace_id: Optional[str] = None) -> Optional[str]:
    """
    Fetch the variable name (label) from VariableMapping table using variable ID.
    
    Args:
        variable_id: The ID of the variable in the VariableMapping table
        workspace_id: Optional workspace ID for additional filtering
        
    Returns:
        Variable name if found, None otherwise
    """
    if not variable_id:
        return None
    
    try:
        # Query the VariableMapping table
        query = VariableMapping.query.filter_by(id=variable_id)
        
        # Add workspace filter if provided
        if workspace_id:
            query = query.filter_by(workspace_id=workspace_id)
        
        variable = query.first()
        
        if variable:
            logger.info(f"[VARIABLE LOOKUP] Found variable name '{variable.name}' for ID {variable_id}")
            return variable.name
        else:
            logger.warning(f"[VARIABLE LOOKUP] No variable found for ID {variable_id}")
            return None
            
    except Exception as e:
        logger.error(f"[VARIABLE LOOKUP] Error fetching variable name for ID {variable_id}: {e}")
        return None


def get_variable_key_for_node(node_id: str, node_config: Dict[str, Any], workspace_id: Optional[str] = None) -> str:
    """
    Get the variable key to use for storing data from a node.
    Now fetches variable name from database if save_response_variable_id is set.
    Prioritizes: variable_name_from_db > label > node_id
    
    Args:
        node_id: Node identifier
        node_config: Node configuration data
        workspace_id: Workspace identifier for database lookup
        
    Returns:
        Variable key to use for storage
    """
    # Check if save_response_variable_id is configured
    variable_id = node_config.get('save_response_variable_id')
    
    if variable_id:
        # Try to fetch the variable name from the database
        variable_name = get_variable_name_from_id(variable_id, workspace_id)
        if variable_name:
            return variable_name
        else:
            logger.warning(f"[VARIABLE KEY] Could not fetch variable name for ID {variable_id}, falling back to label/node_id")
    
    # Fallback to label or node_id
    return (
        node_config.get('label') or
        node_id
    )


def make_cache_key(workspace_id: Optional[str], agent_id: str) -> str:
    """
    Create a composite cache key to prevent tenant/workspace leakage.
    
    Args:
        workspace_id: Workspace identifier (optional)
        agent_id: Agent identifier
        
    Returns:
        Composite cache key: "workspace_id:agent_id" or just "agent_id" if no workspace
    """
    if workspace_id:
        return f"{workspace_id}:{agent_id}"
    return agent_id


def make_thread_id(workspace_id: Optional[str], agent_id: str, conversation_id: str) -> str:
    """
    Create a composite thread ID for checkpoint persistence.
    
    Args:
        workspace_id: Workspace identifier (optional)
        agent_id: Agent identifier
        conversation_id: Conversation identifier
        
    Returns:
        Composite thread ID: "workspace_id:agent_id:conversation_id"
    """
    if workspace_id:
        return f"{workspace_id}:{agent_id}:{conversation_id}"
    return f"{agent_id}:{conversation_id}"


def validate_flow_config(
    flow_nodes: List[Dict[str, Any]], 
    flow_edges: List[Dict[str, Any]],
    workspace_id: Optional[str] = None,
    agent_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate flow configuration for structural correctness.
    
    Args:
        flow_nodes: List of node configurations
        flow_edges: List of edge connections
        workspace_id: Workspace identifier for logging
        agent_id: Agent identifier for logging
        
    Returns:
        Validation result with 'valid' boolean and 'errors' list
    """
    errors = []
    context = f"workspace_id={workspace_id}, agent_id={agent_id}"
    
    # Check nodes exist and have required fields
    if not flow_nodes:
        errors.append(f"No flow nodes provided [{context}]")
        return {'valid': False, 'errors': errors}
    
    node_ids = set()
    for i, node in enumerate(flow_nodes):
        if not isinstance(node, dict):
            errors.append(f"Node at index {i} is not a dictionary [{context}]")
            continue
            
        node_id = node.get('id')
        if not node_id:
            errors.append(f"Node at index {i} missing 'id' field [{context}]")
        else:
            if node_id in node_ids:
                errors.append(f"Duplicate node ID: {node_id} [{context}]")
            node_ids.add(node_id)
        
        if not node.get('type'):
            errors.append(f"Node {node_id} missing 'type' field [{context}]")
    
    # Validate edges reference existing nodes
    if flow_edges:
        for i, edge in enumerate(flow_edges):
            if not isinstance(edge, dict):
                errors.append(f"Edge at index {i} is not a dictionary [{context}]")
                continue
            
            source = edge.get('source')
            target = edge.get('target')
            
            if not source:
                errors.append(f"Edge at index {i} missing 'source' field [{context}]")
            elif source not in node_ids:
                errors.append(f"Edge references non-existent source node: {source} [{context}]")
            
            if not target:
                errors.append(f"Edge at index {i} missing 'target' field [{context}]")
            elif target not in node_ids:
                errors.append(f"Edge references non-existent target node: {target} [{context}]")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'node_count': len(flow_nodes),
        'edge_count': len(flow_edges) if flow_edges else 0
    }


def validate_button_action(
    button_action: Dict[str, Any],
    node: Dict[str, Any],
    workspace_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    node_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate button action parameters.
    
    Args:
        button_action: Button action dict with button_index, action_type, action_value
        node: Current node configuration
        workspace_id: Workspace identifier for logging
        agent_id: Agent identifier for logging
        node_id: Node identifier for logging
        
    Returns:
        Validation result with 'valid' boolean and 'error' string
    """
    context = f"workspace_id={workspace_id}, agent_id={agent_id}, node_id={node_id}"
    
    if not isinstance(button_action, dict):
        return {'valid': False, 'error': f"button_action must be a dictionary [{context}]"}
    
    action_type = button_action.get('action_type')
    if not action_type:
        return {'valid': False, 'error': f"button_action missing 'action_type' [{context}]"}
    
    # Validate button_index for connect_to_node actions
    if action_type == 'connect_to_node':
        button_index = button_action.get('button_index')
        if button_index is None:
            return {'valid': False, 'error': f"button_action missing 'button_index' for connect_to_node [{context}]"}
        
        # Check if button_index is within bounds
        # For Interactive Message nodes: buttons are in data.buttons
        # For Interactive List nodes: buttons are in data.sections[].buttons (flattened)
        node_data = node.get('data', {})
        node_buttons = node_data.get('buttons', [])
        
        # If no direct buttons, check for sections (Interactive List)
        if not node_buttons:
            sections = node_data.get('sections', [])
            # Flatten all buttons from all sections
            all_buttons = []
            for section in sections[:10]:  # Max 10 sections
                all_buttons.extend(section.get('buttons', [])[:10])  # Max 10 buttons per section
            node_buttons = all_buttons
        
        if not isinstance(button_index, int) or button_index < 0:
            return {'valid': False, 'error': f"button_index must be non-negative integer, got {button_index} [{context}]"}
        
        if button_index >= len(node_buttons):
            return {
                'valid': False, 
                'error': f"button_index {button_index} out of bounds for node with {len(node_buttons)} buttons [{context}]"
            }
    
    return {'valid': True, 'error': None}


def validate_interactive_node(
    node: Dict[str, Any],
    workspace_id: Optional[str] = None,
    agent_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate Interactive Node (Button Node) configuration.
    
    Validation rules:
    - Message content: max 1024 characters (text only, no HTML)
    - Footer text: max 60 characters
    - Media text content: max 20 characters
    - Button title: max 20 characters per button
    - Minimum 1 button required
    - Maximum 3 buttons allowed
    
    Args:
        node: Node configuration
        workspace_id: Workspace identifier for logging
        agent_id: Agent identifier for logging
        
    Returns:
        Validation result with 'valid' boolean and 'errors' list
    """
    import re
    
    errors = []
    context = f"workspace_id={workspace_id}, agent_id={agent_id}"
    node_id = node.get('id', 'unknown')
    node_data = node.get('data', {})
    
    # Helper function to strip HTML tags
    def strip_html_tags(html_text: str) -> str:
        if not html_text:
            return ''
        clean = re.compile('<.*?>')
        return re.sub(clean, '', html_text)
    
    # Validate message content (max 1024 characters, text only)
    message = node_data.get('message', '')
    message_text = strip_html_tags(message)
    if len(message_text) > 1024:
        errors.append(f"Message content exceeds 1024 characters (current: {len(message_text)}) for node {node_id} [{context}]")
    
    # Validate footer text (max 60 characters)
    footer = node_data.get('footer', '')
    if footer and len(footer) > 60:
        errors.append(f"Footer text exceeds 60 characters (current: {len(footer)}) for node {node_id} [{context}]")
    
    # Validate media text content (max 20 characters)
    media = node_data.get('media')
    if media and isinstance(media, dict):
        media_type = media.get('type', '')
        media_text = media.get('text', '')
        
        # If media type is 'text', text content is required
        if media_type == 'text':
            if not media_text or not media_text.strip():
                errors.append(f"Text content is required when media type is 'text' for node {node_id} [{context}]")
            elif len(media_text) > 20:
                errors.append(f"Media text content exceeds 20 characters (current: {len(media_text)}) for node {node_id} [{context}]")
        # For other media types, text is optional but still has character limit
        elif media_text and len(media_text) > 20:
            errors.append(f"Media text content exceeds 20 characters (current: {len(media_text)}) for node {node_id} [{context}]")
    
    # Validate buttons
    buttons = node_data.get('buttons', [])
    if not buttons or len(buttons) < 1:
        errors.append(f"At least 1 button is required for node {node_id} [{context}]")
    elif len(buttons) > 3:
        errors.append(f"Maximum 3 buttons allowed (current: {len(buttons)}) for node {node_id} [{context}]")
    
    # Validate each button title (max 20 characters)
    for idx, button in enumerate(buttons):
        button_label = button.get('label', '')
        if not button_label or not button_label.strip():
            errors.append(f"Button {idx + 1} must have a title for node {node_id} [{context}]")
        elif len(button_label) > 20:
            errors.append(f"Button {idx + 1} title exceeds 20 characters (current: {len(button_label)}) for node {node_id} [{context}]")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


def validate_input_node(
    node: Dict[str, Any],
    workspace_id: Optional[str] = None,
    agent_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate Input Node configuration.
    
    Validation rules:
    - Question text: max 1024 characters (text only, no HTML)
    
    Args:
        node: Node configuration
        workspace_id: Workspace identifier for logging
        agent_id: Agent identifier for logging
        
    Returns:
        Validation result with 'valid' boolean and 'errors' list
    """
    import re
    
    errors = []
    context = f"workspace_id={workspace_id}, agent_id={agent_id}"
    node_id = node.get('id', 'unknown')
    node_data = node.get('data', {})
    
    # Helper function to strip HTML tags
    def strip_html_tags(html_text: str) -> str:
        if not html_text:
            return ''
        clean = re.compile('<.*?>')
        return re.sub(clean, '', html_text)
    
    # Validate question text (max 1024 characters, text only)
    placeholder = node_data.get('placeholder', '')
    question_text = strip_html_tags(placeholder)
    if len(question_text) > 1024:
        errors.append(f"Question text exceeds 1024 characters (current: {len(question_text)}) for node {node_id} [{context}]")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


def clamp_ai_parameters(temperature: float, max_tokens: int) -> tuple[float, int]:
    """
    Clamp AI parameters to safe ranges.
    
    Args:
        temperature: AI temperature parameter
        max_tokens: Maximum tokens to generate
        
    Returns:
        Tuple of (clamped_temperature, clamped_max_tokens)
    """
    clamped_temp = max(MIN_AI_TEMPERATURE, min(MAX_AI_TEMPERATURE, temperature))
    clamped_tokens = max(1, min(MAX_TOKENS_LIMIT, max_tokens))
    
    if clamped_temp != temperature:
        logger.warning(f"[RESOURCE SAFETY] Temperature clamped from {temperature} to {clamped_temp}")
    if clamped_tokens != max_tokens:
        logger.warning(f"[RESOURCE SAFETY] Max tokens clamped from {max_tokens} to {clamped_tokens}")
    
    return clamped_temp, clamped_tokens



def find_next_node_id(current_node_id: str, edges: List[Dict[str, Any]], button_action: Optional[Dict[str, Any]] = None, api_status: Optional[str] = None) -> Optional[str]:
    """
    Find the next node ID based on current node, edges, and optional button action or API status.
    Supports button-specific routing via button index and API Library success/failure routing.
    
    Args:
        current_node_id: Current node ID
        edges: List of edge connections
        button_action: Optional button action info with button_index, action_type, action_value
        api_status: Optional API Library status ('success' or 'failure')
        
    Returns:
        Next node ID or None if at end of flow
    """
    logger.info(f"[ROUTING] Finding next node from {current_node_id} with button_action: {button_action}, api_status: {api_status}")
    logger.info(f"[ROUTING] All edges in flow: {len(edges)} total")
    
    # Log all edges from the current node for debugging
    edges_from_current = [e for e in edges if e.get('source') == current_node_id]
    logger.info(f"[ROUTING] Edges from {current_node_id}: {len(edges_from_current)} edges")
    for edge in edges_from_current:
        logger.info(f"[ROUTING] Edge: {edge.get('id')} -> source={edge.get('source')}, target={edge.get('target')}, sourceHandle={edge.get('sourceHandle')}")
    
    # If API status provided (for API Library nodes)
    if api_status:
        # Look for edge with matching sourceHandle ("success" or "failure")
        logger.info(f"[ROUTING] Looking for edge with sourceHandle: {api_status}")
        logger.info(f"[ROUTING] Total edges from {current_node_id}: {sum(1 for e in edges if e.get('source') == current_node_id)}")
        
        for edge in edges:
            if edge.get('source') == current_node_id:
                source_handle = edge.get('sourceHandle')
                target = edge.get('target')
                logger.info(f"[ROUTING DEBUG] Edge details: source={edge.get('source')}, target={target}, sourceHandle='{source_handle}' (type: {type(source_handle)}), searching for: '{api_status}' (type: {type(api_status)})")
                if source_handle == api_status:
                    logger.info(f"[ROUTING] ✓ Found matching API {api_status} edge: {current_node_id} -> {target}")
                    return target
                else:
                    logger.info(f"[ROUTING] ✗ No match: '{source_handle}' != '{api_status}'")
        
        # For API Library nodes, if no matching status edge found, do NOT fall back
        # This ensures we don't accidentally route to wrong path
        logger.warning(f"[ROUTING] No edge found for API status {api_status}, returning None (no fallback for API Library)")
        return None
    
    # If button action provided and action type is 'connect_to_node'
    if button_action and button_action.get('action_type') == 'connect_to_node':
        button_index = button_action.get('button_index')
        if button_index is not None:
            # Expected sourceHandle format: "button-0", "button-1", etc.
            expected_source_handle = f"button-{button_index}"
            logger.info(f"[ROUTING] Looking for edge with sourceHandle: {expected_source_handle}")
            
            # Look for edge with matching sourceHandle
            for edge in edges:
                if edge.get('source') == current_node_id:
                    source_handle = edge.get('sourceHandle')
                    if source_handle == expected_source_handle:
                        target = edge.get('target')
                        logger.info(f"[ROUTING] Found matching edge: {current_node_id} -> {target} via {source_handle}")
                        return target
            
            logger.warning(f"[ROUTING] No edge found for button index {button_index} (sourceHandle: {expected_source_handle}), falling back to default routing")
        else:
            logger.warning(f"[ROUTING] button_index is None in button_action, falling back to default routing")
    
    # Default routing: find first edge from this node without sourceHandle
    for edge in edges:
        if edge.get('source') == current_node_id:
            # Prefer edges without sourceHandle for default routing
            if not edge.get('sourceHandle'):
                target = edge.get('target')
                logger.info(f"[ROUTING] Using default edge (no sourceHandle): {current_node_id} -> {target}")
                return target
    
    # If no edge without sourceHandle found, use any edge as fallback
    for edge in edges:
        if edge.get('source') == current_node_id:
            target = edge.get('target')
            logger.info(f"[ROUTING] Using fallback edge: {current_node_id} -> {target}")
            return target
    
    logger.info(f"[ROUTING] No next node found from {current_node_id}")
    return None


def find_entry_node(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Optional[str]:
    """
    Find the entry node (node with no incoming edges).
    
    Args:
        nodes: List of node configurations
        edges: List of edge connections
        
    Returns:
        Entry node ID or first node if not found
    """
    # Get all target node IDs (nodes that have incoming edges)
    target_nodes = {edge.get('target') for edge in edges}
    
    # Find nodes that are not targets (no incoming edges)
    for node in nodes:
        node_id = node.get('id')
        if node_id not in target_nodes:
            return node_id
    
    # Fallback: return first node if no entry point found
    return nodes[0].get('id') if nodes else None




# ============================================================================
# SERVER-DRIVEN STEP-BY-STEP EXECUTION
# ============================================================================

def get_conversation_state(
    agent_id: str,
    conversation_id: str,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    workspace_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    ✅ TRANSPARENCY: Get the full current state of a conversation.
    
    Args:
        agent_id: Agent identifier
        conversation_id: Conversation identifier
        flow_nodes: Flow node configurations
        flow_edges: Flow edge configurations
        workspace_id: Workspace identifier
        
    Returns:
        Current conversation state or None if not found
    """
    try:
        cache_key = make_cache_key(workspace_id, agent_id)
        thread_id = make_thread_id(workspace_id, agent_id, conversation_id)
        
        if cache_key not in _graph_cache:
            logger.warning(f"[GET STATE] No cached graph for {cache_key}")
            return {
                'found': False,
                'error': f'No cached graph found for agent {agent_id}'
            }
        
        compiled_graph = _graph_cache[cache_key]
        config = {"configurable": {"thread_id": thread_id}}
        
        checkpoint_state = compiled_graph.get_state(config)
        if checkpoint_state and checkpoint_state.values:
            logger.info(f"[GET STATE] Retrieved state for thread {thread_id}")
            return {
                'found': True,
                'state': checkpoint_state.values,
                'thread_id': thread_id
            }
        else:
            return {
                'found': False,
                'error': f'No state found for conversation {conversation_id}'
            }
    except Exception as e:
        logger.error(f"[GET STATE] Error: {e}", exc_info=True)
        return {'found': False, 'error': str(e)}


def get_checkpoint_history(
    agent_id: str,
    conversation_id: str,
    workspace_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    ✅ DEBUGGING: Get checkpoint history for time-travel debugging.
    
    Args:
        agent_id: Agent identifier
        conversation_id: Conversation identifier
        workspace_id: Workspace identifier
        
    Returns:
        List of checkpoints with timestamps and state snapshots
    """
    try:
        thread_id = make_thread_id(workspace_id, agent_id, conversation_id)
        
        if thread_id not in _checkpoint_history:
            logger.info(f"[CHECKPOINT HISTORY] No history found for {thread_id}")
            return {
                'found': False,
                'checkpoints': [],
                'count': 0
            }
        
        history = _checkpoint_history[thread_id]
        logger.info(f"[CHECKPOINT HISTORY] Retrieved {len(history)} checkpoints for {thread_id}")
        
        return {
            'found': True,
            'checkpoints': history,
            'count': len(history),
            'thread_id': thread_id
        }
    except Exception as e:
        logger.error(f"[CHECKPOINT HISTORY] Error: {e}", exc_info=True)
        return {'found': False, 'error': str(e), 'checkpoints': []}


def replay_from_checkpoint(
    agent_id: str,
    conversation_id: str,
    checkpoint_index: int,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    workspace_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    ✅ TIME-TRAVEL DEBUGGING: Restore state to a specific checkpoint.
    
    Args:
        agent_id: Agent identifier
        conversation_id: Conversation identifier
        checkpoint_index: Index of checkpoint to restore (0-based)
        flow_nodes: Flow node configurations
        flow_edges: Flow edge configurations
        workspace_id: Workspace identifier
        
    Returns:
        Restored state or error
    """
    try:
        cache_key = make_cache_key(workspace_id, agent_id)
        thread_id = make_thread_id(workspace_id, agent_id, conversation_id)
        
        # Get checkpoint history
        if thread_id not in _checkpoint_history:
            return {
                'success': False,
                'error': f'No checkpoint history for conversation {conversation_id}'
            }
        
        history = _checkpoint_history[thread_id]
        if checkpoint_index < 0 or checkpoint_index >= len(history):
            return {
                'success': False,
                'error': f'Invalid checkpoint index {checkpoint_index}. Valid range: 0-{len(history)-1}'
            }
        
        checkpoint = history[checkpoint_index]
        restored_state = checkpoint.get('state_snapshot', {})
        
        # Update the graph state
        if cache_key in _graph_cache:
            compiled_graph = _graph_cache[cache_key]
            config = {"configurable": {"thread_id": thread_id}}
            
            try:
                compiled_graph.update_state(config, restored_state)
                logger.info(f"[REPLAY] Restored checkpoint {checkpoint_index} for {thread_id}")
                
                return {
                    'success': True,
                    'restored_state': restored_state,
                    'checkpoint_index': checkpoint_index,
                    'timestamp': checkpoint.get('timestamp'),
                    'node_id': checkpoint.get('node_id')
                }
            except Exception as update_err:
                logger.error(f"[REPLAY] Failed to update state: {update_err}")
                return {'success': False, 'error': f'Failed to update state: {str(update_err)}'}
        else:
            return {'success': False, 'error': f'No cached graph for agent {agent_id}'}
            
    except Exception as e:
        logger.error(f"[REPLAY] Error: {e}", exc_info=True)
        return {'success': False, 'error': str(e)}


def get_long_term_memory_summary(
    agent_id: str,
    conversation_id: str,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    workspace_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    ✅ LONG-TERM MEMORY: Generate a concise summary of conversation history.
    Uses LLM to create intelligent summary of messages and user_data.
    
    Args:
        agent_id: Agent identifier
        conversation_id: Conversation identifier
        flow_nodes: Flow node configurations
        flow_edges: Flow edge configurations
        workspace_id: Workspace identifier
        
    Returns:
        Summary of conversation or error
    """
    try:
        # Get current state
        state_result = get_conversation_state(agent_id, conversation_id, flow_nodes, flow_edges, workspace_id)
        
        if not state_result.get('found'):
            return {
                'success': False,
                'error': 'No conversation state found',
                'summary': None
            }
        
        state = state_result['state']
        messages = state.get('messages', [])
        user_data = state.get('user_data', {})
        
        # Build summary prompt
        summary_prompt = "Summarize this conversation concisely:\n\n"
        summary_prompt += f"User Data: {user_data}\n\n"
        summary_prompt += f"Messages ({len(messages)} total):\n"
        
        for msg in messages[-10:]:  # Last 10 messages for context
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            summary_prompt += f"{role}: {content}\n"
        
        # Try to use LLM for summary (gracefully degrade if unavailable)
        if OPENROUTER_API_KEY:
            try:
                llm = ChatOpenAI(
                    model="meta-llama/llama-3.3-8b-instruct:free",
                    openai_api_key=OPENROUTER_API_KEY,
                    openai_api_base=OPENROUTER_BASE_URL,
                    temperature=0.3,
                    max_tokens=200
                )
                
                summary_response = llm.invoke([HumanMessage(content=summary_prompt)])
                summary = summary_response.content
                
                logger.info(f"[MEMORY SUMMARY] Generated LLM summary for {conversation_id}")
                
                return {
                    'success': True,
                    'summary': summary,
                    'method': 'llm',
                    'message_count': len(messages),
                    'user_data_keys': list(user_data.keys())
                }
            except Exception as llm_err:
                logger.warning(f"[MEMORY SUMMARY] LLM unavailable: {llm_err}")
        
        # Fallback: simple text summary
        summary = f"Conversation with {len(messages)} messages. "
        if user_data:
            summary += f"Collected data: {', '.join(user_data.keys())}. "
        
        return {
            'success': True,
            'summary': summary,
            'method': 'simple',
            'message_count': len(messages),
            'user_data_keys': list(user_data.keys())
        }
        
    except Exception as e:
        logger.error(f"[MEMORY SUMMARY] Error: {e}", exc_info=True)
        return {'success': False, 'error': str(e), 'summary': None}


def get_conversation_graph_visualization(
    agent_id: str,
    conversation_id: str,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    workspace_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    ✅ VISUALIZATION: Get a machine-readable graph structure with execution path.
    
    Args:
        agent_id: Agent identifier
        conversation_id: Conversation identifier
        flow_nodes: Flow node configurations
        flow_edges: Flow edge configurations
        workspace_id: Workspace identifier
        
    Returns:
        Graph structure with nodes, edges, and execution path
    """
    try:
        thread_id = make_thread_id(workspace_id, agent_id, conversation_id)
        
        # Get execution path from checkpoint history
        execution_path = []
        if thread_id in _checkpoint_history:
            history = _checkpoint_history[thread_id]
            execution_path = [cp.get('node_id') for cp in history if cp.get('node_id')]
        
        # Build simplified graph structure
        graph_nodes = []
        for node in flow_nodes:
            graph_nodes.append({
                'id': node.get('id'),
                'type': node.get('type'),
                'label': node.get('data', {}).get('label', ''),
                'executed': node.get('id') in execution_path
            })
        
        graph_edges = []
        for edge in flow_edges:
            graph_edges.append({
                'source': edge.get('source'),
                'target': edge.get('target'),
                'sourceHandle': edge.get('sourceHandle')
            })
        
        logger.info(f"[GRAPH VIZ] Generated visualization for {thread_id} with {len(execution_path)} executed nodes")
        
        return {
            'success': True,
            'graph': {
                'nodes': graph_nodes,
                'edges': graph_edges,
                'execution_path': execution_path,
                'current_node': execution_path[-1] if execution_path else None
            },
            'stats': {
                'total_nodes': len(graph_nodes),
                'total_edges': len(graph_edges),
                'executed_nodes': len(execution_path)
            }
        }
        
    except Exception as e:
        logger.error(f"[GRAPH VIZ] Error: {e}", exc_info=True)
        return {'success': False, 'error': str(e)}

def get_or_build_graph(
    agent_id: str,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    workspace_id: Optional[str] = None
) -> Any:
    """
    Get cached graph or build new one if not cached.
    Uses composite cache keys to prevent tenant/workspace leakage.
    
    Args:
        agent_id: Agent identifier for caching
        flow_nodes: All nodes in the flow
        flow_edges: All edges in the flow
        workspace_id: Workspace identifier for namespacing
        
    Returns:
        Compiled StateGraph
    """
    cache_key = make_cache_key(workspace_id, agent_id)
    
    if cache_key not in _graph_cache:
        logger.info(f"[GRAPH CACHE] Building new graph for cache_key {cache_key}")
        _graph_cache[cache_key] = build_step_execution_graph(flow_nodes, flow_edges, agent_id, workspace_id)
    else:
        logger.info(f"[GRAPH CACHE] Using cached graph for cache_key {cache_key}")
    
    return _graph_cache[cache_key]


def get_node_executor(
    agent_id: str,
    node_id: str,
    workspace_id: Optional[str] = None
) -> Optional[Callable]:
    """
    Get the node executor function from cache using composite key.
    
    Args:
        agent_id: Agent identifier
        node_id: Node identifier
        workspace_id: Workspace identifier for namespacing
        
    Returns:
        Callable node executor function or None if not found
    """
    cache_key = make_cache_key(workspace_id, agent_id)
    if cache_key in _node_executor_cache:
        return _node_executor_cache[cache_key].get(node_id)
    return None


def clear_graph_cache(
    agent_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
    workspace_id: Optional[str] = None
):
    """
    Clear cached graphs with fine-grained control.
    
    Behaviors:
    - No params: Clear ALL caches (graphs, executors, history)
    - Only agent_id + workspace_id: Clear all caches for that agent in workspace
    - agent_id + conversation_id + workspace_id: Clear only checkpoint history for that conversation
    
    Args:
        agent_id: Optional agent identifier
        conversation_id: Optional conversation identifier
        workspace_id: Optional workspace identifier
    """
    global _graph_cache, _node_executor_cache, _checkpoint_history
    
    if conversation_id and agent_id:
        # Clear only specific conversation checkpoint history
        thread_id = make_thread_id(workspace_id, agent_id, conversation_id)
        if thread_id in _checkpoint_history:
            del _checkpoint_history[thread_id]
            logger.info(f"[GRAPH CACHE] Cleared checkpoint history for thread {thread_id}")
        else:
            logger.info(f"[GRAPH CACHE] No checkpoint history found for thread {thread_id}")
            
    elif agent_id:
        # Clear all caches for specific agent in workspace
        cache_key = make_cache_key(workspace_id, agent_id)
        
        if cache_key in _graph_cache:
            del _graph_cache[cache_key]
            logger.info(f"[GRAPH CACHE] Cleared graph cache for {cache_key}")
            
        if cache_key in _node_executor_cache:
            del _node_executor_cache[cache_key]
            logger.info(f"[GRAPH CACHE] Cleared node executor cache for {cache_key}")
        
        # Clear all checkpoint history for this agent
        # Thread IDs contain agent_id, so we can filter by that
        keys_to_delete = [k for k in _checkpoint_history.keys() if agent_id in k and (not workspace_id or workspace_id in k)]
        for key in keys_to_delete:
            del _checkpoint_history[key]
            logger.info(f"[CHECKPOINT HISTORY] Cleared history for {key}")
            
    else:
        # Clear everything
        _graph_cache = {}
        _node_executor_cache = {}
        _checkpoint_history = {}
        logger.info("[GRAPH CACHE] Cleared all cached graphs, node executors, and checkpoint history")



def is_execution_deterministic(
    agent_id: str,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    ✅ DETERMINISM: Verify that the flow execution is deterministic.
    Now properly handles button-based branching as deterministic when uniquely keyed.
    
    Args:
        agent_id: Agent identifier
        flow_nodes: Flow node configurations
        flow_edges: Flow edge configurations
        
    Returns:
        Determinism analysis with detailed reasoning
    """
    has_button_routing = False
    has_ambiguous_routing = False
    has_loops = False
    has_random_elements = False
    issues = []
    
    # Build edge map grouped by source node
    edges_by_source = {}
    for edge in flow_edges:
        source = edge.get('source')
        if source:
            if source not in edges_by_source:
                edges_by_source[source] = []
            edges_by_source[source].append(edge)
    
    # Check for routing characteristics
    for source, edges in edges_by_source.items():
        if len(edges) > 1:
            # Multiple outgoing edges - check if they're uniquely keyed
            source_handles = [e.get('sourceHandle') for e in edges]
            
            # Count edges with and without sourceHandle
            has_source_handle = [sh for sh in source_handles if sh]
            no_source_handle = [sh for sh in source_handles if not sh]
            
            if has_source_handle:
                has_button_routing = True
                # Check if all sourceHandles are unique
                if len(has_source_handle) != len(set(has_source_handle)):
                    has_ambiguous_routing = True
                    issues.append(f"Node {source} has duplicate sourceHandles")
            
            # If there are multiple edges without sourceHandle, it's ambiguous
            if len(no_source_handle) > 1:
                has_ambiguous_routing = True
                issues.append(f"Node {source} has {len(no_source_handle)} unconditional edges (ambiguous routing)")
    
    # Simple cycle detection
    visited = set()
    for edge in flow_edges:
        target = edge.get('target')
        source = edge.get('source')
        if target in visited and target == source:
            has_loops = True
            issues.append(f"Self-loop detected at node {source}")
        visited.add(source)
    
    # Check for AI nodes with temperature > 0 (non-deterministic)
    for node in flow_nodes:
        if node.get('type') == 'ai':
            temp = node.get('data', {}).get('temperature', 0.7)
            if temp > 0:
                has_random_elements = True
                issues.append(f"AI node {node.get('id')} has temperature={temp} (non-deterministic)")
    
    # Determinism verdict
    # Button routing is considered deterministic if sourceHandles are unique
    is_deterministic = not (has_ambiguous_routing or has_random_elements)
    
    return {
        "is_deterministic": is_deterministic,
        "has_button_routing": has_button_routing,
        "has_ambiguous_routing": has_ambiguous_routing,
        "has_loops": has_loops,
        "has_random_elements": has_random_elements,
        "issues": issues,
        "recommendations": [
            "Set AI node temperature to 0 for deterministic responses" if has_random_elements else None,
            "Ensure all button-based edges have unique sourceHandles" if has_button_routing and has_ambiguous_routing else None,
            "Button-based branching with unique sourceHandles is deterministic" if has_button_routing and not has_ambiguous_routing else None
        ],
        "note": "Button routing is deterministic when edges are uniquely keyed by sourceHandle"
    }

def run_node(
    current_node_id: str,
    current_node_type: str,
    node_config: Dict[str, Any],
    state: StepExecutionState,
    flow_nodes: List[Dict[str, Any]]
) -> StepExecutionState:
    """
    ✅ UNIFIED NODE EXECUTION: Single source of truth for all node type logic.
    Used by both LangGraph node executors and direct execution fallback.
    
    Args:
        current_node_id: Node identifier
        current_node_type: Node type (button/input/ai/engine/etc.)
        node_config: Node configuration from data field
        state: Current execution state
        flow_nodes: All flow nodes (for label mapping)
        
    Returns:
        Updated StepExecutionState after node execution
    """
    user_input = state.get('user_input', '')
    user_data = dict(state.get('user_data', {}))
    messages = list(state.get('messages', []))
    
    # Convert messages to LangChain format
    lc_messages = []
    for msg in messages:
        if msg.get('role') == 'human':
            lc_messages.append(HumanMessage(content=msg.get('content', '')))
        else:
            lc_messages.append(AIMessage(content=msg.get('content', '')))
    
    response = ""
    ui_schema = {}
    
    # Execute based on node type
    if current_node_type in ['button', 'message', 'interactive']:
        message_text = node_config.get('message', 'What would you like to do?')
        buttons = node_config.get('buttons', [])
        media = node_config.get('media')
        footer_text = node_config.get('footer', '')
        # Preserve HTML formatting - do not strip tags
        
        # Resolve variables in the message text
        resolved_message = resolve_variables(
            message_text,
            user_data,
            VariableResolverOptions(
                default_value='',
                case_sensitive=False
            )
        )
        
        # Resolve variables in footer text if it exists
        resolved_footer = None
        if footer_text and footer_text.strip():
            resolved_footer = resolve_variables(
                footer_text,
                user_data,
                VariableResolverOptions(
                    default_value='',
                    case_sensitive=False
                )
            )
        
        # Extract header text from media if it's text type
        header_text = None
        if media and media.get('type') == 'text' and media.get('text'):
            header_text = media.get('text')
            # Resolve variables in header text
            header_text = resolve_variables(
                header_text,
                user_data,
                VariableResolverOptions(
                    default_value='',
                    case_sensitive=False
                )
            )
        
        response = resolved_message
        user_data[f'{current_node_id}_buttons'] = buttons
        
        # Build UI schema
        ui_schema = {
            'type': 'interactive',
            'message': resolved_message,
            'buttons': buttons,
            'media': media,
            'expects_input': len(buttons) > 0
        }
        
        # Add header text if available (from text media type)
        if header_text:
            ui_schema['headerText'] = header_text
        
        # Add footer if available
        if resolved_footer:
            ui_schema['footer'] = resolved_footer
        
        if user_input:
            # Get workspace_id from state for database lookup
            workspace_id = state.get('workspace_id')
            variable_key = get_variable_key_for_node(current_node_id, node_config, workspace_id)
            
            # Store against the variable name
            user_data[variable_key] = user_input
            logger.info(f"[BUTTON NODE] Stored button selection against variable: {variable_key}")
            
            # Only keep the raw action storage if no variable is configured (backward compatibility)
            # Check if a variable was configured by seeing if variable_key is different from node_id
            if variable_key == current_node_id:
                # No variable configured, use fallback storage
                user_data[f'{current_node_id}_action'] = user_input
            
            lc_messages.append(HumanMessage(content=f"Selected: {user_input}"))
        
        lc_messages.append(AIMessage(content=response))
        
    elif current_node_type == 'input':
        label = node_config.get('label', 'Please provide your input')
        input_type = node_config.get('inputType', 'text')
        placeholder = node_config.get('placeholder', 'Enter your response')
        # Preserve HTML formatting - do not strip tags
        
        # Resolve variables in label and placeholder
        resolved_label = resolve_variables(
            label,
            user_data,
            VariableResolverOptions(
                default_value='',
                case_sensitive=False
            )
        )
        
        resolved_placeholder = resolve_variables(
            placeholder,
            user_data,
            VariableResolverOptions(
                default_value='',
                case_sensitive=False
            )
        )
        
        response = resolved_placeholder
        
        ui_schema = {
            'type': 'input',
            'label': resolved_label,
            'inputType': input_type,
            'placeholder': resolved_placeholder,
            'expects_input': True
        }
        
        if user_input:
            # Get workspace_id from state for database lookup
            workspace_id = state.get('workspace_id')
            variable_key = get_variable_key_for_node(current_node_id, node_config, workspace_id)
            user_data[variable_key] = user_input
            lc_messages.append(HumanMessage(content=user_input))
        
        lc_messages.append(AIMessage(content=response))
    
    elif current_node_type == 'simpleMessage':
        # Simple message node - just displays a message with variable support
        message_text = node_config.get('message', '')
        # Preserve HTML formatting - do not strip tags
        
        # Resolve variables in the message using user_data from state
        # Variables are in format #{VariableName}
        resolved_message = resolve_variables(
            message_text,
            user_data,
            VariableResolverOptions(
                default_value='',  # Use empty string for missing variables
                case_sensitive=False  # Case-insensitive matching (#{name} matches Name)
            )
        )
        
        response = resolved_message
        
        ui_schema = {
            'type': 'info',
            'message': resolved_message,
            'expects_input': False
        }
        
        lc_messages.append(AIMessage(content=response))
    
    elif current_node_type == 'interactiveList':
        # Interactive List node - organized button sections with header, context, and footer
        # All text fields support variable resolution
        message_text = node_config.get('message', '')
        header_text = node_config.get('headerText', '')
        footer_text = node_config.get('footer', '')
        button_list_title = node_config.get('buttonListTitle', 'Options')
        sections = node_config.get('sections', [])
        
        # Preserve HTML formatting - do not strip tags
        
        # Resolve variables in header text
        resolved_header = None
        if header_text and header_text.strip():
            resolved_header = resolve_variables(
                header_text,
                user_data,
                VariableResolverOptions(
                    default_value='',
                    case_sensitive=False
                )
            )
        
        # Resolve variables in message (context) text
        resolved_message = resolve_variables(
            message_text,
            user_data,
            VariableResolverOptions(
                default_value='',
                case_sensitive=False
            )
        )
        
        # Resolve variables in footer text
        resolved_footer = None
        if footer_text and footer_text.strip():
            resolved_footer = resolve_variables(
                footer_text,
                user_data,
                VariableResolverOptions(
                    default_value='',
                    case_sensitive=False
                )
            )
        
        response = resolved_message
        user_data[f'{current_node_id}_sections'] = sections
        
        # Build UI schema - only include headerText/footer if they have values
        ui_schema = {
            'type': 'interactiveList',
            'message': resolved_message,
            'buttonListTitle': button_list_title,
            'sections': sections,
            'expects_input': len(sections) > 0 and any(len(s.get('buttons', [])) > 0 for s in sections)
        }
        
        # Only add headerText if it exists and has content
        if resolved_header:
            ui_schema['headerText'] = resolved_header
        
        # Only add footer if it exists and has content  
        if resolved_footer:
            ui_schema['footer'] = resolved_footer
        
        if user_input:
            # Get workspace_id from state for database lookup
            workspace_id = state.get('workspace_id')
            variable_key = get_variable_key_for_node(current_node_id, node_config, workspace_id)
            
            # Store against the variable name
            user_data[variable_key] = user_input
            logger.info(f"[INTERACTIVE LIST NODE] Stored button selection against variable: {variable_key}")
            
            # Backward compatibility fallback
            if variable_key == current_node_id:
                user_data[f'{current_node_id}_action'] = user_input
            
            lc_messages.append(HumanMessage(content=f"Selected: {user_input}"))
        
        lc_messages.append(AIMessage(content=response))
        
    elif current_node_type == 'ai':
        model_name = node_config.get('model', 'meta-llama/llama-3.3-8b-instruct:free')
        system_prompt = node_config.get('systemPrompt', 'You are a helpful AI assistant.')
        temperature = node_config.get('temperature', 0.7)
        max_tokens = node_config.get('maxTokens', DEFAULT_MAX_TOKENS)
        
        # Clamp parameters to safe ranges
        temperature, max_tokens = clamp_ai_parameters(temperature, max_tokens)
        
        ui_schema = {
            'type': 'processing',
            'message': 'Processing your request...',
            'expects_input': False
        }
        
        try:
            if OPENROUTER_API_KEY:
                llm = ChatOpenAI(
                    model=model_name,
                    openai_api_key=OPENROUTER_API_KEY,
                    openai_api_base=OPENROUTER_BASE_URL,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                
                ai_messages = [SystemMessage(content=system_prompt)] + lc_messages
                if user_input:
                    ai_messages.append(HumanMessage(content=user_input))
                
                ai_response = llm.invoke(ai_messages)
                response = ai_response.content
                lc_messages.append(AIMessage(content=response))
            else:
                response = "AI processing: " + (user_input or 'Processing...')
                lc_messages.append(AIMessage(content=response))
        except Exception as e:
            logger.error(f"[AI NODE] Error: {e}")
            response = "I apologize, but I'm having trouble processing your request."
            lc_messages.append(AIMessage(content=response))
    
    elif current_node_type == 'engine':
        label_map = get_node_label_map(flow_nodes)
        collected_data = []
        for key, value in user_data.items():
            # Filter out internal helper keys
            if not key.endswith('_buttons') and not key.endswith('_action') and not key.endswith('_sections'):
                readable_key = label_map.get(key, key)
                collected_data.append(f"{readable_key}: {value}")
        
        if collected_data:
            response = "Processing complete. Data collected: " + ", ".join(collected_data)
        else:
            response = "Thank you for your input. Processing complete."
        
        ui_schema = {
            'type': 'complete',
            'message': response,
            'expects_input': False
        }
        
        lc_messages.append(AIMessage(content=response))
    
    elif current_node_type == 'apiLibrary':
        # API Library node - makes API call
        from server.models import ApiLibrary, ApiLibraryRun, VariableMapping
        from server.database import db
        import requests
        import time
        import json
        import re
        
        # Get workspace_id from state early for use throughout the function
        workspace_id = state.get('workspace_id')
        
        api_library_id = node_config.get('apiLibraryId')
        api_name = node_config.get('apiName', 'API')
        api_method = node_config.get('apiMethod', '')
        
        if not api_library_id:
            # No API configured
            response = f"No API configured for {api_name}"
            ui_schema = {
                'type': 'error',
                'message': response,
                'expects_input': False
            }
            lc_messages.append(AIMessage(content=response))
        else:
            # Fetch API configuration from database
            api_config = ApiLibrary.query.get(api_library_id)
            
            if not api_config:
                response = f"API configuration not found: {api_library_id}"
                ui_schema = {
                    'type': 'error',
                    'message': response,
                    'expects_input': False
                }
                lc_messages.append(AIMessage(content=response))
            else:
                # Resolve variables in prompt instructions
                prompt_instructions = api_config.prompt_instructions or ''
                if prompt_instructions:
                    resolved_instructions = resolve_variables(prompt_instructions, user_data, VariableResolverOptions())
                    logger.info(f"[API LIBRARY] Resolved prompt instructions: {resolved_instructions}")
                
                # Helper function to resolve variables in API config
                def resolve_api_variables(text, user_data_dict):
                    """Replace #{variable_name} with actual values from user_data (case-insensitive)"""
                    if not text or not user_data_dict:
                        return text
                    
                    # Create case-insensitive lookup
                    data_lookup = {k.lower(): k for k in user_data_dict.keys()}
                    
                    pattern = r'#\{([^}]+)\}'
                    def replacer(match):
                        var_name = match.group(1).strip()  # Strip whitespace from variable name
                        # Try case-insensitive lookup
                        actual_key = data_lookup.get(var_name.lower())
                        if actual_key and actual_key in user_data_dict:
                            return str(user_data_dict[actual_key])
                        return match.group(0)  # Keep placeholder if not found
                    return re.sub(pattern, replacer, text)
                
                def process_variable_substitution_nested(data, user_data_dict):
                    """Recursively process data structure and replace variables"""
                    if isinstance(data, dict):
                        return {k: process_variable_substitution_nested(v, user_data_dict) for k, v in data.items()}
                    elif isinstance(data, list):
                        return [process_variable_substitution_nested(item, user_data_dict) for item in data]
                    elif isinstance(data, str):
                        return resolve_api_variables(data, user_data_dict)
                    return data
                
                # Start timing
                start_time = time.time()
                retry_count = 0
                max_retries = api_config.max_retries if api_config.retry_enabled else 1
                
                # Resolve endpoint URL
                endpoint = resolve_api_variables(api_config.endpoint, user_data)
                logger.info(f"[API LIBRARY] Calling endpoint: {endpoint}")
                
                # Resolve headers
                headers = {}
                if api_config.headers:
                    for header in api_config.headers:
                        key = resolve_api_variables(header.get('key', ''), user_data)
                        value = resolve_api_variables(header.get('value', ''), user_data)
                        if key:
                            headers[key] = value
                logger.info(f"[API LIBRARY] Headers: {headers}")
                
                # Resolve body
                body = None
                if api_config.method in ['POST', 'PUT', 'PATCH']:
                    if api_config.body_mode == 'raw' and api_config.body_raw:
                        body_str = resolve_api_variables(api_config.body_raw, user_data)
                        try:
                            body = json.loads(body_str)
                            # Recursively resolve variables in parsed JSON
                            body = process_variable_substitution_nested(body, user_data)
                        except:
                            body = body_str
                    elif api_config.body_mode == 'form' and api_config.body_form:
                        body = {}
                        for field in api_config.body_form:
                            key = resolve_api_variables(field.get('key', ''), user_data)
                            value = resolve_api_variables(field.get('value', ''), user_data)
                            if key:
                                body[key] = value
                logger.info(f"[API LIBRARY] Request body: {body}")
                
                # Execute API call with retry logic
                last_error = None
                response_data = None
                status_code = None
                success = False
                
                for attempt in range(max_retries):
                    try:
                        retry_count = attempt
                        logger.info(f"[API LIBRARY] Attempt {attempt + 1}/{max_retries}")
                        
                        api_response = requests.request(
                            method=api_config.method,
                            url=endpoint,
                            headers=headers,
                            json=body if isinstance(body, dict) else None,
                            data=body if isinstance(body, str) else None,
                            timeout=30
                        )
                        
                        status_code = api_response.status_code
                        logger.info(f"[API LIBRARY] Status code: {status_code}")
                        
                        # Try to parse JSON response, wrap in result key
                        try:
                            response_data = {'result': api_response.json()}
                        except:
                            response_data = {'result': api_response.text}
                        
                        # Success only if status code is exactly 200
                        success = status_code == 200
                        logger.info(f"[API LIBRARY] API success determination: status_code={status_code}, success={success}")
                        
                        # If not successful, capture error details from response
                        if not success:
                            if isinstance(response_data.get('result'), dict):
                                error_msg = response_data['result'].get('error') or response_data['result'].get('message') or api_response.text
                            else:
                                error_msg = response_data.get('result') or api_response.text
                            last_error = f"HTTP {status_code}: {error_msg}"
                            logger.error(f"[API LIBRARY] API returned error: {last_error}")
                        
                        if success:
                            break
                            
                    except Exception as e:
                        last_error = str(e)
                        logger.error(f"[API LIBRARY] Error on attempt {attempt + 1}: {last_error}")
                        if attempt == max_retries - 1:
                            status_code = None
                            response_data = None
                
                duration_ms = int((time.time() - start_time) * 1000)
                logger.info(f"[API LIBRARY] Call completed in {duration_ms}ms")
                
                # Save API call log to database
                try:
                    run = ApiLibraryRun(
                        api_id=api_config.id,
                        workspace_id=workspace_id,
                        status_code=status_code,
                        success=success,
                        request_data={
                            'endpoint': endpoint,
                            'method': api_config.method,
                            'headers': headers,
                            'body': body
                        },
                        response_data=response_data,
                        error_message=last_error if not success else None,
                        duration_ms=duration_ms,
                        retry_count=retry_count
                    )
                    db.session.add(run)
                    db.session.commit()
                    logger.info(f"[API LIBRARY] Logged API call run: {run.id}")
                except Exception as log_error:
                    logger.error(f"[API LIBRARY] Failed to log API run: {log_error}")
                
                # Process response mappings if successful
                if success and response_data and api_config.response_mappings:
                    logger.info(f"[API LIBRARY] Processing {len(api_config.response_mappings)} response mappings")
                    
                    for mapping in api_config.response_mappings:
                        object_path = mapping.get('object_path', '')
                        variable_id = mapping.get('variable_id', '')
                        
                        if not object_path or not variable_id:
                            continue
                        
                        # Extract value from response using object path (e.g., "result.user.name")
                        value = response_data
                        try:
                            for key in object_path.split('.'):
                                if isinstance(value, dict):
                                    value = value.get(key)
                                elif isinstance(value, list) and key.isdigit():
                                    value = value[int(key)]
                                else:
                                    value = None
                                    break
                        except:
                            value = None
                        
                        if value is not None:
                            # Get variable name from database
                            variable = VariableMapping.query.filter_by(
                                id=variable_id,
                                workspace_id=workspace_id
                            ).first()
                            
                            if variable:
                                variable_name = variable.name
                                user_data[variable_name] = value
                                logger.info(f"[API LIBRARY] Mapped {object_path} -> {variable_name}: {value}")
                            else:
                                logger.warning(f"[API LIBRARY] Variable not found: {variable_id}")
                
                # Generate response message
                if success:
                    response = f"✓ API call to {api_name} completed successfully"
                else:
                    response = f"✗ API call to {api_name} failed: {last_error or 'Unknown error'}"
                
                # Store API status in user_data for routing decisions
                user_data[f'{current_node_id}_api_status'] = 'success' if success else 'failure'
                
                logger.info(f"[API LIBRARY] Final status: success={success}, status_code={status_code}, will route to {'success' if success else 'failure'} path")
                
                ui_schema = {
                    'type': 'processing',
                    'message': response,
                    'expects_input': False,
                    'api_status': 'success' if success else 'error',
                    'status_code': status_code,
                    'duration_ms': duration_ms,
                    'api_success': success,  # Add success flag for routing
                    'node_type' : "apiLibrary"
                }

                logger.info(f"[API LIBRARY] Final: {ui_schema}")

                lc_messages.append(AIMessage(content=response))
    
    elif current_node_type == 'knowledgeBase':
        # Knowledge Base node - retrieves information
        selected_docs = node_config.get('selectedDocuments', [])
        doc_count = len(selected_docs)
        
        response = f"Retrieved information from {doc_count} document(s)"
        
        ui_schema = {
            'type': 'processing',
            'message': response,
            'expects_input': False
        }
        
        lc_messages.append(AIMessage(content=response))
    
    elif current_node_type == 'condition':
        # Condition node - evaluates conditions and routes
        response = "Evaluating conditions..."
        
        ui_schema = {
            'type': 'processing',
            'message': response,
            'expects_input': False
        }
        
        lc_messages.append(AIMessage(content=response))
    
    else:
        response = f"Processing through {current_node_type} node..."
        ui_schema = {
            'type': 'info',
            'message': response,
            'expects_input': False
        }
        
        if user_input:
            lc_messages.append(HumanMessage(content=user_input))
        lc_messages.append(AIMessage(content=response))
    
    # Convert messages back to serializable format
    serialized_messages = [
        {'role': 'human' if isinstance(m, HumanMessage) else 'ai', 'content': m.content}
        for m in lc_messages
    ]
    
    # Return updated state
    return {
        **state,
        'node_id': current_node_id,
        'user_data': user_data,
        'messages': serialized_messages,
        'response': response,
        'ui_schema': ui_schema
    }

def build_step_execution_graph(
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    agent_id: Optional[str] = None,
    workspace_id: Optional[str] = None
) -> StateGraph:
    """
    Build a LangGraph StateGraph for step-by-step execution.
    Now uses composite cache keys and unified run_node() function.
    
    Args:
        flow_nodes: All nodes in the flow
        flow_edges: All edges in the flow
        agent_id: Optional agent ID for caching node executors
        workspace_id: Optional workspace ID for namespacing
        
    Returns:
        Compiled StateGraph with MemorySaver checkpoint
    """
    logger.info(f"[GRAPH BUILD] Building StateGraph with {len(flow_nodes)} nodes, {len(flow_edges)} edges for workspace={workspace_id}, agent={agent_id}")
    
    # Create state graph
    graph = StateGraph(StepExecutionState)
    
    # Build node ID to node data mapping for quick lookup
    node_map = {node['id']: node for node in flow_nodes}
    
    # Store node executors for direct access
    node_executors = {}
    
    # Identify reachable nodes (entry point + nodes with incoming edges)
    entry_node_id = find_entry_node(flow_nodes, flow_edges)
    target_nodes = {edge.get('target') for edge in flow_edges if edge.get('target')}
    reachable_nodes = target_nodes.copy()
    if entry_node_id:
        reachable_nodes.add(entry_node_id)
    
    # Add only reachable nodes to the graph
    for node in flow_nodes:
        node_id = node['id']
        node_type = node.get('type')
        
        # Skip unreachable nodes
        if node_id not in reachable_nodes:
            logger.warning(f"[GRAPH BUILD] Skipping unreachable node: {node_id} (type: {node_type})")
            continue
        
        # Create node executor function using unified run_node()
        def create_node_executor(current_node_id: str, current_node_type: str):
            def node_executor(state: StepExecutionState) -> StepExecutionState:
                """Execute a single node using unified run_node() function."""
                logger.info(f"[NODE EXECUTOR] Executing {current_node_id} (type: {current_node_type})")
                
                node_data = node_map[current_node_id]
                node_config = node_data.get('data', {})
                
                # Use unified run_node function
                return run_node(
                    current_node_id=current_node_id,
                    current_node_type=current_node_type,
                    node_config=node_config,
                    state=state,
                    flow_nodes=flow_nodes
                )
            
            return node_executor
        
        # Create and store node executor
        executor = create_node_executor(node_id, node_type)
        node_executors[node_id] = executor
        
        # Add node to graph
        graph.add_node(node_id, executor)
        logger.info(f"[GRAPH BUILD] Added node: {node_id} (type: {node_type})")
    
    # Set entry point (already found earlier)
    if entry_node_id:
        graph.set_entry_point(entry_node_id)
        logger.info(f"[GRAPH BUILD] Set entry point: {entry_node_id}")
    else:
        logger.error("[GRAPH BUILD] No entry node found in flow!")
    
    # Group edges by source node to detect multiple outgoing edges
    # Use a set to avoid duplicate targets
    edges_by_source = {}
    for edge in flow_edges:
        source = edge.get('source')
        target = edge.get('target')
        if source and target:
            if source not in edges_by_source:
                edges_by_source[source] = []
            # Avoid duplicate targets from same source
            if target not in edges_by_source[source]:
                edges_by_source[source].append(target)
    
    # Add edges - use conditional routing for nodes with multiple outgoing edges
    for source, targets in edges_by_source.items():
        if len(targets) == 1:
            # Single outgoing edge - use simple add_edge
            graph.add_edge(source, targets[0])
            logger.info(f"[GRAPH BUILD] Added edge: {source} -> {targets[0]}")
        else:
            # Multiple outgoing edges - use conditional routing
            # Create a routing function that uses the state's next_node_id
            def create_router(possible_targets):
                def route(state: StepExecutionState) -> str:
                    next_node = state.get('next_node_id')
                    if next_node and next_node in possible_targets:
                        logger.info(f"[CONDITIONAL ROUTING] Routing to: {next_node}")
                        return next_node
                    # Fallback to first target if next_node_id not set
                    fallback = possible_targets[0]
                    logger.warning(f"[CONDITIONAL ROUTING] next_node_id not set, using fallback: {fallback}")
                    return fallback
                return route
            
            # Create mapping of target nodes
            target_mapping = {target: target for target in targets}
            
            # Use add_conditional_edges with the routing function
            graph.add_conditional_edges(
                source,
                create_router(targets),
                target_mapping
            )
            logger.info(f"[GRAPH BUILD] Added conditional edges from {source} to {targets}")
    
    # Find terminal nodes (nodes with no outgoing edges) and connect to END
    # Only process reachable nodes that were actually added to the graph
    source_nodes = set(edges_by_source.keys())
    for node in flow_nodes:
        node_id = node.get('id')
        # Skip if node is unreachable (wasn't added to graph)
        if node_id not in reachable_nodes:
            continue
        # Connect terminal nodes to END
        if node_id not in source_nodes:
            graph.add_edge(node_id, END)
            logger.info(f"[GRAPH BUILD] Added terminal edge: {node_id} -> END")
    
    # Compile with MemorySaver for state persistence
    compiled_graph = graph.compile(checkpointer=MemorySaver())
    logger.info("[GRAPH BUILD] Graph compiled with MemorySaver")
    
    # Cache node executors if agent_id provided
    if agent_id:
        cache_key = make_cache_key(workspace_id, agent_id)
        _node_executor_cache[cache_key] = node_executors
        logger.info(f"[GRAPH BUILD] Cached {len(node_executors)} node executors for cache_key {cache_key}")
    
    return compiled_graph

def execute_single_node(
    node_id: str,
    user_input: str,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    user_data: Dict[str, Any] = None,
    messages: List[Dict[str, Any]] = None,
    workspace_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    conversation_id: Optional[str] = None,
    button_action: Optional[Dict[str, Any]] = None,
    current_node_id: Optional[str] = None  # Node where user provided input
) -> Dict[str, Any]:
    """
    Execute a single node using LangGraph WITH memory persistence via MemorySaver.
    Now includes comprehensive validation and error handling.
    
    Args:
        node_id: ID of the node to execute
        user_input: User's input for this step
        flow_nodes: All nodes in the flow
        flow_edges: All edges in the flow
        user_data: Previously collected user data
        messages: Previous conversation messages
        workspace_id: Workspace identifier
        agent_id: Agent identifier
        conversation_id: Conversation identifier (used as thread_id for checkpointing)
        button_action: Optional button action with button_index, action_type, action_value
        current_node_id: Node where user provided the input (for correct variable storage)
        
    Returns:
        Dictionary with:
        - success: bool
        - current_node_id: ID of executed node
        - node_type: Type of executed node
        - next_node_id: ID of next node (or None)
        - state: Updated state data
        - ui_schema: UI rendering instructions
        - response: Generated response
        - is_complete: Whether flow is finished
        - thread_id: Thread identifier for checkpointing
        Or error response if validation fails
    """
    
    context = f"workspace_id={workspace_id}, agent_id={agent_id}, conversation_id={conversation_id}"
    logger.info(f"[STEP EXECUTION] Executing node: {node_id} [{context}]")
    
    try:
        # 1. Validate flow configuration
        validation = validate_flow_config(flow_nodes, flow_edges, workspace_id, agent_id)
        if not validation['valid']:
            logger.error(f"[STEP EXECUTION] Flow validation failed: {validation['errors']} [{context}]")
            return {
                'success': False,
                'error': 'Invalid flow configuration',
                'validation_errors': validation['errors'],
                'response': 'The flow configuration is invalid. Please check the flow setup.'
            }
        # Find the current node
        current_node = None
        for node in flow_nodes:
            if node.get('id') == node_id:
                current_node = node
                break
        
        if not current_node:
            logger.error(f"[STEP EXECUTION] Node {node_id} not found in flow [{context}]")
            return {
                'success': False,
                'error': 'Node not found',
                'response': f'Node {node_id} not found in flow [{context}]'
            }
        
        # 2. Validate Interactive Node if it's a button/interactive type
        if current_node.get('type') in ['button', 'message', 'interactive']:
            node_validation = validate_interactive_node(current_node, workspace_id, agent_id)
            if not node_validation['valid']:
                logger.error(f"[STEP EXECUTION] Interactive node validation failed: {node_validation['errors']} [{context}]")
                return {
                    'success': False,
                    'error': 'Invalid interactive node configuration',
                    'validation_errors': node_validation['errors'],
                    'response': 'The interactive node configuration is invalid. Please check button count, character limits, and content length.'
                }
        
        # 2b. Validate Input Node if it's an input type
        if current_node.get('type') == 'input':
            node_validation = validate_input_node(current_node, workspace_id, agent_id)
            if not node_validation['valid']:
                logger.error(f"[STEP EXECUTION] Input node validation failed: {node_validation['errors']} [{context}]")
                return {
                    'success': False,
                    'error': 'Invalid input node configuration',
                    'validation_errors': node_validation['errors'],
                    'response': 'The input node configuration is invalid. Please check question text length.'
                }
        
        # 3. Validate button_action if provided
        if button_action:
            logger.info(f"[STEP EXECUTION] Button action received: {button_action} [{context}]")
            button_validation = validate_button_action(button_action, current_node, workspace_id, agent_id, node_id)
            if not button_validation['valid']:
                logger.error(f"[STEP EXECUTION] Button action validation failed: {button_validation['error']} [{context}]")
                return {
                    'success': False,
                    'error': 'Invalid button action',
                    'validation_error': button_validation['error'],
                    'response': 'The button action is invalid. Please try again.'
                }
        
        # Get or build the StateGraph (cached per agent with MemorySaver)
        if not agent_id:
            compiled_graph = build_step_execution_graph(flow_nodes, flow_edges, agent_id=None, workspace_id=workspace_id)
            logger.info(f"[STEP EXECUTION] Using non-cached graph without agent_id [{context}]")
        else:
            compiled_graph = get_or_build_graph(agent_id, flow_nodes, flow_edges, workspace_id)
        
        # Create composite thread_id for this conversation
        thread_id = make_thread_id(workspace_id, agent_id, conversation_id or "default")
        logger.info(f"[STEP EXECUTION] Using thread_id: {thread_id} [{context}]")
        
        # Prepare config with thread_id for checkpointing
        config = {
            "configurable": {
                "thread_id": thread_id
            }
        }
        
        # Prepare state for this single node execution
        # IMPORTANT: Set next_node_id BEFORE execution for conditional edge routing
        initial_state: StepExecutionState = {
            'node_id': node_id,
            'user_input': user_input or '',
            'user_data': user_data or {},
            'messages': messages or [],
            'response': '',
            'ui_schema': {},
            'next_node_id': None,
            'is_complete': False,
            'workspace_id': workspace_id,
            'agent_id': agent_id,
            'conversation_id': conversation_id
        }
        
        # Pre-determine next node for conditional edge routing
        if button_action:
            initial_state['next_node_id'] = find_next_node_id(node_id, flow_edges, button_action)
        else:
            initial_state['next_node_id'] = find_next_node_id(node_id, flow_edges)
        
        logger.info(f"[STEP EXECUTION] Pre-determined next_node_id: {initial_state['next_node_id']}")
        
        # Try to get cached state from MemorySaver checkpoint
        try:
            # Get the current state from checkpoint (if exists)
            checkpoint_state = compiled_graph.get_state(config)
            if checkpoint_state and checkpoint_state.values:
                logger.info(f"[MEMORY CACHE] Found cached state for thread_id: {thread_id}")
                # Merge cached state with new input
                cached_user_data = checkpoint_state.values.get('user_data', {})
                cached_messages = checkpoint_state.values.get('messages', [])
                
                # Preserve cached data and messages
                initial_state['user_data'] = {**cached_user_data, **(user_data or {})}
                initial_state['messages'] = cached_messages if not messages else messages
                
                logger.info(f"[MEMORY CACHE] Restored {len(cached_messages)} messages and {len(cached_user_data)} user data entries")
            else:
                logger.info(f"[MEMORY CACHE] No cached state found for thread_id: {thread_id}, starting fresh")
        except Exception as cache_err:
            logger.warning(f"[MEMORY CACHE] Could not retrieve cached state: {cache_err}")
        
        # IMPORTANT: If user_input is provided and current_node_id is different from node_id,
        # we need to store the input against the current_node_id's variable BEFORE executing node_id
        if user_input and current_node_id and current_node_id != node_id:
            logger.info(f"[INPUT STORAGE] User provided input at node {current_node_id}, storing before executing {node_id}")
            
            # Find the current node configuration
            input_source_node = None
            for node in flow_nodes:
                if node.get('id') == current_node_id:
                    input_source_node = node
                    break
            
            if input_source_node:
                input_source_config = input_source_node.get('data', {})
                variable_key = get_variable_key_for_node(current_node_id, input_source_config, workspace_id)
                
                # Store the input against the current node's variable
                initial_state['user_data'][variable_key] = user_input
                logger.info(f"[INPUT STORAGE] Stored user input '{user_input}' against variable '{variable_key}' from node {current_node_id}")
                
                # Only keep the raw action storage if no variable is configured (backward compatibility)
                if variable_key == current_node_id:
                    initial_state['user_data'][f'{current_node_id}_action'] = user_input
                
                # Clear user_input so next node doesn't store it again
                initial_state['user_input'] = ''
                logger.info(f"[INPUT STORAGE] Cleared user_input from state to prevent duplicate storage in next node")
            else:
                logger.warning(f"[INPUT STORAGE] Current node {current_node_id} not found in flow, cannot store input")
        
        # Execute ONLY the single node using the node executor from cache
        # This prevents automatic graph traversal through all connected nodes
        logger.info(f"[STEP EXECUTION] Executing single node {node_id} with thread_id: {thread_id}")
        
        # Get the node executor function from cache
        node_executor = get_node_executor(agent_id, node_id, workspace_id)
        
        if node_executor and callable(node_executor):
            # Execute the single node function with state
            logger.info(f"[STEP EXECUTION] Using cached node executor for {node_id} [{context}]")
            result = node_executor(initial_state)
        else:
            # Fallback: use unified run_node function
            logger.warning(f"[STEP EXECUTION] Node executor not found for {node_id}, using run_node() [{context}]")
            result = run_node(
                current_node_id=node_id,
                current_node_type=current_node.get('type'),
                node_config=current_node.get('data', {}),
                state=initial_state,
                flow_nodes=flow_nodes
            )
        
        # Manually save the state to the checkpoint after single node execution
        try:
            # Update the checkpoint with the new state
            compiled_graph.update_state(config, result)
            logger.info(f"[MEMORY CACHE] State manually saved to checkpoint for thread_id: {thread_id}")
            
            # Track checkpoint in history for time-travel debugging
            if thread_id not in _checkpoint_history:
                _checkpoint_history[thread_id] = []
            
            _checkpoint_history[thread_id].append({
                "timestamp": time.time(),
                "node_id": node_id,
                "state_snapshot": {
                    "user_data": result.get('user_data', {}),
                    "messages": result.get('messages', []),
                    "response": result.get('response', '')
                }
            })
            logger.info(f"[CHECKPOINT HISTORY] Saved checkpoint #{len(_checkpoint_history[thread_id])} for thread {thread_id}")
            
        except Exception as save_err:
            logger.warning(f"[MEMORY CACHE] Could not save state to checkpoint: {save_err}")
        
        logger.info(f"[STEP EXECUTION] Node {node_id} execution complete")
        
        # Find next node based on button action (if provided)
        if button_action and button_action.get('action_type') == 'connect_to_node':
            logger.info(f"[BUTTON ROUTING] Button 'connect_to_node' clicked, finding connected node")
            # Find the connected node from edge
            next_node_id = find_next_node_id(node_id, flow_edges, button_action)
            
            if next_node_id:
                logger.info(f"[BUTTON ROUTING] Found connected node: {next_node_id}, executing it now")
                # Find the next node
                next_node = None
                for node in flow_nodes:
                    if node.get('id') == next_node_id:
                        next_node = node
                        break
                
                if next_node:
                    # Execute the connected node and get its config
                    logger.info(f"[BUTTON ROUTING] Executing connected node {next_node_id} [{context}]")
                    next_node_executor = get_node_executor(agent_id, next_node_id, workspace_id)
                    
                    # Prepare state for next node execution
                    next_state: StepExecutionState = {
                        'node_id': next_node_id,
                        'user_input': '',
                        'user_data': result.get('user_data', {}),
                        'messages': result.get('messages', []),
                        'response': '',
                        'ui_schema': {},
                        'next_node_id': None,
                        'is_complete': False,
                        'workspace_id': workspace_id,
                        'agent_id': agent_id,
                        'conversation_id': conversation_id
                    }
                    
                    if next_node_executor and callable(next_node_executor):
                        next_result = next_node_executor(next_state)
                    else:
                        next_result = run_node(
                            current_node_id=next_node_id,
                            current_node_type=next_node.get('type'),
                            node_config=next_node.get('data', {}),
                            state=next_state,
                            flow_nodes=flow_nodes
                        )
                    
                    # Save state after executing connected node
                    try:
                        compiled_graph.update_state(config, next_result)
                        logger.info(f"[MEMORY CACHE] State saved after executing connected node {next_node_id}")
                    except Exception as save_err:
                        logger.warning(f"[MEMORY CACHE] Could not save state: {save_err}")
                    
                    # Find next node after the connected node
                    # IMPORTANT: Check if connected node is API Library and extract api_status
                    if next_node.get('type') == 'apiLibrary':
                        api_success = next_result.get('ui_schema', {}).get('api_success')
                        if api_success is not None:
                            api_status = 'success' if api_success else 'failure'
                            logger.info(f"[BUTTON ROUTING] Connected API Library node result: api_success={api_success} -> routing to '{api_status}' path")
                            final_next_node_id = find_next_node_id(next_node_id, flow_edges, api_status=api_status)
                        else:
                            logger.warning(f"[BUTTON ROUTING] API Library node has no api_success in ui_schema, using default routing")
                            final_next_node_id = find_next_node_id(next_node_id, flow_edges)
                    else:
                        final_next_node_id = find_next_node_id(next_node_id, flow_edges)
                    
                    next_node_type = next_node.get('type')
                    is_complete = final_next_node_id is None or next_node_type == 'engine'
                    
                    logger.info(f"[BUTTON ROUTING] Connected node executed. Current: {next_node_id}, Next: {final_next_node_id}, Complete: {is_complete}")
                    
                    # Return the connected node's config
                    return {
                        'success': True,
                        'current_node_id': next_node_id,
                        'node_type': next_node.get('type'),  # Add node type for client-side styling
                        'current_node': {
                            'id': next_node.get('id'),
                            'type': next_node.get('type'),
                            'label': next_node.get('data', {}).get('label', '')
                        },
                        'next_node_id': final_next_node_id,
                        'state': {
                            'user_data': next_result.get('user_data', {}),
                            'messages': next_result.get('messages', []),
                            'workspace_id': workspace_id,
                            'agent_id': agent_id,
                            'conversation_id': conversation_id
                        },
                        'ui_schema': next_result.get('ui_schema', {}),
                        'response': next_result.get('response', ''),
                        'is_complete': is_complete,
                        'thread_id': thread_id
                    }
                else:
                    logger.warning(f"[BUTTON ROUTING] Connected node {next_node_id} not found in flow")
            else:
                logger.warning(f"[BUTTON ROUTING] No edge found for button action, using default routing")
        
        # For non-connect_to_node actions or if connect failed, use default routing
        # Check if current node is API Library node and route based on success/failure
        # logger.info("[DEBUG] current_node: %s", current_node)
        # logger.info("[DEBUG] === ALL EDGES IN THIS FLOW ===")
        # for idx, edge in enumerate(flow_edges):
        #     logger.info(f"[DEBUG] Edge #{idx}: id={edge.get('id')}, source={edge.get('source')}, target={edge.get('target')}, sourceHandle='{edge.get('sourceHandle')}'")
        # logger.info("[DEBUG] === END EDGES ===")
        
        node_type = current_node.get('type')
        logger.info(f"[ROUTING CHECK] Node type: '{node_type}', result ui_schema: {result.get('ui_schema', {})}")
        logger.info(f"[ROUTING CHECK] Is API Library node? {node_type == 'apiLibrary'}")
        
        # if node_type == 'apiLibrary':
        #     # Get API status from ui_schema
        #     api_success = result.get('ui_schema', {}).get('api_success')
        #     logger.info(f"[API LIBRARY ROUTING] Extracted api_success: {api_success} (type: {type(api_success)})")
        #     logger.info(f"[API LIBRARY ROUTING] ui_schema content: {result.get('ui_schema', {})}")
        #     logger.info(f"[API LIBRARY ROUTING] Full result keys: {list(result.keys())}")
            
        #     if api_success is not None:
        #         api_status = 'success' if api_success else 'failure'
        #         logger.info(f"[API LIBRARY ROUTING] API call result: api_success={api_success} -> routing to '{api_status}' path")
        #         logger.info(f"[API LIBRARY ROUTING] About to call find_next_node_id with node_id={node_id}, api_status={api_status}")
        #         next_node_id = find_next_node_id(node_id, flow_edges, api_status=api_status)
        #         logger.info(f"[API LIBRARY ROUTING] find_next_node_id returned: {next_node_id}")
        #         logger.info(f"[API LIBRARY ROUTING] Will {'' if next_node_id else 'NOT '}execute next node")
                
        #         # Auto-execute the next node after API Library
        #         if next_node_id:
        #             logger.info(f"[API LIBRARY ROUTING] Found {api_status} path to node: {next_node_id}, executing it now")
        #             # Find the next node
        #             next_node = None
        #             for node in flow_nodes:
        #                 if node.get('id') == next_node_id:
        #                     next_node = node
        #                     break
                    
        #             if next_node:
        #                 # Execute the connected node
        #                 logger.info(f"[API LIBRARY ROUTING] Executing {api_status} path node {next_node_id} [{context}]")
        #                 next_node_executor = get_node_executor(agent_id, next_node_id, workspace_id)
                        
        #                 # Prepare state for next node execution
        #                 next_state: StepExecutionState = {
        #                     'node_id': next_node_id,
        #                     'user_input': '',
        #                     'user_data': result.get('user_data', {}),
        #                     'messages': result.get('messages', []),
        #                     'response': '',
        #                     'ui_schema': {},
        #                     'next_node_id': None,
        #                     'is_complete': False,
        #                     'workspace_id': workspace_id,
        #                     'agent_id': agent_id,
        #                     'conversation_id': conversation_id
        #                 }
                        
        #                 if next_node_executor and callable(next_node_executor):
        #                     next_result = next_node_executor(next_state)
        #                 else:
        #                     next_result = run_node(
        #                         current_node_id=next_node_id,
        #                         current_node_type=next_node.get('type'),
        #                         node_config=next_node.get('data', {}),
        #                         state=next_state,
        #                         flow_nodes=flow_nodes
        #                     )
                        
        #                 # Save state after executing connected node
        #                 try:
        #                     compiled_graph.update_state(config, next_result)
        #                     logger.info(f"[MEMORY CACHE] State saved after executing API {api_status} path node {next_node_id}")
        #                 except Exception as save_err:
        #                     logger.warning(f"[MEMORY CACHE] Could not save state: {save_err}")
                        
        #                 # Find next node after the connected node
        #                 final_next_node_id = find_next_node_id(next_node_id, flow_edges)
        #                 next_node_type = next_node.get('type')
        #                 is_complete = final_next_node_id is None or next_node_type == 'engine'
                        
        #                 logger.info(f"[API LIBRARY ROUTING] Connected node executed. Current: {next_node_id}, Next: {final_next_node_id}, Complete: {is_complete}")
                        
        #                 # Return the connected node's result
        #                 return {
        #                     'success': True,
        #                     'current_node_id': next_node_id,
        #                     'node_type': next_node.get('type'),
        #                     'current_node': {
        #                         'id': next_node.get('id'),
        #                         'type': next_node.get('type'),
        #                         'label': next_node.get('data', {}).get('label', '')
        #                     },
        #                     'next_node_id': final_next_node_id,
        #                     'state': {
        #                         'user_data': next_result.get('user_data', {}),
        #                         'messages': next_result.get('messages', []),
        #                         'workspace_id': workspace_id,
        #                         'agent_id': agent_id,
        #                         'conversation_id': conversation_id
        #                     },
        #                     'ui_schema': next_result.get('ui_schema', {}),
        #                     'response': next_result.get('response', ''),
        #                     'is_complete': is_complete,
        #                     'thread_id': thread_id
        #                 }
        #             else:
        #                 logger.warning(f"[API LIBRARY ROUTING] Connected node {next_node_id} not found in flow")
        #         else:
        #             # No edge found for the API status - flow should stop here
        #             logger.warning(f"[API LIBRARY ROUTING] No edge found for API {api_status}, flow will end")
        #             # Return immediately without executing any more nodes
        #             return {
        #                 'success': True,
        #                 'current_node_id': node_id,
        #                 'node_type': current_node.get('type'),
        #                 'current_node': {
        #                     'id': current_node.get('id'),
        #                     'type': current_node.get('type'),
        #                     'label': current_node.get('data', {}).get('label', '')
        #                 },
        #                 'next_node_id': None,  # No next node - flow ends
        #                 'state': {
        #                     'user_data': result.get('user_data', {}),
        #                     'messages': result.get('messages', []),
        #                     'workspace_id': workspace_id,
        #                     'agent_id': agent_id,
        #                     'conversation_id': conversation_id
        #                 },
        #                 'ui_schema': result.get('ui_schema', {}),
        #                 'response': result.get('response', ''),
        #                 'is_complete': True,  # Mark as complete since no path exists
        #                 'thread_id': thread_id
        #             }
        #     else:
        #         logger.warning(f"[API LIBRARY ROUTING] api_success not found in ui_schema, flow will end")
        #         # If api_success is not set, something is wrong - end the flow
        #         return {
        #             'success': True,
        #             'current_node_id': node_id,
        #             'node_type': current_node.get('type'),
        #             'current_node': {
        #                 'id': current_node.get('id'),
        #                 'type': current_node.get('type'),
        #                 'label': current_node.get('data', {}).get('label', '')
        #             },
        #             'next_node_id': None,
        #             'state': {
        #                 'user_data': result.get('user_data', {}),
        #                 'messages': result.get('messages', []),
        #                 'workspace_id': workspace_id,
        #                 'agent_id': agent_id,
        #                 'conversation_id': conversation_id
        #             },
        #             'ui_schema': result.get('ui_schema', {}),
        #             'response': result.get('response', ''),
        #             'is_complete': True,
        #             'thread_id': thread_id
        #         }
        
        # Default routing for non-API Library nodes or fallback
        logger.info(f"[DEFAULT ROUTING] Reached default routing section. node_type='{node_type}'. This should NOT happen for apiLibrary nodes!")
        
        # SAFEGUARD: If this is somehow an API Library node, extract api_status
        logger.info("result.get('ui_schema')",result.get('ui_schema'))
        api_status_param = None
        if node_type == 'apiLibrary':
            logger.error(f"[DEFAULT ROUTING ERROR] API Library node fell through to default routing! Attempting to extract api_status...")
            api_success = result.get('ui_schema', {}).get('api_success')
            if api_success is not None:
                api_status_param = 'success' if api_success else 'failure'
                logger.error(f"[DEFAULT ROUTING ERROR] Extracted api_status: {api_status_param}")
        if button_action:
            next_node_id = find_next_node_id(node_id, flow_edges, button_action)
        elif result.get('ui_schema').get('node_type') == "apiLibrary":
            # Use API status if this is an API Library node that fell through
            logger.error(f"[DEFAULT ROUTING ERROR] Using api_status={api_status_param} for routing")
            next_node_id = find_next_node_id(node_id, flow_edges, api_status=api_status_param)
        else:
            next_node_id = find_next_node_id(node_id, flow_edges)
        
        # Check if flow is complete
        node_type = current_node.get('type')
        is_complete = next_node_id is None or node_type == 'engine'
        
        logger.info(f"[STEP EXECUTION] Node {node_id} executed. Next: {next_node_id}, Complete: {is_complete}")
        
        return {
            'success': True,
            'current_node_id': node_id,
            'node_type': current_node.get('type'),  # Add node type for client-side styling
            'current_node': {
                'id': current_node.get('id'),
                'type': current_node.get('type'),
                'label': current_node.get('data', {}).get('label', '')
            },
            'next_node_id': next_node_id,
            'state': {
                'user_data': result.get('user_data', {}),
                'messages': result.get('messages', []),
                'workspace_id': workspace_id,
                'agent_id': agent_id,
                'conversation_id': conversation_id
            },
            'ui_schema': result.get('ui_schema', {}),
            'response': result.get('response', ''),
            'is_complete': is_complete,
            'thread_id': thread_id  # Return thread_id for client to use in next request
            
        }
        
    except Exception as e:
        logger.error(f"[STEP EXECUTION] Error: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'response': f"Error executing node: {str(e)}"
        }


def execute_node_logic(
    node_id: str,
    current_node: Dict[str, Any],
    user_input: str,
    user_data: Dict[str, Any],
    messages: List[Dict[str, Any]],
    flow_nodes: List[Dict[str, Any]]
) -> StepExecutionState:
    """
    DEPRECATED: Use run_node() instead.
    This function is kept for backward compatibility and delegates to run_node().
    
    Args:
        node_id: Node identifier
        current_node: Node configuration
        user_input: User's input
        user_data: Collected data
        messages: Message history
        flow_nodes: All flow nodes (for label mapping)
        
    Returns:
        Updated state after node execution
    """
    logger.warning(f"[DEPRECATED] execute_node_logic() called for {node_id}. Use run_node() instead.")
    
    # Build state from parameters
    state: StepExecutionState = {
        'node_id': node_id,
        'user_input': user_input,
        'user_data': user_data,
        'messages': messages,
        'response': '',
        'ui_schema': {},
        'next_node_id': None,
        'is_complete': False,
        'workspace_id': None,
        'agent_id': None,
        'conversation_id': None
    }
    
    # Delegate to unified run_node function
    return run_node(
        current_node_id=node_id,
        current_node_type=current_node.get('type'),
        node_config=current_node.get('data', {}),
        state=state,
        flow_nodes=flow_nodes
    )

if __name__ == "__main__":
    # Run tests
    pass
    # test_interactive_flow()
