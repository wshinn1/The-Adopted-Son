#!/usr/bin/env python3
"""
Finds the Contact page and ContactForm1 template in Supabase,
then inserts a page_sections row linking them if one doesn't already exist.
"""
import os
import json
import urllib.request
import urllib.error

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

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

# 1. Find the contact page
pages = req("GET", "pages?slug=eq.contact&select=id,title,slug,is_published")
print("Contact page rows:", pages)

if not pages:
    print("ERROR: No page found with slug='contact'. Make sure it exists in the admin.")
    exit(1)

page = pages[0]
page_id = page["id"]
print(f"Found page: {page['title']} (id={page_id}, published={page['is_published']})")

# 2. Find the ContactForm1 template
templates = req("GET", "section_templates?component_name=eq.ContactForm1&select=id,component_name,default_data")
print("ContactForm1 template rows:", templates)

if not templates:
    print("ERROR: ContactForm1 template not found. Run seed_contact_form1.py first.")
    exit(1)

template = templates[0]
template_id = template["id"]
default_data = template["default_data"]
print(f"Found template: {template['component_name']} (id={template_id})")

# 3. Check if a section already exists for this page
existing = req("GET", f"page_sections?page_id=eq.{page_id}&template_id=eq.{template_id}&select=id")
print("Existing page_sections rows:", existing)

if existing:
    print("ContactForm1 is already attached to the contact page. Nothing to do.")
    exit(0)

# 4. Insert the page_section
section = req("POST", "page_sections", {
    "page_id": page_id,
    "template_id": template_id,
    "data": default_data,
    "sort_order": 1,
    "is_visible": True,
})
print("Created page_section:", section)
print("Done! ContactForm1 is now attached to the contact page.")
