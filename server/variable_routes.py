"""
Variable Mapping Routes
Handles creation, retrieval, update, and deletion of variables for workflow builder
"""
import re
from datetime import datetime
from flask import Blueprint, request, jsonify
from .auth_utils import require_auth
from .database import db
from .models import VariableMapping
from sqlalchemy import func
from typing import Optional

variable_bp = Blueprint('variable', __name__)

# Valid format types
VALID_FORMATS = ['text', 'number', 'date', 'name', 'email', 'phone', 'regex']

# Format patterns requiring error messages
ERROR_MESSAGE_REQUIRED_FORMATS = ['email', 'phone', 'number', 'date', 'regex']


def validate_regex_pattern(pattern: str) -> tuple[bool, Optional[str]]:
    """Validate regex pattern by attempting to compile it"""
    try:
        re.compile(pattern)
        return True, None
    except re.error as e:
        return False, f"Invalid regex pattern: {str(e)}"


@variable_bp.route('/variables', methods=['POST'])
@require_auth
def create_variable():
    """Create a new variable"""
    try:
        data = request.get_json()
        workspace_id = request.user.get('workspace_id')
        
        # Validate required fields
        name = data.get('name', '').strip()
        description = data.get('description', '').strip()
        format_type = data.get('format', '').strip().lower()
        
        if not name:
            return jsonify({'error': 'Variable name is required'}), 400
        
        if format_type not in VALID_FORMATS:
            return jsonify({'error': f'Invalid format. Must be one of: {", ".join(VALID_FORMATS)}'}), 400
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Check for duplicate variable name in workspace
        existing = VariableMapping.query.filter_by(
            name=name,
            workspace_id=workspace_id
        ).first()
        
        if existing:
            return jsonify({'error': 'A variable with this name already exists in this workspace'}), 409
        
        # Validate error message for specific formats
        error_message = data.get('error_message', '').strip() if data.get('error_message') else None
        if format_type in ERROR_MESSAGE_REQUIRED_FORMATS and not error_message:
            return jsonify({'error': f'Error message is required for format: {format_type}'}), 400
        
        # Validate regex pattern if format is regex
        regex_pattern = data.get('regex_pattern', '').strip() if data.get('regex_pattern') else None
        if format_type == 'regex':
            if not regex_pattern:
                return jsonify({'error': 'Regex pattern is required for regex format'}), 400
            
            is_valid, error = validate_regex_pattern(regex_pattern)
            if not is_valid:
                return jsonify({'error': error}), 400
        
        # Create variable
        variable = VariableMapping(
            workspace_id=workspace_id,
            name=name,
            description=description,
            format=format_type,
            error_message=error_message,
            regex_pattern=regex_pattern
        )
        
        db.session.add(variable)
        db.session.commit()
        
        return jsonify({
            'message': 'Variable created successfully',
            'variable': {
                'id': variable.id,
                'workspace_id': variable.workspace_id,
                'name': variable.name,
                'description': variable.description,
                'format': variable.format,
                'error_message': variable.error_message,
                'regex_pattern': variable.regex_pattern,
                'created_at': variable.created_at.isoformat(),
                'updated_at': variable.updated_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating variable: {e}")
        return jsonify({'error': str(e)}), 500


@variable_bp.route('/variables', methods=['GET'])
@require_auth
def list_variables():
    """List all variables with search, pagination, and filtering"""
    try:
        workspace_id = request.user.get('workspace_id')
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Search and filter parameters
        search = request.args.get('search', '').strip()
        format_filter = request.args.get('format', '').strip().lower()
        
        # Build query
        query = VariableMapping.query.filter_by(workspace_id=workspace_id)
        
        # Add search condition
        if search:
            query = query.filter(VariableMapping.name.ilike(f'%{search}%'))
        
        # Add format filter
        if format_filter and format_filter in VALID_FORMATS:
            query = query.filter_by(format=format_filter)
        
        # Get total count
        total_count = query.count()
        
        # Get paginated results (ordered by created_at desc)
        variables = query.order_by(VariableMapping.created_at.desc()).paginate(
            page=page,
            per_page=limit,
            error_out=False
        )
        
        # Serialize variables
        serialized_variables = [{
            'id': var.id,
            'workspace_id': var.workspace_id,
            'name': var.name,
            'description': var.description,
            'format': var.format,
            'error_message': var.error_message,
            'regex_pattern': var.regex_pattern,
            'created_at': var.created_at.isoformat(),
            'updated_at': var.updated_at.isoformat()
        } for var in variables.items]
        
        return jsonify({
            'variables': serialized_variables,
            'total_count': total_count,
            'page': page,
            'limit': limit,
            'total_pages': variables.pages
        }), 200
        
    except Exception as e:
        print(f"Error listing variables: {e}")
        return jsonify({'error': str(e)}), 500


@variable_bp.route('/variables/<variable_id>', methods=['GET'])
@require_auth
def get_variable(variable_id):
    """Get a single variable by ID"""
    try:
        variable = VariableMapping.query.get(variable_id)
        
        if not variable:
            return jsonify({'error': 'Variable not found'}), 404
        
        return jsonify({
            'variable': {
                'id': variable.id,
                'workspace_id': variable.workspace_id,
                'name': variable.name,
                'description': variable.description,
                'format': variable.format,
                'error_message': variable.error_message,
                'regex_pattern': variable.regex_pattern,
                'created_at': variable.created_at.isoformat(),
                'updated_at': variable.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        print(f"Error getting variable: {e}")
        return jsonify({'error': str(e)}), 500


@variable_bp.route('/variables/<variable_id>', methods=['PUT'])
@require_auth
def update_variable(variable_id):
    """Update an existing variable"""
    try:
        data = request.get_json()
        
        # Get existing variable
        variable = VariableMapping.query.get(variable_id)
        
        if not variable:
            return jsonify({'error': 'Variable not found'}), 404
        
        # Update name if provided
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Variable name cannot be empty'}), 400
            
            # Check for duplicate name (excluding current variable)
            duplicate = VariableMapping.query.filter(
                VariableMapping.name == name,
                VariableMapping.workspace_id == variable.workspace_id,
                VariableMapping.id != variable_id
            ).first()
            
            if duplicate:
                return jsonify({'error': 'A variable with this name already exists'}), 409
            
            variable.name = name
        
        # Update description if provided
        if 'description' in data:
            description = data['description'].strip()
            # if not description:
            #     return jsonify({'error': 'Description cannot be empty'}), 400
            variable.description = description
        
        # Update format if provided
        if 'format' in data:
            format_type = data['format'].strip().lower()
            if format_type not in VALID_FORMATS:
                return jsonify({'error': f'Invalid format. Must be one of: {", ".join(VALID_FORMATS)}'}), 400
            variable.format = format_type
        else:
            format_type = variable.format
        
        # Update error message if provided
        if 'error_message' in data:
            error_message = data['error_message'].strip() if data['error_message'] else None
            if format_type in ERROR_MESSAGE_REQUIRED_FORMATS and not error_message:
                return jsonify({'error': f'Error message is required for format: {format_type}'}), 400
            variable.error_message = error_message
        
        # Update regex pattern if provided
        if 'regex_pattern' in data:
            regex_pattern = data['regex_pattern'].strip() if data['regex_pattern'] else None
            if format_type == 'regex':
                if not regex_pattern:
                    return jsonify({'error': 'Regex pattern is required for regex format'}), 400
                
                is_valid, error = validate_regex_pattern(regex_pattern)
                if not is_valid:
                    return jsonify({'error': error}), 400
            
            variable.regex_pattern = regex_pattern
        
        # Update timestamp
        variable.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Variable updated successfully',
            'variable': {
                'id': variable.id,
                'workspace_id': variable.workspace_id,
                'name': variable.name,
                'description': variable.description,
                'format': variable.format,
                'error_message': variable.error_message,
                'regex_pattern': variable.regex_pattern,
                'created_at': variable.created_at.isoformat(),
                'updated_at': variable.updated_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating variable: {e}")
        return jsonify({'error': str(e)}), 500


@variable_bp.route('/variables/<variable_id>', methods=['DELETE'])
@require_auth
def delete_variable(variable_id):
    """Delete a variable"""
    try:
        variable = VariableMapping.query.get(variable_id)
        
        if not variable:
            return jsonify({'error': 'Variable not found'}), 404
        
        db.session.delete(variable)
        db.session.commit()
        
        return jsonify({'message': 'Variable deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting variable: {e}")
        return jsonify({'error': str(e)}), 500


@variable_bp.route('/variables/validate-regex', methods=['POST'])
@require_auth
def validate_regex():
    """Validate a regex pattern"""
    try:
        data = request.get_json()
        pattern = data.get('pattern', '').strip()
        
        if not pattern:
            return jsonify({'error': 'Pattern is required'}), 400
        
        is_valid, error = validate_regex_pattern(pattern)
        
        if is_valid:
            return jsonify({'valid': True, 'message': 'Pattern is valid'}), 200
        else:
            return jsonify({'valid': False, 'error': error}), 400
            
    except Exception as e:
        print(f"Error validating regex: {e}")
        return jsonify({'error': str(e)}), 500
