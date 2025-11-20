"""
Workspace Utility Functions
Helper functions for workspace creation and management
"""
from .database import db
from .models import VariableMapping
from datetime import datetime


# Default system variables that are automatically added to every workspace
DEFAULT_SYSTEM_VARIABLES = [
    {
        'name': 'Name',
        'description': 'User or contact full name',
        'format': 'name',
        'error_message': None,
        'is_system': True
    },
    {
        'name': 'Email',
        'description': 'User or contact email address',
        'format': 'email',
        'error_message': 'Please enter a valid email address',
        'is_system': True
    },
    {
        'name': 'Phone',
        'description': 'User or contact phone number',
        'format': 'phone',
        'error_message': 'Please enter a valid phone number',
        'is_system': True
    },
    {
        'name': 'Created At',
        'description': 'Record creation timestamp',
        'format': 'date',
        'error_message': 'Please enter a valid date',
        'is_system': True
    },
    {
        'name': 'Updated At',
        'description': 'Record last update timestamp',
        'format': 'date',
        'error_message': 'Please enter a valid date',
        'is_system': True
    }
]


def create_default_system_variables(workspace_id: str):
    """
    Create default system variables for a new workspace.
    These variables are marked as system-managed and cannot be edited or deleted by users.
    
    Args:
        workspace_id: The workspace ID to create variables for
        
    Returns:
        List of created variable IDs
    """
    created_variable_ids = []
    
    try:
        for var_config in DEFAULT_SYSTEM_VARIABLES:
            # Check if variable already exists (shouldn't happen, but safe to check)
            existing = VariableMapping.query.filter_by(
                workspace_id=workspace_id,
                name=var_config['name']
            ).first()
            
            if existing:
                print(f"System variable '{var_config['name']}' already exists for workspace {workspace_id}")
                continue
            
            # Create system variable
            variable = VariableMapping(
                workspace_id=workspace_id,
                name=var_config['name'],
                description=var_config['description'],
                format=var_config['format'],
                error_message=var_config['error_message'],
                regex_pattern=None,
                is_system=True
            )
            
            db.session.add(variable)
            db.session.flush()  # Get the ID
            created_variable_ids.append(variable.id)
            
            print(f"✓ Created system variable: {var_config['name']} (ID: {variable.id})")
        
        db.session.commit()
        print(f"✅ Successfully created {len(created_variable_ids)} default system variables for workspace {workspace_id}")
        
        return created_variable_ids
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Error creating default system variables for workspace {workspace_id}: {e}")
        raise e


def get_system_variable_names():
    """
    Get list of default system variable names.
    Useful for validation and checks.
    
    Returns:
        List of system variable names
    """
    return [var['name'] for var in DEFAULT_SYSTEM_VARIABLES]
