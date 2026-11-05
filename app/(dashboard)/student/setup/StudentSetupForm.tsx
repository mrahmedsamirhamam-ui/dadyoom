"use client";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getArabicCountryOptions } from "@/lib/countries";

export default function StudentSetupForm({initialCountry,initialGrade,initialTrack,initialMode}: {
  initialCountry: string; initialGrade: number;
  initialTrack: "native" | "non_native"; initialMode: "ministry" | "dadyoom";
}) {
  const router = useRouter();
  const countries = useMemo(() => getArabicCountryOptions(), []);
  const [country,setCountry] = useState(initialCountry);
  const [grade,setGrade] = useState(initialGrade);
  const [track,setTrack] = useState(initialTrack);
  const [mode,setMode] = useState(initialMode);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/student/preferences", {
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({country,grade,track,mode})
      });
      const result = await response.json() as {error?: string; destination?: string};
      if (!response.ok) throw new Error(result.error || "تعذر حفظ التفضيلات.");
      router.replace(result.destination || "/student");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر حفظ التفضيلات.");
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-3xl border border-[#e1ebe5] bg-white p-5 sm:p-7">
      <label className="block font-semibold text-[#173f35]">الدولة
        <select value={country} onChange={e=>setCountry(e.target.value)}
          className="mt-2 min-h-12 w-full rounded-xl border border-[#cbdad0] bg-white p-3">
          {countries.map(item=><option key={item.code} value={item.code}>{item.name}</option>)}
        </select>
      </label>
      <label className="block font-semibold text-[#173f35]">الصف الدراسي
        <select value={grade} onChange={e=>setGrade(Number(e.target.value))}
          className="mt-2 min-h-12 w-full rounded-xl border border-[#cbdad0] bg-white p-3">
          {Array.from({length:13},(_,i)=>i+1).map(n=><option key={n} value={n}>الصف {n}</option>)}
        </select>
      </label>
      <fieldset className="space-y-2"><legend className="mb-2 font-semibold text-[#173f35]">كيف تتعلم العربية؟</legend>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e0e8e0] p-3">
          <input type="radio" name="track" checked={track==="native"} onChange={()=>setTrack("native")} /> ناطق بالعربية
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e0e8e0] p-3">
          <input type="radio" name="track" checked={track==="non_native"} onChange={()=>setTrack("non_native")} /> أتعلم العربية لغة ثانية
        </label>
      </fieldset>
      <fieldset className="space-y-2"><legend className="mb-2 font-semibold text-[#173f35]">المسار المفضل</legend>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e0e8e0] p-3">
          <input type="radio" name="mode" checked={mode==="ministry"} onChange={()=>setMode("ministry")} /> منهج الوزارة
        </label>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-[#e0e8e0] p-3">
          <input type="radio" name="mode" checked={mode==="dadyoom"} onChange={()=>setMode("dadyoom")} /> مسار ضاديوم الإثرائي
        </label>
      </fieldset>
      <p className="text-xs leading-6 text-[#687a71]">
        يحفظ ضاديوم اختياراتك. توفير درس مطابق لكل مسار يعتمد على المناهج التي تم التحقق منها فعلًا.
      </p>
      {error ? <p role="alert" className="text-sm text-rose-700">{error}</p> : null}
      <button disabled={busy} className="min-h-12 w-full rounded-xl bg-[#17564b] p-3 font-bold text-white disabled:opacity-50">
        {busy ? "جارٍ الحفظ…" : "احفظ وادخل غرفتي"}
      </button>
    </form>
  );
}
