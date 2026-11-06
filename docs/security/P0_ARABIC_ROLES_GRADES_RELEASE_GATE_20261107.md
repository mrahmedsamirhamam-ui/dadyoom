# P0 — إحكام العربية والصلاحيات والدرجات قبل الإطلاق (7 نوفمبر 2026)

**الحالة:** ملفات مقترحة جاهزة للاختبار على فرع منفصل، وليست ترخيصًا بنشر الإنتاج. لا يحق وصف المنصة «Production Ready 100%» حتى تنجح اختبارات Cloudflare/Supabase الحقيقية.

## نطاق التنفيذ البرمجي

### 1. التمييز والأعداد وواجهات الأطراف الأربعة

- \`lib/i18n/arabic-count.mjs\`: 12 اسمًا معدودًا موثّقة الصياغة، تحويل الجمع (3–10) والمفرد المنصوب (11–99)، والمثنى (2)، وحالة الصفر.
- \`app/(dashboard)/teacher/page.tsx\`: عدد الفصول والطلاب المصاحب لفصل؛ لا يُكتب \`{classes.length} فصل\`.
- \`app/(dashboard)/school/page.tsx\`: عدد المعلمين والفصول والطلاب، وحقل «الطلاب النشطون» بلا اتفاق نحوي خاطئ.
- \`app/(dashboard)/student/page.tsx\`: إزالة وصف مستوى الطالب بأنه «مهارة ضعيفة»؛ صياغة وصفية.
- \`app/(dashboard)/parent/page.tsx\`: إزالة النص الذي يقول إن آلية الربط «ستضاف لاحقًا»؛ توضيح الموافقة.
- \`components/roles/RolePortalLayout.tsx\` و\`components/home/HomeInteractionPanel.tsx\`: تدقيق العبارات والفصحى وتوحيد المصطلحات.

**تحفظ لغوي:** عدد/معدود في جملة فصحى طويلة يحتاج إعرابًا حسب موضعه (رفع/نصب/جر)، وليس مجرد صيغة عامة؛ الدالة مخصصة لملصقات العدد المستقلة في لوحة التحكم. لا تُستخدم لتوليد نص عربي حرّ مع الإضافة وحروف الجر دون مراجعة. لم تُراجع بعد كل آلاف النصوص الديناميكية في قاعدة المحتوى.

**اختبار:**
\`\`\`bash
node --test tests/p0-arabic-ui-auth-grade.node.test.mjs
npx tsc --noEmit
npx eslint 'app/(dashboard)/teacher/page.tsx' 'app/(dashboard)/school/page.tsx' 'app/(dashboard)/student/page.tsx' 'app/(dashboard)/parent/page.tsx' components/roles/RolePortalLayout.tsx components/home/HomeInteractionPanel.tsx
\`\`\`
افتح حسابات أدوار اختبارية وشاهد النسخ العربية في العرض 320px و375px و768px و1440px، والأعداد 0، 1، 2، 3، 10، 11، 12، 21، 100. اختبر قارئ الشاشة واتجاه RTL. لا يعادل اختبار JSX والمصادر فحصًا بشريًا لكل صفحة.

### 2. Issue #117 — منع ترقية الأدوار

- الفروع الجديدة **مبنية فوق PR #116** الذي يضيف \`supabase/migrations/20261106_p0_profile_role_request_guard.sql\` وطلب اعتماد المعلم والمدرسة، واستخدام الدور المخزن في \`profiles\`.
- \`lib/auth/api-role-guard.mjs\` و\`proxy.ts\` يتحققان من الجلسة والدور المخزن لمسارات \`/api/admin\`، \`/api/teacher\`، \`/api/parent\`، \`/api/school\`، \`/api/student\` و\`/api/child\`. **هذا ليس بديلًا عن RLS** أو مراجعة ملكية كل صف.
- لا يُستخدم \`raw_user_meta_data\` لإسناد صلاحية. \`complete-profile\` لا يحدّث الدور، والموافقة على طلب \`teacher/school\` يجب أن تتم عبر مسؤول معتمد.

**اختبار قبول:** بسجلات مستخدمين *اصطناعية فقط*: محاولة INSERT مدرسة/معلم من Data API تفشل؛ تعديل \`profiles.role\` من طالب إلى معلم/مدير يفشل حتى لو زوّر المتصفح \`user_metadata\`؛ تعديل اسم حسابه مسموح؛ لا يمكن لولي أمر رؤية أطفال آخرين، ولا لمعلم رؤية فصل مدرسة أخرى؛ اعتماد مسؤول صحيح ينشئ أثر تدقيق \`role_approved_by\` و\`role_approved_at\`. فحص مستخدمي المعلم/المدرسة **السابقين** ضروري؛ لا يُفترض أن أدوارهم القديمة اعتمدت فعليًا. اختبار تسجيل الدخول عبر البريد وGoogle بعد الترحيل، مع استرجاع قابل للتنفيذ. لا تُطبّق migration #117 على الإنتاج منفردةً قبل دمج تطبيقها وتحقق بيئة معزولة.

### 3. Issue #57 — الدرجة والمفتاح

- \`app/api/skills/progress/route.ts\`: POST المدّعي لدرجة مهارة أو XP يُرفض بخطأ \`UNVERIFIED_SKILL_SCORE\` (HTTP 409)؛ GET المصادق عليه يبقى متاحًا. لا تُحسب نقاط للتدريب غير الموثق.
- \`app/api/questions/answer/route.ts\`: يثبت جلسة الطالب ثم يتحقق عبر \`dadyoom_student_questions\` الخالية من المفاتيح ومن كون الدرس منشورًا؛ بعدها فقط يصل إلى \`correct_answer\` عبر خادم سرّي؛ يحسب الصحة ويكتب \`question_attempts.user_id=user.id\` و\`is_correct=grade.isCorrect\`، ولا يأخذ درجة من JSON.
- \`lib/http/read-bounded-json.ts\`: حد حقيقي لحجم بايتات JSON المتدفقة قبل التصحيح؛ Content-Length لا يكفي.
- \`scripts/security/proposed-question-key-column-cutover.sql\` و\`proposed-activity-answer-column-cutover.sql\` و\`proposed-grade-write-restrictions.sql\`: **مقترحات غير قابلة للتنفيذ على الإنتاج عمدًا**؛ تعمل فقط في قواعد \`shadow_question_privacy\` / \`shadow_activity_privacy\` / \`shadow_grading\` مع راية تفعيل خاصة، وتتحقق من منع أعمدة الإجابة ومنع كتابة الدرجات من المتصفح.
- \`.github/workflows/p0-arabic-role-grade-qa.yml (job: shadow-privileges)\`: اختبار على PostgreSQL 16 في GitHub Actions ببيانات كاذبة؛ يحاول التزوير، يطبق القيود، يتحقق من حفظ القراءة المسموح بها، ومن استمرار كتابة الخادم الموثوق، ثم يتدرب على الاستعادة.

**نتيجة قراءة قاعدة الإنتاج وقت التدقيق:** امتيازات \`authenticated\` ما زالت تسمح بقراءة \`questions.correct_answer\` و\`lesson_activities.answer\`، وتتيح كتابة \`question_attempts\` و\`student_lesson_progress\` و\`student_skill_progress\`؛ لذا Issue #57 **غير مغلق إنتاجيًا**. لا يجوز تطبيق REVOKE مباشرة قبل جرد جميع القراءات والكتابات، ترحيل المسارات إلى الخادم، إثبات صلاحيات RLS الحقيقية، وتجربة تراجع في بيئة عزل.

## الترتيب المطلوب للإطلاق

1. مراجعة PR #116 واعتماده كاعتمادية (لا تُطبّق SQL وحدها).
2. نجاح GitHub Actions و\`npm run build\`، ثم \`profile-role-migration-isolated\`، ثم \`p0-shadow-grade-role-qa\`.
3. معاينة Cloudflare Worker **معزولة** وبيانات/أسرار اختبار، اختبار جلسة الطالب وتسجيل الدخول وإكمال الدرس وحفظه مع تحديث لوحة الطالب دون ضياع التقدم.
4. اختبار رفض تغيير دور وتزوير سؤال/درجة/XP مباشرةً عبر REST باستخدام JWT حقيقي معزول، واختبار المعلم وولي الأمر والمدرسة على بيانات متعددة المؤسسات.
5. بعد جرد توافق مسارات المعلم والإدارة وتحضير نسخ تراجع، كتابة **migration إنتاج منفصلة** خاصة بحجب مفاتيح الدرجات وامتيازات الكتابة بعد اعتماد CI والمعاينة؛ لا تُنشر مقترحات \`shadow_*\` أبدًا.
6. تأكيد Cloudflare Worker على \`dadyoom.com\` ونتائج الاختبارات الحية للهوية، الواجهة، المحتوى الوزاري وحفظ التقدم. لا يساوي نجاح \`next build\` نجاح نشر Worker.

## تنبيهات
- مسار التقييم الذكي \`/api/assessments/check\` وغيره من كتّاب الدرجات يحتاج مراجعة منفصلة قبل نقل كامل سلطات التقييم إلى الخادم؛ إغلاق مسار MCQ وحده لا يكفي.
- منع POST الدرجة المزورة يعني أن أي واجهة تتوقع اكتساب XP منها يجب أن توضّح أن نتيجتها تدريبية حتى إصدار إيصال تصحيح موثوق غير قابل لإعادة الاستخدام.
- لم تُعدّل أي بيانات طلاب أو صلاحيات قاعدة الإنتاج في هذا الفرع.

## نتيجة جرد الواجهات الموسّع
- كشف فحص `scripts/qa/audit-arabic-ui-counts.mjs --strict` 14 تعبيرًا رقميًا يحتاج إلى مراجعة.
- صُحِّحت العبارات المكتشفة في رحلة الطالب، وتقارير المدرسة، والفصول، ولوحة الإدارة، وتفاصيل الدروس، واختبار المستوى، وأهداف التعلم اليومية.
- أُضيفت صيغ `unit` و`minute` و`point` إلى قاموس المعدود؛ أصبح يضم 12 نوعًا.
- لا يثبت الفحص البرمجي وحده خلو جميع محتويات الكتب والمناهج ورسائل الخطأ الديناميكية من العيوب اللغوية؛ تبقى المراجعة البشرية لازمة.

## توسيع حماية XP
- `scripts/security/proposed-skill-daily-reward-grants.sql` مقترح غير قابل للنشر، يرفض أي قاعدة غير `shadow_skill_rewards` ويفرض راية `dadyoom.skill_rewards_rehearsal`.
- ملفات `tests/security/shadow-skill-daily-rewards-setup.sql` و`tests/security/shadow-skill-daily-rewards-verify.sql` تختبر الرفض من المتصفح، ثم التعديل الموثوق، واستعادة الأذونات ببيانات خيالية.
- اختبارات التشغيل `tests/security/question-answer-route-runtime.test.ts` و`tests/security/skill-progress-no-forged-xp.test.ts` تحاكي المصادقة والتصحيح والتلاعب دون اتصال بالإنتاج.
