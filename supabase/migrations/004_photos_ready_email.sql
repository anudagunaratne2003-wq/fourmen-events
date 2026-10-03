-- When the "your photos are ready" email was sent, so each client gets it once. Safe to run more than once.
alter table public.bookings add column if not exists photos_ready_emailed_at timestamptz;
