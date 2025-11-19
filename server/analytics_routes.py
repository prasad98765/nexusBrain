"""
Analytics Routes for LLM Usage Tracking
Provides comprehensive analytics based on ApiUsageLog data
All dates are handled in India timezone (UTC+5:30)
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from flask import Blueprint, request, jsonify, Response
from sqlalchemy import func, and_, or_, case, cast, Integer, text
from sqlalchemy.sql import extract
import csv
import io
import pytz

from .models import db, ApiUsageLog, Workspace
from .auth_utils import require_auth

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

analytics_routes = Blueprint("analytics_routes", __name__)

# India timezone
INDIA_TZ = pytz.timezone('Asia/Kolkata')


def format_date_for_response(date_obj) -> str:
    """Helper function to format dates consistently for API responses
    
    Args:
        date_obj: Date object (can be date or datetime)
    
    Returns:
        ISO formatted date string (YYYY-MM-DD)
    """
    if date_obj is None:
        return None
    
    # If it's a datetime, extract just the date part
    if hasattr(date_obj, 'date'):
        return date_obj.date().isoformat()
    else:
        # Already a date object
        return date_obj.isoformat()


def parse_date_filters(params: dict) -> tuple:
    """Parse and validate date filters from request parameters
    
    Converts India timezone dates to UTC for database queries:
    - Input: Dates from frontend (treated as India timezone)
    - Output: UTC datetime range for database queries
    - start_date: 00:00:00 IST converted to UTC
    - end_date: 23:59:59.999999 IST converted to UTC
    
    Returns:
        Tuple of (start_date_utc, end_date_utc, start_date_ist, end_date_ist)
        - start_date_utc, end_date_utc: For database queries (UTC)
        - start_date_ist, end_date_ist: For response/logging (IST)
    """
    try:
        start_date_str = params.get('start_date')
        end_date_str = params.get('end_date')
        
        if not start_date_str or not end_date_str:
            raise ValueError("start_date and end_date are required")
        
        # Parse dates and treat as India timezone
        if 'T' in start_date_str:
            # Handle ISO datetime format (backward compatibility)
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00'))
            # If naive, assume India timezone
            if start_date.tzinfo is None:
                start_date = INDIA_TZ.localize(start_date)
            else:
                start_date = start_date.astimezone(INDIA_TZ)
        else:
            # Handle YYYY-MM-DD format - treat as India timezone
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            start_date = INDIA_TZ.localize(start_date)
            
        if 'T' in end_date_str:
            # Handle ISO datetime format (backward compatibility)
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
            # If naive, assume India timezone
            if end_date.tzinfo is None:
                end_date = INDIA_TZ.localize(end_date)
            else:
                end_date = end_date.astimezone(INDIA_TZ)
        else:
            # Handle YYYY-MM-DD format - treat as India timezone
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
            end_date = INDIA_TZ.localize(end_date)
        
        # Set to beginning and end of day in India timezone
        start_date_ist = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date_ist = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        # Convert to UTC for database query (database stores timestamps in UTC)
        start_date_utc = start_date_ist.astimezone(pytz.UTC).replace(tzinfo=None)
        end_date_utc = end_date_ist.astimezone(pytz.UTC).replace(tzinfo=None)
        
        if start_date_utc > end_date_utc:
            raise ValueError("start_date must be before or equal to end_date")
        
        logger.info(f"Date filter - IST: {start_date_ist} to {end_date_ist} | UTC: {start_date_utc} to {end_date_utc}")
        
        return start_date_utc, end_date_utc, start_date_ist, end_date_ist
    except ValueError as e:
        raise ValueError(f"Invalid date format: {str(e)}")
    except Exception as e:
        logger.error(f"Error parsing dates: {str(e)}")
        raise ValueError(f"Error parsing dates: {str(e)}")


def build_base_query(params: dict, workspace_id: str = None, exclude_semantic_cache: bool = False):
    """Build base query with common filters
    
    Args:
        params: Request parameters
        workspace_id: Workspace ID from authenticated user (required for workspace isolation)
        exclude_semantic_cache: If True, exclude semantic cache hits from query
        
    Returns:
        Tuple of (query, start_date_ist, end_date_ist)
    """
    start_date_utc, end_date_utc, start_date_ist, end_date_ist = parse_date_filters(params)
    
    # Base query with date filter (using UTC for database query)
    query = db.session.query(ApiUsageLog).filter(
        ApiUsageLog.created_at.between(start_date_utc, end_date_utc)
    )
    
    # Exclude semantic cache hits if requested (for cost/token calculations)
    if exclude_semantic_cache:
        query = query.filter(
            or_(
                ApiUsageLog.cached == False,
                and_(
                    ApiUsageLog.cached == True,
                    or_(
                        ApiUsageLog.cache_type.is_(None),
                        ~ApiUsageLog.cache_type.like('semantic%')
                    )
                )
            )
        )
    
    # REQUIRED: Workspace-based filtering for data isolation
    if workspace_id:
        query = query.filter(ApiUsageLog.workspace_id == workspace_id)
    else:
        # Fallback to optional workspace_id from params (backward compatibility)
        if params.get('workspace_id'):
            query = query.filter(ApiUsageLog.workspace_id == params['workspace_id'])
    
    if params.get('provider'):
        query = query.filter(ApiUsageLog.provider == params['provider'])
    
    if params.get('model'):
        query = query.filter(ApiUsageLog.model == params['model'])
    
    if params.get('cached') is not None:
        cached_value = params.get('cached').lower() == 'true'
        query = query.filter(ApiUsageLog.cached == cached_value)
    
    if params.get('rag') is not None:
        rag_value = params.get('rag').lower() == 'true'
        query = query.filter(ApiUsageLog.document_contexts == rag_value)
    
    return query, start_date_ist, end_date_ist


@analytics_routes.route("/analytics/overview", methods=["GET"])
@require_auth
def get_overview():
    """
    Get summary statistics for the analytics dashboard
    Returns: total requests, tokens, cost, latencies, rates
    Note: Data is automatically scoped to the authenticated user's workspace
    Note: Semantic cache hits are excluded from token/cost calculations
    """
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        # Get all requests for counting
        query_all, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=False)
        # Get non-semantic-cached requests for cost/token calculations
        query_billable, _, _ = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=True)
        
        # Total requests (all requests)
        total_requests = query_all.count()
        
        if total_requests == 0:
            return jsonify({
                "total_requests": 0,
                "total_tokens": 0,
                "total_prompt_tokens": 0,
                "total_completion_tokens": 0,
                "avg_tokens_per_request": 0,
                "total_cost_usd": 0,
                "avg_latency_ms": 0,
                "cache_hit_rate": 0,
                "rag_usage_rate": 0,
                "error_rate": 0
            }), 200
        
        # Aggregate statistics (excluding semantic cache)
        stats = query_billable.with_entities(
            func.sum(ApiUsageLog.tokens_used).label('total_tokens'),
            func.sum(ApiUsageLog.prompt_tokens).label('total_prompt_tokens'),
            func.sum(ApiUsageLog.completion_tokens).label('total_completion_tokens'),
            func.sum(ApiUsageLog.usage).label('total_cost'),
            func.avg(ApiUsageLog.response_time_ms).label('avg_latency')
        ).first()
        
        # Count-based stats (all requests)
        count_stats = query_all.with_entities(
            func.sum(case((ApiUsageLog.cached == True, 1), else_=0)).label('cached_count'),
            func.sum(case((ApiUsageLog.document_contexts == True, 1), else_=0)).label('rag_count'),
            func.sum(case((ApiUsageLog.status_code >= 400, 1), else_=0)).label('error_count')
        ).first()
        
        total_tokens = float(stats.total_tokens or 0)
        total_prompt_tokens = float(stats.total_prompt_tokens or 0)
        total_completion_tokens = float(stats.total_completion_tokens or 0)
        total_cost = float(stats.total_cost or 0)
        avg_latency = float(stats.avg_latency or 0)
        cached_count = int(count_stats.cached_count or 0)
        rag_count = int(count_stats.rag_count or 0)
        error_count = int(count_stats.error_count or 0)
        
        return jsonify({
            "total_requests": total_requests,
            "total_tokens": int(total_tokens),
            "total_prompt_tokens": int(total_prompt_tokens),
            "total_completion_tokens": int(total_completion_tokens),
            "avg_tokens_per_request": int(total_tokens / total_requests) if total_requests > 0 else 0,
            "total_cost_usd": round(total_cost, 6),
            "avg_latency_ms": round(avg_latency, 2),
            "cache_hit_rate": round(cached_count / total_requests, 4) if total_requests > 0 else 0,
            "rag_usage_rate": round(rag_count / total_requests, 4) if total_requests > 0 else 0,
            "error_rate": round(error_count / total_requests, 4) if total_requests > 0 else 0
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_overview: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/trends", methods=["GET"])
@require_auth
def get_trends():
    """
    Get time-series data for requests, tokens, cost, and errors
    Query params: interval (day|week|month)
    Note: Data is automatically scoped to the authenticated user's workspace
    Note: Semantic cache hits are excluded from token/cost calculations
    """
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        # Exclude semantic cache for token/cost calculations
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=True)
        
        interval = params.get('interval', 'day')
        
        # Convert UTC timestamps to India timezone (UTC+5:30) before grouping
        india_time_expr = func.timezone('Asia/Kolkata', func.timezone('UTC', ApiUsageLog.created_at))
        
        if interval == 'week':
            date_group = func.date_trunc('week', india_time_expr)
        elif interval == 'month':
            date_group = func.date_trunc('month', india_time_expr)
        else:  # day
            date_group = func.date_trunc('day', india_time_expr)
        
        # Cast to date for cleaner grouping
        date_group = func.date(date_group)
        
        # Group by date and aggregate
        trends = query.with_entities(
            date_group.label('date'),
            func.count(ApiUsageLog.id).label('requests'),
            func.sum(ApiUsageLog.tokens_used).label('tokens'),
            func.sum(ApiUsageLog.usage).label('cost_usd'),
            func.sum(case((ApiUsageLog.status_code >= 400, 1), else_=0)).label('errors')
        ).group_by('date').order_by('date').all()
        
        result = []
        for trend in trends:
            result.append({
                "date": format_date_for_response(trend.date),
                "requests": int(trend.requests or 0),
                "tokens": int(trend.tokens or 0),
                "cost_usd": round(float(trend.cost_usd or 0), 6),
                "errors": int(trend.errors or 0)
            })
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_trends: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/models", methods=["GET"])
@require_auth
def get_models_breakdown():
    """Get model-wise breakdown of usage (workspace-scoped)
    Note: Semantic cache hits are excluded from token/cost calculations
    """
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        # Exclude semantic cache for accurate cost/token data
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=True)
        
        models = query.with_entities(
            ApiUsageLog.model,
            func.count(ApiUsageLog.id).label('requests'),
            func.sum(ApiUsageLog.tokens_used).label('tokens'),
            func.sum(ApiUsageLog.usage).label('cost_usd'),
            func.avg(ApiUsageLog.response_time_ms).label('avg_latency_ms')
        ).group_by(ApiUsageLog.model).order_by(func.sum(ApiUsageLog.usage).desc()).all()
        
        result = []
        for model in models:
            if model.model:  # Skip null models
                result.append({
                    "model": model.model,
                    "requests": int(model.requests or 0),
                    "tokens": int(model.tokens or 0),
                    "cost_usd": round(float(model.cost_usd or 0), 6),
                    "avg_latency_ms": round(float(model.avg_latency_ms or 0), 2)
                })
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_models_breakdown: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/providers", methods=["GET"])
@require_auth
def get_providers_comparison():
    """Get provider-wise comparison (workspace-scoped)
    Note: Semantic cache hits are excluded from token/cost calculations
    """
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        # Exclude semantic cache for accurate cost/token data
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=True)
        
        providers = query.with_entities(
            ApiUsageLog.provider,
            func.count(ApiUsageLog.id).label('requests'),
            func.sum(ApiUsageLog.tokens_used).label('tokens'),
            func.sum(ApiUsageLog.usage).label('cost_usd')
        ).group_by(ApiUsageLog.provider).order_by(func.sum(ApiUsageLog.usage).desc()).all()
        
        result = []
        for provider in providers:
            if provider.provider:  # Skip null providers
                result.append({
                    "provider": provider.provider,
                    "requests": int(provider.requests or 0),
                    "tokens": int(provider.tokens or 0),
                    "cost_usd": round(float(provider.cost_usd or 0), 6)
                })
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_providers_comparison: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/errors", methods=["GET"])
@require_auth
def get_errors():
    """Get error statistics (workspace-scoped)"""
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id)
        
        total_requests = query.count()
        
        # Error requests
        error_query = query.filter(ApiUsageLog.status_code >= 400)
        error_count = error_query.count()
        
        # Top errors
        top_errors = error_query.with_entities(
            ApiUsageLog.error_message,
            func.count(ApiUsageLog.id).label('count')
        ).filter(ApiUsageLog.error_message.isnot(None))\
         .group_by(ApiUsageLog.error_message)\
         .order_by(func.count(ApiUsageLog.id).desc())\
         .limit(10).all()
        
        # Average error latency
        avg_error_latency = error_query.with_entities(
            func.avg(ApiUsageLog.response_time_ms)
        ).scalar() or 0
        
        return jsonify({
            "error_rate": round(error_count / total_requests, 4) if total_requests > 0 else 0,
            "top_errors": [
                {
                    "message": error.error_message,
                    "count": int(error.count)
                } for error in top_errors
            ],
            "avg_error_latency_ms": round(float(avg_error_latency), 2)
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_errors: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/caching", methods=["GET"])
@require_auth
def get_caching_stats():
    """Get caching statistics and performance (workspace-scoped)"""
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        # Get all requests (including semantic cache)
        query_all, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=False)
        
        total_requests = query_all.count()
        
        # Cache stats
        cache_stats = query_all.with_entities(
            func.sum(case((and_(ApiUsageLog.cached == True, ApiUsageLog.cache_type == 'exact'), 1), else_=0)).label('exact_hits'),
            func.sum(case((and_(ApiUsageLog.cached == True, ApiUsageLog.cache_type.like('semantic%')), 1), else_=0)).label('semantic_hits'),
            func.sum(case((ApiUsageLog.cached == False, 1), else_=0)).label('non_cached')
        ).first()
        
        exact_hits = int(cache_stats.exact_hits or 0)
        semantic_hits = int(cache_stats.semantic_hits or 0)
        non_cached = int(cache_stats.non_cached or 0)
        total_cache_hits = exact_hits + semantic_hits
        
        # Cost savings from semantic cache (these would have incurred cost)
        semantic_cache_savings = query_all.filter(
            and_(
                ApiUsageLog.cached == True,
                ApiUsageLog.cache_type.like('semantic%')
            )
        ).with_entities(
            func.sum(ApiUsageLog.usage)
        ).scalar() or 0
        
        # Average latencies
        cached_latency = query_all.filter(ApiUsageLog.cached == True).with_entities(
            func.avg(ApiUsageLog.response_time_ms)
        ).scalar() or 0
        
        uncached_latency = query_all.filter(ApiUsageLog.cached == False).with_entities(
            func.avg(ApiUsageLog.response_time_ms)
        ).scalar() or 0
        
        # Token savings from all cache hits
        token_savings = query_all.filter(ApiUsageLog.cached == True).with_entities(
            func.sum(ApiUsageLog.tokens_used)
        ).scalar() or 0
        
        return jsonify({
            "cache_hit_rate": round(total_cache_hits / total_requests, 4) if total_requests > 0 else 0,
            "exact_cache_hits": exact_hits,
            "semantic_cache_hits": semantic_hits,
            "non_cached_requests": non_cached,
            "avg_latency_cached": round(float(cached_latency), 2),
            "avg_latency_uncached": round(float(uncached_latency), 2),
            "token_savings": int(token_savings),
            "cost_saved_usd": round(float(semantic_cache_savings), 6)
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_caching_stats: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/rag", methods=["GET"])
@require_auth
def get_rag_stats():
    """Get RAG usage statistics (workspace-scoped)"""
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id)
        
        total_requests = query.count()
        
        # RAG query count
        rag_count = query.filter(ApiUsageLog.document_contexts == True).count()
        
        # RAG vs non-RAG comparisons
        rag_stats = query.filter(ApiUsageLog.document_contexts == True).with_entities(
            func.avg(ApiUsageLog.tokens_used).label('avg_tokens'),
            func.avg(ApiUsageLog.response_time_ms).label('avg_latency')
        ).first()
        
        non_rag_stats = query.filter(ApiUsageLog.document_contexts == False).with_entities(
            func.avg(ApiUsageLog.tokens_used).label('avg_tokens'),
            func.avg(ApiUsageLog.response_time_ms).label('avg_latency')
        ).first()
        
        return jsonify({
            "rag_query_count": rag_count,
            "rag_usage_rate": round(rag_count / total_requests, 4) if total_requests > 0 else 0,
            "avg_tokens_rag": round(float(rag_stats.avg_tokens or 0), 2),
            "avg_tokens_non_rag": round(float(non_rag_stats.avg_tokens or 0), 2),
            "avg_latency_rag": round(float(rag_stats.avg_latency or 0), 2),
            "avg_latency_non_rag": round(float(non_rag_stats.avg_latency or 0), 2)
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_rag_stats: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/endpoints", methods=["GET"])
@require_auth
def get_endpoints_stats():
    """Get endpoint-level statistics (workspace-scoped)
    Note: Semantic cache hits are excluded from token/cost calculations
    """
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        # Exclude semantic cache for accurate cost/token data
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=True)
        
        endpoints = query.with_entities(
            ApiUsageLog.endpoint,
            func.count(ApiUsageLog.id).label('requests'),
            func.sum(ApiUsageLog.tokens_used).label('tokens'),
            func.sum(ApiUsageLog.usage).label('cost_usd')
        ).group_by(ApiUsageLog.endpoint).order_by(func.count(ApiUsageLog.id).desc()).all()
        
        result = []
        for endpoint in endpoints:
            if endpoint.endpoint:  # Skip null endpoints
                result.append({
                    "endpoint": endpoint.endpoint,
                    "requests": int(endpoint.requests or 0),
                    "tokens": int(endpoint.tokens or 0),
                    "cost_usd": round(float(endpoint.cost_usd or 0), 6)
                })
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_endpoints_stats: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/user_agents", methods=["GET"])
@require_auth
def get_user_agents():
    """Get client usage by user agent (workspace-scoped)"""
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id)
        
        user_agents = query.with_entities(
            ApiUsageLog.user_agent,
            func.count(ApiUsageLog.id).label('requests')
        ).group_by(ApiUsageLog.user_agent)\
         .order_by(func.count(ApiUsageLog.id).desc())\
         .limit(20).all()
        
        result = []
        for ua in user_agents:
            if ua.user_agent:  # Skip null user agents
                result.append({
                    "user_agent": ua.user_agent,
                    "requests": int(ua.requests or 0)
                })
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_user_agents: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/performance", methods=["GET"])
@require_auth
def get_performance():
    """Get latency and throughput insights (workspace-scoped)
    Note: Semantic cache hits are excluded from slowest models calculation
    """
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        # Use all queries for overall performance
        query_all, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=False)
        # Exclude semantic cache for model performance
        query_billable, _, _ = build_base_query(params, workspace_id=workspace_id, exclude_semantic_cache=True)
        
        # Overall performance (all requests)
        perf_stats = query_all.with_entities(
            func.avg(ApiUsageLog.response_time_ms).label('avg_response_time'),
            func.avg(ApiUsageLog.first_token_latency).label('avg_first_token'),
            func.avg(ApiUsageLog.throughput).label('avg_throughput')
        ).first()
        
        # Slowest models (exclude semantic cache)
        slowest_models = query_billable.with_entities(
            ApiUsageLog.model,
            func.avg(ApiUsageLog.response_time_ms).label('avg_latency')
        ).group_by(ApiUsageLog.model)\
         .order_by(func.avg(ApiUsageLog.response_time_ms).desc())\
         .limit(10).all()
        
        return jsonify({
            "avg_response_time_ms": round(float(perf_stats.avg_response_time or 0), 2),
            "avg_first_token_latency": round(float(perf_stats.avg_first_token or 0), 4),
            "avg_throughput": round(float(perf_stats.avg_throughput or 0), 2),
            "slowest_models": [
                {
                    "model": model.model,
                    "avg_latency": round(float(model.avg_latency or 0), 2)
                } for model in slowest_models if model.model
            ]
        }), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_performance: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/ip", methods=["GET"])
@require_auth
def get_ip_stats():
    """Get per-IP statistics (workspace-scoped)"""
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id)
        
        ips = query.with_entities(
            ApiUsageLog.ip_address,
            func.count(ApiUsageLog.id).label('requests')
        ).group_by(ApiUsageLog.ip_address)\
         .order_by(func.count(ApiUsageLog.id).desc())\
         .limit(50).all()
        
        result = []
        for ip in ips:
            if ip.ip_address:  # Skip null IPs
                result.append({
                    "ip_address": ip.ip_address,
                    "requests": int(ip.requests or 0)
                })
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in get_ip_stats: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@analytics_routes.route("/analytics/export", methods=["GET"])
@require_auth
def export_analytics():
    """Export analytics data as CSV (workspace-scoped)"""
    try:
        # Extract workspace_id from authenticated user's token
        workspace_id = request.user.get('workspace_id')
        
        params = request.args.to_dict()
        query, start_date_ist, end_date_ist = build_base_query(params, workspace_id=workspace_id)
        
        # Get all logs
        logs = query.limit(10000).all()  # Limit to prevent memory issues
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            'Created At', 'Endpoint', 'Model', 'Provider', 'Status Code',
            'Tokens Used', 'Prompt Tokens', 'Completion Tokens',
            'Cost USD', 'Response Time MS', 'Cached', 'Cache Type',
            'RAG Used', 'Error Message', 'IP Address', 'User Agent'
        ])
        
        # Data rows
        for log in logs:
            writer.writerow([
                log.created_at.isoformat() if log.created_at else '',
                log.endpoint or '',
                log.model or '',
                log.provider or '',
                log.status_code or '',
                log.tokens_used or 0,
                log.prompt_tokens or 0,
                log.completion_tokens or 0,
                log.usage or 0,
                log.response_time_ms or 0,
                log.cached or False,
                log.cache_type or '',
                log.document_contexts or False,
                log.error_message or '',
                log.ip_address or '',
                log.user_agent or ''
            ])
        
        output.seek(0)
        
        return Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={
                'Content-Disposition': f'attachment; filename=analytics_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            }
        )
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Error in export_analytics: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500
