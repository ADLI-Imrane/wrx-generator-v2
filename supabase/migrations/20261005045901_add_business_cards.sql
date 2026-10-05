-- Private saved Business Card snapshots. This migration is additive and does not
-- alter profile, QR, billing, subscription, or existing user data.
CREATE TABLE public.business_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    template_key TEXT NOT NULL,
    schema_version SMALLINT NOT NULL,
    document JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT business_cards_title_length
        CHECK (char_length(btrim(title)) BETWEEN 1 AND 100),
    CONSTRAINT business_cards_template_key_allowed
        CHECK (template_key IN ('classic', 'minimal', 'editorial', 'monogram', 'bold')),
    CONSTRAINT business_cards_schema_version_supported
        CHECK (schema_version = 1),
    CONSTRAINT business_cards_document_object
        CHECK (jsonb_typeof(document) = 'object'),
    CONSTRAINT business_cards_document_version_matches
        CHECK (document ->> 'schemaVersion' = schema_version::TEXT),
    CONSTRAINT business_cards_document_template_matches
        CHECK (document ->> 'templateKey' = template_key)
);

CREATE INDEX business_cards_user_updated_idx
    ON public.business_cards (user_id, updated_at DESC);

CREATE TRIGGER update_business_cards_updated_at
    BEFORE UPDATE ON public.business_cards
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.business_cards ENABLE ROW LEVEL SECURITY;

-- Keep the table private to the authenticated API, which uses the service role
-- and explicitly scopes every query to the verified user's ID. Authenticated
-- owner policies remain as a row-level boundary if direct grants are introduced
-- in a future migration; no client role receives table privileges here.
REVOKE ALL ON TABLE public.business_cards FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.business_cards TO service_role;

CREATE POLICY "Users can view own business cards"
    ON public.business_cards FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own business cards"
    ON public.business_cards FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own business cards"
    ON public.business_cards FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own business cards"
    ON public.business_cards FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = user_id);

COMMENT ON TABLE public.business_cards IS
    'Private, versioned business-card identity snapshots managed through the authenticated WRX API.';
