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

export async function createSchoolAction(
  formData: FormData
) {
  const nameValue =
    formData.get("name");

  const countryValue =
    formData.get("country");

  const academicYearValue =
    formData.get("academicYear");

  const name =
    typeof nameValue === "string"
      ? nameValue.trim()
      : "";

  const country =
    typeof countryValue === "string"
      ? countryValue.trim()
      : "";

  const academicYear =
    typeof academicYearValue === "string"
      ? academicYearValue.trim()
      : "";

  if (!name) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          "اسم المدرسة مطلوب."
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
    redirect("/login");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const {
    error,
  } =
    await db.rpc(
      "ensure_my_school",
      {
        p_name: name,
        p_country:
          country || null,
        p_academic_year:
          academicYear || null,
      }
    );

  if (error) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  revalidatePath("/school");

  redirect(
    "/school?success=" +
      encodeURIComponent(
        "تم إنشاء ملف المدرسة بنجاح."
      )
  );
}

export async function linkTeacherToSchoolAction(
  formData: FormData
) {
  const codeValue =
    formData.get("teacherCode");

  const code =
    typeof codeValue === "string"
      ? codeValue.trim().toUpperCase()
      : "";

  if (!code) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          "أدخل كود المعلم."
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
    redirect("/login");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const {
    data,
    error,
  } =
    await db.rpc(
      "link_teacher_to_school_by_code",
      {
        p_code: code,
      }
    );

  if (error) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  const result =
    Array.isArray(data)
      ? data[0]
      : data;

  const message =
    result?.already_linked
      ? "هذا المعلم مرتبط بالمدرسة بالفعل."
      : `تم ربط ${
          result?.teacher_name ??
          "المعلم"
        } بالمدرسة بنجاح.`;

  revalidatePath("/school");

  redirect(
    "/school?success=" +
      encodeURIComponent(
        message
      )
  );
}

export async function createSchoolInterventionAction(
  formData: FormData
) {
  const teacherIdValue =
    formData.get("teacherId");

  const classIdValue =
    formData.get("classId");


  const studentIdValue =
    formData.get("studentId");

const insightTypeValue =
    formData.get("insightType");

  const titleValue =
    formData.get("title");

  const notesValue =
    formData.get("notes");

  const priorityValue =
    formData.get("priority");


  const teacherId =
    typeof teacherIdValue === "string"
      ? teacherIdValue.trim()
      : "";

  const classId =
    typeof classIdValue === "string"
      ? classIdValue.trim()
      : "";


  const studentId =
    typeof studentIdValue === "string"
      ? studentIdValue.trim()
      : "";

const insightType =
    typeof insightTypeValue === "string"
      ? insightTypeValue.trim()
      : "";

  const title =
    typeof titleValue === "string"
      ? titleValue.trim()
      : "";

  const notes =
    typeof notesValue === "string"
      ? notesValue.trim()
      : "";

  const priority =
    typeof priorityValue === "string"
      ? priorityValue.trim()
      : "medium";


  if (!classId || !title) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          "بيانات إجراء المتابعة غير مكتملة."
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
    redirect("/login");
  }

  const db =
    supabase as unknown as SupabaseClient;


  const {
    error,
  } =
    await db.rpc(
      "create_school_intervention",
      {
        p_teacher_id:
          teacherId || null,

        p_class_id:
          classId || null,

        p_student_id:
          studentId || null,

        p_insight_type:
          insightType || null,

        p_action_type:
          "academic_follow_up",

        p_title:
          title,

        p_notes:
          notes || null,

        p_priority:
          priority,

        p_due_date:
          null,
      }
    );


  if (error) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  revalidatePath("/school");

  if (studentId) {
    revalidatePath(
      `/school/students/${studentId}`
    );
  }
  return;
}


export async function updateSchoolInterventionStatusAction(
  formData: FormData
) {
  const interventionIdValue =
    formData.get("interventionId");

  const statusValue =
    formData.get("status");


  const interventionId =
    typeof interventionIdValue === "string"
      ? interventionIdValue.trim()
      : "";

  const status =
    typeof statusValue === "string"
      ? statusValue.trim()
      : "";


  if (
    !interventionId ||
    ![
      "open",
      "in_progress",
      "resolved",
    ].includes(status)
  ) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          "بيانات تحديث الإجراء غير صحيحة."
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
    redirect("/login");
  }

  const db =
    supabase as unknown as SupabaseClient;


  const {
    error,
  } =
    await db.rpc(
      "update_school_intervention_status",
      {
        p_intervention_id:
          interventionId,

        p_status:
          status,
      }
    );


  if (error) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          error.message
        )
    );
  }


  revalidatePath("/school");

  redirect(
    "/school?success=" +
      encodeURIComponent(
        "تم تحديث حالة إجراء المتابعة."
      )
  );
}


export async function deleteSchoolInterventionAction(
  formData: FormData
) {
  const interventionIdValue =
    formData.get("interventionId");

  const interventionId =
    typeof interventionIdValue === "string"
      ? interventionIdValue.trim()
      : "";

  if (!interventionId) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          "معرّف إجراء المتابعة غير موجود."
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
    redirect("/login");
  }

  const db =
    supabase as unknown as SupabaseClient;

  const {
    error,
  } =
    await db.rpc(
      "delete_school_intervention",
      {
        p_intervention_id:
          interventionId,
      }
    );

  if (error) {
    redirect(
      "/school?error=" +
        encodeURIComponent(
          error.message
        )
    );
  }

  revalidatePath("/school");

  return;
}
