import Link from "next/link";
import type { StudentNextStep } from "@/features/learning-journey/student-next-step";

export default function StudentNextStepCard({ step }: { step: StudentNextStep }) {
  const teacherAssigned = step.kind === "teacher";

  return (
    <section
      dir="rtl"
      aria-labelledby="student-next-step-title"
      className="mt-6 rounded-3xl border border-[#dbc998] bg-[#fffdf5] p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-sm font-black text-[#8c671d]">
            خطوتي التالية {teacherAssigned ? "· واجب المعلم أولًا" : "· مساري التعليمي"}
          </p>
          <h2 id="student-next-step-title" className="mt-2 text-2xl font-black text-[#123f39]">
            {step.title}
          </h2>
          <p className="mt-2 text-sm leading-7 text-[#575d57]">{step.description}</p>
          {step.dueAt ? (
            <p className="mt-2 text-sm font-bold text-[#7a5b25]">
              موعد التسليم: {new Intl.DateTimeFormat("ar-BH", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "Asia/Bahrain",
              }).format(new Date(step.dueAt))}
            </p>
          ) : null}
        </div>
        <Link
          href={step.href}
          className="inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-xl bg-[#174f47] px-6 py-3 text-center font-black text-white hover:bg-[#103f39] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#174f47] sm:w-auto"
        >
          {step.action}
        </Link>
      </div>
    </section>
  );
}
