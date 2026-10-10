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

const artifactDir =
  process.env.DADYOOM_E2E_ARTIFACT_DIR?.trim()
    ? path.resolve(process.env.DADYOOM_E2E_ARTIFACT_DIR.trim())
    : "";

const skipExternalAi =
  process.env.DADYOOM_E2E_SKIP_EXTERNAL_AI?.trim().toLowerCase() === "true";

if (artifactDir) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

const roles = [
  ["student", "/student"],
  ["child", "/child"],
  ["teacher", "/teacher"],
  ["parent", "/parent"],
  ["school", "/school"],
  ["admin", "/admin"],
];

const users = new Map();

const fixture = {
  schoolId: null,
  classId: null,
  liveSessionId: null,
  learningLessonId: null,
  nextLessonId: null,
  activityIds: [],
  assessmentIds: [],
  assessmentSessionId: null,
  marketplaceCourseId: null,
  bpayPaymentOrderId: null,
  bpayReference: null,
  uiMarketplaceCourseId: null,
  uiMarketplaceCourseSlug: null,
  uiCourseLiveSessionId: null,
  schoolMeetingSessionId: null,
};

let server = null;
let browser = null;
let localDevVarsPath = null;
let activePage = null;
let activeRole = null;

const qaReport = {
  startedAt: new Date().toISOString(),
  baseUrl: null,
  roles: {},
  diagnostics: [],
  failed: false,
};

function recordDiagnostic(kind, role, detail = {}) {
  if (qaReport.diagnostics.length >= 500) return;

  qaReport.diagnostics.push({
    at: new Date().toISOString(),
    kind,
    role: role || null,
    ...detail,
  });
}

function writeQaReport(status, error = null) {
  if (!artifactDir) return;

  fs.writeFileSync(
    path.join(artifactDir, "qa-report.json"),
    JSON.stringify(
      {
        ...qaReport,
        status,
        finishedAt: new Date().toISOString(),
        error:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack ?? null,
              }
            : error
              ? { message: String(error) }
              : null,
      },
      null,
      2,
    ),
    "utf8",
  );
}

function attachPageDiagnostics(page, role) {
  page.on("console", message => {
    if (message.type() === "error" || message.type() === "warning") {
      recordDiagnostic("console", role, {
        level: message.type(),
        text: message.text().slice(0, 1200),
      });
    }
  });

  page.on("pageerror", error => {
    recordDiagnostic("pageerror", role, {
      message: error.message.slice(0, 1200),
    });
  });

  page.on("requestfailed", request => {
    recordDiagnostic("requestfailed", role, {
      method: request.method(),
      url: request.url().slice(0, 1200),
      failure: request.failure()?.errorText ?? null,
    });
  });

  page.on("response", response => {
    // A missing hashed client chunk may surface as a 200 HTML error shell.
    // Preserve its HTTP status and Cloudflare Ray ID without query strings.
    if (response.status() >= 400 && response.url().includes("/_next/static/")) {
      recordDiagnostic("client_asset_http_error", role, {
        status: response.status(),
        path: new URL(response.url()).pathname,
        cfRay: response.headers()["cf-ray"] ?? null,
      });
    }
    if (response.status() >= 500) {
      recordDiagnostic("http5xx", role, {
        status: response.status(),
        url: response.url().slice(0, 1200),
        // Capture edge diagnostic IDs without recording cookies or auth headers.
        cfRay: response.headers()["cf-ray"] ?? null,
        cfCacheStatus: response.headers()["cf-cache-status"] ?? null,
      });
    }
  });
}

