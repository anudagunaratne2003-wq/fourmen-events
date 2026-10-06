-- Photographers' bank details, so admins can transfer their earnings manually.
-- Kept in its own table (not on photographers) so no page that clients can see ever reads it.
-- RLS is on with no policies: only server code with the service-role key can read or write it.
-- Safe to run more than once.
create table if not exists public.photographer_bank_accounts (
  photographer_id uuid primary key references public.photographers(id) on delete cascade,
  bank_name text not null,
  branch text not null,
  account_name text not null,
  account_number text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);
alter table public.photographer_bank_accounts enable row level security;
