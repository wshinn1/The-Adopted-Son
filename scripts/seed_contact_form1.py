#!/usr/bin/env python3
"""
Seeds the ContactForm1 section template into Supabase.
Fetches an existing template first to match the exact column structure.
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
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body_bytes = e.read()
        print(f"HTTP {e.code}: {body_bytes.decode()}")
        raise

# Inspect an existing template to understand columns
print("Fetching existing template for column reference...")
existing_templates = supabase_request("GET", "section_templates?limit=1&select=*")
if existing_templates:
    print("Existing template columns:", list(existing_templates[0].keys()))
    print("Sample:", json.dumps(existing_templates[0], indent=2)[:800])
else:
    print("No existing templates found.")

# Check if ContactForm1 already exists
existing = supabase_request("GET", "section_templates?component_name=eq.ContactForm1&select=id")
if existing:
    print(f"ContactForm1 template already exists (id: {existing[0]['id']}), skipping.")
else:
    # Build payload matching exact structure of existing templates
    sample = existing_templates[0] if existing_templates else {}

    default_data = {
        "heading": "Contact",
        "subheading": "Have a question or just want to say hello? Fill out the form below and we'll get back to you.",
        "button_text": "Submit",
        "success_message": "Thank you for reaching out! We'll be in touch soon.",
        "background_color": "#ffffff",
        "text_color": "#1a1a1a",
    }

    schema = {
        "fields": [
            {"key": "heading", "label": "Heading", "type": "text"},
            {"key": "subheading", "label": "Subheading", "type": "textarea"},
            {"key": "button_text", "label": "Button Text", "type": "text"},
            {"key": "success_message", "label": "Success Message", "type": "text"},
            {"key": "background_color", "label": "Background Color", "type": "color"},
            {"key": "text_color", "label": "Text Color", "type": "color"},
        ]
    }

    template = {
        "component_name": "ContactForm1",
        "name": "Contact Form",
        "description": "A clean contact form with Name, Email, and Message fields.",
        "default_data": default_data,
        "schema": schema,
    }

    # Only include keys that exist in the actual table
    if sample:
        allowed_keys = set(sample.keys()) - {"id", "created_at", "updated_at"}
        template = {k: v for k, v in template.items() if k in allowed_keys}
        print("Filtered template keys:", list(template.keys()))

    result = supabase_request("POST", "section_templates", template)
    print(f"Created ContactForm1 template successfully: id={result[0].get('id') if result else 'unknown'}")
