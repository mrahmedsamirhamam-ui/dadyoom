"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  sendMessageAction,
  submitAssignmentAction,
} from "@/features/classroom/actions";

type Props = {
  studentId: string;
  classes: Array<{
    id: string;
    name: string;
    teacher_id: string;
    academic_year: string | null;
  }>;
  teachers: Array<{ id: string; full_name: string; email: string }>;
  conversations: Array<{ id: string; class_id: string; teacher_id: string }>;
  messages: Array<{
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string;
    created_at: string;
  }>;
  rewards: Array<{
    id: string;
    title: string;
    description: string | null;
    points: number;
    icon: string;
    created_at: string;
  }>;
  assignments: Array<{
    id: string;
    class_id: string;
    title: string;
    instructions: string;
    kind: string;
    due_at: string | null;
    max_points: number;
    created_at: string;
  }>;
  questions: Array<{
    id: string;
    assignment_id: string;
    question_order: number;
    question_type: string;
    prompt: string;
    options: unknown;
    points: number;
  }>;
  submissions: Array<{
    assignment_id: string;
    score: number | null;
    max_score: number | null;
    status: string;
    submitted_at: string | null;
    teacher_feedback: string | null;
  }>;
};

export default function StudentClassroomClient(props: Props) {
  const router = useRouter();
  const [classId, setClassId] = useState(props.classes[0]?.id ?? "");
  const [status, setStatus] = useState("");

  const activeClass =
    props.classes.find((item) => item.id === classId) ?? props.classes[0];

  const teacher = props.teachers.find(
    (item) => item.id === activeClass?.teacher_id,
  );

  const conversation = props.conversations.find(
    (item) => item.class_id === activeClass?.id,
  );

  const activeMessages = conversation
    ? props.messages.filter(
        (item) => item.conversation_id === conversation.id,
      )
    : [];

  const assignments = props.assignments.filter(
    (item) => item.class_id === activeClass?.id,
  );

  const submissionByAssignment = new Map(
    props.submissions.map((item) => [item.assignment_id, item]),
  );

  const bonusPoints = props.rewards.reduce(
    (sum, item) => sum + Number(item.points ?? 0),
    0,
  );

  return (
    <main dir="rtl" className="min-h-screen w-full min-w-0 overflow-x-hidden px-3 py-5 sm:px-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[2rem] bg-[#123f39] p-6 text-white">
          <div className="text-sm font-black text-[#f5cf7a]">فصلي</div>
          <h1 className="mt-2 text-3xl font-black">
            معلمي، جوائزي، وواجباتي
          </h1>
          <div className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 font-black">
            نقاط المعلم والمدرسة: {bonusPoints}
          </div>
        </section>

        <section className="rounded-[2rem] border bg-white p-4">
          <select
            value={activeClass?.id ?? ""}
            onChange={(event) => setClassId(event.target.value)}
            className="w-full rounded-2xl border p-3 font-black"
          >
            {props.classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {status ? (
            <div className="mt-3 rounded-2xl bg-[#fff7e8] p-3 text-sm font-bold">
              {status}
            </div>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <article className="rounded-[2rem] border bg-white p-5">
            <h2 className="text-xl font-black">
               معلمي {teacher?.full_name ?? ""}
            </h2>
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto rounded-2xl bg-[#f7f5ef] p-3">
              {activeMessages.length ? (
                activeMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-2xl px-4 py-3 text-sm ${
                      message.sender_id === props.studentId
                        ? "mr-8 bg-[#123f39] text-white"
                        : "ml-8 bg-white"
                    }`}
                  >
                    {message.body}
                  </div>
                ))
              ) : (
                <p className="text-sm">ابدأ محادثتك مع المعلم.</p>
              )}
            </div>

            {activeClass ? (
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
                <input type="hidden" name="classId" value={activeClass.id} />
                <input
                  type="hidden"
                  name="teacherId"
                  value={activeClass.teacher_id}
                />
                <input
                  type="hidden"
                  name="studentId"
                  value={props.studentId}
                />
                <textarea
                  required
                  name="body"
                  rows={3}
                  className="w-full rounded-2xl border p-3"
                  placeholder="اكتب رسالة لمعلمك..."
                />
                <button className="rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white">
                  إرسال
                </button>
              </form>
            ) : null}
          </article>

          <article className="rounded-[2rem] border bg-white p-5">
            <h2 className="text-xl font-black"> جوائزي</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {props.rewards.length ? (
                props.rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="rounded-2xl border bg-[#fff8e8] p-4"
                  >
                    <div className="text-3xl">{reward.icon}</div>
                    <b className="mt-2 block">{reward.title}</b>
                    <div className="font-black text-[#a16f18]">
                      +{reward.points} نقطة
                    </div>
                    {reward.description ? (
                      <p className="mt-2 text-sm">{reward.description}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm">لم تحصل على جائزة بعد.</p>
              )}
            </div>
          </article>
        </section>

        <article className="rounded-[2rem] border bg-white p-5">
          <h2 className="text-xl font-black"> واجباتي واختباراتي</h2>
          <div className="mt-5 space-y-4">
            {assignments.length ? (
              assignments.map((assignment) => {
                const assignmentQuestions = props.questions
                  .filter((item) => item.assignment_id === assignment.id)
                  .sort((a, b) => a.question_order - b.question_order);

                const submission = submissionByAssignment.get(assignment.id);

                return (
                  <form
                    key={assignment.id}
                    className="rounded-[1.5rem] border bg-[#fffdf8] p-4"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const result = await submitAssignmentAction(
                        new FormData(event.currentTarget),
                      );
                      setStatus(result.message);
                      if (result.ok) router.refresh();
                    }}
                  >
                    <input
                      type="hidden"
                      name="assignmentId"
                      value={assignment.id}
                    />

                    <b className="text-lg">{assignment.title}</b>
                    <p className="mt-2 text-sm">{assignment.instructions}</p>

                    {submission ? (
                      <div className="mt-3 rounded-2xl bg-[#eef8f4] p-3 text-sm font-black">
                        تم التسليم — {submission.score ?? 0}/
                        {submission.max_score ?? assignment.max_points}
                      </div>
                    ) : null}

                    <div className="mt-4 space-y-4">
                      {assignmentQuestions.map((question, index) => (
                        <Question
                          key={question.id}
                          question={question}
                          number={index + 1}
                        />
                      ))}
                    </div>

                    <button className="mt-4 rounded-2xl bg-[#123f39] px-5 py-3 font-black text-white">
                      {submission ? "إعادة التسليم" : "تسليم المهمة"}
                    </button>
                  </form>
                );
              })
            ) : (
              <p className="text-sm">لا توجد مهام منشورة الآن.</p>
            )}
          </div>
        </article>
      </div>
    </main>
  );
}

function Question({
  question,
  number,
}: {
  question: Props["questions"][number];
  number: number;
}) {
  const options = Array.isArray(question.options)
    ? question.options.map((item) => String(item))
    : [];

  const name = `answer:${question.id}`;

  return (
    <fieldset className="rounded-2xl border bg-white p-4">
      <legend className="px-2 font-black">
        {number}. {question.prompt}
      </legend>

      {question.question_type === "multiple_choice" && options.length ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label key={option} className="rounded-xl border p-3">
              <input type="radio" name={name} value={option} required />{" "}
              {option}
            </label>
          ))}
        </div>
      ) : question.question_type === "true_false" ? (
        <div className="mt-3 flex gap-3">
          <label className="rounded-xl border p-3">
            <input type="radio" name={name} value="true" required /> صح
          </label>
          <label className="rounded-xl border p-3">
            <input type="radio" name={name} value="false" required /> خطأ
          </label>
        </div>
      ) : (
        <textarea
          name={name}
          required
          rows={question.question_type === "essay" ? 6 : 3}
          className="mt-3 w-full rounded-xl border p-3"
          placeholder="اكتب إجابتك..."
        />
      )}
    </fieldset>
  );
}
