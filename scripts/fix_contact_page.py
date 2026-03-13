#!/usr/bin/env python3
"""
1. Publishes the Contact page
2. Removes the duplicate page_sections row (keeps the original)
"""
import os
import json
import urllib.request

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

PAGE_ID = "0de7bc4a-011d-45bd-b0ce-1a58a0a614ee"
DUPLICATE_SECTION_ID = "0ac6241a-2334-4b2f-af43-4d91a40cf166"  # the one just added

def req(method, path, body=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("apikey", SUPABASE_SERVICE_KEY)
    r.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    r.add_header("Content-Type", "application/json")
    r.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(r) as resp:
        return json.loads(resp.read().decode())

# 1. Publish the contact page
result = req("PATCH", f"pages?id=eq.{PAGE_ID}", {"is_published": True})
print(f"Published contact page: {result}")

# 2. Delete the duplicate section
result = req("DELETE", f"page_sections?id=eq.{DUPLICATE_SECTION_ID}")
print(f"Deleted duplicate section: done")

# 3. Confirm what's left
sections = req("GET", f"page_sections?page_id=eq.{PAGE_ID}&select=id,template_id,sort_order,is_visible")
print(f"Remaining sections on contact page: {sections}")
