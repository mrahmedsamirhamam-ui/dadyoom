import "server-only";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { unavailableGrowthMetrics } from "./metrics";

export type GrowthBaseline = {
  measuredAt: string;
  profiles: number | null;
  students: number | null;
  childAccounts: number | null;
  teachers: number | null;
  parents: number | null;
  schools: number | null;
  last30Registrations: number | null;
  startedProgressRecords: number | null;
  completedProgressRecords: number | null;
  activityAttempts: number | null;
  gameAttempts: number | null;
  teacherAssignments: number | null;
  northStarWeekly: number | null;
  retentionD1: number | null;
  retentionD7: number | null;
  retentionD30: number | null;
};

type CountQuery = PromiseLike<{count: number | null; error: {message: string} | null}>;

async function countSafely(query: CountQuery): Promise<number | null> {
  try {
    const result = await query;
    return result.error ? null : result.count;
  } catch {
    return null;
  }
}

/**
 * Call only after a fresh, verified admin role check.
 * Uses a server-only key to query aggregate counts; never exports personal data.
 * When the service key is absent, show "unavailable" rather than false zeroes.
 */
export async function getGrowthAdminBaseline(): Promise<GrowthBaseline> {
  const measuredAt = new Date().toISOString();
  const empty: GrowthBaseline = {
    measuredAt, profiles: null, students: null, childAccounts: null,
    teachers: null, parents: null, schools: null, last30Registrations: null,
    startedProgressRecords: null, completedProgressRecords: null,
    activityAttempts: null, gameAttempts: null, teacherAssignments: null,
    northStarWeekly: null, retentionD1: null, retentionD7: null, retentionD30: null,
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !secret) return empty;

  const db = createAdminClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    profiles, students, childAccounts, teachers, parents, schools,
    last30Registrations, startedProgressRecords, completedProgressRecords,
    activityAttempts, gameAttempts, teacherAssignments,
  ] = await Promise.all([
    countSafely(db.from("profiles").select("id", {count:"exact",head:true})),
    countSafely(db.from("profiles").select("id", {count:"exact",head:true}).eq("role","student")),
    countSafely(db.from("profiles").select("id", {count:"exact",head:true}).eq("role","child")),
    countSafely(db.from("profiles").select("id", {count:"exact",head:true}).eq("role","teacher")),
    countSafely(db.from("profiles").select("id", {count:"exact",head:true}).eq("role","parent")),
    countSafely(db.from("profiles").select("id", {count:"exact",head:true}).eq("role","school")),
    countSafely(db.from("profiles").select("id", {count:"exact",head:true}).gte("created_at",thirtyDaysAgo)),
    countSafely(db.from("student_lesson_progress").select("id", {count:"exact",head:true})),
    countSafely(db.from("student_lesson_progress").select("id", {count:"exact",head:true}).in("status",["completed","mastered"])),
    countSafely(db.from("lesson_activity_attempts").select("id", {count:"exact",head:true})),
    countSafely(db.from("edu_game_attempts").select("id", {count:"exact",head:true})),
    countSafely(db.from("edu_assignments").select("id", {count:"exact",head:true})),
  ]);

  return {
    measuredAt, profiles, students, childAccounts, teachers, parents, schools,
    last30Registrations, startedProgressRecords, completedProgressRecords,
    activityAttempts, gameAttempts, teacherAssignments,
    northStarWeekly: unavailableGrowthMetrics.northStarWeekly,
    retentionD1: unavailableGrowthMetrics.retentionD1,
    retentionD7: unavailableGrowthMetrics.retentionD7,
    retentionD30: unavailableGrowthMetrics.retentionD30,
  };
}
