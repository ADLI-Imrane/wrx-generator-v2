-- Private owner-managed Digital Cards with an explicit published projection.
-- Public visitors read only through the API; no client role can query this table.
CREATE TABLE public.digital_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    schema_version SMALLINT NOT NULL DEFAULT 1,
    document JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    CONSTRAINT digital_cards_title_length
        CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
    CONSTRAINT digital_cards_slug_unique UNIQUE (slug),
    CONSTRAINT digital_cards_slug_format
        CHECK (slug ~ '^[a-f0-9]{32}$'),
    CONSTRAINT digital_cards_status_allowed
        CHECK (status IN ('draft', 'published')),
    CONSTRAINT digital_cards_schema_version_supported
        CHECK (schema_version = 1),
    CONSTRAINT digital_cards_document_object
        CHECK (jsonb_typeof(document) = 'object'),
    CONSTRAINT digital_cards_document_version_matches
        CHECK (document ->> 'schemaVersion' = schema_version::TEXT),
    CONSTRAINT digital_cards_publication_timestamp_consistent
        CHECK (
            (status = 'draft' AND published_at IS NULL)
            OR (status = 'published' AND published_at IS NOT NULL)
        )
);

CREATE INDEX digital_cards_owner_updated_idx
    ON public.digital_cards (user_id, updated_at DESC);

CREATE TRIGGER update_digital_cards_updated_at
    BEFORE UPDATE ON public.digital_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.digital_cards ENABLE ROW LEVEL SECURITY;

-- The authenticated API uses the service role with explicit user_id filters.
-- These owner policies remain defense in depth if client grants are introduced later.
REVOKE ALL ON TABLE public.digital_cards FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.digital_cards TO service_role;

CREATE POLICY "Users can view own digital cards"
    ON public.digital_cards FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own digital cards"
    ON public.digital_cards FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own digital cards"
    ON public.digital_cards FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own digital cards"
    ON public.digital_cards FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

COMMENT ON TABLE public.digital_cards IS
    'Private Digital Card snapshots. Public exposure is limited to the API projection for published cards.';
