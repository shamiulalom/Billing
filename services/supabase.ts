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
 * For the full, production-ready schema including RLS policies, triggers, and the reports table,
 * please refer to the `full_schema.sql` file in the root directory.
 * 
 * Summary of tables:
 * - buyers (id, name, file_no, created_at)
 * - fabrics (id, code, description, created_at)
 * - colors (id, name, created_at)
 * - suppliers (id, code, name, created_at)
 * - reports (id, buyer_name, supplier_name, file_no, invoice_no, lc_number, invoice_date, billing_date, items, total_invoice_qty, total_rcvd_qty, total_amount, created_at, updated_at)
 */
