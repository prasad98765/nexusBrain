import os
from pymongo import MongoClient
from datetime import datetime
from typing import Optional, Dict, Any

class MongoService:
    def __init__(self):
        # For development, use PostgreSQL as fallback for business info storage
        self.connection_string = os.getenv('MONGODB_URI', None)
        self.client = None
        self.db = None
        self.use_fallback = True  # Use PostgreSQL instead
        
    def connect(self):
        """Connect to MongoDB or use PostgreSQL fallback"""
        if self.connection_string:
            try:
                self.client = MongoClient(self.connection_string)
                self.db = self.client['nexus_ai_hub']
                # Test connection
                self.client.admin.command('ping')
                print("✅ Connected to MongoDB successfully")
                self.use_fallback = False
                return True
            except Exception as e:
                print(f"❌ MongoDB connection failed, using PostgreSQL fallback: {e}")
        else:
            print("ℹ️  No MongoDB URI provided, using PostgreSQL for business info storage")
        
        self.use_fallback = True
        return True
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            print("✅ Disconnected from MongoDB")
    
    def get_business_info(self, user_id: str, workspace_id: str) -> Optional[Dict[str, Any]]:
        """Get business information for a user and workspace"""
        if self.use_fallback:
            # Use PostgreSQL fallback
            from .models import db
            from sqlalchemy import text
            try:
                result = db.session.execute(
                    text("SELECT * FROM business_info WHERE user_id = :user_id AND workspace_id = :workspace_id"),
                    {'user_id': user_id, 'workspace_id': workspace_id}
                ).fetchone()
                
                if result:
                    return {
                        'user_id': result[1],
                        'workspace_id': result[2], 
                        'business_name': result[3],
                        'business_type': result[4],
                        'created_at': result[5],
                        'updated_at': result[6]
                    }
                return None
            except Exception as e:
                print(f"Error getting business info from PostgreSQL: {e}")
                return None
        
        # MongoDB implementation
        try:
            collection = self.db['business_info']
            business_info = collection.find_one({
                'user_id': user_id,
                'workspace_id': workspace_id
            })
            return business_info
        except Exception as e:
            print(f"Error getting business info: {e}")
            return None
    
    def save_business_info(self, user_id: str, workspace_id: str, business_name: str, business_type: str) -> bool:
        """Save business information for a user and workspace"""
        if self.use_fallback:
            # Use PostgreSQL fallback
            from .models import db
            from sqlalchemy import text
            try:
                # Insert or update business info
                db.session.execute(text("""
                    INSERT INTO business_info (user_id, workspace_id, business_name, business_type, created_at, updated_at)
                    VALUES (:user_id, :workspace_id, :business_name, :business_type, :created_at, :updated_at)
                    ON CONFLICT (user_id, workspace_id)
                    DO UPDATE SET 
                        business_name = EXCLUDED.business_name,
                        business_type = EXCLUDED.business_type,
                        updated_at = EXCLUDED.updated_at
                """), {
                    'user_id': user_id, 
                    'workspace_id': workspace_id, 
                    'business_name': business_name, 
                    'business_type': business_type, 
                    'created_at': datetime.utcnow(), 
                    'updated_at': datetime.utcnow()
                })
                
                db.session.commit()
                return True
            except Exception as e:
                db.session.rollback()
                print(f"Error saving business info to PostgreSQL: {e}")
                return False
        
        # MongoDB implementation
        try:
            collection = self.db['business_info']
            business_info = {
                'user_id': user_id,
                'workspace_id': workspace_id,
                'business_name': business_name,
                'business_type': business_type,
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Upsert (update if exists, insert if not)
            result = collection.replace_one(
                {'user_id': user_id, 'workspace_id': workspace_id},
                business_info,
                upsert=True
            )
            
            return True
        except Exception as e:
            print(f"Error saving business info: {e}")
            return False
    
    def update_business_info(self, user_id: str, workspace_id: str, updates: Dict[str, Any]) -> bool:
        """Update business information for a user and workspace"""
        if not self.db:
            return False
        
        try:
            collection = self.db['business_info']
            updates['updated_at'] = datetime.utcnow()
            
            result = collection.update_one(
                {'user_id': user_id, 'workspace_id': workspace_id},
                {'$set': updates}
            )
            
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating business info: {e}")
            return False

# Global MongoDB service instance
mongo_service = MongoService()

# Business type options
BUSINESS_TYPES = [
    'Technology',
    'E-commerce',
    'Healthcare',
    'Finance',
    'Education',
    'Real Estate',
    'Manufacturing',
    'Retail',
    'Food & Beverage',
    'Professional Services',
    'Non-Profit',
    'Government',
    'Entertainment',
    'Travel & Tourism',
    'Agriculture',
    'Energy',
    'Transportation',
    'Construction',
    'Media & Communications',
    'Other'
]