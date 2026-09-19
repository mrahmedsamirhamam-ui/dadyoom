
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLIC_URL } from "@/lib/supabase/public-config";

export function createAdminClient() {
  const url = SUPABASE_PUBLIC_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error("إعدادات خدمة رفع الوسائط غير مكتملة على الخادم.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
