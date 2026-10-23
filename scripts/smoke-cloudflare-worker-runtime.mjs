import { spawn } from "node:child_process";
import { resolve } from "node:path";

const host="127.0.0.1";
const port=31767;
const url=`http://${host}:${port}`;
const worker=spawn(process.execPath,[
  resolve("node_modules/vite/bin/vite.js"),
  "preview", "--host", host, "--port", String(port), "--strictPort"
],{
  cwd:process.cwd(),
  env:{...process.env,CI:"true",NEXT_TELEMETRY_DISABLED:"1"},
  stdio:["ignore","pipe","pipe"],
});
let diagnostics="";
for(const stream of [worker.stdout, worker.stderr]){
  stream.on("data",chunk=>{
    diagnostics=(diagnostics+String(chunk)).slice(-7000);
  });
}
const sleep=t=>new Promise(resolve=>setTimeout(resolve,t));
async function get(path,timeout=3500){
  return fetch(url+path,{redirect:"manual",signal:AbortSignal.timeout(timeout)});
}
try {
  let started=false;
  for(let attempt=0;attempt<100;attempt++){
    if(worker.exitCode!==null) throw new Error("WORKER_PREVIEW_EXITED_BEFORE_READY");
    try{
      const response=await get("/robots.txt",1500);
      if(response.status!==200)throw new Error(`WORKER_ROBOTS_HTTP_${response.status}`);
      const body=await response.text();
      if(!body.includes("Sitemap:"))throw new Error("WORKER_ROBOTS_MISSING_SITEMAP");
      console.log("WORKER_ROBOTS_GET=PASS");
      started=true;
      break;
    }catch(e){
      if(String(e).includes("WORKER_ROBOTS_")) throw e;
      await sleep(500);
    }
  }
  if(!started)throw new Error("WORKER_PREVIEW_START_TIMEOUT");
  const response=await get("/",10000);
  if(response.status!==200)throw new Error(`WORKER_HOME_HTTP_${response.status}`);
  const body=await response.text();
  if(!body.includes("ضاديوم"))throw new Error("WORKER_HOME_MISSING_ARABIC_BRAND");
  console.log("WORKER_HOME_GET=PASS");
  const sitemap=await get("/sitemap.xml",10000);
  if(sitemap.status!==200)throw new Error(`WORKER_SITEMAP_HTTP_${sitemap.status}`);
  const xml=await sitemap.text();
  if(!xml.includes("<urlset"))throw new Error("WORKER_SITEMAP_MISSING_XML");
  console.log("WORKER_SITEMAP_GET=PASS");
  console.log("WORKER_LOCAL_PREVIEW_RUNTIME=PASS");
}catch(e){
  console.error("WORKER_LOCAL_PREVIEW_RUNTIME=FAIL",String(e));
  console.error("WORKER_PREVIEW_DIAGNOSTICS_LAST_7000",diagnostics);
  process.exitCode=1;
}finally{
  worker.kill("SIGTERM");
}
