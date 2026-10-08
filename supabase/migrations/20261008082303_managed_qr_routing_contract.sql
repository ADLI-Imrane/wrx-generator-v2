-- Preserve every existing QR's current scan-and-resolve behavior. Only an
-- explicit owner API association opts a row into Link-managed resolution.
ALTER TABLE public.qr_codes
    ADD COLUMN IF NOT EXISTS routing_mode TEXT NOT NULL DEFAULT 'legacy';

ALTER TABLE public.qr_codes
    ADD CONSTRAINT qr_codes_routing_mode_check
    CHECK (routing_mode IN ('legacy', 'managed_link'));

CREATE INDEX IF NOT EXISTS idx_qr_codes_managed_link
    ON public.qr_codes(link_id)
    WHERE routing_mode = 'managed_link' AND link_id IS NOT NULL;

-- Do not let deletion of a Link silently cascade-delete a printed QR artifact.
-- Existing legacy associations are protected too; owners must explicitly detach.
ALTER TABLE public.qr_codes
    DROP CONSTRAINT IF EXISTS qr_codes_link_id_fkey;

ALTER TABLE public.qr_codes
    ADD CONSTRAINT qr_codes_link_id_fkey
    FOREIGN KEY (link_id)
    REFERENCES public.links(id)
    ON DELETE RESTRICT;

COMMENT ON COLUMN public.qr_codes.routing_mode IS
    'legacy preserves existing QR-specific content resolution; managed_link opts into resolving through the associated Link.';
