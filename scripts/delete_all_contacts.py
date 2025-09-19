import requests

API_URL = "http://localhost:5001/api/contacts"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYTAzNDIxYjctYTAwNS00OTFjLTk5NmEtM2E5YmUwMGUxMWNkIiwiZW1haWwiOiJwbmNoYXVkaGFyaTE5OTZAZ21haWwuY29tIiwid29ya3NwYWNlX2lkIjoiNzlmNDIzYmEtZmUwZC00ZTY3LWI1OTUtOTVkMWJiMjRiZWNjIiwiZXhwIjoxNzU4MTI0ODIyLCJpYXQiOjE3NTc5NTIwMjJ9.BDccgIIeTUgE8daiqVdiNbINrKAbFQSQwvwDu008-rQ"
WORKSPACE_ID = "79f423ba-fe0d-4e67-b595-95d1bb24becc"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 1. Get all contacts for the workspace
resp = requests.get(f"{API_URL}?workspace_id={WORKSPACE_ID}&limit=1000", headers=headers)
if resp.status_code == 200:
    contacts = resp.json().get("contacts", [])
    print(f"Found {len(contacts)} contacts. Deleting...")
    # 2. Delete each contact
    for contact in contacts:
        del_resp = requests.delete(f"{API_URL}/{contact['id']}", headers=headers)
        print(f"Deleted: {contact['name']} | Status: {del_resp.status_code}")
        if del_resp.status_code != 200:
            print(del_resp.text)
else:
    print("Failed to fetch contacts:", resp.text)
