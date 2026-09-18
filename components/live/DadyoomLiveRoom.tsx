"use client";

import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

export default function DadyoomLiveRoom({
  token,
  serverUrl,
  title,
}: {
  token: string;
  serverUrl: string;
  title: string;
}) {
  return (
    <main
      dir="rtl"
      className="min-h-screen bg-[#0b211e] text-white"
    >
      <div className="border-b border-white/10 px-4 py-3 font-black">
        {title}
      </div>

      <LiveKitRoom
        token={token}
        serverUrl={serverUrl}
        connect
        audio
        video
        data-lk-theme="default"
        className="min-h-[calc(100vh-52px)]"
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </main>
  );
}
