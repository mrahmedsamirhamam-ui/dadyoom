import CrossCurricularStudio from "@/components/teacher-studio/CrossCurricularStudio";

export const metadata = {
  title: "استوديو التكامل التربوي | ضاديوم",
  description: "أنشطة عربية تربط الاستدامة والمواطنة المحلية والعالمية والتربية الإسلامية باختيار المعلم.",
};

export default function TeacherStudioPage() {
  return (
    <main dir="rtl" className="min-h-screen bg-[#fbf6ea] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl bg-[#123f39] p-7 text-white">
          <p className="text-sm font-black text-[#f5cf7a]">ضاديوم — مساحة المعلم</p>
          <h1 className="mt-2 text-3xl font-black">استوديو التكامل التربوي</h1>
          <p className="mt-3 max-w-3xl leading-8 text-emerald-50">
            العربية الخضراء والمواطنة المحلية والعالمية والقيم الإسلامية في خدمة
            هدف اللغة العربية، دون زيادة العبء على المعلم.
          </p>
        </section>
        <CrossCurricularStudio />
      </div>
    </main>
  );
}
