from datetime import datetime
from uuid import uuid4
from .app import db

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    email = db.Column(db.String, unique=True, nullable=False)
    first_name = db.Column(db.String, nullable=False)
    last_name = db.Column(db.String)
    password_hash = db.Column(db.String(128))  # Null for OAuth users
    profile_image_url = db.Column(db.String)
    is_verified = db.Column(db.Boolean, default=False)
    verification_token = db.Column(db.String(100))
    auth_provider = db.Column(db.String(20), default='local')  # 'local' or 'google'
    google_id = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owned_workspaces = db.relationship('Workspace', backref='owner', lazy=True)
    workspace_memberships = db.relationship('WorkspaceMember', backref='user', lazy=True)
    conversations = db.relationship('Conversation', backref='user', lazy=True)

class Workspace(db.Model):
    __tablename__ = 'workspaces'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    members = db.relationship('WorkspaceMember', backref='workspace', lazy=True)
    conversations = db.relationship('Conversation', backref='workspace', lazy=True)

class WorkspaceMember(db.Model):
    __tablename__ = 'workspace_members'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), nullable=False)
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='member')  # owner, admin, member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

class Conversation(db.Model):
    __tablename__ = 'conversations'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    title = db.Column(db.String(255))
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), nullable=False)
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    model = db.Column(db.String(50), default='gpt-4')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='conversation', lazy=True)

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    conversation_id = db.Column(db.String, db.ForeignKey('conversations.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # user, assistant, system
    model = db.Column(db.String(50))
    tokens = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Session table for Flask-Session
class FlaskSession(db.Model):
    __tablename__ = 'flask_sessions'
    __table_args__ = {'extend_existing': True}
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(255), unique=True, nullable=False)
    data = db.Column(db.LargeBinary)
    expiry = db.Column(db.DateTime)

class BusinessInfo(db.Model):
    __tablename__ = 'business_info'
    user_id = db.Column(db.String, db.ForeignKey('users.id'), primary_key=True)
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), primary_key=True)
    business_name = db.Column(db.String(255), nullable=False)
    business_type = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)