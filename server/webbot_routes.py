from flask import Blueprint, request, jsonify, Response
import json
import logging
import requests
from server.auth_utils import require_auth
from server.models import ApiToken, db

logger = logging.getLogger(__name__)

webbot_bp = Blueprint('webbot', __name__)

@webbot_bp.route('/webbot/chat', methods=['POST'])
@require_auth
def webbot_chat():
    """
    Web bot chat endpoint - uses user's stored API token to call /v1/chat/create internally
    """
    try:
        # Get user's workspace_id from auth
        workspace_id = request.user.get('workspace_id')
        user_id = request.user.get('id')
        
        if not workspace_id:
            return jsonify({'error': 'User authentication required'}), 401
        
        # Get request payload
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        messages = data.get('messages', [])
        if not messages or not isinstance(messages, list):
            return jsonify({'error': 'messages array is required'}), 400
        logger.info(f"Received messages: {workspace_id}")
        # Get user's API token from database
        api_token = ApiToken.query.filter_by(
            workspace_id=workspace_id,
            is_active=True
        ).first()
        
        if not api_token:
            return jsonify({
                'error': 'No active API token found. Please create an API token in the API Integrations page first.'
            }), 404
        
        # Construct payload for /v1/chat/create
        # Construct payload for /v1/chat/create
        payload = {
            'model': data.get('model', 'openai/gpt-3.5-turbo'),  # Default model
            'messages': messages,
            'stream': data.get('stream', True),  # Enable streaming by default
            'max_tokens': data.get('max_tokens', 1000),
            'temperature': data.get('temperature', 0.4),
            'is_cached': data.get('is_cached', False),
            'cache_threshold': data.get('cache_threshold', 0.5)
        }
        
        # Make internal request to /api/v1/chat/create
        # Use localhost:5000 since this is an internal call to the same Flask app
        chat_url = "http://127.0.0.1:5000/api/v1/chat/create"
        
        headers = {
            'Authorization': f'Bearer {"nxs-aXkDVM7aAVNVuVcYa6FqoLDD98fHIwOF4VVX-tkcHgs"}',
            'Content-Type': 'application/json'
        }
        
        # Make the initial request
        response = requests.post(
            chat_url,
            json=payload,
            headers=headers,
            stream=data.get('stream', True),
            timeout=120
        )

        # Check response headers to determine if it's a streaming or regular response
        content_type = response.headers.get('content-type', '')
        
        # Handle non-streaming response (including cached responses)
        if 'application/json' in content_type:
            if response.status_code == 200:
                json_response = response.json()
                # Convert to SSE format for consistent client handling
                return Response(
                    f"data: {json.dumps(json_response)}\n\ndata: [DONE]\n\n",
                    mimetype='text/event-stream'
                )
            else:
                error_data = {'error': response.json().get('error', 'Unknown error')}
                return Response(
                    f"data: {json.dumps(error_data)}\n\ndata: [DONE]\n\n",
                    mimetype='text/event-stream'
                )

        # Handle streaming response
        if response.status_code == 200:
            def generate():
                try:
                    # Forward the streaming response
                    for line in response.iter_lines():
                        if line:
                            decoded_line = line.decode('utf-8')
                            if decoded_line.startswith('data: '):
                                yield f"{decoded_line}\n\n"
                    # Ensure [DONE] is always sent
                    yield "data: [DONE]\n\n"
                except Exception as e:
                    logger.error(f"Streaming error: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
                    yield "data: [DONE]\n\n"
            
            return Response(generate(), mimetype='text/event-stream')
        else:
            # Handle streaming request errors
            error_msg = {'error': 'Failed to get response from chat API'}
            return Response(
                f"data: {json.dumps(error_msg)}\n\ndata: [DONE]\n\n",
                mimetype='text/event-stream'
            )
        
    except Exception as e:
        logger.error(f"Webbot chat error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
