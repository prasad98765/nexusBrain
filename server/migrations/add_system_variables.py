"""
Migration: Add is_system column and create default system variables
This migration:
1. Adds is_system column to variable_mapping table
2. Creates 5 default system variables for all existing workspaces
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from server.database import db
from server.models import VariableMapping, Workspace
from server.workspace_utils import create_default_system_variables
from sqlalchemy import text
from flask import Flask


def run_migration():
    """Execute the migration"""
    
    # Create Flask app context
    app = Flask(__name__)
    
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL environment variable not set!")
        print("Please set DATABASE_URL in your .env file")
        return False
        
    if database_url and database_url.startswith('postgresql://'):
        database_url = database_url.replace('postgresql://', 'postgresql+psycopg2://')
    
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SESSION_SECRET', 'dev-secret-key')
    
    db.init_app(app)
    
    with app.app_context():
        print("=" * 80)
        print("MIGRATION: Add System Variables")
        print("=" * 80)
        
        try:
            # Step 1: Add is_system column to variable_mapping table
            print("\n📋 Step 1: Adding is_system column to variable_mapping table...")
            
            try:
                db.session.execute(text("""
                    ALTER TABLE variable_mapping 
                    ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT FALSE
                """))
                db.session.commit()
                print("✅ Successfully added is_system column")
            except Exception as col_error:
                print(f"⚠️  Column might already exist: {col_error}")
                db.session.rollback()
            
            # Step 2: Get all existing workspaces
            print("\n📋 Step 2: Finding all workspaces...")
            workspaces = Workspace.query.all()
            print(f"✅ Found {len(workspaces)} workspace(s)")
            
            # Step 3: Create default system variables for each workspace
            print("\n📋 Step 3: Creating default system variables for each workspace...")
            
            success_count = 0
            error_count = 0
            
            for workspace in workspaces:
                print(f"\n🔧 Processing workspace: {workspace.name} (ID: {workspace.id})")
                
                try:
                    created_vars = create_default_system_variables(workspace.id)
                    if created_vars:
                        print(f"   ✅ Created {len(created_vars)} system variables")
                        success_count += 1
                    else:
                        print(f"   ℹ️  System variables already exist or none created")
                        success_count += 1
                except Exception as var_error:
                    print(f"   ❌ Error creating variables: {var_error}")
                    error_count += 1
                    db.session.rollback()
            
            print("\n" + "=" * 80)
            print("MIGRATION SUMMARY")
            print("=" * 80)
            print(f"✅ Successful workspaces: {success_count}")
            print(f"❌ Failed workspaces: {error_count}")
            print(f"📊 Total workspaces: {len(workspaces)}")
            
            # Step 4: Verify system variables
            print("\n📋 Step 4: Verifying system variables...")
            system_vars = VariableMapping.query.filter_by(is_system=True).all()
            print(f"✅ Total system variables in database: {len(system_vars)}")
            
            # Group by workspace
            workspace_var_counts = {}
            for var in system_vars:
                workspace_var_counts[var.workspace_id] = workspace_var_counts.get(var.workspace_id, 0) + 1
            
            print(f"\n📊 System variables per workspace:")
            for ws_id, count in workspace_var_counts.items():
                ws = Workspace.query.get(ws_id)
                ws_name = ws.name if ws else "Unknown"
                print(f"   • {ws_name}: {count} system variables")
            
            print("\n" + "=" * 80)
            print("✅ MIGRATION COMPLETED SUCCESSFULLY")
            print("=" * 80)
            
        except Exception as e:
            print(f"\n❌ MIGRATION FAILED: {e}")
            db.session.rollback()
            import traceback
            traceback.print_exc()
            return False
        
        return True


if __name__ == '__main__':
    print("\n🚀 Starting migration...")
    success = run_migration()
    
    if success:
        print("\n✅ Migration completed successfully!")
        sys.exit(0)
    else:
        print("\n❌ Migration failed!")
        sys.exit(1)
