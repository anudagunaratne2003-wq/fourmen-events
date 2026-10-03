-- Photographers appear to clients under a stage name (alias). Their real name and phone are only shown to a
-- client after that client's advance is approved AND the admin's reveal date has arrived.
-- Dates are set per event and can be overridden per booking. Safe to run more than once.
alter table public.photographers add column if not exists alias text;
create unique index if not exists photographers_alias_key on public.photographers (lower(alias));

alter table public.events add column if not exists reveal_name_on date;
alter table public.events add column if not exists reveal_phone_on date;

alter table public.bookings add column if not exists reveal_name_on date;   -- overrides the event's date when set
alter table public.bookings add column if not exists reveal_phone_on date;
