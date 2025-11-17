"""
Recreate all database tables from models
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

def recreate_tables():
    """Recreate all tables from model definitions"""
    from server.app import create_app
    from server.database import db
    
    app = create_app()
    
    with app.app_context():
        print("Creating all database tables from models...")
        db.create_all()
        print("✅ All tables created successfully")

if __name__ == '__main__':
    recreate_tables()
