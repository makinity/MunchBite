-- =============================================================================
-- MunchBite - Notifications Table & Realtime Publication Migration
-- =============================================================================

create table if not exists notifications (
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

-- Indexing for high-performance querying
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_notifications_role on notifications(role_target);
create index if not exists idx_notifications_created on notifications(created_at desc);

-- Enable RLS
alter table notifications enable row level security;

-- Policies
create policy "Admins can view all notifications"
  on notifications for select
  using (
    exists (select 1 from admins where admins.id = auth.uid())
    or role_target = 'admin'
  );

create policy "Customers can view their notifications"
  on notifications for select
  using (
    auth.uid() = user_id or role_target = 'customer' or role_target = 'all'
  );

create policy "Users can update their own notifications read state"
  on notifications for update
  using (
    auth.uid() = user_id or exists (select 1 from admins where admins.id = auth.uid())
  );

create policy "Public/Service can insert notifications"
  on notifications for insert
  with check (true);

-- Enable Realtime Replication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table notifications;
  end if;
exception
  when others then null;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table orders;
  end if;
exception
  when others then null;
end $$;
