type Props = {
  content: string | null | undefined;
};

type LessonBlock = {
  title: string | null;
  lines: string[];
  tone: "intro" | "section" | "remember";
};

function parseLessonContent(content: string): LessonBlock[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: LessonBlock[] = [];
  let current: LessonBlock = {
    title: null,
    lines: [],
    tone: "intro",
  };

  const pushCurrent = () => {
    if (current.title || current.lines.length > 0) {
      blocks.push(current);
    }
  };

  for (const line of lines) {
    const numberedHeading = line.match(/^(\d+)\)\s*(.+)$/u);

    if (line === "تمهيد") {
      pushCurrent();
      current = { title: "تمهيد", lines: [], tone: "intro" };
      continue;
    }

    if (numberedHeading) {
      pushCurrent();
      current = {
        title: `${numberedHeading[1]}) ${numberedHeading[2]}`,
        lines: [],
        tone: "section",
      };
      continue;
    }

    if (/^تذكّر\s*:/u.test(line)) {
      pushCurrent();
      current = {
        title: "تذكّر",
        lines: [line.replace(/^تذكّر\s*:\s*/u, "")],
        tone: "remember",
      };
      continue;
    }

    current.lines.push(line);
  }

  pushCurrent();
  return blocks;
}

function lineClass(line: string) {
  if (line.startsWith("- ") || line.startsWith("• ")) {
    return "rounded-2xl bg-slate-50 px-4 py-3";
  }

  if (/[+=]/u.test(line)) {
    return "rounded-2xl bg-amber-50 px-4 py-3 font-bold";
  }

  return "";
}

export default function StructuredLessonText({
  content,
}: Props) {
  if (!content?.trim()) return null;

  const blocks = parseLessonContent(content);

  return (
    <section
      aria-labelledby="lesson-content-title"
      className="rounded-3xl bg-white p-5 shadow-sm sm:p-7"
    >
      <div className="mb-6 flex items-center gap-3">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-900 text-2xl text-white"
          aria-hidden="true"
        >
          📚
        </span>

        <div>
          <p className="text-sm font-bold text-amber-700">
            شرح الدرس
          </p>
          <h2
            id="lesson-content-title"
            className="text-2xl font-black text-slate-900 sm:text-3xl"
          >
            نتعلم خطوة بخطوة
          </h2>
        </div>
      </div>

      <div className="grid gap-5">
        {blocks.map((block, index) => {
          const isRemember = block.tone === "remember";

          return (
            <article
              key={`${block.title ?? "intro"}-${index}`}
              className={[
                "rounded-3xl border p-5 sm:p-6",
                isRemember
                  ? "border-amber-300 bg-amber-50"
                  : block.tone === "intro"
                    ? "border-emerald-200 bg-emerald-50/60"
                    : "border-slate-200 bg-white",
              ].join(" ")}
            >
              {block.title ? (
                <h3 className="mb-4 text-xl font-black text-emerald-950 sm:text-2xl">
                  {block.title}
                </h3>
              ) : null}

              <div className="space-y-3 text-lg leading-9 text-slate-800">
                {block.lines.map((line, lineIndex) => (
                  <p
                    key={`${lineIndex}-${line}`}
                    className={lineClass(line)}
                  >
                    {line.startsWith("- ")
                      ? `• ${line.slice(2)}`
                      : line}
                  </p>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
