-- Event states: draft (hidden) · upcoming (visible, not bookable yet) · open (bookable)
-- · paused (visible, bookings stopped for now) · closed (finished, hidden). Safe to run more than once.
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check check (status in ('draft','upcoming','open','paused','closed'));
