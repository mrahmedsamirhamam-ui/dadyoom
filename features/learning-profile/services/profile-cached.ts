import { createClient } from "@/lib/supabase/server";
import { getLearningProfile } from "./profile";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

type LearningProfileResult =
  Awaited<
    ReturnType<typeof getLearningProfile>
  >;

type CacheEntry = {
  expiresAt: number;
  data: LearningProfileResult;
};

const PROFILE_CACHE_TTL_MS =
  30 * 1000;

const profileCache =
  new Map<string, CacheEntry>();

export async function getLearningProfileCached(
  studentId: string,
  supabase: ServerSupabaseClient
): Promise<LearningProfileResult> {
  const cached =
    profileCache.get(studentId);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    console.info(
      "LEARNING_PROFILE_CACHE_HIT",
      {
        studentId,
      }
    );

    return cached.data;
  }

  console.info(
    "LEARNING_PROFILE_CACHE_MISS",
    {
      studentId,
    }
  );

  const data =
    await getLearningProfile(
      studentId,
      supabase
    );

  profileCache.set(
    studentId,
    {
      data,
      expiresAt:
        Date.now() +
        PROFILE_CACHE_TTL_MS,
    }
  );

  return data;
}

export function invalidateLearningProfileCache(
  studentId: string
) {
  profileCache.delete(studentId);
}
