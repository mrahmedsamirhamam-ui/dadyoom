"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function createLiveSessionAction(
  form: FormData,
) {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const title = value(form, "title");
  const startsAt = value(form, "startsAt");
  const endsAt = value(form, "endsAt");
  const courseId = value(form, "courseId");
  const classId = value(form, "classId");

  if (
    !title ||
    !startsAt ||
    (!courseId && !classId)
  ) {
    throw new Error("LIVE_SESSION_FIELDS_REQUIRED");
  }

  if (courseId) {
    const { data } = await supabase
      .from("edu_marketplace_courses")
      .select("id")
      .eq("id", courseId)
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (!data) {
      throw new Error("COURSE_NOT_OWNED_BY_TEACHER");
    }
  }

  if (classId) {
    const { data } = await supabase
      .from("teacher_classes")
      .select("id")
      .eq("id", classId)
      .eq("teacher_id", user.id)
      .maybeSingle();

    if (!data) {
      throw new Error("CLASS_NOT_OWNED_BY_TEACHER");
    }
  }

  const starts = new Date(startsAt);

  if (Number.isNaN(starts.getTime())) {
    throw new Error("INVALID_START_TIME");
  }

  const ends = endsAt
    ? new Date(endsAt)
    : null;

  if (
    ends &&
    (
      Number.isNaN(ends.getTime()) ||
      ends <= starts
    )
  ) {
    throw new Error("INVALID_END_TIME");
  }

  const roomName =
    `dadyoom-${user.id.slice(0, 8)}-${crypto.randomUUID()}`;

  const { error } = await db
    .from("edu_live_sessions")
    .insert({
      teacher_id: user.id,
      course_id: courseId || null,
      class_id: classId || null,
      title,
      description: value(form, "description") || null,
      starts_at: starts.toISOString(),
      ends_at: ends?.toISOString() ?? null,
      room_name: roomName,
      status: "scheduled",
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/teacher/live");
  revalidatePath("/student/live");
}


export async function createSchoolMeetingAction(
  form: FormData,
) {
  const supabase = await createClient();
  const db = supabase as unknown as SupabaseClient;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role ?? "")
    .trim()
    .toLowerCase();

  if (role !== "school" && role !== "admin") {
    throw new Error("SCHOOL_ROLE_REQUIRED");
  }

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!school) {
    throw new Error("SCHOOL_NOT_FOUND");
  }

  const title = value(form, "title");
  const startsAt = value(form, "startsAt");
  const endsAt = value(form, "endsAt");

  if (!title || !startsAt) {
    throw new Error("SCHOOL_MEETING_FIELDS_REQUIRED");
  }

  const starts = new Date(startsAt);
  const ends = endsAt ? new Date(endsAt) : null;

  if (
    Number.isNaN(starts.getTime()) ||
    (ends &&
      (Number.isNaN(ends.getTime()) || ends <= starts))
  ) {
    throw new Error("INVALID_MEETING_TIME");
  }

  const roomName =
    `dadyoom-school-${String(school.id).slice(0, 8)}-${crypto.randomUUID()}`;

  const { error } = await db
    .from("edu_live_sessions")
    .insert({
      teacher_id: user.id,
      school_id: school.id,
      course_id: null,
      class_id: null,
      title,
      description: value(form, "description") || null,
      starts_at: starts.toISOString(),
      ends_at: ends?.toISOString() ?? null,
      room_name: roomName,
      status: "scheduled",
    });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/school");
  revalidatePath("/school/meetings");
}
