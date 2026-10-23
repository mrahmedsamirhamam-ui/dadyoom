<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Dadyoom letter lab (pilot)

- The optional enrichment prototype lives at `/labs/letters` and `lib/letter-lab/activities.ts`. It is independent of official curriculum data.
- Keep Arabic reading direction RTL, mobile/keyboard accessibility, reduced-motion handling, and the written alternative to optional speech synthesis.
- Do not treat its session-only first-attempt score as a school grade or store children's data without a reviewed secure implementation.
- Maintain the existing site identity; defer any further 3D engine, paid provider, formal-course coupling, or permanent analytics pending educational and performance review.
- Do not claim production deployment without passing typecheck, lint, tests, build, and browser smoke checks.

## قاعدة النزاهة في نسبة اكتمال المناهج

- لا تساوِ وجود 22 دولة في جدول البلدان أو عدد السجلات `published` بإنجاز المناهج الرسمية أو اكتمال ضاديوم؛ احسب كل مؤشر مستقلًا.
- تقرير `scripts/curriculum-coverage.mjs` يفحص ملفات الحزم داخل Git فقط، ولا يفحص قاعدة الإنتاج أو يثبت تطابق الفهرس الوزاري. `--require-all-countries` شرط حزم فقط.
- لا تنشر مسودات OCR، ولا تزيل تحذيرات مطابقة المصادر، ولا تُنتج محتوى وزاريًا متخيَّلًا. راجع جودة الدرس وسنة المصدر وحقوق النشر وتجربة الطالب.
- عند تحرير دروس Supabase، احتفظ بالمحتوى السابق، طبّق تعديلًا محدد النطاق مع شرط مسبق، ثم اقرأ السجلات المعدلة للتحقق. تبقى الميزانية صفرًا بلا خدمات مدفوعة.

## فحص قاعدة محتوى الإنتاج

- استخدام `scripts/curriculum-production-audit.sql` للتدقيق القرائي في **مشروع ضاديوم الأساسي فقط**. لا تُنفَّذ استعلامات الإنتاج في قواعد مشروع المدرسة المستقل.
- استعلامات SQL تعرض إشارات جودة لسجلات قاعدة البيانات ولا تثبت مطابقة الكتب أو صلاحية عرضها للطالب. لا تعتبر أقل من 1200 حرف حكمًا آليًا بالنقص، خصوصًا في الصفوف الأولى.
- راعِ الفصل بين سجلات الدروس التعليمية وعقد الفهرسة المرجعية؛ قد يحمل سجل كتاب رسمي عنوانًا وملخصًا ومصدرًا بلا `content` لأنه **فهرس كتاب لا درس**. لا تُولِّد درسًا من اسم كتاب، ولا تعتبره فقدان محتوى رسميًا دون مضاهاة الفهرس.
- تعديل الدروس غير قابل للتكرار العشوائي: تحقق من الدرس والدولة والصف والفصل وحالة النشر وغياب التقويم قبل الكتابة، واقرأ السجلات بعد الكتابة، وامتنع عن الحذف أو تغيير حالة نشر المسودات دون تدقيق.

## قاعدة فحص الأسئلة متعدد الخيارات

- يجوز أن يكون سؤال اختيار من متعدد ذي **3 بدائل** صالحًا بحسب عمر الطالب والسياق؛ لا تُفرض 4 بدائل على جميع المحتويات. تحقق أولًا من كون `options` مصفوفة ومن صحة مفتاح الإجابة ضمن بدائلها، ثم قيّم الملاءمة التربوية مستقلًا.
- شرح أقل من 30 حرفًا علامة مراجعة إثرائية، **وليس عيبًا بنيويًا في خيارات السؤال**. التقرير `scripts/curriculum-production-audit.sql` يفصل بين القياسين.
- يجب الاحتفاظ بنصوص الإثراء من تأليف ضاديوم مستقلة عن النص الوزاري إلى أن تُراجع النصوص الرسمية والحقوق والمطابقة. لا تنسب أبياتًا أو وقائع أدبية إلى مؤلف من عنوان الدرس وحده.

