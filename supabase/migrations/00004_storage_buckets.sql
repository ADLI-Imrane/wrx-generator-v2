-- Migration: 00004_storage_buckets
-- Description: Create storage buckets for QR code logos and assets
-- Created at: 2025-11-27

-- ============================================
-- Create QR Logos Bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'qr-logos',
    'qr-logos',
    true,
    5242880, -- 5MB
    ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']
);

-- ============================================
-- Create Avatars Bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- ============================================
-- Storage Policies for QR Logos
-- ============================================

-- Anyone can view QR logos (they are public)
CREATE POLICY "QR logos are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'qr-logos');

-- Authenticated users can upload QR logos
CREATE POLICY "Authenticated users can upload QR logos"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'qr-logos'
        AND auth.role() = 'authenticated'
    );

-- Users can update their own QR logos
CREATE POLICY "Users can update own QR logos"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'qr-logos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own QR logos
CREATE POLICY "Users can delete own QR logos"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'qr-logos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- Storage Policies for Avatars
-- ============================================

-- Anyone can view avatars (they are public)
CREATE POLICY "Avatars are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');

-- Authenticated users can upload their avatar
CREATE POLICY "Users can upload own avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND auth.role() = 'authenticated'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
