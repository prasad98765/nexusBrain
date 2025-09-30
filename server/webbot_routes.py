from flask import Blueprint, request, jsonify, Response
import json
import logging
import requests
from server.auth_middleware import require_auth
from server.models import ApiToken, db

logger = logging.getLogger(__name__)

webbot_bp = Blueprint('webbot', __name__)

@webbot_bp.route('/api/webbot/chat', methods=['POST'])
@require_auth
def webbot_chat():
    """
    Web bot chat endpoint - uses user's stored API token to call /v1/chat/create internally
    """
    try:
        # Get user's workspace_id from auth
        workspace_id = request.user.get('workspace_id')
        user_id = request.user.get('id')
        
        if not workspace_id or not user_id:
            return jsonify({'error': 'User authentication required'}), 401
        
        # Get request payload
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        messages = data.get('messages', [])
        if not messages or not isinstance(messages, list):
            return jsonify({'error': 'messages array is required'}), 400
        
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
        payload = {
            'model': data.get('model', 'openai/gpt-3.5-turbo'),  # Default model
            'messages': messages,
            'stream': data.get('stream', True),  # Enable streaming by default
            'max_tokens': data.get('max_tokens', 1000),
            'temperature': data.get('temperature', 0.7)
        }
        
        # Make internal request to /v1/chat/create
        base_url = request.host_url.rstrip('/')
        chat_url = f"{base_url}/v1/chat/create"
        
        headers = {
            'Authorization': f'Bearer {api_token.token}',
            'Content-Type': 'application/json'
        }
        
        # Check if streaming is requested
        if payload.get('stream'):
            # Stream the response
            def generate():
                try:
                    response = requests.post(
                        chat_url,
                        json=payload,
                        headers=headers,
                        stream=True,
                        timeout=120
                    )
                    
                    if response.status_code != 200:
                        error_data = response.json() if response.headers.get('content-type') == 'application/json' else {'error': response.text}
                        yield f"data: {json.dumps({'error': error_data.get('error', 'Unknown error')})}\n\n"
                        yield "data: [DONE]\n\n"
                        return
                    
                    # Forward the streaming response
                    for line in response.iter_lines():
                        if line:
                            decoded_line = line.decode('utf-8')
                            if decoded_line.startswith('data: '):
                                yield f"{decoded_line}\n\n"
                    
                except Exception as e:
                    logger.error(f"Webbot streaming error: {e}")
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
                    yield "data: [DONE]\n\n"
            
            return Response(generate(), mimetype='text/event-stream')
        
        else:
            # Non-streaming response
            response = requests.post(
                chat_url,
                json=payload,
                headers=headers,
                timeout=120
            )
            
            if response.status_code == 200:
                return jsonify(response.json())
            else:
                error_data = response.json() if response.headers.get('content-type') == 'application/json' else {'error': response.text}
                return jsonify(error_data), response.status_code
        
    except Exception as e:
        logger.error(f"Webbot chat error: {e}")
        return jsonify({'error': 'Internal server error'}), 500
