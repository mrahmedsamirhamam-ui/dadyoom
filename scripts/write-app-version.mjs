import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function gitCommit() {
  for (const key of [
    "WORKERS_CI_COMMIT_SHA",
    "CF_PAGES_COMMIT_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "RAILWAY_GIT_COMMIT_SHA",
    "RENDER_GIT_COMMIT",
    "GITHUB_SHA",
    "SOURCE_VERSION",
    "DADYOOM_SOURCE_COMMIT",
  ]) {
    const value = process.env[key]?.trim();
    if (value) return value.slice(0, 40);
  }

  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim().slice(0, 40);
  } catch {
    return "";
  }
}

const builtAt = new Date().toISOString();
const commit = gitCommit();
const version =
  process.env.DADYOOM_APP_VERSION?.trim() ||
  (commit ? `${commit.slice(0, 12)}-${Date.now()}` : `build-${Date.now()}`);

const branch =
  process.env.WORKERS_CI_BRANCH?.trim() ||
  process.env.CF_PAGES_BRANCH?.trim() ||
  process.env.GITHUB_REF_NAME?.trim() ||
  null;

const buildId =
  process.env.WORKERS_CI_BUILD_UUID?.trim() ||
  process.env.GITHUB_RUN_ID?.trim() ||
  null;

const payload = {
  version,
  builtAt,
  commit: commit || null,
  branch,
  buildId,
};

const publicTarget = resolve(
  process.cwd(),
  "public",
  "app-version.json",
);
mkdirSync(dirname(publicTarget), { recursive: true });
writeFileSync(
  publicTarget,
  `${JSON.stringify(payload, null, 2)}\n`,
  "utf8",
);

const generatedTarget = resolve(
  process.cwd(),
  "generated",
  "build-info.ts",
);
mkdirSync(dirname(generatedTarget), { recursive: true });
writeFileSync(
  generatedTarget,
  `export const BUILD_INFO = ${JSON.stringify(
    payload,
    null,
    2,
  )} as const;\n`,
  "utf8",
);

console.log(`DADYOOM_APP_VERSION=${version}`);
