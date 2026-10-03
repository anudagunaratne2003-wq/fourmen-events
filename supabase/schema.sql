-- Fourmen Events · database schema (Supabase / Postgres)
-- Run this whole file in the Supabase SQL editor. It is safe to run again.
-- All data access goes through Next.js server code using the service-role key.
-- RLS is enabled with NO policies, so the public anon key can read nothing.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'client' check (role in ('client','photographer','admin')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

-- Extra admin emails (managed at /admin/team). The ADMIN_EMAILS env var also grants admin.
-- Roles are re-checked on every request, so adding an email here works for existing accounts too.
create table if not exists public.admin_emails (email text primary key);

create table if not exists public.photographers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete set null,
  email text not null unique,
  display_name text not null,
  style text,
  bio text,
  contact_phone text,          -- private: never sent to the browser
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.photographers(id) on delete cascade,
  path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.photographers(id) on delete cascade,
  name text not null,
  price_lkr integer not null check (price_lkr >= 0),
  description text,
  inclusions text[] not null default '{}',
  position integer not null default 0,
  active boolean not null default true
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  university text not null,
  name text not null,
  venue text,
  event_dates date[] not null default '{}',
  advance_lkr integer not null default 5000,
  slot_minutes integer not null default 45 check (slot_minutes between 10 and 240),
  payment_instructions text,
  ceremony_note text,           -- e.g. "Ceremony times not announced yet"
  status text not null default 'draft' check (status in ('draft','open','closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.event_photographers (
  event_id uuid references public.events(id) on delete cascade,
  photographer_id uuid references public.photographers(id) on delete cascade,
  primary key (event_id, photographer_id)
);

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  photographer_id uuid not null references public.photographers(id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'open' check (status in ('open','blocked','booked')),
  unique (event_id, photographer_id, slot_date, start_time)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  client_id uuid not null references public.profiles(id),
  event_id uuid not null references public.events(id),
  photographer_id uuid not null references public.photographers(id),
  package_id uuid references public.packages(id) on delete set null,
  slot_id uuid unique references public.slots(id) on delete set null,  -- unique: one booking per slot
  client_name text not null,
  client_phone text not null,
  client_email text not null,
  degree text,
  notes text,
  package_name text not null,     -- snapshots so later edits don't change old bookings
  package_price integer not null,
  advance_lkr integer not null,
  balance_lkr integer not null,
  advance_status text not null default 'pending' check (advance_status in ('pending','approved','rejected')),
  advance_proof_path text,
  shoot_done boolean not null default false,
  balance_status text not null default 'none' check (balance_status in ('none','pending','approved','rejected')),
  balance_proof_path text,
  review_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  path text not null,
  file_name text not null,
  mime text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  booking_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- New sign-ups get a profile. Role comes from the admin list or photographer invites.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    case
      when exists (select 1 from public.admin_emails a where lower(a.email) = lower(new.email)) then 'admin'
      when exists (select 1 from public.photographers p where lower(p.email) = lower(new.email)) then 'photographer'
      else 'client'
    end
  );
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.admin_emails enable row level security;
alter table public.photographers enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.packages enable row level security;
alter table public.events enable row level security;
alter table public.event_photographers enable row level security;
alter table public.slots enable row level security;
alter table public.bookings enable row level security;
alter table public.deliverables enable row level security;
alter table public.audit_log enable row level security;

-- Storage: portfolio is public-read, proofs and deliveries are private (signed URLs only).
insert into storage.buckets (id, name, public) values
  ('portfolio','portfolio',true),
  ('proofs','proofs',false),
  ('deliveries','deliveries',false)
on conflict (id) do nothing;

create index if not exists slots_event_id_photographer_id_slot_date_idx on public.slots (event_id, photographer_id, slot_date);
create index if not exists bookings_client_id_idx on public.bookings (client_id);
create index if not exists bookings_photographer_id_idx on public.bookings (photographer_id);

-- Photographers who want to work with Fourmen apply at /join-us. Admins review them at /admin/photographers.
create table if not exists public.photographer_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  city text,
  portfolio_url text,
  instagram text,
  experience text,
  specialties text,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.photographer_applications enable row level security;
create index if not exists photographer_applications_status_idx on public.photographer_applications (status, created_at desc);

-- Photographers appear to clients under a stage name (alias). Their real name and phone are only shown to a
-- client after that client's advance is approved AND the admin's reveal date has arrived.
alter table public.photographers add column if not exists alias text;
create unique index if not exists photographers_alias_key on public.photographers (lower(alias));

alter table public.events add column if not exists reveal_name_on date;
alter table public.events add column if not exists reveal_phone_on date;

alter table public.bookings add column if not exists reveal_name_on date;   -- overrides the event's date when set
alter table public.bookings add column if not exists reveal_phone_on date;

-- When the "your photos are ready" email was sent, so each client gets it once.
alter table public.bookings add column if not exists photos_ready_emailed_at timestamptz;

-- Event states: draft (hidden) · upcoming (visible, not bookable yet) · open (bookable)
alter table public.events drop constraint if exists events_status_check;
alter table public.events add constraint events_status_check check (status in ('draft','upcoming','open','paused','closed'));

-- The balance is always package price minus advance, even when amounts are edited directly in the database.
create or replace function public.bookings_set_balance() returns trigger
language plpgsql as $$
begin
  new.balance_lkr := greatest(new.package_price - new.advance_lkr, 0);
  return new;
end $$;

drop trigger if exists bookings_set_balance on public.bookings;
create trigger bookings_set_balance before insert or update of package_price, advance_lkr, balance_lkr on public.bookings
  for each row execute function public.bookings_set_balance();

update public.bookings set balance_lkr = greatest(package_price - advance_lkr, 0)
where balance_lkr is distinct from greatest(package_price - advance_lkr, 0);

-- Edited photos are delivered as a link to the photographer's own cloud album (Google Drive, Dropbox…)
-- instead of being uploaded here. The link is shown only to the booking's client, once paid in full.
alter table public.bookings add column if not exists album_url text;
alter table public.bookings add column if not exists album_note text;      -- e.g. album password or instructions
alter table public.bookings add column if not exists album_added_at timestamptz;

-- Storage limits enforced by Supabase itself, so they cannot be bypassed from the browser.

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
