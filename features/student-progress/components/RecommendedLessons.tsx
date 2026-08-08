import Link from "next/link";

type Lesson = {
  id: string;
  title: string;
  lesson_number: number;
};

type Props = {
  lessons: Lesson[];
};

export default function RecommendedLessons({
  lessons,
}: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow">

      <h2 className="mb-6 text-2xl font-bold">
        نوصي أن تبدأ بهذه الدروس
      </h2>

      <div className="space-y-4">

        {lessons.map((lesson) => (

          <Link
            key={lesson.id}
            href={`/lessons/${lesson.id}`}
            className="block rounded-xl border p-4 hover:border-emerald-500"
          >

            <div className="font-bold">

              {lesson.lesson_number}

              —

              {lesson.title}

            </div>

          </Link>

        ))}

      </div>

    </div>
  );
}