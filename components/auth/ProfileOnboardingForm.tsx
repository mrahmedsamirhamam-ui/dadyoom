"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  getArabicCountryOptions,
} from "@/lib/countries";

const roles = [
  {
    value: "child",
    label: "طفل",
    note: "أتعلم من الصغر",
  },
  {
    value: "student",
    label: "طالب",
    note: "أتعلم وأتدرب",
  },
  {
    value: "teacher",
    label: "معلم",
    note: "أدرّس وأتابع طلابي",
  },
  {
    value: "parent",
    label: "ولي أمر",
    note: "أتابع تقدّم أبنائي",
  },
  {
    value: "school",
    label: "مدرسة",
    note: "أدير المعلمين والطلاب",
  },
] as const;

const gradeOptions = [
  [1, "الصف الأول الابتدائي"],
  [2, "الصف الثاني الابتدائي"],
  [3, "الصف الثالث الابتدائي"],
  [4, "الصف الرابع الابتدائي"],
  [5, "الصف الخامس الابتدائي"],
  [6, "الصف السادس الابتدائي"],
  [7, "الصف الأول الإعدادي"],
  [8, "الصف الثاني الإعدادي"],
  [9, "الصف الثالث الإعدادي"],
  [10, "الصف الأول الثانوي"],
  [11, "الصف الثاني الثانوي"],
  [12, "الصف الثالث الثانوي"],
] as const;

const interestOptions = [
  "القراءة",
  "الكتابة",
  "النحو",
  "الإملاء",
  "الشعر والأدب",
  "القصص",
  "المحادثة",
  "الخط العربي",
] as const;

const goalOptions = [
  "التفوق في المنهج",
  "تقوية القراءة والفهم",
  "تحسين الكتابة والإملاء",
  "تقوية النحو",
  "المحادثة والفصحى",
  "تعلّم العربية من الصفر",
] as const;

const styleOptions = [
  ["visual", "أتعلم أكثر بالصور والفيديو"],
  ["practice", "أتعلم أكثر بالتطبيق والأسئلة"],
  ["reading", "أتعلم أكثر بالقراءة والشرح"],
  ["mixed", "أفضل مزيجًا من كل ذلك"],
] as const;

type Role =
  (typeof roles)[number]["value"];

type Props = {
  defaultName: string;
  defaultRole: Role;
  defaultCountry: string;
  countryDetectedBy?:
    | string;
  defaultGrade?: number;
  defaultInterests?: string[];
  defaultLearningGoal?: string;
  defaultLearningStyle?: string;
};

