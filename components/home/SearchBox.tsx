import Link from "next/link";

export default function SearchBox() {
  return (
    <div className="mx-auto mt-10 max-w-3xl px-4 text-center">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="font-black text-slate-900">
          ماذا تريد أن تتعلم اليوم؟
        </p>

        <p className="mt-2 text-sm text-slate-600">
          افتح شات ضاد واكتب سؤالك مباشرة.
        </p>

        <Link
          href="/ask"
          className="mt-4 inline-flex touch-manipulation rounded-xl bg-teal-700 px-6 py-3 font-black text-white transition active:scale-95 active:opacity-80"
        >
          🤖 ابدأ المحادثة مع ضاد
        </Link>
      </div>
    </div>
  );
}
