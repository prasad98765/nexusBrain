"""
Migration: Add document_contexts column to api_usage_logs table

This migration adds a boolean column to track whether RAG document contexts were used in a request.
"""
import os
import sys

# Get the absolute path of the current script
script_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the 'nexusBrain' directory (two levels up from current script)
project_root = os.path.abspath(os.path.join(script_dir, '..', '..'))
# Add 'nexusBrain' to sys.path to make 'server' importable
sys.path.insert(0, project_root)

from sqlalchemy import text
from server.database import db

def upgrade():
    """Add document_contexts column"""
    try:
        with db.engine.connect() as conn:
            # Add the column with a default value
            conn.execute(text("""
                ALTER TABLE api_usage_logs 
                ADD COLUMN IF NOT EXISTS document_contexts BOOLEAN DEFAULT FALSE
            """))
            conn.commit()
            print("✅ Successfully added document_contexts column to api_usage_logs table")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

def downgrade():
    """Remove document_contexts column"""
    try:
        with db.engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE api_usage_logs 
                DROP COLUMN IF EXISTS document_contexts
            """))
            conn.commit()
            print("✅ Successfully removed document_contexts column from api_usage_logs table")
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise

if __name__ == "__main__":
    print("Running migration: Add document_contexts column...")
    upgrade()
