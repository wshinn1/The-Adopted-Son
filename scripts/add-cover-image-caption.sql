-- Add cover_image_caption field to devotionals table
ALTER TABLE devotionals
ADD COLUMN IF NOT EXISTS cover_image_caption TEXT;

-- Add comment for documentation
COMMENT ON COLUMN devotionals.cover_image_caption IS 'Optional caption text displayed below the featured image';
