#!/usr/bin/env python3
"""
Adds background_image_url field to the Newsletter Sign Up section template schema.
"""
import os
import json
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def supabase_request(method, path, body=None):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("apikey", SUPABASE_SERVICE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_SERVICE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=representation")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

# Fetch current template
rows = supabase_request("GET", "section_templates?component_name=eq.NewsletterSignUp&select=*")

if not rows:
    print("ERROR: NewsletterSignUp template not found")
    exit(1)

template = rows[0]
schema = template.get("schema", {})
default_data = template.get("default_data", {})

print("Current schema properties:", list(schema.get("properties", {}).keys()))

# Add background_image_url to schema
properties = schema.get("properties", {})
properties["background_image_url"] = {
    "type": "string",
    "title": "Background Image"
}

# Insert it after background_color for logical ordering
ordered = {}
for k, v in properties.items():
    ordered[k] = v
    if k == "background_color":
        ordered["background_image_url"] = properties["background_image_url"]

# Remove duplicate if it was added twice
seen = {}
final = {}
for k, v in ordered.items():
    if k not in seen:
        seen[k] = True
        final[k] = v

schema["properties"] = final
default_data["background_image_url"] = ""

# Update template
supabase_request("PATCH", "section_templates?component_name=eq.NewsletterSignUp", {
    "schema": schema,
    "default_data": default_data
})

print("Updated schema properties:", list(schema["properties"].keys()))
print("SUCCESS: NewsletterSignUp template updated with background_image_url field")
