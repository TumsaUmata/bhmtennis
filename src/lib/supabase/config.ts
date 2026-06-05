export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export const isSupabaseConfigured =
  !!supabaseConfig.url && !!supabaseConfig.anonKey;

export const useSupabase =
  process.env.NEXT_PUBLIC_USE_SUPABASE === "true" && isSupabaseConfigured;
