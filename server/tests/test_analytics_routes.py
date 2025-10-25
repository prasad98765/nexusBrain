"""
Comprehensive test suite for Analytics Routes
Tests all 11 analytics endpoints with various scenarios
"""

import pytest
import json
from datetime import datetime, timedelta
from server.app import create_app
from server.database import db
from server.models import User, Workspace, ApiToken, ApiUsageLog
from uuid import uuid4


@pytest.fixture
def app():
    """Create and configure a test app instance"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client for making requests"""
    return app.test_client()


@pytest.fixture
def auth_headers(app):
    """Create authenticated user and return auth headers"""
    with app.app_context():
        # Create user
        user = User(
            id=str(uuid4()),
            email='test@example.com',
            first_name='Test',
            last_name='User',
            password_hash='hashed_password',
            is_verified=True
        )
        db.session.add(user)
        
        # Create workspace
        workspace = Workspace(
            id=str(uuid4()),
            name='Test Workspace',
            owner_id=user.id,
            balance=100.0
        )
        db.session.add(workspace)
        
        # Create API token
        token = ApiToken(
            id=str(uuid4()),
            token='test_token_hash',
            workspace_id=workspace.id,
            user_id=user.id,
            is_active=True
        )
        db.session.add(token)
        db.session.commit()
        
        # Create mock auth token (in real app, this would be JWT)
        return {'Authorization': 'Bearer test_auth_token'}, workspace.id, token.id


@pytest.fixture
def sample_logs(app, auth_headers):
    """Create sample usage logs for testing"""
    _, workspace_id, token_id = auth_headers
    
    with app.app_context():
        logs = []
        base_time = datetime.utcnow() - timedelta(days=30)
        
        # Create diverse set of logs
        for i in range(100):
            log = ApiUsageLog(
                id=str(uuid4()),
                token_id=token_id,
                workspace_id=workspace_id,
                endpoint='/chat/completions' if i % 2 == 0 else '/completions',
                model='gpt-4' if i % 3 == 0 else 'gpt-4o-mini',
                provider='OpenAI' if i % 2 == 0 else 'Anthropic',
                status_code=200 if i % 10 != 0 else 400,  # 10% errors
                tokens_used=100 + (i * 10),
                prompt_tokens=50 + (i * 5),
                completion_tokens=50 + (i * 5),
                usage=0.001 * (i + 1),
                response_time_ms=150 + (i * 2),
                cached=i % 5 == 0,  # 20% cached
                cache_type='exact' if i % 10 == 0 else ('semantic' if i % 5 == 0 else None),
                document_contexts=i % 7 == 0,  # ~14% RAG
                error_message='Rate limit exceeded' if i % 10 == 0 else None,
                ip_address=f'192.168.1.{i % 50}',
                user_agent=f'TestClient/{i % 3}.0',
                first_token_latency=1.5,
                throughput=45.0,
                created_at=base_time + timedelta(days=i % 30, hours=i % 24)
            )
            logs.append(log)
            db.session.add(log)
        
        db.session.commit()
        return logs


