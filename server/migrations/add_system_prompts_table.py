"""
Migration: Add system_prompts table

This migration creates the system_prompts table for managing AI system prompts.
"""
from sqlalchemy import text
from database import db

def upgrade():
    """Create system_prompts table"""
    try:
        with db.engine.connect() as conn:
            # Create system_prompts table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS system_prompts (
                    id VARCHAR PRIMARY KEY,
                    workspace_id VARCHAR NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    prompt TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id) ON DELETE CASCADE
                )
            """))
            
            # Create index on workspace_id for better performance
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_system_prompts_workspace_id 
                ON system_prompts (workspace_id)
            """))
            
            # Create index on is_active for better performance when finding active prompts
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_system_prompts_active 
                ON system_prompts (workspace_id, is_active) 
                WHERE is_active = TRUE
            """))
            
            conn.commit()
            print("✅ Successfully created system_prompts table")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

def downgrade():
    """Drop system_prompts table"""
    try:
        with db.engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS system_prompts"))
            conn.commit()
            print("✅ Successfully dropped system_prompts table")
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise

if __name__ == "__main__":
    print("Running migration: Add system_prompts table...")
    upgrade()