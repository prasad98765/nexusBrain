"""
Migration script to update flow_agents table schema to match new requirements
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from server.app import create_app
from server.database import db
from sqlalchemy import text

def upgrade():
    """Update flow_agents table schema"""
    app = create_app()
    with app.app_context():
        with db.engine.connect() as conn:
            print("\n🔧 Updating flow_agents table schema...")
            
            # Add flow_data column if not exists
            try:
                conn.execute(text("""
                    ALTER TABLE flow_agents 
                    ADD COLUMN IF NOT EXISTS flow_data JSON
                """))
                print("✅ Added flow_data column")
            except Exception as e:
                print(f"⚠️  flow_data: {e}")
            
            # Add is_active column if not exists
            try:
                conn.execute(text("""
                    ALTER TABLE flow_agents 
                    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
                """))
                print("✅ Added is_active column")
            except Exception as e:
                print(f"⚠️  is_active: {e}")
            
            # Add configuration column if not exists
            try:
                conn.execute(text("""
                    ALTER TABLE flow_agents 
                    ADD COLUMN IF NOT EXISTS configuration JSON
                """))
                print("✅ Added configuration column")
            except Exception as e:
                print(f"⚠️  configuration: {e}")
            
            # Drop prompt column if it exists (replaced by configuration.promptInstructions)
            try:
                conn.execute(text("""
                    ALTER TABLE flow_agents 
                    DROP COLUMN IF EXISTS prompt
                """))
                print("✅ Removed old prompt column")
            except Exception as e:
                print(f"⚠️  prompt removal: {e}")
            
            conn.commit()
            print("\n✅ Schema update completed successfully!")

if __name__ == "__main__":
    upgrade()
