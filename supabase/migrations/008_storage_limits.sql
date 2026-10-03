-- Storage limits enforced by Supabase itself, so they cannot be bypassed from the browser.
-- Safe to run more than once.

-- Payment receipts: photos or PDFs, up to 10 MB.
update storage.buckets
set file_size_limit = 10 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','application/pdf']
where id = 'proofs';

-- Portfolio (public): photos only, up to 15 MB. No SVG or HTML, which could carry scripts.
update storage.buckets
set file_size_limit = 15 * 1024 * 1024,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/heic','image/heif','image/avif']
where id = 'portfolio';

-- Edited albums are now shared as links, so nothing may be uploaded here any more.
update storage.buckets
set public = false, file_size_limit = 1, allowed_mime_types = array['application/x-disabled']
where id = 'deliveries';
