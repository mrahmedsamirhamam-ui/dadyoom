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
import { useSiteLanguage } from "@/components/i18n/LanguageProvider";
import { maxGradeForCountry, thirteenthGradeArabicLabel } from "@/lib/student/country-grade-limits";

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
  [13, "السنة السابعة الثانوية (موريتانيا)"],
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

const roleEnglish: Record<string,string> = { child:"Child", student:"Student", teacher:"Teacher", parent:"Parent", school:"School" };
const noteEnglish: Record<string,string> = { child:"Early learning", student:"Learn and practise", teacher:"Teach and track students", parent:"Follow my children's progress", school:"Manage school learning" };
const interestEnglish: Record<string,string> = { "القراءة":"Reading", "الكتابة":"Writing", "النحو":"Grammar", "الإملاء":"Spelling", "الشعر والأدب":"Poetry and literature", "القصص":"Stories", "المحادثة":"Conversation", "الخط العربي":"Arabic calligraphy" };
const goalEnglish: Record<string,string> = { "التفوق في المنهج":"School achievement", "تقوية القراءة والفهم":"Reading and comprehension", "تحسين الكتابة والإملاء":"Writing and spelling", "تقوية النحو":"Grammar", "المحادثة والفصحى":"Conversation and formal Arabic", "تعلّم العربية من الصفر":"Arabic for beginners" };
const styleEnglish: Record<string,string> = { visual:"Visual learning", practice:"Practice and quizzes", reading:"Reading and explanations", mixed:"A combination of methods" };

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
  const { language } = useSiteLanguage();
  const tr = (ar: string, en: string) => language === "en" ? en : ar;
  const englishCountries = new Intl.DisplayNames(["en"], { type: "region" });
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
      dir={language === "en" ? "ltr" : "rtl"}
    >
      <div>
        <div className="mb-2 text-sm font-black text-[#4d4438]">
          {tr("نوع الحساب", "Account type")}
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
                  {language === "en" ? roleEnglish[item.value] : item.label}
                </span>
                <span className="mt-1 block text-[11px] font-semibold opacity-75">
                  {language === "en" ? noteEnglish[item.value] : item.note}
                </span>
              </button>
            ),
          )}
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-black text-[#4d4438]">
          {tr("الاسم الكامل", "Full name")}
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
          {tr("الدولة", "Country")}
        </span>

        <select
          required
          value={country}
          onChange={(event) => {
            const nextCountry = event.target.value;
            setCountry(nextCountry);
            if (Number(gradeNumber) > maxGradeForCountry(nextCountry)) setGradeNumber("");
          }}
          className="w-full rounded-xl border border-[#d8cbb3] bg-white px-4 py-3 outline-none focus:border-[#32776d] focus:ring-4 focus:ring-[#32776d]/10"
        >
          {countries.map(
            (item) => (
              <option
                key={item.code}
                value={item.code}
              >
                {language === "en" ? englishCountries.of(item.code) ?? item.name : item.name}
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
              {tr("أنت في أي صف؟", "Which grade are you in?")}
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
                {tr("اختر صفك", "Choose your grade")}
              </option>
              {gradeOptions.filter(([value]) => value <= maxGradeForCountry(country)).map(
                ([
                  value,
                  label,
                ]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {language === "en" ? `Grade ${value}` : value === 13 ? thirteenthGradeArabicLabel(country) : label}
                  </option>
                ),
              )}
            </select>
          </label>

          <div>
            <div className="mb-2 text-sm font-black text-[#4d4438]">
              {tr("ما الأشياء التي تحبها؟", "What are your interests?")}
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
                      key={language === "en" ? interestEnglish[interest] ?? interest : interest}
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
              {tr("ما هدفك الأساسي؟", "What is your learning goal?")}
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
                {tr("اختر هدفًا", "Choose a goal")}
              </option>
              {goalOptions.map(
                (goal) => (
                  <option
                    key={language === "en" ? goalEnglish[goal] ?? goal : goal}
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
              {tr("كيف تحب أن تتعلم؟", "How do you prefer to learn?")}
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
                {tr("اختر ما يناسبك", "Choose a learning style")}
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
                    {language === "en" ? styleEnglish[value] ?? label : label}
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
          ? tr("جارٍ تجهيز حسابك...", "Setting up your account…")
          : studentLike
            ? tr("جهّز لوحتي حسب صفي", "Set up my dashboard")
            : tr("ابدأ رحلتي في ضاديوم", "Start my Dadyoom journey")}
      </button>
    </form>
  );
}
