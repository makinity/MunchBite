-- =============================================================================
-- MunchBite - Fresh Migration & Seed (Laravel migrate:fresh --seed Equivalent)
-- =============================================================================
-- Drops existing tables, creates complete schema, configures RLS,
-- and seeds categories, products, reviews, admin, and customer accounts.
-- =============================================================================

-- 1. DROP EXISTING TABLES (CLEAN SLATE)
drop table if exists notifications cascade;
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists customers cascade;
drop table if exists reviews cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists admins cascade;

-- 2. CREATE EXTENSIONS
create extension if not exists "pgcrypto";

-- 3. CREATE TABLES

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  created_at timestamptz not null default now()
);

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description text,
  price numeric(8,2) not null,
  image_url text,
  category_id uuid references categories(id) on delete set null,
  is_available boolean not null default true,
  is_best_seller boolean not null default false,
  stock integer default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name varchar(100) not null,
  email varchar(255),
  contact_number varchar(20),
  address text,
  created_at timestamptz not null default now()
);

-- Orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  status varchar(20) not null default 'pending'
    check (status in ('pending','confirmed','preparing','ready','delivered','cancelled')),
  payment_status varchar(20) not null default 'unpaid'
    check (payment_status in ('unpaid','paid','refunded','failed')),
  payment_method varchar(50) default 'paymongo',
  paymongo_session_id varchar(100),
  paymongo_payment_id varchar(100),
  total_amount numeric(10,2) not null,
  notes text,
  ordered_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order Items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(8,2) not null,
  subtotal numeric(10,2) not null
);

-- Reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name varchar(100) not null,
  content text not null,
  rating integer not null check (rating between 1 and 5),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role_target varchar(20) not null default 'customer' check (role_target in ('admin', 'customer', 'all')),
  order_id uuid references orders(id) on delete cascade,
  title varchar(150) not null,
  message text not null,
  type varchar(50) not null default 'general',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Admins
create table admins (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar(100) not null,
  email varchar(150) not null unique,
  created_at timestamptz not null default now()
);

-- 4. ROW LEVEL SECURITY (RLS)
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table admins enable row level security;

-- Public read policies
create policy "Public can read categories" on categories for select using (true);
create policy "Public can read products" on products for select using (true);
create policy "Public can read reviews" on reviews for select using (is_published = true);

-- Notifications policies
create policy "Admins can view notifications" on notifications for select using (
  exists (select 1 from admins where admins.id = auth.uid()) or role_target = 'admin'
);
create policy "Customers can view their notifications" on notifications for select using (
  auth.uid() = user_id or role_target = 'customer' or role_target = 'all'
);
create policy "Users can update notification status" on notifications for update using (
  auth.uid() = user_id or exists (select 1 from admins where admins.id = auth.uid())
);
create policy "Public can insert notifications" on notifications for insert with check (true);

-- Public insert policies
create policy "Public can insert customers" on customers for insert with check (true);
create policy "Public can insert orders" on orders for insert with check (true);
create policy "Public can insert order_items" on order_items for insert with check (true);
create policy "Public can submit reviews" on reviews for insert with check (true);

-- Authenticated & Admin policies
create policy "Admins can read admins" on admins for select using (true);
create policy "Authenticated can read customers" on customers for select using (true);
create policy "Authenticated can update customers" on customers for update using (true);
create policy "Authenticated can read orders" on orders for select using (true);
create policy "Authenticated can update orders" on orders for update using (true);
create policy "Authenticated can read order_items" on order_items for select using (true);

-- 5. SEED DATA

-- A. Categories
insert into categories (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Cookies'),
  ('22222222-2222-2222-2222-222222222222', 'Brownies'),
  ('33333333-3333-3333-3333-333333333333', 'Cupcakes'),
  ('44444444-4444-4444-4444-444444444444', 'Bundles')
on conflict (name) do nothing;

-- B. Products
insert into products (name, description, price, image_url, category_id, is_available, is_best_seller, stock) values
  (
    'Choco Chip Cookies',
    'Classic golden-brown cookies packed with rich, gooey chocolate chips in every bite.',
    60.00,
    'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&q=80',
    '11111111-1111-1111-1111-111111111111',
    true,
    true,
    50
  ),
  (
    'Fudge Brownies',
    'Decadent, fudgy chocolate squares with a shiny crinkle top and melt-in-your-mouth center.',
    70.00,
    'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    '22222222-2222-2222-2222-222222222222',
    true,
    true,
    40
  ),
  (
    'Red Velvet Cupcakes',
    'Fluffy, moist red velvet sponge crowned with our signature whipped cream cheese frosting.',
    65.00,
    'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?auto=format&fit=crop&w=600&q=80',
    '33333333-3333-3333-3333-333333333333',
    true,
    false,
    30
  ),
  (
    'MunchBite Treat Box (Assorted)',
    'The ultimate party sampler: 3 choco chip cookies, 2 fudge brownies, and 2 cupcakes in a gift box.',
    150.00,
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
    '44444444-4444-4444-4444-444444444444',
    true,
    true,
    25
  );

-- C. Customer Reviews
insert into reviews (customer_name, content, rating, is_published) values
  ('Sarah Jenkins', 'The best cookies in town! Super soft inside with the perfect crunch on the edges.', 5, true),
  ('Mark Anthony', 'The fudge brownies are dangerously addictive. Ordered for my team and they loved it!', 5, true),
  ('Chloe Mendoza', 'Love the packaging and prompt delivery! The cupcakes are so light and not overly sweet.', 5, true),
  ('Dave Bautista', 'Fast checkout with GCash and arrived warm. 10/10 will order again.', 5, true);

-- D. Link Existing Auth Users to Admin & Customer (if already signed up)
-- Admin links
insert into admins (id, name, email)
select id, 'Admin', email 
from auth.users 
where email in ('admin@munchbite.com', 'denjikun1003@gmail.com')
on conflict (id) do update set email = excluded.email;

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin", "full_name": "Store Admin"}'::jsonb,
    email_confirmed_at = coalesce(email_confirmed_at, now())
where email in ('admin@munchbite.com', 'denjikun1003@gmail.com');

-- Auto-confirm all users so confirmation emails are never required
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now());
