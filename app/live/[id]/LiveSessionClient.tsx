"use client";

import { useEffect, useState } from "react";

import DadyoomLiveRoom from "@/components/live/DadyoomLiveRoom";

type Payload = {
  token: string;
  serverUrl: string;
  title: string;
};

export default function LiveSessionClient({
  sessionId,
}: {
  sessionId: string;
}) {
  const [payload, setPayload] =
    useState<Payload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/live/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as
          | Payload
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in body
              ? body.error ?? "تعذر دخول الحصة."
              : "تعذر دخول الحصة.",
          );
        }

        setPayload(body as Payload);
      })
      .catch((reason) => {
        if (!controller.signal.aborted) {
          setError(
            reason instanceof Error
              ? reason.message
              : "تعذر دخول الحصة.",
          );
        }
      });

    return () => {
      controller.abort();
    };
  }, [sessionId]);

  if (error) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#fbf6ea] p-6"
      >
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 font-bold text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!payload) {
    return (
      <main
        dir="rtl"
        className="min-h-screen bg-[#fbf6ea] p-6"
      >
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-6 font-black text-[#123f39]">
          جارٍ تجهيز غرفة ضاديوم المباشرة...
        </div>
      </main>
    );
  }

  return (
    <DadyoomLiveRoom
      token={payload.token}
      serverUrl={payload.serverUrl}
      title={payload.title}
    />
  );
}
