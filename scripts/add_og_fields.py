import os
import urllib.request
import json

supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not supabase_url or not service_key:
    print("Missing env vars")
    exit(1)

# Extract project ref from URL e.g. https://abcdef.supabase.co -> abcdef
project_ref = supabase_url.replace("https://", "").split(".")[0]
print(f"Project ref: {project_ref}")

# Use Supabase Management API to run SQL
mgmt_url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"

sql = """
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_title text;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_description text;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_image_url text;
"""

# Try Management API with service key
data = json.dumps({"query": sql}).encode("utf-8")
headers = {
    "Authorization": f"Bearer {service_key}",
    "Content-Type": "application/json",
}

req = urllib.request.Request(mgmt_url, data=data, headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as resp:
        result = resp.read().decode()
        print(f"Migration successful: {result}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"HTTP {e.code}: {body[:400]}")

    # Fallback: try Supabase SQL endpoint directly
    print("Trying direct SQL via PostgREST RPC...")
    sql_url = f"{supabase_url}/rest/v1/rpc/exec_sql"
    data2 = json.dumps({"sql": sql}).encode("utf-8")
    headers2 = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    req2 = urllib.request.Request(sql_url, data=data2, headers=headers2, method="POST")
    try:
        with urllib.request.urlopen(req2) as resp2:
            result2 = resp2.read().decode()
            print(f"RPC result: {result2}")
    except urllib.error.HTTPError as e2:
        body2 = e2.read().decode()
        print(f"RPC HTTP {e2.code}: {body2[:400]}")
except Exception as e:
    print(f"Error: {e}")
