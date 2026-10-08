import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const official=JSON.parse(fs.readFileSync(path.join(root,"data/curriculum-completeness/bahrain-continuing-arabic-plan6-2026-2027.json"),"utf8"));
const material=JSON.parse(fs.readFileSync(path.join(root,"data/curriculum-completeness/bahrain-continuing-arabic-literacy1-drafts-2026-2027.json"),"utf8"));
const titles=official.levels.find(x=>x.level==="الأول محو الأمية").lessons;
if(material.readiness!=="SUPPORTING_CONTENT_DRAFT_PENDING_EDITORIAL_REVIEW"||material.lessonCount!==titles.length)throw Error("INCORRECT_SCOPE_OR_READINESS");
for(let i=0;i<titles.length;i++){
 const e=titles[i],d=material.lessons[i];
 if(!d||d.order!==e.order||d.title!==e.title||d.lessonType!==e.type)throw Error("OFFICIAL_PLAN_MISMATCH_"+i);
 if(d.content.length<420||!d.content.includes("من تأليف ضاديوم")||!d.content.includes("أتدرّب بنفسي")||!d.content.includes("أتحقّق من إجابتي"))throw Error("INCOMPLETE_AUTHORED_DRAFT_"+i);
 if(!Array.isArray(d.learning_objectives)||d.learning_objectives.length<2||!Array.isArray(d.vocabulary)||d.vocabulary.length<2)throw Error("INCOMPLETE_STRUCTURED_DRAFT_"+i);
 if(d.bookTextCopied!==false||d.editorialReview!=="required"||d.source!=="DADYOOM_ORIGINAL_SUPPORTING_DRAFT")throw Error("INVALID_CONTENT_PROVENANCE_"+i);
}
console.log("BAHRAIN_CONTINUING_LITERACY1_DRAFT_AUDIT=PASS");
console.log("OFFICIAL_PLAN_TITLES="+titles.length+" DADYOOM_ORIGINAL_SUPPORTING_DRAFTS="+material.lessons.length+" BOOK_TOC_VERIFIED=NO");
