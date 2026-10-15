"use server";

import { revalidatePath } from "next/cache";
import audit from "@/data/curriculum-completeness/bahrain-book-completeness-2026-2027.json";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookTocScopeKey } from "@/lib/curriculum/book-toc-review";
import { textbookSourceCandidate } from "@/lib/curriculum/textbook-source-candidate";

const allowedScopes = new Set(audit.books.map(bookTocScopeKey));


export async function submitBookTocEvidence(formData: FormData) {
  const { user, userError, profile, profileError } = await getDashboardRequestViewer();
  if (userError || profileError || !user || profile?.role?.trim().toLowerCase() !== "admin") {
    throw new Error("غير مصرح بإضافة مصادر المناهج.");
  }
  const scope_key = String(formData.get("scope_key") ?? "").trim();
  const sourceInput = String(formData.get("source_url") ?? "").trim();
  const source_url = textbookSourceCandidate(sourceInput);
  const toc_outline = String(formData.get("toc_outline") ?? "").trim();
  const reviewer_notes = String(formData.get("reviewer_notes") ?? "").trim();
  const tocTitles = toc_outline.split(/\r?\n/u).map(item => item.trim()).filter(Boolean);

  if (!allowedScopes.has(scope_key) || !source_url || sourceInput.length > 600 ||
    toc_outline.length < 5 || toc_outline.length > 12000 ||
    tocTitles.length < 1 || tocTitles.length > 200 ||
    tocTitles.some(title => title.length > 240) ||
    reviewer_notes.length > 2000) {
    throw new Error("مصدر أو فهرس غير صالح. أدخل رابط الوزارة وعناوين الفهرس الفعلية.");
  }

  // Reviewer-submitted text is NEVER equivalent to independently verified
  // textbook TOC or 1:1 matching, even when the URL is government-hosted.
  const db = createAdminClient();
  const saved = await db.from("curriculum_toc_evidence").upsert({
    scope_key, source_url, toc_outline, reviewer_notes,
    review_state: "submitted_for_review",
    updated_by: user.id, updated_at: new Date().toISOString(),
  }, { onConflict: "scope_key" }).select("scope_key").single();
  if (saved.error || !saved.data) {
    throw new Error("تعذر حفظ دليل فهرس الكتاب، ولم يُعدّل أي درس.");
  }
  revalidatePath("/admin/curriculum/coverage/toc-review");
}
