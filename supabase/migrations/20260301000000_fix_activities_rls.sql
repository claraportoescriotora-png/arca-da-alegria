-- Fix activities table RLS policies
-- Ensure the table is set up properly for admin dashboard CRUD operations

-- Enable RLS (just in case)
alter table public.activities enable row level security;

-- Drop existing policies if any to avoid conflicts
drop policy if exists "Activities are viewable by everyone" on public.activities;
drop policy if exists "Activities can be inserted" on public.activities;
drop policy if exists "Activities can be updated" on public.activities;
drop policy if exists "Activities can be deleted" on public.activities;

-- 1. Read access for everyone
create policy "Activities are viewable by everyone"
on public.activities for select
using (true);

-- 2. Insert access (assume authenticated users or anon can push from admin panel depending on auth setup)
create policy "Activities can be inserted"
on public.activities for insert
with check (true);

-- 3. Update access
create policy "Activities can be updated"
on public.activities for update
using (true);

-- 4. Delete access
create policy "Activities can be deleted"
on public.activities for delete
using (true);
