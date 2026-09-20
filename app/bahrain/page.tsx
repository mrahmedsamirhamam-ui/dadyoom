"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

type Activity = {
  title: string;
  level: string;
  instructions: string;
};

type Question = {
  question: string;
  answer: string;
};

type Lesson = {
  id: string;
  grade: number;
  term: number;
  title: string;
  explanation?: string;
  objectives: string[];
  activities: Activity[];
  assessment: Question[];
  duration_minutes?: number;
};

type Curriculum = {
  academic_year: string;
  grade_counts: Record<string, number>;
  lessons: Lesson[];
};

export default function BahrainPage() {

  const [data, setData] =
    useState<Curriculum | null>(null);

  const [student, setStudent] =
    useState("");

  const [grade, setGrade] =
    useState(1);

  const [ready, setReady] =
    useState(false);

  const [selected, setSelected] =
    useState<Lesson | null>(null);

  const [completed, setCompleted] =
    useState<string[]>([]);

  useEffect(() => {

    fetch(
      "/data/bahrain/official-bahrain-2026-2027.json"
    )
      .then((r) => {
        if (!r.ok) {
          throw new Error(
            `Curriculum HTTP ${r.status}`
          );
        }

        return r.json();
      })
      .then(setData);

    const q =
      new URLSearchParams(
        window.location.search
      );

    const qGrade =
      Number(
        q.get("grade") || "1"
      );

    // Defer client-only state hydration so the effect synchronizes with
    // browser state without causing a synchronous render cascade.
    queueMicrotask(() => {
      if (q.get("qa") === "1") {
        setStudent("QA Student");
        setReady(true);
      }

      if (
        qGrade >= 1 &&
        qGrade <= 9
      ) {
        setGrade(qGrade);
      }

      try {
        const old =
          JSON.parse(
            localStorage.getItem(
              "dadyoom_bh_completed"
            ) || "[]"
          );

        if (Array.isArray(old)) {
          setCompleted(old);
        }
      } catch {}
    });
  }, []);

  const lessons =
    useMemo(() => {

      if (!data) {
        return [];
      }

      return data.lessons.filter(
        (x) =>
          x.grade === grade
      );

    }, [data, grade]);

  function markComplete(id: string) {

    if (completed.includes(id)) {
      return;
    }

    const next =
      [...completed, id];

    setCompleted(next);

    localStorage.setItem(
      "dadyoom_bh_completed",
      JSON.stringify(next)
    );
  }

  if (!data) {

    return (
      <main
        dir="rtl"
        style={{
          padding: 30,
          maxWidth: 1000,
          margin: "auto"
        }}
      >
        <h1>ضاديوم البحرين</h1>
        <p>جارٍ تحميل المنهج...</p>
      </main>
    );
  }

  if (!ready) {

    return (
      <main
        dir="rtl"
        style={{
          maxWidth: 650,
          margin: "40px auto",
          padding: 25
        }}
      >
        <h1>ضاديوم 🇧🇭</h1>

        <h2>
          اللغة العربية
        </h2>

        <p>
          العام الدراسي
          {" "}
          {data.academic_year}
        </p>

        <input
          aria-label="اسم الطالب"
          placeholder="اسم الطالب"
          value={student}
          onChange={
            (e) =>
              setStudent(
                e.target.value
              )
          }
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 15
          }}
        />

        <select
          aria-label="اختيار الصف"
          value={grade}
          onChange={
            (e) =>
              setGrade(
                Number(
                  e.target.value
                )
              )
          }
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 15
          }}
        >
          {Array.from(
            { length: 9 },
            (_, i) => i + 1
          ).map(
            (g) => (
              <option
                key={g}
                value={g}
              >
                الصف {g}
              </option>
            )
          )}
        </select>

        <button
          onClick={() => {
            if (
              student.trim()
            ) {
              setReady(true);
            }
          }}
        >
          ابدأ
        </button>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={{
        maxWidth: 1100,
        margin: "25px auto",
        padding: 20,
        lineHeight: 1.8
      }}
    >
      <header>
        <h1>
          ضاديوم البحرين 🇧🇭
        </h1>

        <p>
          أهلًا {student}
        </p>

        <p>
          XP: {completed.length * 10}
        </p>

        <select
          aria-label="الصف"
          value={grade}
          onChange={
            (e) => {
              setGrade(
                Number(
                  e.target.value
                )
              );

              setSelected(null);
            }
          }
        >
          {Array.from(
            { length: 9 },
            (_, i) => i + 1
          ).map(
            (g) => (
              <option
                key={g}
                value={g}
              >
                الصف {g}
              </option>
            )
          )}
        </select>
      </header>

      {!selected ? (

        <section>
          <h2>
            دروس الصف {grade}
          </h2>

          <p data-qa="lesson-count">
            عدد الدروس:
            {" "}
            {lessons.length}
          </p>

          {lessons.map(
            (lesson) => (
              <button
                key={lesson.id}
                onClick={
                  () =>
                    setSelected(
                      lesson
                    )
                }
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "right",
                  padding: 15,
                  marginBottom: 8
                }}
              >
                {lesson.title}
              </button>
            )
          )}
        </section>

      ) : (

        <article>

          <button
            onClick={
              () =>
                setSelected(null)
            }
          >
            الرجوع
          </button>

          <h1>
            {selected.title}
          </h1>

          {selected.explanation && (
            <>
              <h2>شرح الدرس</h2>
              <p>
                {selected.explanation}
              </p>
            </>
          )}

          <h2>الأهداف</h2>

          <ul>
            {selected.objectives.map(
              (x,i) => (
                <li key={i}>
                  {x}
                </li>
              )
            )}
          </ul>

          <h2>الأنشطة</h2>

          {selected.activities.map(
            (a,i) => (
              <section key={i}>
                <strong>
                  {a.title}
                  {" — "}
                  {a.level}
                </strong>

                <p>
                  {a.instructions}
                </p>
              </section>
            )
          )}

          <h2>التقييم</h2>

          {selected.assessment.map(
            (q,i) => (
              <details key={i}>
                <summary>
                  {q.question}
                </summary>

                <p>
                  {q.answer}
                </p>
              </details>
            )
          )}

          <button
            onClick={
              () =>
                markComplete(
                  selected.id
                )
            }
          >
            ✅ أكملت الدرس +10 XP
          </button>

        </article>
      )}
    </main>
  );
}
