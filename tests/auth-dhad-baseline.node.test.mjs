import test from "node:test";
import assert from "node:assert/strict";
import {AUDIT_PATHS,percentile,summarize,requestOnce} from "../scripts/audit-auth-dhad-baseline.mjs";
test("phase0 routes include all role and auth entry points but never submit private data",()=>{
 for(const p of ["/login","/signup","/student","/teacher","/parent","/school","/study","/ask"])assert.ok(AUDIT_PATHS.includes(p));
 assert.ok(AUDIT_PATHS.every(p=>p.startsWith("/")&&!p.includes("?")));
});
test("not-measured groups must use null rather than zero for p50/p95",()=>{
 assert.equal(percentile([],0.5),null);
 assert.deepEqual(summarize([]).response_headers_ms,{p50:null,p95:null});
});
test("nearest-rank quantiles are deterministic and conservative",()=>{
 const d=[100,200,300,400,500,600,700,800,900,1000,1100,1200,1300,1400,1500,1600,1700,1800,1900,2000];
 assert.equal(percentile(d,.5),1000);
 assert.equal(percentile(d,.95),1900);
 assert.equal(percentile([100],.95),100);
});
test("the public GET audit never carries a cookie, auth header or a chat POST",async()=>{
 let called;
 const fake=async(url,opts)=>{
  called={url,opts};
  return{status:302,arrayBuffer:async()=>new Uint8Array([])};
 };
 const row=await requestOnce("https://example.org/login",fake);
 assert.equal(called.opts.method,"GET");
 assert.equal(called.opts.redirect,"manual");
 assert.equal(called.opts.cache,"no-store");
 assert.equal(called.opts.headers.Authorization,undefined);
 assert.equal(called.opts.headers.Cookie,undefined);
 assert.equal(called.opts.body,undefined);
 assert.equal(row.status,302);
});
test("errors are counted but don't contaminate quantile stats",()=>{
 const r=summarize([{error:"timeout"},{status:200,response_headers_ms:300,total_download_ms:500}]);
 assert.equal(r.samples,2);assert.equal(r.errors,1);
 assert.equal(r.response_headers_ms.p95,300);
 assert.deepEqual(r.statuses,[200]);
});
