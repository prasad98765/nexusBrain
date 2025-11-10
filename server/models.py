from datetime import datetime
from uuid import uuid4
from .database import db

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
    reset_token = db.Column(db.String(100), nullable=True)
    reset_token_expiry = db.Column(db.DateTime, nullable=True)
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
    balance = db.Column(db.Float, default=10.0, nullable=False)  # User balance initialized to 100
    model_config = db.Column(db.JSON)  # Model configuration for categories
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
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=True)  # Nullable for agent conversations
    agent_id = db.Column(db.String, db.ForeignKey('agents.id'), nullable=True)  # For agent conversations
    model = db.Column(db.String(50), default='gpt-4')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    messages = db.relationship('Message', backref='conversation', lazy=True)
    agent = db.relationship('Agent', backref='conversations', lazy=True)

class Message(db.Model):
    __tablename__ = 'messages'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    conversation_id = db.Column(db.String, db.ForeignKey('conversations.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # user, assistant, system
    model = db.Column(db.String(50))
    tokens = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Contact(db.Model):
    __tablename__ = 'contacts'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), nullable=True)  # Make email optional for chat users
    phone = db.Column(db.String(50))
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), nullable=False)
    custom_fields = db.Column(db.JSON)  # Store custom field data as JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workspace = db.relationship('Workspace', backref='contacts', lazy=True)

class CustomField(db.Model):
    __tablename__ = 'custom_fields'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    name = db.Column(db.String(20), nullable=False)
    field_type = db.Column(db.String(50), nullable=False)  # string, number, date, dropdown, radio, multiselect
    options = db.Column(db.JSON)  # For dropdown and radio types
    required = db.Column(db.Boolean, default=False)
    show_in_form = db.Column(db.Boolean, default=True)
    # default_model = db.Column(db.String(50), default="gpt-4")
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    
    # Relationships
    workspace = db.relationship('Workspace', backref='custom_fields', lazy=True)

class Agent(db.Model):
    __tablename__ = 'agents'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # web, whatsapp, voice
    description = db.Column(db.Text)
    status = db.Column(db.String(50), default='draft')  # draft, published, archived
    configuration = db.Column(db.JSON)  # Store agent-specific configuration
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workspace = db.relationship('Workspace', backref='agents', lazy=True)

# Session management is handled by Flask-Session with Redis
# No need for a separate FlaskSession model

class BusinessInfo(db.Model):
    __tablename__ = 'business_info'
    user_id = db.Column(db.String, db.ForeignKey('users.id'), primary_key=True)
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), primary_key=True)
    business_name = db.Column(db.String(255), nullable=False)
    business_type = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ApiToken(db.Model):
    __tablename__ = 'api_tokens'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    token = db.Column(db.String(64), nullable=False, unique=True)  # Store hashed token
    name = db.Column(db.String(255), nullable=True)  # Optional token name for user reference
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), nullable=False)
    user_id = db.Column(db.String, db.ForeignKey('users.id'), nullable=False)
    caching_enabled = db.Column(db.Boolean, default=True)  # Caching preference
    semantic_cache_threshold = db.Column(db.Float, default=0.5)  # Semantic similarity threshold (0.0-1.0), default 50%
    is_active = db.Column(db.Boolean, default=True)
    last_used_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workspace = db.relationship('Workspace', backref='api_tokens', lazy=True)
    user = db.relationship('User', backref='api_tokens', lazy=True)
    usage_logs = db.relationship('ApiUsageLog', backref='token', lazy=True)

class ApiUsageLog(db.Model):
    __tablename__ = 'api_usage_logs'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    token_id = db.Column(db.String, db.ForeignKey('api_tokens.id'), nullable=False)
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), nullable=False)
    endpoint = db.Column(db.String(100), nullable=False)  # /chat/completions, /completions, etc.
    model = db.Column(db.String(100), nullable=False)  # gpt-4, gpt-3.5-turbo, etc.
    model_permaslug = db.Column(db.String(200), nullable=True)  # Detailed model version
    provider = db.Column(db.String(50), nullable=True)  # OpenAI, Anthropic, etc.
    method = db.Column(db.String(10), default='POST')  # HTTP method
    status_code = db.Column(db.Integer, nullable=False)  # 200, 400, 500, etc.
    tokens_used = db.Column(db.Integer, default=0)  # Total tokens consumed
    prompt_tokens = db.Column(db.Integer, nullable=True)  # Prompt tokens
    completion_tokens = db.Column(db.Integer, nullable=True)  # Completion tokens
    reasoning_tokens = db.Column(db.Integer, nullable=True)  # Reasoning tokens
    usage = db.Column(db.Float, nullable=True)  # Cost in USD
    byok_usage_inference = db.Column(db.Float, nullable=True)  # BYOK usage cost
    requests = db.Column(db.Integer, default=1)  # Number of requests
    generation_id = db.Column(db.String(100), nullable=True)  # OpenRouter generation ID
    finish_reason = db.Column(db.String(50), nullable=True)  # Completion finish reason
    first_token_latency = db.Column(db.Float, nullable=True)  # First token latency in seconds
    throughput = db.Column(db.Float, nullable=True)  # Tokens per second
    response_time_ms = db.Column(db.Integer, nullable=True)  # Response time in milliseconds
    error_message = db.Column(db.Text, nullable=True)  # Error message if any
    ip_address = db.Column(db.String(45), nullable=True)  # Client IP address
    user_agent = db.Column(db.String(500), nullable=True)  # Client user agent
    cached = db.Column(db.Boolean, default=False)  # Whether response was served from cache
    cache_type = db.Column(db.String(20), nullable=True)  # "exact" or "semantic"
    document_contexts = db.Column(db.Boolean, default=False)  # Whether RAG contexts were used
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    workspace = db.relationship('Workspace', backref='api_usage_logs', lazy=True)


class SystemPrompt(db.Model):
    __tablename__ = 'system_prompts'
    
    id = db.Column(db.String, primary_key=True, default=lambda: str(uuid4()))
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    prompt = db.Column(db.Text, nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workspace = db.relationship('Workspace', backref='system_prompts', lazy=True)

class ScriptSettings(db.Model):
    __tablename__ = 'script_settings'
    
    workspace_id = db.Column(db.String, db.ForeignKey('workspaces.id'), primary_key=True)
    theme_settings = db.Column(db.JSON, nullable=False)
    quick_buttons = db.Column(db.JSON, nullable=True)  # Store quick action buttons
    model_config = db.Column(db.JSON, nullable=True)  # Store model configuration settings
    flow_data = db.Column(db.JSON, nullable=True)  # Store flow builder data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    workspace = db.relationship('Workspace', backref='script_settings', lazy=True)