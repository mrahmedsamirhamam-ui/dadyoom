"use client";

import { useState } from "react";
import Button from "@/components/Button";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  async function ask() {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
      }),
    });

    const data = await res.json();

    setAnswer(data.answer);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-10">

      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl font-bold">
          🤖 اسأل ضاديوم
        </h1>

        <textarea
          className="border w-full h-40 rounded-xl p-4 mt-8"
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Button
  text="إرسال"
  onClick={ask}
/>

        

        <div className="mt-10 bg-white rounded-xl p-6 shadow">

          <h2 className="font-bold text-2xl">
            الإجابة
          </h2>

          <p className="mt-4">
            {answer}
          </p>

        </div>

      </div>

    </main>
  );
}