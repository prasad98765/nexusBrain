from flask import Blueprint, request, jsonify, session, redirect, url_for, send_from_directory, current_app
from .models import User, Workspace, WorkspaceMember, Conversation, Message, db
from .auth_utils import (
    generate_password_hash, check_password_hash, generate_jwt_token, 
    decode_jwt_token, generate_verification_token, generate_reset_token, verify_google_token,
    require_auth, require_verified_user
)
from .email_service import send_verification_email, send_welcome_email, send_password_reset_email
from .mongo_service import mongo_service, BUSINESS_TYPES
from datetime import datetime, timedelta
import os
import re
from flask import render_template


# Create blueprints
auth_bp = Blueprint('auth', __name__)
workspace_bp = Blueprint('workspace', __name__)
conversation_bp = Blueprint('conversation', __name__)
message_bp = Blueprint('message', __name__)
static_bp = Blueprint('static', __name__)

# Serve static files (for development)
@static_bp.route('/')
@static_bp.route('/<path:path>')
def serve_static(path=''):
    """Serve the React frontend"""
    import os
    try:
        static_dir = os.path.join(os.getcwd(), 'dist/public')
        if path and path != 'index.html':
            return send_from_directory(static_dir, path)
        else:
            return send_from_directory(static_dir, 'index.html')
    except Exception as e:
        # Fallback error message
        return jsonify({'message': f'Frontend error: {str(e)}. Static dir: {os.path.join(os.getcwd(), "dist/public")}'}), 404

# Utility function for email validation
def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

