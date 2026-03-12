import os
import urllib.request
import urllib.parse
import json

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not url or not key:
    print("Missing env vars")
    exit(1)

templates = [
    {
        "name": "Blog Gallery 1",
        "component_name": "BlogGallery1",
        "description": "Shows the most recent devotional blog posts in a featured banner + card grid layout.",
        "default_data": {
            "heading": "Latest Devotionals",
            "subheading": "",
            "post_count": 3,
            "background_color": "#ffffff",
            "show_featured_banner": True,
        },
        "schema": {
            "type": "object",
            "properties": {
                "heading": {"type": "string", "title": "Section Heading"},
                "subheading": {"type": "string", "title": "Section Subheading"},
                "post_count": {"type": "number", "title": "Number of Grid Posts (2-6)"},
                "background_color": {"type": "string", "title": "Background Color"},
                "show_featured_banner": {"type": "boolean", "title": "Show Featured Banner Post"},
            },
        },
    },
    {
        "name": "Newsletter Sign Up",
        "component_name": "NewsletterSignUp",
        "description": "Email newsletter signup form with first name and email fields. Adds subscribers to Moosend.",
        "default_data": {
            "heading": "Stay Connected",
            "subheading": "Get the latest devotionals delivered to your inbox.",
            "button_text": "Subscribe",
            "success_message": "You are subscribed! Thank you for joining.",
            "background_color": "#F5F2ED",
            "text_color": "#1a1a1a",
        },
        "schema": {
            "type": "object",
            "properties": {
                "heading": {"type": "string", "title": "Heading"},
                "subheading": {"type": "string", "title": "Subheading"},
                "button_text": {"type": "string", "title": "Button Text"},
                "success_message": {"type": "string", "title": "Success Message"},
                "background_color": {"type": "string", "title": "Background Color"},
                "text_color": {"type": "string", "title": "Text Color"},
            },
        },
    },
]

for template in templates:
    body = json.dumps(template).encode("utf-8")
    req = urllib.request.Request(
        f"{url}/rest/v1/section_templates",
        data=body,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Inserted '{template['name']}': {resp.status}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"Error inserting '{template['name']}': {e.code} {body}")
