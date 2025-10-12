#!/usr/bin/env python3
"""
System Prompts API Testing Script
"""
import requests
import json
import sys

# Configuration
API_BASE = "http://localhost:5001/api"
TOKEN = input("Enter your Bearer token: ").strip()

if not TOKEN:
    print("Error: Token required")
    sys.exit(1)

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

print("\n" + "="*60)
print("SYSTEM PROMPTS API TESTING")
print("="*60)

# Test 1: Create a system prompt
print("\n📝 Test 1: Create a system prompt...")
create_data = {
    "title": "Helpful Assistant",
    "prompt": "You are a helpful AI assistant. Always be polite and provide accurate information.",
    "is_active": True
}

response = requests.post(f"{API_BASE}/system_prompts", headers=headers, json=create_data)
print(f"Status: {response.status_code}")
if response.ok:
    data = response.json()
    print(f"✅ Created prompt: {data['title']} (ID: {data['id']})")
    prompt_id = data['id']
else:
    print(f"❌ Error: {response.text}")
    sys.exit(1)

# Test 2: List all system prompts
print("\n📋 Test 2: List all system prompts...")
response = requests.get(f"{API_BASE}/system_prompts?limit=10", headers=headers)
print(f"Status: {response.status_code}")
if response.ok:
    data = response.json()
    prompts = data.get('prompts', [])
    print(f"✅ Found {len(prompts)} prompt(s)")
    for prompt in prompts:
        print(f"   - {prompt['title']} (Active: {prompt['is_active']})")
else:
    print(f"❌ Error: {response.text}")

# Test 3: Get active system prompt
print("\n🎯 Test 3: Get active system prompt...")
response = requests.get(f"{API_BASE}/system_prompts/active", headers=headers)
print(f"Status: {response.status_code}")
if response.ok:
    data = response.json()
    active = data.get('active_prompt')
    if active:
        print(f"✅ Active prompt: {active['title']}")
    else:
        print("ℹ️ No active prompt found")
else:
    print(f"❌ Error: {response.text}")

# Test 4: Enhance a prompt
print("\n✨ Test 4: Enhance a prompt...")
enhance_data = {
    "prompt": "Be helpful to users"
}

response = requests.post(f"{API_BASE}/system_prompts/enhance", headers=headers, json=enhance_data)
print(f"Status: {response.status_code}")
if response.ok:
    data = response.json()
    print(f"✅ Enhanced prompt:")
    print(f"   Original: {data['original_prompt']}")
    print(f"   Enhanced: {data['enhanced_prompt'][:100]}...")
else:
    print(f"❌ Error: {response.text}")

# Test 5: Update the prompt
print("\n📝 Test 5: Update the system prompt...")
update_data = {
    "title": "Updated Helpful Assistant",
    "prompt": "You are an updated helpful AI assistant.",
}

response = requests.put(f"{API_BASE}/system_prompts/{prompt_id}", headers=headers, json=update_data)
print(f"Status: {response.status_code}")
if response.ok:
    data = response.json()
    print(f"✅ Updated prompt: {data['title']}")
else:
    print(f"❌ Error: {response.text}")

# Test 6: Search prompts
print("\n🔍 Test 6: Search prompts...")
response = requests.get(f"{API_BASE}/system_prompts?search=helpful", headers=headers)
print(f"Status: {response.status_code}")
if response.ok:
    data = response.json()
    prompts = data.get('prompts', [])
    print(f"✅ Search found {len(prompts)} prompt(s) matching 'helpful'")
else:
    print(f"❌ Error: {response.text}")

print("\n" + "="*60)
print("🎉 All tests completed!")
print("="*60)

# Cleanup - optionally delete the test prompt
cleanup = input("\nDelete test prompt? (y/N): ").strip().lower()
if cleanup == 'y':
    response = requests.delete(f"{API_BASE}/system_prompts/{prompt_id}", headers=headers)
    if response.ok:
        print("✅ Test prompt deleted")
    else:
        print(f"❌ Failed to delete: {response.text}")