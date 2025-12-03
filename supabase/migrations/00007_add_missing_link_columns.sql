-- ============================================
-- Migration: Add missing columns to links table
-- ============================================

-- Add title column
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS title TEXT;

-- Add description column
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS description TEXT;

-- Add max_clicks column
ALTER TABLE public.links ADD COLUMN IF NOT EXISTS max_clicks INTEGER;

-- Rename click_count to clicks for consistency
ALTER TABLE public.links RENAME COLUMN click_count TO clicks;

-- Update the increment function to use 'clicks' instead of 'click_count'
CREATE OR REPLACE FUNCTION increment_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.links
    SET clicks = clicks + 1
    WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ language 'plpgsql';
