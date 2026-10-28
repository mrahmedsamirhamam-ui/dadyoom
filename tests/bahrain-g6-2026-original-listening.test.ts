import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read=(path: string)=>JSON.parse(readFileSync(resolve(process.cwd(),path),"utf8"));
const index=read("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
const pack=read("data/curriculum-drafts/bh-g6-s1-original-listening-practice.json");

describe("Bahrain Grade-6 original listening companion — not official Ministry audio",()=>{
 it("aligns three titles and real teacher guide page references while preserving the unverified boundary",()=>{
   expect(pack.countryCode).toBe("BH");
   expect(pack.grade).toBe(6);
   expect(pack.semester).toBe(1);
   expect(pack.academicYear).toBe("2026-2027");
   expect(pack.activities).toHaveLength(3);
   expect(pack.sourceIndex).toBe("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
   expect(pack.activities.map((a:{officialTopic:string})=>a.officialTopic))
     .toEqual(index.listeningTopics.map((o:{title:string})=>o.title));
   expect(pack.activities.map((a:{source:{textbookPageStart:number}})=>a.source.textbookPageStart))
     .toEqual([127,129,130]);
   for (const [i,item] of pack.activities.entries()){
     const source=index.listeningTopics[i];
     expect(item.source.url).toBe(index.source.url);
     expect(item.source.book).toBe(source.book);
     expect(item.source.textbookPageStart).toBe(source.textbookPageStart);
     expect(item.source.textbookPageEnd).toBe(source.textbookPageEnd);
     expect(item.source.planPdfPage).toBe(source.planPdfPage);
     expect(item.sourceKind).toBe("official_listening_topic_title_only");
     expect(item.source.visualTableVerification).toBe("pending");
     expect(item.recordingPresent).toBe(false);
     expect(item.audioTranscriptVerified).toBe(false);
     expect(item.publicationApproved).toBe(false);
   }
 });

 it("contains three independent teacher-read scripts, vocabulary, differentiated listenings and 12 valid questions",()=>{
   const counts={a:0,b:0,c:0};
   const scripts=new Set<string>();
   for(const item of pack.activities){
     expect(item.originalTeacherScript.length).toBeGreaterThanOrEqual(620);
     expect(item.status).toBe("original_teacher_read_aloud_draft_not_official_audio");
     expect(item.vocabularyTargets).toHaveLength(3);
     expect(item.teachingNotes.firstListening).toContain("يقرأ المعلم");
     expect(item.teachingNotes.secondListening).toContain("يعيد المعلم");
     expect(item.teachingNotes.differentiation).toContain("للمتقدم");
     expect(item.questions).toHaveLength(4);
     expect(item.questions.map((q:{cognitiveLevel:string})=>q.cognitiveLevel))
       .toEqual(["remember","understand","infer","apply"]);
     for(const q of item.questions){
       expect(q.options.map((o:{id:string})=>o.id)).toEqual(["a","b","c"]);
       expect(new Set(q.options.map((o:{text:string})=>o.text)).size).toBe(3);
       expect(q.options.some((o:{id:string})=>o.id===q.correctAnswer)).toBe(true);
       expect(q.explanation.length).toBeGreaterThanOrEqual(70);
       counts[q.correctAnswer as keyof typeof counts]++;
     }
     scripts.add(item.originalTeacherScript);
   }
   expect(scripts.size).toBe(3);
   expect(counts).toEqual({a:4,b:4,c:4});
 });

 it("does not assert copyright access, official transcript equivalence, published audio or student grades",()=>{
   expect(pack.rights).toEqual({
     scriptOwner:"dadyoom",officialAudioImported:false,
     officialTextbookTranscriptVerified:false,
     publicationApproved:false,teacherAudioReview:"pending",
   });
   expect(index.review.officialTeacherGuideAudioVerified).toBe(false);
   expect(pack.activities.every((a:{publicationApproved:boolean})=>!a.publicationApproved)).toBe(true);
 });
});
