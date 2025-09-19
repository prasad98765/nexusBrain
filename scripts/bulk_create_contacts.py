import requests
import random
import string
from datetime import datetime, timedelta

API_URL = "http://localhost:5001/api/contacts"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYTAzNDIxYjctYTAwNS00OTFjLTk5NmEtM2E5YmUwMGUxMWNkIiwiZW1haWwiOiJwbmNoYXVkaGFyaTE5OTZAZ21haWwuY29tIiwid29ya3NwYWNlX2lkIjoiNzlmNDIzYmEtZmUwZC00ZTY3LWI1OTUtOTVkMWJiMjRiZWNjIiwiZXhwIjoxNzU4MTI0ODIyLCJpYXQiOjE3NTc5NTIwMjJ9.BDccgIIeTUgE8daiqVdiNbINrKAbFQSQwvwDu008-rQ"  # Replace with a valid token
WORKSPACE_ID = "79f423ba-fe0d-4e67-b595-95d1bb24becc"  # Replace with your workspace id

# Country codes and names for diversity
COUNTRIES = [
    ("+1", "USA"), ("+44", "UK"), ("+91", "India"), ("+81", "Japan"), ("+49", "Germany"),
    ("+33", "France"), ("+61", "Australia"), ("+86", "China"), ("+7", "Russia"), ("+39", "Italy")
]

# Generate random contacts
contacts = []

# Use fixed created time for all contacts
fixed_created = datetime(2025, 9, 15)
for i in range(50):
    country_code, country_name = random.choice(COUNTRIES)
    name = f"{country_name} User {i+1}"
    email = f"{name.replace(' ', '').lower()}@example.com"
    phone = f"{country_code}{random.randint(1000000000,9999999999)}"
    # Modified time can be random, but created time is fixed
    # get created and modified time randomly within last 10 days and modified after created
    created_at = fixed_created - timedelta(days=random.randint(0, 10))
    updated_at = created_at + timedelta(days=random.randint(0, 10), hours=random.randint(0, 23), minutes=random.randint(0, 59))

    contacts.append({
        "name": name,
        "email": email,
        "phone": phone,
        "workspaceId": WORKSPACE_ID,
        "customFields": {"country": country_name},
        "createdAt": created_at.isoformat(),
        "updatedAt": updated_at.isoformat()
    })

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

for contact in contacts:
    resp = requests.post(API_URL, json=contact, headers=headers)
    print(f"Created: {contact['name']} | Status: {resp.status_code}")
    if resp.status_code != 201:
        print(resp.text)
