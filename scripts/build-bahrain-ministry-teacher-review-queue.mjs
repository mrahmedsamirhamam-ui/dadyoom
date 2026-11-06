/**
 * Bahrain 2026/27 teacher review queue.
 * Run locally on checked-in, nonpersonal, immutable audit snapshots.
 * Does NOT modify live lessons or certify textbook content.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const triage = JSON.parse(execFileSync(process.execPath, [
  "scripts/compare-bahrain-primary-ministry-topics.mjs", "--json",
], { encoding: "utf8" }));
const quality = JSON.parse(readFileSync(
  "data/curriculum-audits/bh-2026-2027-g1-g3-s1-content-signals.json", "utf8"
));

if (quality.snapshotDate !== triage.productionSnapshotAt ||
    quality.publishedRows.length !== triage.summary.localPublishedRows) {
  throw new Error("Two mismatched live snapshots: re-run a coordinated read-only audit before comparing");
}

const expectedCoreG1Skills = ["listening_word", "speaking_word", "reading_word", "writing_word", "expression_word"];
const skillNames = {
  listening_word: "الاستماع",
  speaking_word: "التحدث",
  reading_word: "القراءة",
  writing_word: "الخط والكتابة",
  expression_word: "التعبير",
};
const review = triage.comparisons.map(item => {
  const evidence = item.publishedTitleCandidates.flatMap(title =>
    quality.publishedRows.filter(row =>
      row.grade_number === item.grade && row.title === title
    ));
  const warningCodes = new Set();
  const checks = [];
  if (evidence.length === 0) {
    warningCodes.add("NO_PUBLISHED_TOPIC_CANDIDATE");
    checks.push("إنشاء موضوع رسمي بعد مراجعة المصدر؛ لا تعتمد أي مسودة مشوهة أو غير موثقة");
  }
  if (item.originalTextSubstitutionNotices > 0 || evidence.some(e => e.substitute_notice) &&
    item.category === "core" && item.grade >= 2) {
    warningCodes.add("ORIGINAL_READING_NOT_OFFICIAL_TEXT");
    checks.push("إبقاء نص ضاديوم الإثرائي منفصلًا؛ مراجعة موضوع كتاب الوزارة والأهداف والأسئلة، والربط بمصدر مسموح");
  }
  if (item.category === "preparation_worksheet" && item.originalWorksheetEnrichmentNotices > 0) {
    warningCodes.add("ORIGINAL_WORKSHEET_ENRICHMENT");
    checks.push("مقارنة المهمة التعليمية بورقة الوزارة رقم " + item.officialId.split("-").at(-1) +
      "؛ إبقاء إثراء ضاديوم منفصلًا عن المحتوى المقرر");
  }
  if (item.status === "REVIEW_SKILL_NUMBER_FOUND_SPECIFIC_TOPIC_NOT_IN_TITLE") {
    warningCodes.add("OFFICIAL_REVIEW_STORY_UNVERIFIED");
    checks.push("فحص نص المراجعة المسند إلى موضوع الوزارة؛ رقم المهارة وحده ليس مطابقة");
  }
  if (item.status === "WORKSHEET_NUMBER_FOUND_TITLE_REVIEW") {
    warningCodes.add("WORKSHEET_NUMBER_ONLY_NOT_TOPIC");
    checks.push("تحقق من عنوان ورقة العمل ومهارتها لا رقمها فقط");
  }
  if (evidence.length > 0 && evidence.every(e => !e.explicit_goal_label)) {
    warningCodes.add("GOAL_LABEL_NOT_DETECTED");
    checks.push("صياغة هدف تعلم واضح وقابل للقياس؛ عدم العثور على العبارة لا يثبت غياب الهدف");
  }
  if (evidence.length > 0 && evidence.every(e => !e.assessment_word)) {
    warningCodes.add("ASSESSMENT_WORD_NOT_DETECTED");
    checks.push("فحص ارتباط السؤال الختامي والتغذية الراجعة بهدف الدرس");
  }
  if (item.grade === 1 && item.category === "core" && item.officialTitle.includes("حرف (") && evidence.length) {
    const missing = expectedCoreG1Skills.filter(skill => evidence.every(e => !e[skill]));
    if (missing.length) {
      warningCodes.add("MINISTRY_SKILL_MENTION_NOT_DETECTED");
      checks.push("مراجعة عرض مهارات " + missing.map(s => skillNames[s]).join("، ") +
        " في ضوء خطة حروف الصف الأول؛ كلمات البحث وحدها ليست تقييم جودة");
    }
  }
  if (item.multiplePublishedCandidates) {
    warningCodes.add("MULTIPLE_PUBLISHED_TITLE_CANDIDATES");
    checks.push("فصل التكرار والمكملات دون حذف درس صحيح أو نشاط إثرائي");
  }
  if (item.category === "core" && (item.officialTitle.includes("حكمة أب") ||
      item.officialTitle.includes("الراحات") || item.officialTitle.includes("جزاء المعتدي") ||
      item.officialTitle.includes("بالروح أفديها") || item.officialTitle === "دراجتي" ||
      item.officialTitle === "نظافتي")) {
    warningCodes.add("POEM_MEMORY_AND_ORIGINAL_SOURCE_CHECK");
    checks.push("تحقق من دراسة القصيدة المطلوبة والحفظ المحدد ومصدر النص المسموح دون إعادة نشر القصيدة المحمية");
  }
  checks.push("توثيق المعلم لمراجعة مصدر " + item.officialBookPages +
    "، وموضوع الدرس، والشرح، والتدريبات، والتقويم قبل اعتماد الاكتمال");
  const priority = warningCodes.has("NO_PUBLISHED_TOPIC_CANDIDATE") ||
    warningCodes.has("ORIGINAL_READING_NOT_OFFICIAL_TEXT") ? "P0" :
    warningCodes.size > 0 ? "P1" : "P2";
  return {
    officialId: item.officialId,
    grade: item.grade,
    category: item.category,
    ministryTitle: item.officialTitle,
    ministryBookPage: item.officialBookPages,
    sourcePlanUrl: item.officialPlanUrl,
    publishedTitleCandidates: item.publishedTitleCandidates,
    preliminaryTitleStatus: item.status,
    priority,
    warningCodes: [...warningCodes],
    teacherActions: [...new Set(checks)],
    reviewState: "PENDING_HUMAN_SOURCE_AND_PEDAGOGY_REVIEW",
    certifiedComplete: false,
  };
});

const priorityOrder = { P0: 0, P1: 1, P2: 2 };
// Honour the agreed work sequence: grade 1, then 2, then 3. Priorities rank
// the teacher tasks WITHIN each grade, never skip grade-one curriculum work.
review.sort((a,b) => a.grade-b.grade || priorityOrder[a.priority]-priorityOrder[b.priority] ||
  a.officialId.localeCompare(b.officialId,"en"));
const gradeBreakdown = [1,2,3].map(grade => {
  const subset=review.filter(x=>x.grade===grade);
  return {grade, reviewed:0, items:subset.length,
    P0:subset.filter(x=>x.priority==="P0").length,
    P1:subset.filter(x=>x.priority==="P1").length,
    P2:subset.filter(x=>x.priority==="P2").length};
});
const report={
  schemaVersion:1,
  country:"BH",year:"2026-2027",semester:1,
  source:triage.sourcePlanUrl,
  inputSnapshot:quality.snapshotDate,
  purpose:"ACTIONABLE_TEACHER_SOURCE_REVIEW_QUEUE_NOT_OFFICIAL_COMPLETION",
  rules:[
    "Keyword flags and title candidates only; NOT human-verified curricular content.",
    "A missing objective label is not proof of a missing objective; a word match is not proof of teaching quality.",
    "No Ministry source text or copyrighted poems reproduced; do not paste book text without rights.",
    "P0/P1/P2 are reviewer work priorities, NOT severity ratings on children's learning, and NOT release permissions.",
    "No official content coverage percentage may be inferred from this review queue.",
  ],
  summary:{
    totalItems:review.length,
    byPriority:Object.fromEntries(["P0","P1","P2"].map(p=>[p,review.filter(x=>x.priority===p).length])),
    topicsCertifiedComplete:0,
    officialCoveragePercent:null,
    teacherReviewCompleted:0,
  },gradeBreakdown,review
};
if (process.argv.includes("--json")) {
  process.stdout.write(JSON.stringify(report,null,2)+"\n");
} else {
  console.log("BH_OFFICIAL_SELECTED_TOPICS="+review.length);
  console.log("P0_SOURCE_CONTENT_REVIEW="+report.summary.byPriority.P0);
  console.log("P1_SUBSTANTIVE_OR_FORMAT_REVIEW="+report.summary.byPriority.P1);
  console.log("P2_BASELINE_CONTENT_VERIFICATION="+report.summary.byPriority.P2);
  console.log("HUMAN_REVIEW_COMPLETED=0");
  console.log("OFFICIAL_COMPLETION=NOT_CERTIFIED");
  for (const g of gradeBreakdown) console.log("G"+g.grade+"="+JSON.stringify(g));
  for (const x of review.filter(x=>x.priority==="P0"))
    console.log("PRIORITY_P0 "+x.officialId+" "+x.ministryTitle+
      " :: "+x.warningCodes.join(","));
}
