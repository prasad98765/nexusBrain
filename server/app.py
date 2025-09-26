import os
import logging
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_session import Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SESSION_SECRET', 'dev-secret-key')
    # Use the actual DATABASE_URL from environment with psycopg2
    database_url = os.getenv('DATABASE_URL')
    if database_url and database_url.startswith('postgresql://'):
        # Convert postgresql:// to postgresql+psycopg2:// for SQLAlchemy
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg2://')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Google OAuth configuration
    os.environ['GOOGLE_CLIENT_ID'] = '721339353722-aqnl6orqhu784lo1csncj24rbh28b9n6.apps.googleusercontent.com'
    os.environ['GOOGLE_CLIENT_SECRET'] = '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'
    
    # Session configuration for PostgreSQL
    app.config['SESSION_TYPE'] = 'sqlalchemy'
    app.config['SESSION_SQLALCHEMY'] = db
    app.config['SESSION_SQLALCHEMY_TABLE'] = 'flask_sessions'
    app.config['SESSION_PERMANENT'] = False
    app.config['SESSION_USE_SIGNER'] = True
    app.config['SESSION_KEY_PREFIX'] = 'nexus:'
    app.config['PERMANENT_SESSION_LIFETIME'] = 7 * 24 * 60 * 60  # 7 days
    
    # Initialize extensions with app
    db.init_app(app)
    # Update CORS to include embed script domains
    CORS(app, origins=['*'], 
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
    Session(app)
    
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Register blueprints
    from server.routes import auth_bp, workspace_bp, conversation_bp, message_bp, static_bp
    from server.contacts_routes import contacts_bp
    from server.agents_routes import agents_bp
    from server.conversation_routes import conversations_bp
    from server.api_tokens_routes import api_tokens_bp
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(workspace_bp, url_prefix='/api')
    app.register_blueprint(conversation_bp, url_prefix='/api')
    app.register_blueprint(message_bp, url_prefix='/api')
    app.register_blueprint(contacts_bp, url_prefix='/api')
    app.register_blueprint(agents_bp, url_prefix='/api')
    app.register_blueprint(conversations_bp, url_prefix='/api')
    app.register_blueprint(api_tokens_bp, url_prefix='/api')
    app.register_blueprint(static_bp)
    
    # Import send_file
    from flask import send_file
    
    # Serve agent.js at root level (without /api prefix)
    @app.route('/agent.js')
    def serve_embed_script():
        script_path = os.path.join(os.getcwd(), 'public', 'agent.js')
        return send_file(script_path, mimetype='application/javascript')
    
    # Initialize MongoDB connection
    from server.mongo_service import mongo_service
    mongo_service.connect()
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)