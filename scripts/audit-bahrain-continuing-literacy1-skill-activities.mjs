import fs from 'node:fs';
const d=JSON.parse(fs.readFileSync('data/curriculum-completeness/bahrain-continuing-arabic-literacy1-skill-activities-2026-2027.json','utf8'));
const mcq=JSON.parse(fs.readFileSync('data/curriculum-completeness/bahrain-continuing-arabic-literacy1-quizzes-2026-2027.json','utf8'));
if(d.activities.length!==25||mcq.questions.length!==25||d.editorialReview!=='required')throw Error('WRONG_SCOPE');
for(const [i,a] of d.activities.entries()){
 if(a.order!==i+1||a.lessonTitle!==mcq.questions[i].lessonTitle||!a.prompt||!a.practice)throw Error('WRONG_LESSON_'+i);
 if(a.format==='ordering'){if(a.words.length<2||a.words.length!==new Set(a.words).size)throw Error('WRONG_ORDER_'+i)}
 else if(a.format==='fill_blank'){if(!a.sentence.includes('___')||a.options.length!==3||a.options.filter(x=>x===a.correct).length!==1)throw Error('WRONG_FILL_'+i)}
 else throw Error('UNSUPPORTED_FORMAT_'+i);
}
console.log('BH_LITERACY1_SKILLS=PASS GRADED=25 PRACTICE=25 REVIEW=REQUIRED');
