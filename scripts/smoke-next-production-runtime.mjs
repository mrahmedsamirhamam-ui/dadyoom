import { spawn } from "node:child_process";
import { resolve } from "node:path";

// CI runtime gate: boot the production Next output, not only compile it.
// These tests are GET-only, local-only, anonymous and use no real database keys.
const port = 31763;
const base = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  }
);
let output = "";
for (const pipe of [server.stdout, server.stderr]) {
  pipe.on("data", (buf) => {
    output = (output + buf.toString()).slice(-4000);
  });
}
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(path, timeout = 8000) {
  return fetch(base + path, {
    method: "GET",
    redirect: "manual",
    signal: AbortSignal.timeout(timeout),
  });
}
async function run() {
  let ready = false;
  for (let attempt = 0; attempt < 70; attempt++) {
    if (server.exitCode !== null) throw new Error("NEXT_RUNTIME_EXITED_BEFORE_START");
    try {
      const response = await request("/", 1500);
      if (response.status === 200) {
        const html = await response.text();
        if (!html.includes("ضاديوم")) {
          throw new Error("HOME_MISSING_ARABIC_BRAND");
        }
        if (!html.includes("lang=\"ar\"") && !html.includes("lang='ar'")) {
          throw new Error("HOME_MISSING_ARABIC_LANGUAGE");
        }
        console.log("PUBLIC_HOME_RUNTIME=PASS");
        ready = true;
        break;
      }
      throw new Error(`HOME_HTTP_${response.status}`);
    } catch (error) {
      if (String(error).includes("HOME_MISSING") || String(error).includes("HOME_HTTP_")) {
        throw error;
      }
      await pause(400);
    }
  }
  if (!ready) throw new Error("NEXT_RUNTIME_BOOT_TIMEOUT");

  const robots = await request("/robots.txt");
  const robotsText = await robots.text();
  if (robots.status !== 200 ||
      !robotsText.includes("Disallow: /api/") ||
      !robotsText.includes("Sitemap:")) {
    throw new Error("PUBLIC_ROBOTS_RUNTIME_FAILED");
  }
  console.log("PUBLIC_ROBOTS_RUNTIME=PASS");

  const sitemap = await request("/sitemap.xml");
  const sitemapText = await sitemap.text();
  if (sitemap.status !== 200 || !sitemapText.includes("<urlset") ||
      !sitemapText.includes("/courses")) {
    throw new Error("PUBLIC_SITEMAP_RUNTIME_FAILED");
  }
  console.log("PUBLIC_SITEMAP_RUNTIME=PASS");

  const manifest = await request("/manifest.webmanifest");
  if (manifest.status !== 200) {
    throw new Error(`PUBLIC_MANIFEST_HTTP_${manifest.status}`);
  }
  const manifestText = await manifest.text();
  if (!manifestText.includes("ضاديوم")) {
    throw new Error("PUBLIC_MANIFEST_MISSING_BRAND");
  }
  console.log("PUBLIC_MANIFEST_RUNTIME=PASS");
}
try {
  await run();
} catch (error) {
  console.error("LOCAL_PRODUCTION_RUNTIME_SMOKE_FAILED:", String(error));
  console.error("LOCAL_NEXT_OUTPUT_LAST_4000:", output);
  process.exitCode = 1;
} finally {
  server.kill("SIGTERM");
}
