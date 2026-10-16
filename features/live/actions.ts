"use server";

import { revalidatePath } from "next/cache";

import { createSchoolMeetingRecord } from "@/lib/live/create-school-meeting";
import { createTeacherLiveSessionRecord } from "@/lib/live/create-teacher-session";

export async function createLiveSessionAction(form: FormData) {
  await createTeacherLiveSessionRecord(form);
  revalidatePath("/teacher/live");
  revalidatePath("/student/live");
}

export async function createSchoolMeetingAction(form: FormData) {
  await createSchoolMeetingRecord(form);
  revalidatePath("/school");
  revalidatePath("/school/meetings");
}

export type SchoolMeetingActionState = { ok: boolean; message: string };

export async function createSchoolMeetingWithResult(
  _previous: SchoolMeetingActionState, form: FormData,
): Promise<SchoolMeetingActionState> {
  try {
    await createSchoolMeetingAction(form);
    return { ok: true, message: "تم حفظ اجتماع المعلمين بنجاح." };
  } catch (error) {
    console.error("SCHOOL_MEETING_SAVE_FAILURE", error instanceof Error ? error.message : "unknown");
    return { ok: false, message: "تعذر إنشاء الغرفة. تحقق من المدرسة والموعد ثم أعد المحاولة." };
  }
}
