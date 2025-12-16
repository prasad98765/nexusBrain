"""
Migration: Add api_library and api_library_runs tables
Creates tables to store API Library configurations and execution runs
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

def migrate():
    """Create api_library and api_library_runs tables"""
    from server.app import create_app
    from server.database import db
    from server.models import ApiLibrary, ApiLibraryRun
    
    app = create_app()
    
    with app.app_context():
        print("Creating api_library and api_library_runs tables...")
        db.create_all()
        print("✅ api_library tables created successfully")

if __name__ == '__main__':
    migrate()
