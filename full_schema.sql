-- ==========================================
-- TUSUKA INVENTORY REPORT GENERATOR SCHEMA
-- ==========================================
-- This script creates all necessary tables and policies for the application.
-- Run this in your Supabase SQL Editor to clone the database structure.

-- 1. EXTENSIONS
-- Enable uuid-ossp for gen_random_uuid() if not already enabled
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Buyers table
create table if not exists buyers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  file_no text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Fabrics table
create table if not exists fabrics (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Colors table
create table if not exists colors (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Suppliers table
create table if not exists suppliers (
  id uuid default gen_random_uuid() primary key,
  code text not null unique,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Reports table (Dashboard History)
create table if not exists reports (
  id uuid default gen_random_uuid() primary key,
  buyer_name text not null,
  supplier_name text,
  file_no text,
  invoice_no text,
  lc_number text,
  invoice_date text,
  billing_date text,
  items jsonb default '[]'::jsonb,
  total_invoice_qty numeric default 0,
  total_rcvd_qty numeric default 0,
  total_amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables
alter table buyers enable row level security;
alter table fabrics enable row level security;
alter table colors enable row level security;
alter table suppliers enable row level security;
alter table reports enable row level security;

-- 4. POLICIES
-- Create "Public Access" policies for all operations (Current working model)
-- Note: In a production environment, you should restrict these to authenticated users.

-- Buyers Policies
create policy "Public Access" on buyers for all using (true) with check (true);

-- Fabrics Policies
create policy "Public Access" on fabrics for all using (true) with check (true);

-- Colors Policies
create policy "Public Access" on colors for all using (true) with check (true);

-- Suppliers Policies
create policy "Public Access" on suppliers for all using (true) with check (true);

-- Reports Policies
create policy "Public Access" on reports for all using (true) with check (true);

-- 5. FUNCTIONS & TRIGGERS
-- Function to handle updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for reports table
create trigger set_updated_at
before update on reports
for each row
execute function handle_updated_at();

-- 6. INDEXES (Optional but recommended for performance)
create index if not exists idx_reports_updated_at on reports(updated_at desc);
create index if not exists idx_buyers_name on buyers(name);
create index if not exists idx_fabrics_code on fabrics(code);
create index if not exists idx_suppliers_code on suppliers(code);
