import { createClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase/config";

export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey
);
