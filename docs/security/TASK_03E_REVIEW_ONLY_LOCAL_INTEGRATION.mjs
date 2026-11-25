// TASK 03-E — REVIEW ONLY. NOT EXECUTED LOCALLY IN THIS ENVIRONMENT.
// Run only from TASK_03E_REVIEW_ONLY_ISOLATED_CI.yml after an unlinked local
// Supabase stack and its loopback isolation gate have both passed.
// Creates synthetic Auth users, obtains genuine local JWTs, and exercises
// PostgREST/RLS/RPC behavior. Never prints credentials or user tokens.

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const passed = [];
const failed = [];

function sanitize(value) {
  return String(value ?? "")
    .replace(/(secret|token|key|password)([=: ])[^ \n]+/gi, "$1$2[REDACTED]")
    .slice(0, 400);
}

function check(name, predicate, details = "") {
  if (predicate) {
    passed.push(name);
    console.log(`PASS ${name}`);
  } else {
    failed.push(name);
    console.error(`FAIL ${name} ${sanitize(details)}`);
  }
}

function assertGuard() {
  const forbidden = [
    "SUPABASE_ACCESS_TOKEN", "SUPABASE_SERVICE_KEY", "SUPABASE_DB_PASSWORD",
    "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "STAGING_SUPABASE_URL",
    "SUPABASE_DB_URL", "DATABASE_URL", "STAGING_DATABASE_URL",
    "PRODUCTION_SUPABASE_URL", "PRODUCTION_DATABASE_URL",
    "PRODUCTION_SUPABASE_PROJECT_REF", "STAGING_SUPABASE_PROJECT_REF",
    "VERCEL_TOKEN", "CLOUDFLARE_API_TOKEN", "NETLIFY_AUTH_TOKEN",
  ];
  const found = forbidden.filter((name) => Boolean((process.env[name] ?? "").trim()));
  assert.equal(found.length, 0, `forbidden environment variables: ${found.join(",")}`);

  const api = process.env.P0_LOCAL_API_URL || "";
  const db = process.env.P0_LOCAL_DB_URL || "";
  const loopback = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
  const apiUrl = new URL(api);
  const dbUrl = new URL(db);
  assert.ok(loopback.has(apiUrl.hostname), "API endpoint is not loopback");
  assert.ok(["http:", "https:"].includes(apiUrl.protocol), "API protocol is not HTTP(S)");
  assert.ok(loopback.has(dbUrl.hostname), "DB endpoint is not loopback");
  assert.ok(["postgres:", "postgresql:"].includes(dbUrl.protocol), "DB protocol is not PostgreSQL");
  assert.equal(dbUrl.pathname, "/postgres", "DB name is not the disposable postgres database");
  assert.ok(process.env.P0_LOCAL_ANON_KEY, "missing synthetic anon key");
  assert.ok(process.env.P0_LOCAL_SERVICE_KEY, "missing synthetic service key");
}

function query(sql) {
  const result = spawnSync(
    "psql",
    [process.env.P0_LOCAL_DB_URL, "-v", "ON_ERROR_STOP=1", "-tAc", sql],
    { encoding: "utf8" },
  );
  if (result.status !== 0) throw new Error(sanitize(result.stderr));
  return result.stdout.trim();
}

const authOptions = { auth: { autoRefreshToken: false, persistSession: false } };

async function createUser(key, metadataRole) {
  const email = `task03e-${key}-${process.env.GITHUB_RUN_ID || "local"}@invalid.example`;
  const password = "Task03e-local_Only!9A";
  const signup = createClient(process.env.P0_LOCAL_API_URL, process.env.P0_LOCAL_ANON_KEY, authOptions);
  const { data, error } = await signup.auth.signUp({
    email,
    password,
    options: { data: { role: metadataRole, full_name: `Synthetic ${key}`, country: "BH" } },
  });
  if (error || !data.user) throw new Error(`signup ${key}: ${sanitize(error?.message)}`);

  let accessToken = data.session?.access_token;
  if (!accessToken) {
    const signedIn = await signup.auth.signInWithPassword({ email, password });
    accessToken = signedIn.data.session?.access_token;
    if (signedIn.error) throw new Error(`signin ${key}: ${sanitize(signedIn.error.message)}`);
  }
  if (!accessToken) throw new Error(`no genuine JWT issued for ${key}`);

  const client = createClient(
    process.env.P0_LOCAL_API_URL,
    process.env.P0_LOCAL_ANON_KEY,
    {
      ...authOptions,
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    },
  );
  const actual = (await client.auth.getUser()).data.user;
  check(`genuine_jwt_${key}`, actual?.id === data.user.id, actual?.id || "no user");

  return { id: data.user.id, email, client };
}

