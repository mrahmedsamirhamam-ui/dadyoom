import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  getAssessmentSessionAnalytics,
} from "./getAssessmentSessionAnalytics";

type LatestAssessmentAnalyticsParams = {
  supabase: SupabaseClient;
  studentId: string;
};

export async function getLatestAssessmentAnalytics({
  supabase,
  studentId,
}: LatestAssessmentAnalyticsParams) {
  const {
    data: session,
    error: sessionError,
  } = await supabase
    .from("assessment_sessions")
    .select(`
      id,
      lesson_id,
      updated_at
    `)
    .eq("student_id", studentId)
    .eq("finished", true)
    .order("updated_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    return null;
  }

  const analytics =
    await getAssessmentSessionAnalytics({
      supabase,
      sessionId: session.id,
      studentId,
    });

  return {
    sessionId: session.id,
    lessonId: session.lesson_id,
    completedAt: session.updated_at,
    ...analytics,
  };
}
