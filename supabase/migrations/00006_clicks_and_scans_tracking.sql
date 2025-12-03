-- ============================================
-- Migration: Clicks and Scans Tracking Tables
-- ============================================

-- Add missing columns to clicks table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'clicks' AND column_name = 'country_code') THEN
        ALTER TABLE clicks ADD COLUMN country_code VARCHAR(2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'clicks' AND column_name = 'ip_address') THEN
        ALTER TABLE clicks ADD COLUMN ip_address VARCHAR(45);
    END IF;
END $$;

-- Table for tracking QR code scans
CREATE TABLE IF NOT EXISTS scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    qr_code_id UUID NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(45),
    user_agent TEXT,
    country VARCHAR(100),
    country_code VARCHAR(2),
    city VARCHAR(100),
    device VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50)
);

-- Indexes for performance (use IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_clicks_country_code ON clicks(country_code);
CREATE INDEX IF NOT EXISTS idx_scans_qr_code_id ON scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scans_country_code ON scans(country_code);
CREATE INDEX IF NOT EXISTS idx_scans_device ON scans(device);

-- RLS Policies for scans
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view scans for their own QR codes" ON scans;
CREATE POLICY "Users can view scans for their own QR codes"
    ON scans FOR SELECT
    USING (
        qr_code_id IN (
            SELECT id FROM qr_codes WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Service role can insert scans" ON scans;
CREATE POLICY "Service role can insert scans"
    ON scans FOR INSERT
    WITH CHECK (true);
