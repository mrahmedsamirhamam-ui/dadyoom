"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  validateActivity,
} from "@/lib/lesson-ai/activity-validator";

import {
  normalizeActivity,
} from "@/lib/lesson-ai/activity-normalizer";

import {
  getActivityReviewStatus,
} from "@/lib/lesson-ai/activity-review-status";

type Activity = {
  id: string;
  lesson_id: string;
  title: string;
  activity_type: string;
  instructions:
    string | null;
  content:
    Record<
      string,
      unknown
    >;
  activity_order: number;
  points: number;
  is_published: boolean;
  section: string;
  prompt:
    string | null;
  answer:
    Record<
      string,
      unknown
    >;
  is_required: boolean;
};

const lessonId =
  "3ad8950b-2ac2-4060-ae05-312eb1207460";

const activityTypes = [
  "multiple_choice",
  "true_false",
  "fill_blank",
  "matching",
  "writing",
  "listening",
  "speaking",
  "reading",
];

export default function ReviewActivitiesPage() {
  const [
    activities,
    setActivities,
  ] =
    useState<
      Activity[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const loadActivities =
    useCallback(
      async () => {
      try {
          const response =
            await fetch(
              `/api/admin/lessons/review-activities?lessonId=${encodeURIComponent(
                lessonId
              )}`,
              {
                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ??
              "تعذر تحميل الأنشطة."
            );
          }

          setActivities(
            data.activities ??
            []
          );
        }
        catch (error) {
          setMessage(
            error instanceof Error
              ? error.message
              : "حدث خطأ."
          );
        }
        finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            void loadActivities();
          },
          0
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      loadActivities,
    ]
  );

  function updateLocal(
    id: string,
    field:
      keyof Activity,
    value: unknown
  ) {
    setActivities(
      (current) =>
        current.map(
          (activity) =>
            activity.id ===
            id
              ? {
                  ...activity,
                  [field]:
                    value,
                }
              : activity
        )
    );
  }

  function autoFixActivity(
    activity: Activity
  ) {
    console.log(
      "AUTO_FIX_CLICKED:",
      {
        order:
          activity.activity_order,
        title:
          activity.title,
        type:
          activity.activity_type,
        content:
          activity.content,
        answer:
          activity.answer,
      }
    );

    const result =
      normalizeActivity(
        activity
      );

    console.log(
      "AUTO_FIX_RESULT:",
      result
    );

    if (!result.changed) {
      const details =
        result.notes.length > 0
          ? result.notes.join(" ")
          : "لا يوجد تعديل تلقائي متاح.";

      const text =
        `النشاط #${activity.activity_order}: ${details}`;

      setMessage(
        text
      );

      window.alert(
        text
      );

      return;
    }

    setActivities(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            activity.id
              ? {
                  ...item,

                  content:
                    result.content,

                  answer:
                    result.answer,
                }
              : item
        )
    );

    const text =
      result.notes.length > 0
        ? result.notes.join(" ")
        : "تم التصحيح التلقائي محليًا.";

    setMessage(
      text
    );

    window.alert(
      `نجح التصحيح التلقائي للنشاط #${activity.activity_order}.`
    );
  }
  function autoFixAllActivities() {
    let changedCount =
      0;

    const next =
      activities.map(
        (activity) => {
          const result =
            normalizeActivity(
              activity
            );

          if (
            !result.changed
          ) {
            return activity;
          }

          changedCount +=
            1;

          return {
            ...activity,

            content:
              result.content,

            answer:
              result.answer,
          };
        }
      );

    if (
      changedCount === 0
    ) {
      const text =
        "لا توجد أنشطة إضافية قابلة للتصحيح التلقائي.";

      setMessage(
        text
      );

      window.alert(
        text
      );

      return;
    }

    setActivities(
      next
    );

    const text =
      `تم التصحيح التلقائي لـ ${changedCount} نشاط/أنشطة.`;

    setMessage(
      text
    );

    window.alert(
      text
    );
  }

  async function saveActivity(
    activity: Activity,
    publish = false
  ) {
    setMessage(
      publish
        ? "جاري نشر النشاط..."
        : "جاري حفظ التعديلات..."
    );

    try {
      const response =
        await fetch(
          "/api/admin/lessons/review-activities",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  activity.id,

                title:
                  activity.title,

                activityType:
                  activity
                    .activity_type,

                section:
                  activity.section,

                instructions:
                  activity.instructions,

                prompt:
                  activity.prompt,

                content:
                  activity.content,

                answer:
                  activity.answer,

                points:
                  activity.points,

                isRequired:
                  activity
                    .is_required,

                isPublished:
                  activity
                    .is_published,

                publish,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ??
          "تعذر حفظ النشاط."
        );
      }

      if (publish) {
        setActivities(
          (current) =>
            current.filter(
              (item) =>
                item.id !==
                activity.id
            )
        );

        setMessage(
          "تم نشر النشاط بنجاح."
        );
      }
      else {
        setActivities(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                activity.id
                  ? data.activity
                  : item
            )
        );

        setMessage(
          "تم حفظ التعديلات."
        );
      }
    }
    catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ."
      );
    }
  }

  async function deleteActivity(
    activity: Activity
  ) {
    const confirmed =
      window.confirm(
        `هل تريد حذف النشاط:\n${activity.title}؟`
      );

    if (!confirmed) {
      return;
    }

    setMessage(
      "جاري حذف النشاط..."
    );

    try {
      const response =
        await fetch(
          "/api/admin/lessons/review-activities",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  activity.id,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ??
          "تعذر حذف النشاط."
        );
      }

      setActivities(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              activity.id
          )
      );

      setMessage(
        "تم حذف النشاط."
      );
    }
    catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ."
      );
    }
  }

  if (loading) {
    return (
      <main
        dir="rtl"
        className="mx-auto max-w-6xl p-6"
      >
        جارٍ تحميل الأنشطة...
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-6xl space-y-6 p-6"
    >
      <header
        className="space-y-2"
      >
        <h1
          className="text-3xl font-bold"
        >
          مراجعة أنشطة الذكاء الاصطناعي
        </h1>

        <p
          className="text-sm opacity-70"
        >
          الأنشطة غير المنشورة:
          {" "}
          {activities.length}
        </p>

        <div
          className="flex flex-wrap gap-3"
        >
          <button
            type="button"
            className="rounded-lg border px-4 py-2 font-bold"
            onClick={
              autoFixAllActivities
            }
          >
            ✨ تصحيح كل الأنشطة القابلة للتصحيح
          </button>
        </div>

        {message && (
          <div
            className="rounded-lg border p-3"
          >
            {message}
          </div>
        )}
      </header>

      {activities.length ===
      0 ? (
        <div
          className="rounded-xl border p-8 text-center"
        >
          لا توجد أنشطة معلقة للمراجعة.
        </div>
      ) : (
        <div
          className="space-y-6"
        >
          {activities.map(
            (activity) => {
              const validation =
                validateActivity(
                  activity
                );

              const reviewStatus =
                getActivityReviewStatus(
                  activity
                );

              const sourcePage =
                typeof activity
                  .content
                  ?.source_page ===
                  "number"
                  ? activity
                      .content
                      .source_page
                  : "";

              return (
                <article
                  key={
                    activity.id
                  }
                  className="space-y-4 rounded-2xl border p-5"
                >
                  <div
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div
                        className="font-bold"
                      >
                        النشاط #
                        {
                          activity
                            .activity_order
                        }
                      </div>

                      <div
                        className="text-sm opacity-70"
                      >
                        صفحة المصدر:
                        {" "}
                        {sourcePage ||
                          "غير محددة"}
                      </div>
                    </div>

                    <div
                      className="flex flex-wrap items-center gap-2"
                    >
                      <div
                        className="text-sm"
                      >
                        {
                          activity
                            .activity_type
                        }
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-bold ${
                          validation.validForPublish
                            ? "bg-green-50 text-green-700"
                            : validation.issues.some(
                                (issue) =>
                                  issue.level ===
                                  "error"
                              )
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {validation.validForPublish
                          ? "جاهز للنشر"
                          : validation.issues.some(
                              (issue) =>
                                issue.level ===
                                "error"
                            )
                            ? "غير صالح للنشر"
                            : "يحتاج مراجعة"}
                      </span>

                      <span
                        className="rounded-full border px-3 py-1 text-sm"
                      >
                        الجودة:
                        {" "}
                        {validation.score}%
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-bold ${
                          reviewStatus.status ===
                          "READY"
                            ? "bg-green-50 text-green-700"
                            : reviewStatus.status ===
                              "READING_OK"
                              ? "bg-blue-50 text-blue-700"
                              : reviewStatus.status ===
                                "NEEDS_IMAGES"
                                ? "bg-purple-50 text-purple-700"
                                : reviewStatus.status ===
                                  "NEEDS_ANSWER_REVIEW"
                                  ? "bg-yellow-50 text-yellow-700"
                                  : reviewStatus.status ===
                                    "NEEDS_SOURCE_REBUILD"
                                    ? "bg-red-50 text-red-700"
                                    : "bg-slate-50 text-slate-700"
                        }`}
                      >
                        {reviewStatus.label}
                      </span>
                    </div>
                  </div>

                  <div
                    className="sticky top-2 z-30 flex flex-wrap gap-3 rounded-xl border bg-white/95 p-3 shadow-sm backdrop-blur"
                  >
                    <button
                      type="button"
                      className="rounded-lg border px-4 py-2 font-bold"
                      onClick={
                        () => {
                          autoFixActivity(
                            activity
                          );
                        }
                      }
                    >
                      ✨ تصحيح تلقائي
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border px-4 py-2"
                      onClick={
                        () =>
                          void saveActivity(
                            activity,
                            false
                          )
                      }
                    >
                      💾 حفظ التعديلات
                    </button>

                    <button
                      type="button"
                      disabled={
                        !validation
                          .validForPublish
                      }
                      className={`rounded-lg border px-4 py-2 font-bold ${
                        validation
                          .validForPublish
                          ? ""
                          : "cursor-not-allowed opacity-40"
                      }`}
                      onClick={
                        () =>
                          void saveActivity(
                            activity,
                            true
                          )
                      }
                    >
                      {validation
                        .validForPublish
                        ? "🚀 نشر النشاط"
                        : "🔒 النشر متوقف حتى التصحيح"}
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border px-4 py-2"
                      onClick={
                        () =>
                          void deleteActivity(
                            activity
                          )
                      }
                    >
                      🗑 حذف
                    </button>
                  </div>

                  <div
                    className="rounded-xl border p-4"
                  >
                    <div
                      className="font-bold"
                    >
                      حالة المراجعة
                    </div>

                    <div
                      className="mt-1 text-sm opacity-80"
                    >
                      {reviewStatus.reason}
                    </div>
                  </div>

                  {validation.issues.length >
                  0 && (
                    <div
                      className="space-y-2 rounded-xl border p-4"
                    >
                      <div
                        className="font-bold"
                      >
                        فحص جودة النشاط
                      </div>

                      {validation.issues.map(
                        (
                          issue,
                          index
                        ) => (
                          <div
                            key={`${issue.code}-${index}`}
                            className={
                              issue.level ===
                              "error"
                                ? "text-red-700"
                                : "text-yellow-700"
                            }
                          >
                            {issue.level ===
                            "error"
                              ? "⛔"
                              : "⚠️"}
                            {" "}
                            {issue.message}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <label
                    className="block space-y-1"
                  >
                    <span>
                      العنوان
                    </span>

                    <input
                      className="w-full rounded-lg border p-2"
                      value={
                        activity.title
                      }
                      onChange={
                        (event) =>
                          updateLocal(
                            activity.id,
                            "title",
                            event.target
                              .value
                          )
                      }
                    />
                  </label>

                  <div
                    className="grid gap-4 md:grid-cols-2"
                  >
                    <label
                      className="block space-y-1"
                    >
                      <span>
                        النوع
                      </span>

                      <select
                        className="w-full rounded-lg border p-2"
                        value={
                          activity
                            .activity_type
                        }
                        onChange={
                          (event) =>
                            updateLocal(
                              activity.id,
                              "activity_type",
                              event.target
                                .value
                            )
                        }
                      >
                        {activityTypes.map(
                          (
                            type
                          ) => (
                            <option
                              key={
                                type
                              }
                              value={
                                type
                              }
                            >
                              {
                                type
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label
                      className="block space-y-1"
                    >
                      <span>
                        القسم
                      </span>

                      <input
                        className="w-full rounded-lg border p-2"
                        value={
                          activity.section
                        }
                        onChange={
                          (event) =>
                            updateLocal(
                              activity.id,
                              "section",
                              event.target
                                .value
                            )
                        }
                      />
                    </label>
                  </div>

                  <label
                    className="block space-y-1"
                  >
                    <span>
                      التعليمات
                    </span>

                    <textarea
                      className="min-h-24 w-full rounded-lg border p-2"
                      value={
                        activity.instructions ??
                        ""
                      }
                      onChange={
                        (event) =>
                          updateLocal(
                            activity.id,
                            "instructions",
                            event.target
                              .value
                          )
                      }
                    />
                  </label>

                  <label
                    className="block space-y-1"
                  >
                    <span>
                      النص الصوتي / Prompt
                    </span>

                    <textarea
                      className="min-h-20 w-full rounded-lg border p-2"
                      value={
                        activity.prompt ??
                        ""
                      }
                      onChange={
                        (event) =>
                          updateLocal(
                            activity.id,
                            "prompt",
                            event.target
                              .value
                          )
                      }
                    />
                  </label>

                  <label
                    className="block space-y-1"
                  >
                    <span>
                      Content
                    </span>

                    <textarea
                      className="min-h-44 w-full rounded-lg border p-2 font-mono text-sm"
                      value={
                        JSON.stringify(
                          activity.content,
                          null,
                          2
                        )
                      }
                      onChange={
                        (event) => {
                          try {
                            const value =
                              JSON.parse(
                                event.target
                                  .value
                              );

                            updateLocal(
                              activity.id,
                              "content",
                              value
                            );
                          }
                          catch {
                            // نترك آخر JSON صالح
                          }
                        }
                      }
                    />
                  </label>

                  <label
                    className="block space-y-1"
                  >
                    <span>
                      Answer
                    </span>

                    <textarea
                      className="min-h-32 w-full rounded-lg border p-2 font-mono text-sm"
                      value={
                        JSON.stringify(
                          activity.answer,
                          null,
                          2
                        )
                      }
                      onChange={
                        (event) => {
                          try {
                            const value =
                              JSON.parse(
                                event.target
                                  .value
                              );

                            updateLocal(
                              activity.id,
                              "answer",
                              value
                            );
                          }
                          catch {
                            // نترك آخر JSON صالح
                          }
                        }
                      }
                    />
                  </label>

                  <div
                    className="flex flex-wrap gap-3"
                  >
                    <button
                      type="button"
                      className="rounded-lg border px-4 py-2"
                      onClick={
                        () =>
                          autoFixActivity(
                            activity
                          )
                      }
                    >
                      تصحيح تلقائي
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border px-4 py-2"
                      onClick={
                        () =>
                          void saveActivity(
                            activity,
                            false
                          )
                      }
                    >
                      حفظ التعديلات
                    </button>

                    <button
                      type="button"
                      disabled={
                        !validation
                          .validForPublish
                      }
                      className={`rounded-lg border px-4 py-2 font-bold ${
                        validation
                          .validForPublish
                          ? ""
                          : "cursor-not-allowed opacity-40"
                      }`}
                      onClick={
                        () =>
                          void saveActivity(
                            activity,
                            true
                          )
                      }
                    >
                      {validation
                        .validForPublish
                        ? "نشر النشاط"
                        : "النشر متوقف حتى التصحيح"}
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border px-4 py-2"
                      onClick={
                        () =>
                          void deleteActivity(
                            activity
                          )
                      }
                    >
                      حذف
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}
    </main>
  );
}
