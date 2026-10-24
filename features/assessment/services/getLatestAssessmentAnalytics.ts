import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
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
  // Derive ownership and email from the validated request's server session.
  // Never trust a separately supplied student identity for private key lookup.
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user?.email || user.id !== studentId) {
    throw new Error("غير مصرح بالاطلاع على تحليل اختبار طالب آخر.");
  }

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
      supabase: createAdminClient(),
      sessionId: session.id,
      studentId: user.id,
      studentEmail: user.email,
      lessonId: session.lesson_id,
    });

  return {
    sessionId: session.id,
    lessonId: session.lesson_id,
    completedAt: session.updated_at,
    ...analytics,
  };
}