## حالة الصف العاشر البحريني / الفصل الأول
- **69/69 سجلًا منشورًا** تملك حدًا أدنى من الأسئلة والأهداف والمفردات وفق فحص مباشر في Supabase بتاريخ 2026-10-21؛ هذا **اكتمال بيانات السجل الأساسية فقط** وليس إثبات تطابق مع وزارة التربية أو إتقان المتعلم للمهارة.
- لا تنسب أمثلة التدريب الحديثة أو حوارًا أو بيتًا غير موثق إلى قصائد الشعراء في خطة `أدب 111`، ولا توهم الطالب أن عنوان الدرس كافٍ لتحليل نص لم يُحمّل بعد.
- ابقِ سجلات المحتوى والمسارات المستقلة بمعرفاتها، ولا تدمج سجلات ذات عنوان متطابق دون مقارنة الدولة والصف والسنة والفصل والمسار والسجل الأصلي.

## التقدم الجاري: الصف الحادي عشر البحريني
- في 2026-10-21 تحققت إضافة 10 سجلات بلاغة وصرف (30 سؤالًا جديدًا). الحالة الآن: 52 درسًا منشورًا من الصف الحادي عشر/الفصل الأول بلا أسئلة في جدول `questions`، و98 في الفصل الثاني لم تعالج بهذه الدفعة.
- لا تدمج عناوين متشابهة تمثل مسارات فني/هندسي/ديني مختلفة؛ احفظ معرّفات الدروس ووصف المسار، وتحقق قبل أي تعديل وبعده من قاعدة البيانات الصحيحة.
- لا تصف التدريبات الأصلية أو عناوين `plan-scheduled` بأنها مناهج وزارة مكتملة. الأسئلة البنيوية الصحيحة لا تُغني عن تحكيم الإجابة تربويًا ولا اختبار رحلة المستخدم.

## استمرار الحادي عشر — قيد جودة ثابت (2026-10-21)

- بعد إتمام 28 درسًا إضافيًا أصبح الصف الحادي عشر/الفصل الأول في البحرين: **33/33 قواعد، 11/11 كتابة، 6/6 تواصل** لديها 3 أسئلة وأهداف ومفردات على الأقل؛ **24/34 قراءة** ما زالت بلا أسئلة في جدول `questions`.
- عند تقسيم المقررات بحسب ملخص الدرس، استخرج الرمز فقط إذا كان واضحًا مثل `عرب 803` أو `أدب 211`؛ صنّف الباقي `unclassified-course-summary` دون التخمين. انظر القسم الثامن من `scripts/curriculum-production-audit.sql`.
- نتائج سؤال اختيار من متعدد ببنية صحيحة لا تثبت صحة الإجابة من منظور تربوي، ولا تثبت أن أمثلة ضاديوم الأصلية تحل محل النص الوزاري. راجع النص المصدر المصرَّح به قبل نسبة قول إلى شاعر أو أثر ديني إلى مؤلف. حافظ على حقوق النشر وعلى هوية المشروع المستقلة والميزانية الصفرية.

## استكمال حادي عشر/الفصل الأول وتوثيق نصوص الأدب (2026-10-21)
- انتهت فجوة **الأسئلة والأهداف والمفردات المحفوظة** في **84/84 سجلًا منشورًا** للصف الحادي عشر البحريني/الفصل الأول، وتم التحقق باستعلام SQL القراءة فقط في القسم 9 من `scripts/curriculum-production-audit.sql`.
- لا تستخدم حالة `plan-scheduled` أو الأعداد لتزعم مطابقة المنهج الرسمي. أسئلة القراءة الجديدة مبنية على قطع من تأليف ضاديوم؛ ليست أسئلة فهم لأبيات مقررة أو وثائق تاريخية لم تثبت وتُرخّص. راجع المصدر والحقوق وتفسير الشاهد واعتماد المعلم قبل العرض بهذه الصفة.
- في الاستكمال التالي حافظ على استقلال المستودع وSupabase بين ضاديوم والمنظومات المدرسية، وعلى الميزانية الصفرية، وابدأ بتدقيق الصف الثاني عشر والفصل الثاني ومساراتهما. لا تلغِ أو تنشر المسودات آليًا.