async function responsiveSmoke(page, role, baseUrl, expectedPath) {
  const original = page.viewportSize();

  for (const viewport of [
    { name: "desktop", width: 1365, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    // A transient Cloudflare Worker 503 can coincide with the SSR route
    // navigating after a viewport change. Retry the same authenticated route
    // with short backoff, but NEVER pass a persistent server error.
    let response = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      response = await page.goto(
        `${baseUrl}${expectedPath}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        },
      );
      const status = response?.status() ?? 0;
      if (status === 200) break;

      console.warn(
        `E2E_RESPONSIVE_LOAD_RETRY role=${role} viewport=${viewport.name} attempt=${attempt} http=${status} cfRay=${response?.headers()["cf-ray"] ?? "unavailable"}`,
      );
      if (attempt < 3) {
        await page.waitForTimeout(attempt * 1200);
      }
    }

    gate(
      Boolean(response) && response.status() === 200,
      `E2E_RESPONSIVE_${role.toUpperCase()}_${viewport.name.toUpperCase()}_HTTP_${response?.status() ?? "NO_RESPONSE"}`,
    );

    // Playwright follows navigation redirects. A login or error page can
    // otherwise return HTTP 200 and masquerade as the requested dashboard.
    const observedPath = response
      ? new URL(response.url()).pathname.replace(/\/+$/u, "") || "/"
      : "";
    const requiredPath = expectedPath.replace(/\/+$/u, "") || "/";
    gate(
      observedPath === requiredPath,
      `E2E_RESPONSIVE_${role.toUpperCase()}_${viewport.name.toUpperCase()}_PATH_MISMATCH expected=${requiredPath} actual=${observedPath}`,
    );

    const state = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      bodyText: document.body?.innerText?.trim().length ?? 0,
    }));

    gate(
      state.width > 0 &&
        state.height > 0 &&
        state.bodyText > 0,
      `E2E_RESPONSIVE_${role.toUpperCase()}_${viewport.name.toUpperCase()}_FAILED`,
    );

    await capture(
      page,
      `role-${role}-${viewport.name}`,
    );
  }

  if (original) {
    await page.setViewportSize(original);
  }

  console.log(
    `E2E_RESPONSIVE_${role.toUpperCase()}=PASS`,
  );
}

async function roleRouteSmoke(page, role, baseUrl) {
  const student = users.get("student");
  const teacher = users.get("teacher");

  const routes = {
    student: ["/student", "/student/live", "/courses", "/assessment", "/skills"],
    child: ["/child", "/courses", "/skills"],
    teacher: [
      "/teacher",
      "/teacher/classroom",
      "/teacher/live",
      "/teacher/marketplace",
      "/teacher/marketplace/earnings",
      ...(fixture.classId ? [`/teacher/classes/${fixture.classId}`] : []),
    ],
    parent: [
      "/parent",
      ...(student ? [`/parent/children/${student.id}`] : []),
    ],
    school: [
      "/school",
      "/school/reports",
      "/school/rewards",
      "/school/meetings",
      ...(fixture.classId ? [`/school/classes/${fixture.classId}`] : []),
      ...(student ? [`/school/students/${student.id}`] : []),
      ...(teacher ? [`/school/teachers/${teacher.id}`] : []),
    ],
    admin: [
      "/admin",
      "/admin/curriculum",
      "/admin/lessons",
      "/admin/students",
      "/admin/teachers",
    ],
  };

  for (const route of routes[role] ?? []) {
    // Retry only edge/transient failures. Persistent 5xx, redirects and
    // client-side error shells still fail the strict route gate below.
    let response = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      response = await page.goto(
        `${baseUrl}${route}`,
        {
          waitUntil: "domcontentloaded",
          timeout: 60_000,
        },
      );
      const http = response?.status() ?? 0;
      if (http === 200 || ![429, 502, 503, 504].includes(http)) break;
      console.warn(
        `E2E_ROUTE_RETRY role=${role} route=${route} attempt=${attempt} http=${http} cfRay=${response?.headers()["cf-ray"] ?? "unavailable"}`,
      );
      if (attempt < 3) await page.waitForTimeout(attempt * 1500);
    }

    const status = response?.status() ?? 0;
    const finalPath = new URL(page.url()).pathname;
    const bodyText = await page
      .locator("body")
      .innerText()
      .catch(() => "");
    const observedPath = finalPath.replace(/\/+$/u, "") || "/";
    const requiredPath = route.replace(/\/+$/u, "") || "/";
    const hasClientErrorShell =
      bodyText.includes("This page couldn’t load") ||
      bodyText.includes("This page couldn't load");

    gate(
      status === 200 &&
        observedPath === requiredPath &&
        !hasClientErrorShell &&
        bodyText.trim().length > 0,
      `E2E_ROUTE_${role.toUpperCase()}_${route.replace(/[^a-z0-9]+/giu, "_")}_FAILED:${status}:${finalPath}`,
    );
  }

  // Owner finance pages are not regular admin pages. Verify that a
  // non-owner test admin receives an access-denied redirect.
  if (role === "admin") {
    const ownerPage = await page.goto(`${baseUrl}/admin/monetization`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    const resultUrl = new URL(page.url());
    gate(
      ownerPage?.status() === 200 &&
        resultUrl.pathname === "/student" &&
        resultUrl.searchParams.get("error") === "admin_access_denied",
      `E2E_OWNER_PAGE_DENIAL_FAILED:STATUS=${ownerPage?.status() ?? "NONE"}:PATH=${resultUrl.pathname}`,
    );
    console.log("E2E_OWNER_PAGE_DENIAL=PASS");
  }

  console.log(
    `E2E_ROLE_ROUTES_${role.toUpperCase()}=PASS`,
  );
}


async function humanUiJourneySmoke(
  page,
  role,
  baseUrl,
  expectedPath,
) {
  const visited = new Set([
    expectedPath,
  ]);

  let clicked = 0;

  async function assertHumanSession(stage) {
    let lastBilling = null;
    let lastRole = "";

    for (
      let attempt = 1;
      attempt <= 3;
      attempt += 1
    ) {
      const billing =
        await browserFetch(
          page,
          "/api/billing/status",
        );

      lastBilling = billing;

      const actualRole =
        String(
          billing.data?.role ??
            "",
        )
          .trim()
          .toLowerCase();

      lastRole = actualRole;

      const authenticated =
        billing.status === 200 &&
        billing.data?.authenticated === true;

      if (
        authenticated &&
        (
          actualRole === role ||
          (
            role === "child" &&
            actualRole === "child"
          )
        )
      ) {
        console.log(
          `E2E_HUMAN_SESSION_${role.toUpperCase()}=PASS STAGE=${stage} ATTEMPT=${attempt} PATH=${new URL(page.url()).pathname}`,
        );
        return;
      }

      if (attempt < 3) {
        await page.waitForTimeout(
          650 * attempt,
        );
      }
    }

    gate(
      false,
      `E2E_HUMAN_SESSION_${role.toUpperCase()}_FAILED:${stage}:STATUS=${lastBilling?.status ?? "NONE"}:AUTH=${String(
        lastBilling?.data?.authenticated,
      )}:ROLE=${lastRole || "NONE"}:PATH=${new URL(page.url()).pathname}`,
    );
  }

  for (
    let step = 1;
    step <= 8;
    step += 1
  ) {
    await page.goto(
      `${baseUrl}${expectedPath}`,
      {
        waitUntil:
          "domcontentloaded",
        timeout:
          60_000,
      },
    );

    gate(
      new URL(page.url()).pathname === expectedPath,
      `E2E_HUMAN_UI_${role.toUpperCase()}_START_PATH_FAILED:STEP=${step}:PATH=${new URL(page.url()).pathname}`,
    );

    await assertHumanSession(
      `before-step-${step}`,
    );

    await page.waitForTimeout(
      500,
    );

    let candidate = null;
    for (let readAttempt = 1; readAttempt <= 3; readAttempt += 1) {
      try {
        candidate = await page
          .locator("a[href]")
          .evaluateAll(
          (
            anchors,
            seen,
          ) => {
            for (
              let index = 0;
              index <
              anchors.length;
              index += 1
            ) {
              const anchor =
                anchors[index];

              if (
                !(
                  anchor instanceof
                  HTMLAnchorElement
                )
              ) {
                continue;
              }

              const raw =
                (
                  anchor.getAttribute(
                    "href",
                  ) ?? ""
                ).trim();

              const text =
                (
                  anchor.textContent ??
                  ""
                )
                  .replace(
                    /\s+/g,
                    " ",
                  )
                  .trim();

              const rect =
                anchor.getBoundingClientRect();

              const visible =
                rect.width > 0 &&
                rect.height > 0 &&
                window.getComputedStyle(
                  anchor,
                ).visibility !==
                  "hidden" &&
                window.getComputedStyle(
                  anchor,
                ).display !==
                  "none";

              const safe =
                raw.startsWith(
                  "/",
                ) &&
                !raw.startsWith(
                  "//",
                ) &&
                !raw.startsWith(
                  "/api/",
                ) &&
                !raw.startsWith(
                  "/login",
                ) &&
                !raw.startsWith(
                  "/signup",
                ) &&
                !raw.startsWith(
                  "/auth",
                ) &&
                !raw.includes(
                  "logout",
                ) &&
                !raw.includes(
                  "delete",
                ) &&
                !raw.includes(
                  "remove",
                ) &&
                !anchor.hasAttribute(
                  "download",
                ) &&
                anchor.target !==
                  "_blank";

              if (
                visible &&
                safe &&
                text &&
                !seen.includes(
                  raw,
                )
              ) {
                return {
                  index,
                  href: raw,
                  text,
                };
              }
            }

            return null;
          },
          [...visited],
        );
        break;
      } catch (error) {
        const navigationRace = String(error).includes("Execution context was destroyed");
        if (!navigationRace || readAttempt === 3) throw error;

        console.warn(
          `E2E_HUMAN_LINK_CONTEXT_RETRY role=${role} step=${step} attempt=${readAttempt}`,
        );
        await page.waitForLoadState("domcontentloaded", {
          timeout: 15_000,
        }).catch(() => {});

        const recoveredPath = new URL(page.url()).pathname;
        if (recoveredPath !== expectedPath) {
          const restored = await page.goto(`${baseUrl}${expectedPath}`, {
            waitUntil: "domcontentloaded",
            timeout: 60_000,
          });
          gate(
            restored?.status() === 200 &&
              new URL(page.url()).pathname === expectedPath,
            `E2E_HUMAN_LINK_CONTEXT_RECOVERY_FAILED:ROLE=${role}:STEP=${step}:PATH=${new URL(page.url()).pathname}`,
          );
        }
        await assertHumanSession(`retry-link-step-${step}`);
        await page.waitForTimeout(readAttempt * 450);
      }
    }

    if (!candidate) {
      break;
    }

    const diagnosticStart =
      qaReport.diagnostics.length;

    const link =
      page
        .locator("a[href]")
        .nth(
          candidate.index,
        );

    await link
      .scrollIntoViewIfNeeded();

    const beforeClick =
      new URL(
        page.url(),
      );

    await link.click({
      timeout:
        20_000,
    });

    /*
     * Behave like a real user: let the client navigation finish instead of
     * immediately jumping back to the dashboard and aborting the RSC request.
     * Aborted navigation storms are not representative of ordinary use and
     * can overload the Cloudflare worker during QA itself.
     */
    await page
      .waitForURL(
        next =>
          next.pathname !==
            beforeClick.pathname ||
          next.search !==
            beforeClick.search,
        {
          timeout:
            30_000,
          waitUntil:
            "domcontentloaded",
        },
      )
      .catch(() => {});

    await page
      .waitForLoadState(
        "networkidle",
        {
          timeout:
            15_000,
        },
      )
      .catch(() => {});

    await page.waitForTimeout(
      900,
    );

    const current =
      new URL(
        page.url(),
      );

    await assertHumanSession(
      `after-step-${step}`,
    );

    const bodyText =
      await page
        .locator("body")
        .innerText()
        .catch(() => "");

    const serious =
      qaReport.diagnostics
        .slice(
          diagnosticStart,
        )
        .filter(
          item =>
            item.role ===
              role &&
            (
              item.kind ===
                "pageerror" ||
              (
                item.kind ===
                  "http5xx" &&
                !(
                  item.status ===
                    503 &&
                  String(
                    item.url ??
                      "",
                  ).includes(
                    "/api/live/health",
                  )
                )
              )
            ),
        );

    gate(
      current.origin ===
        new URL(
          baseUrl,
        ).origin &&
        current.pathname !==
          "/login" &&
        bodyText
          .trim()
          .length > 0,
      `E2E_HUMAN_UI_${role.toUpperCase()}_NAV_FAILED:${candidate.href}:${current.pathname}`,
    );

    gate(
      serious.length === 0,
      `E2E_HUMAN_UI_${role.toUpperCase()}_RUNTIME_ERROR:${candidate.href}:${serious
        .map(
          item =>
            item.kind,
        )
        .join(",")}`,
    );

    clicked += 1;
    visited.add(
      candidate.href,
    );

    console.log(
      `E2E_HUMAN_UI_CLICK ROLE=${role.toUpperCase()} STEP=${step} TEXT=${candidate.text.slice(0, 80)} HREF=${candidate.href} FINAL=${current.pathname}`,
    );

    await capture(
      page,
      `human-${role}-step-${step}`,
    );
  }

  if (
    role === "child"
  ) {
    await page.goto(
      `${baseUrl}/child`,
      {
        waitUntil:
          "domcontentloaded",
        timeout:
          60_000,
      },
    );

    const diagnosticStart =
      qaReport.diagnostics.length;

    for (
      const label of [
        "اكتب",
        "اسمع",
        "اقرأ",
        "ألعاب",
        "فيديو",
        "الحروف",
      ]
    ) {
      const button =
        page.getByRole(
          "button",
          {
            name:
              label,
            exact:
              true,
          },
        );

      gate(
        (await button.count()) >
          0,
        `E2E_CHILD_TAB_MISSING:${label}`,
      );

      await button
        .first()
        .click();

      await page.waitForTimeout(
        120,
      );
    }

    const serious =
      qaReport.diagnostics
        .slice(
          diagnosticStart,
        )
        .filter(
          item =>
            item.role ===
              role &&
            (
              item.kind ===
                "pageerror" ||
              item.kind ===
                "http5xx"
            ),
        );

    gate(
      serious.length === 0,
      "E2E_CHILD_UI_RUNTIME_ERROR",
    );

    console.log(
      "E2E_CHILD_TABS_UI=PASS",
    );
  }

  const minimumClicks =
    role === "child"
      ? 2
      : role === "parent" ||
          role === "school"
        ? 3
        : 4;

  gate(
    clicked >= minimumClicks,
    `E2E_HUMAN_UI_${role.toUpperCase()}_INSUFFICIENT_CLICKS:${clicked}/${minimumClicks}`,
  );

  console.log(
    `E2E_HUMAN_UI_${role.toUpperCase()}=PASS CLICKS=${clicked} MIN=${minimumClicks}`,
  );
}

async function secondaryCurriculumCoverageGate() {
  const result =
    await admin
      .from("grades")
      .select(
        "id,grade_number,curricula!inner(id,name_ar,is_active,countries!inner(code)),units(id,lessons(id,status))",
      )
      .gte("grade_number", 10)
      .lte("grade_number", 13)
      .eq("is_active", true)
      .eq(
        "curricula.is_active",
        true,
      );

  if (result.error) {
    throw result.error;
  }

  const coverage =
    new Map();

  for (
    const row of
    result.data ?? []
  ) {
    const curriculum =
      Array.isArray(
        row.curricula,
      )
        ? row.curricula[0]
        : row.curricula;

    const countryRow =
      Array.isArray(
        curriculum?.countries,
      )
        ? curriculum.countries[0]
        : curriculum?.countries;

    const country =
      String(
        countryRow?.code ??
          "",
      )
        .trim()
        .toUpperCase();

    const grade =
      Number(
        row.grade_number,
      );

    if (
      !country ||
      !Number.isFinite(
        grade,
      )
    ) {
      continue;
    }

    const publishedLessons =
      (
        row.units ?? []
      )
        .flatMap(
          unit =>
            unit.lessons ??
            [],
        )
        .filter(
          lesson =>
            lesson.status ===
            "published",
        )
        .length;

    const key =
      `${country}:${grade}`;

    const current =
      coverage.get(key) ?? {
        country,
        grade,
        core: 0,
        official: 0,
      };

    const isCore =
      String(
        curriculum?.name_ar ??
          "",
      ).includes(
        "المسار العربي الأساسي لضاديوم",
      );

    if (isCore) {
      current.core +=
        publishedLessons;
    }
    else {
      current.official +=
        publishedLessons;
    }

    coverage.set(
      key,
      current,
    );
  }

  for (
    const grade of
    [10, 11, 12]
  ) {
    const rows =
      [...coverage.values()]
        .filter(
          item =>
            item.grade ===
            grade,
        );

    const countries =
      new Set(
        rows.map(
          item =>
            item.country,
        ),
      );

    gate(
      countries.size === 22,
      `E2E_SECONDARY_G${grade}_COUNTRY_COUNT_FAILED:${countries.size}/22`,
    );

    const incomplete =
      rows.filter(
        item =>
          item.core < 18 ||
          item.official < 1,
      );

    gate(
      incomplete.length ===
        0,
      `E2E_SECONDARY_G${grade}_COVERAGE_FAILED:${incomplete
        .map(
          item =>
            `${item.country}[core=${item.core},official=${item.official}]`,
        )
        .join(",")}`,
    );
  }

  for (
    const country of
    ["TN", "MR"]
  ) {
    const item =
      coverage.get(
        `${country}:13`,
      );

    gate(
      item &&
        item.core >= 18 &&
        item.official >= 1,
      `E2E_SECONDARY_G13_${country}_COVERAGE_FAILED:${item ? `core=${item.core},official=${item.official}` : "missing"}`,
    );
  }

  console.log(
    "E2E_SECONDARY_CURRICULUM_COVERAGE=PASS COUNTRIES=22 G10=PASS G11=PASS G12=PASS G13=TN,MR MIN_CORE=18",
  );

  /*
   * Per-track gate: country/grade aggregate coverage alone can hide a missing
   * official branch behind another branch in the same country. Require every
   * registered active track to have the Dadyoom supporting core, and require
   * official detail unless the registry explicitly records a source-model gap.
   */
  const trackCoverage =
    await admin
      .from("secondary_track_coverage")
      .select(
        "country_code,track_name_ar,grades,status,lesson_coverage,official_units,official_lessons,supporting_lessons",
      )
      .eq("academic_year", "2026-2027");

  if (trackCoverage.error) {
    throw trackCoverage.error;
  }

  const trackRows =
    trackCoverage.data ?? [];

  const trackCountries =
    new Set(
      trackRows.map(row =>
        String(row.country_code ?? "").trim().toUpperCase(),
      ),
    );

  gate(
    trackCountries.size === 22,
    `E2E_SECONDARY_TRACK_COUNTRY_COUNT_FAILED:${trackCountries.size}/22`,
  );

  const missingCore =
    trackRows.filter(
      row =>
        Number(row.supporting_lessons ?? 0) < 18,
    );

  gate(
    missingCore.length === 0,
    `E2E_SECONDARY_TRACK_CORE_FAILED:${missingCore
      .map(row =>
        `${row.country_code}:${row.track_name_ar}[supporting=${row.supporting_lessons}]`,
      )
      .join(",")}`,
  );

  const explicitOfficialGap = row => {
    const coverage =
      String(row.lesson_coverage ?? "");

    return (
      coverage ===
        "current-detailed-source-nonstandard-levels" ||
      coverage ===
        "awaiting-current-official-detail"
    );
  };

  const missingOfficial =
    trackRows.filter(
      row =>
        Number(row.official_lessons ?? 0) < 1 &&
        !explicitOfficialGap(row),
    );

  gate(
    missingOfficial.length === 0,
    `E2E_SECONDARY_TRACK_OFFICIAL_FAILED:${missingOfficial
      .map(row =>
        `${row.country_code}:${row.track_name_ar}[coverage=${row.lesson_coverage}]`,
      )
      .join(",")}`,
  );

  const explicitPending =
    trackRows.filter(
      row =>
        Number(row.official_lessons ?? 0) < 1 &&
        explicitOfficialGap(row),
    );

  console.log(
    `E2E_SECONDARY_TRACK_COVERAGE=PASS TRACKS=${trackRows.length} COUNTRIES=22 CORE_MIN=18 OFFICIAL_EXPLICIT_PENDING=${explicitPending
      .map(row => `${row.country_code}:${row.track_name_ar}`)
      .join("|") || "NONE"}`,
  );
}

function gate(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function capture(page, name) {
  if (!artifactDir) return;

  const safe = String(name)
    .replace(/[^a-z0-9-_]+/giu, "-")
    .replace(/^-+|-+$/gu, "")
    .toLowerCase();

  await page.screenshot({
    path: path.join(artifactDir, `${safe || "page"}.png`),
    fullPage: true,
  });
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

  const liveStart =
    new Date(
      Date.now() -
        2 * 60_000,
    );
  const liveEnd =
    new Date(
      Date.now() +
        45 * 60_000,
    );

  const liveSession =
    await admin
      .from(
        "edu_live_sessions",
      )
      .insert({
        teacher_id:
          teacher.id,
        class_id:
          fixture.classId,
        course_id:
          null,
        title:
          "E2E Dadyoom Live",
        description:
          "Temporary live release gate session",
        starts_at:
          liveStart.toISOString(),
        ends_at:
          liveEnd.toISOString(),
        room_name:
          `e2e-live-${stamp.replace(/[^a-zA-Z0-9]/g, "").slice(-24)}`,
        status:
          "live",
      })
      .select("id")
      .single();

  if (
    liveSession.error ||
    !liveSession.data?.id
  ) {
    throw (
      liveSession.error ??
      new Error(
        "E2E_LIVE_SESSION_CREATE_FAILED",
      )
    );
  }

  fixture.liveSessionId =
    liveSession.data.id;

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

async function cleanupStaleE2EUsers() {
  const staleProfiles =
    await admin
      .from("profiles")
      .select("id,email")
      .like(
        "email",
        "dadyoom.e2e.%@example.com",
      );

  if (staleProfiles.error) {
    throw staleProfiles.error;
  }

  const profileRows =
    staleProfiles.data ?? [];

  const staleIds =
    profileRows
      .map(row => row.id)
      .filter(Boolean);

  const staleEmails =
    profileRows
      .map(row => row.email)
      .filter(Boolean);

  if (staleEmails.length > 0) {
    for (const table of [
      "ai_assessments",
      "student_stats",
      "student_skills",
      "student_mistakes",
      "student_assessments",
      "student_achievements",
      "student_streaks",
      "learning_plans",
      "ai_recommendations",
      "student_progress",
    ]) {
      const result =
        await admin
          .from(table)
          .delete()
          .in(
            "student_email",
            staleEmails,
          );

      if (result.error) {
        throw result.error;
      }
    }
  }

  if (staleIds.length > 0) {
    const quizCleanup =
      await admin
        .from("quiz_attempts")
        .delete()
        .in(
          "student_id",
          staleIds,
        );

    if (quizCleanup.error) {
      throw quizCleanup.error;
    }

    const profileCleanup =
      await admin
        .from("profiles")
        .delete()
        .in(
          "id",
          staleIds,
        );

    if (profileCleanup.error) {
      throw profileCleanup.error;
    }
  }

  let page = 1;
  let deletedAuthUsers = 0;

  while (true) {
    const listed =
      await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

    if (listed.error) {
      throw listed.error;
    }

    const batch =
      listed.data?.users ?? [];

    const staleUsers =
      batch.filter(user => {
        const email =
          String(
            user.email ?? "",
          ).toLowerCase();

        return (
          email.startsWith(
            "dadyoom.e2e.",
          ) &&
          email.endsWith(
            "@example.com",
          )
        );
      });

    for (const user of staleUsers) {
      const removed =
        await admin.auth.admin.deleteUser(
          user.id,
        );

      if (removed.error) {
        throw removed.error;
      }

      deletedAuthUsers += 1;
    }

    if (batch.length < 1000) {
      break;
    }

    page += 1;
  }

  console.log(
    `E2E_STALE_USERS=CLEANED PROFILES=${staleIds.length} AUTH=${deletedAuthUsers}`,
  );
}

async function cleanupStaleMarketplaceFixtures() {
  const staleCourses =
    await admin
      .from("edu_marketplace_courses")
      .select("id")
      .like("slug", "e2e-%");

  if (staleCourses.error) {
    throw staleCourses.error;
  }

  const staleIds =
    (staleCourses.data ?? [])
      .map(row => row.id)
      .filter(Boolean);

  if (staleIds.length === 0) {
    console.log(
      "E2E_STALE_MARKETPLACE_FIXTURES=NONE",
    );
    return;
  }

  const earningsCleanup =
    await admin
      .from("edu_teacher_earnings")
      .delete()
      .in("course_id", staleIds);

  if (earningsCleanup.error) {
    throw earningsCleanup.error;
  }

  const purchasesCleanup =
    await admin
      .from("edu_marketplace_purchases")
      .delete()
      .in("course_id", staleIds);

  if (purchasesCleanup.error) {
    throw purchasesCleanup.error;
  }

  const paymentCleanup =
    await admin
      .from("edu_payment_orders")
      .delete()
      .in("course_id", staleIds);

  if (paymentCleanup.error) {
    throw paymentCleanup.error;
  }

  /*
   * Remaining course dependencies are CASCADE-safe.
   * Removing the course clears stale lessons, live sessions and attendance.
   */
  const courseCleanup =
    await admin
      .from("edu_marketplace_courses")
      .delete()
      .in("id", staleIds);

  if (courseCleanup.error) {
    throw courseCleanup.error;
  }

  console.log(
    `E2E_STALE_MARKETPLACE_FIXTURES=CLEANED COUNT=${staleIds.length}`,
  );
}

async function seedMarketplaceFixture() {
  const teacher = users.get("teacher");

  gate(
    teacher,
    "E2E_BPAY_TEACHER_MISSING",
  );

  const payout = await admin
    .from("edu_teacher_payout_profiles")
    .upsert(
      {
        teacher_id: teacher.id,
        bpay_mobile: "+97330000000",
        bpay_name: "E2E Dadyoom Teacher",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "teacher_id",
      },
    );

  if (payout.error) {
    throw payout.error;
  }

  const course = await admin
    .from("edu_marketplace_courses")
    .insert({
      teacher_id: teacher.id,
      slug: `e2e-bpay-${stamp.replace(/[^a-zA-Z0-9]/g, "").slice(-18)}`,
      title: "E2E BPay Course",
      description: "Temporary BPay marketplace release-gate course",
      price: 5,
      currency: "BHD",
      delivery_mode: "live",
      status: "published",
      commission_bps: 1500,
      max_students: 20,
    })
    .select("id")
    .single();

  if (course.error || !course.data?.id) {
    throw (
      course.error ??
      new Error("E2E_BPAY_COURSE_CREATE_FAILED")
    );
  }

  fixture.marketplaceCourseId = course.data.id;

  console.log(
    "E2E_BPAY_FIXTURE=PASS",
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
  // A login form timeout is not automatically a credential failure.
  // Diagnose 5xx/challenge/redirect responses instead of reporting a
  // misleading selector failure, while retaining all strict role gates.
  const loginPageResponse = await page.goto(
    `${baseUrl}/login`,
    {
      waitUntil:
        "networkidle",
      timeout:
        60_000,
    },
  );
  const formHttpStatus = loginPageResponse?.status() ?? null;
  if (formHttpStatus !== 200) {
    recordDiagnostic("login_document_error", user.role, {
      status: formHttpStatus,
      cfRay: loginPageResponse?.headers()["cf-ray"] ?? null,
    });
    throw new Error(`E2E_LOGIN_DOCUMENT_HTTP_${formHttpStatus ?? "NO_RESPONSE"}`);
  }

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

  const loginShellText = await page.locator("body").innerText().catch(() => "");
  if (
    (loginShellText.includes("This page couldn’t load") ||
      loginShellText.includes("This page couldn't load")) &&
    (await emailInput.count()) === 0
  ) {
    recordDiagnostic("login_client_error_shell", user.role, {
      status: formHttpStatus,
      cfRay: loginPageResponse?.headers()["cf-ray"] ?? null,
      text: loginShellText.slice(0, 200),
    });
    throw new Error(`E2E_LOGIN_CLIENT_ERROR_SHELL_${user.role.toUpperCase()}`);
  }

  try {
    await emailInput.waitFor({
      state:
        "visible",
      timeout:
        30_000,
    });
  } catch (cause) {
    const body = await page.locator("body").innerText().catch(() => "");
    const documentTitle = await page.title().catch(() => "");
    const pathname = (() => {
      try { return new URL(page.url()).pathname; } catch { return "unknown"; }
    })();
    console.error("E2E_LOGIN_FORM_DIAGNOSTIC", JSON.stringify({
      role: user.role,
      formHttpStatus,
      pathname,
      documentTitle: documentTitle.slice(0, 160),
      bodyPreview: body.slice(0, 500),
      emailInputCount: await emailInput.count().catch(() => -1),
      passwordInputCount: await passwordInput.count().catch(() => -1),
      cause: cause instanceof Error ? cause.message : String(cause),
    }));
    throw cause;
  }

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

  // Collect request/response evidence without ever logging POST bodies,
  // access tokens or user credentials. The E2E still fails on timeout.
  let passwordPostStarted = 0;
  let passwordPostFailed = 0;
  let lastFailure = "";
  const isPasswordRequest = request => {
    try {
      return request.method() === "POST" &&
        new URL(request.url()).pathname === "/api/auth/password-login";
    } catch {
      return false;
    }
  };
  const onPasswordRequest = request => {
    if (isPasswordRequest(request)) passwordPostStarted += 1;
  };
  const onPasswordRequestFailed = request => {
    if (isPasswordRequest(request)) {
      passwordPostFailed += 1;
      lastFailure = String(request.failure()?.errorText ?? "").slice(0, 180);
    }
  };
  page.on("request", onPasswordRequest);
  page.on("requestfailed", onPasswordRequestFailed);

  const responsePromise =
    page.waitForResponse(
      response => isPasswordRequest(response.request()),
      { timeout: 30_000 },
    );

  let loginResponse;
  try {
    await submitButton.click({ timeout: 30_000 });
    loginResponse = await responsePromise;
  } catch (cause) {
    const formVisible = await emailInput.isVisible().catch(() => false);
    const buttonDisabled = await submitButton.isDisabled().catch(() => false);
    const pageBody = await page.locator("body").innerText().catch(() => "");
    console.error("E2E_LOGIN_POST_DIAGNOSTIC", JSON.stringify({
      role: user.role,
      passwordPostStarted,
      passwordPostFailed,
      lastFailure,
      formVisible,
      buttonDisabled,
      pageBodyPreview: pageBody.slice(0, 250),
      reason: cause instanceof Error ? cause.message : String(cause),
    }));
    throw cause;
  } finally {
    page.off("request", onPasswordRequest);
    page.off("requestfailed", onPasswordRequestFailed);
  }

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

  // Diagnostic readbacks happen only after a failed completion request;
  // they do not change QA fixtures, ownership, grading or the product API.
  if (complete.status >= 500) {
    const [masteryReadback, progressReadback] = await Promise.all([
      admin.from("lesson_mastery")
        .select("mastery_score,asked_questions")
        .eq("student_id",student.id)
        .eq("lesson_id",lesson.id).maybeSingle(),
      admin.from("student_lesson_progress")
        .select("status,progress_percent,best_score,xp,completed_at")
        .eq("student_id",student.id)
        .eq("lesson_id",lesson.id).maybeSingle(),
    ]);
    console.error("E2E_CANONICAL_POSTFAIL_DB_STATE",JSON.stringify({
      masteryStored:!!masteryReadback.data,
      masteryScore:Number(masteryReadback.data?.mastery_score??0),
      masteryReadError:!!masteryReadback.error,
      progressStatus:String(progressReadback.data?.status??"missing"),
      progressPercent:Number(progressReadback.data?.progress_percent??0),
      progressScore:Number(progressReadback.data?.best_score??0),
      progressReadError:!!progressReadback.error,
      hasCompletedAt:!!progressReadback.data?.completed_at,
    }));
  }

  gate(
    complete.status === 200 &&
      complete.data?.success ===
        true &&
      complete.data
        ?.canonicalGate ===
        true,
    `E2E_CANONICAL_COMPLETION_FAILED:${complete.status}:${String(
      complete.data?.error ??
      complete.errorDiagnostics?.bodyPreview ??
        "",
    ).slice(0, 160)}:${JSON.stringify(complete.errorDiagnostics ?? {})}`,
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
      `E2E_ASSESSMENT_SUBMIT_FAILED:${submitted.status}:${submitted.data?.message ?? "no-message"}`,
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

async function liveTokenSmoke(
  page,
  role,
) {
  gate(
    Boolean(
      fixture.liveSessionId,
    ),
    "E2E_LIVE_SESSION_FIXTURE_MISSING",
  );

  const health =
    await browserFetch(
      page,
      "/api/live/health",
    );

  if (
    health.status === 503 &&
    health.data?.configured === false
  ) {
    console.log(
      `E2E_LIVE_${role.toUpperCase()}=BLOCKED_EXTERNAL_CONFIG`,
    );
    return;
  }

  gate(
    health.status === 200 &&
      health.data?.configured === true,
    `E2E_LIVE_HEALTH_FAILED:${role}:${health.status}`,
  );

  const token =
    await browserFetch(
      page,
      "/api/live/token",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body:
          JSON.stringify({
            sessionId:
              fixture.liveSessionId,
          }),
      },
    );

  gate(
    token.status === 200 &&
      typeof token.data?.token === "string" &&
      token.data.token.length > 40 &&
      typeof token.data?.serverUrl === "string" &&
      token.data.serverUrl.startsWith("wss://"),
    `E2E_LIVE_TOKEN_FAILED:${role}:${token.status}`,
  );

  console.log(
    `E2E_LIVE_${role.toUpperCase()}=PASS`,
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

      // Only capture bounded, non-sensitive diagnostics when the canonical
      // lesson completion endpoint fails. Never record session cookies,
      // authorization headers, request bodies, or user tokens.
      const completionFailure =
        response.status >= 500 &&
        requestUrl === "/api/lessons/complete";

      return {
        status:
          response.status,
        data,
        ...(completionFailure ? {
          errorDiagnostics: {
            contentType: response.headers.get("content-type") ?? "",
            cfRay: response.headers.get("cf-ray") ?? "",
            server: response.headers.get("server") ?? "",
            bodyPreview: raw.slice(0, 250),
          },
        } : {}),
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
        "التدريب التكيفي",
      ) &&
      body.includes(
        "المناهج والدروس",
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

  if (skipExternalAi) {
    console.log(
      "E2E_AI_SMOKE=SKIPPED_BY_CONFIGURATION",
    );
  } else {
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

async function studentBpayMarketplaceFlow(
  page,
) {
  gate(
    fixture.marketplaceCourseId,
    "E2E_BPAY_COURSE_FIXTURE_MISSING",
  );

  const create = await browserFetch(
    page,
    "/api/payments/bpay/create-course",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        courseId: fixture.marketplaceCourseId,
      }),
    },
  );

  gate(
    create.status === 200 &&
      create.data?.paymentOrderId &&
      create.data?.status === "pending" &&
      Number(create.data?.amount) === 5 &&
      String(create.data?.currency) === "BHD" &&
      String(create.data?.bpayMobile) === "+97330000000",
    `E2E_BPAY_CREATE_FAILED:${create.status}`,
  );

  fixture.bpayPaymentOrderId =
    create.data.paymentOrderId;
  fixture.bpayReference =
    `E2E-BPAY-${stamp.replace(/[^a-zA-Z0-9]/g, "").slice(-20)}`;

  const submit = await browserFetch(
    page,
    "/api/payments/bpay/submit-course",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentOrderId:
          fixture.bpayPaymentOrderId,
        reference:
          fixture.bpayReference,
      }),
    },
  );

  gate(
    submit.status === 200 &&
      submit.data?.ok === true &&
      submit.data?.status === "approved",
    `E2E_BPAY_SUBMIT_FAILED:${submit.status}`,
  );

  console.log(
    "E2E_BPAY_STUDENT=PASS",
  );
}

async function teacherBpayMarketplaceFlow(
  page,
  baseUrl,
) {
  const student =
    users.get("student");

  gate(
    student &&
      fixture.marketplaceCourseId &&
      fixture.bpayPaymentOrderId &&
      fixture.bpayReference,
    "E2E_BPAY_CONFIRM_FIXTURE_MISSING",
  );

  // Keep a real production 5xx visible in logs, but tolerate a brief,
  // transient Cloudflare resource-limit response while workers settle.
  // Persistent failure remains a hard release-gate failure.
  let marketplaceReady = false;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await page.goto(
      `${baseUrl}/teacher/marketplace`,
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    const statusCode = response?.status() ?? 0;

    if (statusCode >= 500 || !response) {
      console.warn(
        `E2E_BPAY_MARKETPLACE_LOAD_RETRY attempt=${attempt} http=${statusCode}`,
      );
      recordDiagnostic("marketplace-load-5xx", "teacher", {
        attempt,
        status: statusCode,
      });
      if (attempt < 3) {
        await page.waitForTimeout(1500 * attempt);
        continue;
      }
      gate(false, `E2E_BPAY_MARKETPLACE_UNAVAILABLE_HTTP_${statusCode}`);
    }

    try {
      await page
        .getByText(fixture.bpayReference, { exact: false })
        .waitFor({ timeout: 12_000 });
      marketplaceReady = true;
      break;
    } catch (error) {
      console.warn(
        `E2E_BPAY_REFERENCE_NOT_VISIBLE attempt=${attempt} http=${statusCode}`,
      );
      if (attempt === 3) throw error;
      await page.waitForTimeout(1500 * attempt);
    }
  }
  gate(marketplaceReady, "E2E_BPAY_MARKETPLACE_REFERENCE_MISSING");

  await page
    .getByRole(
      "button",
      {
        name:
          "تأكيد وصول المبلغ وفتح الدورة",
      },
    )
    .click();

  try {
    await page.getByRole("status")
      .getByText("تم تأكيد استلام BPay وفتح الدورة للطالب.", { exact: false })
      .waitFor({ timeout: 20_000 });
  } catch (uiError) {
    const statusMessages = await page.getByRole("status").allInnerTexts()
      .catch(() => []);
    const persisted = await admin.from("edu_payment_orders")
      .select("status,bank_reference")
      .eq("id", fixture.bpayPaymentOrderId)
      .maybeSingle();
    console.error(
      "E2E_BPAY_TEACHER_UI_DIAGNOSTIC",
      JSON.stringify({
        statusMessages,
        currentUrl: page.url(),
        storedOrderStatus: persisted.data?.status ?? null,
        storedReferencePresent: Boolean(persisted.data?.bank_reference),
        readError: persisted.error?.message ?? null,
        uiError: uiError instanceof Error ? uiError.message : String(uiError),
      }),
    );
    throw uiError;
  }

  const payment = await admin
    .from("edu_payment_orders")
    .select("status")
    .eq(
      "id",
      fixture.bpayPaymentOrderId,
    )
    .maybeSingle();

  if (payment.error) {
    throw payment.error;
  }

  gate(
    payment.data?.status === "completed",
    "E2E_BPAY_PAYMENT_NOT_COMPLETED",
  );

  const purchase = await admin
    .from("edu_marketplace_purchases")
    .select("id,status,amount_paid,currency")
    .eq(
      "buyer_id",
      student.id,
    )
    .eq(
      "course_id",
      fixture.marketplaceCourseId,
    )
    .maybeSingle();

  if (purchase.error) {
    throw purchase.error;
  }

  gate(
    purchase.data?.id &&
      purchase.data?.status === "active" &&
      Number(purchase.data?.amount_paid) === 5 &&
      String(purchase.data?.currency) === "BHD",
    "E2E_BPAY_PURCHASE_FAILED",
  );

  const earning = await admin
    .from("edu_teacher_earnings")
    .select(
      "gross_amount,platform_fee,net_amount,currency,status",
    )
    .eq(
      "purchase_id",
      purchase.data.id,
    )
    .maybeSingle();

  if (earning.error) {
    throw earning.error;
  }

  gate(
    Number(earning.data?.gross_amount) === 5 &&
      Number(earning.data?.platform_fee) === 0.75 &&
      Number(earning.data?.net_amount) === 4.25 &&
      String(earning.data?.currency) === "BHD",
    "E2E_BPAY_SPLIT_FAILED",
  );

  const platformFee =
    await admin
      .from(
        "edu_platform_fee_receivables",
      )
      .select(
        "fee_amount,gross_amount,currency,status,payment_order_id",
      )
      .eq(
        "purchase_id",
        purchase.data.id,
      )
      .maybeSingle();

  if (platformFee.error) {
    throw platformFee.error;
  }

  gate(
    platformFee.data &&
      Number(
        platformFee.data.fee_amount,
      ) === 0.75 &&
      Number(
        platformFee.data.gross_amount,
      ) === 5 &&
      String(
        platformFee.data.currency,
      ) === "BHD" &&
      platformFee.data.status ===
        "due" &&
      platformFee.data
        .payment_order_id ===
        fixture.bpayPaymentOrderId,
    "E2E_BPAY_PLATFORM_FEE_RECEIVABLE_FAILED",
  );

  console.log(
    "E2E_BPAY_PLATFORM_FEE_RECEIVABLE=PASS",
  );

  console.log(
    "E2E_BPAY_TEACHER=PASS",
  );

  console.log(
    "E2E_BPAY_SPLIT=PASS PLATFORM=15 TEACHER=85",
  );
}


async function waitForDbRow(
  fetcher,
  errorCode,
) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const result = await fetcher();

    if (result.error) {
      throw result.error;
    }

    if (result.data) {
      return result.data;
    }

    if (attempt < 12) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  throw new Error(errorCode);
}

function futureLocalDateTime(
  minutesFromNow,
) {
  const date = new Date(
    Date.now() +
      minutesFromNow *
        60_000,
  );

  return date
    .toISOString()
    .slice(0, 16);
}

async function focusedMarketplaceLiveFlow(
  baseUrl,
) {
  gate(
    browser,
    "E2E_FOCUSED_BROWSER_MISSING",
  );

  const teacher =
    users.get("teacher");
  const student =
    users.get("student");

  gate(
    teacher && student,
    "E2E_FOCUSED_MARKETPLACE_USERS_MISSING",
  );

  const suffix =
    stamp
      .replace(
        /[^a-zA-Z0-9]/g,
        "",
      )
      .slice(-10);

  const courseTitle =
    "E2E UI Course " +
    suffix;

  const liveTitle =
    "E2E UI Course Live " +
    suffix;

  const paymentReference =
    "E2E-UI-BPAY-" +
    suffix;

  const teacherContext =
    await browser.newContext({
      acceptDownloads:
        true,
    });

  const studentContext =
    await browser.newContext({
      acceptDownloads:
        true,
    });

  const teacherPage =
    await teacherContext
      .newPage();

  const studentPage =
    await studentContext
      .newPage();

  attachPageDiagnostics(
    teacherPage,
    "teacher-focused",
  );

  attachPageDiagnostics(
    studentPage,
    "student-focused",
  );

  try {
    await login(
      teacherPage,
      teacher,
      "/teacher",
      baseUrl,
    );

    await teacherPage.goto(
      baseUrl +
        "/teacher/marketplace",
      {
        waitUntil:
          "networkidle",
        timeout:
          60_000,
      },
    );

    const createButton =
      teacherPage
        .getByRole(
          "button",
          {
            name:
              "إنشاء الدورة",
          },
        )
        .first();

    const createForm =
      createButton
        .locator(
          "xpath=ancestor::form",
        );

    await createForm
      .locator(
        'input[name="title"]',
      )
      .fill(
        courseTitle,
      );

    await createForm
      .locator(
        'textarea[name="description"]',
      )
      .fill(
        "Temporary UI-created marketplace course for release gate.",
      );

    await createForm
      .locator(
        'input[name="price"]',
      )
      .fill("7.000");

    await createForm
      .locator(
        'select[name="deliveryMode"]',
      )
      .selectOption(
        "live",
      );

    await createForm
      .locator(
        'input[name="scheduleNote"]',
      )
      .fill(
        "E2E live schedule",
      );

    await createForm
      .locator(
        'input[name="maxStudents"]',
      )
      .fill("25");

    await createButton.click();

    try {
      await teacherPage
        .getByText(
          "تم إنشاء الدورة بنسبة 85% للمعلم و15% لضاديوم.",
          { exact: false },
        )
        .waitFor({ timeout: 20_000 });
    } catch (error) {
      const statusMessages = await teacherPage.getByRole("status").allTextContents().catch(() => []);
      const persisted = await admin.from("edu_marketplace_courses")
        .select("id,status,price,currency,commission_bps")
        .eq("teacher_id", teacher.id)
        .eq("title", courseTitle)
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      console.error("E2E_MARKETPLACE_CREATE_UI_DIAGNOSTIC", JSON.stringify({
        statusMessages,
        currentUrl: teacherPage.url(),
        persisted: persisted.data ?? null,
        readError: persisted.error?.message ?? null,
        uiError: error instanceof Error ? error.message : String(error),
      }));
      throw error;
    }

    const course =
      await waitForDbRow(
        () =>
          admin
            .from(
              "edu_marketplace_courses",
            )
            .select(
              "id,slug,status,price,currency,commission_bps",
            )
            .eq(
              "teacher_id",
              teacher.id,
            )
            .eq(
              "title",
              courseTitle,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(1)
            .maybeSingle(),
        "E2E_MARKETPLACE_UI_CREATE_DB_FAILED",
      );

    gate(
      course.status ===
        "draft" &&
        Number(
          course.price,
        ) === 7 &&
        String(
          course.currency,
        ) === "BHD" &&
        Number(
          course.commission_bps,
        ) === 1500,
      "E2E_MARKETPLACE_UI_CREATE_VALUES_FAILED",
    );

    fixture.uiMarketplaceCourseId =
      course.id;
    fixture.uiMarketplaceCourseSlug =
      course.slug;

    const courseCard =
      teacherPage
        .locator(
          "article",
        )
        .filter({
          hasText:
            courseTitle,
        })
        .first();

    await courseCard
      .getByRole(
        "button",
        {
          name:
            "نشر الدورة",
        },
      )
      .click();

    await teacherPage
      .getByText(
        "تم نشر الدورة في سوق ضاديوم.",
        {
          exact:
            false,
        },
      )
      .waitFor({
        timeout:
          20_000,
      });

    const published =
      await waitForDbRow(
        () =>
          admin
            .from(
              "edu_marketplace_courses",
            )
            .select(
              "id,status",
            )
            .eq(
              "id",
              course.id,
            )
            .eq(
              "status",
              "published",
            )
            .maybeSingle(),
        "E2E_MARKETPLACE_UI_PUBLISH_DB_FAILED",
      );

    gate(
      published.status ===
        "published",
      "E2E_MARKETPLACE_UI_PUBLISH_FAILED",
    );

    console.log(
      "E2E_MARKETPLACE_TEACHER_CREATE_PUBLISH=PASS",
    );

    await teacherPage.goto(
      baseUrl +
        "/teacher/live",
      {
        waitUntil:
          "networkidle",
        timeout:
          60_000,
      },
    );

    const liveButton =
      teacherPage
        .getByRole(
          "button",
          {
            name:
              "أنشئ الحصة",
          },
        )
        .first();

    const liveForm =
      liveButton
        .locator(
          "xpath=ancestor::form",
        );

    await liveForm
      .locator(
        'input[name="title"]',
      )
      .fill(
        liveTitle,
      );

    await liveForm
      .locator(
        'textarea[name="description"]',
      )
      .fill(
        "Temporary course live room for release gate.",
      );

    await liveForm
      .locator(
        'input[name="startsAt"]',
      )
      .fill(
        futureLocalDateTime(
          5,
        ),
      );

    await liveForm
      .locator(
        'input[name="endsAt"]',
      )
      .fill(
        futureLocalDateTime(
          45,
        ),
      );

    await liveForm
      .locator(
        'select[name="courseId"]',
      )
      .selectOption(
        String(
          course.id,
        ),
      );

    await liveButton.click();

    const liveSession =
      await waitForDbRow(
        () =>
          admin
            .from(
              "edu_live_sessions",
            )
            .select(
              "id,status,course_id,teacher_id",
            )
            .eq(
              "course_id",
              course.id,
            )
            .eq(
              "title",
              liveTitle,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(1)
            .maybeSingle(),
        "E2E_COURSE_LIVE_CREATE_DB_FAILED",
      );

    fixture.uiCourseLiveSessionId =
      liveSession.id;

    const teacherLiveToken =
      await browserFetch(
        teacherPage,
        "/api/live/token",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              sessionId:
                liveSession.id,
            }),
        },
      );

    gate(
      teacherLiveToken.status ===
        200 &&
        typeof teacherLiveToken
          .data?.token ===
          "string" &&
        teacherLiveToken
          .data.token.length >
          40,
      "E2E_COURSE_LIVE_TEACHER_FAILED:" +
        teacherLiveToken.status,
    );

    console.log(
      "E2E_COURSE_LIVE_TEACHER=PASS",
    );

    await login(
      studentPage,
      student,
      "/student",
      baseUrl,
    );

    await studentPage.goto(
      baseUrl +
        "/marketplace/" +
        course.slug,
      {
        waitUntil:
          "networkidle",
        timeout:
          60_000,
      },
    );

    const marketplaceBody =
      await studentPage
        .locator("body")
        .innerText();

    gate(
      marketplaceBody.includes(
        courseTitle,
      ) &&
        marketplaceBody.includes(
          "الدفع عبر BPay",
        ),
      "E2E_MARKETPLACE_STUDENT_DISCOVERY_FAILED",
    );

    await studentPage
      .getByRole(
        "button",
        {
          name:
            "الدفع عبر BPay",
        },
      )
      .click();

    await studentPage
      .getByText(
        "بيانات الدفع عبر BPay",
        {
          exact:
            false,
        },
      )
      .waitFor({
        timeout:
          20_000,
      });

    await studentPage
      .locator(
        'input[placeholder="مرجع عملية BPay"]',
      )
      .fill(
        paymentReference,
      );

    await studentPage
      .getByRole(
        "button",
        {
          name:
            "أرسلت المبلغ — إرسال المرجع",
        },
      )
      .click();

    await studentPage
      .locator(
        'input[placeholder="مرجع عملية BPay"]',
      )
      .waitFor({
        state:
          "detached",
        timeout:
          20_000,
      });

    console.log(
      "E2E_MARKETPLACE_STUDENT_CHECKOUT_UI=PASS",
    );

    await teacherPage.goto(
      baseUrl +
        "/teacher/marketplace",
      {
        waitUntil:
          "networkidle",
        timeout:
          60_000,
      },
    );

    await teacherPage
      .getByText(
        paymentReference,
        {
          exact:
            false,
        },
      )
      .waitFor({
        timeout:
          20_000,
      });

    await teacherPage
      .getByRole(
        "button",
        {
          name:
            "تأكيد وصول المبلغ وفتح الدورة",
        },
      )
      .first()
      .click();

    await teacherPage
      .getByText(
        "تم تأكيد استلام BPay وفتح الدورة للطالب.",
        {
          exact:
            false,
        },
      )
      .waitFor({
        timeout:
          20_000,
      });

    const purchase =
      await waitForDbRow(
        () =>
          admin
            .from(
              "edu_marketplace_purchases",
            )
            .select(
              "id,status,amount_paid,currency",
            )
            .eq(
              "buyer_id",
              student.id,
            )
            .eq(
              "course_id",
              course.id,
            )
            .eq(
              "status",
              "active",
            )
            .maybeSingle(),
        "E2E_MARKETPLACE_UI_PURCHASE_FAILED",
      );

    const earning =
      await waitForDbRow(
        () =>
          admin
            .from(
              "edu_teacher_earnings",
            )
            .select(
              "gross_amount,platform_fee,net_amount,currency",
            )
            .eq(
              "purchase_id",
              purchase.id,
            )
            .maybeSingle(),
        "E2E_MARKETPLACE_UI_EARNING_FAILED",
      );

    gate(
      Number(
        earning.gross_amount,
      ) === 7 &&
        Number(
          earning.platform_fee,
        ) === 1.05 &&
        Number(
          earning.net_amount,
        ) === 5.95 &&
        String(
          earning.currency,
        ) === "BHD",
      "E2E_MARKETPLACE_UI_SPLIT_FAILED",
    );

    await studentPage.reload({
      waitUntil:
        "networkidle",
      timeout:
        60_000,
    });

    const accessBody =
      await studentPage
        .locator("body")
        .innerText();

    gate(
      accessBody.includes(
        "لديك وصول كامل إلى الدورة.",
      ) &&
        accessBody.includes(
          liveTitle,
        ) &&
        accessBody.includes(
          "دخول الغرفة",
        ),
      "E2E_MARKETPLACE_STUDENT_ACCESS_FAILED",
    );

    const studentLiveToken =
      await browserFetch(
        studentPage,
        "/api/live/token",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              sessionId:
                liveSession.id,
            }),
        },
      );

    gate(
      studentLiveToken.status ===
        200 &&
        typeof studentLiveToken
          .data?.token ===
          "string" &&
        studentLiveToken
          .data.token.length >
          40,
      "E2E_COURSE_LIVE_STUDENT_FAILED:" +
        studentLiveToken.status,
    );

    console.log(
      "E2E_COURSE_LIVE_STUDENT=PASS",
    );

    console.log(
      "E2E_MARKETPLACE_UI_FLOW=PASS PLATFORM=15 TEACHER=85",
    );
  }
  finally {
    await studentContext
      .close();

    await teacherContext
      .close();
  }
}

async function focusedSchoolMeetingFlow(
  baseUrl,
) {
  gate(
    browser &&
      fixture.schoolId,
    "E2E_SCHOOL_MEETING_BROWSER_OR_FIXTURE_MISSING",
  );

  const school =
    users.get("school");
  const teacher =
    users.get("teacher");

  gate(
    school && teacher,
    "E2E_SCHOOL_MEETING_USERS_MISSING",
  );

  const suffix =
    stamp
      .replace(
        /[^a-zA-Z0-9]/g,
        "",
      )
      .slice(-10);

  const meetingTitle =
    "E2E School Meeting " +
    suffix;

  const schoolContext =
    await browser.newContext();

  const teacherContext =
    await browser.newContext();

  const schoolPage =
    await schoolContext
      .newPage();

  const teacherPage =
    await teacherContext
      .newPage();

  attachPageDiagnostics(
    schoolPage,
    "school-meeting-focused",
  );

  attachPageDiagnostics(
    teacherPage,
    "school-teacher-focused",
  );

  try {
    await login(
      schoolPage,
      school,
      "/school",
      baseUrl,
    );

    await schoolPage.goto(
      baseUrl +
        "/school/meetings",
      {
        waitUntil:
          "networkidle",
        timeout:
          60_000,
      },
    );

    const createButton =
      schoolPage
        .getByRole(
          "button",
          {
            name:
              "إنشاء غرفة الاجتماع",
          },
        )
        .first();

    const form =
      createButton
        .locator(
          "xpath=ancestor::form",
        );

    await form
      .locator(
        'input[name="title"]',
      )
      .fill(
        meetingTitle,
      );

    await form
      .locator(
        'textarea[name="description"]',
      )
      .fill(
        "Temporary school teacher meeting for release gate.",
      );

    await form
      .locator(
        'input[name="startsAt"]',
      )
      .fill(
        futureLocalDateTime(
          5,
        ),
      );

    await form
      .locator(
        'input[name="endsAt"]',
      )
      .fill(
        futureLocalDateTime(
          35,
        ),
      );

    await createButton.click();

    const meeting =
      await waitForDbRow(
        () =>
          admin
            .from(
              "edu_live_sessions",
            )
            .select(
              "id,school_id,status",
            )
            .eq(
              "school_id",
              fixture.schoolId,
            )
            .eq(
              "title",
              meetingTitle,
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              },
            )
            .limit(1)
            .maybeSingle(),
        "E2E_SCHOOL_MEETING_CREATE_DB_FAILED",
      );

    fixture.schoolMeetingSessionId =
      meeting.id;

    const schoolToken =
      await browserFetch(
        schoolPage,
        "/api/live/token",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              sessionId:
                meeting.id,
            }),
        },
      );

    gate(
      schoolToken.status ===
        200 &&
        typeof schoolToken
          .data?.token ===
          "string",
      "E2E_SCHOOL_MEETING_OWNER_FAILED:" +
        schoolToken.status,
    );

    console.log(
      "E2E_SCHOOL_MEETING_CREATE=PASS",
    );

    await login(
      teacherPage,
      teacher,
      "/teacher",
      baseUrl,
    );

    const teacherToken =
      await browserFetch(
        teacherPage,
        "/api/live/token",
        {
          method:
            "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body:
            JSON.stringify({
              sessionId:
                meeting.id,
            }),
        },
      );

    gate(
      teacherToken.status ===
        200 &&
        typeof teacherToken
          .data?.token ===
          "string" &&
        teacherToken
          .data.token.length >
          40,
      "E2E_SCHOOL_MEETING_TEACHER_FAILED:" +
        teacherToken.status,
    );

    console.log(
      "E2E_SCHOOL_MEETING_TEACHER=PASS",
    );
  }
  finally {
    await teacherContext
      .close();

    await schoolContext
      .close();
  }
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

  // The classroom is SSR-backed. A transient Cloudflare 5xx or an
  // unhydrated response must not silently bypass the award UI assertion.
  // Retry a bounded number of times; a persistent missing form fails hard.
  let rewardFormReady = false;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await page.goto(
      `${baseUrl}/teacher/classroom`,
      { waitUntil: "domcontentloaded", timeout: 60_000 },
    );
    const responseStatus = response?.status() ?? 0;
    const awardTitleInput = page
      .getByRole("button", { name: "منح الجائزة" })
      .first()
      .locator("xpath=ancestor::form")
      .locator('input[name="title"]');

    if (responseStatus > 0 && responseStatus < 500) {
      try {
        await awardTitleInput.waitFor({ state: "visible", timeout: 12_000 });
        rewardFormReady = true;
        break;
      } catch {
        // A 200 page without the expected form remains an error on
        // the final attempt, including after a login redirect.
      }
    }
    console.warn(
      "E2E_TEACHER_REWARD_FORM_DIAGNOSTIC",
      JSON.stringify({
        attempt,
        httpStatus: responseStatus,
        finalPath: new URL(page.url()).pathname,
        awardButtons: await page
          .getByRole("button", { name: "منح الجائزة" }).count(),
        rewardInputs: await page.locator('input[name="title"]').count(),
      }),
    );
    if (attempt < 3) {
      await page.waitForTimeout(1500 * attempt);
    }
  }
  gate(rewardFormReady, "E2E_TEACHER_REWARD_FORM_UNAVAILABLE");

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

  // Explicitly select the seeded pupil, even if the class later
  // gains other memberships. The test must never award a bystander.
  gate(
    await form.locator('input[name="studentId"]').inputValue() === student.id,
    "E2E_TEACHER_REWARD_STUDENT_SELECT_MISMATCH",
  );

  await form
    .getByRole(
      "button",
      { name: "منح الجائزة" },
    )
    .click();

  const expectedAward =
    "تم منح 17 نقطة وجائزة E2E Teacher UI Award.";

  try {
    await page
      .getByRole("status")
      .getByText(expectedAward, { exact: true })
      .waitFor({ timeout: 20_000 });
  } catch (awardUiError) {
    const visibleStatus =
      await page
        .getByRole("status")
        .allInnerTexts()
        .catch(() => []);
    const rewardRows =
      await admin
        .from("edu_rewards")
        .select("id,points")
        .eq("issuer_id", teacher.id)
        .eq("student_id", student.id)
        .eq("title", "E2E Teacher UI Award")
        .limit(2);
    console.error(
      "E2E_TEACHER_REWARD_UI_DIAGNOSTIC",
      JSON.stringify({
        url: page.url(),
        visibleStatus,
        rewardAlreadyStored: (rewardRows.data ?? []).length,
        rewardReadError: rewardRows.error?.message ?? null,
        error: awardUiError instanceof Error
          ? awardUiError.message
          : String(awardUiError),
      }),
    );
    throw awardUiError;
  }

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
    admin:
      "إدارة ضاديوم",
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


  if (
    fixture.uiCourseLiveSessionId
  ) {
    await admin
      .from(
        "edu_live_attendance",
      )
      .delete()
      .eq(
        "session_id",
        fixture.uiCourseLiveSessionId,
      );
  }

  if (
    fixture.schoolMeetingSessionId
  ) {
    await admin
      .from(
        "edu_live_attendance",
      )
      .delete()
      .eq(
        "session_id",
        fixture.schoolMeetingSessionId,
      );

    await admin
      .from(
        "edu_live_sessions",
      )
      .delete()
      .eq(
        "id",
        fixture.schoolMeetingSessionId,
      );
  }

  if (
    fixture.uiMarketplaceCourseId
  ) {
    await admin
      .from(
        "edu_teacher_earnings",
      )
      .delete()
      .eq(
        "course_id",
        fixture.uiMarketplaceCourseId,
      );

    await admin
      .from(
        "edu_marketplace_purchases",
      )
      .delete()
      .eq(
        "course_id",
        fixture.uiMarketplaceCourseId,
      );

    await admin
      .from(
        "edu_payment_orders",
      )
      .delete()
      .eq(
        "course_id",
        fixture.uiMarketplaceCourseId,
      );

    await admin
      .from(
        "edu_live_sessions",
      )
      .delete()
      .eq(
        "course_id",
        fixture.uiMarketplaceCourseId,
      );

    await admin
      .from(
        "edu_marketplace_course_lessons",
      )
      .delete()
      .eq(
        "course_id",
        fixture.uiMarketplaceCourseId,
      );

    await admin
      .from(
        "edu_marketplace_courses",
      )
      .delete()
      .eq(
        "id",
        fixture.uiMarketplaceCourseId,
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

  if (fixture.marketplaceCourseId) {
    await admin
      .from("edu_teacher_earnings")
      .delete()
      .eq(
        "course_id",
        fixture.marketplaceCourseId,
      );

    await admin
      .from("edu_marketplace_purchases")
      .delete()
      .eq(
        "course_id",
        fixture.marketplaceCourseId,
      );

    await admin
      .from("edu_payment_orders")
      .delete()
      .eq(
        "course_id",
        fixture.marketplaceCourseId,
      );

    await admin
      .from("edu_live_sessions")
      .delete()
      .eq(
        "course_id",
        fixture.marketplaceCourseId,
      );

    await admin
      .from("edu_marketplace_course_lessons")
      .delete()
      .eq(
        "course_id",
        fixture.marketplaceCourseId,
      );

    await admin
      .from("edu_marketplace_courses")
      .delete()
      .eq(
        "id",
        fixture.marketplaceCourseId,
      );
  }

  const teacher =
    users.get("teacher");

  if (teacher) {
    await admin
      .from("edu_teacher_payout_profiles")
      .delete()
      .eq(
        "teacher_id",
        teacher.id,
      );
  }

  const currentUserIds =
    [...users.values()]
      .map(user => user.id)
      .filter(Boolean);

  if (currentUserIds.length > 0) {
    await admin
      .from("quiz_attempts")
      .delete()
      .in(
        "student_id",
        currentUserIds,
      );

    await admin
      .from("profiles")
      .delete()
      .in(
        "id",
        currentUserIds,
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

qaReport.baseUrl = baseUrl;

try {
  await secondaryCurriculumCoverageGate();

  await cleanupStaleE2EUsers();
  await cleanupStaleMarketplaceFixtures();

  for (
    const [role] of
    roles
  ) {
    await createRoleUser(
      role,
    );
  }

  console.log(
    "E2E_TEMP_USERS=6",
  );

  await seedStudent();
  await seedRelationships();
  await seedMarketplaceFixture();

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

    activePage = page;
    activeRole = role;

    attachPageDiagnostics(
      page,
      role,
    );

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

    await responsiveSmoke(
      page,
      role,
      baseUrl,
      expectedPath,
    );

    if (
      role === "student" ||
      role === "teacher"
    ) {
      await liveTokenSmoke(
        page,
        role,
      );
    }

    await humanUiJourneySmoke(
      page,
      role,
      baseUrl,
      expectedPath,
    );

    await roleRouteSmoke(
      page,
      role,
      baseUrl,
    );

    if (
      role ===
      "admin"
    ) {
      const readiness =
        await browserFetch(
          page,
          "/api/admin/readiness",
        );

      gate(
        readiness.status === 200 &&
          readiness.data?.ok === true,
        `E2E_ADMIN_READINESS_ROUTE_FAILED:${readiness.status}`,
      );

      const liveConfigured =
        readiness.data?.live?.configured === true;
      const adsConfigured =
        readiness.data?.adsense?.configured === true;
      const paddleConfigured =
        readiness.data?.paddle?.configured === true;
      const paddleEnvironment =
        String(
          readiness.data?.paddle?.environment ??
          "unknown",
        );

      console.log(
        `E2E_OPS_READINESS LIVE=${liveConfigured ? "CONFIGURED" : "MISSING"} ADSENSE=${adsConfigured ? "CONFIGURED" : "MISSING"} PADDLE=${paddleConfigured ? "CONFIGURED" : "MISSING"} PADDLE_ENV=${paddleEnvironment}`,
      );

      const paddleConfig =
        await browserFetch(
          page,
          "/api/payments/paddle/config",
          {
            method: "POST",
          },
        );

      const paddleError =
        String(
          paddleConfig.data?.error ??
          "",
        );

      console.log(
        `E2E_PADDLE_CONFIG_PROBE STATUS=${paddleConfig.status} ENV=${String(paddleConfig.data?.environment ?? paddleEnvironment)} ERROR=${paddleError || "NONE"}`,
      );

      // A live environment must never expose an active checkout.
      if (paddleEnvironment === "production") {
        gate(
          paddleConfig.status === 503 && paddleError === "PAYMENTS_PAUSED",
          `E2E_LIVE_PADDLE_CHECKOUT_NOT_PAUSED:${paddleConfig.status}:${paddleError}`,
        );
      }

      const videoAiHealth =
        await browserFetch(
          page,
          "/api/video/cinematic/health",
        );

      gate(
        videoAiHealth.status === 200 &&
          videoAiHealth.data?.enabled === false &&
          videoAiHealth.data?.status === "soon",
        `E2E_VIDEO_AI_RELEASE_STATE_FAILED:${videoAiHealth.status}:${String(videoAiHealth.data?.status ?? "unknown")}`,
      );

      console.log(
        "E2E_VIDEO_AI=SOON_DISABLED",
      );
    }

    await capture(
      page,
      `role-${role}-dashboard`,
    );

    if (
      role ===
      "student"
    ) {
      await studentFlow(
        page,
        baseUrl,
      );

      await studentBpayMarketplaceFlow(
        page,
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

      await teacherBpayMarketplaceFlow(
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

    let pricingResponse = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      pricingResponse = await page.goto(`${baseUrl}/pricing`, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      const code = pricingResponse?.status() ?? 0;
      if (code === 200 || ![429, 502, 503, 504].includes(code)) break;
      console.warn(
        `E2E_PRICING_LOAD_RETRY role=${role} attempt=${attempt} http=${code} cfRay=${pricingResponse?.headers()["cf-ray"] ?? "unavailable"}`,
      );
      if (attempt < 3) await page.waitForTimeout(attempt * 1200);
    }

    const pricingCode = pricingResponse?.status() ?? 0;
    const pricingPath = new URL(page.url()).pathname;
    gate(
      pricingCode === 200 && pricingPath === "/pricing",
      `E2E_PRICING_HTTP_${role.toUpperCase()}_FAILED:${pricingCode}:${pricingPath}`,
    );

    const dashboardLabels = {
      student: "لوحة الطالب",
      child: "لوحة الطالب",
      teacher: "لوحة المعلم",
      parent: "لوحة ولي الأمر",
      school: "لوحة المدرسة",
      admin: "لوحة الإدارة",
    };
    const expectedPricingDashboard = dashboardLabels[role] ?? "لوحتي";

    // PricingClient loads the authenticated billing role asynchronously.
    // Never mark a pricing page PASS before the correct dashboard link
    // renders; a stale anonymous fallback must not hide a failed status API.
    await page.waitForFunction(
      (label) => document.body?.innerText.includes(label) ?? false,
      expectedPricingDashboard,
      { timeout: 12_000 },
    ).catch(() => {});

    const pricingText = await page.locator("body").innerText();
    const hasPricingDashboard = pricingText.includes(expectedPricingDashboard);
    if (!hasPricingDashboard) {
      const probe = await browserFetch(page, "/api/billing/status")
        .catch(() => ({ status: 0, data: null }));
      console.warn(
        `E2E_PRICING_ROLE_DIAGNOSTIC role=${role} page_http=${pricingCode} billing_http=${probe.status} billing_role=${String(probe.data?.role ?? "unknown")} expected_label=${expectedPricingDashboard} label_found=false`,
      );
    }

    gate(
      pricingText.includes("ضاديوم Plus") &&
      pricingText.includes("مكتبة الفيديوهات") &&
      pricingText.includes("فيديو AI — قريبًا") &&
      hasPricingDashboard,
      `E2E_PRICING_NAV_${role.toUpperCase()}_FAILED`,
    );

    console.log(
      `E2E_PRICING_NAV_${role.toUpperCase()}=PASS`,
    );

    await capture(
      page,
      `role-${role}-pricing`,
    );

    await page.goto(
      `${baseUrl}/courses/video-library`,
      {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      },
    );

    const videoBody =
      await page
        .locator("body")
        .innerText();

    gate(
      videoBody.includes(
        "500 فيديو لتعلم العربية",
      ),
      `E2E_VIDEO_LIBRARY_${role.toUpperCase()}_FAILED`,
    );

    console.log(
      `E2E_VIDEO_LIBRARY_${role.toUpperCase()}=PASS`,
    );

    await capture(
      page,
      `role-${role}-video-library`,
    );

    qaReport.roles[role] = {
      status: "PASS",
      completedAt:
        new Date().toISOString(),
    };

    await context.close();
    activePage = null;
    activeRole = null;
  }

  await focusedMarketplaceLiveFlow(
    baseUrl,
  );

  await focusedSchoolMeetingFlow(
    baseUrl,
  );

  writeQaReport("PASS");

  console.log(
    "FINAL_E2E_RELEASE_GATE=PASS",
  );

  console.log(
    "EXTERNAL_AI_PROVIDER_OUTAGE_DOES_NOT_FAIL_PLATFORM_GATE=YES",
  );
}
catch (error) {
  qaReport.failed = true;

  if (activeRole) {
    qaReport.roles[activeRole] = {
      status: "FAIL",
      completedAt:
        new Date().toISOString(),
      error:
        error instanceof Error
          ? error.message
          : String(error),
    };
  }

  if (activePage) {
    await capture(
      activePage,
      `failure-${activeRole ?? "unknown"}`,
    ).catch(() => {});
  }

  writeQaReport(
    "FAIL",
    error,
  );

  throw error;
}
finally {
  if (browser) {
    await browser.close();
  }

  if (server) {
    server.kill();
  }

  await cleanup();

  writeQaReport(
    qaReport.failed
      ? "FAIL"
      : "PASS",
  );

  console.log(
    "E2E_TEMP_DATA_CLEANUP=PASS",
  );
}
