import Link from "next/link";
import { redirect } from "next/navigation";
import audit from "@/data/curriculum-completeness/bahrain-book-completeness-2026-2027.json";
import { bookTocScopeKey } from "@/lib/curriculum/book-toc-review";
import { getDashboardRequestViewer } from "@/lib/auth/request-viewer";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitBookTocEvidence } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Review = {
  scope_key: string;
  source_url: string;
  toc_outline: string;
  reviewer_notes: string;
  review_state: string;
  updated_at: string;
};

export default async function BahrainTocEvidenceIntakePage() {
  const { user, profile, profileError, userError } = await getDashboardRequestViewer();
  if (userError || profileError || !user || profile?.role?.trim().toLowerCase() !== "admin") {
    redirect("/");
  }
  const db = createAdminClient();
  const result = await db.from("curriculum_toc_evidence")
    .select("scope_key,source_url,toc_outline,reviewer_notes,review_state,updated_at")
    .order("updated_at", { ascending: false }).limit(100);
  const failed = Boolean(result.error);
  const reviews = (result.data ?? []) as Review[];
  const map = new Map(reviews.map(review => [review.scope_key, review]));
  const rows = [...audit.books].sort((a, b) =>
    (a.grade === 2 ? -1 : b.grade === 2 ? 1 : 0) ||
    a.program.localeCompare(b.program, "ar") ||
    (a.grade ?? 100) - (b.grade ?? 100) ||
    a.semesterOrBookPart - b.semesterOrBookPart
  );

  return <section dir="rtl" data-toc-evidence-state={failed ? "error" : "ready"}
      className="min-h-screen bg-[#f7f1e6] px-4 py-8 text-[#203a34]">
    <div className="mx-auto max-w-6xl space-y-6">
      <nav className="flex flex-wrap gap-3 text-sm font-black text-[#174f47]">
        <Link href="/admin">الإدارة</Link><span>←</span>
        <Link href="/admin/curriculum/coverage">تدقيق البحرين</Link><span>←</span>
        <span>إدخال أدلة فهرس الكتاب</span>
      </nav>
      <header className="rounded-3xl border border-[#ddcfb4] bg-white p-6">
        <p className="text-sm font-bold text-[#976a2c]">مراجعة مناهج البحرين • {audit.academicYear}</p>
        <h1 className="mt-2 text-3xl font-black text-[#123f39]">توثيق فهارس الكتب الرسمية</h1>
        <p className="mt-3 leading-8 text-[#655b4d]">
          أدخل الرابط المباشر للكتاب نفسه من الوزارة، وانقل عناوين عناصر فهرسه كما تظهر في الكتاب،
          كل عنوان في سطر مستقل. هذه أدلة تحتاج تدقيقًا مستقلًا وربطًا 1:1 مع الدروس.
          رابط خطة التدريس أو دليل أسماء الكتب لا يكفي وحده؛ لا يُعتمد أي كتاب مكتملًا ولا يُنشر أي درس بمجرد حفظ هذه البيانات.
        </p>
        <Link href="/admin/curriculum/coverage/toc-review/grade-2"
          className="mt-4 inline-flex rounded-xl border border-[#bed0c4] bg-[#edf6f1] px-5 py-3 text-sm font-black text-[#174f47]">
          مطابقة فهرس الصف الثاني بالدروس — معاينة أولية ←
        </Link>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
          <span className="rounded-xl bg-[#edf6f1] px-4 py-3">نطاقات الكتب: {rows.length}</span>
          <span className="rounded-xl bg-amber-50 px-4 py-3 text-amber-950">
            أدلة بانتظار المطابقة: {reviews.length}
          </span>
          <span className="rounded-xl bg-[#fff4da] px-4 py-3 text-[#876522]">
            فهارس مؤكدة بالمطابقة 1:1: {audit.summary.completeBooks}
          </span>
        </div>
        {failed ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-red-800">
          تعذرت قراءة أدلة المراجعة من قاعدة البيانات. لا يظهر التقرير فارغًا باعتباره ناجحًا.
        </p> : null}
      </header>
      {!failed ? rows.map((book) => {
        const scope = bookTocScopeKey(book);
        const review = map.get(scope);
        const title = [book.program, book.level || (book.grade ? `الصف ${book.grade}` : ""),
          book.track, `الفصل/الجزء ${book.semesterOrBookPart}`].filter(Boolean).join(" • ");
        const catalog = book.currentBookCatalogSource || book.catalogSourceUrl;
        return <details key={scope} className="rounded-2xl border border-[#e0d3b9] bg-white p-5">
          <summary className="cursor-pointer font-black text-[#123f39]">
            {title}
            <span className="mr-3 text-xs text-amber-800">
              {review ? "دليل قيد التحقق" : "ينتظر إدخال فهرس"}
            </span>
          </summary>
          <div className="mt-4 space-y-4 border-t border-[#eee4d3] pt-4">
            <p className="text-sm leading-7 text-[#665b4b]">
              الكتب المسجلة: {book.currentBookCatalogTitles?.join("، ") ||
                book.bookTitle || "لم يثبت كتاب مستقل بعد"}.
              حالة المطابقة الأصلية: {book.status}؛ لا تتغير بمجرد الإدخال.
            </p>
            {book.program === "التعليم الأساسي" &&
              book.grade !== null && book.grade >= 1 && book.grade <= 9 ? (
                <Link href={"/admin/curriculum/coverage/toc-review/basic/" + book.grade}
                  className="inline-block text-sm font-bold text-[#174f47] underline">
                  مطابقة عناوين هذا الصف بالفهرس المدخل ←
                </Link>
            ) : null}
            {catalog?.startsWith("https://") ? <a href={catalog} target="_blank"
              rel="noopener noreferrer" className="inline-block text-sm font-bold text-[#174f47] underline">
              دليل كتب الوزارة المسجل ↗
            </a> : null}
            {review ? <p className="text-xs font-bold text-[#86642a]">
              آخر إدخال دليل: {new Date(review.updated_at).toLocaleDateString("ar-BH", { timeZone: "Asia/Bahrain" })}
              — لم تُعتمد المطابقة حتى الآن.
            </p> : null}
            <form action={submitBookTocEvidence} className="grid gap-4">
              <input type="hidden" name="scope_key" value={scope} />
              <label className="block text-sm font-bold">رابط مصدر الكتاب الرسمي (HTTPS)
                <input name="source_url" type="url" required maxLength={600}
                  defaultValue={review?.source_url ?? ""} placeholder="https://edunet.bh/..."
                  className="mt-2 w-full rounded-xl border border-[#d0c5ad] p-3" dir="ltr" />
              </label>
              <label className="block text-sm font-bold">عناوين فهرس الكتاب: عنوان في كل سطر
                <textarea name="toc_outline" rows={6} required minLength={5} maxLength={12000}
                  defaultValue={review?.toc_outline ?? ""}
                  placeholder="اكتب عناوين فهرس الكتاب الرسمية، لا ملخصًا مولدًا"
                  className="mt-2 w-full rounded-xl border border-[#d0c5ad] p-3" />
              </label>
              <label className="block text-sm font-bold">ملاحظات المراجع (اختياري)
                <textarea name="reviewer_notes" rows={2} maxLength={2000}
                  defaultValue={review?.reviewer_notes ?? ""}
                  className="mt-2 w-full rounded-xl border border-[#d0c5ad] p-3" />
              </label>
              <button type="submit" className="justify-self-start rounded-xl bg-[#174f47] px-5 py-3 font-black text-white">
                حفظ دليل الفهرس للمراجعة
              </button>
            </form>
          </div>
        </details>;
      }) : null}
    </div>
  </section>;
}
