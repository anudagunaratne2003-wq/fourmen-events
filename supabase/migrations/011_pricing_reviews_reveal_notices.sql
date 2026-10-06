-- 1) Package pricing: the photographer's own price plus the LKR 2,000 Fourmen service fee.
--    price_lkr stays the price clients see and pay; base_price_lkr is what the photographer receives.
alter table public.packages add column if not exists base_price_lkr integer check (base_price_lkr >= 0);
-- Existing packages: their listed price is kept, and the fee is assumed to be included.
update public.packages set base_price_lkr = greatest(price_lkr - 2000, 0) where base_price_lkr is null;

--    Bookings keep a snapshot of the photographer's share, for manual payouts.
alter table public.bookings add column if not exists package_base_price integer;
update public.bookings set package_base_price = greatest(package_price - 2000, 0) where package_base_price is null;

-- 2) Reveal notices: which reveal date each booking has already been emailed about,
--    so a changed date is announced again but the same date never twice.
alter table public.bookings add column if not exists name_reveal_emailed_for date;
alter table public.bookings add column if not exists phone_reveal_emailed_for date;

-- 3) Reviews: one per booking, written by the client once their photos are delivered and paid in full.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  photographer_id uuid not null references public.photographers(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  hidden boolean not null default false,   -- admins can hide abusive reviews
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.reviews enable row level security;
create index if not exists reviews_photographer_idx on public.reviews (photographer_id, created_at desc);
