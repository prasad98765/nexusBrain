import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, current_app, session
import secrets
import string
from google.oauth2 import id_token
from google.auth.transport import requests
import os

def generate_password_hash(password: str) -> str:
    """Generate a secure password hash"""
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    return password_hash.decode('utf-8')

def check_password_hash(password_hash: str, password: str) -> bool:
    """Check if password matches the hash"""
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def generate_jwt_token(user_id: str, email: str, workspace_id: str = None) -> str:
    """Generate JWT token with 48-hour expiry"""
    payload = {
        'user_id': user_id,
        'email': email,
        'workspace_id': workspace_id,
        'exp': datetime.utcnow() + timedelta(hours=48),
        'iat': datetime.utcnow()
    }
    
    secret_key = current_app.config.get('SECRET_KEY', 'your-secret-key')
    return jwt.encode(payload, secret_key, algorithm='HS256')

def decode_jwt_token(token: str) -> dict:
    """Decode JWT token and return payload"""
    try:
        secret_key = current_app.config.get('SECRET_KEY', 'your-secret-key')
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

def generate_verification_token() -> str:
    """Generate a random verification token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(32))

def verify_google_token(token: str) -> dict:
    """Verify Google OAuth token and return user info"""
    try:
        client_id = os.getenv('GOOGLE_CLIENT_ID')
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        return {
            'google_id': idinfo['sub'],
            'email': idinfo['email'],
            'first_name': idinfo.get('given_name', ''),
            'last_name': idinfo.get('family_name', ''),
            'profile_image_url': idinfo.get('picture')
        }
    except ValueError as e:
        raise ValueError(f"Invalid Google token: {str(e)}")

def require_auth(f):
    """Decorator to require JWT authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            payload = decode_jwt_token(token)
            request.user = payload
        except ValueError as e:
            if "expired" in str(e).lower():
                return jsonify({'message': 'Session expired. Please login again.'}), 401
            return jsonify({'message': 'Token is invalid'}), 401
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_verified_user(f):
    """Decorator to require verified user"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from .models import User
        
        user_id = getattr(request, 'user', {}).get('user_id')
        if not user_id:
            return jsonify({'message': 'Authentication required'}), 401
            
        user = User.query.get(user_id)
        if not user or not user.is_verified:
            return jsonify({'message': 'Email verification required'}), 403
            
        return f(*args, **kwargs)
    
    return decorated_function