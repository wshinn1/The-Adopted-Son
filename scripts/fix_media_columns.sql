-- Fix media table: copy data from legacy columns to correct columns
-- This migration fixes existing uploads that used wrong column names

-- Update records where blob_url is NULL but url has data
UPDATE media 
SET 
  blob_url = url,
  blob_pathname = pathname,
  mime_type = content_type,
  original_name = COALESCE(original_name, filename)
WHERE blob_url IS NULL AND url IS NOT NULL;

-- Verify the fix
SELECT 
  id, 
  filename,
  blob_url,
  mime_type,
  created_at
FROM media 
ORDER BY created_at DESC 
LIMIT 10;
