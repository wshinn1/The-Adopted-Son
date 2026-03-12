import os
import urllib.request
import urllib.parse
import json

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    print("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

sql = """
ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS og_title text,
  ADD COLUMN IF NOT EXISTS og_description text,
  ADD COLUMN IF NOT EXISTS og_image_url text;
"""

req = urllib.request.Request(
    f"{url}/rest/v1/rpc/exec_sql" if False else f"{url}/rest/v1/",
)

# Use the SQL endpoint via PostgREST
endpoint = f"{url}/rest/v1/rpc/exec_sql"
headers = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json",
}

# Since exec_sql might not be available, use the pg connection directly via Supabase Management API
mgmt_url = f"https://api.supabase.com/v1/projects/{url.split('.')[0].replace('https://', '')}/database/query"

# Fallback: run ALTER via Supabase REST (won't work directly)
# Instead let's try using psycopg2 with the DB URL
try:
    import psycopg2
    db_url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if db_url:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute("ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_title text;")
        cur.execute("ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_description text;")
        cur.execute("ALTER TABLE pages ADD COLUMN IF NOT EXISTS og_image_url text;")
        conn.close()
        print("Migration successful via psycopg2!")
    else:
        print("No DATABASE_URL found")
except ImportError:
    print("psycopg2 not available, trying supabase-py...")
    try:
        from supabase import create_client
        client = create_client(url, key)
        # Try raw SQL via RPC if available
        result = client.rpc('exec_sql', {'query': sql}).execute()
        print("Migration result:", result)
    except Exception as e:
        print(f"Error: {e}")
except Exception as e:
    print(f"DB Error: {e}")
