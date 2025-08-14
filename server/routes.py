from flask import Blueprint, request, jsonify, session, redirect, url_for, send_from_directory, current_app
from .models import User, Workspace, WorkspaceMember, Conversation, Message, db
from .auth import require_auth, update_session, upsert_user
from datetime import datetime
import os

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

# Auth routes
@auth_bp.route('/login')
def login():
    # Simple redirect to Replit OAuth for now
    client_id = os.getenv('REPL_ID', '')
    issuer_url = os.getenv('ISSUER_URL', 'https://replit.com/oidc')
    redirect_uri = url_for('auth.callback', _external=True)
    
    auth_url = f"{issuer_url}/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=openid%20email%20profile%20offline_access"
    return redirect(auth_url)

@auth_bp.route('/callback')
def callback():
    try:
        # For now, create a mock session for development
        # This should be replaced with proper OAuth token exchange
        mock_claims = {
            'sub': 'mock_user_123',
            'email': 'user@example.com',
            'first_name': 'Test',
            'last_name': 'User',
            'profile_image_url': None
        }
        
        # Store mock session info
        session['access_token'] = 'mock_token'
        session['refresh_token'] = 'mock_refresh'
        session['expires_at'] = datetime.utcnow().timestamp() + 3600
        session['user'] = mock_claims
        
        # Create or update user
        upsert_user(mock_claims)
        
        return redirect('/')
        
    except Exception as e:
        print(f"Auth error: {e}")
        return redirect('/api/login')

@auth_bp.route('/logout')
def logout():
    session.clear()
    # Construct logout URL
    logout_url = f"{os.getenv('ISSUER_URL', 'https://replit.com/oidc')}/logout"
    redirect_uri = request.host_url
    return redirect(f"{logout_url}?client_id={os.getenv('REPL_ID')}&post_logout_redirect_uri={redirect_uri}")

@auth_bp.route('/auth/user')
@require_auth
def get_user():
    try:
        user_id = session['user']['sub']
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({
            'id': user.id,
            'email': user.email,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'profileImageUrl': user.profile_image_url,
            'createdAt': user.created_at.isoformat() if user.created_at else None,
            'updatedAt': user.updated_at.isoformat() if user.updated_at else None
        })
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'message': 'Failed to fetch user'}), 500

# Workspace routes
@workspace_bp.route('/workspaces', methods=['GET'])
@require_auth
def get_workspaces():
    try:
        user_id = session['user']['sub']
        
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
                'ownerId': workspace.owner_id,
                'createdAt': workspace.created_at.isoformat() if workspace.created_at else None,
                'updatedAt': workspace.updated_at.isoformat() if workspace.updated_at else None,
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
                    'joinedAt': member.joined_at.isoformat() if member.joined_at else None,
                    'user': {
                        'id': user.id,
                        'email': user.email,
                        'firstName': user.first_name,
                        'lastName': user.last_name,
                        'profileImageUrl': user.profile_image_url
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
        user_id = session['user']['sub']
        data = request.get_json()
        
        workspace = Workspace(
            name=data['name'],
            description=data.get('description'),
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