import fs from "node:fs";
const official=JSON.parse(fs.readFileSync("data/curriculum-completeness/bahrain-continuing-arabic-plan6-2026-2027.json","utf8"));
const draft=JSON.parse(fs.readFileSync("data/curriculum-completeness/bahrain-continuing-arabic-literacy2-drafts-2026-2027.json","utf8"));
const rows=official.levels.find(l=>l.level==="الثاني محو الأمية").lessons;
if(draft.readiness!=="SUPPORTING_CONTENT_DRAFT_PENDING_EDITORIAL_REVIEW"||draft.lessonCount!==rows.length)throw Error("LITERACY2_SCOPE_INCOMPLETE");
for(let i=0;i<rows.length;i++){
 const a=rows[i],b=draft.lessons[i];
 if(a.order!==b.order||a.title!==b.title||a.type!==b.lessonType)throw Error("LITERACY2_OFFICIAL_TITLE_MISMATCH_"+i);
 if(b.content.length<500||!b.content.includes("محتوى تعليمي أصلي داعم")||!b.content.includes("أطبق بنفسي")||!b.content.includes("مفتاح الإجابة النموذجي"))throw Error("LITERACY2_CONTENT_INSUFFICIENT_"+i);
 if(b.bookTextCopied!==false||b.editorialReview!=="required"||b.origin!=="DADYOOM_ORIGINAL_SUPPORTING_DRAFT")throw Error("LITERACY2_PROVENANCE_MISSING_"+i);
 if(!Array.isArray(b.vocabulary)||b.vocabulary.length<2||b.learning_objectives.length<3)throw Error("LITERACY2_OBJECTIVES_MISSING_"+i);
}
console.log("BAHRAIN_CONTINUING_LITERACY2_DRAFT_AUDIT=PASS LESSONS="+rows.length+" HUMAN_REVIEW_REQUIRED=YES");
