// Content FIRST: validates that an official lesson's *topics* have distinct, anchored,
// editorially approved explanatory passages in the actual Dadyoom lesson body.
// Not a verifier of copyrighted verbatim text, spelling perfection or official book provenance.
import { createHash } from "node:crypto";

const unsafe = /(?:راجع|ارجع|استخدم|افتح)\s+(?:الكتاب|النص|الدرس)\s+(?:الرسمي|المدرسي)|(?:دون\s+إعادة\s+نشر|ليس\s+نص\s+الكتاب|ليس\s+نصا?\s+من\s+الكتاب)/iu;
const boilerplate = /(?:ضع\s+النص\s+هنا|lorem\s+ipsum|TODO\b|undefined\b|محتوى\s+الدرس\s+قيد\s+الإعداد)/iu;
const explanatoryCue = /(?:يعني|المقصود|لأن|حيث|مثلًا|مثلا|تتكون|نستنتج|تعريف|الفكرة|السبب|النتيجة|يتضح|عندما|يتعلم|من\s+ذلك|مثال)/u;
const textHash = (text) => createHash("sha256").update(text,"utf8").digest("hex");
const nonEmpty = (s) => typeof s === "string" && s.trim().length > 0;
const unique = (arr) => new Set(arr).size === arr.length;
export const isSha = (v) => typeof v === "string" && /^[0-9a-f]{64}$/i.test(v);

