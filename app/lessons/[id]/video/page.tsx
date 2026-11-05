import LazyLessonVideoPlayer from "@/components/video/LazyLessonVideoPlayer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LessonVideoPageProps = {
  params: Promise<{
    id: string;
  }>;
};

type LessonVideo = {
  video_id: string;
  duration_seconds?: number | null;
  metadata?: Record<string, unknown> | null;
  video_url: string;
  title: string;
  channel_name: string | null;
  channel_url: string | null;
  source_tier:
    | "official_country"
    | "same_country"
    | "cartoon_fallback"
    | "manual";
  source_reason: string | null;
  confidence: number;
  is_official: boolean;
  is_cartoon: boolean;
};

const sourceLabels: Record<
  LessonVideo["source_tier"],
  string
> = {
  official_country: "مصدر رسمي من الدولة",
  same_country: "شرح من نفس الدولة / المنهج",
  cartoon_fallback: "شرح كرتوني تعليمي",
  manual: "فيديو معتمد يدويًا",
};

export default async function LessonVideoPage({
  params,
}: LessonVideoPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: lesson,
    error: lessonError,
  } = await supabase
    .from("lessons")
    .select("id,title,status,content")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (lessonError) {
    throw lessonError;
  }

  if (!lesson) {
    notFound();
  }

  const {
    data: video,
    error: videoError,
  } = await supabase
    .from("lesson_videos")
    .select(
      "video_id,video_url,title,channel_name,channel_url,source_tier,source_reason,confidence,is_official,is_cartoon,duration_seconds,metadata",
    )
    .eq("lesson_id", id)
    .eq("status", "published")
    .maybeSingle();

  if (videoError) {
    console.error(
      "Failed to load lesson video:",
      videoError,
    );
  }

  const lessonVideo =
    (video ?? null) as LessonVideo | null;

  return (
    <main
      dir="rtl"
      className="lesson-arabic-shell min-h-screen px-4 py-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <Link
            href={`/lessons/${id}`}
            className="font-bold text-emerald-700 hover:underline"
          >
            العودة إلى الدرس
          </Link>
        </div>

        <section className="lesson-arabic-card rounded-3xl border border-[#d7bd83] bg-[#fffaf0] p-6 shadow-sm sm:p-8">
          <p className="text-sm font-black text-[#a16f18]">
            فيديو شرح الدرس
          </p>

          <h1 className="mt-2 font-arabic-display text-3xl font-black text-[#173f38] sm:text-4xl">
            {lesson.title}
          </h1>

          <p className="mt-3 leading-8 text-slate-600">
            نفضّل أولًا الفيديو الرسمي التابع لجهة
            التعليم في الدولة، ثم شرحًا من نفس الدولة
            أو المنهج، ثم شرحًا كرتونيًا تعليميًا
            مناسبًا عندما لا يتوفر الخياران السابقان.
          </p>
        </section>

        {lessonVideo ? (
          <>
            <LazyLessonVideoPlayer videoId={lessonVideo.video_id} title={lessonVideo.title} />
            {lessonVideo.duration_seconds && (lessonVideo.duration_seconds < 120 || lessonVideo.duration_seconds > 240)
              ? <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
                مدة الفيديو ليست بين دقيقتين وأربع دقائق؛ يحتاج إلى مراجعة قبل اعتباره مطابقًا لمعيار الفيديو القصير.
              </p> : null}
            <section className="rounded-2xl border border-[#e0e9e2] bg-white p-5">
              <h2 className="text-xl font-bold text-[#193b31]">نص الفيديو وإمكانية الوصول</h2>
              {typeof lessonVideo.metadata?.transcript === "string" &&
                lessonVideo.metadata.transcript.trim() ? (
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">عرض التفريغ النصي للفيديو</summary>
                  <p className="mt-3 whitespace-pre-wrap leading-9">{lessonVideo.metadata.transcript}</p>
                </details>
              ) : (
                <p className="mt-3 text-sm leading-7 text-[#62746a]">
                  لم يتوفر تفريغ موثّق لهذا الفيديو بعد. لا نعرض شرح الدرس على أنه تفريغ للفيديو.
                </p>
              )}
              {lesson.content?.trim() ? (
                <details className="mt-3"><summary className="cursor-pointer font-semibold">اقرأ محتوى الدرس بدل الفيديو</summary>
                  <p className="mt-3 whitespace-pre-wrap leading-9">{lesson.content}</p>
                </details>
              ) : null}
              {typeof lessonVideo.metadata?.interactive_question === "string" &&
                lessonVideo.metadata.interactive_question.trim() ? (
                  <div className="mt-4 rounded-xl bg-[#eef7f0] p-4">
                    <p className="text-sm font-semibold">سؤال بعد المشاهدة</p>
                    <p className="mt-2">{lessonVideo.metadata.interactive_question}</p>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#6b7a70]">السؤال التفاعلي الخاص بهذا الفيديو لم يُعتمد بعد.</p>
                )}
            </section>

            <section className="lesson-arabic-card rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-black text-emerald-800">
                  {
                    sourceLabels[
                      lessonVideo.source_tier
                    ]
                  }
                </span>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                  ثقة الاختيار{" "}
                  {Math.round(
                    Number(
                      lessonVideo.confidence,
                    ) * 100,
                  )}
                  %
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-black text-slate-950">
                {lessonVideo.title}
              </h2>

              {lessonVideo.channel_name ? (
                <p className="mt-2 text-slate-600">
                  القناة:{" "}
                  {lessonVideo.channel_url ? (
                    <Link
                      href={
                        lessonVideo.channel_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-700 hover:underline"
                    >
                      {
                        lessonVideo.channel_name
                      }
                    </Link>
                  ) : (
                    lessonVideo.channel_name
                  )}
                </p>
              ) : null}

              {lessonVideo.source_reason ? (
                <p className="mt-3 leading-7 text-slate-600">
                  {
                    lessonVideo.source_reason
                  }
                </p>
              ) : null}

              <Link
                href={lessonVideo.video_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex rounded-2xl bg-[#173f38] px-5 py-3 font-black text-white"
              >
                فتح الفيديو على YouTube
              </Link>

              <p className="mt-3 text-xs leading-6 text-slate-500">
                إذا منع صاحب الفيديو العرض المضمّن،
                استخدم زر «فتح الفيديو على YouTube».
              </p>
            </section>
          </>
        ) : (
          <section className="lesson-arabic-card rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
            <h2 className="text-2xl font-black text-amber-950">
              فيديو الشرح قيد المراجعة
            </h2>
            <p className="mt-2 leading-7 text-amber-900">
              لم نعتمد فيديو مناسبًا لهذا الدرس بعد.
              سيظل زر الفيديو موجودًا، ولن نعرض فيديو
              ضعيف الصلة بالدرس لمجرد ملء المكان.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}