export default function ProfileOnboardingForm({
  defaultName,
  defaultRole,
  defaultCountry,
  countryDetectedBy = "",
  defaultGrade,
  defaultInterests = [],
  defaultLearningGoal = "",
  defaultLearningStyle = "",
}: Props) {
  const router = useRouter();
  const countries =
    useMemo(
      () =>
        getArabicCountryOptions(),
      [],
    );

  const [fullName, setFullName] =
    useState(defaultName);
  const [role, setRole] =
    useState<Role>(defaultRole);
  const [country, setCountry] =
    useState(
      defaultCountry || "BH",
    );
  const [gradeNumber, setGradeNumber] =
    useState(
      defaultGrade
        ? String(defaultGrade)
        : "",
    );
  const [interests, setInterests] =
    useState<string[]>(
      defaultInterests,
    );
  const [learningGoal, setLearningGoal] =
    useState(
      defaultLearningGoal,
    );
  const [
    preferredLearningStyle,
    setPreferredLearningStyle,
  ] = useState(
    defaultLearningStyle,
  );
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState("");

  const studentLike =
    role === "student" ||
    role === "child";

  function toggleInterest(
    value: string,
  ) {
    setInterests((current) =>
      current.includes(value)
        ? current.filter(
            (item) =>
              item !== value,
          )
        : [
            ...current,
            value,
          ].slice(0, 6),
    );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) return;

    if (
      studentLike &&
      !gradeNumber
    ) {
      setError(
        "اختر صفك الدراسي أولًا.",
      );
      return;
    }

    if (
      studentLike &&
      interests.length === 0
    ) {
      setError(
        "اختر شيئًا واحدًا على الأقل من اهتماماتك.",
      );
      return;
    }

    if (
      studentLike &&
      !learningGoal
    ) {
      setError(
        "اختر هدفك الأساسي من التعلّم.",
      );
      return;
    }

    if (
      studentLike &&
      !preferredLearningStyle
    ) {
      setError(
        "اختر الطريقة التي تفضّل أن تتعلّم بها.",
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/auth/complete-profile",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              fullName,
              role,
              country,
              gradeNumber:
                studentLike
                  ? Number(
                      gradeNumber,
                    )
                  : null,
              interests:
                studentLike
                  ? interests
                  : [],
              learningGoal:
                studentLike
                  ? learningGoal
                  : null,
              preferredLearningStyle:
                studentLike
                  ? preferredLearningStyle
                  : null,
            }),
          },
        );

      const raw =
        await response.text();

      let data: {
        error?: string;
        destination?: string;
      } = {};

      if (raw) {
        try {
          data =
            JSON.parse(raw) as
              typeof data;
        } catch {
          data = {
            error:
              "وصل رد غير صالح أثناء حفظ الملف.",
          };
        }
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر إكمال الحساب.",
        );
      }

      router.replace(
        data.destination ||
          "/student",
      );
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "تعذر إكمال الحساب.",
      );
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
      dir="rtl"
    >
      <div>
        <div className="mb-2 text-sm font-black text-[#4d4438]">
          نوع الحساب
        </div>

        <div className="grid grid-cols-2 gap-2">
          {roles.map(
            (item) => (
              <button
                key={item.value}
                type="button"
                onClick={() =>
                  setRole(
                    item.value,
                  )
                }
                className={
                  `rounded-2xl border p-3 text-right transition ${
                    role ===
                    item.value
                      ? "border-[#174f47] bg-[#edf5f1] text-[#174f47]"
                      : "border-[#ddcfb3] bg-white text-[#5f574d] hover:border-[#b99b58]"
                  }`
                }
              >
                <span className="block font-black">
                  {item.label}
                </span>
                <span className="mt-1 block text-[11px] font-semibold opacity-75">
                  {item.note}
                </span>
              </button>
            ),
          )}
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-[#4d4438]">
          الاسم الكامل
        </span>
        <input
          required
          value={fullName}
          onChange={(event) =>
            setFullName(
              event.target.value,
            )
          }
          autoComplete="name"
          className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-[#4d4438]">
          الدولة
        </span>

        <select
          required
          value={country}
          onChange={(event) =>
            setCountry(
              event.target.value,
            )
          }
          className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10"
        >
          {countries.map(
            (item) => (
              <option
                key={item.code}
                value={item.code}
              >
                {item.name}
              </option>
            ),
          )}
        </select>

        {countryDetectedBy ? (
          <p className="mt-2 text-[11px] font-bold leading-5 text-[#7c705f]">
            حدّدنا الدولة تلقائيًا قدر الإمكان من بيانات تسجيل الدخول أو موقع الاتصال العام، ويمكنك تعديلها هنا.
          </p>
        ) : null}
      </label>

      {studentLike ? (
        <>
          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#4d4438]">
              أنت في أي صف؟
            </span>

            <select
              required
              value={gradeNumber}
              onChange={(event) =>
                setGradeNumber(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 font-black outline-none focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10"
            >
              <option value="">
                اختر صفك
              </option>
              {gradeOptions.map(
                ([
                  value,
                  label,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>

          <div>
            <div className="mb-2 text-sm font-black text-[#4d4438]">
              ما الأشياء التي تحبها؟
            </div>

            <div className="flex flex-wrap gap-2">
              {interestOptions.map(
                (interest) => {
                  const selected =
                    interests.includes(
                      interest,
                    );

                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() =>
                        toggleInterest(
                          interest,
                        )
                      }
                      className={
                        `rounded-full border px-4 py-2 text-xs font-black transition ${
                          selected
                            ? "border-[#174f47] bg-[#174f47] text-white"
                            : "border-[#ddcfb3] bg-white text-[#5f574d]"
                        }`
                      }
                    >
                      {interest}
                    </button>
                  );
                },
              )}
            </div>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#4d4438]">
              ما هدفك الأساسي؟
            </span>

            <select
              value={learningGoal}
              onChange={(event) =>
                setLearningGoal(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d]"
            >
              <option value="">
                اختر هدفًا
              </option>
              {goalOptions.map(
                (goal) => (
                  <option
                    key={goal}
                    value={goal}
                  >
                    {goal}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-black text-[#4d4438]">
              كيف تحب أن تتعلم؟
            </span>

            <select
              value={
                preferredLearningStyle
              }
              onChange={(event) =>
                setPreferredLearningStyle(
                  event.target.value,
                )
              }
              className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d]"
            >
              <option value="">
                اختر ما يناسبك
              </option>
              {styleOptions.map(
                ([
                  value,
                  label,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
        </>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <button
        disabled={loading}
        className="w-full rounded-xl bg-[#174f47] px-5 py-3.5 font-black text-white transition hover:bg-[#103f39] disabled:opacity-60"
      >
        {loading
          ? "جارٍ تجهيز حسابك..."
          : studentLike
            ? "جهّز لوحتي حسب صفي"
            : "ابدأ رحلتي في ضاديوم"}
      </button>
    </form>
  );
}
