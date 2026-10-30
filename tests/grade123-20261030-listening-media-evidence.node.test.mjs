import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const audit=JSON.parse(readFileSync(new URL("../data/audits/grades123-listening-66-scripts-no-direct-audio-20261030.json",import.meta.url),"utf8"));
test("all 66 teacher-led listening lessons retain honest media-readiness evidence",()=>{
 assert.equal(audit.summary.lessons,66);
 assert.equal(audit.summary.publishedActivities,198);
 assert.equal(audit.summary.listeningActivities,66);
 assert.equal(audit.summary.requiresTeacherRead,66);
 assert.equal(audit.summary.teacherReadScripts,66);
 assert.equal(audit.summary.multipleChoiceActivities,132);
 assert.equal(audit.summary.explicitDirectAudioLinks,0);
 assert.equal(audit.readiness.independentStudentAudioPlaybackVerified,false);
 assert.equal(audit.readiness.teacherModeratedListeningAvailableAsScript,true);
 assert.equal(audit.readiness.lessonAudioComplete,false);
});