## البحرين — الثاني عشر، الفصل الأول (2026-10-21)
- تحققنا من تحسين 18 سجل قواعد (54 سؤالًا جديدًا)، وأصبح 22/22 سجل قواعد منشورًا يملك ثلاثة أسئلة وثلاثة أهداف وثلاث مفردات على الأقل.
- بقي 25 سجل قراءة وأدب للفصل الأول بلا أسئلة، و78 سجلًا من الفصل الثاني بلا أسئلة وتحتاج مراجعة الخطة الرسمية.
- لا تدمج المسارات ذات العناوين المكررة؛ لا تقدم الإثراء الأصلي بوصفه نصًا وزاريًا أو شهادة مطابقة. راجع القسم 10 من سكربت التدقيق.

## بوابة الصدق للثاني عشر/الفصل الأول — 2026-10-21
- تم تخزين **25** درس قراءة وأدب إضافيًا مع **75** سؤالًا؛ **62/62** سجلًا منشورًا للصف **الثاني عشر البحريني، الفصل الأول** فقط. القواعد 22، القراءة 35، الكتابة 5. حافظ على تعيين الصف والفصل في أي إعلان.
- نصوص القراءة الجديدة **أمثلة أصلية** لا تمثل قصائد «المساء» أو «إباء وإصرار» أو «أغنيات عشق للبحرين» أو نصوص ألف ليلة وليلة؛ لا تحولها إلى شواهد مؤلفة أو مصادر رسمية.
- قسم SQL رقم 11 يعيد العد الفعلي حسب المسارات ويعامل الملخصات غير ذات الرمز بـ`unclassified-course-summary`. مؤشرات السجلات ليست تقويم جودة لغوي بشري ولا نسبة اكتمال منصة ضاديوم أو إثبات نجاح الموقع الحي.
- راجع مصدر النص الوزاري المرخص وسنة الدراسة ورموز المسارات قبل إعلان المطابقة، وأبقِ الميزانية صفرًا والمسودات غير منشورة والمشروعات المستقلة منفصلة.

## بوابة الإكمال وأمن التقدم (2026-10-21)

- **ممنوع** إنشاء مسارات `POST` أو أزرار تعدّل `student_progress.completed` أو `lesson_progress.completed` أو `student_lesson_progress.status` لتعلن إكمال الدرس دون المرور ببوابة التقويم `app/api/lessons/complete/route.ts` و`completeLessonAction`.
- احتفظ بالتوافق مع `lessonId` للمسارين `/api/progress` و`/api/progress/complete` عن طريق إعادة تصدير `POST` المعتمد. يتأكد `tests/security/lesson-completion-entrypoints.test.ts` من عدم عودة الالتفاف.
- **P0 مفتوح:** ملكية الصف في RLS ليست تحققًا من صدق الدرجة؛ الكتابة المباشرة المسموحة إلى المحاولات والتقدم يجب إغلاقها بتدفق تصحيح خادمي موثق وطبقة DB آمنة، وليس بتجميل الواجهة فقط. لا تعد المستخدم بأن الأمن أو حفظ التقدم اجتاز اختبارًا حيًا.

## بوابة «لا إكمال بلا دليل» — 2026-10-21
- لا تبدأ حساب الإتقان بـ100% دون تقويم. نفذ `requirePositiveAssessmentPoints` في فرع الأنشطة المصححة، و`requireAssessedItems` قبل السماح بالإكمال، ولا تحتسب محاولات الأنشطة المطلوبة الفاشلة إتمامًا.
- شغّل `tests/security/lesson-mastery-gates.test.ts` مع اختبار المسارات القديمة؛ لا تزل اختبارات CI عند تغيير كود تقدم الطالب.
- صفر أسئلة في جدول `questions` لا يعني صفر أنشطة: جميع السجلات المنشورة الـ429 المعنية لديها نشاط مصحح بدرجة موجبة بحسب فحص `answer/points`، لكن هذا لا يثبت الجودة التربوية.
- لا تعتمد الإتقان الآمن حتى تمنع قاعدة البيانات تغيير حالة الإكمال والدرجات والمحاولات مباشرة من هوية الطالب. لا تنفذ سحب منح production بلا ترحيل كامل وخطة رجوع.

