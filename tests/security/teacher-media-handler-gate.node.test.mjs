import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const file="app/api/teacher/lesson-media/route.ts";
const src=fs.readFileSync(file,"utf8");
test("teacher media handler authorizes server-side role before untrusted form data and admin storage",()=>{
 const handler=src.indexOf("export async function POST(request: Request)");
 const gate=src.indexOf('authorizeSession(await createClient(), ["teacher", "admin"])',handler);
 const denial=src.indexOf("if (!gate.ok)",gate);
 const parse=src.indexOf("await request.formData()",handler);
 const storage=src.indexOf("const admin = createAdminClient();",handler);
 assert.ok(handler!==-1&&gate>handler,"authorization must be inside POST");
 assert.ok(denial>gate&&denial<parse,"role denial must precede parsing");
 assert.ok(parse>denial&&storage>parse,"no service-role storage before auth");
 assert.ok(src.includes("status: gate.status"),"401/403 status must be preserved");
 assert.ok(src.includes('headers: { "Cache-Control": "no-store" }'),"auth denial must not be cached");
 assert.ok(src.includes('requireLessonAccess(lessonId)'),"per-lesson ownership must remain checked");
});
test("teacher media role gate remains independent of Next.js proxy middleware",()=>{
 assert.ok(!src.includes('from "@/proxy"'));
 assert.ok(src.includes('import { authorizeSession } from "@/lib/auth/authorization";'));
});
