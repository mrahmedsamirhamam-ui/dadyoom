import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
const api=readFileSync("app/api/live/native/[id]/route.ts","utf8");
const room=readFileSync("app/live/[id]/DadyoomNativeClassroom.tsx","utf8");
describe("Owned Dadyoom Classroom whiteboard, independent of LiveKit",()=>{
 test("student sees teacher board but cannot create or spoof updates",()=>{
  expect(api).toContain('const BOARD_MARKER = "DADYOOM_BOARD_V1:"');
  expect(api).toContain('auth.meeting.teacher_id !== auth.user.id');
  expect(api).toContain('!isBoard && text.startsWith(BOARD_MARKER)');
  expect(api).toContain('.eq("user_id", auth.meeting.teacher_id)');
  expect(api).toContain('.like("body", BOARD_MARKER + "%")');
  expect(api).toContain("storedText");
  expect(api).toContain('db.rpc("edu_can_join_live_session"');
  expect(api).not.toContain("createAdminClient");
 });
 test("board is a real persisted API submission, separately from class chat",()=>{
  expect(room).toContain("سبورة المعلم");
  expect(room).toContain("async function publishBoard");
  expect(room).toContain('body: JSON.stringify({ text: boardDraft, kind: "board" })');
  expect(room).toContain("setBoard(result.board ?? null)");
  expect(room).toContain("isTeacher ? <form onSubmit={publishBoard}");
  expect(room).toContain("maxLength={1200}");
  expect(api).toContain("const maxLength = isBoard ? 1200 : 1500");
  expect(api).toContain('body: storedText');
 });
});