class TestAnalyticsOverview:
    """Test /analytics/overview endpoint"""
    
    def test_overview_success(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/overview?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'total_requests' in data
        assert 'total_tokens' in data
        assert 'total_cost_usd' in data
        assert 'avg_latency_ms' in data
        assert 'cache_hit_rate' in data
        assert 'rag_usage_rate' in data
        assert 'error_rate' in data
        
        assert data['total_requests'] == 100
        assert data['total_tokens'] > 0
        assert 0 <= data['cache_hit_rate'] <= 1
        assert 0 <= data['error_rate'] <= 1
    
    def test_overview_missing_dates(self, client, auth_headers):
        headers, _, _ = auth_headers
        response = client.get('/api/analytics/overview', headers=headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    def test_overview_no_data(self, client, auth_headers):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=365)).isoformat()
        end_date = (datetime.utcnow() - timedelta(days=360)).isoformat()
        
        response = client.get(
            f'/api/analytics/overview?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['total_requests'] == 0


class TestAnalyticsTrends:
    """Test /analytics/trends endpoint"""
    
    def test_trends_daily(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/trends?start_date={start_date}&end_date={end_date}&interval=day',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert isinstance(data, list)
        if len(data) > 0:
            assert 'date' in data[0]
            assert 'requests' in data[0]
            assert 'tokens' in data[0]
            assert 'cost_usd' in data[0]
            assert 'errors' in data[0]
    
    def test_trends_weekly(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/trends?start_date={start_date}&end_date={end_date}&interval=week',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)
    
    def test_trends_monthly(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=90)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/trends?start_date={start_date}&end_date={end_date}&interval=month',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert isinstance(data, list)


class TestAnalyticsModels:
    """Test /analytics/models endpoint"""
    
    def test_models_breakdown(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/models?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert isinstance(data, list)
        if len(data) > 0:
            assert 'model' in data[0]
            assert 'requests' in data[0]
            assert 'tokens' in data[0]
            assert 'cost_usd' in data[0]
            assert 'avg_latency_ms' in data[0]
    
    def test_models_filter_by_model(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/models?start_date={start_date}&end_date={end_date}&model=gpt-4',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert isinstance(data, list)
        for item in data:
            assert item['model'] == 'gpt-4'


class TestAnalyticsProviders:
    """Test /analytics/providers endpoint"""
    
    def test_providers_comparison(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/providers?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert isinstance(data, list)
        if len(data) > 0:
            assert 'provider' in data[0]
            assert 'requests' in data[0]
            assert 'tokens' in data[0]
            assert 'cost_usd' in data[0]


class TestAnalyticsErrors:
    """Test /analytics/errors endpoint"""
    
    def test_errors_stats(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/errors?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'error_rate' in data
        assert 'top_errors' in data
        assert 'avg_error_latency_ms' in data
        assert isinstance(data['top_errors'], list)
        
        if len(data['top_errors']) > 0:
            assert 'message' in data['top_errors'][0]
            assert 'count' in data['top_errors'][0]


class TestAnalyticsCaching:
    """Test /analytics/caching endpoint"""
    
    def test_caching_stats(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/caching?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'cache_hit_rate' in data
        assert 'exact_cache_hits' in data
        assert 'semantic_cache_hits' in data
        assert 'non_cached_requests' in data
        assert 'avg_latency_cached' in data
        assert 'avg_latency_uncached' in data
        assert 'token_savings' in data
        
        assert 0 <= data['cache_hit_rate'] <= 1


class TestAnalyticsRAG:
    """Test /analytics/rag endpoint"""
    
    def test_rag_stats(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/rag?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'rag_query_count' in data
        assert 'rag_usage_rate' in data
        assert 'avg_tokens_rag' in data
        assert 'avg_tokens_non_rag' in data
        assert 'avg_latency_rag' in data
        assert 'avg_latency_non_rag' in data


class TestAnalyticsEndpoints:
    """Test /analytics/endpoints endpoint"""
    
    def test_endpoints_stats(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/endpoints?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert isinstance(data, list)
        if len(data) > 0:
            assert 'endpoint' in data[0]
            assert 'requests' in data[0]
            assert 'tokens' in data[0]
            assert 'cost_usd' in data[0]


class TestAnalyticsUserAgents:
    """Test /analytics/user_agents endpoint"""
    
    def test_user_agents_stats(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/user_agents?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert isinstance(data, list)
        if len(data) > 0:
            assert 'user_agent' in data[0]
            assert 'requests' in data[0]


class TestAnalyticsPerformance:
    """Test /analytics/performance endpoint"""
    
    def test_performance_stats(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/performance?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert 'avg_response_time_ms' in data
        assert 'avg_first_token_latency' in data
        assert 'avg_throughput' in data
        assert 'slowest_models' in data
        assert isinstance(data['slowest_models'], list)


class TestAnalyticsIP:
    """Test /analytics/ip endpoint"""
    
    def test_ip_stats(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/ip?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert isinstance(data, list)
        if len(data) > 0:
            assert 'ip_address' in data[0]
            assert 'requests' in data[0]


class TestAnalyticsExport:
    """Test /analytics/export endpoint"""
    
    def test_export_csv(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/export?start_date={start_date}&end_date={end_date}',
            headers=headers
        )
        
        assert response.status_code == 200
        assert response.content_type == 'text/csv; charset=utf-8'
        assert b'Created At' in response.data
        assert b'Model' in response.data
        assert b'Provider' in response.data


class TestAnalyticsFilters:
    """Test filter combinations"""
    
    def test_workspace_filter(self, client, auth_headers, sample_logs):
        headers, workspace_id, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/overview?start_date={start_date}&end_date={end_date}&workspace_id={workspace_id}',
            headers=headers
        )
        
        assert response.status_code == 200
    
    def test_provider_filter(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/overview?start_date={start_date}&end_date={end_date}&provider=OpenAI',
            headers=headers
        )
        
        assert response.status_code == 200
    
    def test_cached_filter(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/overview?start_date={start_date}&end_date={end_date}&cached=true',
            headers=headers
        )
        
        assert response.status_code == 200
    
    def test_rag_filter(self, client, auth_headers, sample_logs):
        headers, _, _ = auth_headers
        start_date = (datetime.utcnow() - timedelta(days=31)).isoformat()
        end_date = datetime.utcnow().isoformat()
        
        response = client.get(
            f'/api/analytics/overview?start_date={start_date}&end_date={end_date}&rag=true',
            headers=headers
        )
        
        assert response.status_code == 200
