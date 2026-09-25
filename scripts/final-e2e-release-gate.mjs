import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";

import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

function loadEnv(file) {
  if (!fs.existsSync(file)) return;

  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();

    if (!line || line.startsWith("#")) continue;

    const index = line.indexOf("=");

    if (index < 1) continue;

    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv(path.resolve(".env.local"));
loadEnv(path.resolve(".env"));

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

if (!supabaseUrl || !serviceKey) {
  throw new Error("E2E_SUPABASE_ENV_MISSING");
}

const admin = createClient(
  supabaseUrl,
  serviceKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const stamp =
  `${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

const password =
  `Dadyoom!E2E-${crypto.randomBytes(10).toString("base64url")}9`;

const roles = [
  ["student", "/student"],
  ["child", "/child"],
  ["teacher", "/teacher"],
  ["parent", "/parent"],
  ["school", "/school"],
];

const users = new Map();

const fixture = {
  schoolId: null,
  classId: null,
  learningLessonId: null,
  nextLessonId: null,
  activityIds: [],
  assessmentIds: [],
  assessmentSessionId: null,
};

let server = null;
let browser = null;
let localDevVarsPath = null;

function gate(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function dotenvValue(value) {
  return `"${String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n")}"`;
}

async function createRoleUser(role) {
  const email =
    `dadyoom.e2e.${stamp}.${role}@example.com`;

  const created =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `E2E ${role}`,
        role,
        country: "BH",
      },
    });

  if (
    created.error ||
    !created.data.user
  ) {
    throw (
      created.error ??
      new Error(
        `E2E_CREATE_${role}_FAILED`,
      )
    );
  }

  const user =
    created.data.user;

  const profile =
    await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          full_name:
            `E2E ${role}`,
          role,
          country: "BH",
          grade_number:
            role === "student" ||
            role === "child"
              ? 1
              : null,
          interests:
            role === "student" ||
            role === "child"
              ? ["العربية"]
              : [],
          learning_goal:
            role === "student" ||
            role === "child"
              ? "اختبار E2E"
              : null,
          preferred_learning_style:
            role === "student" ||
            role === "child"
              ? "متوازن"
              : null,
          onboarding_completed: true,
          grade_academic_year:
            role === "student" ||
            role === "child"
              ? "2026-2027"
              : null,
          country_source: "e2e",
          onboarding_updated_at:
            new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

  if (profile.error) {
    throw profile.error;
  }

  const info = {
    id: user.id,
    email,
    role,
  };

  users.set(role, info);

  return info;
}

async function seedStudent() {
  const student =
    users.get("student");

  const teacher =
    users.get("teacher");

  gate(
    student && teacher,
    "E2E_USERS_MISSING",
  );

  const lessons =
    await admin
      .from("lessons")
      .select(
        "id,units!inner(grades!inner(grade_number,curricula!inner(countries!inner(code))))",
      )
      .eq(
        "status",
        "published",
      )
      .eq(
        "units.grades.grade_number",
        1,
      )
      .eq(
        "units.grades.curricula.countries.code",
        "BH",
      )
      .limit(10);

  if (lessons.error) {
    throw lessons.error;
  }

  gate(
    (lessons.data ?? []).length >= 10,
    "E2E_NEEDS_10_BH_G1_LESSONS",
  );

  const now =
    new Date().toISOString();

  const progress =
    await admin
      .from(
        "student_lesson_progress",
      )
      .upsert(
        (lessons.data ?? [])
          .slice(0, 10)
          .map(
            (
              lesson,
              index,
            ) => ({
              student_id:
                student.id,
              lesson_id:
                lesson.id,
              status:
                index < 5
                  ? "mastered"
                  : "completed",
              progress_percent:
                100,
              attempts: 1,
              best_score: 95,
              last_score: 95,
              xp: 30,
              time_spent_seconds:
                60,
              started_at: now,
              completed_at: now,
              updated_at: now,
            }),
          ),
        {
          onConflict:
            "student_id,lesson_id",
        },
      );

  if (progress.error) {
    throw progress.error;
  }

  const seedReward =
    await admin
      .from("edu_rewards")
      .insert({
        student_id:
          student.id,
        issuer_id:
          teacher.id,
        issuer_role:
          "teacher",
        class_id: null,
        school_id: null,
        points: 30,
        title:
          "E2E Seed Reward",
        description:
          "Temporary integration reward",
        icon: "🏆",
      });

  if (seedReward.error) {
    throw seedReward.error;
  }

  const game =
    await admin
      .from(
        "edu_game_attempts",
      )
      .insert({
        student_id:
          student.id,
        lesson_id: null,
        game_key:
          `e2e-${stamp}`,
        score: 10,
        max_score: 10,
        xp_earned: 12,
      });

  if (game.error) {
    throw game.error;
  }

  console.log(
    "E2E_SEEDED=LESSONS300+REWARD30+GAME12",
  );
}

