-- =============================================
-- WRX Generator V2 - Database Schema
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business', 'enterprise')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- LINKS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  description TEXT,
  password TEXT, -- Hashed password for protected links
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Links policies
CREATE POLICY "Users can view own links" ON public.links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own links" ON public.links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links" ON public.links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON public.links
  FOR DELETE USING (auth.uid() = user_id);

-- Public read for redirects (active links only)
CREATE POLICY "Anyone can read active links by slug" ON public.links
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Indexes
CREATE INDEX IF NOT EXISTS links_user_id_idx ON public.links(user_id);
CREATE INDEX IF NOT EXISTS links_slug_idx ON public.links(slug);
CREATE INDEX IF NOT EXISTS links_created_at_idx ON public.links(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER links_updated_at
  BEFORE UPDATE ON public.links
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- QR CODES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  link_id UUID REFERENCES public.links(id) ON DELETE SET NULL,
  content TEXT NOT NULL, -- URL or text content
  title TEXT,
  style JSONB NOT NULL DEFAULT '{
    "size": 256,
    "foregroundColor": "#000000",
    "backgroundColor": "#FFFFFF",
    "errorCorrectionLevel": "M"
  }',
  scan_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- QR codes policies
CREATE POLICY "Users can view own QR codes" ON public.qr_codes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own QR codes" ON public.qr_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own QR codes" ON public.qr_codes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own QR codes" ON public.qr_codes
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS qr_codes_user_id_idx ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS qr_codes_link_id_idx ON public.qr_codes(link_id);
CREATE INDEX IF NOT EXISTS qr_codes_created_at_idx ON public.qr_codes(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER qr_codes_updated_at
  BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- CLICKS TABLE (Analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS public.clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  city TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  browser TEXT,
  os TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

-- Clicks policies (users can view clicks for their own links)
CREATE POLICY "Users can view clicks for own links" ON public.clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.links
      WHERE links.id = clicks.link_id
      AND links.user_id = auth.uid()
    )
  );

-- Service role can insert clicks (for API)
CREATE POLICY "Service role can insert clicks" ON public.clicks
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS clicks_link_id_idx ON public.clicks(link_id);
CREATE INDEX IF NOT EXISTS clicks_created_at_idx ON public.clicks(created_at DESC);
CREATE INDEX IF NOT EXISTS clicks_country_idx ON public.clicks(country);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Increment click count
CREATE OR REPLACE FUNCTION public.increment_click_count(link_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.links
  SET click_count = click_count + 1
  WHERE slug = link_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get link by slug (for redirects)
CREATE OR REPLACE FUNCTION public.get_link_by_slug(link_slug TEXT)
RETURNS TABLE (
  id UUID,
  original_url TEXT,
  password TEXT,
  is_active BOOLEAN,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.original_url,
    l.password,
    l.is_active,
    l.expires_at
  FROM public.links l
  WHERE l.slug = link_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user stats
CREATE OR REPLACE FUNCTION public.get_user_stats(uid UUID)
RETURNS TABLE (
  total_links BIGINT,
  total_qr_codes BIGINT,
  total_clicks BIGINT,
  links_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.links WHERE user_id = uid),
    (SELECT COUNT(*) FROM public.qr_codes WHERE user_id = uid),
    (SELECT COALESCE(SUM(click_count), 0) FROM public.links WHERE user_id = uid),
    (SELECT COUNT(*) FROM public.links WHERE user_id = uid AND created_at >= date_trunc('month', NOW()));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
