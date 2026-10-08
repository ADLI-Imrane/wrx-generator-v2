-- Owner-managed Email Signature snapshots and explicitly published email images.
-- The dedicated bucket is public by design; only random object URLs expose image bytes.
-- Profile's private `avatars` bucket and existing user data are not altered.

CREATE TABLE public.email_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    schema_version SMALLINT NOT NULL DEFAULT 1,
    document JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT email_signatures_title_length
        CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
    CONSTRAINT email_signatures_schema_version_supported
        CHECK (schema_version = 1),
    CONSTRAINT email_signatures_document_object
        CHECK (jsonb_typeof(document) = 'object'),
    CONSTRAINT email_signatures_document_version_matches
        CHECK (document ->> 'schemaVersion' = schema_version::TEXT),
    CONSTRAINT email_signatures_id_user_unique UNIQUE (id, user_id)
);

CREATE INDEX email_signatures_owner_updated_idx
    ON public.email_signatures (user_id, updated_at DESC);

CREATE TRIGGER update_email_signatures_updated_at
    BEFORE UPDATE ON public.email_signatures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_signature_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    object_path TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL,
    content_type TEXT NOT NULL,
    byte_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT email_signature_assets_content_type
        CHECK (content_type IN ('image/png', 'image/jpeg')),
    CONSTRAINT email_signature_assets_kind
        CHECK (kind IN ('avatar', 'company-logo')),
    CONSTRAINT email_signature_assets_byte_size
        CHECK (byte_size BETWEEN 1 AND 1048576),
    CONSTRAINT email_signature_assets_id_user_unique UNIQUE (id, user_id),
    CONSTRAINT email_signature_assets_path_format
        CHECK (object_path ~ '^v1/[a-f0-9]{64}\.(png|jpg)$')
);

CREATE TABLE public.email_signature_asset_refs (
    signature_id UUID NOT NULL,
    asset_id UUID NOT NULL,
    user_id UUID NOT NULL,
    PRIMARY KEY (signature_id, asset_id),
    CONSTRAINT email_signature_asset_refs_signature_owner_fk
        FOREIGN KEY (signature_id, user_id)
        REFERENCES public.email_signatures (id, user_id) ON DELETE CASCADE,
    CONSTRAINT email_signature_asset_refs_asset_owner_fk
        FOREIGN KEY (asset_id, user_id)
        REFERENCES public.email_signature_assets (id, user_id) ON DELETE RESTRICT
);

CREATE INDEX email_signature_asset_refs_asset_idx
    ON public.email_signature_asset_refs (asset_id, user_id);

-- Keep normalized references transactionally aligned with the versioned JSON document.
-- Composite foreign keys enforce same-owner references and prevent deletion while in use.
CREATE FUNCTION public.sync_email_signature_asset_refs()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    referenced_asset_id UUID;
BEGIN
    DELETE FROM public.email_signature_asset_refs
    WHERE signature_id = NEW.id;

    FOR referenced_asset_id IN
        SELECT DISTINCT raw.asset_id::UUID
        FROM (VALUES
            (NULLIF(NEW.document #>> '{images,avatar,assetId}', '')),
            (NULLIF(NEW.document #>> '{images,companyLogo,assetId}', ''))
        ) AS raw(asset_id)
        WHERE raw.asset_id IS NOT NULL
    LOOP
        INSERT INTO public.email_signature_asset_refs (signature_id, asset_id, user_id)
        VALUES (NEW.id, referenced_asset_id, NEW.user_id);
    END LOOP;

    RETURN NEW;
END;
$$;

CREATE TRIGGER sync_email_signature_asset_refs
    AFTER INSERT OR UPDATE ON public.email_signatures
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_email_signature_asset_refs();

REVOKE ALL ON FUNCTION public.sync_email_signature_asset_refs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_email_signature_asset_refs() TO service_role;

-- The API is the only database interface. RLS owner policies are defense in depth.
ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_signature_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_signature_asset_refs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.email_signatures FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.email_signature_assets FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.email_signature_asset_refs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.email_signatures TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.email_signature_assets TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.email_signature_asset_refs TO service_role;

CREATE POLICY "Users can view own email signatures"
    ON public.email_signatures FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own email signatures"
    ON public.email_signatures FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own email signatures"
    ON public.email_signatures FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own email signatures"
    ON public.email_signatures FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own email signature assets"
    ON public.email_signature_assets FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can insert own email signature assets"
    ON public.email_signature_assets FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own email signature assets"
    ON public.email_signature_assets FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own email signature assets"
    ON public.email_signature_assets FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own email signature asset references"
    ON public.email_signature_asset_refs FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can manage own email signature asset references"
    ON public.email_signature_asset_refs FOR ALL TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- Public object reads are intentional for durable <img src> URLs. No client write/list
-- policies are created; uploads and deletes go through the authenticated owner API.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'email-signature-assets',
    'email-signature-assets',
    TRUE,
    1048576,
    ARRAY['image/png', 'image/jpeg']
);

COMMENT ON TABLE public.email_signatures IS
    'Private owner-scoped Email Signature snapshots. Documents contain no HTML, CSS, URLs for Profile assets, or public page state.';
COMMENT ON TABLE public.email_signature_assets IS
    'Owner-managed metadata for explicitly published durable PNG/JPEG images in the email-signature-assets public bucket.';
COMMENT ON TABLE public.email_signature_asset_refs IS
    'Transactional same-owner references preventing deletion of an image used by any saved Email Signature.';
