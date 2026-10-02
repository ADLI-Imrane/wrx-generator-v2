-- Redirects and tracking use the API's service role. Anonymous clients must not
-- read private link columns or forge analytics events directly through PostgREST.
DROP POLICY IF EXISTS "Public can read active links for redirect" ON public.links;
DROP POLICY IF EXISTS "Service role can insert clicks" ON public.clicks;
DROP POLICY IF EXISTS "Anyone can insert scans" ON public.qr_scans;
DROP POLICY IF EXISTS "Service role can insert scans" ON public.scans;

-- A user may only upload a QR logo within their own folder.
DROP POLICY IF EXISTS "Authenticated users can upload QR logos" ON storage.objects;
CREATE POLICY "Users can upload own QR logos"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'qr-logos'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );
