import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const read = path => readFileSync(path,"utf8");
const health=read("app/api/live/health/route.ts");
const token=read("app/api/live/token/route.ts");
const room=read("app/live/[id]/DadyoomNativeClassroom.tsx");
const video=read("app/live/[id]/video/page.tsx");
const gate=read("scripts/final-e2e-release-gate.mjs");
describe("No external LiveKit provider on public classroom path",()=>{
  test("legacy token endpoint stops issuance while existing room links survive",()=>{
    expect(token).toContain('"EXTERNAL_LIVE_VIDEO_RETIRED"');
    expect(token).toContain("status: 410");
    expect(token).not.toContain("createDadyoomLiveToken");
    expect(token).not.toContain("LIVEKIT_API_KEY");
    expect(video).toContain('redirect("/live/" + encodeURIComponent(id))');
  });
  test("health accurately marks native text/board only",()=>{
    expect(health).toContain('provider: "dadyoom-native"');
    expect(health).toContain("video: false");
    expect(health).toContain("audio: false");
    expect(room).toContain("الصوت والفيديو قيد تطوير ضاديوم");
    expect(room).not.toContain('"/live/" + sessionId + "/video"');
  });
  test("role QA checks real native auth rather than retired token",()=>{
    expect(gate).toContain('"/api/live/native/"');
    expect(gate).toContain('E2E_LIVE_EXTERNAL_TOKEN_NOT_RETIRED');
    expect(gate).not.toContain("teacherLiveToken.data.token.length");
  });
});
