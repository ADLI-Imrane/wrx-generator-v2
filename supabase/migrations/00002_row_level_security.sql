-- Migration: 00002_row_level_security
-- Description: Enable Row Level Security (RLS) policies
-- Created at: 2025-11-27

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Profiles Policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Allow insert during signup (handled by trigger)
CREATE POLICY "Enable insert for authenticated users only"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================
-- Links Policies
-- ============================================

-- Users can view their own links
CREATE POLICY "Users can view own links"
    ON public.links
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own links
CREATE POLICY "Users can insert own links"
    ON public.links
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own links
CREATE POLICY "Users can update own links"
    ON public.links
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own links
CREATE POLICY "Users can delete own links"
    ON public.links
    FOR DELETE
    USING (auth.uid() = user_id);

-- Public can read active links for redirection (anonymous access)
CREATE POLICY "Public can read active links for redirect"
    ON public.links
    FOR SELECT
    USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- ============================================
-- QR Codes Policies
-- ============================================

-- Users can view QR codes for their links
CREATE POLICY "Users can view own QR codes"
    ON public.qr_codes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.links
            WHERE links.id = qr_codes.link_id
            AND links.user_id = auth.uid()
        )
    );

-- Users can insert QR codes for their links
CREATE POLICY "Users can insert QR codes for own links"
    ON public.qr_codes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.links
            WHERE links.id = qr_codes.link_id
            AND links.user_id = auth.uid()
        )
    );

-- Users can update QR codes for their links
CREATE POLICY "Users can update own QR codes"
    ON public.qr_codes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.links
            WHERE links.id = qr_codes.link_id
            AND links.user_id = auth.uid()
        )
    );

-- Users can delete QR codes for their links
CREATE POLICY "Users can delete own QR codes"
    ON public.qr_codes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.links
            WHERE links.id = qr_codes.link_id
            AND links.user_id = auth.uid()
        )
    );

-- ============================================
-- Clicks Policies
-- ============================================

-- Users can view clicks for their links
CREATE POLICY "Users can view clicks for own links"
    ON public.clicks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.links
            WHERE links.id = clicks.link_id
            AND links.user_id = auth.uid()
        )
    );

-- Anyone can insert clicks (for tracking redirects)
-- This is done via service role in the API
CREATE POLICY "Service role can insert clicks"
    ON public.clicks
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- Subscriptions Policies
-- ============================================

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Only service role can manage subscriptions (via Stripe webhooks)
-- INSERT, UPDATE, DELETE handled by service role
