import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const read = path => readFileSync(path, "utf8");
const api = read("app/api/live/native/[id]/route.ts");
const room = read("app/live/[id]/DadyoomNativeClassroom.tsx");
const page = read("app/live/[id]/page.tsx");
const legacy = read("app/live/[id]/video/page.tsx");
describe("Dadyoom native classroom rollout", () => {
  test("always requires auth, verified session membership and RLS", () => {
    expect(api).toContain("db.auth.getUser()");
    expect(api).toContain('db.rpc("edu_can_join_live_session"');
    expect(api).toContain('from("edu_native_room_messages")');
    expect(api).toContain('.eq("session_id", auth.id)');
    expect(api).toContain("auth.user.id");
    expect(api).toContain('request.headers.get("x-dadyoom-native-classroom")');
    expect(api).toContain('origin !== new URL(request.url).origin');
    expect(api).not.toContain("createAdminClient");
  });
  test("text first; no LiveKit required on primary live route", () => {
    expect(page).toContain("<DadyoomNativeClassroom");
    expect(page).not.toContain("LiveSessionClient");
    expect(room).toContain("fetch(\"/api/live/native/\" + sessionId");
    expect(room).toContain("1500");
    expect(room).toContain("disabled={!ready || busy || !text.trim()}");
    expect(room).not.toContain('"/live/" + sessionId + "/video"');
    expect(room).toContain("الصوت والفيديو قيد تطوير ضاديوم");
    expect(legacy).toContain('redirect("/live/" + encodeURIComponent(id))');
  });
});
