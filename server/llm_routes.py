import hashlib
import secrets
from datetime import datetime
from typing import Dict, Any

from flask import Blueprint, request, jsonify
from sqlalchemy import or_, func

from .models import db, ApiToken, ApiUsageLog, Workspace
from .auth_utils import (
    generate_password_hash, check_password_hash, generate_jwt_token, 
    decode_jwt_token, generate_verification_token, generate_reset_token, verify_google_token,
    require_auth, require_verified_user
)
api_llm_routes = Blueprint('api_llm_routes', __name__)

@api_llm_routes.route('/v1/models', methods=['GET'])
@require_auth
def get_models():
    """Get available LLM models from OpenRouter"""
    try:
        import requests
        response = requests.get('https://openrouter.ai/api/v1/models')
        if response.status_code == 200:
            return jsonify(response.json()), 200
        else:
            return jsonify({'error': 'Failed to fetch models from OpenRouter'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500