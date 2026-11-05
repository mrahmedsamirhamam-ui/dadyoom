#!/usr/bin/env node
/**
 * Dadyoom phase-0 READ-ONLY route baseline.
 * Uses the public GET endpoints only; NEVER signs in, emits personal information,
 * submits a chat question, or changes server data.
 * Measurements are synthetic from THIS runner and not real-mobile Core Web Vitals.
 * Usage: node scripts/audit-auth-dhad-baseline.mjs --base=https://dadyoom.com --runs=7
 */
import { performance } from "node:perf_hooks";
import { writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

export const AUDIT_PATHS = Object.freeze([
  "/login", "/signup", "/student", "/teacher",
  "/parent", "/school", "/study", "/ask",
  "/api/auth/provider-status"
]);
export function percentile(xs, p) {
  const a=xs.filter(Number.isFinite).sort((x,y)=>x-y);
  if(!a.length) return null;
  const at=Math.max(0,Math.min(a.length-1,Math.ceil(p*a.length)-1));
  return Math.round(a[at]);
}
export function summarize(readings){
  const ok=readings.filter(x=>!x.error);
  return {
    samples:readings.length,
    errors:readings.length-ok.length,
    statuses:[...new Set(ok.map(x=>x.status))].sort(),
    // Network response headers arrive before HTML is downloaded. NOT render/interaction timing.
    response_headers_ms:{p50:percentile(ok.map(x=>x.response_headers_ms),.5),
      p95:percentile(ok.map(x=>x.response_headers_ms),.95)},
    total_download_ms:{p50:percentile(ok.map(x=>x.total_download_ms),.5),
      p95:percentile(ok.map(x=>x.total_download_ms),.95)}
  };
}
export async function requestOnce(url, fetchImpl=fetch) {
  const controller=new AbortController();
  const clock=setTimeout(()=>controller.abort(),12000);
  const start=performance.now();
  try{
    const r=await fetchImpl(url,{method:"GET",redirect:"manual",cache:"no-store",
      headers:{"Accept":"text/html,application/json","X-Dadyoom-Phase0-ReadOnly":"1"},
      signal:controller.signal});
    const response_headers_ms=Math.round(performance.now()-start);
    // Drain but never retain response body, cookies, secrets or user details.
    await r.arrayBuffer();
    return {status:r.status,response_headers_ms,total_download_ms:Math.round(performance.now()-start),
      redirected:r.status>=300&&r.status<400};
  }catch(e){return {error:e?.name==="AbortError"?"timeout":"request_failed"};}
  finally{clearTimeout(clock);}
}
function args(argv){
 const find=(key,def)=>argv.find(x=>x.startsWith("--"+key+"="))?.split("=").slice(1).join("=")??def;
 const base=find("base","https://dadyoom.com"),n=Number(find("runs","5"));
 if(!/^https:\/\/[a-z0-9.-]+(?::\d+)?$/i.test(base))throw Error("HTTPS base URL required");
 if(!Number.isInteger(n)||n<1||n>30)throw Error("1-30 non-concurrent samples only");
 return {base,n};
}
async function main(){
 const {base,n}=args(process.argv.slice(2));
 const results={created_at:new Date().toISOString(),base,
  methodology:"Public unauthenticated GET, runner network only, no simulated or physical device.",
  limitations:["TTFT for Dhād requires an authenticated consented test request and instrumented streaming.",
   "Real mobile UX, FCP/LCP/INP and click-to-lesson cannot be inferred from response-header time.",
   "Registration conversion/retention cannot be estimated without privacy-reviewed first-party events."],
  routes:{}};
 for(const p of AUDIT_PATHS){
   const values=[];
   for(let i=0;i<n;i++)values.push(await requestOnce(base+p));
   results.routes[p]=summarize(values);
 }
 await mkdir("_audits/auth-dhad",{recursive:true});
 const out="_audits/auth-dhad/public-route-baseline.json";
 await writeFile(out,JSON.stringify(results,null,2)+"\n");
 process.stdout.write(JSON.stringify({written:out,samples_per_route:n,routes:results.routes},null,2)+"\n");
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 main().catch(e=>{console.error(e.message);process.exitCode=1});
}
