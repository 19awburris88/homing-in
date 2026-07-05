import { createClient } from '@supabase/supabase-js';

// The app runs in one of two modes, decided at load time by whether Supabase
// env vars are present:
//   • cloud mode  — data synced across devices, login required (keys set)
//   • local mode  — current behavior, data in this browser only (no keys)
// This lets everything keep working while the Supabase project is being set up.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isCloud = Boolean(url && anonKey);

export const supabase = isCloud
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
