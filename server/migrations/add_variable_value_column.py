"""  
Migration: Add value column to variable_mapping table
Adds a value column to store current/test values for variables
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from sqlalchemy import text

def migrate():
    """Add value column to variable_mapping table"""
    from server.app import create_app
    from server.database import db
    
    app = create_app()
    
    with app.app_context():
        print("Adding value column to variable_mapping table...")
        
        try:
            # Check if column already exists
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='variable_mapping' AND column_name='value'
            """))
            
            if result.fetchone():
                print("✅ value column already exists")
                return
            
            # Add the column
            db.session.execute(text("""
                ALTER TABLE variable_mapping 
                ADD COLUMN value TEXT NULL
            """))
            
            db.session.commit()
            print("✅ value column added successfully")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error: {e}")
            raise

if __name__ == '__main__':
    migrate()
