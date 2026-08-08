"use client";

import { useState } from "react";
import type { LessonVocabularyItem } from "../queries/getLessonVocabulary";
import {
  addVocabulary,
  deleteVocabulary,
  updateVocabulary,
} from "../actions/manageVocabulary";

type Props = {
  lessonId: string;
  vocabulary: LessonVocabularyItem[];
};

export default function VocabularyManager({
  lessonId,
  vocabulary,
}: Props) {
  const [showAddForm, setShowAddForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  return (
    <div className="rounded-2xl border bg-white p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            مفردات الدرس
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            عدد المفردات: {vocabulary.length}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            setShowAddForm((value) => !value)
          }
          className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700"
        >
          {showAddForm
            ? "إلغاء"
            : "+ إضافة مفردة"}
        </button>
      </div>

      {showAddForm ? (
        <form
          action={async (formData) => {
            await addVocabulary(formData);
            setShowAddForm(false);
          }}
          className="mb-6 rounded-2xl bg-emerald-50 p-5"
        >
          <input
            type="hidden"
            name="lesson_id"
            value={lessonId}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <input
              name="word"
              required
              placeholder="الكلمة"
              className="rounded-xl border bg-white p-3"
            />

            <input
              name="meaning"
              required
              placeholder="المعنى"
              className="rounded-xl border bg-white p-3"
            />
          </div>

          <input
            name="example"
            placeholder="مثال اختياري"
            className="mt-4 w-full rounded-xl border bg-white p-3"
          />

          <button
            type="submit"
            className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white"
          >
            حفظ المفردة
          </button>
        </form>
      ) : null}

      <div className="space-y-4">
        {vocabulary.map((item) => {
          const isEditing =
            editingId === item.id;

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 p-5"
            >
              {isEditing ? (
                <form
                  action={async (formData) => {
                    await updateVocabulary(
                      formData
                    );

                    setEditingId(null);
                  }}
                >
                  <input
                    type="hidden"
                    name="id"
                    value={item.id}
                  />

                  <input
                    type="hidden"
                    name="lesson_id"
                    value={lessonId}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      name="word"
                      required
                      defaultValue={item.word}
                      className="rounded-xl border p-3"
                    />

                    <input
                      name="meaning"
                      required
                      defaultValue={item.meaning}
                      className="rounded-xl border p-3"
                    />
                  </div>

                  <input
                    name="example"
                    defaultValue={
                      item.example ?? ""
                    }
                    placeholder="مثال اختياري"
                    className="mt-4 w-full rounded-xl border p-3"
                  />

                  <div className="mt-4 flex gap-3">
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white"
                    >
                      حفظ
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingId(null)
                      }
                      className="rounded-xl bg-slate-200 px-5 py-3 font-bold"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-slate-500">
                        الكلمة
                      </p>

                      <p className="mt-1 text-lg font-bold text-emerald-700">
                        {item.word}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">
                        المعنى
                      </p>

                      <p className="mt-1 text-slate-700">
                        {item.meaning}
                      </p>
                    </div>
                  </div>

                  {item.example ? (
                    <p className="mt-4 rounded-xl bg-slate-50 p-3 text-slate-600">
                      مثال: {item.example}
                    </p>
                  ) : null}

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      الترتيب:{" "}
                      {item.display_order}
                    </span>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingId(item.id)
                        }
                        className="font-bold text-emerald-700"
                      >
                        تعديل
                      </button>

                      <form action={deleteVocabulary}>
                        <input
                          type="hidden"
                          name="id"
                          value={item.id}
                        />

                        <input
                          type="hidden"
                          name="lesson_id"
                          value={lessonId}
                        />

                        <button
                          type="submit"
                          onClick={(event) => {
                            if (
                              !window.confirm(
                                "هل تريد حذف هذه المفردة؟"
                              )
                            ) {
                              event.preventDefault();
                            }
                          }}
                          className="font-bold text-red-600"
                        >
                          حذف
                        </button>
                      </form>
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}

        {vocabulary.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">
            لا توجد مفردات لهذا الدرس.
          </div>
        ) : null}
      </div>
    </div>
  );
}