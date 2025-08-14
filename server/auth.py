import os
import requests
from functools import wraps
from flask import session, request, jsonify, redirect, url_for
from authlib.integrations.flask_client import OAuth
from .models import User, db
from datetime import datetime

def get_oauth():
    oauth = OAuth()
    oauth.register(
        name='replit',
        client_id=os.getenv('REPL_ID'),
        client_secret=None,  # OIDC doesn't require client secret for public clients
        server_metadata_url=f"{os.getenv('ISSUER_URL', 'https://replit.com/oidc')}/.well-known/openid_configuration",
        client_kwargs={
            'scope': 'openid email profile offline_access'
        }
    )
    return oauth

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return jsonify({'message': 'Unauthorized'}), 401
        
        # Check if token is expired
        if 'expires_at' in session and session['expires_at'] <= datetime.utcnow().timestamp():
            # Try to refresh token
            if 'refresh_token' in session:
                try:
                    oauth = get_oauth()
                    token = oauth.replit.refresh_token(session['refresh_token'])
                    update_session(token)
                except Exception:
                    session.clear()
                    return jsonify({'message': 'Unauthorized'}), 401
            else:
                session.clear()
                return jsonify({'message': 'Unauthorized'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

def update_session(token):
    """Update session with new token information"""
    session['access_token'] = token.get('access_token')
    session['refresh_token'] = token.get('refresh_token')
    session['expires_at'] = token.get('expires_in', 3600) + datetime.utcnow().timestamp()

def upsert_user(claims):
    """Create or update user from OIDC claims"""
    user = User.query.filter_by(id=claims['sub']).first()
    
    user_data = {
        'email': claims.get('email'),
        'first_name': claims.get('first_name'),
        'last_name': claims.get('last_name'),
        'profile_image_url': claims.get('profile_image_url'),
        'updated_at': datetime.utcnow()
    }
    
    if user:
        # Update existing user
        for key, value in user_data.items():
            setattr(user, key, value)
    else:
        # Create new user
        user = User(id=claims['sub'], **user_data)
        db.session.add(user)
    
    db.session.commit()
    return user