-- Edited photos are delivered as a link to the photographer's own cloud album (Google Drive, Dropbox…)
-- instead of being uploaded here. The link is shown only to the booking's client, once paid in full.
-- Safe to run more than once.
alter table public.bookings add column if not exists album_url text;
alter table public.bookings add column if not exists album_note text;      -- e.g. album password or instructions
alter table public.bookings add column if not exists album_added_at timestamptz;
