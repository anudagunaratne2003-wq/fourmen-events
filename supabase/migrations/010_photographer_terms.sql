-- Photographer Terms & Conditions acceptance records.
-- Each row is one acceptance, with the exact text and version accepted, so updated terms never
-- overwrite what a photographer agreed to earlier. Safe to run more than once.
create table if not exists public.photographer_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.photographers(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text not null,
  terms_version text not null,
  terms_hash text not null,        -- sha256 of terms_text
  terms_text text not null,        -- the exact wording accepted
  accepted_at timestamptz not null default now(),
  ip_address text,
  user_agent text,
  status text not null default 'accepted' check (status in ('accepted', 'withdrawn'))
);
alter table public.photographer_terms_acceptances enable row level security;
create index if not exists photographer_terms_acceptances_photographer_idx
  on public.photographer_terms_acceptances (photographer_id, accepted_at desc);

-- Latest accepted version, for quick checks. A photographer is only shown to clients once this is set.
alter table public.photographers add column if not exists terms_version text;
alter table public.photographers add column if not exists terms_accepted_at timestamptz;
