import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

function gitCommit() {
  for (const key of [
    "VERCEL_GIT_COMMIT_SHA",
    "RAILWAY_GIT_COMMIT_SHA",
    "RENDER_GIT_COMMIT",
    "GITHUB_SHA",
    "SOURCE_VERSION",
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

const payload = {
  version,
  builtAt,
  commit: commit || null,
};

const target = resolve(process.cwd(), "public", "app-version.json");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`DADYOOM_APP_VERSION=${version}`);
