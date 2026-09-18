"use client";

type Slide = {
  slide?: number;
  title?: string;
  body?: string;
};

type InstructionEntry = {
  kind?: string;
  items?: Slide[];
};

type Props = {
  instructions: unknown;
};

function extractSlides(instructions: unknown): Slide[] {
  if (!Array.isArray(instructions)) return [];

  const entry = instructions.find((item) => {
    if (!item || typeof item !== "object") return false;
    return (item as InstructionEntry).kind === "slides";
  }) as InstructionEntry | undefined;

  if (!entry || !Array.isArray(entry.items)) return [];

  return entry.items.filter((item) =>
    Boolean(
      item &&
      typeof item === "object" &&
      (typeof item.title === "string" ||
        typeof item.body === "string")
    )
  );
}

export default function LessonLearningSlides({
  instructions,
}: Props) {
  const slides = extractSlides(instructions);

  if (slides.length === 0) return null;

  return (
    <section
      aria-labelledby="lesson-slides-title"
      className="overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5 shadow-sm sm:p-7"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-sm font-bold text-amber-700">
            شرح بصري سريع
          </p>
          <h2
            id="lesson-slides-title"
            className="text-2xl font-black text-slate-900 sm:text-3xl"
          >
            شرائح الدرس
          </h2>
          <p className="mt-2 max-w-2xl leading-7 text-slate-600">
            مرّر بين الشرائح بالترتيب، ثم انتقل إلى الشرح والتطبيق.
          </p>
        </div>
        <span className="rounded-full bg-emerald-900 px-4 py-2 text-sm font-bold text-white">
          {slides.length} شرائح
        </span>
      </div>

      <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3">
        {slides.map((slide, index) => (
          <article
            key={`${slide.slide ?? index + 1}-${slide.title ?? "slide"}`}
            className="min-w-[84%] snap-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:min-w-[48%] lg:min-w-[31%]"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-900 text-lg font-black text-white">
                {slide.slide ?? index + 1}
              </span>
              <span className="text-3xl" aria-hidden="true">
                {index % 4 === 0
                  ? "📖"
                  : index % 4 === 1
                    ? "🔊"
                    : index % 4 === 2
                      ? "✍️"
                      : "⭐"}
              </span>
            </div>
            <h3 className="text-xl font-black leading-8 text-slate-900">
              {slide.title || `الشريحة ${index + 1}`}
            </h3>
            {slide.body ? (
              <p className="mt-3 text-lg font-semibold leading-8 text-slate-700">
                {slide.body}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
