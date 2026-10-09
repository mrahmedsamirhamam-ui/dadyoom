import type { Metadata } from "next";
import Link from "next/link";
export const dynamic = "force-static";
export const revalidate = 86400;
export const metadata: Metadata = {
  title: "How to Learn Arabic | Dadyoom English Guide",
  description: "A practical guide for learning Arabic as a second language: sounds, letters, short texts, useful phrases, grammar, speaking and listening.",
  alternates: { canonical: "/en/learn-arabic", languages: { en: "/en/learn-arabic", ar: "/learn-arabic" } },
};
const steps = [
  ["1. Match Arabic sounds with letters", "Listen to the sound, recognize the letter in different positions, and practise in simple words. Start with a few new letters at a time."],
  ["2. Build useful phrases", "Learn words in context: greetings, home, school, food and time. Make a new sentence with every word you learn."],
  ["3. Read short Arabic texts", "Begin with short passages, identify their main idea, and answer comprehension questions before moving to longer texts."],
  ["4. Write a little every day", "Practise spelling, write a simple sentence and gradually move to paragraphs. Review your repeated errors."],
  ["5. Listen and speak regularly", "Listen several times, repeat useful sentences aloud, and practise short conversations at a comfortable speed."],
] as const;
export default function EnglishGuidePage() {
  return <main lang="en" dir="ltr" className="min-h-screen bg-[#f7f1e6] px-5 py-12 text-[#202c29]">
    <div className="mx-auto max-w-5xl">
      <nav className="mb-8 flex flex-wrap items-center justify-between gap-4 font-bold text-[#174f47]">
        <Link href="/en">← Dadyoom</Link>
        <div className="flex flex-wrap gap-4"><Link href="/en/curriculum">Curricula</Link><Link href="/courses">Course explorer</Link><Link href="/signup">Start for free</Link></div>
      </nav>
      <article className="rounded-[2rem] border border-[#ddcfb4] bg-white p-6 shadow-sm sm:p-10">
        <p className="font-black uppercase tracking-wide text-[#a7772f]">Practical guidance for non-native speakers</p>
        <h1 className="mt-3 text-4xl font-black leading-tight text-[#123f39] sm:text-5xl">How to learn Arabic step by step</h1>
        <p className="mt-5 max-w-3xl text-lg leading-9 text-[#625b51]">
          Learn Arabic by connecting reading, writing, listening and speaking. You can start communicating
          before mastering every grammar rule. Choose a realistic level, practise consistently, and review your progress.
        </p>
        <div className="mt-9 space-y-4">
          {steps.map(([title,body]) => <section key={title} className="rounded-2xl border border-[#e1d4ba] bg-[#f8f1e5] p-5">
            <h2 className="text-xl font-black text-[#123f39]">{title}</h2>
            <p className="mt-2 leading-8 text-[#625b51]">{body}</p>
          </section>)}
        </div>
        <section className="mt-9 rounded-2xl bg-[#123f39] p-6 text-white">
          <h2 className="text-2xl font-black">A sustainable weekly routine</h2>
          <p className="mt-3 leading-8">Study for 20–30 minutes a day. Combine reading and vocabulary, writing and spelling, listening and conversation, and short grammar reviews. Keep a list of recurring mistakes.</p>
        </section>
        <section className="mt-9">
          <h2 className="text-2xl font-black text-[#123f39]">How Dadyoom can help</h2>
          <p className="mt-3 leading-8 text-[#625b51]">Find lessons and exercises for the four Arabic skills. Curriculum references are presented according to the available official sources. Not every listed textbook has complete lesson content yet. Arabic texts remain in their original language.</p>
        </section>
        <div className="mt-8 flex flex-wrap gap-3 font-bold">
          <Link href="/courses" className="rounded-xl bg-[#123f39] px-5 py-3 text-white">Explore courses</Link>
          <Link href="/signup" className="rounded-xl border border-[#cdbb96] px-5 py-3 text-[#123f39]">Create a free account</Link>
        </div>
      </article>
    </div>
  </main>;
}
