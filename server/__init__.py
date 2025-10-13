from .routes import auth_bp, workspace_bp, conversation_bp, message_bp, static_bp
from .contacts_routes import contacts_bp
from .agents_routes import agents_bp
from .conversation_routes import conversations_bp
from .api_tokens_routes import api_tokens_bp
from .llm_routes import api_llm_routes
from .qa_routes import qa_bp
from .webbot_routes import webbot_bp
from .rag_routes import rag_bp
# from .system_prompts_routes import system_prompts_bp

__all__ = [
    "auth_bp", "workspace_bp", "conversation_bp", "message_bp", "static_bp",
    "contacts_bp", "agents_bp", "conversations_bp", "api_tokens_bp",
    "api_llm_routes", "qa_bp", "webbot_bp", "rag_bp"
]
