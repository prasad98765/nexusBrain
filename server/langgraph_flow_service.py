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
"""

import os
import logging
import re
import html
from typing import TypedDict, Annotated, Sequence, Optional, Dict, Any, List, Callable
from typing_extensions import TypedDict

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage

logger = logging.getLogger(__name__)

# Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

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



def find_next_node_id(current_node_id: str, edges: List[Dict[str, Any]]) -> Optional[str]:
    """
    Find the next node ID based on current node and edges.
    
    Args:
        current_node_id: Current node ID
        edges: List of edge connections
        
    Returns:
        Next node ID or None if at end of flow
    """
    for edge in edges:
        if edge.get('source') == current_node_id:
            return edge.get('target')
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

def execute_single_node(
    node_id: str,
    user_input: str,
    flow_nodes: List[Dict[str, Any]],
    flow_edges: List[Dict[str, Any]],
    user_data: Dict[str, Any] = None,
    messages: List[Dict[str, Any]] = None,
    workspace_id: Optional[str] = None,
    agent_id: Optional[str] = None,
    conversation_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute a single node in the flow and return the next node to execute.
    This enables server-driven, step-by-step flow execution with bidirectional UI communication.
    
    Args:
        node_id: ID of the node to execute
        user_input: User's input for this step
        flow_nodes: All nodes in the flow
        flow_edges: All edges in the flow
        user_data: Previously collected user data
        messages: Previous conversation messages
        workspace_id: Workspace identifier
        agent_id: Agent identifier
        conversation_id: Conversation identifier
        
    Returns:
        Dictionary with:
        - next_node_id: ID of next node to execute (or None if flow complete)
        - current_node: Details of current node
        - state: Updated state data
        - ui_schema: Instructions for UI rendering
        - response: Generated response
        - is_complete: Whether flow is finished
    """
    logger.info(f"[STEP EXECUTION] Executing node: {node_id}")
    
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
        
        # Initialize state
        user_data = user_data or {}
        messages = messages or []
        
        # Convert messages to LangChain format
        lc_messages = []
        for msg in messages:
            if msg.get('role') == 'human':
                lc_messages.append(HumanMessage(content=msg.get('content', '')))
            else:
                lc_messages.append(AIMessage(content=msg.get('content', '')))
        
        # Execute node logic
        node_type = current_node.get('type')
        node_config = current_node.get('data', {})
        response = ""
        ui_schema = {}
        
        if node_type in ['button', 'message', 'interactive']:
            # Interactive message with buttons
            message_text = node_config.get('message', 'What would you like to do?')
            buttons = node_config.get('buttons', [])
            
            # Strip HTML from message
            message_text = strip_html_tags(message_text)
            
            response = message_text
            user_data[f'{node_id}_buttons'] = buttons
            
            # Generate UI schema for client
            # set fasle expects_input len(buttons) == 0
            ui_schema = {
                'type': 'interactive',
                'message': message_text,
                'buttons': buttons,
                'expects_input': len(buttons) > 0  
            }
            
            # If user provided button action, store it
            if user_input:
                user_data[f'{node_id}_action'] = user_input
                lc_messages.append(HumanMessage(content=f"Selected: {user_input}"))
            
            lc_messages.append(AIMessage(content=response))
            
        elif node_type == 'input':
            # Input collection node
            label = node_config.get('label', 'Please provide your input')
            input_type = node_config.get('inputType', 'text')
            placeholder = node_config.get('placeholder', 'Enter your response')
            
            response = f"{label}"
            
            # Generate UI schema
            ui_schema = {
                'type': 'input',
                'label': label,
                'inputType': input_type,
                'placeholder': placeholder,
                'expects_input': True
            }
            
            # If user provided input, store it
            if user_input:
                user_data[node_id] = user_input
                lc_messages.append(HumanMessage(content=user_input))
            
            lc_messages.append(AIMessage(content=response))
            
        elif node_type == 'ai':
            # AI/Language Model node
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
            # Engine/output node - final output
            # Get label map for readable variable names
            label_map = get_node_label_map(flow_nodes)
            
            collected_data = []
            for key, value in user_data.items():
                if not key.endswith('_buttons') and not key.endswith('_action'):
                    # Use readable label instead of node ID
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
            # Unknown node type
            response = f"Processing through {node_type} node..."
            ui_schema = {
                'type': 'info',
                'message': response,
                'expects_input': False
            }
            
            if user_input:
                lc_messages.append(HumanMessage(content=user_input))
            lc_messages.append(AIMessage(content=response))
        
        # Find next node
        next_node_id = find_next_node_id(node_id, flow_edges)
        
        # Convert LangChain messages back to serializable format
        serialized_messages = [
            {'role': 'human' if isinstance(m, HumanMessage) else 'ai', 'content': m.content}
            for m in lc_messages
        ]
        
        # Determine if flow is complete
        is_complete = next_node_id is None or node_type == 'engine'
        
        return {
            'success': True,
            'current_node_id': node_id,
            'current_node': {
                'id': current_node.get('id'),
                'type': current_node.get('type'),
                'label': node_config.get('label', '')
            },
            'next_node_id': next_node_id,
            'state': {
                'user_data': user_data,
                'messages': serialized_messages,
                'workspace_id': workspace_id,
                'agent_id': agent_id,
                'conversation_id': conversation_id
            },
            'ui_schema': ui_schema,
            'response': response,
            'is_complete': is_complete
        }
        
    except Exception as e:
        logger.error(f"[STEP EXECUTION] Error: {e}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'response': f"Error executing node: {str(e)}"
        }

if __name__ == "__main__":
    # Run tests
    pass
    # test_interactive_flow()
