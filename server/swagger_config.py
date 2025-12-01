"""
Swagger/OpenAPI Configuration for Nexus AI Hub API
Provides comprehensive API documentation with schemas, examples, and authentication details
"""
import os

# Get dynamic host and port from environment variables
SWAGGER_HOST = os.getenv('SWAGGER_HOST', os.getenv('API_HOST', '127.0.0.1'))
SWAGGER_PORT = os.getenv('SWAGGER_PORT', os.getenv('API_PORT', '5001'))
SWAGGER_SCHEME = os.getenv('SWAGGER_SCHEME', 'http')

# Construct the host:port string
if SWAGGER_PORT in ['80', '443']:
    HOST_STRING = SWAGGER_HOST
else:
    HOST_STRING = f"{SWAGGER_HOST}:{SWAGGER_PORT}"

# Swagger template configuration
swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "Nexus AI Hub API",
        "description": "Comprehensive API documentation for Nexus AI Hub - AI-powered workspace management, conversational AI, RAG, and LangGraph flow orchestration",
        "contact": {
            "name": "Nexus AI Hub Support",
            "url": "https://nexusaihub.com",
            "email": "support@nexusaihub.com"
        },
        "version": "1.0.0",
        "license": {
            "name": "Proprietary",
            "url": "https://nexusaihub.com/license"
        }
    },
    "host": HOST_STRING,
    "basePath": "/api",
    "schemes": [SWAGGER_SCHEME],
    "securityDefinitions": {
        "Bearer": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.\n\nExample: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'"
        },
        "ApiKey": {
            "type": "apiKey",
            "name": "X-API-Key",
            "in": "header",
            "description": "API key for programmatic access (if applicable)"
        }
    },
    "tags": [
        {
            "name": "Authentication",
            "description": "User authentication and authorization endpoints"
        },
        {
            "name": "Workspaces",
            "description": "Workspace management operations"
        },
        {
            "name": "Conversations",
            "description": "Conversation and message management"
        },
        {
            "name": "Contacts",
            "description": "Contact management for CRM"
        },
        {
            "name": "Agents",
            "description": "AI agent configuration and management"
        },
        {
            "name": "Flow Agents",
            "description": "LangGraph flow-based agent orchestration"
        },
        {
            "name": "API Library",
            "description": "External API integration library"
        },
        {
            "name": "Variables",
            "description": "Variable management and mapping"
        },
        {
            "name": "LLM",
            "description": "Language model operations and routing"
        },
        {
            "name": "RAG",
            "description": "Retrieval-Augmented Generation operations"
        },
        {
            "name": "Q&A",
            "description": "Question-Answer system with caching"
        },
        {
            "name": "Analytics",
            "description": "Usage analytics and insights"
        },
        {
            "name": "System Prompts",
            "description": "System prompt management"
        },
        {
            "name": "Model Configuration",
            "description": "AI model configuration and selection"
        },
        {
            "name": "Scripts",
            "description": "Script management and execution"
        },
        {
            "name": "WebBot",
            "description": "Web chatbot embed functionality"
        }
    ],
    "definitions": {
        "Error": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "description": "Error message"
                },
                "code": {
                    "type": "integer",
                    "description": "Error code"
                }
            }
        },
        "User": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "User unique identifier"},
                "email": {"type": "string", "format": "email", "description": "User email address"},
                "first_name": {"type": "string", "description": "User first name"},
                "last_name": {"type": "string", "description": "User last name"},
                "profile_image_url": {"type": "string", "description": "Profile image URL"},
                "is_verified": {"type": "boolean", "description": "Email verification status"},
                "auth_provider": {"type": "string", "enum": ["local", "google"], "description": "Authentication provider"},
                "workspace_id": {"type": "string", "description": "Default workspace ID"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"}
            }
        },
        "SignupRequest": {
            "type": "object",
            "required": ["email", "password", "first_name", "last_name"],
            "properties": {
                "email": {"type": "string", "format": "email", "example": "user@example.com"},
                "password": {"type": "string", "minLength": 6, "example": "SecurePass123"},
                "first_name": {"type": "string", "example": "John"},
                "last_name": {"type": "string", "example": "Doe"}
            }
        },
        "LoginRequest": {
            "type": "object",
            "required": ["email", "password"],
            "properties": {
                "email": {"type": "string", "format": "email", "example": "user@example.com"},
                "password": {"type": "string", "example": "SecurePass123"}
            }
        },
        "GoogleAuthRequest": {
            "type": "object",
            "required": ["google_token"],
            "properties": {
                "google_token": {"type": "string", "description": "Google OAuth token"}
            }
        },
        "AuthResponse": {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "token": {"type": "string", "description": "JWT authentication token"},
                "user": {"$ref": "#/definitions/User"}
            }
        },
        "Workspace": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "owner_id": {"type": "string"},
                "balance": {"type": "number", "format": "float"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"}
            }
        },
        "CreateWorkspaceRequest": {
            "type": "object",
            "required": ["name"],
            "properties": {
                "name": {"type": "string", "example": "My Workspace"},
                "description": {"type": "string", "example": "Workspace description"}
            }
        },
        "Conversation": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "title": {"type": "string"},
                "workspace_id": {"type": "string"},
                "user_id": {"type": "string"},
                "model": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"}
            }
        },
        "Message": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "conversation_id": {"type": "string"},
                "content": {"type": "string"},
                "role": {"type": "string", "enum": ["user", "assistant", "system"]},
                "model": {"type": "string"},
                "tokens": {"type": "integer"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "CreateMessageRequest": {
            "type": "object",
            "required": ["content", "role"],
            "properties": {
                "content": {"type": "string", "example": "Hello, how can you help me?"},
                "role": {"type": "string", "enum": ["user", "assistant"], "example": "user"},
                "model": {"type": "string", "example": "gpt-4"}
            }
        },
        "Contact": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "workspace_id": {"type": "string"},
                "name": {"type": "string"},
                "email": {"type": "string", "format": "email"},
                "phone": {"type": "string"},
                "tags": {"type": "array", "items": {"type": "string"}},
                "custom_fields": {"type": "object"},
                "created_at": {"type": "string", "format": "date-time"},
                "updated_at": {"type": "string", "format": "date-time"}
            }
        },
        "CreateContactRequest": {
            "type": "object",
            "required": ["name"],
            "properties": {
                "name": {"type": "string", "example": "Jane Smith"},
                "email": {"type": "string", "format": "email", "example": "jane@example.com"},
                "phone": {"type": "string", "example": "+1234567890"},
                "tags": {"type": "array", "items": {"type": "string"}, "example": ["customer", "vip"]},
                "custom_fields": {"type": "object", "example": {"company": "Acme Corp", "position": "Manager"}}
            }
        },
        "Agent": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "workspace_id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "type": {"type": "string", "enum": ["conversational", "task", "flow"]},
                "config": {"type": "object"},
                "is_active": {"type": "boolean"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "FlowAgent": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "workspace_id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "flow_data": {"type": "object", "description": "LangGraph flow configuration"},
                "is_active": {"type": "boolean"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "Variable": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "workspace_id": {"type": "string"},
                "name": {"type": "string"},
                "value": {"type": "string"},
                "type": {"type": "string", "enum": ["system", "user", "dynamic"]},
                "is_system": {"type": "boolean"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "APILibraryItem": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "workspace_id": {"type": "string"},
                "name": {"type": "string"},
                "method": {"type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]},
                "url": {"type": "string"},
                "headers": {"type": "object"},
                "auth_type": {"type": "string"},
                "created_at": {"type": "string", "format": "date-time"}
            }
        },
        "RAGDocument": {
            "type": "object",
            "properties": {
                "filename": {"type": "string"},
                "chunks": {"type": "integer"},
                "timestamp": {"type": "string", "format": "date-time"},
                "size": {"type": "integer"}
            }
        },
        "RAGQuery": {
            "type": "object",
            "required": ["question"],
            "properties": {
                "question": {"type": "string", "example": "What is the company policy on remote work?"},
                "workspace_id": {"type": "string"},
                "top_k": {"type": "integer", "default": 5, "description": "Number of relevant chunks to retrieve"}
            }
        },
        "AnalyticsResponse": {
            "type": "object",
            "properties": {
                "total_conversations": {"type": "integer"},
                "total_messages": {"type": "integer"},
                "total_tokens": {"type": "integer"},
                "period": {"type": "string"},
                "breakdown": {"type": "object"}
            }
        },
        "ModelConfigRequest": {
            "type": "object",
            "properties": {
                "model_id": {"type": "string", "example": "gpt-4"},
                "temperature": {"type": "number", "format": "float", "minimum": 0, "maximum": 2, "example": 0.7},
                "max_tokens": {"type": "integer", "example": 2000},
                "top_p": {"type": "number", "format": "float", "example": 1.0}
            }
        }
    },
    "responses": {
        "UnauthorizedError": {
            "description": "Authentication required or invalid token",
            "schema": {"$ref": "#/definitions/Error"}
        },
        "ForbiddenError": {
            "description": "Insufficient permissions",
            "schema": {"$ref": "#/definitions/Error"}
        },
        "NotFoundError": {
            "description": "Resource not found",
            "schema": {"$ref": "#/definitions/Error"}
        },
        "BadRequestError": {
            "description": "Invalid request parameters",
            "schema": {"$ref": "#/definitions/Error"}
        },
        "InternalServerError": {
            "description": "Internal server error",
            "schema": {"$ref": "#/definitions/Error"}
        }
    }
}

# Swagger configuration
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": 'apispec',
            "route": '/apispec.json',
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/swagger",
    "swagger_ui_config": {
        "docExpansion": "list",  # Show operations list by default
        "defaultModelsExpandDepth": 3,  # Expand models
        "defaultModelExpandDepth": 3,
        "displayRequestDuration": True,  # Show request duration
        "filter": True,  # Enable search/filter
        "showExtensions": True,
        "showCommonExtensions": True,
        "persistAuthorization": True,  # Remember authorization between page refreshes
    },
    # Custom CSS for Nexus AI Hub theme
      "custom_css_url": "/static/swagger-custom.css?v=1",
    "displayRequestDuration": True,
    "persistAuthorization": True,
}
