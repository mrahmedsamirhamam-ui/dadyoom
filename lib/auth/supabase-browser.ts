"use client";

import {
  createBrowserClient,
} from "@supabase/ssr";
import {
  SUPABASE_PUBLIC_KEY,
  SUPABASE_PUBLIC_URL,
} from "@/lib/supabase/public-config";

let client:
  ReturnType<
    typeof createBrowserClient
  >
  | null = null;

export function getSupabaseBrowserClient() {
  if (client) {
    return client;
  }

  client =
    createBrowserClient(
      SUPABASE_PUBLIC_URL,
      SUPABASE_PUBLIC_KEY
    );

  return client;
}