## تصحيح MCQ خادمي — 2026-10-22
- لا تكتب `question_attempts.is_correct` في React أو تقبل قيمته أو `user_id` من العميل؛ استخدم `POST /api/questions/answer` ثم `gradeStoredMcq` بعد `auth.getUser` وقراءة السؤال المنشور من DB.
- `SUPABASE_SERVICE_ROLE_KEY` سر للخادم فقط؛ تأكد من توافره على بيئة النشر قبل نشر تجربة الأسئلة الجديدة. لا تعرضه ولا تسجله. لا تخلط بين نجاح CI وبين وجود إعدادات النشر.
- `tests/security/server-graded-mcq.test.ts` + CI جزء إلزامي من فحوص السؤال. بقاء صلاحيات الكتابة المباشرة في جداول المحاولات والتقدم يعني أن نزاهة الإتقان **لم تكتمل بعد**. لا تنفذ ترحيل REVOKE مبكرًا دون إثبات كل مسارات الكتابة والحساب التجريبي.

## واجهة الأسئلة المحمية في قاعدة الإنتاج — 2026-10-22

- استخدم `dadyoom_student_questions` عند عرض السؤال للمتعلم؛ هذه الواجهة `security_invoker` و`SELECT` فقط لزائر/طالب مع خيارات `id` و`text`، وتحترم كون الدرس `published`.
- الهجرتان `20261022150911` و`20261022151106` **مطبقتان مسبقًا** في مشروع Supabase الأساسي ومُثبّتتان بالمستودع. لا تطبق أي واحدة مرتين يدويًا؛ اجعل إدارة الإصدارات متسقة مع سجل `supabase_migrations`.
- لا تساوِ هذه الواجهة بانعدام التسريب من `questions` الأصلي أو من `get_lesson_page_bundle`، ولا تسحب أذون الجدول القديم حتى تفحص كل مستهلك وتنجح اختبارات الطالب والمعلم وخطة التراجع.
- تقدير الجاهزية الشاملة حوالى **46%** الآن تقديري وليس قياسًا علميًا؛ نجاح اختبارات GitHub لا يثبت سلامة نشر Cloudflare أو رضا المعلمين.

## 2026-10-22 — حراسة واجهات أسئلة الطالب
- لا تُرجع `correctAnswer` أو `explanation` للإجابة غير الصحيحة، ولا تمرر صفوف RPC `get_lesson_page_bundle` الخام إلى RSC؛ طبّق `feedbackForStudent` و`publicLessonQuestions` مع تعقيم عناصر `options`.
- `getWeakQuestions` لعرض الطالب يستعمل `dadyoom_student_questions` فقط، وليس `public.questions`. لا تكشف `question.explanation` في مراجعة الأخطاء.
- اختبارا `server-graded-mcq.test.ts` و`student-question-payload.test.ts` إلزاميان. لا تُعلن حل قاعدة البيانات قبل إصلاح جدول `questions` وRPC وحفظ المحاولات.
- Workers Builds الأحمر حالة نشر مستقلة Issue #46؛ اختبار Next.js الناجح ليس نشرًا حيًا.

## قاعدة أمن الإتقان — 2026-10-22
- `requiredCompletionActivities` نشاط حضور/مشاركة واجب لكنه **ليس** إجابة صحيحة في `lesson_mastery`. يمنع احتساب نسبة 100% منه عند غياب تقويم قابل للتصحيح.
- عند عدم وجود نشاط ذي مواصفات إجابة `getCorrectAnswerSpec`، استخدم `dadyoom_student_questions` ثم `question_attempts` لمعرفة الإتقان، وإلا أعد صفرًا.
- اختبارات `tests/security/lesson-mastery-completion-only.test.ts` إلزامية مع تعديلات `syncLessonMasteryAction`. لا تخلط اجتياز CI مع صحة البيانات التاريخية أو نجاح الموقع الحي، ولا تعدل grants على الإنتاج بغير ترحيل مختبَر.

