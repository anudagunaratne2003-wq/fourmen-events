-- Photographers who want to work with Fourmen apply at /join-us. Admins review them at /admin/photographers.
-- Safe to run more than once.
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
