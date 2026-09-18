-- PayMongo Payment Integration Migration
-- Run this in Supabase SQL Editor to add payment tracking columns

alter table orders
  add column if not exists payment_status varchar(20) default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded', 'failed')),
  add column if not exists payment_method varchar(50) default 'paymongo',
  add column if not exists paymongo_session_id varchar(100),
  add column if not exists paymongo_payment_id varchar(100);

-- Indexes for lightning fast lookups on webhooks and order verification
create index if not exists idx_orders_paymongo_session on orders(paymongo_session_id);
create index if not exists idx_orders_payment_status on orders(payment_status);
