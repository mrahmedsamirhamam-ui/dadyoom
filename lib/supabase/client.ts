import { createBrowserClient } from "@supabase/ssr";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

export function createClient() {
  return createBrowserClient(
    SUPABASE_PUBLIC_URL,
    SUPABASE_PUBLIC_KEY
  );
}
