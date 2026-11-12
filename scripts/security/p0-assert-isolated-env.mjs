// Strict fail-closed local-only database preflight. No network/database call.
const host=(process.env.PGHOST||"").trim().toLowerCase();
const port=process.env.PGPORT||"5432";
const database=process.env.PGDATABASE||"";
const urlVars=["DATABASE_URL","SUPABASE_URL","NEXT_PUBLIC_SUPABASE_URL","STAGING_SUPABASE_URL","SUPABASE_DB_URL","STAGING_DATABASE_URL"];
const remote=urlVars.filter(k=>Boolean(process.env[k]?.trim()));
const prod=(process.env.PRODUCTION_SUPABASE_PROJECT_REF||"").trim().toLowerCase();
const target=(process.env.STAGING_SUPABASE_PROJECT_REF||"").trim().toLowerCase();
if (remote.length || !["127.0.0.1","localhost","::1"].includes(host) || !/^\d+$/.test(port)
 || database!=="dadyoom_p0_disposable"
 || (prod && target && prod===target)
 || (prod && (host.includes(prod) || database.includes(prod)))) {
 console.error("P0 isolation gate BLOCKED: only the disposable loopback PostgreSQL is accepted.");
 process.exit(2);
}
console.log("P0_ISOLATION_GATE=PASS host=loopback db=disposable; no Supabase URLs");