## اتفاقية حساب الإتقان الموزون — 2026-10-22
- استخدم `scoreGradedActivityAttempts` من `features/lesson-mastery/services/score-graded-activities.ts` في تدفق إكمال الدروس ومزامنة `lesson_mastery` على السواء؛ لا تستخدم عدد الأنشطة الصحيحة وحده إذا كانت `points` مختلفة.
- احسب أفضل محاولة لكل نشاط قابل للتصحيح وتقيّد بدرجته القصوى من تعريف النشاط المخزن؛ الأنشطة غير المصححة ليست أساسًا لدرجات التحصيل.
- شغّل `tests/security/weighted-activity-mastery.test.ts` وCI، واحفظ مسار `dadyoom_student_questions` لمعرفات الأسئلة. نتائج قاعدة البيانات لا تتحول إلى أمان كامل قبل منع الكتابة المباشرة ونجاح الاختبار الحي.

## شرط تصحيح الأسئلة قبل قفل منح Supabase (2026-10-22)

- استخدم `createAdminClient()` في الخادم فقط لقراءة مفاتيح `questions.correct_answer`؛ لا تعتمد على SELECT بمستخدم الطالب كي لا تكسر التصحيح عندما تُسحب المنح.
- لا تُنشئ العميل الإداري أو تقرأ المفتاح قبل نجاح `auth.getUser` والتحقق من المدخل، ولا تحفظ المحاولة قبل التأكد من إتاحة الدرس عبر عميل RLS والتحقق من تصحيح الإجابة.
- يجب اجتياز `tests/security/server-only-answer-key-read.test.ts` قبل الدمج. **لم تُسحب منح الجدول أو RPC بعد**؛ الحماية الخارجية لا تزال P0.

## أمن RPC حزمة الدرس — 2026-10-22

- الدالة `public.get_lesson_page_bundle(uuid)` تستخدم الواجهة الآمنة `dadyoom_student_questions` في استعلام الأسئلة؛ لا تُعد إدخال `correct_answer` أو `explanation` أو حقول حساسة ضمن JSON الذي تُرجعه.
- الهجرة `20261022195032` مطبقة فعليًا في Supabase الأساسي ومُسجلة في المستودع؛ تجنب إعادة تطبيقها يدويًا مرتين. شغّل `tests/security/public-lesson-bundle-rpc.test.ts` مع CI عند تعديل RPC.
- تبقى صلاحيات القراءة المباشرة لـ`public.questions` ومحاولات الدرجات P0؛ لا تُعدّ سلامة RPC إثباتًا لسلامة القاعدة الشاملة أو نجاح نشر Cloudflare. لا تغييرات مدفوعة أو مساس بمشروع المدارس المستقل.


## إدخال إثراء للفصل الثاني البحريني — حارس الجودة (2026-10-22)

- أعد فحص سجلات الإنتاج قبل كل دفعة؛ الفصل الأول من حادي عشر كان قد اكتمل بأسئلة قبل بدء دفعة الفصل الثاني، فلا تُعِد إدخالها.
- حافظ على `official_content_scope='official-book-unscheduled'` في دروس الفصل الثاني حتى تثبت المطابقة والجدولة بدليل رسمي؛ لا تنسخ محتوى الوزارة أو تنسب تدريب ضاديوم إليها.
- إدخال الأسئلة يرتبط بتحديث الدرس نفسه في SQL CTE، مع شرط عدم وجود أسئلة سابقة، وتطابق `id/title/grade/semester/lesson_type/status`، وعدم مساس بمسارات المدارس أو الطلاب أو الفوترة.
- تحقق باستعلام جديد من 3 أهداف و3 مفردات و3 أسئلة على الأقل وصحة 4 بدائل ومفتاح الإجابة، واستعمل قسم 12 من `scripts/curriculum-production-audit.sql` لجرد الفجوات. الاختبار البنيوي لا يعادل تحقق E2E أو اعتماد المنهج.

