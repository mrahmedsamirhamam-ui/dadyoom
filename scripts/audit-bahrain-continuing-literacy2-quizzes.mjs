import fs from "node:fs";
const drafts=JSON.parse(fs.readFileSync("data/curriculum-completeness/bahrain-continuing-arabic-literacy2-drafts-2026-2027.json","utf8")).lessons;
const quiz=JSON.parse(fs.readFileSync("data/curriculum-completeness/bahrain-continuing-arabic-literacy2-quizzes-2026-2027.json","utf8"));
if(quiz.questions.length!==drafts.length||quiz.activityCount!==32||quiz.editorialReview!=="required")throw Error("LITERACY2_MCQ_SCOPE_MISMATCH");
for(let i=0;i<drafts.length;i++){
 const d=drafts[i],q=quiz.questions[i];
 if(q.order!==d.order||q.lessonTitle!==d.title||q.type!=="multiple_choice"||q.points!==5)throw Error("LITERACY2_QUESTION_LESSON_MISMATCH_"+i);
 if(q.options.length!==4||new Set(q.options).size!==4||q.options.filter(x=>x===q.correct).length!==1)throw Error("LITERACY2_QUESTION_CORRECTNESS_MISSING_"+i);
 if(q.origin!=="DADYOOM_BH_CONTINUING_LITERACY2_MCQ_V1"||q.review!=="required")throw Error("LITERACY2_QUESTION_SOURCE_MISSING_"+i);
}
console.log("BAHRAIN_CONTINUING_LITERACY2_QUIZ_AUDIT=PASS QUESTIONS="+quiz.questions.length+" REVIEW=REQUIRED");