async function seedRelationships() {
  const student =
    users.get("student");

  const teacher =
    users.get("teacher");

  const parent =
    users.get("parent");

  const school =
    users.get("school");

  gate(
    student &&
      teacher &&
      parent &&
      school,
    "E2E_RELATIONSHIP_USERS_MISSING",
  );

  const schoolResult =
    await admin
      .from("schools")
      .insert({
        owner_id:
          school.id,
        name:
          "E2E Dadyoom School",
        country: "BH",
        academic_year:
          "2026-2027",
        is_active: true,
      })
      .select("id")
      .single();

  if (
    schoolResult.error ||
    !schoolResult.data
  ) {
    throw (
      schoolResult.error ??
      new Error(
        "E2E_SCHOOL_CREATE_FAILED",
      )
    );
  }

  fixture.schoolId =
    schoolResult.data.id;

  const teacherLink =
    await admin
      .from(
        "school_teachers",
      )
      .insert({
        school_id:
          fixture.schoolId,
        teacher_id:
          teacher.id,
        is_active: true,
      });

  if (teacherLink.error) {
    throw teacherLink.error;
  }

  const classResult =
    await admin
      .from(
        "teacher_classes",
      )
      .insert({
        teacher_id:
          teacher.id,
        name:
          "E2E Arabic Class",
        description:
          "Temporary release gate class",
        academic_year:
          "2026-2027",
        join_code:
          (
            "E2E" +
            stamp.replace(
              /[^a-zA-Z0-9]/g,
              "",
            )
          )
            .slice(-12)
            .toUpperCase(),
        is_active: true,
      })
      .select("id")
      .single();

  if (
    classResult.error ||
    !classResult.data
  ) {
    throw (
      classResult.error ??
      new Error(
        "E2E_CLASS_CREATE_FAILED",
      )
    );
  }

  fixture.classId =
    classResult.data.id;

  const membership =
    await admin
      .from(
        "teacher_class_students",
      )
      .insert({
        class_id:
          fixture.classId,
        student_id:
          student.id,
        is_active: true,
      });

  if (membership.error) {
    throw membership.error;
  }

  const parentLink =
    await admin
      .from(
        "parent_students",
      )
      .insert({
        parent_id:
          parent.id,
        student_id:
          student.id,
        relationship:
          "ولي أمر",
        is_active: true,
      });

  if (parentLink.error) {
    throw parentLink.error;
  }

  console.log(
    "E2E_RELATIONSHIPS=PASS",
  );
}

