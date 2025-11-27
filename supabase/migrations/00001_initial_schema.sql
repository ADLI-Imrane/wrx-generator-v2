-- Migration: 00001_initial_schema
-- Description: Create initial database schema for WRX Generator V2.0
-- Created at: 2025-11-27

-- ============================================
-- Enable extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM Types
-- ============================================
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE qr_style AS ENUM ('squares', 'dots', 'rounded');

-- ============================================
-- Users Table (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    tier subscription_tier DEFAULT 'free' NOT NULL,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index on email for faster lookups
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- ============================================
-- Links Table
-- ============================================
CREATE TABLE public.links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    password_hash TEXT,
    expires_at TIMESTAMPTZ,
    click_count INTEGER DEFAULT 0 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Constraints
    CONSTRAINT slug_length CHECK (char_length(slug) >= 3 AND char_length(slug) <= 50),
    CONSTRAINT slug_format CHECK (slug ~ '^[a-zA-Z0-9_-]+$'),
    CONSTRAINT url_length CHECK (char_length(original_url) <= 2048)
);

-- Create indexes for faster queries
CREATE INDEX idx_links_user_id ON public.links(user_id);
CREATE INDEX idx_links_slug ON public.links(slug);
CREATE INDEX idx_links_created_at ON public.links(created_at DESC);
CREATE INDEX idx_links_is_active ON public.links(is_active) WHERE is_active = true;

-- ============================================
-- QR Codes Table
-- ============================================
CREATE TABLE public.qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    logo_url TEXT,
    style_config JSONB DEFAULT '{
        "color": "#000000",
        "background": "#FFFFFF",
        "style": "squares"
    }' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for link lookups
CREATE INDEX idx_qr_codes_link_id ON public.qr_codes(link_id);

-- ============================================
-- Clicks/Analytics Table
-- ============================================
CREATE TABLE public.clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    ip_hash TEXT,
    user_agent TEXT,
    referrer TEXT,
    country TEXT,
    city TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for analytics queries
CREATE INDEX idx_clicks_link_id ON public.clicks(link_id);
CREATE INDEX idx_clicks_clicked_at ON public.clicks(clicked_at DESC);
CREATE INDEX idx_clicks_country ON public.clicks(country);
CREATE INDEX idx_clicks_device ON public.clicks(device);

-- Partition hint comment (for future optimization)
-- Consider partitioning by clicked_at for large datasets

-- ============================================
-- Subscriptions Table (Stripe integration)
-- ============================================
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    status TEXT NOT NULL DEFAULT 'inactive',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- ============================================
-- Updated At Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_links_updated_at
    BEFORE UPDATE ON public.links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Increment Click Count Function
-- ============================================
CREATE OR REPLACE FUNCTION increment_click_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.links
    SET click_count = click_count + 1
    WHERE id = NEW.link_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER increment_link_clicks
    AFTER INSERT ON public.clicks
    FOR EACH ROW
    EXECUTE FUNCTION increment_click_count();
