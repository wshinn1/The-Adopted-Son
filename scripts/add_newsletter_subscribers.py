import os
import urllib.request
import urllib.parse
import json

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not url or not key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

sql = """
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text,
  subscribed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);
"""

data = json.dumps({"query": sql}).encode("utf-8")
req = urllib.request.Request(
    f"{url}/rest/v1/rpc/exec_sql",
    data=data,
    headers={
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    },
    method="POST",
)

# Try using the SQL API endpoint instead
sql_endpoint = f"{url}/rest/v1/"
print(f"Connecting to: {url}")

# Use management API via pg connection string approach
# Fall back to direct REST approach using PostgREST
import urllib.request

# Try Supabase's query endpoint
query_url = f"{url}/rest/v1/rpc/exec"
body = json.dumps({"sql": sql}).encode()

try:
    req2 = urllib.request.Request(
        query_url,
        data=body,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="POST",
    )
    with urllib.request.urlopen(req2) as resp:
        print("Success:", resp.status)
except Exception as e:
    print(f"RPC exec not available: {e}")
    print("\nPlease run this SQL manually in Supabase SQL Editor:")
    print(sql)
