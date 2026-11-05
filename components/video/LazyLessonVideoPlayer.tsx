"use client";

import { useEffect, useRef, useState } from "react";

const MAX_RESUME_SECONDS = 6 * 60 * 60;

export default function LazyLessonVideoPlayer({videoId,title}: {
  videoId:string; title:string;
}) {
  const safeId = /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : "";
  const [playing,setPlaying] = useState(false);
  const [resumeAt,setResumeAt] = useState(0);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const storageKey = `dadyoom.video.resume.${safeId}`;

  useEffect(() => {
    if (!safeId) return;
    try {
      const seconds = Math.floor(Number(window.localStorage.getItem(storageKey) || "0"));
      if (Number.isFinite(seconds) && seconds > 0 && seconds < MAX_RESUME_SECONDS) {
        setResumeAt(seconds);
      }
    } catch { /* Private browsing may block storage. */ }
  }, [safeId,storageKey]);

  useEffect(() => {
    if (!playing || !safeId) return;
    // Resume is best effort for YouTube embeds; native players expose more precise progress.
    function listen(event: MessageEvent) {
      if (!["https://www.youtube-nocookie.com","https://www.youtube.com"].includes(event.origin)) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      let data: unknown = event.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (!data || typeof data !== "object") return;
      const value = data as { info?: { currentTime?: unknown }; event?: string };
      const time = Number(value.info?.currentTime);
      if (!Number.isFinite(time) || time < 0 || time > MAX_RESUME_SECONDS) return;
      try { window.localStorage.setItem(storageKey,String(Math.floor(time))); }
      catch { /* Keep playback even if storage is disabled. */ }
    }
    window.addEventListener("message",listen);
    const timer=window.setInterval(() => {
      frameRef.current?.contentWindow?.postMessage(JSON.stringify({
        event:"command",func:"getCurrentTime",args:[]
      }),"https://www.youtube-nocookie.com");
    },5000);
    return () => { window.removeEventListener("message",listen); window.clearInterval(timer); };
  },[playing,safeId,storageKey]);

  if(!safeId) return <p role="alert" className="rounded-xl bg-amber-50 p-4 text-amber-900">
    رابط هذا الفيديو يحتاج مراجعة قبل تشغيله.
  </p>;

  const url = `https://www.youtube-nocookie.com/embed/${safeId}?rel=0&enablejsapi=1&controls=1&cc_load_policy=1&cc_lang_pref=ar&start=${Math.max(0,resumeAt)}`;
  return (
    <section className="overflow-hidden rounded-2xl border border-[#dce6df] bg-[#112c27]">
      <div className="aspect-video w-full">
        {!playing ? (
          <button type="button" onClick={()=>setPlaying(true)}
            className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#143f37] p-6 text-center text-white focus-visible:outline-4 focus-visible:outline-amber-300"
            aria-label={`تشغيل فيديو: ${title}`}>
            <span aria-hidden="true" className="grid h-16 w-16 place-items-center rounded-full bg-white/15 text-4xl">▶</span>
            <span className="text-lg font-bold">شغّل فيديو الشرح</span>
            <span className="text-sm text-[#d6e7dd]">لن يُحمَّل مشغل الفيديو إلا بعد الضغط</span>
            {resumeAt>0 && <span className="text-xs text-[#e9e4ae]">استئناف تقريبي من الثانية {resumeAt}</span>}
          </button>
        ) : (
          <iframe ref={frameRef} src={url} title={title} loading="lazy"
            className="h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share"
            allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
        )}
      </div>
      <p className="px-4 py-3 text-xs leading-6 text-[#e0eee7]">
        استخدم أدوات المشغّل لتغيير السرعة أو تفعيل الترجمة عندما يوفرها صاحب الفيديو.
      </p>
    </section>
  );
}
