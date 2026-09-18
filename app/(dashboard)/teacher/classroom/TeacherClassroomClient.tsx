"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  awardStudentAction,
  createAssignmentAction,
  sendMessageAction,
} from "@/features/classroom/actions";

type Props = {
  teacherId: string;
  classes: Array<{ id: string; name: string; academic_year: string | null }>;
  students: Array<{ classId: string; id: string; name: string }>;
  lessons: Array<{ id: string; title: string }>;
  conversations: Array<{ id: string; class_id: string; student_id: string }>;
  messages: Array<{
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    created_at: string;
  }>;
  assignments: Array<{
    id: string;
    class_id: string;
    title: string;
    kind: string;
    target_mode: string;
    status: string;
    due_at: string | null;
    created_at: string;
  }>;
  rewards: Array<{
    id: string;
    student_id: string;
    title: string;
    points: number;
    icon: string;
    created_at: string;
  }>;
};

type GeneratedQuestion = {
  type: string;
  prompt: string;
  options: string[];
  correctAnswer: string | boolean | null;
  explanation: string;
  points: number;
};

export default function TeacherClassroomClient(props: Props) {
  const router = useRouter();

  const [classId, setClassId] = useState(props.classes[0]?.id ?? "");
  const classStudents = props.students.filter((item) => item.classId === classId);

  const [studentId, setStudentId] = useState("");
  const selectedStudentId = classStudents.some((item) => item.id === studentId)
    ? studentId
    : classStudents[0]?.id ?? "";

  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("homework");
  const [lessonId, setLessonId] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);

  const conversation = props.conversations.find(
    (item) =>
      item.class_id === classId && item.student_id === selectedStudentId,
  );

  const activeMessages = conversation
    ? props.messages
        .filter((item) => item.conversation_id === conversation.id)
        .slice()
        .reverse()
    : [];

  async function aiGenerate() {
    setAiBusy(true);
    setStatus("ضاد يصنع المهمة...");

    try {
      const response = await fetch("/api/teacher/assignment-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          kind,
          lessonId: lessonId || undefined,
          questionCount: 5,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        instructions?: string;
        questions?: GeneratedQuestion[];
      };

      if (!response.ok) throw new Error(payload.error ?? "تعذر التوليد.");

      setInstructions(payload.instructions ?? "");
      setQuestions(payload.questions ?? []);
      setStatus(`تم إنشاء ${payload.questions?.length ?? 0} أسئلة.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "تعذر التوليد.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen w-full min-w-0 overflow-x-hidden px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <section className="rounded-[2rem] bg-[#123f39] p-6 text-white">
          <div className="text-sm font-black text-[#f5cf7a]">مساحة المعلم</div>
          <h1 className="mt-2 text-3xl font-black">الفصل الذكي</h1>
          <p className="mt-2 leading-8 text-[#e6f1ed]">
            محادثة، جوائز ونقاط، وواجبات واختبارات بالذكاء الاصطناعي.
          </p>
        </section>

        <section className="grid gap-3 rounded-[2rem] border bg-white p-4 sm:grid-cols-2">
          <Select
            label="الفصل"
            value={classId}
            onChange={(v) => {
              setClassId(v);
              setStudentId("");
            }}
            options={props.classes.map((item) => [item.id, item.name])}
          />
          <Select
            label="الطالب"
            value={selectedStudentId}
            onChange={setStudentId}
            options={classStudents.map((item) => [item.id, item.name])}
          />
          {status ? (
            <div className="sm:col-span-2 rounded-2xl bg-[#fff7e8] p-3 text-sm font-bold">
              {status}
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="rounded-[2rem] border bg-white p-5">
            <h2 className="text-xl font-black"> محادثة الطالب</h2>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-[#f7f5ef] p-3">
              {activeMessages.length ? (
                activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      message.sender_id === props.teacherId
                        ? "mr-8 bg-[#123f39] text-white"
                        : "ml-8 bg-white"
                    }`}
                  >
                    {message.body}
                  </div>
                ))
              ) : (
                <p className="text-sm">لا توجد رسائل بعد.</p>
              )}
            </div>

            <form
              className="mt-4 space-y-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await sendMessageAction(
                  new FormData(event.currentTarget),
                );
                setStatus(result.message);
                if (result.ok) {
                  event.currentTarget.reset();
                  router.refresh();
                }
              }}
            >
              <input type="hidden" name="classId" value={classId} />
              <input type="hidden" name="teacherId" value={props.teacherId} />
              <input
                type="hidden"
                name="studentId"
                value={selectedStudentId}
              />
              <textarea
                required
                name="body"
                rows={3}
                className="w-full rounded-2xl border p-3"
                placeholder="اكتب رسالة..."
              />
              <button className="rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white">
                إرسال
              </button>
            </form>
          </article>

          <article className="rounded-[2rem] border bg-white p-5">
            <h2 className="text-xl font-black"> جائزة ونقاط</h2>
            <form
              className="mt-4 grid gap-3 sm:grid-cols-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await awardStudentAction(
                  new FormData(event.currentTarget),
                );
                setStatus(result.message);
                if (result.ok) router.refresh();
              }}
            >
              <input type="hidden" name="classId" value={classId} />
              <input
                type="hidden"
                name="studentId"
                value={selectedStudentId}
              />
              <input
                required
                name="title"
                className="rounded-2xl border p-3"
                placeholder="اسم الجائزة"
              />
              <input
                required
                name="points"
                type="number"
                defaultValue="10"
                className="rounded-2xl border p-3"
              />
              <input
                name="icon"
                defaultValue=""
                className="rounded-2xl border p-3"
              />
              <input
                name="description"
                placeholder="سبب الجائزة"
                className="rounded-2xl border p-3"
              />
              <button className="sm:col-span-2 rounded-2xl bg-[#b47c1d] px-5 py-3 font-black text-white">
                منح الجائزة
              </button>
            </form>
          </article>
        </section>

        <article className="rounded-[2rem] border bg-white p-5">
          <h2 className="text-xl font-black"> واجب أو اختبار</h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-2xl border p-3"
              placeholder="عنوان المهمة"
            />
            <Select
              label="النوع"
              value={kind}
              onChange={setKind}
              options={[
                ["homework", "واجب"],
                ["quiz", "اختبار"],
                ["practice", "تدريب"],
              ]}
            />
            <Select
              label="الدرس"
              value={lessonId}
              onChange={setLessonId}
              options={[
                ["", "بدون درس محدد"],
                ...props.lessons.map((item) => [item.id, item.title]),
              ]}
            />
            <button
              type="button"
              onClick={aiGenerate}
              disabled={aiBusy}
              className="rounded-2xl bg-[#174f47] px-4 py-3 font-black text-white disabled:opacity-50"
            >
              {aiBusy ? "جارٍ التوليد..." : " اصنعه بالـ AI"}
            </button>
          </div>

          {questions.length ? (
            <div className="mt-4 rounded-2xl bg-[#eef8f4] p-4">
              <p className="font-black">{instructions}</p>
              <ol className="mt-3 list-decimal space-y-2 pr-5">
                {questions.map((question, index) => (
                  <li key={`${question.prompt}-${index}`}>
                    {question.prompt}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <form
            className="mt-5 grid gap-3 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);

              formData.set("title", title);
              formData.set("kind", kind);
              formData.set("lessonId", lessonId);
              formData.set("instructions", instructions);
              formData.set("questionsJson", JSON.stringify(questions));
              formData.set("aiGenerated", String(questions.length > 0));

              const result = await createAssignmentAction(formData);
              setStatus(result.message);
              if (result.ok) router.refresh();
            }}
          >
            <input type="hidden" name="classId" value={classId} />
            <Select
              label="التوجيه"
              name="studentId"
              value=""
              options={[
                ["", "كل الفصل"],
                ...classStudents.map((item) => [
                  item.id,
                  `طالب محدد: ${item.name}`,
                ]),
              ]}
            />
            <input
              name="dueAt"
              type="datetime-local"
              className="rounded-2xl border p-3"
            />
            <textarea
              rows={3}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              className="sm:col-span-2 rounded-2xl border p-3"
              placeholder="تعليمات المهمة"
            />
            <button className="sm:col-span-2 rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white">
              نشر المهمة
            </button>
          </form>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {props.assignments.map((item) => (
              <div key={item.id} className="rounded-2xl border p-4">
                <b>{item.title}</b>
                <div className="mt-2 text-xs">
                  {item.kind} •{" "}
                  {item.target_mode === "class" ? "الفصل" : "طالب محدد"} •{" "}
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  name,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  options: string[][];
  name?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-black">{label}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full min-w-0 rounded-2xl border bg-white p-3 font-bold"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option
            key={optionValue || `${label}-all`}
            value={optionValue}
          >
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
