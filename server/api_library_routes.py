"""
API Library Routes - CRUD operations and test execution for API configurations
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import requests
import time
import json
import re
from .models import ApiLibrary, ApiLibraryRun, VariableMapping
from .database import db
from .auth_utils import require_auth

api_library_bp = Blueprint('api_library', __name__)

def replace_variables(text, variable_values):
    """Replace variable tokens with actual values"""
    if not text or not variable_values:
        return text
    
    # Replace #{variable_name} with actual values
    pattern = r'#\{([^}]+)\}'
    
    def replacer(match):
        var_name = match.group(1)
        return str(variable_values.get(var_name, match.group(0)))
    
    return re.sub(pattern, replacer, text)

def process_variable_substitution(data, variable_values):
    """Recursively process data structure and replace variables"""
    if isinstance(data, dict):
        return {k: process_variable_substitution(v, variable_values) for k, v in data.items()}
    elif isinstance(data, list):
        return [process_variable_substitution(item, variable_values) for item in data]
    elif isinstance(data, str):
        return replace_variables(data, variable_values)
    return data

@api_library_bp.route('/api-library', methods=['GET'])
@require_auth
def get_api_library():
    """Get all API configurations for workspace with pagination, search, and filters"""
    workspace_id = request.user.get('workspace_id')
    
    # Pagination parameters
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    
    # Search parameter
    search = request.args.get('search', '', type=str)
    
    # Method filter
    method = request.args.get('method', '', type=str)
    
    # Build query
    query = ApiLibrary.query.filter_by(workspace_id=workspace_id)
    
    # Apply search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            db.or_(
                ApiLibrary.name.ilike(search_filter),
                ApiLibrary.endpoint.ilike(search_filter),
                ApiLibrary.prompt_instructions.ilike(search_filter)
            )
        )
    
    # Apply method filter
    if method and method != 'all':
        query = query.filter_by(method=method)
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination
    apis = query.order_by(ApiLibrary.created_at.desc()).paginate(
        page=page,
        per_page=limit,
        error_out=False
    )
    
    return jsonify({
        'apis': [{
            'id': api.id,
            'name': api.name,
            'prompt_instructions': api.prompt_instructions,
            'method': api.method,
            'endpoint': api.endpoint,
            'headers': api.headers,
            'body_mode': api.body_mode,
            'body_raw': api.body_raw,
            'body_form': api.body_form,
            'retry_enabled': api.retry_enabled,
            'max_retries': api.max_retries,
            'response_mappings': api.response_mappings,
            'created_at': api.created_at.isoformat(),
            'updated_at': api.updated_at.isoformat()
        } for api in apis.items],
        'page': page,
        'limit': limit,
        'total_count': total_count,
        'total_pages': apis.pages
    }), 200

@api_library_bp.route('/api-library/<api_id>', methods=['GET'])
@require_auth
def get_api_by_id(api_id):
    """Get a specific API configuration"""
    workspace_id = request.user.get('workspace_id')
    
    api = ApiLibrary.query.filter_by(id=api_id, workspace_id=workspace_id).first()
    
    if not api:
        return jsonify({'error': 'API not found'}), 404
    
    return jsonify({
        'id': api.id,
        'name': api.name,
        'prompt_instructions': api.prompt_instructions,
        'method': api.method,
        'endpoint': api.endpoint,
        'headers': api.headers,
        'body_mode': api.body_mode,
        'body_raw': api.body_raw,
        'body_form': api.body_form,
        'retry_enabled': api.retry_enabled,
        'max_retries': api.max_retries,
        'response_mappings': api.response_mappings,
        'created_at': api.created_at.isoformat(),
        'updated_at': api.updated_at.isoformat()
    }), 200

@api_library_bp.route('/api-library', methods=['POST'])
@require_auth
def create_api():
    """Create a new API configuration"""
    workspace_id = request.user.get('workspace_id')
    data = request.json
    
    # Validation
    if not data.get('name'):
        return jsonify({'error': 'API name is required'}), 400
    
    if not data.get('endpoint'):
        return jsonify({'error': 'Endpoint is required'}), 400
    
    new_api = ApiLibrary(
        workspace_id=workspace_id,
        name=data['name'],
        prompt_instructions=data.get('prompt_instructions'),
        method=data.get('method', 'GET'),
        endpoint=data['endpoint'],
        headers=data.get('headers', []),
        body_mode=data.get('body_mode', 'raw'),
        body_raw=data.get('body_raw'),
        body_form=data.get('body_form', []),
        retry_enabled=data.get('retry_enabled', False),
        max_retries=data.get('max_retries', 1),
        response_mappings=data.get('response_mappings', [])
    )
    
    db.session.add(new_api)
    db.session.commit()
    
    return jsonify({
        'id': new_api.id,
        'message': 'API created successfully'
    }), 201

@api_library_bp.route('/api-library/<api_id>', methods=['PUT'])
@require_auth
def update_api(api_id):
    """Update an existing API configuration"""
    workspace_id = request.user.get('workspace_id')
    data = request.json
    
    api = ApiLibrary.query.filter_by(id=api_id, workspace_id=workspace_id).first()
    
    if not api:
        return jsonify({'error': 'API not found'}), 404
    
    # Update fields
    if 'name' in data:
        api.name = data['name']
    if 'prompt_instructions' in data:
        api.prompt_instructions = data['prompt_instructions']
    if 'method' in data:
        api.method = data['method']
    if 'endpoint' in data:
        api.endpoint = data['endpoint']
    if 'headers' in data:
        api.headers = data['headers']
    if 'body_mode' in data:
        api.body_mode = data['body_mode']
    if 'body_raw' in data:
        api.body_raw = data['body_raw']
    if 'body_form' in data:
        api.body_form = data['body_form']
    if 'retry_enabled' in data:
        api.retry_enabled = data['retry_enabled']
    if 'max_retries' in data:
        api.max_retries = data['max_retries']
    if 'response_mappings' in data:
        api.response_mappings = data['response_mappings']
    
    api.updated_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({'message': 'API updated successfully'}), 200

@api_library_bp.route('/api-library/<api_id>', methods=['DELETE'])
@require_auth
def delete_api(api_id):
    """Delete an API configuration"""
    workspace_id = request.user.get('workspace_id')
    
    api = ApiLibrary.query.filter_by(id=api_id, workspace_id=workspace_id).first()
    
    if not api:
        return jsonify({'error': 'API not found'}), 404
    
    db.session.delete(api)
    db.session.commit()
    
    return jsonify({'message': 'API deleted successfully'}), 200

@api_library_bp.route('/api-library/test', methods=['POST'])
@require_auth
def test_api_config():
    """Test an API configuration without saving to database (for testing before save)"""
    workspace_id = request.user.get('workspace_id')
    data = request.json
    variable_values = data.get('variable_values', {})
    
    start_time = time.time()
    retry_count = 0
    max_retries = data.get('max_retries', 1) if data.get('retry_enabled', False) else 1
    
    # Prepare request
    endpoint = replace_variables(data.get('endpoint', ''), variable_values)
    
    # Process headers
    headers = {}
    if data.get('headers'):
        for header in data.get('headers', []):
            key = replace_variables(header.get('key', ''), variable_values)
            value = replace_variables(header.get('value', ''), variable_values)
            if key:
                headers[key] = value
    
    # Process body
    body = None
    method = data.get('method', 'GET')
    if method in ['POST', 'PUT', 'PATCH']:
        if data.get('body_mode') == 'raw' and data.get('body_raw'):
            body_str = replace_variables(data.get('body_raw', ''), variable_values)
            try:
                body = json.loads(body_str)
            except:
                body = body_str
        elif data.get('body_mode') == 'form' and data.get('body_form'):
            body = {}
            for field in data.get('body_form', []):
                key = replace_variables(field.get('key', ''), variable_values)
                value = replace_variables(field.get('value', ''), variable_values)
                if key:
                    body[key] = value
    
    # Retry logic
    last_error = None
    response_data = None
    status_code = None
    success = False
    
    for attempt in range(max_retries):
        try:
            retry_count = attempt
            response = requests.request(
                method=method,
                url=endpoint,
                headers=headers,
                json=body if isinstance(body, dict) else None,
                data=body if isinstance(body, str) else None,
                timeout=30
            )
            
            status_code = response.status_code
            
            # Try to parse JSON response
            try:
                response_data = {'result': response.json()}
            except:
                response_data = {'result': response.text}
            
            success = 200 <= status_code < 300
            
            if success:
                break
                
        except Exception as e:
            last_error = str(e)
            if attempt == max_retries - 1:
                status_code = None
                response_data = None
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    # DO NOT save to database - just return test results for preview
    return jsonify({
        'success': success,
        'status_code': status_code,
        'response': response_data,
        'error': last_error if not success else None,
        'duration_ms': duration_ms,
        'retry_count': retry_count
    }), 200 if success else 400

@api_library_bp.route('/api-library/<api_id>/test', methods=['POST'])
@require_auth
def test_api(api_id):
    """Test an API configuration with provided variable values"""
    workspace_id = request.user.get('workspace_id')
    data = request.json
    variable_values = data.get('variable_values', {})
    
    api = ApiLibrary.query.filter_by(id=api_id, workspace_id=workspace_id).first()
    
    if not api:
        return jsonify({'error': 'API not found'}), 404
    
    start_time = time.time()
    retry_count = 0
    max_retries = api.max_retries if api.retry_enabled else 1
    
    # Prepare request
    endpoint = replace_variables(api.endpoint, variable_values)
    
    # Process headers
    headers = {}
    if api.headers:
        for header in api.headers:
            key = replace_variables(header.get('key', ''), variable_values)
            value = replace_variables(header.get('value', ''), variable_values)
            if key:
                headers[key] = value
    
    # Process body
    body = None
    if api.method in ['POST', 'PUT', 'PATCH']:
        if api.body_mode == 'raw' and api.body_raw:
            body_str = replace_variables(api.body_raw, variable_values)
            try:
                body = json.loads(body_str)
            except:
                body = body_str
        elif api.body_mode == 'form' and api.body_form:
            body = {}
            for field in api.body_form:
                key = replace_variables(field.get('key', ''), variable_values)
                value = replace_variables(field.get('value', ''), variable_values)
                if key:
                    body[key] = value
    
    # Retry logic
    last_error = None
    response_data = None
    status_code = None
    success = False
    
    for attempt in range(max_retries):
        try:
            retry_count = attempt
            response = requests.request(
                method=api.method,
                url=endpoint,
                headers=headers,
                json=body if isinstance(body, dict) else None,
                data=body if isinstance(body, str) else None,
                timeout=30
            )
            
            status_code = response.status_code
            
            # Try to parse JSON response
            try:
                response_data = {'result': response.json()}
            except:
                response_data = {'result': response.text}
            
            success = 200 <= status_code < 300
            
            if success:
                break
                
        except Exception as e:
            last_error = str(e)
            if attempt == max_retries - 1:
                status_code = None
                response_data = None
    
    duration_ms = int((time.time() - start_time) * 1000)
    
    # Save run to database
    run = ApiLibraryRun(
        api_id=api.id,
        workspace_id=workspace_id,
        status_code=status_code,
        success=success,
        request_data={
            'endpoint': endpoint,
            'method': api.method,
            'headers': headers,
            'body': body
        },
        response_data=response_data,
        error_message=last_error if not success else None,
        duration_ms=duration_ms,
        retry_count=retry_count
    )
    
    db.session.add(run)
    db.session.commit()
    
    return jsonify({
        'success': success,
        'status_code': status_code,
        'response': response_data,
        'error': last_error if not success else None,
        'duration_ms': duration_ms,
        'retry_count': retry_count
    }), 200 if success else 400

@api_library_bp.route('/api-library/<api_id>/runs', methods=['GET'])
@require_auth
def get_api_runs(api_id):
    """Get test run history for an API"""
    workspace_id = request.user.get('workspace_id')
    
    runs = ApiLibraryRun.query.filter_by(
        api_id=api_id,
        workspace_id=workspace_id
    ).order_by(ApiLibraryRun.created_at.desc()).limit(20).all()
    
    return jsonify({
        'runs': [{
            'id': run.id,
            'status_code': run.status_code,
            'success': run.success,
            'duration_ms': run.duration_ms,
            'retry_count': run.retry_count,
            'error_message': run.error_message,
            'created_at': run.created_at.isoformat()
        } for run in runs]
    }), 200
