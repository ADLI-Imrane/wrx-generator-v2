-- The public scan endpoint writes to public.scans (not the legacy qr_scans table).
-- Increment atomically to avoid lost updates when two scans arrive together.
CREATE OR REPLACE FUNCTION public.increment_qr_scan_count(qr_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.qr_codes
  SET scans_count = COALESCE(scans_count, 0) + 1
  WHERE id = qr_id;
$$;

REVOKE ALL ON FUNCTION public.increment_qr_scan_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_qr_scan_count(UUID) TO service_role;
