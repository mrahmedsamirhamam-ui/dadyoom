import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {describe,expect,it} from "vitest";
type Option={id:string;text:string};
type Question={id:string;type:string;cognitiveLevel:string;question:string;options:Option[];correctAnswer:"a"|"b"|"c";explanation:string};
type Word={word:string;meaning:string;example:string;order:number};
type Lesson={existingLessonId:string;existingTitle:string;expectedLessonType:string;expectedGrade:number;expectedSemester:number;teacherReview:string;publicationApproved:boolean;officialTocVerified:boolean;objectives:string[];vocabulary:Word[];questions:Question[];pedagogy:{opening:string;discovery:string;cooperative:string;differentiated:{support:string;extension:string};performance:string;teacherRubric:Array<{max:number}>;openWritingGrading:string}};
const p=JSON.parse(readFileSync(resolve(process.cwd(),"data/curriculum-drafts/bh-g2-s2-original-existing-reading-enhancements.json"),"utf8")) as {
 countryCode:string;grade:number;semester:number;rights:{publicationApproved:boolean;teacherReview:string;officialTextbookQuoted:boolean;sourceYearTextbookAlignment:string};
 importSafety:{mode:string;noNewLessonRecords:boolean;noProductionWrites:boolean;noLearnerProgressMutation:boolean;noAutomaticFreeTextGrading:boolean};
 lessons:Lesson[];
};
describe("Grade-2 original reading supplements enhance existing IDs only",()=>{
 it("preserves all 12 existing lesson identities and supplies 48 words, 48 source-grounded explained MCQs",()=>{
  expect(p.countryCode).toBe("BH"); expect(p.grade).toBe(2);expect(p.semester).toBe(2);
  expect(p.lessons).toHaveLength(12);
  expect(new Set(p.lessons.map(x=>x.existingLessonId)).size).toBe(12);
  expect(new Set(p.lessons.map(x=>x.existingTitle)).size).toBe(12);
  expect(p.lessons.flatMap(x=>x.vocabulary)).toHaveLength(48);
  expect(p.lessons.flatMap(x=>x.questions)).toHaveLength(48);
  const answerPositions={a:0,b:0,c:0};
  for(const [i,l] of p.lessons.entries()){
   expect(l.existingLessonId).toMatch(/^[a-f0-9-]{36}$/i);
   expect(l.expectedLessonType).toBe("reading");
   expect(l.expectedGrade).toBe(2);expect(l.expectedSemester).toBe(2);
   expect(l.teacherReview).toBe("pending");
   expect(l.publicationApproved).toBe(false);
   expect(l.officialTocVerified).toBe(false);
   expect(l.objectives).toHaveLength(4);
   expect(l.vocabulary).toHaveLength(4);
   expect(l.questions).toHaveLength(4);
   expect(new Set(l.vocabulary.map(w=>w.word)).size).toBe(4);
   expect(l.vocabulary.map(w=>w.order)).toEqual([1,2,3,4]);
   for(const word of l.vocabulary){
    expect(word.meaning.length).toBeGreaterThan(20);
    expect(word.example.length).toBeGreaterThan(22);
   }
   for(const [j,q] of l.questions.entries()){
    expect(q.question.length).toBeGreaterThan(16);
    expect(q.explanation.length).toBeGreaterThan(22);
    expect(q.cognitiveLevel).toBe(["remember","understand","analyze","apply"][j]);
    expect(q.options.map(x=>x.id)).toEqual(["a","b","c"]);
    expect(new Set(q.options.map(x=>x.text)).size).toBe(3);
    expect(q.correctAnswer).toBe("abc"[(i*4+j)%3]);
    expect(q.options.filter(x=>x.id===q.correctAnswer)).toHaveLength(1);
    answerPositions[q.correctAnswer]++;
   }
   expect(l.pedagogy.opening).toContain(l.existingTitle);
   expect(l.pedagogy.differentiated.support).not.toBe(l.pedagogy.differentiated.extension);
   expect(l.pedagogy.teacherRubric.reduce((s,x)=>s+x.max,0)).toBe(9);
   expect(l.pedagogy.openWritingGrading).toBe("human_teacher_only");
  }
  expect(answerPositions).toEqual({a:16,b:16,c:16});
 });
 it("always remains unpublished until external textbook, teacher, data and legal gates",()=>{
  expect(p.rights).toEqual({authoredBy:"Dadyoom",sourceYearTextbookAlignment:"unverified",officialTextbookQuoted:false,publicationApproved:false,teacherReview:"pending"});
  expect(p.importSafety).toMatchObject({mode:"review_only",noNewLessonRecords:true,noProductionWrites:true,noLearnerProgressMutation:true,noAutomaticFreeTextGrading:true});
 });
});
