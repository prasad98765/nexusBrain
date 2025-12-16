"""
Migration: Add rag_document_names column to api_usage_logs table

This migration adds a text column to track which RAG documents were used in a request.
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
    """Add rag_document_names column"""
    try:
        with db.engine.connect() as conn:
            # Add the column
            conn.execute(text("""
                ALTER TABLE api_usage_logs 
                ADD COLUMN IF NOT EXISTS rag_document_names TEXT DEFAULT NULL
            """))
            conn.commit()
            print("✅ Successfully added rag_document_names column to api_usage_logs table")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

def downgrade():
    """Remove rag_document_names column"""
    try:
        with db.engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE api_usage_logs 
                DROP COLUMN IF EXISTS rag_document_names
            """))
            conn.commit()
            print("✅ Successfully removed rag_document_names column from api_usage_logs table")
    except Exception as e:
        print(f"❌ Rollback failed: {e}")
        raise

if __name__ == "__main__":
    from server.app import create_app
    app = create_app()
    
    with app.app_context():
        print("Running migration: Add rag_document_names column...")
        upgrade()
        print("Migration completed successfully!")
