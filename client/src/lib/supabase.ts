import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Do NOT crash the app if env vars are missing; warn and create a safe fallback client.
if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Supabase env vars missing (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Running in degraded mode."
  );
}

const urlFallback = supabaseUrl || "https://invalid-project.supabase.co";
const keyFallback = supabaseAnonKey || "invalid-anon-key";

export const supabase = createClient(urlFallback, keyFallback, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
