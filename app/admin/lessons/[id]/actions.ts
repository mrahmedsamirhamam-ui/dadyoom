"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import { validateBahrainDraftCorrection } from "@/lib/curriculum/bahrain-draft-correction";

type Relation<T> = T | T[] | null;
const first = <T,>(value: Relation<T>): T | null =>
  Array.isArray(value) ? value[0] ?? null : value;

type ScopeCountry = { code: string };
type ScopeCurriculum = { countries: Relation<ScopeCountry> };
type ScopeGrade = { curricula: Relation<ScopeCurriculum> };
type ScopeUnit = { grades: Relation<ScopeGrade> };

export async function saveBahrainDraftCorrection(formData: FormData) {
  const { user, userError, profile, profileError } = await getDashboardRequestViewer();
  if (userError || profileError || !user || profile?.role?.trim().toLowerCase() !== "admin") {
    throw new Error("لا يحق تعديل مسودات المناهج إلا لمدير المنصة.");
  }
  const id = String(formData.get("lesson_id") ?? "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu.test(id)) {
    throw new Error("معرّف الدرس غير صالح.");
  }
  const parsed = validateBahrainDraftCorrection({
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    content: String(formData.get("content") ?? ""),
    sourceUrl: String(formData.get("source_url") ?? ""),
    sourcePageStart: String(formData.get("source_page_start") ?? ""),
    sourcePageEnd: String(formData.get("source_page_end") ?? ""),
  });
  if (!parsed.ok) throw new Error(parsed.error);

  // Validate the EXISTING record and its country before a privileged write.
  const db = createAdminClient();
  const { data: row, error } = await db.from("lessons")
    .select("id,status,units!inner(grades!inner(curricula!inner(countries!inner(code))))")
    .eq("id", id).maybeSingle();
  if (error || !row || row.status !== "draft") {
    throw new Error("لا يمكن تحرير إلا مسودة قائمة لم تُنشر.");
  }
  const unit = first(row.units as Relation<ScopeUnit>);
  const grade = first(unit?.grades ?? null);
  const curriculum = first(grade?.curricula ?? null);
  const country = first(curriculum?.countries ?? null);
  if (country?.code !== "BH") {
    throw new Error("التحرير من هذه الواجهة مخصص لمسودات البحرين فقط.");
  }

  const { data: saved, error: saveError } = await db.from("lessons")
    .update(parsed.draft)
    .eq("id", id).eq("status", "draft")
    .select("id").maybeSingle();
  if (saveError || !saved) {
    throw new Error("تعذر حفظ التصحيح أو تغيرت حالة الدرس. لم يُنشر أي محتوى.");
  }

  // No update to status, no assessment publication and no automatic TOC claim.
  revalidatePath(`/admin/lessons/${id}`);
  revalidatePath("/admin/curriculum/coverage/drafts");
}