### 2026-10-22 — authorize student question before private grading
- Verified on current main: the endpoint was reading the private answer key before RLS student visibility, and `getLessonQuestions` still used `questions.select("*")`. On the fresh security branch, question visibility and published lesson checks run with the learner session before any admin client is created. Privileged grading is restricted by matching question ID and lesson ID.
- Public practice listing now selects only display fields from `dadyoom_student_questions`; source regression tests and CI path triggers cover both readers.
- Production grants on `questions` and score tables remain unchanged pending full client inventory, signed-in student/teacher E2E, Workers Preview and rollback. This code hardening alone does not increase overall readiness from the provisional 46%.

### 2026-10-22 — حصر ثغرات درجات الأنشطة واعتماد تصحيح محرر المعلم
- نقل قراءة مفاتيح `questions` في استعلام محرر المعلم إلى `createAdminClient` **بعد** التحقق من جلسة المستخدم ودور `teacher/admin` وملكية الدرس من اتصال المستخدم المقيد بـRLS. تسير قراءة/إضافة/تعديل الأسئلة بعد فحص الإذن؛ تظل RPC الخاصة بنقل السؤال وحذفه بجلسة المستخدم لأجل `auth.uid()`.
- اجتياز CI ليس إذنًا بسحب الامتيازات من الإنتاج. يجب اختبار معلم مالك وغير مالك ومدير وطالب، ثم إعداد تراجع للصلاحيات. لا تُعرض مفاتيح الحل داخل واجهة الطالب.
- **فجوة P0 مستقلة مؤكدة بالقراءة فقط:** `public.lesson_activities.answer` متاح لدوري `anon` و`authenticated`. عدد الأنشطة المنشورة ذات بيانات `answer` غير فارغة 21,807 من 23,779 منشورًا وقت الجرد؛ نجح استعلام `SET LOCAL ROLE anon` في إثبات قابلية القراءة دون استرجاع نص إجابة. لا يجوز إلغاء الامتيازات حتى استكمال قراءات تصحيح الأنشطة ومحررها وحفظ المحاولات واختبارات الدور وبيئة Preview.

### 2026-10-22 — Server-only activity grading before grant migration
- `completeLessonAction` requires an owned progress row and published lesson visible under student RLS; `syncLessonMasteryAction` authenticates and checks published lesson visibility. Both then use `createAdminClient` to access `lesson_activities.answer` exclusively on the trusted server.
- Weighted best-attempt grading, user-scoped attempt reads, and progress data are unchanged. CI guards the authorization order. The legacy direct database `answer` grants remain P0 pending audited no-cost Preview E2E and rollback; a green Next.js build is not proof of production release.

### 2026-10-23 — حماية مسار تصحيح الأنشطة من كشف الإجابات وتراجع الإتقان
- مسار `POST /api/lesson-activities/check` يفحص النشاط والدرس المنشور باستخدام جلسة الطالب وRLS **قبل** استدعاء `createAdminClient` لجلب مفتاح التصحيح، ويربط الاستعلام الإداري بمعرفي النشاط والدرس معًا؛ وكذلك قراءة مفاتيح جميع أنشطة الدرس للتقييم أصبحت خادمية بعد فحص النشر.
- عند إعادة نشاط في درس حالته `completed` أو `mastered` تُحفظ الحالة ونسبة التقدم المكتسبة، ولا يعيد التصحيح عرض الحالة `in_progress` ولا يخفض نسبة التقدم السابقة. التعديل لا يغير معيار 90% أو طريقة احتساب الدرجات.
- أضيف اختباران لمصدر مسار التصحيح ولدالة حفظ حالة التقدم إلى GitHub CI. لا تزال الصلاحيات المباشرة لمفاتيح الإجابات وكتابة المحاولات مفتوحة في Supabase إلى حين تجربة Preview والتراجع؛ لا إعلان نشر إنتاجي أو أمان كامل.

