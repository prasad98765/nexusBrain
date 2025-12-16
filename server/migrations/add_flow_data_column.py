"""Add flow_data column to script_settings table"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from sqlalchemy import text
from server.database import db

def upgrade():
    """Add flow_data column to script_settings table"""
    try:
        with db.engine.connect() as conn:
            # Add flow_data column
            conn.execute(text("""
                ALTER TABLE script_settings 
                ADD COLUMN IF NOT EXISTS flow_data JSON DEFAULT NULL
            """))
            
            conn.commit()
            print("✅ Successfully added flow_data column to script_settings table")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

def downgrade():
    """Remove flow_data column from script_settings table"""
    try:
        with db.engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE script_settings 
                DROP COLUMN IF EXISTS flow_data
            """))
            
            conn.commit()
            print("✅ Successfully removed flow_data column from script_settings table")
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise

if __name__ == "__main__":
    from server.app import create_app
    
    app = create_app()
    with app.app_context():
        upgrade()
