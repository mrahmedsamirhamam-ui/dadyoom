// TASK 03-E — REVIEW ONLY. NOT ACTIVE CODE.
// Fail-closed environment gate for the review-only GitHub Actions workflow.
// No database or network call is made. Only loopback Supabase Local endpoints
// and synthetic credentials may pass. Never set production credentials here.

const forbiddenNames = [
  "SUPABASE_ACCESS_TOKEN",
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "STAGING_SUPABASE_URL",
  "SUPABASE_DB_URL",
  "DATABASE_URL",
  "STAGING_DATABASE_URL",
  "PRODUCTION_SUPABASE_URL",
  "PRODUCTION_DATABASE_URL",
  "PRODUCTION_SUPABASE_PROJECT_REF",
  "STAGING_SUPABASE_PROJECT_REF",
  "VERCEL_TOKEN",
  "CLOUDFLARE_API_TOKEN",
  "NETLIFY_AUTH_TOKEN",
];

const found = forbiddenNames.filter((name) => Boolean((process.env[name] ?? "").trim()));
if (found.length) {
  console.error(`TASK03E_ISOLATION_GATE=BLOCKED forbidden_env=${found.join(",")}`);
  process.exit(2);
}

const mode = process.env.TASK03E_GATE_MODE || "post-stack";
if (mode === "preflight") {
  console.log("TASK03E_ISOLATION_GATE=PASS mode=preflight no_remote_env");
  process.exit(0);
}
if (mode !== "post-stack") {
  console.error("TASK03E_ISOLATION_GATE=BLOCKED unknown_mode");
  process.exit(2);
}

const api = process.env.P0_LOCAL_API_URL || "";
const db = process.env.P0_LOCAL_DB_URL || "";
const anonKey = process.env.P0_LOCAL_ANON_KEY || "";
const serviceKey = process.env.P0_LOCAL_SERVICE_KEY || "";
const loopback = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);

let apiUrl;
let dbUrl;
try {
  apiUrl = new URL(api);
  dbUrl = new URL(db);
} catch {
  console.error("TASK03E_ISOLATION_GATE=BLOCKED invalid_local_url");
  process.exit(2);
}

const valid =
  loopback.has(apiUrl.hostname) &&
  ["http:", "https:"].includes(apiUrl.protocol) &&
  loopback.has(dbUrl.hostname) &&
  ["postgres:", "postgresql:"].includes(dbUrl.protocol) &&
  dbUrl.pathname === "/postgres" &&
  Boolean(anonKey) &&
  Boolean(serviceKey) &&
  !/(prod|production)/i.test(`${apiUrl.hostname}${dbUrl.hostname}${dbUrl.pathname}`);

if (!valid) {
  console.error("TASK03E_ISOLATION_GATE=BLOCKED untrusted_or_remote_endpoint");
  process.exit(2);
}

console.log("TASK03E_ISOLATION_GATE=PASS mode=post-stack api=loopback db=loopback database=postgres");
