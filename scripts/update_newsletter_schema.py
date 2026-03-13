#!/usr/bin/env python3
"""
Adds background_image_url field to the Newsletter Sign Up section template schema.
"""
import os
import json
from supabase import create_client

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Fetch current template
result = supabase.table("section_templates").select("*").eq("component_name", "NewsletterSignUp").execute()

if not result.data:
    print("ERROR: NewsletterSignUp template not found")
    exit(1)

template = result.data[0]
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
update_result = supabase.table("section_templates").update({
    "schema": schema,
    "default_data": default_data
}).eq("component_name", "NewsletterSignUp").execute()

print("Updated schema properties:", list(schema["properties"].keys()))
print("SUCCESS: NewsletterSignUp template updated with background_image_url field")
