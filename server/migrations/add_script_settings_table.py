"""
Add script_settings table migration

This migration creates the script_settings table to store theme customization
settings for each workspace's embed script.
"""

from server.database import db
from server.app import create_app

def run_migration():
    app = create_app()
    
    with app.app_context():
        # Create script_settings table
        db.engine.execute("""
            CREATE TABLE IF NOT EXISTS script_settings (
                workspace_id VARCHAR PRIMARY KEY REFERENCES workspaces(id),
                theme_settings JSON NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        print("✅ script_settings table created successfully")

if __name__ == '__main__':
    run_migration()
