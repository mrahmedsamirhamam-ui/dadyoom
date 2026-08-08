"use client";

import { useState } from "react";

// 1. تعريف أنواع البيانات (Types)
type DictionaryWord = {
  word: string;
  type?: string;
  meaning: string;
  example?: string | null;
};

type DictionaryResult = {
  words: DictionaryWord[];
};

export default function DictionaryPage() {
  const [text, setText] = useState("");
  // 2. تحديث نوع الحالة
  const [result, setResult] = useState<DictionaryResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setResult(data.result);
    } catch (error) {
      console.error("حدث خطأ أثناء التحليل:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-teal-700">📖 قاموس السياق</h1>

        <p className="mt-3 text-gray-600">
          اكتب كلمة أو جملة وسيشرحها ضاديوم حسب السياق.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="مثال: أشرقت الشمس على الوادي."
          className="w-full h-40 mt-8 rounded-xl border p-4"
        />

        <button
          onClick={analyze}
          disabled={loading}
          className="bg-teal-700 text-white px-8 py-3 rounded-xl mt-6 hover:bg-teal-800 transition disabled:opacity-50"
        >
          {loading ? "جارٍ التحليل..." : "تحليل"}
        </button>

        <div className="bg-white rounded-2xl shadow mt-8 p-6">
          <h2 className="text-2xl font-bold mb-4">نتيجة التحليل</h2>

          {/* 3. عرض نتائج الكلمات مرة واحدة فقط وبدون الحاجة لـ as */}
          {result?.words && result.words.length > 0 ? (
            result.words.map((item) => (
              <div key={item.word} className="border-b py-3 last:border-b-0">
                <h3 className="font-bold text-xl text-teal-800">{item.word}</h3>
                {item.type && (
                  <p className="text-sm text-gray-500">{item.type}</p>
                )}
                <p className="mt-1 text-gray-700">{item.meaning}</p>
                {item.example && (
                  <p className="mt-1 text-sm italic text-gray-600">
                    مثال: {item.example}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-400">لا توجد نتائج للعرض حاليًا.</p>
          )}
        </div>
      </div>
    </main>
  );
}