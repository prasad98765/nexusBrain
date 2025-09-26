import hashlib
import secrets
from datetime import datetime
from typing import Dict, Any

from flask import Blueprint, request, jsonify
from sqlalchemy import or_, func

from .models import db, ApiToken, ApiUsageLog, Workspace
from .auth import require_auth

api_tokens_bp = Blueprint('api_tokens', __name__)

def generate_token():
    """Generate a secure API token"""
    return f"nxs-{secrets.token_urlsafe(32)}"

def hash_token(token: str) -> str:
    """Hash an API token for secure storage"""
    return hashlib.sha256(token.encode()).hexdigest()

@api_tokens_bp.route('/api-tokens', methods=['GET'])
@require_auth
def get_api_tokens():
    """Get API tokens for a workspace (excluding actual token values)"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get all tokens for the workspace
        tokens = ApiToken.query.filter_by(
            workspace_id=workspace_id, 
            is_active=True
        ).order_by(ApiToken.created_at.desc()).all()
        
        tokens_data = []
        for token in tokens:
            tokens_data.append({
                'id': token.id,
                'name': token.name,
                'workspaceId': token.workspace_id,
                'userId': token.user_id,
                'cachingEnabled': token.caching_enabled,
                'isActive': token.is_active,
                'lastUsedAt': token.last_used_at.isoformat() if token.last_used_at else None,
                'createdAt': token.created_at.isoformat(),
                'updatedAt': token.updated_at.isoformat() if token.updated_at else token.created_at.isoformat()
            })
        
        return jsonify({
            'tokens': tokens_data,
            'hasToken': len(tokens_data) > 0
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_tokens_bp.route('/api-tokens', methods=['POST'])
@require_auth
def create_api_token():
    """Create a new API token"""
    try:
        data = request.get_json()
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        user_id = user_data.get('user_id')
        
        if not workspace_id or not user_id:
            return jsonify({'error': 'workspace_id and user_id are required'}), 400
        
        # Check if workspace already has an active token
        existing_token = ApiToken.query.filter_by(
            workspace_id=workspace_id, 
            is_active=True
        ).first()
        
        if existing_token:
            return jsonify({'error': 'Workspace already has an active API token. Please revoke the existing token first.'}), 400
        
        # Generate new token
        plain_token = generate_token()
        hashed_token = hash_token(plain_token)
        
        # Create new token record
        token = ApiToken()
        token.token = hashed_token
        token.name = data.get('name', 'Default Token')
        token.workspace_id = workspace_id
        token.user_id = user_id
        token.caching_enabled = data.get('cachingEnabled', True)
        token.is_active = True
        
        db.session.add(token)
        db.session.commit()
        
        return jsonify({
            'id': token.id,
            'plainToken': plain_token,  # Only returned once!
            'name': token.name,
            'workspaceId': token.workspace_id,
            'userId': token.user_id,
            'cachingEnabled': token.caching_enabled,
            'isActive': token.is_active,
            'createdAt': token.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_tokens_bp.route('/api-tokens/<token_id>', methods=['PUT'])
@require_auth
def update_api_token(token_id):
    """Update an API token (caching preferences, name, etc.)"""
    try:
        data = request.get_json()
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        token = ApiToken.query.filter_by(
            id=token_id, 
            workspace_id=workspace_id
        ).first()
        
        if not token:
            return jsonify({'error': 'Token not found'}), 404
        
        # Update fields
        if 'name' in data:
            token.name = data['name']
        if 'cachingEnabled' in data:
            token.caching_enabled = data['cachingEnabled']
        
        token.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'id': token.id,
            'name': token.name,
            'workspaceId': token.workspace_id,
            'userId': token.user_id,
            'cachingEnabled': token.caching_enabled,
            'isActive': token.is_active,
            'lastUsedAt': token.last_used_at.isoformat() if token.last_used_at else None,
            'createdAt': token.created_at.isoformat(),
            'updatedAt': token.updated_at.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_tokens_bp.route('/api-tokens/<token_id>/regenerate', methods=['POST'])
@require_auth
def regenerate_api_token(token_id):
    """Regenerate an API token (creates new token, deactivates old one)"""
    try:
        data = request.get_json()
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        user_id = user_data.get('user_id')
        
        if not workspace_id or not user_id:
            return jsonify({'error': 'workspace_id and user_id are required'}), 400
        
        old_token = ApiToken.query.filter_by(
            id=token_id, 
            workspace_id=workspace_id
        ).first()
        
        if not old_token:
            return jsonify({'error': 'Token not found'}), 404
        
        # Deactivate old token
        old_token.is_active = False
        old_token.updated_at = datetime.utcnow()
        
        # Generate new token
        plain_token = generate_token()
        hashed_token = hash_token(plain_token)
        
        # Create new token record
        new_token = ApiToken()
        new_token.token = hashed_token
        new_token.name = data.get('name', old_token.name)
        new_token.workspace_id = workspace_id
        new_token.user_id = user_id
        new_token.caching_enabled = data.get('cachingEnabled', old_token.caching_enabled)
        new_token.is_active = True
        
        db.session.add(new_token)
        db.session.commit()
        
        return jsonify({
            'id': new_token.id,
            'plainToken': plain_token,  # Only returned once!
            'name': new_token.name,
            'workspaceId': new_token.workspace_id,
            'userId': new_token.user_id,
            'cachingEnabled': new_token.caching_enabled,
            'isActive': new_token.is_active,
            'createdAt': new_token.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_tokens_bp.route('/api-tokens/<token_id>', methods=['DELETE'])
@require_auth
def deactivate_api_token(token_id):
    """Deactivate an API token"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        token = ApiToken.query.filter_by(
            id=token_id, 
            workspace_id=workspace_id
        ).first()
        
        if not token:
            return jsonify({'error': 'Token not found'}), 404
        
        token.is_active = False
        token.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Token deactivated successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_tokens_bp.route('/api-tokens/usage-logs', methods=['GET'])
