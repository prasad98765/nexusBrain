"""
Migration: Update api_library table with missing columns
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

def migrate():
    """Add missing columns to api_library table"""
    from server.app import create_app
    from server.database import db
    
    app = create_app()
    
    with app.app_context():
        print("Adding missing columns to api_library table...")
        
        # Check and add columns one by one
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library 
                ADD COLUMN IF NOT EXISTS body_mode VARCHAR(10) DEFAULT 'raw';
            """))
            print("✓ Added body_mode column")
        except Exception as e:
            print(f"body_mode: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library 
                ADD COLUMN IF NOT EXISTS body_raw TEXT;
            """))
            print("✓ Added body_raw column")
        except Exception as e:
            print(f"body_raw: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library 
                ADD COLUMN IF NOT EXISTS body_form JSON;
            """))
            print("✓ Added body_form column")
        except Exception as e:
            print(f"body_form: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library 
                ADD COLUMN IF NOT EXISTS retry_enabled BOOLEAN DEFAULT FALSE;
            """))
            print("✓ Added retry_enabled column")
        except Exception as e:
            print(f"retry_enabled: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library 
                ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 1;
            """))
            print("✓ Added max_retries column")
        except Exception as e:
            print(f"max_retries: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library 
                ADD COLUMN IF NOT EXISTS response_mappings JSON;
            """))
            print("✓ Added response_mappings column")
        except Exception as e:
            print(f"response_mappings: {e}")
        
        db.session.commit()
        print("✅ api_library table updated successfully")
        
        print("\nAdding missing columns to api_library_runs table...")
        
        # Add columns to api_library_runs table
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD COLUMN IF NOT EXISTS api_id VARCHAR;
            """))
            print("✓ Added api_id column")
        except Exception as e:
            print(f"api_id: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD COLUMN IF NOT EXISTS status_code INTEGER;
            """))
            print("✓ Added status_code column")
        except Exception as e:
            print(f"status_code: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT FALSE;
            """))
            print("✓ Added success column")
        except Exception as e:
            print(f"success: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD COLUMN IF NOT EXISTS request_data JSON;
            """))
            print("✓ Added request_data column")
        except Exception as e:
            print(f"request_data: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD COLUMN IF NOT EXISTS response_data JSON;
            """))
            print("✓ Added response_data column")
        except Exception as e:
            print(f"response_data: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD COLUMN IF NOT EXISTS error_message TEXT;
            """))
            print("✓ Added error_message column")
        except Exception as e:
            print(f"error_message: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD COLUMN IF NOT EXISTS duration_ms INTEGER;
            """))
            print("✓ Added duration_ms column")
        except Exception as e:
            print(f"duration_ms: {e}")
        
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
            """))
            print("✓ Added retry_count column")
        except Exception as e:
            print(f"retry_count: {e}")
        
        # Add foreign key constraint
        try:
            db.session.execute(db.text("""
                ALTER TABLE api_library_runs 
                ADD CONSTRAINT fk_api_library_runs_api_id 
                FOREIGN KEY (api_id) REFERENCES api_library(id) ON DELETE CASCADE;
            """))
            print("✓ Added foreign key constraint")
        except Exception as e:
            print(f"Foreign key constraint: {e}")
        
        db.session.commit()
        print("✅ api_library_runs table updated successfully")

if __name__ == '__main__':
    migrate()
