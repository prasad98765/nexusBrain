"""
Migration: Add variable_mapping table
Creates a table to store workflow variables with validation rules
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import db
from models import VariableMapping

def migrate():
    """Create variable_mapping table"""
    print("Creating variable_mapping table...")
    db.create_all()
    print("✅ variable_mapping table created successfully")

if __name__ == '__main__':
    from app import create_app
    app = create_app()
    with app.app_context():
        migrate()
