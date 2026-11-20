// Android app: the user's own Supabase project (not Lovable). The publishable key is public by
// design – data is protected by Row Level Security on the `profiles` table.
import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL = "https://crgjrtpjjkeubnqihuiy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UkQxWREkssCLUI4pFQ3MkQ_u4q1pgpt";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // Links from e-mails come back through the app deep link (see src/native/deepLinks.ts).
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
