"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { awardStudentAction } from "@/features/classroom/actions";

export default function SchoolRewardsClient({
  school,
  classes,
  students,
}: {
  school: { id: string; name: string };
  classes: Array<{ id: string; name: string }>;
  students: Array<{ classId: string; id: string; name: string }>;
}) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [status, setStatus] = useState("");

  const classStudents = students.filter((item) => item.classId === classId);

  return (
    <main dir="rtl" className="min-h-screen px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[2rem] bg-[#123f39] p-6 text-white">
          <div className="text-sm font-black text-[#f5cf7a]">{school.name}</div>
          <h1 className="mt-2 text-3xl font-black">جوائز المدرسة</h1>
        </section>

        <form
          className="grid gap-3 rounded-[2rem] border bg-white p-5 sm:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const result = await awardStudentAction(
              new FormData(event.currentTarget),
            );
            setStatus(result.message);
            if (result.ok) router.refresh();
          }}
        >
          <input type="hidden" name="schoolId" value={school.id} />

          <label>
            <span className="mb-1 block text-xs font-black">الفصل</span>
            <select
              name="classId"
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="w-full rounded-2xl border p-3"
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-black">الطالب</span>
            <select
              name="studentId"
              required
              className="w-full rounded-2xl border p-3"
            >
              {classStudents.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <input
            name="title"
            required
            placeholder="اسم الجائزة"
            className="rounded-2xl border p-3"
          />
          <input
            name="points"
            type="number"
            required
            defaultValue="20"
            className="rounded-2xl border p-3"
          />
          <input
            name="icon"
            defaultValue=""
            className="rounded-2xl border p-3"
          />
          <input
            name="description"
            placeholder="سبب التكريم"
            className="rounded-2xl border p-3"
          />

          <button className="sm:col-span-2 rounded-2xl bg-[#b47c1d] px-5 py-3 font-black text-white">
            منح الجائزة
          </button>

          {status ? (
            <div className="sm:col-span-2 rounded-2xl bg-[#fff7e8] p-3 text-sm font-bold">
              {status}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}
