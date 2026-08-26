import Link from "next/link";

import {
  getCurriculumControlCenter,
} from "@/lib/curriculum-packs/control-center";

function semesterLabel(
  value: number | null
) {
  if (value === 1) {
    return "الفصل الأول";
  }

  if (value === 2) {
    return "الفصل الثاني";
  }

  if (value === 3) {
    return "الفصل الثالث";
  }

  return "دون فصل محدد";
}

export default function CurriculumPacksPage() {
  const center =
    getCurriculumControlCenter();

  return (
    <main
      dir="rtl"
      className="px-4 py-7 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl space-y-7">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-[#cdb778] bg-[#123f39] p-7 text-white shadow-xl sm:p-10">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20 dad-arabesque"
          />

          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <span className="inline-flex rounded-full border border-[#f3d18b]/30 bg-white/10 px-4 py-2 text-xs font-black text-[#ffe8b2]">
                مركز تشغيل المناهج العربية
              </span>

              <h1 className="mt-4 font-arabic-display text-3xl font-black sm:text-5xl">
                حزم المناهج
              </h1>

              <p className="mt-4 max-w-4xl font-arabic-reading text-xl leading-9 text-[#e7f1ed]">
                لا نكتب كودًا جديدًا لكل دولة أو صف. كل منهج موثق
                يدخل كحزمة Curriculum Pack بنفس البنية، ثم يستخدمه
                المستورد العام ليظهر داخل ضاديوم.
              </p>
            </div>

            <Link
              href="/admin/curriculum"
              className="rounded-full bg-[#f5cf7a] px-6 py-3 text-sm font-black text-[#123f39]"
            >
              العودة لبوابة المناهج
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            label="الدول العربية"
            value={center.totalCountries}
            note="مسجلة في المحرك"
          />
          <Metric
            label="دول بها محتوى"
            value={center.readyCountries}
            note="حزمة موثقة محليًا"
          />
          <Metric
            label="تحتاج مصدرًا"
            value={
              center.sourceRequiredCountries
            }
            note="لا نختلق محتواها"
          />
          <Metric
            label="الحزم الجاهزة"
            value={center.totalPacks}
            note="صالحة وموثقة"
          />
          <Metric
            label="دروس الحزم"
            value={center.totalLessons}
            note="داخل ملفات الحزم"
          />
        </section>

        <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black text-[#9a7028]">
                خريطة التغطية
              </p>

              <h2 className="mt-1 font-arabic-display text-3xl font-black text-[#123f39]">
                الدول العربية الـ22
              </h2>

              <p className="mt-2 max-w-3xl font-arabic-reading text-lg leading-8 text-[#746a5e]">
                «جاهز» تعني وجود حزمة محلية موثقة فعلًا، وليس مجرد
                اسم دولة في القائمة.
              </p>
            </div>

            {center.invalidPacks > 0 ? (
              <div className="rounded-2xl border border-[#e0b4a7] bg-[#fff0eb] px-4 py-3 text-sm font-black text-[#9a3f2b]">
                حزم تحتاج مراجعة:{" "}
                {center.invalidPacks}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#bdd9ca] bg-[#edf8f1] px-4 py-3 text-sm font-black text-[#176345]">
                كل الحزم الموجودة قابلة للمتابعة
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {center.countries.map(
              (country) => (
                <article
                  key={country.code}
                  className="rounded-[1.4rem] border border-[#e2d4b9] bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black text-[#9b7128]">
                        {country.code}
                      </div>

                      <h3 className="mt-1 text-lg font-black text-[#123f39]">
                        {country.nameAr}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-black ${
                        country.ready
                          ? "bg-[#e3f2e8] text-[#176345]"
                          : "bg-[#f5eddc] text-[#806329]"
                      }`}
                    >
                      {country.ready
                        ? "جاهز"
                        : "مصدر رسمي مطلوب"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <MiniValue
                      label="الحزم"
                      value={country.packs}
                    />
                    <MiniValue
                      label="الدروس"
                      value={country.lessons}
                    />
                  </div>
                </article>
              )
            )}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
            <p className="text-xs font-black text-[#9a7028]">
              الملفات الموجودة الآن
            </p>

            <h2 className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">
              حزم المناهج المحلية
            </h2>

            <div className="mt-5 space-y-3">
              {center.packs.map(
                (pack) => (
                  <article
                    key={pack.fileName}
                    className="rounded-2xl border border-[#e2d4b9] bg-white p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-black text-[#9b7128]">
                          {pack.countryName} •{" "}
                          {pack.academicYear}
                        </div>

                        <h3 className="mt-1 text-lg font-black text-[#123f39]">
                          {pack.curriculumName} •{" "}
                          {pack.gradeName}
                        </h3>

                        <div className="mt-1 text-xs font-bold text-[#756b5f]">
                          {pack.stageName} •{" "}
                          {semesterLabel(
                            pack.semester
                          )}
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-black ${
                          pack.shapeOk &&
                          pack.verified
                            ? "bg-[#e3f2e8] text-[#176345]"
                            : "bg-[#fff0eb] text-[#9a3f2b]"
                        }`}
                      >
                        {pack.shapeOk &&
                        pack.verified
                          ? "موثقة"
                          : "تحتاج مراجعة"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-[#61584d]">
                      <span className="rounded-full bg-[#f6f0e4] px-3 py-2">
                        {pack.unitCount} وحدة
                      </span>
                      <span className="rounded-full bg-[#f6f0e4] px-3 py-2">
                        {pack.lessonCount} درس
                      </span>
                      <span className="rounded-full bg-[#f6f0e4] px-3 py-2">
                        {pack.fileName}
                      </span>
                    </div>

                    {!pack.shapeOk ? (
                      <p className="mt-3 text-xs font-bold text-[#9a3f2b]">
                        مشكلة البنية:{" "}
                        {pack.shapeError}
                      </p>
                    ) : null}
                  </article>
                )
              )}

              {center.packs.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#d7c49d] p-8 text-center font-bold text-[#746a5e]">
                  لا توجد Curriculum Packs بعد.
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[2rem] border border-[#dfcfad] bg-[#fffdf8] p-6 shadow-sm">
              <p className="text-xs font-black text-[#9a7028]">
                طريقة إضافة أي منهج
              </p>

              <h2 className="mt-1 font-arabic-display text-2xl font-black text-[#123f39]">
                مصدر ← حزمة ← تحقق ← استيراد
              </h2>

              <ol className="mt-5 space-y-3 font-arabic-reading text-base leading-8 text-[#665e55]">
                <Step
                  number="1"
                  text="نجمع ترتيب الوحدات والدروس من مصدر منهجي موثوق."
                />
                <Step
                  number="2"
                  text="نكتب شرح ضاديوم والأنشطة والأسئلة الأصلية أو المرخصة."
                />
                <Step
                  number="3"
                  text="ننشئ ملف Curriculum Pack وفق schemaVersion 1."
                />
                <Step
                  number="4"
                  text="نشغّل التحقق وDry Run قبل أي كتابة في قاعدة البيانات."
                />
                <Step
                  number="5"
                  text="بعد الاعتماد فقط نستخدم المستورد العام مع --apply."
                />
              </ol>
            </section>

            <section className="rounded-[2rem] bg-[#123f39] p-6 text-white shadow-sm">
              <div className="text-xs font-black text-[#f5cf7a]">
                القاعدة الثابتة
              </div>

              <p className="mt-3 font-arabic-reading text-lg leading-8 text-[#e4efeb]">
                إضافة دولة أو صف جديد لا تتطلب Feature أو Route أو
                جدولًا جديدًا. المطلوب هو محتوى موثق داخل نفس معيار
                الحزمة فقط.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className="rounded-[1.6rem] border border-[#dfcfad] bg-[#fffdf8] p-5 shadow-sm">
      <div className="text-xs font-black text-[#8b7040]">
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-[#123f39]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-bold text-[#85796a]">
        {note}
      </div>
    </article>
  );
}

function MiniValue({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#f7f0e3] p-2">
      <div className="text-lg font-black text-[#123f39]">
        {value}
      </div>
      <div className="text-[10px] font-black text-[#85796a]">
        {label}
      </div>
    </div>
  );
}

function Step({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#123f39] text-xs font-black text-[#f5cf7a]">
        {number}
      </span>
      <span>{text}</span>
    </li>
  );
}
