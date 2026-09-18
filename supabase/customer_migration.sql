-- Customer Accounts Migration
-- Run this in Supabase SQL Editor if you already have the MunchBite tables created

-- Add user_id and email columns to customers table if they don't exist
alter table customers 
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists email varchar(255);

-- Create index for quick lookup
create index if not exists idx_customers_user_id on customers(user_id);
create index if not exists idx_customers_contact_number on customers(contact_number);