### 2026-10-23 — نقل كتابة الدرجات إلى الخادم الموثوق
- بعد التحقق من الطالب والدرس المنشور وتصحيح الإجابات، يحفظ `POST /api/lesson-activities/check` المحاولة والتقدم بواسطة عميل الخادم الخاص، مع `user_id=user.id` الموثوق وتقييد تحديث التقدم بمالك الصف ودرسِه. `syncLessonMasteryAction` يحفظ نتيجة الإتقان المحسوبة خادميًا عبر عميل الخادم كذلك.
- القراءة المسموحة للطالب ومحاولاته بقيت بجلسة RLS، ولم تُسحب أي صلاحية PostgreSQL بعد؛ ما زالت كتابات تاريخية إضافية تحتاج انتقالًا قبل قفل المنفذ المباشر. أضيفت اختبارات ضبط ترتيبي للكتابة الآمنة إلى اختبارات CI الموجودة، بلا تعديل بيانات إنتاجية.

### 2026-10-23 — Owned progress repository hardening
- `progress.repository.ts`: requires a verified session; never allows another student's progress to be read, created or updated; verifies published-lesson visibility under caller RLS *before* opening the server-only persistence client. UPDATE matches stored ID + authenticated owner + authorized lesson; identity/lesson fields cannot be passed in update payload.
- `progress.ts`: rejects incomplete, nonfinite, and out-of-range assessment results below 90% at the internal completion boundary, in addition to the action's existing mastery gate. No existing production rows, migrations or grants changed.
- New source regressions added to curriculum CI. This is staged server-code hardening, **not** confirmation of an operational end-to-end attempt until Preview and DB permission rollout pass.

### 2026-10-23 — tutoring is not assessed mastery
- The semantic tutor previously called `updateLessonMastery` when its own answer contained no error text, adding a *correct student answer* and potentially a 100% mastery score even without a student assessment. Removed this grading call and obsolete helper, while retaining chat history, streamed feedback and suggested practice questions.
- Stream endpoint now validates the user's visibility of the published lesson before reading chat/context, and client no longer broadcasts `lesson-mastery-updated` on completion of a tutor response. Only actual server-graded attempts may influence academic mastery.
- No changes to historic student results were performed; source regression test added to CI. Supabase privilege remediation and Cloudflare Preview remain release blockers.

### 2026-10-23 — AI practice result stays distinct from canonical lesson mastery
- `POST /api/ai/assessment/submit` was the second caller of removed legacy `updateLessonMastery`. A single correct AI MCQ could have overwritten `lesson_mastery` with 100%. Removed the call; **retained** its server-graded session answer storage, progress-skill updates and cache invalidation.
- `lesson_mastery` is reserved for full-lesson attempts and the 90% completion gate, not tutor answers or one-off generated practice questions. CI test now asserts both tutoring and AI submit preserve the distinction. This also fixes the TypeScript missing-module error observed on the preceding revision.

### 2026-10-23 — فحص متكرر آمن لصلاحيات أسئلة ضاديوم
- أضيف `scripts/security-assessment-permissions-audit.sql` للاستعلام عن صلاحيات `questions.correct_answer` و`lesson_activities.answer` وجداول حفظ الدرجات، وعن RLS وصلاحيات RPC و`security_invoker` من **البيانات الوصفية فقط**؛ لا يُظهر نص أي إجابة أو معلومات شخصية، ولا يحتوي عمليات تغيير.
- خطر معمارية ينبغي تجنبه: الإلغاء الشامل لقراءة `questions` سيكسر واجهة `dadyoom_student_questions` الحالية لاعتمادها على `security_invoker=true`، وإعادة منح قراءة `options` الخام قد تكشف مفاتيح مخفية داخل JSON. يجب تنفيذ بديل آمن في Preview قبل سحب صلاحيات الإنتاج.
- اختبار Vitest يفرض أن ملف التدقيق للقراءة فقط. لا ترحيل إنتاجي ولا تعديل RLS أو بيانات.

