"use client";

import { useState } from "react";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";
import CopyLiveLinkButton from "@/components/live/CopyLiveLinkButton";

export default function DadyoomLiveRoom({
  token,
  serverUrl,
  title,
  sessionId,
}: {
  token: string;
  serverUrl: string;
  title: string;
  sessionId: string;
}) {
  const [wide, setWide] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  return (
    <main dir="rtl" className="min-h-[100dvh] min-w-0 bg-[#0b211e] pb-3 text-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-bold text-[#f5d69a]">ضاديوم • غرفة تعليمية مباشرة</p>
          <h1 className="mt-1 break-words text-lg font-black sm:text-xl">{title}</h1>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <button
            type="button" aria-pressed={wide}
            onClick={() => setWide((current) => !current)}
            className="min-h-11 rounded-xl border border-white/30 px-4 py-2 font-black hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#f5cf7a]"
          >
            {wide ? "عرض مركز" : "توسيع العرض"}
          </button>
          <button
            type="button" aria-expanded={showHelp}
            onClick={() => setShowHelp((current) => !current)}
            className="min-h-11 rounded-xl border border-white/30 px-4 py-2 font-black hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#f5cf7a]"
          >
            {showHelp ? "إخفاء الإرشادات" : "مساعدة الغرفة"}
          </button>
          <CopyLiveLinkButton sessionId={sessionId} />
        </div>
      </header>

      {showHelp ? (
        <section aria-label="إرشادات استخدام الغرفة" className="mx-auto mt-3 max-w-5xl rounded-2xl border border-[#ab9367] bg-[#153c35] p-4 text-sm leading-8 text-white sm:px-6">
          افتح الميكروفون والكاميرا من شريط أدوات الاجتماع عندما تكون مستعدًا.
          استخدم زر نسخ رابط الغرفة لإرسال الدعوة للمشاركين المخوّلين.
          زر عرض مركز يصغّر مساحة المؤتمر، وزر توسيع العرض يعيدها إلى العرض الكامل.
          تحكم المعلم في إدارة المشاركين يعتمد على صلاحيات الجلسة.
        </section>
      ) : null}

      <div className={wide ? "mx-auto mt-3 w-full px-2 sm:px-4" : "mx-auto mt-3 w-full max-w-5xl px-2 sm:px-4"}>
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect
          audio={false}
          video={false}
          data-lk-theme="default"
          className="min-h-[max(480px,calc(100dvh-140px))] overflow-hidden rounded-2xl border border-white/10"
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </main>
  );
}
