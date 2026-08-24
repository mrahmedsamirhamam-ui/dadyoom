"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function updateLessonObjectives(
  formData: FormData
) {
  const id =
    typeof formData.get("id") === "string"
      ? String(formData.get("id")).trim()
      : "";

  const rawObjectives =
    typeof formData.get("objectives_json") === "string"
      ? String(formData.get("objectives_json"))
      : "";

  if (!id) {
    throw new Error(
      "\u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u062f\u0631\u0633 \u0645\u0637\u0644\u0648\u0628."
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        rawObjectives
      );
  }
  catch {
    throw new Error(
      "Invalid objectives payload."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Objectives payload must be an array."
    );
  }

  const objectives =
    parsed
      .filter(
        (item): item is string =>
          typeof item === "string"
      )
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);

  if (objectives.length > 30) {
    throw new Error(
      "Too many learning objectives."
    );
  }

  if (
    objectives.some(
      (objective) =>
        objective.length > 500
    )
  ) {
    throw new Error(
      "A learning objective is too long."
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !user
  ) {
    throw new Error(
      "\u064a\u062c\u0628 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062f\u0631\u0633."
    );
  }

  const {
    data: profile,
    error: profileError,
  } =
    await supabase
      .from("profiles")
      .select("role")
      .eq(
        "id",
        user.id
      )
      .maybeSingle();

  if (
    profileError ||
    !profile
  ) {
    throw new Error(
      "\u062a\u0639\u0630\u0631 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0627\u0644\u062d\u0633\u0627\u0628."
    );
  }

  const role =
    profile.role
      ?.trim()
      .toLowerCase() ??
    "";

  if (
    role !== "admin" &&
    role !== "teacher"
  ) {
    throw new Error(
      "\u063a\u064a\u0631 \u0645\u0635\u0631\u062d \u0644\u0643 \u0628\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062f\u0631\u0648\u0633."
    );
  }

  const {
    data: lesson,
    error: lessonError,
  } =
    await supabase
      .from("lessons")
      .select(
        "id, created_by"
      )
      .eq(
        "id",
        id
      )
      .maybeSingle();

  if (
    lessonError ||
    !lesson
  ) {
    throw new Error(
      "\u062a\u0639\u0630\u0631 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u062f\u0631\u0633."
    );
  }

  if (
    role === "teacher" &&
    lesson.created_by !== user.id
  ) {
    throw new Error(
      "\u0644\u0627 \u064a\u0645\u0643\u0646\u0643 \u062a\u0639\u062f\u064a\u0644 \u062f\u0631\u0633 \u064a\u062e\u0635 \u0645\u0639\u0644\u0645\u0627 \u0622\u062e\u0631."
    );
  }

  const { error } =
    await supabase
      .from("lessons")
      .update({
        learning_objectives:
          objectives,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id
      );

  if (error) {
    throw error;
  }

  revalidatePath(
    "/teacher/" + id
  );

  revalidatePath(
    "/lessons/" + id
  );

  revalidatePath(
    "/teacher"
  );
}