### 2026-10-23 — حماية مفتاح أسئلة تقويم الذكاء الاصطناعي
- `/api/ai/assessment/submit` كان يقرأ `ai_assessments.correct_answer` تحت جلسة الطالب ويحجز السؤال قبل التحقق من ملكية جلسة الاختبار. أصبح يجلب بيانات العرض دون المفتاح، ويثبت أن الاختبار يخص جلسة الطالب ودرسًا منشورًا قبل قراءة المفتاح الخادمي والحجز المشروط، ويرفض البديل خارج المدى.
- حفظ جواب `assessment_session_answers` صار بصلاحية الخادم بعد التحقق، ولا يعاد كشف الحل أو الشرح للطالب عند الخطأ. بعد تسجيل محاولة مثبتة لا يعاد فتح السؤال تلقائيًا على فشل مرحلة لاحقة، تجنبًا للتكرار.
- **مهم:** الجدول الأصلي `ai_assessments` نفسه ما زال يمنح `SELECT correct_answer` و`UPDATE` للحسابات في Supabase الإنتاج. أضيف إلى فحص الصلاحيات؛ حل الالتفاف المباشر مرتبط بترحيل آمن للمنفذ العام في Preview وليس بهذه تعديلات الكود فقط.

### 2026-10-23 — AI Assessment client-leak and next-step grade forgery guards
- API GET `/api/ai/assessment/[id]` and POST `/api/ai/assessment` no longer serialize the correct choice or explanation before submitting; their student read/insert projections exclude the secret fields. POST `/api/ai/assessment/next` does not trust the browser's `correct` boolean: it verifies ownership, published lesson, exactly one new saved answer and server-private answer-key match, then advances using the server result.
- `advanceAssessmentSession` uses optimistic predicates for question index and scored counts to prevent duplicate concurrent increments. New Vitest guards are added to CI and the read-only permissions audit includes session answer/session tables.
- **Not yet end-to-end validated** on Preview: direct database grants to `ai_assessments.correct_answer`, `assessment_sessions`, and `assessment_session_answers` still require a proven non-breaking permissions migration. No production data changed.

### 2026-10-23 — AI generated-question and session write authorization
- `/api/ai/assessment`: validates the authenticated learner and a RLS-visible **published** lesson before opening the privileged server-only Supabase client; writes generated question keys through that trusted client, never the user's Data API session. Returned display payload remains redacted.
- `/api/ai/assessment/session`: rejects unpublished lessons and creates/resumes a session through the server-only client after authenticating the student; session student ID is always derived from `auth.getUser()`.
- `/api/ai/assessment/[id]`: checks parent lesson is still published before returning the student's safe question projection. New CI source guards cover all three.
- Direct table-level grants on AI assessment/session tables remain exposed in production and require tested role/permission migration. No production SQL or real student submissions performed.

### 2026-10-23 — trusted final analytics for adaptive assessments
- `getAssessmentSessionAnalytics` no longer trusts `assessment_session_answers.is_correct`, a column writable by the student's database role in the current production policy. After the already-authorized session completes, it reads selected choices with a trusted server client and matches each question to the private `ai_assessments.correct_answer` scoped by authenticated owner email and published lesson.
- Fails closed if any stored question key is missing. Calculates strengths, weaknesses and totals from server-computed correctness, preserving existing return shape. Regression test added to AI assessment CI; no production SQL or student-record changes.

### 2026-10-23 — behavioral unit tests of private-key-derived AI analytics
- Added `tests/security/ai-session-analytics.test.ts` with mocked client behavior (no access to real student data). It verifies false positives are rejected even when stored `is_correct=true`, false negatives are corrected from the stored choice, a missing private key fails closed, and empty sessions make no private key query.
- Wired it into the existing CI source filter and gate. This complements existing source-code assertions, but is not a substitute for an authenticated Preview end-to-end test or a real database permission migration.

### 2026-10-23 — latest assessment analytics now enforces ownership and private correction
- Fixed the compile failure caused by `getLatestAssessmentAnalytics` calling the updated key-derived analytics method without authenticated email or lesson ID. It now checks `auth.getUser()` and `user.id===studentId`, retrieves only the caller's finished session under RLS, and invokes private-key-derived analytics with the server-only client and the validated lesson/student identity.
- Dedicated source guard and CI path added; no real answer values returned or historic data edited.
