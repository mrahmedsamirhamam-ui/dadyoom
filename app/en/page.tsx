import type { Metadata } from "next";
import Link from "next/link";
import DadyoomLogo from "@/components/brand/DadyoomLogo";

export const dynamic = "force-static";
export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Learn Arabic Online — Dadyoom",
  description: "Learn Arabic with reading, writing, listening and speaking. Explore beginner guidance, national curricula, study activities and progress tracking in Dadyoom.",
  alternates: { canonical: "/en", languages: { en: "/en", ar: "/" } },
  openGraph: { locale: "en_US", title: "Learn Arabic Online | Dadyoom" },
};

const roles = [
  ["Students", "Find an Arabic learning path, read lessons and practise skills.", "/signup"],
  ["Teachers", "Explore classroom activities, curricula and teaching resources.", "/teachers"],
  ["Parents", "Help your children learn Arabic and understand their progress.", "/signup"],
  ["Schools", "Bring Arabic content and learning support into one place.", "/signup"],
] as const;

export default function EnglishHome() {
  return <main lang="en" dir="ltr" className="min-h-screen bg-[#f7f1e6] text-[#202c29]">
    <header className="border-b border-[#d9ccb2] bg-[#fffdf8]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <DadyoomLogo />
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-4 text-sm font-bold text-[#174f47]">
          <Link href="/en/curriculum">Curricula</Link>
          <Link href="/en/learn-arabic">Learn Arabic</Link>
          <Link href="/courses">Course explorer</Link>
          <Link href="/login">Log in</Link>
          <Link href="/signup" className="rounded-full bg-[#123f39] px-5 py-3 text-white">Start for free</Link>
        </nav>
      </div>
    </header>
    <section className="bg-[radial-gradient(circle_at_80%_20%,rgba(18,63,57,.15),transparent_28rem),linear-gradient(180deg,#fffdf8,#f3e8d5)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <p className="inline-flex rounded-full border border-[#cfb36f] bg-white px-4 py-2 text-sm font-black text-[#73551d]">
            Dadyoom — Your digital home for Arabic
          </p>
          <h1 className="mt-7 text-4xl font-black leading-tight text-[#123f39] sm:text-6xl">
            Learn Arabic with confidence.
            <span className="mt-3 block text-[#a7772f]">From first words to real understanding.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-9 text-[#5f5a51]">
            Discover Arabic through structured reading, writing, listening and speaking
            activities. English guidance helps beginners and non-native speakers find
            their way, while the lessons keep Arabic at the heart of learning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 font-bold">
            <Link href="/signup" className="rounded-2xl bg-[#123f39] px-7 py-4 text-white">Start learning for free</Link>
            <Link href="/en/learn-arabic" className="rounded-2xl border border-[#cdbb96] bg-white px-7 py-4 text-[#123f39]">Beginner guide</Link>
            <Link href="/en/curriculum" className="rounded-2xl border border-[#cdbb96] bg-white px-7 py-4 text-[#123f39]">Browse curricula</Link>
          </div>
          <p className="mt-7 max-w-xl text-sm leading-7 text-[#655e54]">
            Official curricula vary by country and grade. Book references do not always represent completed lessons.
          </p>
        </div>
        <div className="rounded-[2rem] border border-[#cfbf9e] bg-white p-7 shadow-[0_24px_80px_rgba(18,63,57,.13)]">
          <p className="font-black uppercase tracking-wide text-[#9a712c]">Your journey</p>
          <h2 className="mt-3 text-3xl font-black text-[#123f39]">Learn step by step</h2>
          {[
            ["01", "Choose your starting point", "Pick your learning goal, level or school curriculum."],
            ["02", "Learn and practise", "Build vocabulary and practise Arabic in context."],
            ["03", "Review and improve", "Use exercises and feedback to understand what comes next."],
          ].map(([number,title,body]) =>
            <div key={number} className="mt-5 flex gap-4 rounded-2xl bg-[#f7f1e6] p-5">
              <span className="font-black text-[#aa7c2d]">{number}</span>
              <div><h3 className="font-black text-[#123f39]">{title}</h3><p className="mt-1 text-sm leading-7 text-[#655e54]">{body}</p></div>
            </div>
          )}
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-16">
      <p className="font-black uppercase tracking-wide text-[#a7772f]">Who is Dadyoom for?</p>
      <h2 className="mt-3 text-3xl font-black text-[#123f39]">One platform. Different learning journeys.</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {roles.map(([title,body,href]) => <Link href={href} key={title}
          className="rounded-3xl border border-[#ddcfb4] bg-white p-6 transition hover:border-[#a99161] hover:shadow-lg">
          <h3 className="text-xl font-black text-[#123f39]">{title}</h3>
          <p className="mt-3 leading-7 text-[#625b51]">{body}</p>
          <span className="mt-6 inline-block font-black text-[#9a712c]">Explore →</span>
        </Link>)}
      </div>
    </section>
    <section className="border-t border-[#ddcfb4] bg-white py-16">
      <div className="mx-auto max-w-7xl px-5">
        <h2 className="text-3xl font-black text-[#123f39]">Four language skills, connected</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Reading", "Recognize Arabic words and understand texts."],
            ["Writing", "Move from letters to meaningful sentences."],
            ["Listening", "Recognize sounds and everyday language."],
            ["Speaking", "Build pronunciation and conversation skills."],
          ].map(([title,body]) =>
            <div key={title} className="rounded-2xl border border-[#e1d4ba] bg-[#f8f1e5] p-5">
              <h3 className="text-xl font-black text-[#123f39]">{title}</h3>
              <p className="mt-2 leading-7 text-[#625b51]">{body}</p>
            </div>
          )}
        </div>
        <Link href="/en/learn-arabic" className="mt-8 inline-flex rounded-2xl bg-[#123f39] px-6 py-4 font-bold text-white">Read the beginner&apos;s guide</Link>
      </div>
    </section>
    <footer className="px-5 py-8 text-center text-[#625b51]">
      Dadyoom — Arabic for every learner. <Link href="/" className="font-bold underline">الموقع بالعربية</Link>
    </footer>
  </main>;
}
