import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { NextConfig } from "next";

function writeCiBuildMetadata() {
  const commit =
    process.env.WORKERS_CI_COMMIT_SHA?.trim() ||
    process.env.GITHUB_SHA?.trim() ||
    process.env.CF_PAGES_COMMIT_SHA?.trim() ||
    "";

  if (!commit) return;

  const branch =
    process.env.WORKERS_CI_BRANCH?.trim() ||
    process.env.GITHUB_REF_NAME?.trim() ||
    process.env.CF_PAGES_BRANCH?.trim() ||
    null;

  const buildId =
    process.env.WORKERS_CI_BUILD_UUID?.trim() ||
    process.env.GITHUB_RUN_ID?.trim() ||
    null;

  const target = resolve(
    process.cwd(),
    "public",
    "app-version.json",
  );

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(
    target,
    `${JSON.stringify(
      {
        version: `${commit.slice(0, 12)}-${Date.now()}`,
        builtAt: new Date().toISOString(),
        commit,
        branch,
        buildId,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

writeCiBuildMetadata();

const nextConfig: NextConfig = {
  output: "standalone",
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
    webpackBuildWorker: false,
    serverSourceMaps: false,
  },
  productionBrowserSourceMaps: false,
  enablePrerenderSourceMaps: false,
  outputFileTracingExcludes: {
    "/*": [
      "./.env*",
      "./.git/**",
      "./_backups/**",
      "./diagnostics/**",
      "./.dadyoom-*/**",
      "./**/*.before-*",
      "./**/*.bak*",
    ],
    "/api/dad-voice": [
      "./next.config.ts",
      "./proxy.ts",
      "./middleware.ts.before-proxy-migration",
      "./app/api/dad-voice/*.before-*",
    ],
  },
};

export default nextConfig;






