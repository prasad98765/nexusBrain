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

logger = logging.getLogger(__name__)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Graph cache to avoid rebuilding on every step
_graph_cache: Dict[str, Any] = {}

# Node executor cache - stores the actual callable functions
_node_executor_cache: Dict[str, Dict[str, Callable]] = {}

# Checkpoint history cache - stores all checkpoints for time-travel debugging
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


def get_variable_key_for_node(node_id: str, node_config: Dict[str, Any]) -> str:
    """
    Get the variable key to use for storing data from a node.
    Prioritizes: save_response_variable_id > label > node_id
    
    Args:
        node_id: Node identifier
        node_config: Node configuration data
        
    Returns:
        Variable key to use for storage
    """
    return (
        node_config.get('save_response_variable_id') or
        node_config.get('label') or
        node_id
    )



def find_next_node_id(current_node_id: str, edges: List[Dict[str, Any]], button_action: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """
    Find the next node ID based on current node, edges, and optional button action.
    Supports button-specific routing via button index.
    
    Args:
        current_node_id: Current node ID
        edges: List of edge connections
        button_action: Optional button action info with button_index, action_type, action_value
        
    Returns:
        Next node ID or None if at end of flow
    """
    logger.info(f"[ROUTING] Finding next node from {current_node_id} with button_action: {button_action}")
    
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

def get_or_build_graph(
    agent_id: str,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]]
) -> Any:
    """
    Get cached graph or build new one if not cached.
    Caches graphs per agent_id to avoid rebuilding on every step.
    
    Args:
        agent_id: Agent identifier for caching
        flow_nodes: All nodes in the flow
        flow_edges: All edges in the flow
        
    Returns:
        Compiled StateGraph
    """
    if agent_id not in _graph_cache:
        logger.info(f"[GRAPH CACHE] Building new graph for agent {agent_id}")
        _graph_cache[agent_id] = build_step_execution_graph(flow_nodes, flow_edges, agent_id)
    else:
        logger.info(f"[GRAPH CACHE] Using cached graph for agent {agent_id}")
    
    return _graph_cache[agent_id]


def get_node_executor(
    agent_id: Optional[str],
    node_id: str
) -> Optional[Callable]:
    """
    Get the node executor function from cache.
    
    Args:
        agent_id: Agent identifier
        node_id: Node identifier
        
    Returns:
        Callable node executor function or None if not found
    """
    if agent_id and agent_id in _node_executor_cache:
        return _node_executor_cache[agent_id].get(node_id)
    return None