export function screenLessonSubject(lesson) {
  const body=String(lesson?.content ?? "");
  const issues=[];
  const n=body.trim().length;
  // These patterns identify *document layout instructions*, not a Ministry lesson.
  // A generic book title with an EMPTY subject likewise cannot be a finished lesson.
  const title=String(lesson?.title ?? "").normalize("NFKC")
    .replace(/[\u064b-\u065f\u0670\u0640]/g,"").trim();
  if(/^(?:يُ?قسم|يقسّم)\s+الدّ?رس\s+إلى\s*(?:جزأين|(?:ثلاثة|ثالثة)\s+أجزاء|3)$/u.test(title))
    issues.push("OCR_PLAN_INSTRUCTION_MISLABELED_AS_LESSON");
  if(/^:?\s*(?:القراءة|التدريبات|الدرس|الوحدة)\s*:?$/u.test(title))
    issues.push("BARE_SECTION_HEADING_MISLABELED_AS_LESSON");
  // Year-wide subject-area containers cannot themselves prove that a
  // particular Ministry textbook story, poem or grammar lesson is taught.
  // Do not use content length as a substitute for the official topic.
  const unitTitle = String(lesson?.unitTitle ?? "").normalize("NFKC").trim();
  if (/^(?:النطاق السنوي|الفصل الدراسي (?:الأول|الثاني))\s*[—-]\s*مجالات اللغة العربية$/u.test(unitTitle))
    issues.push("GENERIC_SUBJECT_AREA_NOT_INDIVIDUAL_TEXTBOOK_TOPIC");
  if(n===0&&/(?:كتاب|نصوص|عيون الادب|عيون الأدب)/u.test(title))
    issues.push("EMPTY_TEXTBOOK_TITLE_NOT_INDIVIDUAL_LESSON");
  if(n===0)issues.push("EMPTY_LESSON_SUBJECT");
  else if(n<120)issues.push("VERY_SHORT_LESSON_SUBJECT_REVIEW");
  else if(n<400)issues.push("SHORT_LESSON_SUBJECT_REVIEW");
  if(unsafe.test(body))issues.push("EXTERNAL_BOOK_REFERENCE_REQUIRES_STANDALONE_EXPLANATION");
  if(boilerplate.test(body))issues.push("PLACEHOLDER_IN_LESSON_BODY");
  if(/[\uFFFD\u0000-\u0008\u000b\u000e-\u001f]/u.test(body))issues.push("INVALID_CHARACTERS_IN_LESSON_BODY");
  if(/(.)\1{7,}/u.test(body))issues.push("SUSPICIOUS_CHARACTER_REPETITION");
  if(!explanatoryCue.test(body)&&n<800)issues.push("NO_OBVIOUS_EXPLANATION_IN_SHORT_BODY");
  return [...new Set(issues)];
}
export function checkOfficialTopicOutline(officialLesson) {
  const issues=[],topics=officialLesson?.topics;
  if(!Array.isArray(topics)||topics.length===0)
    return ["OFFICIAL_LESSON_TOPIC_OUTLINE_NOT_REVIEWED"];
  if(!unique(topics.map(t=>t.id)))issues.push("DUPLICATE_OFFICIAL_TOPIC_IDS");
  for(const t of topics) {
    if(!nonEmpty(t.id)||!nonEmpty(t.title))issues.push("INVALID_OFFICIAL_TOPIC");
    if(!Number.isInteger(t.page)||t.page<1)issues.push("OFFICIAL_TOPIC_PAGE_MISSING");
  }
  return [...new Set(issues)];
}
export function auditLessonTopicCompleteness(officialLesson,dadyoomLesson,manifest) {
  const problems=screenLessonSubject(dadyoomLesson);
  const outlineIssues=checkOfficialTopicOutline(officialLesson);
  problems.push(...outlineIssues);
  const required=Array.isArray(officialLesson?.topics)?officialLesson.topics:[];
  const body=String(dadyoomLesson?.content??"");
  const approval=dadyoomLesson?.subjectReview;
  if(approval?.status!=="approved"||!nonEmpty(approval.reviewedBy)||!nonEmpty(approval.reviewedAt))
    problems.push("LESSON_SUBJECT_NOT_EDITORIALLY_APPROVED");
  // A database row can be published while the live lesson route is blank or broken.
  if(dadyoomLesson?.livePageReview?.status!=="passed"||
     dadyoomLesson.livePageReview.contentSha256!==textHash(body)||
     !nonEmpty(dadyoomLesson.livePageReview.checkedAt))
    problems.push("LIVE_STUDENT_LESSON_PAGE_NOT_VERIFIED");
  if(!isSha(approval?.contentSha256)||approval.contentSha256!==textHash(body))
    problems.push("SUBJECT_CHANGED_SINCE_LAST_REVIEW");
  if(approval?.sourceSha256!==manifest?.source?.sha256||!isSha(approval?.sourceSha256))
    problems.push("APPROVAL_NOT_LINKED_TO_OFFICIAL_EDITION");
  const evidence=Array.isArray(dadyoomLesson?.topicEvidence)?dadyoomLesson.topicEvidence:[];
  const findings=[];
  const used=new Set();
  for(const topic of required){
    const matches=evidence.filter(e=>e.topicId===topic.id);
    if(matches.length!==1){
      findings.push({topicId:topic.id,title:topic.title,sourcePage:topic.page,status:matches.length?"DUPLICATE_TOPIC_EVIDENCE":"MISSING_TOPIC_EXPLANATION"});
      continue;
    }
    const e=matches[0];
    if(e.status!=="approved"||e.sourceSha256!==manifest?.source?.sha256||e.reviewedBy!==approval?.reviewedBy){
      findings.push({topicId:topic.id,title:topic.title,sourcePage:topic.page,status:"TOPIC_EXPLANATION_NOT_APPROVED_FOR_SOURCE"});
      continue;
    }
    if(!Number.isInteger(e.start)||!Number.isInteger(e.end)||e.start<0||e.end>body.length||e.end-e.start<100){
      findings.push({topicId:topic.id,title:topic.title,sourcePage:topic.page,status:"TOPIC_EXPLANATION_TOO_SHORT_OR_UNANCHORED"});
      continue;
    }
    const excerpt=body.slice(e.start,e.end);
    if(!nonEmpty(excerpt)||textHash(excerpt)!==e.excerptSha256||!isSha(e.excerptSha256)||!explanatoryCue.test(excerpt)){
      findings.push({topicId:topic.id,title:topic.title,sourcePage:topic.page,status:"TOPIC_EXPLANATION_TEXT_OR_HASH_MISMATCH"});
      continue;
    }
    if([...used].some(k=>e.start<k.end&&k.start<e.end)){
      findings.push({topicId:topic.id,title:topic.title,sourcePage:topic.page,status:"REUSED_PASSAGE_FOR_DISTINCT_TOPIC"});
      continue;
    }
    used.add({start:e.start,end:e.end});
    findings.push({topicId:topic.id,title:topic.title,sourcePage:topic.page,status:"SUBJECT_EXPLANATION_EVIDENCED"});
  }
  const isComplete=problems.length===0&&findings.length===required.length&&
    findings.every(f=>f.status==="SUBJECT_EXPLANATION_EVIDENCED");
  return {isComplete,status:isComplete?"LESSON_SUBJECT_VERIFIED":"LESSON_SUBJECT_INCOMPLETE_OR_UNVERIFIED",
    requiredTopics:required.length,verifiedTopics:findings.filter(x=>x.status==="SUBJECT_EXPLANATION_EVIDENCED").length,
    problems:[...new Set(problems)],topics:findings};
}
export { textHash };
