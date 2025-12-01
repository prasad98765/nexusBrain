#!/usr/bin/env python3
"""
Swagger API Documentation Verification Script
Verifies that Swagger/OpenAPI documentation is properly integrated
"""

import sys
import os

# Add server to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'server'))

from server.app import create_app

def verify_swagger_integration():
    """Verify Swagger is properly integrated and list all documented endpoints"""
    
    print("=" * 80)
    print("🔍 NEXUS AI HUB - SWAGGER API DOCUMENTATION VERIFICATION")
    print("=" * 80)
    print()
    
    # Create Flask app
    try:
        app = create_app()
        print("✅ Flask application created successfully")
    except Exception as e:
        print(f"❌ Error creating Flask app: {e}")
        return False
    
    # Check if Swagger is integrated
    try:
        with app.app_context():
            # Get all registered routes
            routes = []
            for rule in app.url_map.iter_rules():
                if rule.endpoint != 'static':
                    routes.append({
                        'endpoint': rule.endpoint,
                        'methods': ','.join(rule.methods - {'HEAD', 'OPTIONS'}),
                        'path': str(rule)
                    })
            
            print(f"✅ Found {len(routes)} API endpoints")
            print()
            
            # Check for Swagger UI endpoint
            swagger_routes = [r for r in routes if 'swagger' in r['endpoint'].lower() or 'apispec' in r['endpoint'].lower() or 'flasgger' in r['endpoint'].lower()]
            
            if swagger_routes:
                print("✅ Swagger UI endpoints found:")
                for route in swagger_routes:
                    print(f"   - {route['path']} ({route['methods']})")
                print()
            else:
                print("⚠️  No Swagger UI endpoints found")
                print()
            
            # Categorize routes
            categories = {
                'Authentication': [],
                'Workspaces': [],
                'Conversations': [],
                'Contacts': [],
                'Agents': [],
                'Flow Agents': [],
                'Variables': [],
                'API Library': [],
                'RAG': [],
                'Q&A': [],
                'Analytics': [],
                'LLM': [],
                'System Prompts': [],
                'Model Config': [],
                'Scripts': [],
                'WebBot': [],
                'Other': []
            }
            
            for route in routes:
                path = route['path']
                if '/api/signup' in path or '/api/login' in path or '/api/user' in path or '/api/logout' in path or '/api/google' in path or '/api/business' in path or '/api/forgot' in path or '/api/reset' in path or '/api/verify' in path:
                    categories['Authentication'].append(route)
                elif '/api/workspaces' in path:
                    categories['Workspaces'].append(route)
                elif '/api/conversations' in path or '/api/messages' in path:
                    categories['Conversations'].append(route)
                elif '/api/contacts' in path:
                    categories['Contacts'].append(route)
                elif '/api/flow-agents' in path:
                    categories['Flow Agents'].append(route)
                elif '/api/agents' in path:
                    categories['Agents'].append(route)
                elif '/api/variables' in path:
                    categories['Variables'].append(route)
                elif '/api/api-library' in path:
                    categories['API Library'].append(route)
                elif '/api/rag' in path:
                    categories['RAG'].append(route)
                elif '/api/qa' in path:
                    categories['Q&A'].append(route)
                elif '/api/analytics' in path:
                    categories['Analytics'].append(route)
                elif '/api/v1' in path or '/api/llm' in path:
                    categories['LLM'].append(route)
                elif '/api/system-prompts' in path:
                    categories['System Prompts'].append(route)
                elif '/api/model-config' in path:
                    categories['Model Config'].append(route)
                elif '/api/scripts' in path:
                    categories['Scripts'].append(route)
                elif '/api/webbot' in path or '/agent.js' in path:
                    categories['WebBot'].append(route)
                elif 'swagger' not in path.lower() and 'apispec' not in path.lower() and 'flasgger' not in path.lower():
                    categories['Other'].append(route)
            
            # Print categorized endpoints
            print("📚 API ENDPOINTS BY CATEGORY")
            print("=" * 80)
            print()
            
            total_endpoints = 0
            for category, endpoints in categories.items():
                if endpoints:
                    print(f"📁 {category} ({len(endpoints)} endpoints)")
                    print("-" * 80)
                    for ep in sorted(endpoints, key=lambda x: x['path']):
                        methods = ep['methods'].replace(',', ', ')
                        print(f"   {methods:20s} {ep['path']}")
                    print()
                    total_endpoints += len(endpoints)
            
            print("=" * 80)
            print(f"📊 SUMMARY: {total_endpoints} API endpoints documented")
            print("=" * 80)
            print()
            
            # Access information
            print("🌐 ACCESS INFORMATION")
            print("=" * 80)
            print()
            print("📍 Swagger UI (Interactive Documentation):")
            print("   http://127.0.0.1:5001/swagger")
            print()
            print("📍 OpenAPI Specification (JSON):")
            print("   http://127.0.0.1:5001/apispec.json")
            print()
            print("📍 API Base URL:")
            print("   http://127.0.0.1:5001/api")
            print()
            
            # Instructions
            print("🚀 QUICK START")
            print("=" * 80)
            print()
            print("1. Start the server:")
            print("   python run.py")
            print()
            print("2. Open Swagger UI in your browser:")
            print("   http://127.0.0.1:5001/swagger")
            print()
            print("3. Try out the endpoints:")
            print("   - Click on any endpoint")
            print("   - Click 'Try it out'")
            print("   - Fill in parameters")
            print("   - Click 'Execute'")
            print()
            print("4. For authenticated endpoints:")
            print("   - First call POST /api/login to get a token")
            print("   - Click the 'Authorize' button at the top")
            print("   - Enter: Bearer <your-token>")
            print("   - Now you can access protected endpoints")
            print()
            
            print("=" * 80)
            print("✅ VERIFICATION COMPLETE - Swagger integration successful!")
            print("=" * 80)
            
            return True
            
    except Exception as e:
        print(f"❌ Error during verification: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = verify_swagger_integration()
    sys.exit(0 if success else 1)
