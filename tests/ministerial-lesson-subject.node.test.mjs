import test from "node:test";
import assert from "node:assert/strict";
import {auditLessonTopicCompleteness,screenLessonSubject,textHash} from "../lib/ministerial-audit/topic-coverage.mjs";
const hash="c".repeat(64);
const original="في هذه الوحدة نتعلم مفهوم المبتدأ والخبر؛ لأن الجملة الاسمية تبدأ باسم، ومثال ذلك: الطالب مجتهد. نستنتج أن المبتدأ هو الاسم الذي نبدأ به الجملة، وأن الخبر يتمم معنى الكلام.".repeat(3);
function target(){
  return {content:original,livePageReview:{status:"passed",checkedAt:"2026-10-31",contentSha256:textHash(original)},subjectReview:{status:"approved",reviewedBy:"qualified-Arabic-editor",reviewedAt:"2026-10-31",sourceSha256:hash,contentSha256:textHash(original)},
    topicEvidence:[{topicId:"topic-1",start:0,end:original.length,status:"approved",reviewedBy:"qualified-Arabic-editor",sourceSha256:hash,excerptSha256:textHash(original)}]};
}
const official={title:"المبتدأ والخبر",page:18,topics:[{id:"topic-1",title:"تعريف المبتدأ والخبر",page:18}]};
const manifest={source:{sha256:hash}};
test("textbook-only referral is a subject blocker despite any number of activities",()=>{
 const p=target();p.content="راجع الكتاب الرسمي أو نسخة مرخصة منه، ثم استخدم ضاديوم للفهم والتطبيق دون إعادة نشر نص الكتاب.";
 const r=auditLessonTopicCompleteness(official,p,manifest);
 assert.equal(r.isComplete,false);
 assert.ok(r.problems.includes("EXTERNAL_BOOK_REFERENCE_REQUIRES_STANDALONE_EXPLANATION"));
});
test("all ministry microtopics must have their own evidence in actual lesson body",()=>{
 const o={...official,topics:[...official.topics,{id:"topic-2",title:"إعراب المبتدأ والخبر",page:19}]};
 const r=auditLessonTopicCompleteness(o,target(),manifest);
 assert.equal(r.requiredTopics,2);
 assert.equal(r.verifiedTopics,1);
 assert.equal(r.isComplete,false);
 assert.equal(r.topics[1].status,"MISSING_TOPIC_EXPLANATION");
});
test("matching title cannot hide source mismatch, unreviewed edits or different textbook",()=>{
 const a=target();a.content="الدرس لم يعد مطابقا";
 const r=auditLessonTopicCompleteness(official,a,manifest);
 assert.equal(r.isComplete,false);
 assert.ok(r.problems.includes("SUBJECT_CHANGED_SINCE_LAST_REVIEW"));
 const b=target();b.subjectReview.sourceSha256="d".repeat(64);
 const q=auditLessonTopicCompleteness(official,b,manifest);
 assert.equal(q.isComplete,false);
 assert.ok(q.problems.includes("APPROVAL_NOT_LINKED_TO_OFFICIAL_EDITION"));
});
test("genuinely approved content with exact explanatory anchor is technically eligible",()=>{
 const r=auditLessonTopicCompleteness(official,target(),manifest);
 assert.equal(r.isComplete,true,JSON.stringify(r));
 assert.equal(r.status,"LESSON_SUBJECT_VERIFIED");
 assert.equal(r.requiredTopics,1);
});
test("no unverifiable unofficial topic outline can be certified",()=>{
 const r=auditLessonTopicCompleteness({title:"المبتدأ والخبر"},target(),manifest);
 assert.equal(r.isComplete,false);
 assert.ok(r.problems.includes("OFFICIAL_LESSON_TOPIC_OUTLINE_NOT_REVIEWED"));
});
test("short template and replacement character get flagged as content quality risks",()=>{
 assert.ok(screenLessonSubject({content:"ضع النص هنا"}).includes("PLACEHOLDER_IN_LESSON_BODY"));
 assert.ok(screenLessonSubject({content:"شرح \ufffd"}).includes("INVALID_CHARACTERS_IN_LESSON_BODY"));
});
