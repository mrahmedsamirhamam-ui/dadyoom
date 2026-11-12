import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const file=fileURLToPath(new URL('./p0-assert-isolated-env.mjs',import.meta.url));
const base={PGHOST:'127.0.0.1',PGPORT:'5432',PGDATABASE:'dadyoom_p0_disposable',
 DATABASE_URL:'',SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_URL:'',
 STAGING_SUPABASE_URL:'',SUPABASE_DB_URL:'',STAGING_DATABASE_URL:'',
 PRODUCTION_SUPABASE_PROJECT_REF:'prod-test-ref',STAGING_SUPABASE_PROJECT_REF:'staging-test-ref'};
function run(extra={}) {
 const env={...process.env,...base,...extra};
 return spawnSync(process.execPath,[file],{env,encoding:'utf8'});
}
test('accepts disposable PostgreSQL loopback without remote URLs',()=>{
 const r=run();assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/P0_ISOLATION_GATE=PASS/);
});
test('rejects production project ID reused as staging ref',()=>{
 assert.equal(run({STAGING_SUPABASE_PROJECT_REF:'prod-test-ref'}).status,2);
});
test('rejects any Supabase URL even if loopback PG configured',()=>{
 assert.equal(run({NEXT_PUBLIC_SUPABASE_URL:'https://prod-test-ref.supabase.co'}).status,2);
});
test('rejects public remote PostgreSQL host',()=>{
 assert.equal(run({PGHOST:'example.supabase.co'}).status,2);
});
test('rejects production database name',()=>{
 assert.equal(run({PGDATABASE:'production'}).status,2);
});
