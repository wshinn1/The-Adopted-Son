-- Fix the author_id foreign key constraint on devotionals table
-- The old constraint may point to profiles table, we need it to point to authors table

-- First, drop the old foreign key constraint if it exists
ALTER TABLE public.devotionals 
DROP CONSTRAINT IF EXISTS devotionals_author_id_fkey;

-- Add the correct foreign key constraint pointing to authors table
ALTER TABLE public.devotionals
ADD CONSTRAINT devotionals_author_id_fkey 
FOREIGN KEY (author_id) REFERENCES public.authors(id) ON DELETE SET NULL;
