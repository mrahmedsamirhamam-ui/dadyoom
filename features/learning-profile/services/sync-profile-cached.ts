import { createClient } from "@/lib/supabase/server";
import { syncLearningProfile } from "./sync-profile";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

const SYNC_TTL_MS = 30 * 1000;

const syncCache = new Map<
  string,
  number
>();

export async function syncLearningProfileCached(
  studentId: string,
  supabase: ServerSupabaseClient
) {
  const now = Date.now();

  const expiresAt =
    syncCache.get(studentId) ?? 0;

  if (expiresAt > now) {
    console.info(
      "LEARNING_PROFILE_SYNC_CACHE_HIT",
      {
        studentId,
      }
    );

    return;
  }

  console.info(
    "LEARNING_PROFILE_SYNC_CACHE_MISS",
    {
      studentId,
    }
  );

  await syncLearningProfile(
    studentId,
    supabase
  );

  syncCache.set(
    studentId,
    Date.now() + SYNC_TTL_MS
  );
}

export function invalidateLearningProfileSync(
  studentId: string
) {
  syncCache.delete(studentId);
}
