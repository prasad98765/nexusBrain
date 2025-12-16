"""
Migration script to create flow_agents table
This table manages multi-agent flow builder system with workspace isolation
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from server.database import db
from server.app import create_app
from sqlalchemy import text

def migrate():
    """Create flow_agents table"""
    app = create_app()
    
    with app.app_context():
        # Drop table if exists (for clean migration)
        db.session.execute(text('DROP TABLE IF EXISTS flow_agents CASCADE'))
        
        # Create flow_agents table
        create_table_sql = text("""
            CREATE TABLE flow_agents (
                id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
                workspace_id VARCHAR NOT NULL,
                name VARCHAR(255) NOT NULL,
                prompt TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_flow_agents_workspace 
                    FOREIGN KEY (workspace_id) 
                    REFERENCES workspaces(id) 
                    ON DELETE CASCADE,
                CONSTRAINT uq_flow_agents_workspace_name 
                    UNIQUE (workspace_id, name)
            )
        """)
        
        db.session.execute(create_table_sql)
        
        # Create index on workspace_id for faster queries
        create_index_sql = text("""
            CREATE INDEX idx_flow_agents_workspace_id 
            ON flow_agents(workspace_id)
        """)
        db.session.execute(create_index_sql)
        
        # Create index on name for search functionality
        create_name_index_sql = text("""
            CREATE INDEX idx_flow_agents_name 
            ON flow_agents(name)
        """)
        db.session.execute(create_name_index_sql)
        
        db.session.commit()
        print("✅ Successfully created flow_agents table with indexes and constraints")

if __name__ == '__main__':
    migrate()
