import { createClient } from "@/lib/supabase/server";

type ServerSupabaseClient =
  Awaited<ReturnType<typeof createClient>>;

type MasteryRow = {
  skill: string;
  score: number;
};

type MasteryResult = {
  data: MasteryRow[] | null;
  error: unknown;
};

type CacheEntry = {
  expiresAt: number;
  result: MasteryResult;
};

const MASTERY_CACHE_TTL_MS =
  30 * 1000;

const masteryCache =
  new Map<string, CacheEntry>();

export async function getStudentMasteryCached(
  studentEmail: string,
  supabase: ServerSupabaseClient
): Promise<MasteryResult> {
  const key =
    studentEmail.trim().toLowerCase();

  const cached =
    masteryCache.get(key);

  if (
    cached &&
    cached.expiresAt > Date.now()
  ) {
    console.info(
      "STUDENT_MASTERY_CACHE_HIT",
      {
        studentEmail: key,
      }
    );

    return cached.result;
  }

  console.info(
    "STUDENT_MASTERY_CACHE_MISS",
    {
      studentEmail: key,
    }
  );

  const {
    data,
    error,
  } = await supabase
    .from("student_skills")
    .select("skill, score")
    .eq(
      "student_email",
      studentEmail
    )
    .order("score", {
      ascending: false,
    });

  const result: MasteryResult = {
    data:
      (data ?? []).filter(
        (
          item
        ): item is MasteryRow =>
          typeof item.skill === "string" &&
          typeof item.score === "number"
      ),
    error,
  };

  if (!error) {
    masteryCache.set(
      key,
      {
        result,
        expiresAt:
          Date.now() +
          MASTERY_CACHE_TTL_MS,
      }
    );
  }

  return result;
}

export function invalidateStudentMasteryCache(
  studentEmail: string
) {
  masteryCache.delete(
    studentEmail
      .trim()
      .toLowerCase()
  );
}