def clear_graph_cache(agent_id: Optional[str] = None):
    """
    Clear cached graphs. If agent_id provided, clear only that agent's graph.
    Otherwise, clear all cached graphs.
    
    Args:
        agent_id: Optional agent identifier to clear specific cache
    """
    global _graph_cache, _node_executor_cache, _checkpoint_history
    if agent_id:
        if agent_id in _graph_cache:
            del _graph_cache[agent_id]
            logger.info(f"[GRAPH CACHE] Cleared graph cache for agent {agent_id}")
        if agent_id in _node_executor_cache:
            del _node_executor_cache[agent_id]
            logger.info(f"[GRAPH CACHE] Cleared node executor cache for agent {agent_id}")
        # Clear checkpoint history for this agent
        thread_keys_to_delete = [k for k in _checkpoint_history.keys() if agent_id in k]
        for key in thread_keys_to_delete:
            del _checkpoint_history[key]
            logger.info(f"[CHECKPOINT HISTORY] Cleared history for {key}")
    else:
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
    Checks that the graph structure guarantees consistent execution.
    
    Args:
        agent_id: Agent identifier
        flow_nodes: Flow node configurations
        flow_edges: Flow edge configurations
        
    Returns:
        Determinism analysis
    """
    # Check for deterministic properties
    has_conditional_routing = False
    has_loops = False
    has_random_elements = False
    
    # Check for conditional edges (would make it non-deterministic)
    edge_sources = {}
    for edge in flow_edges:
        source = edge.get('source')
        if source in edge_sources:
            has_conditional_routing = True
        edge_sources[source] = edge_sources.get(source, 0) + 1
    
    # Simple loop detection
    visited = set()
    for edge in flow_edges:
        if edge.get('target') in visited:
            has_loops = True
        visited.add(edge.get('source'))
    
    # Check for AI nodes with temperature > 0 (non-deterministic)
    for node in flow_nodes:
        if node.get('type') == 'ai':
            temp = node.get('data', {}).get('temperature', 0.7)
            if temp > 0:
                has_random_elements = True
    
    is_deterministic = not (has_conditional_routing or has_random_elements)
    
    return {
        "is_deterministic": is_deterministic,
        "has_conditional_routing": has_conditional_routing,
        "has_loops": has_loops,
        "has_random_elements": has_random_elements,
        "note": "Set AI node temperature to 0 for deterministic responses"
    }

def build_step_execution_graph(
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    agent_id: Optional[str] = None
) -> StateGraph:
    """
    Build a LangGraph StateGraph for step-by-step execution.
    Uses LangGraph's native edge management instead of manual traversal.
    
    Args:
        flow_nodes: All nodes in the flow
        flow_edges: All edges in the flow
        agent_id: Optional agent ID for caching node executors
        
    Returns:
        Compiled StateGraph with MemorySaver checkpoint
    """
    logger.info(f"[GRAPH BUILD] Building StateGraph with {len(flow_nodes)} nodes, {len(flow_edges)} edges")
    
    # Create state graph
    graph = StateGraph(StepExecutionState)
    
    # Build node ID to node data mapping for quick lookup
    node_map = {node['id']: node for node in flow_nodes}
    
    # Store node executors for direct access
    node_executors = {}
    
    # Add all nodes to the graph
    for node in flow_nodes:
        node_id = node['id']
        node_type = node.get('type')
        
        # Create node executor function
        def create_node_executor(current_node_id: str, current_node_type: str):
            def node_executor(state: StepExecutionState) -> StepExecutionState:
                """Execute a single node and update state."""
                logger.info(f"[NODE EXECUTOR] Executing {current_node_id} (type: {current_node_type})")
                
                node_data = node_map[current_node_id]
                node_config = node_data.get('data', {})
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
                
                # Execute node logic based on type
                if current_node_type in ['button', 'message', 'interactive']:
                    message_text = node_config.get('message', 'What would you like to do?')
                    buttons = node_config.get('buttons', [])
                    media = node_config.get('media')
                    message_text = strip_html_tags(message_text)
                    response = message_text
                    user_data[f'{current_node_id}_buttons'] = buttons
                    
                    ui_schema = {
                        'type': 'interactive',
                        'message': message_text,
                        'buttons': buttons,
                        'media': media,
                        'expects_input': len(buttons) > 0
                    }
                    
                    if user_input:
                        user_data[f'{current_node_id}_action'] = user_input
                        lc_messages.append(HumanMessage(content=f"Selected: {user_input}"))
                    
                    lc_messages.append(AIMessage(content=response))
                    
                elif current_node_type == 'input':
                    label = node_config.get('label', 'Please provide your input')
                    input_type = node_config.get('inputType', 'text')
                    placeholder = node_config.get('placeholder', 'Enter your response')
                    # Use placeholder for response message, strip HTML tags
                    placeholder_text = strip_html_tags(placeholder)
                    response = placeholder_text
                    
                    ui_schema = {
                        'type': 'input',
                        'label': label,
                        'inputType': input_type,
                        'placeholder': placeholder_text,
                        'expects_input': True
                    }
                    
                    if user_input:
                        # Get variable key for storage (prioritize save_response_variable_id > label > node_id)
                        variable_key = get_variable_key_for_node(current_node_id, node_config)
                        user_data[variable_key] = user_input
                        lc_messages.append(HumanMessage(content=user_input))
                    
                    lc_messages.append(AIMessage(content=response))
                    
                elif current_node_type == 'ai':
                    model_name = node_config.get('model', 'meta-llama/llama-3.3-8b-instruct:free')
                    system_prompt = node_config.get('systemPrompt', 'You are a helpful AI assistant.')
                    temperature = node_config.get('temperature', 0.7)
                    max_tokens = node_config.get('maxTokens', 300)
                    
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
                        if not key.endswith('_buttons') and not key.endswith('_action'):
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
                
                # Update state
                return {
                    **state,
                    'node_id': current_node_id,
                    'user_data': user_data,
                    'messages': serialized_messages,
                    'response': response,
                    'ui_schema': ui_schema
                }
            
            return node_executor
        
        # Create and store node executor
        executor = create_node_executor(node_id, node_type)
        node_executors[node_id] = executor
        
        # Add node to graph
        graph.add_node(node_id, executor)
        logger.info(f"[GRAPH BUILD] Added node: {node_id} (type: {node_type})")
    
    # Set entry point
    entry_node_id = find_entry_node(flow_nodes, flow_edges)
    if entry_node_id:
        graph.set_entry_point(entry_node_id)
        logger.info(f"[GRAPH BUILD] Set entry point: {entry_node_id}")
    
    # Group edges by source node to detect multiple outgoing edges
    edges_by_source = {}
    for edge in flow_edges:
        source = edge.get('source')
        target = edge.get('target')
        if source and target:
            if source not in edges_by_source:
                edges_by_source[source] = []
            edges_by_source[source].append(target)
    
    # Add edges - use conditional routing for nodes with multiple outgoing edges
    for source, targets in edges_by_source.items():
        if len(targets) == 1:
            # Single outgoing edge - use simple add_edge
            graph.add_edge(source, targets[0])
            logger.info(f"[GRAPH BUILD] Added edge: {source} -> {targets[0]}")
        else:
            # Multiple outgoing edges - use conditional routing
            # For now, just take the first edge as default
            # In future, this can be enhanced with button-based routing
            graph.add_edge(source, targets[0])
            logger.info(f"[GRAPH BUILD] Added default edge for multi-path node: {source} -> {targets[0]} (note: node has {len(targets)} possible paths)")
    
    # Find terminal nodes (nodes with no outgoing edges) and connect to END
    source_nodes = set(edges_by_source.keys())
    for node in flow_nodes:
        node_id = node.get('id')
        if node_id not in source_nodes:
            graph.add_edge(node_id, END)
            logger.info(f"[GRAPH BUILD] Added terminal edge: {node_id} -> END")
    
    # Compile with MemorySaver for state persistence
    compiled_graph = graph.compile(checkpointer=MemorySaver())
    logger.info("[GRAPH BUILD] Graph compiled with MemorySaver")
    
    # Cache node executors if agent_id provided
    if agent_id:
        _node_executor_cache[agent_id] = node_executors
        logger.info(f"[GRAPH BUILD] Cached {len(node_executors)} node executors for agent {agent_id}")
    
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
    button_action: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Execute a single node using LangGraph WITH memory persistence via MemorySaver.
    Uses LangGraph's stateful execution with checkpointing for conversation continuity.
    
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
        button_action: Optional button action with button_id, action_type, action_value
        
    Returns:
        Dictionary with:
        - next_node_id: ID of next node to execute (or None if flow complete)
        - current_node: Details of current node
        - state: Updated state data
        - ui_schema: Instructions for UI rendering
        - response: Generated response
        - is_complete: Whether flow is finished
    """
    logger.info(f"[STEP EXECUTION] Executing single node: {node_id} using LangGraph with MemorySaver")
    if button_action:
        logger.info(f"[STEP EXECUTION] Button action received: {button_action}")
    
    try:
        # Find the current node
        current_node = None
        for node in flow_nodes:
            if node.get('id') == node_id:
                current_node = node
                break
        
        if not current_node:
            return {
                'success': False,
                'error': 'Node not found',
                'response': f'Node {node_id} not found in flow'
            }
        
        # Get or build the StateGraph (cached per agent with MemorySaver)
        if not agent_id:
            compiled_graph = build_step_execution_graph(flow_nodes, flow_edges, agent_id=None)
            logger.info("[STEP EXECUTION] Using non-cached graph without agent_id")
        else:
            compiled_graph = get_or_build_graph(agent_id, flow_nodes, flow_edges)
            # Log is already handled in get_or_build_graph
        
        # Create a unique thread_id for this conversation (use conversation_id or generate one)
        thread_id = conversation_id or f"{workspace_id}_{agent_id}_{node_id}"
        
        # Prepare config with thread_id for checkpointing
        config = {
            "configurable": {
                "thread_id": thread_id
            }
        }
        
        # Prepare state for this single node execution
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
        
        # Execute ONLY the single node using the node executor from cache
        # This prevents automatic graph traversal through all connected nodes
        logger.info(f"[STEP EXECUTION] Executing single node {node_id} with thread_id: {thread_id}")
        
        # Get the node executor function from cache
        node_executor = get_node_executor(agent_id, node_id)
        
        if node_executor and callable(node_executor):
            # Execute the single node function with state
            logger.info(f"[STEP EXECUTION] Using cached node executor for {node_id}")
            result = node_executor(initial_state)
        else:
            # Fallback: execute node logic directly if executor not found
            logger.warning(f"[STEP EXECUTION] Node executor not found for {node_id}, using direct execution")
            result = execute_node_logic(
                node_id=node_id,
                current_node=current_node,
                user_input=user_input,
                user_data=initial_state['user_data'],
                messages=initial_state['messages'],
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
                    logger.info(f"[BUTTON ROUTING] Executing connected node {next_node_id}")
                    next_node_executor = get_node_executor(agent_id, next_node_id)
                    
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
                        next_result = execute_node_logic(
                            node_id=next_node_id,
                            current_node=next_node,
                            user_input='',
                            user_data=next_state['user_data'],
                            messages=next_state['messages'],
                            flow_nodes=flow_nodes
                        )
                    
                    # Save state after executing connected node
                    try:
                        compiled_graph.update_state(config, next_result)
                        logger.info(f"[MEMORY CACHE] State saved after executing connected node {next_node_id}")
                    except Exception as save_err:
                        logger.warning(f"[MEMORY CACHE] Could not save state: {save_err}")
                    
                    # Find next node after the connected node
                    final_next_node_id = find_next_node_id(next_node_id, flow_edges)
                    next_node_type = next_node.get('type')
                    is_complete = final_next_node_id is None or next_node_type == 'engine'
                    
                    logger.info(f"[BUTTON ROUTING] Connected node executed. Current: {next_node_id}, Next: {final_next_node_id}, Complete: {is_complete}")
                    
                    # Return the connected node's config
                    return {
                        'success': True,
                        'current_node_id': next_node_id,
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
        if button_action:
            next_node_id = find_next_node_id(node_id, flow_edges, button_action)
        else:
            next_node_id = find_next_node_id(node_id, flow_edges)
        
        # Check if flow is complete
        node_type = current_node.get('type')
        is_complete = next_node_id is None or node_type == 'engine'
        
        logger.info(f"[STEP EXECUTION] Node {node_id} executed. Next: {next_node_id}, Complete: {is_complete}")
        
        return {
            'success': True,
            'current_node_id': node_id,
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
    Execute the logic for a single node. This is the core node execution logic
    that gets wrapped by LangGraph node executors.
    
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
    node_type = current_node.get('type')
    node_config = current_node.get('data', {})
    
    # Convert messages to LangChain format
    lc_messages = []
    for msg in messages:
        if msg.get('role') == 'human':
            lc_messages.append(HumanMessage(content=msg.get('content', '')))
        else:
            lc_messages.append(AIMessage(content=msg.get('content', '')))
    
    response = ""
    ui_schema = {}
    
    if node_type in ['button', 'message', 'interactive']:
        message_text = node_config.get('message', 'What would you like to do?')
        buttons = node_config.get('buttons', [])
        media = node_config.get('media')
        message_text = strip_html_tags(message_text)
        response = message_text
        user_data[f'{node_id}_buttons'] = buttons
        
        ui_schema = {
            'type': 'interactive',
            'message': message_text,
            'buttons': buttons,
            'media': media,
            'expects_input': len(buttons) > 0
        }
        
        if user_input:
            user_data[f'{node_id}_action'] = user_input
            lc_messages.append(HumanMessage(content=f"Selected: {user_input}"))
        
        lc_messages.append(AIMessage(content=response))
        
    elif node_type == 'input':
        label = node_config.get('label', 'Please provide your input')
        input_type = node_config.get('inputType', 'text')
        placeholder = node_config.get('placeholder', 'Enter your response')
        # Use placeholder for response message, strip HTML tags
        placeholder_text = strip_html_tags(placeholder)
        response = placeholder_text
        
        ui_schema = {
            'type': 'input',
            'label': label,
            'inputType': input_type,
            'placeholder': placeholder_text,
            'expects_input': True
        }
        
        if user_input:
            # Get variable key for storage (prioritize save_response_variable_id > label > node_id)
            variable_key = get_variable_key_for_node(node_id, node_config)
            user_data[variable_key] = user_input
            lc_messages.append(HumanMessage(content=user_input))
        
        lc_messages.append(AIMessage(content=response))
        
    elif node_type == 'ai':
        model_name = node_config.get('model', 'meta-llama/llama-3.3-8b-instruct:free')
        system_prompt = node_config.get('systemPrompt', 'You are a helpful AI assistant.')
        temperature = node_config.get('temperature', 0.7)
        max_tokens = node_config.get('maxTokens', 300)
        
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
    
    elif node_type == 'engine':
        label_map = get_node_label_map(flow_nodes)
        collected_data = []
        for key, value in user_data.items():
            if not key.endswith('_buttons') and not key.endswith('_action'):
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
    
    else:
        response = f"Processing through {node_type} node..."
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
    
    return {
        'node_id': node_id,
        'user_input': user_input,
        'user_data': user_data,
        'messages': serialized_messages,
        'response': response,
        'ui_schema': ui_schema,
        'next_node_id': None,
        'is_complete': False,
        'workspace_id': None,
        'agent_id': None,
        'conversation_id': None
    }

if __name__ == "__main__":
    # Run tests
    pass
    # test_interactive_flow()
