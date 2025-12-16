"""
Migration script to create flow_agents table for managing flow-based agents
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from server.app import create_app
from server.database import db
from sqlalchemy import text

def upgrade():
    """Create flow_agents table"""
    app = create_app()
    with app.app_context():
        with db.engine.connect() as conn:
            # Create flow_agents table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS flow_agents (
                    id VARCHAR PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    flow_data JSON,
                    workspace_id VARCHAR NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    configuration JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
                )
            """))
            conn.commit()
            print("✅ flow_agents table created successfully")

def downgrade():
    """Drop flow_agents table"""
    app = create_app()
    with app.app_context():
        with db.engine.connect() as conn:
            conn.execute(text("DROP TABLE IF EXISTS flow_agents"))
            conn.commit()
            print("✅ flow_agents table dropped successfully")

if __name__ == "__main__":
    upgrade()
