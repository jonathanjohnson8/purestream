-- Optional: pre-assign demo roles + records by email AFTER the 4 accounts have
-- signed up through the app. The in-app activation buttons do the same thing, so
-- this is only needed if you'd rather wire roles directly in SQL.
--
-- Run in the Supabase SQL editor for the PureStream project.

-- Admin
insert into public.user_roles (user_id, role)
select id, 'admin' from public.users where email = 'admin@purestream.app'
on conflict do nothing;

-- Vendor owner linked to AquaPure Springs
with v as (select id as uid from public.users where email = 'vendor@purestream.app')
insert into public.vendor_users (vendor_id, user_id, role)
select 'a0000000-0000-0000-0000-000000000001', uid, 'vendor_owner' from v
on conflict do nothing;

insert into public.user_roles (user_id, role, scope_type, scope_id)
select id, 'vendor_owner', 'vendor', 'a0000000-0000-0000-0000-000000000001'
from public.users where email = 'vendor@purestream.app'
on conflict do nothing;

-- Shopper profile
insert into public.shoppers (user_id, approval_status, vehicle_type, vehicle_capacity_lbs, status, current_lat, current_lng)
select id, 'approved', 'Cargo van', 1500, 'available', 30.2672, -97.7431
from public.users where email = 'shopper@purestream.app'
on conflict (user_id) do nothing;

insert into public.user_roles (user_id, role)
select id, 'shopper' from public.users where email = 'shopper@purestream.app'
on conflict do nothing;
