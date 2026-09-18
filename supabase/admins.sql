-- MunchBite — Admin Setup
-- Run this in Supabase SQL Editor AFTER schema.sql
-- Project: lzyzfiakntkvcumjayfe

-- ─────────────────────────────────────────
-- ADMINS TABLE
-- Links to Supabase Auth users
-- ─────────────────────────────────────────
create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(100) not null,
  email varchar(150) not null unique,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- Only the authenticated user can read their own admin record
create policy "Admin can read own record"
  on admins for select
  using (auth.uid() = id);

-- ─────────────────────────────────────────
-- HOW TO CREATE THE ADMIN USER
-- ─────────────────────────────────────────
-- Step 1: Go to Supabase Dashboard → Authentication → Users → Add User
--   Email:    admin@munchbite.com      (or any email you prefer)
--   Password: (set a strong password)
--   Check "Auto Confirm User"
--   Click "Create User"
--
-- Step 2: Copy the UUID of the newly created user from the Users list
--
-- Step 3: Run the INSERT below, replacing <PASTE_UUID_HERE> with the actual UUID:

-- insert into admins (id, name, email) values (
--   '<PASTE_UUID_HERE>',
--   'MunchBite Admin',
--   'admin@munchbite.com'
-- );

-- ─────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────
-- After inserting, run this to confirm:
-- select * from admins;
