#!/usr/bin/env python3
"""
Quick Buttons Migration Script
Adds the quick_buttons column to script_settings table
"""

from database import db
from sqlalchemy import text

def migrate_quick_buttons():
    """Add quick_buttons column to script_settings table"""
    try:
        # Check if column already exists
        check_query = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='script_settings' 
            AND column_name='quick_buttons';
        """)
        
        result = db.session.execute(check_query)
        column_exists = result.fetchone() is not None
        
        if column_exists:
            print("✓ Column 'quick_buttons' already exists in script_settings table")
            return True
        
        # Add the column
        add_column_query = text("""
            ALTER TABLE script_settings 
            ADD COLUMN quick_buttons JSON;
        """)
        
        db.session.execute(add_column_query)
        db.session.commit()
        
        print("✓ Successfully added 'quick_buttons' column to script_settings table")
        return True
        
    except Exception as e:
        db.session.rollback()
        print(f"✗ Error during migration: {str(e)}")
        return False

if __name__ == "__main__":
    from app import app
    
    with app.app_context():
        print("Starting Quick Buttons migration...")
        success = migrate_quick_buttons()
        
        if success:
            print("\n✓ Migration completed successfully!")
        else:
            print("\n✗ Migration failed!")
            exit(1)