async function main() {
  assertGuard();
  console.log("TASK03E_LOCAL_INTEGRATION_GUARD=PASS api=loopback db=loopback");

  const service = createClient(
    process.env.P0_LOCAL_API_URL,
    process.env.P0_LOCAL_SERVICE_KEY,
    authOptions,
  );
  const anon = createClient(
    process.env.P0_LOCAL_API_URL,
    process.env.P0_LOCAL_ANON_KEY,
    authOptions,
  );

  const specs = [
    ["student", "student"],
    ["parent", "parent"],
    ["child", "child"],
    ["teacher", "teacher"],
    ["school", "school"],
    ["adminfake", "admin"],
    ["legacy", "student"],
  ];
  const users = {};
  for (const [key, metadataRole] of specs) {
    users[key] = await createUser(key, metadataRole);
  }

  let adminFakeInitialRole;
  for (const [key] of specs) {
    const row = await service.from("profiles").select("role").eq("id", users[key].id).single();
    check(`metadata_role_downgraded_${key}`, row.data?.role === "student", row.error?.message || row.data?.role);
    if (key === "adminfake") adminFakeInitialRole = row.data?.role;
  }

  for (const key of ["teacher", "school"]) {
    const row = await service.from("profile_role_requests")
      .select("requested_role,status").eq("user_id", users[key].id).maybeSingle();
    check(`metadata_intent_pending_only_${key}`,
      row.data?.requested_role === key && row.data?.status === "pending",
      row.error?.message || JSON.stringify(row.data));
  }
  const fakeAdminRequest = await service.from("profile_role_requests")
    .select("user_id").eq("user_id", users.adminfake.id).maybeSingle();
  check("forged_admin_metadata_creates_no_request", !fakeAdminRequest.data, "request row exists");

  const ownRequest = await users.teacher.client.from("profile_role_requests")
    .select("requested_role,status").eq("user_id", users.teacher.id).maybeSingle();
  check("pending_request_visible_to_owner",
    !ownRequest.error && ownRequest.data?.requested_role === "teacher"
      && ownRequest.data?.status === "pending",
    ownRequest.error?.message || JSON.stringify(ownRequest.data));
  const otherRequest = await users.teacher.client.from("profile_role_requests")
    .select("user_id").eq("user_id", users.school.id).maybeSingle();
  check("other_pending_request_hidden", !otherRequest.error && !otherRequest.data,
    otherRequest.error?.message || JSON.stringify(otherRequest.data));

  const initialTokens = Number(query("SELECT count(*) FROM public.profile_onboarding_pending"));
  check("one_time_tokens_issued_to_new_users", initialTokens === specs.length, `count=${initialTokens}`);

  for (const key of ["student", "parent", "child"]) {
    const first = await users[key].client.rpc("task03d_complete_self_signup", {
      p_full_name: `Completed ${key}`,
      p_country: "BH",
      p_role: key,
    });
    check(`self_signup_${key}`, !first.error && first.data === key, first.error?.message);

    const replay = await users[key].client.rpc("task03d_complete_self_signup", {
      p_full_name: `Replay ${key}`,
      p_country: "BH",
      p_role: key === "parent" ? "child" : "parent",
    });
    check(`replay_denied_${key}`, Boolean(replay.error), replay.error?.message);

    const row = await service.from("profiles").select("role").eq("id", users[key].id).single();
    check(`final_role_${key}`, row.data?.role === key, row.data?.role);
  }

  for (const elevated of ["teacher", "school", "admin"]) {
    const attempt = await users.student.client.from("profiles")
      .update({ role: elevated }).eq("id", users.student.id);
    const row = await service.from("profiles").select("role").eq("id", users.student.id).single();
    check(`direct_role_update_denied_${elevated}`, Boolean(attempt.error) && row.data?.role === "student",
      attempt.error?.message || row.data?.role);
  }
  const insertAttempt = await users.student.client.from("profiles").insert({
    id: crypto.randomUUID(), email: "injected@invalid.example", role: "teacher", country: "BH",
  });
  check("direct_privileged_insert_denied", Boolean(insertAttempt.error), insertAttempt.error?.message);

  const cross = await users.student.client.from("profiles").select("id").eq("id", users.parent.id);
  check("cross_user_profile_read_denied", !cross.error && cross.data?.length === 0,
    cross.error?.message || JSON.stringify(cross.data));

  const clientApproval = await users.student.client.rpc("task03d_approve_profile_role_request", {
    p_target_user_id: users.teacher.id,
    p_reviewer_id: users.adminfake.id,
    p_decision: "approved",
    p_reason: "synthetic unauthorized browser approval",
  });
  check("client_approval_rpc_denied", Boolean(clientApproval.error), clientApproval.error?.message);

  const clientRepair = await users.student.client.rpc("task03d_issue_legacy_onboarding_token", {
    p_target_user_id: users.legacy.id,
    p_operator_id: users.adminfake.id,
    p_reason: "synthetic unauthorized browser repair",
  });
  check("client_legacy_repair_rpc_denied", Boolean(clientRepair.error), clientRepair.error?.message);

  const functionDef = query(
    "SELECT pg_get_functiondef('public.task03d_complete_self_signup(text,text,text)'::regprocedure)",
  );
  check("onboarding_rpc_creates_no_family_links",
    !/link_child_by_code|create_parent_link_code|parent_student|student_parent/i.test(functionDef),
    "family-link reference found in RPC definition");

  const concurrent = await createUser("concurrent", "student");
  const attempts = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      concurrent.client.rpc("task03d_complete_self_signup", {
        p_full_name: `Concurrent ${index}`,
        p_country: "BH",
        p_role: index % 2 === 0 ? "parent" : "child",
      }),
    ),
  );
  const successes = attempts.filter((attempt) => !attempt.error);
  check("concurrent_onboarding_exactly_one_wins", successes.length === 1,
    `successes=${successes.length}`);
  const concurrentRow = await service.from("profiles").select("role").eq("id", concurrent.id).single();
  check("concurrent_final_role_matches_winner",
    successes.length === 1 && concurrentRow.data?.role === successes[0].data,
    concurrentRow.data?.role);
  const concurrentAudit = await service.from("profile_self_signup_audit")
    .select("selected_role").eq("user_id", concurrent.id);
  check("concurrent_selection_audited_once", concurrentAudit.data?.length === 1,
    `rows=${concurrentAudit.data?.length}`);

  // Simulate a pre-existing incomplete profile: remove the trigger-issued token.
  query(`DELETE FROM public.profile_onboarding_pending WHERE user_id='${users.legacy.id}'`);
  const unrepairable = await users.legacy.client.rpc("task03d_complete_self_signup", {
    p_full_name: "Pretend Legacy", p_country: "BH", p_role: "parent",
  });
  check("existing_student_cannot_self_repair", Boolean(unrepairable.error), unrepairable.error?.message);

  const unenrolledRepair = await service.rpc("task03d_issue_legacy_onboarding_token", {
    p_target_user_id: users.legacy.id,
    p_operator_id: users.adminfake.id,
    p_reason: "synthetic unenrolled operator attempt",
  });
  check("unenrolled_operator_repair_denied", Boolean(unenrolledRepair.error), unenrolledRepair.error?.message);

  query(`UPDATE public.profiles SET role='admin' WHERE id='${users.adminfake.id}'`);
  query(`INSERT INTO private.role_approval_authorities(reviewer_id,authorization_reference)
         VALUES('${users.adminfake.id}','synthetic independent operator witness')
         ON CONFLICT (reviewer_id) DO NOTHING`);
  const repair = await service.rpc("task03d_issue_legacy_onboarding_token", {
    p_target_user_id: users.legacy.id,
    p_operator_id: users.adminfake.id,
    p_reason: "synthetic verified legacy owner review",
  });
  check("verified_operator_repair_issued", !repair.error, repair.error?.message);
  const repaired = await users.legacy.client.rpc("task03d_complete_self_signup", {
    p_full_name: "Legacy Repaired", p_country: "BH", p_role: "child",
  });
  check("repaired_legacy_profile_completed", !repaired.error && repaired.data === "child",
    repaired.error?.message);
  const repairAudit = query(
    `SELECT count(*) FROM public.profile_onboarding_repair_audit WHERE target_user_id='${users.legacy.id}'`,
  );
  check("legacy_repair_audited_once", repairAudit === "1", `count=${repairAudit}`);

  const teacherApproval = await service.rpc("task03d_approve_profile_role_request", {
    p_target_user_id: users.teacher.id,
    p_reviewer_id: users.adminfake.id,
    p_decision: "approved",
    p_reason: "synthetic verified teacher approval",
  });
  check("verified_teacher_approval", !teacherApproval.error && teacherApproval.data === "approved",
    teacherApproval.error?.message);
  const teacherRow = await service.from("profiles").select("role").eq("id", users.teacher.id).single();
  check("teacher_role_granted_by_approval", teacherRow.data?.role === "teacher", teacherRow.data?.role);
  const replayApproval = await service.rpc("task03d_approve_profile_role_request", {
    p_target_user_id: users.teacher.id,
    p_reviewer_id: users.adminfake.id,
    p_decision: "approved",
    p_reason: "synthetic replayed approval attempt",
  });
  check("approval_replay_denied", Boolean(replayApproval.error), replayApproval.error?.message);
  const approvalAudit = query(
    `SELECT count(*) FROM public.profile_role_review_audit WHERE target_user_id='${users.teacher.id}' AND decision='approved'`,
  );
  check("approval_audited_once", approvalAudit === "1", `count=${approvalAudit}`);

  const schoolRow = await service.from("profiles").select("role").eq("id", users.school.id).single();
  check("school_metadata_never_self_grants", schoolRow.data?.role === "student", schoolRow.data?.role);
  // adminfake is deliberately promoted to stored admin above so it can act as
  // the independently enrolled reviewer. Assert its original signup result,
  // captured before that server-side promotion, instead of the operator role.
  check("admin_metadata_never_self_grants", adminFakeInitialRole === "student", adminFakeInitialRole);

  const anonymousProfile = await anon.from("profiles").select("id").eq("id", users.student.id);
  check("anonymous_profile_read_denied", Boolean(anonymousProfile.error), anonymousProfile.error?.message);

  console.log(`TASK03E_INTEGRATION_SUMMARY pass=${passed.length} fail=${failed.length}`);
  if (failed.length) process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(`TASK03E_INTEGRATION_FATAL ${sanitize(error?.message || error)}`);
  process.exitCode = 1;
}
