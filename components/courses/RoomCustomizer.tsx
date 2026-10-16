"use client";

import Link from "next/link";
import { useState } from "react";

type Country = { code: string; name: string; maxGrade: number };
type Room = "native" | "non-native";
type Activity = "lessons" | "videos";
type Focus = "all" | "reading" | "grammar" | "listening" | "writing";

const focusOptions: { key: Focus; label: string }[] = [
  { key: "all", label: "كل المهارات" },
  { key: "reading", label: "القراءة والفهم" },
  { key: "grammar", label: "النحو والتراكيب" },
  { key: "listening", label: "الاستماع والنطق" },
  { key: "writing", label: "الكتابة والتعبير" },
];

export default function RoomCustomizer({ countries }: { countries: Country[] }) {
  const [room, setRoom] = useState<Room>("native");
  const [countryCode, setCountryCode] = useState("BH");
  const [grade, setGrade] = useState(1);
  const [activity, setActivity] = useState<Activity>("lessons");
  const [focus, setFocus] = useState<Focus>("all");

  const selectedCountry = countries.find((item) => item.code === countryCode) ?? countries[0];
  const maxGrade = selectedCountry?.maxGrade ?? 12;
  const safeGrade = Math.min(Math.max(grade, 1), maxGrade);
  const roomQuery = room === "native" ? "native" : "non-native";

  const destination = activity === "videos"
    ? `/courses/video-library?room=${roomQuery}${focus === "all" ? "" : `&focus=${focus}`}`
    : room === "native"
      ? `/courses?country=${selectedCountry?.code ?? "BH"}&grade=${safeGrade}`
      : "/courses/arabic-from-zero";

  const destinationLabel = activity === "videos"
    ? "افتح فيديوهات المهارة المختارة"
    : room === "native"
      ? "اعرض جميع دروس الصف المختار"
      : "ابدأ العربية من الصفر";

  return (
    <section
      id="room-customizer"
      dir="rtl"
      aria-labelledby="room-customizer-title"
      className="rounded-[2rem] border border-[#d6c095] bg-[#fffdf8] p-4 shadow-md sm:p-8"
    >
      <p className="text-sm font-black text-[#9a7028]">غرفتك كما تحتاجها</p>
      <h2 id="room-customizer-title" className="mt-2 text-2xl font-black text-[#123f39] sm:text-3xl">
        خصّص مسار الغرفة قبل الدخول
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-8 text-[#60594c]">
        اختر الفئة وطريقة التعلم والمهارة. ستنتقل إلى الدروس أو الفيديوهات الموجودة فعلًا،
        ولن تُنشأ غرفة فارغة أو يُنسب المحتوى إلى منهج غير مثبت.
      </p>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <fieldset className="rounded-2xl border border-[#e5d6b7] p-4">
          <legend className="px-2 font-black text-[#123f39]">المتعلم</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([{ value: "native", label: "العربية للعرب", help: "مناهج الدول والصفوف" },
              { value: "non-native", label: "العربية لغير الناطقين", help: "تأسيس ونطق ومحادثة" }] as const).map(item => (
              <button key={item.value} type="button" aria-pressed={room === item.value}
                onClick={() => setRoom(item.value)}
                className={`min-h-16 rounded-xl border p-3 text-right transition focus-visible:outline-2 focus-visible:outline-[#b17d29] ${room === item.value ? "border-[#174f47] bg-[#e7f3ee] text-[#123f39]" : "border-[#d6c8ae] bg-white text-[#5c6058]"}`}>
                <span className="block font-black">{item.label}</span>
                <span className="mt-1 block text-xs">{item.help}</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-2xl border border-[#e5d6b7] p-4">
          <legend className="px-2 font-black text-[#123f39]">طريقة التعلم</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {([{ value: "lessons", label: "دروس وتدريبات" },
              { value: "videos", label: "فيديوهات تعليمية" }] as const).map(item => (
              <button key={item.value} type="button" aria-pressed={activity === item.value}
                onClick={() => setActivity(item.value)}
                className={`min-h-14 rounded-xl border px-4 py-3 font-black transition focus-visible:outline-2 focus-visible:outline-[#b17d29] ${activity === item.value ? "border-[#174f47] bg-[#e7f3ee] text-[#123f39]" : "border-[#d6c8ae] bg-white text-[#5c6058]"}`}>
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {room === "native" && activity === "lessons" ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block font-black text-[#123f39]">
            الدولة
            <select value={selectedCountry?.code ?? "BH"} onChange={(event) => {
              const next = countries.find((entry) => entry.code === event.target.value);
              setCountryCode(event.target.value);
              setGrade((current) => Math.min(current, next?.maxGrade ?? 12));
            }} className="mt-2 min-h-12 w-full rounded-xl border border-[#cdbb96] bg-white px-3 py-2 text-base">
              {countries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>
          <label className="block font-black text-[#123f39]">
            الصف
            <select value={safeGrade} onChange={(event) => setGrade(Number(event.target.value))}
              className="mt-2 min-h-12 w-full rounded-xl border border-[#cdbb96] bg-white px-3 py-2 text-base">
              {Array.from({ length: maxGrade }, (_, i) => i + 1)
                .map((number) => <option key={number} value={number}>الصف {number}</option>)}
            </select>
          </label>
        </div>
      ) : null}

      {activity === "videos" ? (
        <label className="mt-4 block font-black text-[#123f39]">
          المهارة التي أريد تطويرها
          <select value={focus} onChange={(event) => setFocus(event.target.value as Focus)}
            className="mt-2 min-h-12 w-full rounded-xl border border-[#cdbb96] bg-white px-3 py-2 text-base">
            {focusOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[#eff6f0] p-4">
        <div>
          <p className="font-black text-[#123f39]">غرفتك جاهزة للاستكشاف</p>
          <p className="mt-1 text-sm leading-7 text-[#567167]">
            {room === "native" ? "العربية للعرب" : "العربية لغير الناطقين"}
            {" • "}{activity === "videos" ? "فيديوهات" : "دروس"}
            {room === "native" && activity === "lessons" ? ` • ${selectedCountry?.name ?? "البحرين"} • الصف ${safeGrade}` : ""}
          </p>
        </div>
        <Link href={destination} prefetch={false}
          className="inline-flex min-h-12 items-center rounded-full bg-[#123f39] px-6 py-3 text-sm font-black text-white transition hover:bg-[#1b5c53] focus-visible:outline-2 focus-visible:outline-[#b17d29]">
          {destinationLabel} ←
        </Link>
      </div>
    </section>
  );
}
