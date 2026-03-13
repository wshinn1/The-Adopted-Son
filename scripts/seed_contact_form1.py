#!/usr/bin/env python3
"""
Seeds the ContactForm1 section template into Supabase.
"""
import os
import json
import urllib.request

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

# Check if template already exists
existing = supabase_request("GET", "section_templates?component_name=eq.ContactForm1&select=id")
if existing:
    print(f"ContactForm1 template already exists (id: {existing[0]['id']}), skipping.")
else:
    template = {
        "component_name": "ContactForm1",
        "label": "Contact Form",
        "description": "A clean contact form with Name, Email, and Message fields.",
        "default_data": {
            "heading": "Contact",
            "subheading": "Have a question or just want to say hello? Fill out the form below and we'll get back to you.",
            "button_text": "Submit",
            "success_message": "Thank you for reaching out! We'll be in touch soon.",
            "background_color": "#ffffff",
            "text_color": "#1a1a1a",
        },
        "schema": {
            "fields": [
                {"key": "heading", "label": "Heading", "type": "text"},
                {"key": "subheading", "label": "Subheading", "type": "textarea"},
                {"key": "button_text", "label": "Button Text", "type": "text"},
                {"key": "success_message", "label": "Success Message", "type": "text"},
                {"key": "background_color", "label": "Background Color", "type": "color"},
                {"key": "text_color", "label": "Text Color", "type": "color"},
            ]
        },
    }
    result = supabase_request("POST", "section_templates", template)
    print(f"Created ContactForm1 template: {result}")
