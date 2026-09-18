-- MunchBite Database Schema
-- Run this in Supabase SQL Editor
-- Project: lzyzfiakntkvcumjayfe

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null unique,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  description text,
  price numeric(8,2) not null,
  image_url text,
  category_id uuid references categories(id) on delete set null,
  is_available boolean not null default true,
  is_best_seller boolean not null default false,
  stock integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name varchar(100) not null,
  email varchar(255),
  contact_number varchar(20),
  address text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- ORDERS
-- ─────────────────────────────────────────
create table if not exists orders (
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

-- ─────────────────────────────────────────
-- ORDER ITEMS
-- ─────────────────────────────────────────
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  quantity integer not null,
  unit_price numeric(8,2) not null,
  subtotal numeric(10,2) not null
);

-- ─────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  customer_name varchar(100) not null,
  content text not null,
  rating integer not null check (rating between 1 and 5),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger products_updated_at
  before update on products
  for each row execute function update_updated_at();

create or replace trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;

-- Public read: categories, products (available only), published reviews
create policy "Public can read categories"
  on categories for select using (true);

create policy "Public can read available products"
  on products for select using (is_available = true);

create policy "Public can read published reviews"
  on reviews for select using (is_published = true);

-- Public insert: customers, orders, order_items, reviews (submissions)
create policy "Public can insert customers"
  on customers for insert with check (true);

create policy "Public can insert orders"
  on orders for insert with check (true);

create policy "Public can insert order_items"
  on order_items for insert with check (true);

create policy "Public can submit reviews"
  on reviews for insert with check (true);

-- Service role bypass (admin operations use service role key — bypasses RLS)
