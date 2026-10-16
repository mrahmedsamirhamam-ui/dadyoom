/**
 * Real school-room creation shared by the API route and the legacy
 * server-action adapter. Do not import a "use server" action into the
 * Vinext route handler: that introduces a client/server action transport.
 * All auth, owner, time and RLS checks still run on the server.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { parseBahrainDateTimeLocal } from "@/lib/live/bahrain-datetime";

function value(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

export async function createSchoolMeetingRecord(
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

  const starts = parseBahrainDateTimeLocal(startsAt);
  const ends = endsAt ? parseBahrainDateTimeLocal(endsAt) : null;

  if (!starts || (endsAt && (!ends || ends <= starts))) {
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

}
