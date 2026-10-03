-- The balance is always package price minus advance, even when amounts are edited directly in the database.
-- Safe to run more than once.
create or replace function public.bookings_set_balance() returns trigger
language plpgsql as $$
begin
  new.balance_lkr := greatest(new.package_price - new.advance_lkr, 0);
  return new;
end $$;

drop trigger if exists bookings_set_balance on public.bookings;
create trigger bookings_set_balance before insert or update of package_price, advance_lkr, balance_lkr on public.bookings
  for each row execute function public.bookings_set_balance();

-- Fix rows that are already out of step (e.g. FM-N9JR).
update public.bookings set balance_lkr = greatest(package_price - advance_lkr, 0)
where balance_lkr is distinct from greatest(package_price - advance_lkr, 0);
