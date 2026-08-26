"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  redirect,
} from "next/navigation";

import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import {
  createClient,
} from "@/lib/supabase/server";

export async function joinTeacherClassAction(
  formData: FormData
) {
  const value =
    formData.get(
      "join_code"
    );

  const joinCode =
    typeof value === "string"
      ? value.trim().toUpperCase()
      : "";

  if (!joinCode) {
    redirect(
      "/student?classroomError=" +
        encodeURIComponent(
          "أدخل كود الفصل."
        )
    );
  }

  const supabase =
    await createClient();

  const {
    data: { user },
  } =
    await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login"
    );
  }

  const classroomDb =
    supabase as unknown as
      SupabaseClient;

  const {
    data,
    error,
  } = await classroomDb.rpc(
    "join_teacher_class_by_code",
    {
      p_join_code:
        joinCode,
    }
  );

  if (error) {
    redirect(
      "/student?classroomError=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  const result =
    Array.isArray(data)
      ? data[0]
      : data;

  revalidatePath(
    "/student"
  );

  const message =
    result?.already_member
      ? "أنت عضو بالفعل في هذا الفصل."
      : `تم الانضمام إلى ${
          result?.class_name ??
          "الفصل"
        } بنجاح.`;

  redirect(
    "/student?classroomSuccess=" +
      encodeURIComponent(
        message
      )
  );
}
