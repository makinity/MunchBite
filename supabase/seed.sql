-- MunchBite Seed Data
-- Run this in Supabase SQL Editor AFTER schema.sql
-- Project: lzyzfiakntkvcumjayfe

-- ─────────────────────────────────────────
-- CATEGORIES
-- ─────────────────────────────────────────
insert into categories (name) values
  ('Cookies'),
  ('Brownies'),
  ('Cupcakes'),
  ('Boxes')
on conflict (name) do nothing;

-- ─────────────────────────────────────────
-- PRODUCTS
-- ─────────────────────────────────────────
insert into products (name, description, price, image_url, category_id, is_available, is_best_seller)
values
  (
    'Choco Chip Cookies',
    'Classic homemade cookies loaded with chocolate chips. Crispy on the outside, chewy on the inside.',
    60.00,
    'https://picsum.photos/seed/cookies/400/400',
    (select id from categories where name = 'Cookies'),
    true,
    true
  ),
  (
    'Fudge Brownies',
    'Rich, dense, and ultra-fudgy brownies made with premium chocolate. A crowd favorite.',
    70.00,
    'https://picsum.photos/seed/brownies/400/400',
    (select id from categories where name = 'Brownies'),
    true,
    true
  ),
  (
    'Cupcakes',
    'Soft and fluffy cupcakes topped with creamy frosting. Perfect for any celebration.',
    65.00,
    'https://picsum.photos/seed/cupcakes/400/400',
    (select id from categories where name = 'Cupcakes'),
    true,
    true
  ),
  (
    'Treat Box (Assorted)',
    'A delightful mix of our best treats — perfect for sharing or gifting to someone special.',
    150.00,
    'https://picsum.photos/seed/treatbox/400/400',
    (select id from categories where name = 'Boxes'),
    true,
    true
  );

-- ─────────────────────────────────────────
-- REVIEWS (pre-published)
-- ─────────────────────────────────────────
insert into reviews (customer_name, content, rating, is_published)
values
  (
    'Happy Customer',
    'Super delicious! Will definitely order again!',
    5,
    true
  ),
  (
    'Maria S.',
    'The brownies are absolutely amazing. My whole family loved them!',
    5,
    true
  ),
  (
    'Jessa M.',
    'Ordered the treat box as a gift and everyone was so happy. Will order more!',
    5,
    true
  ),
  (
    'Carlo R.',
    'Best homemade cookies I''ve ever tasted. Fresh and made with love!',
    5,
    true
  );
