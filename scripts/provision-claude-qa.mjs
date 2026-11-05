#!/usr/bin/env node
/**
 * One-off admin-only Dadyoom QA account provisioner.
 * Dry run by default; --apply creates four separate low-privilege users.
 * Run locally, never from an exposed website or client.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const projectRef = "hvqsvtomhlxavmfqoxfz";
const expectedUrl = `https://${projectRef}.supabase.co`;
const apply = process.argv.includes("--apply");
if (process.argv.slice(2).some((arg) => arg !== "--apply")) {
  throw new Error("Unknown argument; only --apply is supported.");
}

const specs = [
  ["student", "طالب ضاديوم التجريبي – Claude"],
  ["teacher", "معلم ضاديوم التجريبي – Claude"],
  ["parent", "ولي أمر ضاديوم التجريبي – Claude"],
  ["school", "مدرسة ضاديوم التجريبية – Claude"],
];
const emailDomain = (process.env.CLAUDE_QA_EMAIL_DOMAIN || "example.test").trim().toLowerCase();
if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(emailDomain) || emailDomain.includes("..")) {
  throw new Error("Invalid CLAUDE_QA_EMAIL_DOMAIN");
}

console.log("Dadyoom Claude QA:", projectRef, apply ? "APPLY" : "DRY RUN");
console.log("Roles:", specs.map(([role]) => role).join(", "));
if (!apply) {
  console.log("No writes performed. Set server-only credentials and run with --apply.");
  process.exit(0);
}

const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
if (url !== expectedUrl) throw new Error("Refusing unexpected Supabase project.");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!serviceKey || serviceKey.startsWith("sb_publishable_")) {
  throw new Error("A server-only SUPABASE_SERVICE_ROLE_KEY is required.");
}
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

const runId = `${new Date().toISOString().slice(0, 10)}-${randomBytes(5).toString("hex")}`;
const privateDir = join(homedir(), ".dadyoom-private");
const manifestFile = join(privateDir, `claude-qa-${runId}.json`);
await mkdir(privateDir, { recursive: true, mode: 0o700 });
const manifest = {
  purpose: "Claude role-based QA of dadyoom.com", runId,
  projectRef, loginUrl: "https://dadyoom.com/login",
  accounts: [], fixtures: {},
  warning: "PRIVATE credentials. Never commit, publish, email, or share the Supabase service key.",
};
async function save() {
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + "\n", {
    mode: 0o600, flag: "w",
  });
}
await save();

async function upsertOne(table, payload, onConflict) {
  const { data, error } = await admin.from(table)
    .upsert(payload, { onConflict }).select("*").single();
  if (error || !data) throw new Error(`${table}: ${error?.message || "missing row"}`);
  return data;
}

try {
  for (const [role, name] of specs) {
    const email = `claude-qa-${runId}-${role}@${emailDomain}`;
    const password = randomBytes(24).toString("base64url");
    const { data, error } = await admin.auth.admin.createUser({
      email, password,
      // Reserved QA identities only; never auto-confirm real users.
      email_confirm: true,
      app_metadata: { qa_demo: true, qa_run_id: runId, qa_purpose: "role-audit" },
      user_metadata: { full_name: name, role, country: "BH", qa_demo: true },
    });
    if (error || !data.user) throw new Error(`Create ${role}: ${error?.message || "no user"}`);
    const id = data.user.id;
    manifest.accounts.push({ role, name, email, password, userId: id });
    await save(); // preserve any partial credentials privately
    const profile = await upsertOne("profiles", {
      id, email, full_name: name, role, country: "BH",
      ...(role === "student" ? { grade_number: 6, grade_academic_year: "2026/2027" } : {}),
    }, "id");
    if (profile.id !== id || profile.role !== role) {
      throw new Error(`Profile read-back mismatch for ${role}`);
    }
    console.log(`Created and verified ${role}.`);
  }

  const ids = Object.fromEntries(manifest.accounts.map(({ role, userId }) => [role, userId]));
  const school = await upsertOne("schools", {
    owner_id: ids.school, name: `مدرسة ضاديوم التجريبية – ${runId}`,
    country: "BH", academic_year: "2026/2027", is_active: true,
  }, "owner_id");
  const schoolTeacher = await upsertOne("school_teachers", {
    school_id: school.id, teacher_id: ids.teacher, is_active: true,
  }, "school_id,teacher_id");
  const clazz = await upsertOne("teacher_classes", {
    teacher_id: ids.teacher, name: `الصف السادس – تجربة Claude ${runId}`,
    description: "فصل اصطناعي لفحص الاستخدام فقط", academic_year: "2026/2027",
    join_code: `CQ${randomBytes(3).toString("hex").toUpperCase()}`, is_active: true,
  }, "join_code");
  const classStudent = await upsertOne("teacher_class_students", {
    class_id: clazz.id, student_id: ids.student, is_active: true,
  }, "class_id,student_id");
  const parentStudent = await upsertOne("parent_students", {
    parent_id: ids.parent, student_id: ids.student,
    relationship: "ولي أمر تجريبي", is_active: true,
  }, "parent_id,student_id");
  manifest.fixtures = {
    schoolId: school.id, schoolTeacherId: schoolTeacher.id,
    classId: clazz.id, classStudentId: classStudent.id,
    parentStudentId: parentStudent.id,
  };
  await save();

  const checks = await Promise.all([
    admin.from("schools").select("owner_id").eq("id", school.id).single(),
    admin.from("school_teachers").select("teacher_id").eq("id", schoolTeacher.id).single(),
    admin.from("teacher_class_students").select("student_id").eq("id", classStudent.id).single(),
    admin.from("parent_students").select("parent_id,student_id").eq("id", parentStudent.id).single(),
  ]);
  if (checks.some(({ error }) => error) ||
      checks[0].data?.owner_id !== ids.school ||
      checks[1].data?.teacher_id !== ids.teacher ||
      checks[2].data?.student_id !== ids.student ||
      checks[3].data?.parent_id !== ids.parent ||
      checks[3].data?.student_id !== ids.student) {
    throw new Error("Linked synthetic fixtures failed verification");
  }
  console.log("Verified school, teacher, class, student and guardian links.");
  console.log("PRIVATE credential file:", manifestFile);
  console.log("Complete browser sign-in tests per docs/CLAUDE-QA-ACCOUNTS.md.");
} catch (error) {
  console.error("Provisioning failed:", error instanceof Error ? error.message : String(error));
  console.error("Review any partially created QA users using private manifest:", manifestFile);
  console.error("Do not re-run blindly; existing identities are not altered.");
  process.exitCode = 1;
}
