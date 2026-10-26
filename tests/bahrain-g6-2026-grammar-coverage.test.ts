import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read=(file: string)=>JSON.parse(readFileSync(resolve(process.cwd(),file),"utf8"));
const source=read("data/curriculum-sources/bh-g6-s1-2026-ministry-plan-index.json");
const drafts=[
 "data/curriculum-drafts/bh-g6-s1-original-grammar-reviews.json",
 "data/curriculum-drafts/bh-g6-s1-original-past-tense-practice.json",
 "data/curriculum-drafts/bh-g6-s1-original-mood-and-imperative-practice.json",
 "data/curriculum-drafts/bh-g6-s1-original-nominal-grammar-practice.json",
].map(read);
const items=drafts.flatMap(x=>x.practices);

describe("G6 grammar authoring inventory across all 13 official first-term headings",()=>{
 it("covers exactly 13 original topic-aligned activities and 52 questions without duplicates",()=>{
   expect(source.grammarTopics).toHaveLength(13);
   expect(items).toHaveLength(13);
   expect(items.reduce((n,x)=>n+x.questions.length,0)).toBe(52);
   const sorted=[...items].sort((a,b)=>a.topicOrder-b.topicOrder);
   expect(sorted.map(x=>x.topicOrder)).toEqual(Array.from({length:13},(_,i)=>i+1));
   expect(sorted.map(x=>x.officialTopic)).toEqual(source.grammarTopics.map(
     (x:{title:string})=>x.title,
   ));
   expect(new Set(items.map(x=>x.officialTopic)).size).toBe(13);
   for(const [i,item] of sorted.entries()){
     const ref=source.grammarTopics[i];
     expect(item.source.url).toBe(source.source.url);
     expect(item.source.textbookPageStart).toBe(ref.textbookPageStart);
     expect(item.source.textbookPageEnd).toBe(ref.textbookPageEnd);
     expect(item.source.planPdfPage).toBe(ref.planPdfPage);
     expect(item.publicationApproved).toBe(false);
     expect(item.content.length).toBeGreaterThanOrEqual(800);
     expect(item.examples).toHaveLength(3);
     expect(item.objectives).toHaveLength(4);
     expect(item.questions).toHaveLength(4);
     expect(item.questions.map((q:{cognitiveLevel:string})=>q.cognitiveLevel))
       .toEqual(["remember","understand","analyze","apply"]);
     expect(new Set(item.questions.map((q:{question:string})=>q.question)).size).toBe(4);
     for(const q of item.questions){
       expect(q.options.map((o:{id:string})=>o.id)).toEqual(["a","b","c"]);
       expect(q.options.some((o:{id:string})=>o.id===q.correctAnswer)).toBe(true);
       expect(q.explanation.length).toBeGreaterThanOrEqual(70);
     }
   }
 });
 it("preserves editorial hold for all four packages and no asserted Ministry textbook verification",()=>{
   for(const file of drafts){
     expect(file.countryCode).toBe("BH");
     expect(file.grade).toBe(6);
     expect(file.semester).toBe(1);
     expect(file.academicYear).toBe("2026-2027");
     expect(file.rights.contentOwner).toBe("dadyoom");
     expect(file.rights.officialTextbookBodyVerified).toBe(false);
     expect(file.rights.publicationApproved).toBe(false);
     expect(file.rights.teacherReview).toBe("pending");
   }
   expect(source.review.officialTextbookBodyVerified).toBe(false);
   expect(source.review.publicationApproved).toBe(false);
 });
});