# Auth routes
@auth_bp.route('/signup', methods=['POST'])
def signup():
    """Standard email/password signup with email verification"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not all(k in data for k in ['first_name', 'email', 'password']):
            return jsonify({'message': 'Missing required fields: first_name, email, password'}), 400
        
        first_name = data['first_name'].strip()
        email = data['email'].lower().strip()
        password = data['password']
        last_name = data.get('last_name', '').strip()
        
        # Validate input
        if len(first_name) < 2:
            return jsonify({'message': 'First name must be at least 2 characters'}), 400
        if not is_valid_email(email):
            return jsonify({'message': 'Invalid email format'}), 400
        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({'message': 'User with this email already exists'}), 409
        
        # Create new user
        verification_token = generate_verification_token()
        password_hash = generate_password_hash(password)
        
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            password_hash=password_hash,
            verification_token=verification_token,
            auth_provider='local',
            is_verified=True
        )
        
        db.session.add(user)
        db.session.flush()  # Get the user ID
        
        # Create default workspace for user
        default_workspace = Workspace(
            name=f"{first_name}'s Workspace",
            description="Your personal AI workspace",
            owner_id=user.id
        )
        db.session.add(default_workspace)
        db.session.flush()  # Get the workspace ID
        
        # Add user as workspace owner
        workspace_member = WorkspaceMember(
            workspace_id=default_workspace.id,
            user_id=user.id,
            role='owner'
        )
        db.session.add(workspace_member)
        db.session.commit()
        
        # Send verification email
        # send_verification_email(user.email, user.first_name, verification_token)
        
        return jsonify({
            'message': 'Account created successfully! Please log in to continue.',
            'user_id': user.id,
            'verification_required': True
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Signup error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/google-signup', methods=['POST'])
def google_signup():
    """Google OAuth signup - bypasses email verification"""
    try:
        data = request.get_json()
        
        if 'google_token' not in data:
            return jsonify({'message': 'Google token is required'}), 400
        
        # Verify Google token and get user info
        google_user = verify_google_token(data['google_token'])
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=google_user['email']).first()
        if existing_user:
            if existing_user.auth_provider == 'google':
                # Generate JWT token with default workspace
                default_workspace = Workspace.query.filter_by(owner_id=existing_user.id).first()
                workspace_id = default_workspace.id if default_workspace else None
                
                token = generate_jwt_token(existing_user.id, existing_user.email, workspace_id)
                return jsonify({
                    'message': 'Login successful',
                    'token': token,
                    'user': {
                        'id': existing_user.id,
                        'email': existing_user.email,
                        'first_name': existing_user.first_name,
                        'last_name': existing_user.last_name,
                        'profile_image_url': existing_user.profile_image_url,
                        'workspace_id': workspace_id
                    }
                }), 200
            else:
                return jsonify({'message': 'Email already registered with password. Please use regular login.'}), 409
        
        # Create new user with Google OAuth
        user = User(
            email=google_user['email'],
            first_name=google_user['first_name'],
            last_name=google_user['last_name'],
            google_id=google_user['google_id'],
            profile_image_url=google_user['profile_image_url'],
            auth_provider='google',
            is_verified=True  # Google users are auto-verified
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create default workspace
        default_workspace = Workspace(
            name=f"{user.first_name}'s Workspace",
            description="Your personal AI workspace",
            owner_id=user.id
        )
        db.session.add(default_workspace)
        db.session.flush()  # <-- Add this line to assign an ID to default_workspace
        
        # Add user as workspace owner
        workspace_member = WorkspaceMember(
            workspace_id=default_workspace.id,
            user_id=user.id,
            role='owner'
        )
        db.session.add(workspace_member)
        db.session.commit()

        from datetime import datetime
        from sqlalchemy import text

        db.session.execute(
            text("""
                INSERT INTO business_info (user_id, workspace_id, business_name, business_type, created_at, updated_at)
                VALUES (:user_id, :workspace_id, :business_name, :business_type, :created_at, :updated_at)
                ON CONFLICT (user_id, workspace_id)
                DO NOTHING
            """),
            {
                'user_id': user.id,
                'workspace_id': default_workspace.id,
                'business_name': f"{user.first_name}'s Business",
                'business_type': 'Other',  # or pick a default type
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
        )
        db.session.commit()
        
        # Generate JWT token
        token = generate_jwt_token(user.id, user.email, default_workspace.id)
        
        # Send welcome email
        # send_welcome_email(user.email, user.first_name)
        
        return jsonify({
            'message': 'Account created successfully!',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_image_url': user.profile_image_url,
                'workspace_id': default_workspace.id
            }
        }), 201
        
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        print(f"Google signup error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Standard email/password login with verification check"""
    try:
        data = request.get_json()
        
        if not all(k in data for k in ['email', 'password']):
            return jsonify({'message': 'Email and password are required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user by email
        user = User.query.filter_by(email=email, auth_provider='local').first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Check if email is verified
        if not user.is_verified:
            return jsonify({
                'message': 'Please verify your email address before logging in',
                'verification_required': True
            }), 403
        
        # Get user's default workspace
        default_workspace = Workspace.query.filter_by(owner_id=user.id).first()
        workspace_id = default_workspace.id if default_workspace else None
        
        # Generate JWT token
        token = generate_jwt_token(user.id, user.email, workspace_id)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_image_url': user.profile_image_url,
                'workspace_id': workspace_id
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/google-login', methods=['POST'])
def google_login():
    """Google OAuth login"""
    try:
        data = request.get_json()
        
        if 'google_token' not in data:
            return jsonify({'message': 'Google token is required'}), 400
        
        # Verify Google token and get user info
        google_user = verify_google_token(data['google_token'])
        
        # Find user by Google ID or email
        user = User.query.filter_by(google_id=google_user['google_id']).first()
        if not user:
            user = User.query.filter_by(email=google_user['email']).first()
        
            # If found and Google ID is missing, link Google ID
            if user and not user.google_id:
                user.google_id = google_user['google_id']
                user.auth_provider = 'google'  # Optionally update auth provider
                db.session.commit()      

        if not user:
            return jsonify({'message': 'No account found. Please sign up first.'}), 404
        
        # Update user info from Google if needed
        user.profile_image_url = google_user.get('profile_image_url', user.profile_image_url)
        db.session.commit()
        
        # Get user's default workspace
        default_workspace = Workspace.query.filter_by(owner_id=user.id).first()
        workspace_id = default_workspace.id if default_workspace else None
        
        # Generate JWT token
        token = generate_jwt_token(user.id, user.email, workspace_id)
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'profile_image_url': user.profile_image_url,
                'workspace_id': workspace_id
            }
        }), 200
        
    except ValueError as e:
        return jsonify({'message': str(e)}), 400
    except Exception as e:
        print(f"Google login error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/verify-email/<token>')
def verify_email(token):
    """Verify email address using token"""
    try:
        user = User.query.filter_by(verification_token=token).first()
        
        if not user:
            return jsonify({'message': 'Invalid verification token'}), 400
        
        if user.is_verified:
            return jsonify({'message': 'Email already verified'}), 200
        
        # Verify the user
        user.is_verified = True
        user.verification_token = None
        db.session.commit()
        
        # Send welcome email
        # send_welcome_email(user.email, user.first_name)
        frontend_host = os.getenv("FRONTEND_HOST", "http://localhost:5174/")
        return render_template('email_verified.html', frontend_host=frontend_host)
        
    except Exception as e:
        print(f"Email verification error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend verification email"""
    try:
        data = request.get_json()
        
        if 'email' not in data:
            return jsonify({'message': 'Email is required'}), 400
        
        email = data['email'].lower().strip()
        user = User.query.filter_by(email=email, auth_provider='local').first()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        if user.is_verified:
            return jsonify({'message': 'Email already verified'}), 200
        
        # Generate new verification token
        user.verification_token = generate_verification_token()
        db.session.commit()
        
        # Send verification email
        # send_verification_email(user.email, user.first_name, user.verification_token)
        
        return jsonify({'message': 'Verification email sent successfully'}), 200
        
    except Exception as e:
        print(f"Resend verification error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/user')
@require_auth
def get_user():
    """Get current user info from JWT token"""
    try:
        user_id = request.user.get('user_id')
        workspace_id = request.user.get('workspace_id')
        user = User.query.get(user_id)
        workspace = Workspace.query.get(workspace_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'profile_image_url': user.profile_image_url,
            'is_verified': user.is_verified,
            'auth_provider': user.auth_provider,
            'workspace_id': workspace.id,
            "balance": workspace.balance,
            'created_at': user.created_at.isoformat(),
            'updated_at': user.updated_at.isoformat(),

        }), 200
        
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/logout', methods=['POST'])
@require_auth
def logout():
    """Logout user (JWT tokens are stateless, so this is informational)"""
    return jsonify({'message': 'Logged out successfully'}), 200

# Business Information Routes
@auth_bp.route('/business-info', methods=['GET'])
@require_auth
def get_business_info():
    """Get business information for current user and workspace"""
    try:
        user_id = request.user.get('user_id')
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'message': 'No workspace found'}), 400
        
        business_info = mongo_service.get_business_info(user_id, workspace_id)
        
        if business_info:
            # Remove MongoDB _id field for JSON serialization
            business_info.pop('_id', None)
            return jsonify(business_info), 200
        else:
            return jsonify({'exists': False}), 200
        
    except Exception as e:
        print(f"Get business info error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/business-info', methods=['POST'])
@require_auth
def save_business_info():
    """Save business information for current user and workspace"""
    try:
        user_id = request.user.get('user_id')
        workspace_id = request.user.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'message': 'No workspace found'}), 400
        
        data = request.get_json()
        
        # Validate required fields
        if not data or 'business_name' not in data or 'business_type' not in data:
            return jsonify({'message': 'Business name and type are required'}), 400
        
        business_name = data['business_name'].strip()
        business_type = data['business_type'].strip()
        
        if not business_name:
            return jsonify({'message': 'Business name cannot be empty'}), 400
        
        if business_type not in BUSINESS_TYPES:
            return jsonify({'message': 'Invalid business type'}), 400
        
        # Save to MongoDB
        success = mongo_service.save_business_info(user_id, workspace_id, business_name, business_type)
        
        if success:
            return jsonify({
                'message': 'Business information saved successfully',
                'business_name': business_name,
                'business_type': business_type
            }), 200
        else:
            return jsonify({'message': 'Failed to save business information'}), 500
        
    except Exception as e:
        print(f"Save business info error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/business-types', methods=['GET'])
def get_business_types():
    """Get list of available business types"""
    return jsonify({'business_types': BUSINESS_TYPES}), 200

# Password Reset Routes
@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email"""
    try:
        data = request.get_json()
        
        if 'email' not in data:
            return jsonify({'message': 'Email is required'}), 400
        
        email = data['email'].lower().strip()
        user = User.query.filter_by(email=email, auth_provider='local').first()
        
        if not user:
            return jsonify({'message': 'If an account with this email exists, a reset link will be sent.'}), 200
        
        # Generate reset token and expiry (1 hour)
        reset_token = generate_reset_token()
        reset_expiry = datetime.utcnow() + timedelta(hours=1)
        
        user.reset_token = reset_token
        user.reset_token_expiry = reset_expiry
        db.session.commit()
        
        # Send reset email
        send_password_reset_email(user.email, user.first_name, reset_token)
        
        return jsonify({'message': 'If an account with this email exists, a reset link will be sent.'}), 200
        
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/reset-password/<token>', methods=['GET'])
def reset_password_form(token):
    """Show password reset form"""
    try:
        user = User.query.filter_by(reset_token=token).first()

        frontend_host = os.getenv("FRONTEND_HOST", "http://localhost:5174/")
        
        if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
            return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalid Reset Link - Nexus AI Hub</title>
        <style>
            body {{
                font-family: 'Inter', Arial, sans-serif;
                background: #0f172a;
                color: #e2e8f0;
                margin: 0;
                padding: 20px;
            }}
            .container {{
                max-width: 400px;
                margin: 100px auto;
                text-align: center;
                background: #1e293b;
                padding: 40px;
                border-radius: 16px;
                border: 1px solid #334155;
                box-shadow: 0 6px 16px rgba(0,0,0,0.4);
            }}
            .logo {{
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px auto;
            }}
            .logo span {{
                color: white;
                font-weight: bold;
                font-size: 24px;
            }}
            h1 {{
                color: #f1f5f9;
                margin: 0 0 15px 0;
                font-size: 26px;
            }}
            p {{
                color: #94a3b8;
                margin: 12px 0;
            }}
            a {{
                display: inline-block;
                margin-top: 15px;
                padding: 10px 20px;
                background: #6366f1;
                color: #fff;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 500;
                transition: background 0.2s ease-in-out;
            }}
            a:hover {{
                background: #4f46e5;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo"><span>N</span></div>
            <h1>Invalid Reset Link</h1>
            <p>This password reset link is invalid or has expired.</p>
            <a href="{frontend_host}auth">Request a new reset link</a>
        </div>
    </body>
    </html>
    """, 400
        
        # Return password reset form
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reset Password - Nexus AI Hub</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: 'Inter', Arial, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }}
                .container {{ max-width: 400px; margin: 50px auto; background: #1e293b; padding: 40px; border-radius: 16px; border: 1px solid #334155; }}
                .logo {{ width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 20px auto; }}
                h1 {{ color: #f1f5f9; text-align: center; margin: 0 0 30px 0; font-size: 24px; }}
                input {{ width: 100%; padding: 12px; border: 1px solid #334155; border-radius: 8px; background: #0f172a; color: #e2e8f0; margin-bottom: 16px; box-sizing: border-box; }}
                button {{ width: 100%; padding: 12px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }}
                button:hover {{ opacity: 0.9; }}
                .message {{ margin-top: 16px; padding: 12px; border-radius: 8px; }}
                .error {{ background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #fecaca; }}
                .success {{ background: rgba(34, 197, 94, 0.1); border: 1px solid #22c55e; color: #bbf7d0; }}
            </style>
        </head>
        <body>
            <div class="container"> <div style="display:grid">
                <div class="logo"><span style="color: white; font-weight: bold; font-size: 24px;">N</span></div>
                <h1>Reset Your Password</h1> </div>
                <form id="resetForm">
                    <input type="password" id="password" placeholder="New Password" required minlength="6">
                    <input type="password" id="confirmPassword" placeholder="Confirm Password" required minlength="6">
                    <button type="submit">Reset Password</button>
                </form>
                <div id="message" class="message" style="display: none;"></div>
            </div>
            
            <script>
                document.getElementById('resetForm').addEventListener('submit', async (e) => {{
                    e.preventDefault();
                    
                    const password = document.getElementById('password').value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    const messageDiv = document.getElementById('message');
                    
                    if (password !== confirmPassword) {{
                        messageDiv.className = 'message error';
                        messageDiv.textContent = 'Passwords do not match';
                        messageDiv.style.display = 'block';
                        return;
                    }}
                    
                    try {{
                        const response = await fetch('/api/reset-password', {{
                            method: 'POST',
                            headers: {{ 'Content-Type': 'application/json' }},
                            body: JSON.stringify({{ token: '{token}', password: password }})
                        }});
                        
                        const data = await response.json();
                        
                        if (response.ok) {{
                            messageDiv.className = 'message success';
                            messageDiv.textContent = data.message;
                            messageDiv.style.display = 'block';
                            setTimeout(() => window.location.href = '{frontend_host}auth', 2000);
                        }} else {{
                            messageDiv.className = 'message error';
                            messageDiv.textContent = data.message;
                            messageDiv.style.display = 'block';
                        }}
                    }} catch (error) {{
                        messageDiv.className = 'message error';
                        messageDiv.textContent = 'An error occurred. Please try again.';
                        messageDiv.style.display = 'block';
                    }}
                }});
            </script>
        </body>
        </html>
        """
        
    except Exception as e:
        print(f"Reset password form error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token"""
    try:
        data = request.get_json()
        
        if 'token' not in data or 'password' not in data:
            return jsonify({'message': 'Token and password are required'}), 400
        
        token = data['token']
        new_password = data['password']
        
        if len(new_password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters long'}), 400
        
        user = User.query.filter_by(reset_token=token).first()
        
        if not user or not user.reset_token_expiry or user.reset_token_expiry < datetime.utcnow():
            return jsonify({'message': 'Invalid or expired reset token'}), 400
        
        # Update password and clear reset token
        user.password_hash = generate_password_hash(new_password)
        user.reset_token = None
        user.reset_token_expiry = None
        db.session.commit()
        
        return jsonify({'message': 'Password reset successfully! You can now log in with your new password.'}), 200
        
    except Exception as e:
        print(f"Reset password error: {e}")
        return jsonify({'message': 'Internal server error'}), 500

# Workspace routes
@workspace_bp.route('/workspaces', methods=['GET'])
@require_auth
def get_workspaces():
    try:
        user_id = request.user.get('user_id')
        
        # Get workspaces where user is a member
        workspaces = db.session.query(Workspace)\
            .join(WorkspaceMember)\
            .filter(WorkspaceMember.user_id == user_id)\
            .all()
        
        result = []
        for workspace in workspaces:
            # Get workspace members
            members = db.session.query(WorkspaceMember, User)\
                .join(User)\
                .filter(WorkspaceMember.workspace_id == workspace.id)\
                .all()
            
            workspace_data = {
                'id': workspace.id,
                'name': workspace.name,
                'description': workspace.description,
                'owner_id': workspace.owner_id,
                'created_at': workspace.created_at.isoformat() if workspace.created_at else None,
                'updated_at': workspace.updated_at.isoformat() if workspace.updated_at else None,
                'owner': {
                    'id': workspace.owner.id,
                    'email': workspace.owner.email,
                    'first_name': workspace.owner.first_name,
                    'last_name': workspace.owner.last_name,
                    'profile_image_url': workspace.owner.profile_image_url
                },
                'members': [{
                    'id': member.id,
                    'workspace_id': member.workspace_id,
                    'user_id': member.user_id,
                    'role': member.role,
                    'joined_at': member.joined_at.isoformat() if member.joined_at else None,
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'profile_image_url': user.profile_image_url
                    }
                } for member, user in members]
            }
            result.append(workspace_data)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Get workspaces error: {e}")
        return jsonify({'message': 'Failed to fetch workspaces'}), 500

@workspace_bp.route('/workspaces', methods=['POST'])
@require_auth
def create_workspace():
    try:
        user_id = request.user.get('user_id')
        data = request.get_json()
        
        if not data or not data.get('name'):
            return jsonify({'message': 'Workspace name is required'}), 400
        
        workspace = Workspace(
            name=data['name'],
            description=data.get('description', ''),
            owner_id=user_id
        )
        db.session.add(workspace)
        db.session.flush()  # Get the ID
        
        # Add owner as admin member
        member = WorkspaceMember(
            workspace_id=workspace.id,
            user_id=user_id,
            role='owner'
        )
        db.session.add(member)
        db.session.commit()
        
        return jsonify({
            'id': workspace.id,
            'name': workspace.name,
            'description': workspace.description,
            'ownerId': workspace.owner_id,
            'createdAt': workspace.created_at.isoformat(),
            'updatedAt': workspace.updated_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Create workspace error: {e}")
        return jsonify({'message': 'Failed to create workspace'}), 400

@workspace_bp.route('/workspaces/<workspace_id>')
@require_auth
def get_workspace(workspace_id):
    try:
        workspace = Workspace.query.filter_by(id=workspace_id).first()
        if not workspace:
            return jsonify({'message': 'Workspace not found'}), 404
        
        # Get workspace members
        members = db.session.query(WorkspaceMember, User)\
            .join(User)\
            .filter(WorkspaceMember.workspace_id == workspace_id)\
            .all()
        
        return jsonify({
            'id': workspace.id,
            'name': workspace.name,
            'description': workspace.description,
            'ownerId': workspace.owner_id,
            'createdAt': workspace.created_at.isoformat(),
            'updatedAt': workspace.updated_at.isoformat(),
            'owner': {
                'id': workspace.owner.id,
                'email': workspace.owner.email,
                'firstName': workspace.owner.first_name,
                'lastName': workspace.owner.last_name,
                'profileImageUrl': workspace.owner.profile_image_url
            },
            'members': [{
                'id': member.id,
                'workspaceId': member.workspace_id,
                'userId': member.user_id,
                'role': member.role,
                'joinedAt': member.joined_at.isoformat(),
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'firstName': user.first_name,
                    'lastName': user.last_name,
                    'profileImageUrl': user.profile_image_url
                }
            } for member, user in members]
        })
        
    except Exception as e:
        print(f"Get workspace error: {e}")
        return jsonify({'message': 'Failed to fetch workspace'}), 500

@workspace_bp.route('/workspaces/<workspace_id>/balance')
@require_auth
def get_workspace_balance(workspace_id):
    try:
        workspace = Workspace.query.filter_by(id=workspace_id).first()
        if not workspace:
            return jsonify({'message': 'Workspace not found'}), 404
        
        return jsonify({
            'balance': workspace.balance,
            'workspaceId': workspace.id
        })
        
    except Exception as e:
        print(f"Get workspace balance error: {e}")
        return jsonify({'message': 'Failed to fetch workspace balance'}), 500

# Conversation routes
@conversation_bp.route('/workspaces/<workspace_id>/conversations')
@require_auth
def get_conversations(workspace_id):
    try:
        conversations = Conversation.query\
            .filter_by(workspace_id=workspace_id)\
            .order_by(Conversation.updated_at.desc())\
            .all()
        
        return jsonify([{
            'id': conv.id,
            'title': conv.title,
            'workspaceId': conv.workspace_id,
            'userId': conv.user_id,
            'model': conv.model,
            'createdAt': conv.created_at.isoformat(),
            'updatedAt': conv.updated_at.isoformat()
        } for conv in conversations])
        
    except Exception as e:
        print(f"Get conversations error: {e}")
        return jsonify({'message': 'Failed to fetch conversations'}), 500

@conversation_bp.route('/workspaces/<workspace_id>/conversations', methods=['POST'])
@require_auth
def create_conversation(workspace_id):
    try:
        user_id = session['user']['sub']
        data = request.get_json()
        
        conversation = Conversation(
            title=data.get('title'),
            workspace_id=workspace_id,
            user_id=user_id,
            model=data.get('model', 'gpt-4')
        )
        db.session.add(conversation)
        db.session.commit()
        
        return jsonify({
            'id': conversation.id,
            'title': conversation.title,
            'workspaceId': conversation.workspace_id,
            'userId': conversation.user_id,
            'model': conversation.model,
            'createdAt': conversation.created_at.isoformat(),
            'updatedAt': conversation.updated_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Create conversation error: {e}")
        return jsonify({'message': 'Failed to create conversation'}), 400

@conversation_bp.route('/conversations/<conversation_id>')
@require_auth
def get_conversation(conversation_id):
    try:
        conversation = Conversation.query.filter_by(id=conversation_id).first()
        if not conversation:
            return jsonify({'message': 'Conversation not found'}), 404
        
        messages = Message.query\
            .filter_by(conversation_id=conversation_id)\
            .order_by(Message.created_at)\
            .all()
        
        return jsonify({
            'id': conversation.id,
            'title': conversation.title,
            'workspaceId': conversation.workspace_id,
            'userId': conversation.user_id,
            'model': conversation.model,
            'createdAt': conversation.created_at.isoformat(),
            'updatedAt': conversation.updated_at.isoformat(),
            'messages': [{
                'id': msg.id,
                'conversationId': msg.conversation_id,
                'content': msg.content,
                'role': msg.role,
                'model': msg.model,
                'tokens': msg.tokens,
                'createdAt': msg.created_at.isoformat()
            } for msg in messages]
        })
        
    except Exception as e:
        print(f"Get conversation error: {e}")
        return jsonify({'message': 'Failed to fetch conversation'}), 500

# Message routes
@message_bp.route('/conversations/<conversation_id>/messages', methods=['POST'])
@require_auth
def create_message(conversation_id):
    try:
        data = request.get_json()
        
        message = Message(
            conversation_id=conversation_id,
            content=data['content'],
            role=data['role'],
            model=data.get('model')
        )
        db.session.add(message)
        db.session.flush()
        
        # Update conversation timestamp
        conversation = Conversation.query.filter_by(id=conversation_id).first()
        if conversation:
            conversation.updated_at = datetime.utcnow()
        
        # Create AI response for user messages
        response_data = {'userMessage': {
            'id': message.id,
            'conversationId': message.conversation_id,
            'content': message.content,
            'role': message.role,
            'model': message.model,
            'tokens': message.tokens,
            'createdAt': message.created_at.isoformat()
        }}
        
        if data['role'] == 'user':
            ai_message = Message(
                conversation_id=conversation_id,
                content=f"I received your message: \"{data['content']}\". This is a placeholder response. AI integration should be implemented here.",
                role='assistant',
                model='gpt-4'
            )
            db.session.add(ai_message)
            db.session.flush()
            
            response_data['aiResponse'] = {
                'id': ai_message.id,
                'conversationId': ai_message.conversation_id,
                'content': ai_message.content,
                'role': ai_message.role,
                'model': ai_message.model,
                'tokens': ai_message.tokens,
                'createdAt': ai_message.created_at.isoformat()
            }
        
        db.session.commit()
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Create message error: {e}")
        return jsonify({'message': 'Failed to create message'}), 400