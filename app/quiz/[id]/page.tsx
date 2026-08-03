import { createClient } from "@/lib/supabase/server";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", id);

  return (
    <main className="min-h-screen bg-slate-100 p-8">

      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          اختبار الدرس
        </h1>

        {questions?.map((q) => (

          <div
            key={q.id}
            className="bg-white p-6 rounded-2xl shadow mb-8"
          >

            <h2 className="text-xl font-bold mb-6">
              {q.question}
            </h2>

            {[1,2,3,4].map((n) => (

              <label
                key={n}
                className="block mb-3"
              >

                <input
                  type="radio"
                  name={q.id}
                  className="mr-3"
                />

                {q[`option${n}`]}

              </label>

            ))}

          </div>

        ))}

        <button
          className="bg-teal-700 text-white px-8 py-3 rounded-xl"
        >
          إرسال الإجابات
        </button>

      </div>

    </main>
  );
}