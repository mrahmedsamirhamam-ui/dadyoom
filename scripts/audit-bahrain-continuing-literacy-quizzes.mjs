import fs from "node:fs";
const drafts=JSON.parse(fs.readFileSync("data/curriculum-completeness/bahrain-continuing-arabic-literacy1-drafts-2026-2027.json","utf8")).lessons;
const data=JSON.parse(fs.readFileSync("data/curriculum-completeness/bahrain-continuing-arabic-literacy1-quizzes-2026-2027.json","utf8"));
if(data.questions.length!==drafts.length||data.review!=="required")throw Error("LITERACY_QUIZ_SCOPE_INVALID");
for(let i=0;i<drafts.length;i++){
 const d=drafts[i],q=data.questions[i];
 if(q.order!==d.order||q.lessonTitle!==d.title||q.type!=="multiple_choice"||q.points!==5)throw Error("LITERACY_QUIZ_LESSON_MISMATCH_"+i);
 if(q.options.length!==4||new Set(q.options).size!==4||q.options.filter(x=>x===q.correct).length!==1)throw Error("LITERACY_QUIZ_ANSWER_INVALID_"+i);
 if(q.origin!=="DADYOOM_BH_CONTINUING_LITERACY1_MCQ_V1"||q.review!=="required")throw Error("LITERACY_QUIZ_PROVENANCE_INVALID_"+i);
}
console.log("BAHRAIN_CONTINUING_LITERACY1_QUIZ_AUDIT=PASS ACTIVITIES="+data.questions.length+" REVIEW=REQUIRED");
