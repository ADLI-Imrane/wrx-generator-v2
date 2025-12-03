-- Migration: 00003_update_qr_codes_table
-- Description: Update qr_codes table structure to support standalone QR codes
-- Created at: 2025-12-01

-- ============================================
-- Drop existing constraints and indexes
-- ============================================
DROP INDEX IF EXISTS idx_qr_codes_link_id;

-- ============================================
-- Alter qr_codes table structure
-- ============================================

-- Make link_id optional (QR codes can exist without links)
ALTER TABLE public.qr_codes 
    ALTER COLUMN link_id DROP NOT NULL;

-- Add new columns
ALTER TABLE public.qr_codes 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'url' NOT NULL,
    ADD COLUMN IF NOT EXISTS title TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS content TEXT,
    ADD COLUMN IF NOT EXISTS foreground_color TEXT DEFAULT '#000000',
    ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#FFFFFF',
    ADD COLUMN IF NOT EXISTS size INTEGER DEFAULT 256,
    ADD COLUMN IF NOT EXISTS margin INTEGER DEFAULT 2,
    ADD COLUMN IF NOT EXISTS style TEXT DEFAULT 'squares',
    ADD COLUMN IF NOT EXISTS scans_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS downloads_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Add constraints
ALTER TABLE public.qr_codes
    ADD CONSTRAINT qr_type_check CHECK (type IN ('url', 'vcard', 'wifi', 'text', 'email', 'phone', 'sms')),
    ADD CONSTRAINT qr_style_check CHECK (style IN ('squares', 'dots', 'rounded'));

-- ============================================
-- Create new indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_link_id ON public.qr_codes(link_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON public.qr_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_codes_type ON public.qr_codes(type);

-- ============================================
-- Update trigger for updated_at
-- ============================================
DROP TRIGGER IF EXISTS update_qr_codes_updated_at ON public.qr_codes;

CREATE TRIGGER update_qr_codes_updated_at
    BEFORE UPDATE ON public.qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- QR Scans Table (for analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.qr_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id UUID NOT NULL REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    country TEXT,
    city TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    scanned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code_id ON public.qr_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON public.qr_scans(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_scans_country ON public.qr_scans(country);

-- ============================================
-- Increment Scan Count Function
-- ============================================
CREATE OR REPLACE FUNCTION increment_scan_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.qr_codes
    SET scans_count = scans_count + 1
    WHERE id = NEW.qr_code_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS increment_qr_scans ON public.qr_scans;

CREATE TRIGGER increment_qr_scans
    AFTER INSERT ON public.qr_scans
    FOR EACH ROW
    EXECUTE FUNCTION increment_scan_count();

-- ============================================
-- Row Level Security for qr_codes
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can insert own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can update own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can delete own QR codes" ON public.qr_codes;

-- Create new policies based on user_id
CREATE POLICY "Users can view own QR codes"
    ON public.qr_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own QR codes"
    ON public.qr_codes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own QR codes"
    ON public.qr_codes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own QR codes"
    ON public.qr_codes FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- Row Level Security for qr_scans
-- ============================================
ALTER TABLE public.qr_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scans of own QR codes"
    ON public.qr_scans FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.qr_codes
            WHERE qr_codes.id = qr_scans.qr_code_id
            AND qr_codes.user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert scans"
    ON public.qr_scans FOR INSERT
    WITH CHECK (true);
