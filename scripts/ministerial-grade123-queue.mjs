#!/usr/bin/env node
// Builds a reproducible 22-country stage-one review queue from a dated read-only snapshot.
import fs from "node:fs";
import path from "node:path";
import {buildGrade123Queue} from "../lib/ministerial-audit/grade123-queue.mjs";
const args=process.argv.slice(2);
const option=(name,fallback)=>{const i=args.indexOf(name);return i===-1?fallback:args[i+1];};
const input=path.resolve(option("--input","data/ministerial-audit/2026-11-04-live-grade123-all22-source-body-triage.json"));
const queue=buildGrade123Queue(JSON.parse(fs.readFileSync(input,"utf8")));
const output=option("--out",null);
if(output){
 const dest=path.resolve(output);
 fs.mkdirSync(path.dirname(dest),{recursive:true});
 fs.writeFileSync(dest,JSON.stringify(queue,null,2)+"\n");
 console.log("GRADE123_REVIEW_QUEUE="+dest+"; COUNTRIES="+queue.countries+"; GRADE_CELLS="+queue.gradeCells+"; OFFICIAL_COMPLETENESS_NOT_CERTIFIED");
}else{
 console.log(JSON.stringify(queue,null,2));
}
