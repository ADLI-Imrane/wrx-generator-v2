-- Phase 1: extend the existing one-row-per-user profile with reusable identity fields.
ALTER TABLE public.profiles
    ADD COLUMN job_title TEXT,
    ADD COLUMN company TEXT,
    ADD COLUMN phone TEXT,
    ADD COLUMN website TEXT,
    ADD COLUMN address TEXT,
    ADD COLUMN linkedin_url TEXT,
    ADD COLUMN github_url TEXT,
    ADD COLUMN instagram_url TEXT,
    ADD COLUMN x_url TEXT,
    ADD COLUMN avatar_path TEXT,
    ADD COLUMN company_logo_path TEXT,
    ADD COLUMN primary_brand_color TEXT,
    ADD COLUMN secondary_brand_color TEXT,
    ADD CONSTRAINT profiles_primary_brand_color_format
        CHECK (primary_brand_color IS NULL OR primary_brand_color ~ '^#[0-9A-Fa-f]{6}$'),
    ADD CONSTRAINT profiles_secondary_brand_color_format
        CHECK (secondary_brand_color IS NULL OR secondary_brand_color ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON COLUMN public.profiles.avatar_path IS 'Optional owner-only object path in the private avatars bucket; profile URL falls back to Auth-provided avatar_url.';
COMMENT ON COLUMN public.profiles.company_logo_path IS 'Optional owner-only object path in the private avatars bucket for the user default identity.';

-- Profile photos and logos may contain personal identity information. Reuse the existing
-- bucket, but do not make uploaded profile assets anonymously readable.
UPDATE storage.buckets SET public = false WHERE id = 'avatars';
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatar objects" ON storage.objects;
CREATE POLICY "Users can view own avatar objects"
    ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'avatars'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Email remains Auth-owned. Name/avatar metadata are bootstrap values only; profile edits
-- must not be overwritten by a later Auth metadata update.
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Authenticated clients must use PUT /auth/me. This prevents direct changes to billing,
-- plan, Stripe, email, and profile columns; service-role API billing writes remain allowed.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