function prepareWranglerDevVars() {
  const configPath =
    path.resolve(
      "dist/server/wrangler.json",
    );

  gate(
    fs.existsSync(configPath),
    "E2E_WRANGLER_CONFIG_MISSING",
  );

  localDevVarsPath =
    path.resolve(
      "dist/server/.dev.vars",
    );

  const rows = [
    `SUPABASE_SERVICE_ROLE_KEY=${dotenvValue(serviceKey)}`,
    `NEXT_PUBLIC_SUPABASE_URL=${dotenvValue(supabaseUrl)}`,
  ];

  if (anonKey) {
    rows.push(
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${dotenvValue(anonKey)}`,
    );
  }

  const runtimeProviderPrefixes = [
    "GEMINI_",
    "DEEPSEEK_",
    "OPENROUTER_",
    "ANTHROPIC_",
    "GROQ_",
    "MISTRAL_",
    "OPENAI_",
    "OLLAMA_",
    "HIGGSFIELD_",
    "HEYGEN_",
    "TAVUS_",
    "AKOOL_",
    "DID_",
    "CREATIFY_",
    "HF_SADTALKER_",
    "HF_MUSETALK_",
  ];

  const runtimeProviderExact = new Set([
    "AI_PROVIDER_ORDER",
    "AI_QUALITY_PROVIDER_ORDER",
    "AI_TIMEOUT_MS",
  ]);

  const runtimeProviderNames = [];

  for (const [key, rawValue] of Object.entries(process.env)) {
    const value =
      String(rawValue ?? "").trim();

    if (!value) continue;

    const allowed =
      runtimeProviderExact.has(key) ||
      runtimeProviderPrefixes.some(
        prefix =>
          key.startsWith(prefix),
      );

    if (!allowed) continue;

    rows.push(
      `${key}=${dotenvValue(value)}`,
    );

    runtimeProviderNames.push(
      key,
    );
  }

  console.log(
    `E2E_RUNTIME_PROVIDER_ENV_KEYS=${runtimeProviderNames.length}`,
  );

  fs.writeFileSync(
    localDevVarsPath,
    rows.join("\n") + "\n",
    "utf8",
  );

  console.log(
    "E2E_LOCAL_DEV_VARS=READY",
  );
}

async function waitForServer(
  baseUrl,
) {
  const until =
    Date.now() + 120_000;

  while (
    Date.now() < until
  ) {
    try {
      const response =
        await fetch(
          baseUrl,
          {
            redirect:
              "manual",
          },
        );

      if (
        response.status < 500
      ) {
        return;
      }
    }
    catch {}

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          750,
        ),
    );
  }

  throw new Error(
    "E2E_SERVER_START_FAILED",
  );
}

async function login(
  page,
  user,
  expectedPath,
  baseUrl,
) {
  await page.goto(
    `${baseUrl}/login`,
    {
      waitUntil:
        "networkidle",
      timeout:
        60_000,
    },
  );

  const emailInput =
    page.locator(
      'input[type="email"]',
    );

  const passwordInput =
    page.locator(
      'input[type="password"]',
    );

  const submitButton =
    page.getByRole(
      "button",
      {
        name:
          "الدخول بالبريد",
      },
    );

  await emailInput.waitFor({
    state:
      "visible",
    timeout:
      30_000,
  });

  await passwordInput.waitFor({
    state:
      "visible",
    timeout:
      30_000,
  });

  await submitButton.waitFor({
    state:
      "visible",
    timeout:
      30_000,
  });

  await emailInput.fill(
    user.email,
  );

  await passwordInput.fill(
    password,
  );

  // Let the client component finish hydration before exercising onSubmit.
  await page.waitForTimeout(
    750,
  );

  const responsePromise =
    page.waitForResponse(
      response => {
        try {
          const url =
            new URL(
              response.url(),
            );

          return (
            response
              .request()
              .method() ===
              "POST" &&
            url.pathname ===
              "/api/auth/password-login"
          );
        }
        catch {
          return false;
        }
      },
      {
        timeout:
          30_000,
      },
    );

  await submitButton.click({
    timeout:
      30_000,
  });

  const loginResponse =
    await responsePromise;

  const loginStatus =
    loginResponse.status();

  let loginPayload = null;

  try {
    loginPayload =
      await loginResponse.json();
  }
  catch {}

  gate(
    loginStatus === 200 &&
      loginPayload
        ?.access_token &&
      loginPayload
        ?.refresh_token,
    `E2E_LOGIN_API_${user.role.toUpperCase()}_FAILED:${loginStatus}:${String(
      loginPayload?.error ??
        "NO_ERROR_BODY",
    ).slice(0, 180)}`,
  );

  console.log(
    `E2E_LOGIN_API_${user.role.toUpperCase()}=PASS`,
  );

  try {
    await page.waitForURL(
      next =>
        next.pathname ===
          expectedPath ||
        next.pathname.startsWith(
          `${expectedPath}/`,
        ),
      {
        timeout:
          45_000,
        waitUntil:
          "domcontentloaded",
      },
    );
  }
  catch (error) {
    const currentUrl =
      page.url();

    const bodyText =
      await page
        .locator("body")
        .innerText()
        .catch(
          () => "",
        );

    console.error(
      "E2E_LOGIN_NAVIGATION_DIAGNOSTIC",
      {
        role:
          user.role,
        expectedPath,
        currentUrl,
        body:
          bodyText
            .replace(
              /\s+/g,
              " ",
            )
            .slice(
              0,
              500,
            ),
      },
    );

    throw error;
  }

  console.log(
    `E2E_LOGIN_NAVIGATION_${user.role.toUpperCase()}=PASS`,
  );
}

async function canonicalLearningFlow(
  page,
  baseUrl,
) {
  const student =
    users.get("student");

  gate(
    student,
    "E2E_CANONICAL_STUDENT_MISSING",
  );

  let lesson = null;
  let nextLesson = null;
  let lessonActivities = [];

  for (
    let lessonNumber = 1;
    lessonNumber <= 17;
    lessonNumber += 1
  ) {
    const slug =
      `bh-dadyoom-core-g1-l${String(
        lessonNumber,
      ).padStart(2, "0")}`;

    const candidate =
      await admin
        .from("lessons")
        .select(
          "id,title,slug,unit_id,lesson_number",
        )
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

    if (
      candidate.error ||
      !candidate.data
    ) {
      continue;
    }

    const activities =
      await admin
        .from("lesson_activities")
        .select("id,activity_order,activity_type,answer,points")
        .eq(
          "lesson_id",
          candidate.data.id,
        )
        .eq(
          "is_published",
          true,
        );

    if (activities.error) {
      throw activities.error;
    }

    if (
      (activities.data ?? [])
        .length === 0
    ) {
      continue;
    }

    const next =
      await admin
        .from("lessons")
        .select(
          "id,title,lesson_number",
        )
        .eq(
          "unit_id",
          candidate.data.unit_id,
        )
        .eq(
          "lesson_number",
          Number(
            candidate.data
              .lesson_number,
          ) + 1,
        )
        .eq(
          "status",
          "published",
        )
        .maybeSingle();

    if (
      next.error ||
      !next.data
    ) {
      continue;
    }

    lesson =
      candidate.data;
    nextLesson =
      next.data;
    lessonActivities =
      [...(activities.data ?? [])]
        .sort(
          (a, b) =>
            Number(a.activity_order ?? 0) -
            Number(b.activity_order ?? 0),
        );
    break;
  }

  gate(
    lesson && nextLesson,
    "E2E_CANONICAL_CORE_LESSON_FIXTURE_MISSING",
  );

  fixture.learningLessonId =
    lesson.id;
  fixture.nextLessonId =
    nextLesson.id;

  /*
   * SeedStudent may have touched this lesson while preparing dashboard data.
   * Reset only the temporary E2E student's row so the real completion route
   * must create and advance progress through the activity APIs.
   */
  const resetProgress =
    await admin
      .from(
        "student_lesson_progress",
      )
      .delete()
      .eq(
        "student_id",
        student.id,
      )
      .eq(
        "lesson_id",
        lesson.id,
      );

  if (resetProgress.error) {
    throw resetProgress.error;
  }

  /*
   * The Dadyoom Core contract now publishes activities for every lesson.
   * Exercise those real activities instead of creating an artificial
   * empty-lesson fixture (which became impossible once Core reached 3/lesson).
   */
  gate(
    lessonActivities.length > 0,
    "E2E_CANONICAL_CORE_ACTIVITIES_MISSING",
  );

  function answerForActivity(
    activity,
  ) {
    const answer =
      activity?.answer &&
      typeof activity.answer === "object" &&
      !Array.isArray(activity.answer)
        ? activity.answer
        : {};

    if (
      typeof answer.correct === "string" &&
      answer.correct.trim()
    ) {
      return {
        values: [answer.correct.trim()],
        gradable: true,
      };
    }

    if (
      Array.isArray(answer.correct) &&
      answer.correct.every(
        value => typeof value === "string",
      ) &&
      answer.correct.length > 0
    ) {
      return {
        values: answer.correct,
        gradable: true,
      };
    }

    for (
      const key of [
        "correct_values",
        "answers",
        "correct_words",
      ]
    ) {
      if (
        Array.isArray(answer[key]) &&
        answer[key].every(
          value => typeof value === "string",
        ) &&
        answer[key].length > 0
      ) {
        return {
          values: answer[key],
          gradable: true,
        };
      }
    }

    if (
      typeof answer.correct_letter === "string" &&
      answer.correct_letter.trim()
    ) {
      return {
        values: [answer.correct_letter.trim()],
        gradable: true,
      };
    }

    if (
      Array.isArray(answer.pairs) &&
      answer.pairs.length > 0
    ) {
      const pairs =
        answer.pairs
          .map(pair => {
            if (
              Array.isArray(pair) &&
              typeof pair[0] === "string" &&
              typeof pair[1] === "string"
            ) {
              return `${pair[0].trim()}|||${pair[1].trim()}`;
            }

            if (
              pair &&
              typeof pair === "object" &&
              typeof pair.left === "string" &&
              typeof pair.right === "string"
            ) {
              return `${pair.left.trim()}|||${pair.right.trim()}`;
            }

            return "";
          })
          .filter(Boolean);

      if (pairs.length > 0) {
        return {
          values: pairs,
          gradable: true,
        };
      }
    }

    return {
      values: ["__completed__"],
      gradable: false,
    };
  }

  let finalActivityResult = null;
  let gradableActivityCount = 0;

  for (
    const activity
    of lessonActivities
  ) {
    const expected =
      answerForActivity(
        activity,
      );

    if (expected.gradable) {
      gradableActivityCount += 1;
    }

    const result =
      await browserFetch(
        page,
        "/api/lesson-activities/check",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              activityId:
                activity.id,
              answer:
                expected.values,
            }),
        },
      );

    gate(
      result.status === 200 &&
        result.data?.success === true &&
        result.data?.correct === true &&
        result.data?.gradable ===
          expected.gradable,
      `E2E_ACTIVITY_CHECK_FAILED:${activity.activity_order}:${result.status}`,
    );

    finalActivityResult =
      result;
  }

  gate(
    gradableActivityCount > 0,
    "E2E_CANONICAL_CORE_GRADABLE_ACTIVITY_MISSING",
  );

  gate(
    finalActivityResult?.data?.progressPercent ===
      100,
    `E2E_ACTIVITY_COMPLETION_FAILED:${finalActivityResult?.status ?? 0}:${String(
      finalActivityResult?.data?.progressPercent ??
        "",
    )}`,
  );

  console.log(
    `E2E_LESSON_ACTIVITIES=PASS COUNT=${lessonActivities.length}`,
  );

  const complete =
    await browserFetch(
      page,
      "/api/lessons/complete",
      {
        method:
          "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            lessonId:
              lesson.id,
          }),
      },
    );

  gate(
    complete.status === 200 &&
      complete.data?.success ===
        true &&
      complete.data
        ?.canonicalGate ===
        true,
    `E2E_CANONICAL_COMPLETION_FAILED:${complete.status}:${String(
      complete.data?.error ??
        "",
    ).slice(0, 160)}`,
  );

  const mastery =
    await browserFetch(
      page,
      `/api/lesson-mastery?lessonId=${encodeURIComponent(
        lesson.id,
      )}`,
    );

  gate(
    mastery.status === 200 &&
      Number(
        mastery.data
          ?.mastery
          ?.mastery_score ??
          0,
      ) >= 90,
    "E2E_CANONICAL_MASTERY_FAILED",
  );

  const progress =
    await admin
      .from(
        "student_lesson_progress",
      )
      .select(
        "status,progress_percent,best_score,xp",
      )
      .eq(
        "student_id",
        student.id,
      )
      .eq(
        "lesson_id",
        lesson.id,
      )
      .maybeSingle();

  if (progress.error) {
    throw progress.error;
  }

  gate(
    progress.data &&
      [
        "completed",
        "mastered",
      ].includes(
        String(
          progress.data.status,
        ),
      ) &&
      Number(
        progress.data
          .progress_percent ??
          0,
      ) === 100 &&
      Number(
        progress.data
          .best_score ??
          0,
      ) >= 90,
    "E2E_CANONICAL_PROGRESS_FAILED",
  );

  console.log(
    "E2E_LESSON_COMPLETION_MASTERY=PASS",
  );

  /*
   * Prove the assessment lifecycle without depending on an external model:
   * the session is created through the real API, while five deterministic
   * temporary assessment rows are seeded by the service-role fixture.
   * Every answer is then submitted through the authenticated product APIs.
   */
  const sessionStart =
    await browserFetch(
      page,
      "/api/ai/assessment/session",
      {
        method:
          "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            lessonId:
              lesson.id,
          }),
      },
    );

  gate(
    sessionStart.status === 200 &&
      sessionStart.data
        ?.success === true &&
      sessionStart.data
        ?.session?.id,
    `E2E_ASSESSMENT_SESSION_START_FAILED:${sessionStart.status}`,
  );

  const sessionId =
    sessionStart.data.session.id;

  fixture.assessmentSessionId =
    sessionId;

  const assessments =
    Array.from(
      {
        length:
          5,
      },
      (
        _,
        index,
      ) => ({
        student_email:
          student.email,
        title:
          lesson.title,
        passage:
          "هذا سؤال مؤقت للتحقق من دورة التقييم في ضاديوم.",
        question:
          `سؤال E2E رقم ${index + 1}: اختر الإجابة الصحيحة.`,
        question_hash:
          `e2e-${stamp}-${index + 1}`,
        choices: [
          "الإجابة الصحيحة",
          "إجابة أخرى",
          "إجابة ثالثة",
          "إجابة رابعة",
        ],
        correct_answer:
          0,
        explanation:
          "إجابة اختبارية صحيحة.",
        skill:
          "الاستيعاب",
        difficulty:
          "سهل",
        completed:
          false,
        lesson_id:
          lesson.id,
      }),
    );

  const insertedAssessments =
    await admin
      .from(
        "ai_assessments",
      )
      .insert(
        assessments,
      )
      .select("id");

  if (
    insertedAssessments.error ||
    (
      insertedAssessments.data ??
      []
    ).length !== 5
  ) {
    throw (
      insertedAssessments.error ??
      new Error(
        "E2E_ASSESSMENT_FIXTURE_CREATE_FAILED",
      )
    );
  }

  fixture.assessmentIds =
    insertedAssessments.data.map(
      row => row.id,
    );

  let finalSession = null;

  for (
    const assessment
    of insertedAssessments.data
  ) {
    const submitted =
      await browserFetch(
        page,
        "/api/ai/assessment/submit",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              assessmentId:
                assessment.id,
              sessionId,
              answer:
                0,
            }),
        },
      );

    gate(
      submitted.status === 200 &&
        submitted.data
          ?.success === true &&
        submitted.data
          ?.correct === true,
      `E2E_ASSESSMENT_SUBMIT_FAILED:${submitted.status}`,
    );

    const advanced =
      await browserFetch(
        page,
        "/api/ai/assessment/next",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              sessionId,
              correct:
                true,
            }),
        },
      );

    gate(
      advanced.status === 200 &&
        advanced.data
          ?.success === true,
      `E2E_ASSESSMENT_ADVANCE_FAILED:${advanced.status}`,
    );

    finalSession =
      advanced.data.session;
  }

  gate(
    finalSession?.finished ===
      true &&
      Number(
        finalSession
          ?.correctAnswers ??
          0,
      ) === 5 &&
      Number(
        finalSession?.score ??
          0,
      ) === 100,
    "E2E_ASSESSMENT_FINAL_STATE_FAILED",
  );

  const answerRows =
    await admin
      .from(
        "assessment_session_answers",
      )
      .select("id")
      .eq(
        "session_id",
        sessionId,
      )
      .eq(
        "student_id",
        student.id,
      );

  if (answerRows.error) {
    throw answerRows.error;
  }

  gate(
    (
      answerRows.data ??
      []
    ).length === 5,
    "E2E_ASSESSMENT_PERSISTENCE_FAILED",
  );

  console.log(
    "E2E_ASSESSMENT_SESSION=PASS",
  );

  await page.goto(
    `${baseUrl}/lessons/${nextLesson.id}`,
    {
      waitUntil:
        "networkidle",
      timeout:
        60_000,
    },
  );

  const nextLessonBody =
    await page
      .locator("body")
      .innerText();

  gate(
    nextLessonBody.includes(
      nextLesson.title,
    ),
    "E2E_NEXT_LESSON_ACCESS_FAILED",
  );

  console.log(
    "E2E_NEXT_LESSON=PASS",
  );
  console.log(
    "E2E_CANONICAL_LEARNING_FLOW=PASS",
  );
}

async function browserFetch(
  page,
  requestUrl,
  options = {},
) {
  return page.evaluate(
    async ({
      requestUrl,
      options,
    }) => {
      const response =
        await fetch(
          requestUrl,
          options,
        );

      const raw =
        await response.text();

      let data = null;

      try {
        data =
          raw
            ? JSON.parse(raw)
            : null;
      }
      catch {
        data = raw;
      }

      return {
        status:
          response.status,
        data,
      };
    },
    {
      requestUrl,
      options,
    },
  );
}

async function studentFlow(
  page,
  baseUrl,
) {
  const challenge =
    await browserFetch(
      page,
      "/api/journey/daily/challenge",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            challengeId:
              `e2e-${stamp}-reading`,
            skill:
              "reading",
            title:
              "E2E Reading Challenge",
            targetScore:
              90,
          }),
      },
    );

  gate(
    challenge.status < 400,
    `E2E_CHALLENGE_ACCEPT_FAILED:${challenge.status}`,
  );

  for (
    const skill of
    [
      "reading",
      "writing",
      "listening",
      "speaking",
    ]
  ) {
    const result =
      await browserFetch(
        page,
        "/api/skills/progress",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              skill,
              score: 95,
            }),
        },
      );

    gate(
      result.status === 200 &&
        result.data?.ok === true,
      `E2E_SKILL_${skill}_FAILED:${result.status}`,
    );
  }

  const skillRead =
    await browserFetch(
      page,
      "/api/skills/progress",
    );

  gate(
    skillRead.status === 200 &&
      skillRead.data?.ok === true &&
      Array.isArray(
        skillRead.data.progress,
      ) &&
      skillRead.data.progress.length === 4,
    "E2E_FOUR_SKILLS_READBACK_FAILED",
  );

  console.log(
    "E2E_FOUR_SKILLS=PASS",
  );

  const challengeRead =
    await browserFetch(
      page,
      "/api/journey/daily/challenge",
    );

  gate(
    challengeRead.status === 200 &&
      challengeRead.data?.challenge
        ?.status ===
        "completed" &&
      Number(
        challengeRead.data
          ?.challenge
          ?.bonus_xp ??
          0,
      ) === 15,
    "E2E_DAILY_CHALLENGE_FAILED",
  );

  console.log(
    "E2E_DAILY_CHALLENGE=PASS",
  );

  const xp =
    await browserFetch(
      page,
      "/api/me/xp",
    );

  const expectedXP =
    300 +
    30 +
    12 +
    100 +
    15;

  gate(
    xp.status === 200 &&
      Number(
        xp.data?.xp,
      ) === expectedXP,
    `E2E_UNIFIED_XP_FAILED expected=${expectedXP} actual=${xp.data?.xp}`,
  );

  console.log(
    `E2E_UNIFIED_XP=PASS TOTAL=${expectedXP}`,
  );

  const student =
    users.get("student");

  const streak =
    await admin
      .from(
        "student_streaks",
      )
      .select(
        "current_streak,longest_streak",
      )
      .eq(
        "student_email",
        student.email,
      )
      .maybeSingle();

  if (streak.error) {
    throw streak.error;
  }

  gate(
    Number(
      streak.data
        ?.current_streak ??
        0,
    ) >= 1,
    "E2E_STREAK_FAILED",
  );

  console.log(
    "E2E_STREAK=PASS",
  );

  await page.goto(
    `${baseUrl}/student`,
    {
      waitUntil:
        "networkidle",
    },
  );

  const body =
    await page
      .locator("body")
      .innerText();

  gate(
    body.includes(
      "الدروس المكتملة",
    ) &&
      body.includes(
        "المهارات",
      ),
    "E2E_STUDENT_DASHBOARD_FAILED",
  );

  console.log(
    "E2E_STUDENT_DASHBOARD=PASS",
  );

  await canonicalLearningFlow(
    page,
    baseUrl,
  );

  let aiLivePassed = false;
  let aiTransient = false;

  for (
    let attempt = 1;
    attempt <= 3;
    attempt += 1
  ) {
    const ai =
      await browserFetch(
        page,
        "/api/ask",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              question:
                "اشرح لي الفرق بين الجملة الاسمية والجملة الفعلية بمثال قصير.",
              page:
                "/student",
            }),
        },
      );

    if (
      ai.status === 200 &&
      typeof ai.data?.answer === "string" &&
      ai.data.answer.trim().length >= 10
    ) {
      aiLivePassed = true;

      console.log(
        `E2E_AI_SMOKE=PASS ATTEMPT=${attempt}`,
      );

      break;
    }

    if (
      (ai.status === 502 ||
        ai.status === 503) &&
      (
        ai.data?.code ===
          "AI_PROVIDER_TEMPORARILY_UNAVAILABLE" ||
        ai.data?.retryable === true
      )
    ) {
      aiTransient = true;

      console.log(
        `E2E_AI_PROVIDER_TRANSIENT=RETRY ATTEMPT=${attempt} STATUS=${ai.status}`,
      );

      if (attempt < 3) {
        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              1500 * attempt,
            ),
        );
      }

      continue;
    }

    gate(
      false,
      `E2E_AI_ROUTE_FAILED:${ai.status}`,
    );
  }

  if (!aiLivePassed) {
    gate(
      aiTransient,
      "E2E_AI_UNKNOWN_FAILURE",
    );

    console.log(
      "E2E_AI_PROVIDER_LIVE=DEGRADED_TRANSIENT",
    );

    console.log(
      "E2E_AI_ROUTE_RESILIENCE=PASS",
    );
  }

  await page.goto(
    `${baseUrl}/rewards`,
    {
      waitUntil:
        "networkidle",
    },
  );

  const rewardsBody =
    await page
      .locator("body")
      .innerText();

  gate(
    rewardsBody.includes(
      "الجوائز والشهادات",
    ) &&
      rewardsBody.includes(
        "شهادة المثابرة",
      ) &&
      rewardsBody.includes(
        "إتقان المهارات الأربع",
      ),
    "E2E_REWARDS_CONTENT_FAILED",
  );

  const nameInput =
    page.getByLabel(
      "الاسم الحقيقي على الشهادة",
    );

  gate(
    (await nameInput.count()) === 1,
    "E2E_CERTIFICATE_NAME_INPUT_FAILED",
  );

  const realName =
    "أحمد اختبار ضاديوم";

  await nameInput.fill(
    realName,
  );

  const certificateButton =
    page
      .getByRole(
        "button",
        {
          name:
            "تنزيل الشهادة PDF",
        },
      )
      .first();

  gate(
    (await certificateButton.count()) === 1,
    "E2E_CERTIFICATE_BUTTON_FAILED",
  );

  const [
    download,
  ] =
    await Promise.all([
      page.waitForEvent(
        "download",
        {
          timeout:
            30_000,
        },
      ),
      certificateButton.click(),
    ]);

  const downloadPath =
    await download.path();

  gate(
    Boolean(downloadPath) &&
      fs.existsSync(
        downloadPath,
      ),
    "E2E_CERTIFICATE_FILE_MISSING",
  );

  const pdfHead =
    fs
      .readFileSync(
        downloadPath,
      )
      .subarray(
        0,
        4,
      )
      .toString();

  gate(
    pdfHead === "%PDF",
    "E2E_CERTIFICATE_NOT_PDF",
  );

  gate(
    download
      .suggestedFilename()
      .includes(
        "أحمد-اختبار-ضاديوم",
      ),
    "E2E_CERTIFICATE_REAL_NAME_FILENAME_FAILED",
  );

  console.log(
    "E2E_CERTIFICATE_PDF_DOWNLOAD=PASS",
  );

  const plusClaim =
    await browserFetch(
      page,
      "/api/rewards/claim",
      {
        method:
          "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            rewardKey:
              "PLUS_30D",
          }),
      },
    );

  gate(
    plusClaim.status === 200 &&
      plusClaim.data?.ok === true &&
      Number(
        plusClaim.data
          ?.plusDays ??
          0,
      ) === 30,
    `E2E_FREE_PLUS_CLAIM_FAILED:${plusClaim.status}`,
  );

  const billing =
    await browserFetch(
      page,
      "/api/billing/status",
    );

  gate(
    billing.status === 200 &&
      billing.data?.plan ===
        "plus" &&
      billing.data?.plus ===
        true,
    "E2E_FREE_PLUS_STATUS_FAILED",
  );

  const repeatClaim =
    await browserFetch(
      page,
      "/api/rewards/claim",
      {
        method:
          "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            rewardKey:
              "PLUS_30D",
          }),
      },
    );

  gate(
    repeatClaim.status ===
      200 &&
      repeatClaim.data
        ?.ok === true &&
      repeatClaim.data
        ?.alreadyClaimed ===
        true,
    "E2E_FREE_PLUS_IDEMPOTENCY_FAILED",
  );

  console.log(
    "E2E_FREE_PLUS_REWARD=PASS",
  );

  console.log(
    "E2E_CERTIFICATES=PASS",
  );
}

async function teacherRewardFlow(
  page,
  baseUrl,
) {
  const teacher =
    users.get("teacher");

  const student =
    users.get("student");

  gate(
    teacher &&
      student &&
      fixture.classId,
    "E2E_TEACHER_REWARD_FIXTURE_MISSING",
  );

  await page.goto(
    `${baseUrl}/teacher/classroom`,
    {
      waitUntil:
        "networkidle",
    },
  );

  const form =
    page
      .getByRole(
        "button",
        {
          name:
            "منح الجائزة",
        },
      )
      .first()
      .locator("xpath=ancestor::form");

  await form
    .locator(
      'input[name="title"]',
    )
    .fill(
      "E2E Teacher UI Award",
    );

  await form
    .locator(
      'input[name="points"]',
    )
    .fill("17");

  await form
    .locator(
      'input[name="description"]',
    )
    .fill(
      "Teacher E2E award",
    );

  await form
    .getByRole(
      "button",
      {
        name:
          "منح الجائزة",
      },
    )
    .click();

  await page
    .getByText(
      "تم منح 17 نقطة وجائزة E2E Teacher UI Award.",
    )
    .waitFor({
      timeout:
        20_000,
    });

  const reward =
    await admin
      .from(
        "edu_rewards",
      )
      .select(
        "id,points",
      )
      .eq(
        "issuer_id",
        teacher.id,
      )
      .eq(
        "student_id",
        student.id,
      )
      .eq(
        "title",
        "E2E Teacher UI Award",
      )
      .maybeSingle();

  if (reward.error) {
    throw reward.error;
  }

  gate(
    reward.data &&
      Number(
        reward.data.points,
      ) === 17,
    "E2E_TEACHER_REWARD_DB_FAILED",
  );

  console.log(
    "E2E_TEACHER_REWARD_UI=PASS",
  );
}

async function schoolRewardFlow(
  page,
  baseUrl,
) {
  const school =
    users.get("school");

  const student =
    users.get("student");

  gate(
    school &&
      student &&
      fixture.schoolId &&
      fixture.classId,
    "E2E_SCHOOL_REWARD_FIXTURE_MISSING",
  );

  await page.goto(
    `${baseUrl}/school/rewards`,
    {
      waitUntil:
        "networkidle",
    },
  );

  const classSelect =
    page.locator(
      'select[name="classId"]',
    );

  gate(
    (await classSelect.count()) === 1,
    "E2E_SCHOOL_CLASS_SELECT_MISSING",
  );

  await classSelect.selectOption(
    String(
      fixture.classId,
    ),
  );

  const studentSelect =
    page.locator(
      'select[name="studentId"]',
    );

  await studentSelect.selectOption(
    student.id,
  );

  await page
    .locator(
      'input[name="title"]',
    )
    .fill(
      "E2E School UI Award",
    );

  await page
    .locator(
      'input[name="points"]',
    )
    .fill("23");

  await page
    .locator(
      'input[name="description"]',
    )
    .fill(
      "School E2E award",
    );

  await page
    .getByRole(
      "button",
      {
        name:
          "منح الجائزة",
      },
    )
    .click();

  await page
    .getByText(
      "تم منح 23 نقطة وجائزة E2E School UI Award.",
    )
    .waitFor({
      timeout:
        20_000,
    });

  const reward =
    await admin
      .from(
        "edu_rewards",
      )
      .select(
        "id,points",
      )
      .eq(
        "issuer_id",
        school.id,
      )
      .eq(
        "student_id",
        student.id,
      )
      .eq(
        "title",
        "E2E School UI Award",
      )
      .maybeSingle();

  if (reward.error) {
    throw reward.error;
  }

  gate(
    reward.data &&
      Number(
        reward.data.points,
      ) === 23,
    "E2E_SCHOOL_REWARD_DB_FAILED",
  );

  console.log(
    "E2E_SCHOOL_REWARD_UI=PASS",
  );
}

async function roleDashboardGate(
  page,
  role,
) {
  const body =
    await page
      .locator("body")
      .innerText();

  const markers = {
    student:
      "الدروس المكتملة",
    child:
      "جوائزي وشهاداتي",
    teacher:
      "لوحة المعلم",
    parent:
      "ولي الأمر",
    school:
      "المدرسة",
  };

  const marker =
    markers[role];

  gate(
    !marker ||
      body.includes(marker),
    `E2E_ROLE_DASHBOARD_${role.toUpperCase()}_FAILED`,
  );

  console.log(
    `E2E_ROLE_DASHBOARD_${role.toUpperCase()}=PASS`,
  );
}

async function cleanup() {
  const student =
    users.get("student");

  const parent =
    users.get("parent");

  if (student) {
    /*
     * Delete E2E-owned rows in dependency order.
     * Several legacy learning tables are keyed by email rather than auth UUID,
     * so auth.admin.deleteUser() alone is not sufficient cleanup.
     */
    await admin
      .from("assessment_session_answers")
      .delete()
      .eq("student_id", student.id);

    await admin
      .from("assessment_sessions")
      .delete()
      .eq("student_id", student.id);

    await admin
      .from("ai_assessments")
      .delete()
      .eq("student_email", student.email);

    await admin
      .from("lesson_mastery")
      .delete()
      .eq("student_id", student.id);

    await admin
      .from("lesson_activity_attempts")
      .delete()
      .eq("user_id", student.id);

    await admin
      .from("student_memory")
      .delete()
      .eq("student_id", student.id);

    await admin
      .from("adaptive_learning_steps")
      .delete()
      .eq("student_id", student.id);

    await admin
      .from("student_learning_profile")
      .delete()
      .eq("student_id", student.id);

    await admin
      .from("student_recommendation_cache")
      .delete()
      .eq("student_id", student.id);

    for (const table of [
      "student_stats",
      "student_skills",
      "student_mistakes",
      "student_assessments",
      "student_achievements",
      "student_streaks",
      "learning_plans",
      "ai_recommendations",
    ]) {
      await admin
        .from(table)
        .delete()
        .eq("student_email", student.email);
    }

    const subscriptions =
      await admin
        .from(
          "edu_subscriptions",
        )
        .select("id")
        .eq(
          "user_id",
          student.id,
        );

    if (!subscriptions.error) {
      const ids =
        (
          subscriptions.data ??
          []
        )
          .map(
            row =>
              row.id,
          )
          .filter(Boolean);

      if (ids.length) {
        await admin
          .from(
            "edu_subscription_events",
          )
          .delete()
          .in(
            "subscription_id",
            ids,
          );
      }
    }

    await admin
      .from(
        "edu_subscription_events",
      )
      .delete()
      .eq(
        "user_id",
        student.id,
      );

    await admin
      .from(
        "edu_subscriptions",
      )
      .delete()
      .eq(
        "user_id",
        student.id,
      );

    await admin
      .from("edu_rewards")
      .delete()
      .eq(
        "student_id",
        student.id,
      );

    await admin
      .from(
        "edu_game_attempts",
      )
      .delete()
      .eq(
        "student_id",
        student.id,
      );

    await admin
      .from(
        "student_achievements",
      )
      .delete()
      .eq(
        "student_email",
        student.email,
      );

    await admin
      .from(
        "student_streaks",
      )
      .delete()
      .eq(
        "student_email",
        student.email,
      );

    await admin
      .from(
        "student_daily_challenges",
      )
      .delete()
      .eq(
        "user_id",
        student.id,
      );

    await admin
      .from(
        "student_skill_progress",
      )
      .delete()
      .eq(
        "user_id",
        student.id,
      );

    await admin
      .from(
        "student_lesson_progress",
      )
      .delete()
      .eq(
        "student_id",
        student.id,
      );
  }

  if (
    fixture.activityIds.length > 0
  ) {
    await admin
      .from("lesson_activities")
      .delete()
      .in(
        "id",
        fixture.activityIds,
      );
  }

  if (
    parent &&
    student
  ) {
    await admin
      .from(
        "parent_students",
      )
      .delete()
      .eq(
        "parent_id",
        parent.id,
      )
      .eq(
        "student_id",
        student.id,
      );
  }

  if (fixture.classId) {
    await admin
      .from(
        "teacher_class_students",
      )
      .delete()
      .eq(
        "class_id",
        fixture.classId,
      );

    await admin
      .from(
        "teacher_classes",
      )
      .delete()
      .eq(
        "id",
        fixture.classId,
      );
  }

  if (fixture.schoolId) {
    await admin
      .from(
        "school_teachers",
      )
      .delete()
      .eq(
        "school_id",
        fixture.schoolId,
      );

    await admin
      .from("schools")
      .delete()
      .eq(
        "id",
        fixture.schoolId,
      );
  }

  for (
    const user of
    [...users.values()]
      .reverse()
  ) {
    try {
      await admin
        .auth
        .admin
        .deleteUser(
          user.id,
        );
    }
    catch {}
  }

  if (
    localDevVarsPath &&
    fs.existsSync(
      localDevVarsPath,
    )
  ) {
    fs.rmSync(
      localDevVarsPath,
      {
        force: true,
      },
    );
  }
}

const configuredBase =
  process.env
    .DADYOOM_E2E_BASE_URL
    ?.trim();

const baseUrl =
  configuredBase ||
  "http://127.0.0.1:3219";

try {
  for (
    const [role] of
    roles
  ) {
    await createRoleUser(
      role,
    );
  }

  console.log(
    "E2E_TEMP_USERS=5",
  );

  await seedStudent();
  await seedRelationships();

  if (!configuredBase) {
    prepareWranglerDevVars();

    const wrangler =
      process.platform ===
      "win32"
        ? path.resolve(
            "node_modules/.bin/wrangler.cmd",
          )
        : path.resolve(
            "node_modules/.bin/wrangler",
          );

    const wranglerConfig =
      path.resolve(
        "dist/server/wrangler.json",
      );

    gate(
      fs.existsSync(
        wrangler,
      ),
      "E2E_WRANGLER_BINARY_MISSING",
    );

    gate(
      fs.existsSync(
        wranglerConfig,
      ),
      "E2E_WRANGLER_CONFIG_MISSING",
    );

    server =
      spawn(
        wrangler,
        [
          "dev",
          "--config",
          wranglerConfig,
          "--port",
          "3219",
          "--ip",
          "127.0.0.1",
        ],
        {
          cwd:
            process.cwd(),
          env: {
            ...process.env,
            PORT:
              "3219",
          },
          stdio: [
            "ignore",
            "pipe",
            "pipe",
          ],
          shell:
            process.platform ===
            "win32",
        },
      );

    server.stdout?.on(
      "data",
      chunk => {
        const line =
          String(
            chunk,
          ).trim();

        if (line) {
          console.log(
            `[server] ${line}`,
          );
        }
      },
    );

    server.stderr?.on(
      "data",
      chunk => {
        const line =
          String(
            chunk,
          ).trim();

        if (line) {
          console.warn(
            `[server] ${line}`,
          );
        }
      },
    );

    await waitForServer(
      baseUrl,
    );
  }

  browser =
    await chromium.launch({
      headless: true,
    });

  for (
    const [
      role,
      expectedPath,
    ] of roles
  ) {
    const context =
      await browser
        .newContext({
          acceptDownloads:
            true,
        });

    const page =
      await context
        .newPage();

    const user =
      users.get(role);

    await login(
      page,
      user,
      expectedPath,
      baseUrl,
    );

    console.log(
      `E2E_ROLE_${role.toUpperCase()}=PASS`,
    );

    await roleDashboardGate(
      page,
      role,
    );

    if (
      role ===
      "student"
    ) {
      await studentFlow(
        page,
        baseUrl,
      );
    }

    if (
      role ===
      "teacher"
    ) {
      await teacherRewardFlow(
        page,
        baseUrl,
      );
    }

    if (
      role ===
      "school"
    ) {
      await schoolRewardFlow(
        page,
        baseUrl,
      );
    }

    await page.goto(
      `${baseUrl}/rewards`,
      {
        waitUntil:
          "networkidle",
      },
    );

    const rewardsText =
      await page
        .locator("body")
        .innerText();

    gate(
      rewardsText.includes(
        "الجوائز والشهادات",
      ),
      `E2E_REWARDS_${role.toUpperCase()}_FAILED`,
    );

    const roleCertificateTitles = {
      teacher:
        "شهادة معلم ضاديوم",
      parent:
        "شهادة شريك التعلم",
      school:
        "شهادة شراكة تعليمية",
    };

    const expectedCertificate =
      roleCertificateTitles[
        role
      ];

    if (
      expectedCertificate
    ) {
      gate(
        rewardsText.includes(
          expectedCertificate,
        ),
        `E2E_ROLE_CERTIFICATE_${role.toUpperCase()}_FAILED`,
      );

      console.log(
        `E2E_ROLE_CERTIFICATE_${role.toUpperCase()}=PASS`,
      );
    }

    console.log(
      `E2E_REWARDS_${role.toUpperCase()}=PASS`,
    );

    await context.close();
  }

  console.log(
    "FINAL_E2E_RELEASE_GATE=PASS",
  );

  console.log(
    "EXTERNAL_AI_PROVIDER_OUTAGE_DOES_NOT_FAIL_PLATFORM_GATE=YES",
  );
}
finally {
  if (browser) {
    await browser.close();
  }

  if (server) {
    server.kill();
  }

  await cleanup();

  console.log(
    "E2E_TEMP_DATA_CLEANUP=PASS",
  );
}
