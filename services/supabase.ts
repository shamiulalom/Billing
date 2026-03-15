import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return supabaseInstance;
};

// Export a placeholder for types if needed, but use getSupabase() for operations
export const supabase = {} as SupabaseClient; 

/**
 * SQL SCHEMA FOR SUPABASE:
 * 
 * -- Buyers table
 * create table buyers (
 *   id uuid default gen_random_uuid() primary key,
 *   name text not null,
 *   file_no text unique,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Fabrics table
 * create table fabrics (
 *   id uuid default gen_random_uuid() primary key,
 *   code text not null unique,
 *   description text,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Colors table
 * create table colors (
 *   id uuid default gen_random_uuid() primary key,
 *   name text not null unique,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Suppliers table
 * create table suppliers (
 *   id uuid default gen_random_uuid() primary key,
 *   code text not null unique,
 *   name text not null,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- Enable RLS
 * alter table buyers enable row level security;
 * alter table fabrics enable row level security;
 * alter table colors enable row level security;
 * alter table suppliers enable row level security;
 * 
 * -- Create policies
 * create policy "Public Access" on buyers for all using (true);
 * create policy "Public Access" on fabrics for all using (true);
 * create policy "Public Access" on colors for all using (true);
 * create policy "Public Access" on suppliers for all using (true);
 */
