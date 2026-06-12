-- Supabase schema for customer artwork projects.
-- Run this in the Supabase SQL editor before testing persistence.

create extension if not exists pgcrypto;

create table if not exists public.artwork_projects (
  id uuid primary key default gen_random_uuid(),
  email text,
  original_image_url text,
  selected_preview_url text,
  selected_style text,
  selected_size text,
  selected_frame text,
  estimated_price numeric,
  shopify_order_id text,
  status text default 'created',
  created_at timestamp with time zone default now()
);

create table if not exists public.generated_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.artwork_projects(id),
  image_url text,
  style_name text,
  selected boolean default false,
  created_at timestamp with time zone default now()
);

create index if not exists generated_images_project_id_idx
  on public.generated_images(project_id);

-- Storage bucket setup:
-- 1. In Supabase Dashboard, go to Storage > Buckets.
-- 2. Create bucket: customer-uploads
-- 3. Create bucket: generated-previews
-- 4. For this prototype, make both buckets public so getPublicUrl works.
-- 5. TODO: Replace public URLs with signed URLs before production.
--
-- Optional SQL bucket creation if you prefer SQL:
-- insert into storage.buckets (id, name, public)
-- values ('customer-uploads', 'customer-uploads', true)
-- on conflict (id) do nothing;
--
-- insert into storage.buckets (id, name, public)
-- values ('generated-previews', 'generated-previews', true)
-- on conflict (id) do nothing;
--
-- TODO: Add Shopify checkout after project persistence is stable.
-- TODO: Add Shopify order-created webhook to update shopify_order_id/status.
-- TODO: Add production and artist workflow tables once the customer flow is stable.