@require_auth
def get_usage_logs():
    """Get API usage logs for a workspace"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 25)), 100)
        
        # Get filter parameters
        model = request.args.get('model', 'all')
        date_range = request.args.get('dateRange', 'last30')
        filter_type = request.args.get('filterType', 'all')
        
        # Build base query
        query = ApiUsageLog.query.filter_by(workspace_id=workspace_id)
        
        # Apply model filter
        if model != 'all':
            query = query.filter(ApiUsageLog.model == model)
        
        # Apply date range filter
        if date_range == 'last24':
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(hours=24)
            query = query.filter(ApiUsageLog.created_at >= cutoff)
        elif date_range == 'last7':
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(days=7)
            query = query.filter(ApiUsageLog.created_at >= cutoff)
        elif date_range == 'last30':
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(days=30)
            query = query.filter(ApiUsageLog.created_at >= cutoff)
        
        # Apply usage filter
        if filter_type == 'high':
            query = query.filter(ApiUsageLog.tokens_used > 1000)
        elif filter_type == 'low':
            query = query.filter(ApiUsageLog.tokens_used <= 100)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        offset = (page - 1) * limit
        logs = query.order_by(ApiUsageLog.created_at.desc()).offset(offset).limit(limit).all()
        
        # Format response
        logs_data = []
        for log in logs:
            logs_data.append({
                'id': log.id,
                'tokenId': log.token_id,
                'endpoint': log.endpoint,
                'model': log.model,
                'method': log.method,
                'statusCode': log.status_code,
                'tokensUsed': log.tokens_used,
                'responseTimeMs': log.response_time_ms,
                'errorMessage': log.error_message,
                'ipAddress': log.ip_address,
                'userAgent': log.user_agent,
                'createdAt': log.created_at.isoformat()
            })
        
        # Calculate total pages
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        
        return jsonify({
            'logs': logs_data,
            'total': total,
            'page': page,
            'limit': limit,
            'totalPages': total_pages
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_tokens_bp.route('/api-tokens/analytics', methods=['GET'])
@require_auth
def get_usage_analytics():
    """Get API usage analytics for a workspace"""
    try:
        user_data: Dict[str, Any] = getattr(request, 'user', {})
        workspace_id = user_data.get('workspace_id')
        
        if not workspace_id:
            return jsonify({'error': 'workspace_id is required'}), 400
        
        # Get date range
        date_range = request.args.get('dateRange', 'last30')
        
        # Calculate date cutoff
        if date_range == 'last24':
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(hours=24)
        elif date_range == 'last7':
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(days=7)
        else:  # last30
            from datetime import timedelta
            cutoff = datetime.utcnow() - timedelta(days=30)
        
        # Base query with date filter
        base_query = ApiUsageLog.query.filter(
            ApiUsageLog.workspace_id == workspace_id,
            ApiUsageLog.created_at >= cutoff
        )
        
        # Get total requests
        total_requests = base_query.count()
        
        # Get total tokens
        total_tokens = base_query.with_entities(func.sum(ApiUsageLog.tokens_used)).scalar() or 0
        
        # Get average response time
        avg_response_time = base_query.filter(
            ApiUsageLog.response_time_ms.isnot(None)
        ).with_entities(func.avg(ApiUsageLog.response_time_ms)).scalar() or 0
        
        # Get success rate
        successful_requests = base_query.filter(ApiUsageLog.status_code == 200).count()
        success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Get top models
        top_models = base_query.with_entities(
            ApiUsageLog.model,
            func.count(ApiUsageLog.id).label('requests')
        ).group_by(ApiUsageLog.model).order_by(func.count(ApiUsageLog.id).desc()).limit(5).all()
        
        top_models_data = [{'model': model, 'requests': requests} for model, requests in top_models]
        
        # Get requests over time (daily for last 30 days, hourly for shorter periods)
        if date_range == 'last24':
            # Hourly data for last 24 hours
            time_format = '%Y-%m-%d %H:00:00'
        else:
            # Daily data
            time_format = '%Y-%m-%d'
        
        requests_over_time = base_query.with_entities(
            func.strftime(time_format, ApiUsageLog.created_at).label('date'),
            func.count(ApiUsageLog.id).label('requests')
        ).group_by(func.strftime(time_format, ApiUsageLog.created_at)).all()
        
        requests_over_time_data = [{'date': date, 'requests': requests} for date, requests in requests_over_time]
        
        return jsonify({
            'totalRequests': total_requests,
            'totalTokens': int(total_tokens),
            'averageResponseTime': round(float(avg_response_time), 2),
            'successRate': round(success_rate, 2),
            'topModels': top_models_data,
            'requestsOverTime': requests_over_time_data
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500