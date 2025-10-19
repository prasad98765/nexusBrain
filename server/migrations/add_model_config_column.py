"""
Migration: Add model_config column to workspaces table

This migration adds a JSON column to store model configuration for different categories.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from server.database import db

def upgrade():
    """Add model_config column to workspaces table"""
    try:
        with db.engine.connect() as conn:
            # Add model_config column
            conn.execute(text("""
                ALTER TABLE workspaces 
                ADD COLUMN IF NOT EXISTS model_config JSON DEFAULT NULL
            """))
            
            conn.commit()
            print("✅ Successfully added model_config column to workspaces table")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

def downgrade():
    """Remove model_config column from workspaces table"""
    try:
        with db.engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE workspaces 
                DROP COLUMN IF EXISTS model_config
            """))
            
            conn.commit()
            print("✅ Successfully removed model_config column from workspaces table")
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise

if __name__ == "__main__":
    from server.app import create_app
    
    app = create_app()
    with app.app_context():
        upgrade()
