# ضاديوم — عقد التقييم والتعلّم التكيفي القائم على الأدلة (Alpha v1)
**التاريخ:** 6 نوفمبر 2026 — **الحالة:** تطوير واختبارات في فرع مستقل؛ ليس منشورًا، ولا يعتمد أي طالب.
**الهدف:** توحيد *دليل* الفهم والاحتفاظ، بدل إعلان الإتقان من درجة واحدة.

## 1. الأدلة الموجودة ومشكلة تصميمها
- `features/adaptive-learning/services/evaluatePerformance.ts`: 90% قد تعيد `mastered` ولو كانت من جلسة واحدة.
- `features/adaptive-skills/adaptive-skill-engine.ts`: يعتمد latest 70% + best 30%؛ مؤشر إرشادي، لا صلاحية معيارية لإعلان الإتقان.
- `features/mastery/services/mastery-engine.ts`: 95% والمحاولات <=2 يكفي لإعلان `mastered`، حتى دون مراجعة متباعدة.
- `score-graded-activities.ts`: يسجل أفضل أداء، وهو ملائم لسجل التدريب لا لإثبات الاحتفاظ.
- PR #112/#120 نماذج متكيفة وتجريبية؛ PR #87 وIssue #57 لاستقلال التصحيح؛ Issue #117 لحماية الصلاحيات؛ Issue #46 للنشر. لا يتم دمج/نشر هذا العمل قبل إغلاق بوابات P0.

## 2. المعايير: مواءمة لا ادعاء اعتماد
- CEFR Companion (Council of Europe): `https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors`. يُستخدم لتحديد أهداف "يستطيع المتعلم أن..." للغة الثانية، وليس كاختبار شهادة ذاتي.
- Cambridge 0508 لغة أولى؛ 0544 لغة أجنبية: يجب مراجعة سنة المنهج المطبقة. لا يُنسخ امتحان أو بنك أسئلة محمي.
- ISO/IEC 25010:2023: نموذج جودة البرمجيات، لا شهادة ضاديوم.
- WCAG 2.2 AA: هدف وصول مع فحص يدوي وآلي.
- 1EdTech QTI 3.0: صيغة تبادل اختبارات محتملة بعد التأكد من الملكية والحقوق، بلا ادعاء مطابقة.
- NIST AI RMF: إطار إرشادي لإدارة مخاطر التقييم التوليدي والصوتي.

## 3. مبدأ العمل التربوي
لكل `objective_id`: صياغة يمكن ملاحظتها + شرط سابق + `skill` + `framework_ref` + محتوى محكّم.
في كل درس: شرح -> مثال محلول -> تدريب مع تلميحات -> مهمة مستقلة جديدة -> نقل إلى سياق آخر -> مراجعة متباعدة -> توصية.
تبقى المسارات: بداية / متوسط / تحدي قابلة للاختيار والتغيير؛ لا لصق وصف دائم "ضعيف" على الطفل.
التدريب المُوجّه وفتح الصفحة والوقت والتلميحات والسلاسل اليومية ليست أدلة مستقلة على الإتقان.

## 4. قرار التكيّف — محرك قابل للتفسير
الملف التنفيذي: `features/adaptive-learning/services/evidence-based-mastery.ts`.
**مدخلات موثوقة فقط** (من الخادم بعد auth + RLS والتحقق من المصدر + التصحيح الخادمي):
`objectiveId,itemId,sessionId,occurredAt,kind,isCorrect,gradedBy,reviewedItem,hintCount`.
**معايير تجريبية قابلة للمعايرة؛ ليست نتائج علمية مثبتة:**
1) خمسة أسئلة *مختلفة* ومراجَعة ومصحّحة خادميًا، دون تلميح؛ إعادة السؤال نفسه لا تضيف دليلًا.
2) أداء >=80% من هذه الأسئلة، ونجاح سؤال نقل إلى سياق جديد.
3) جلستان مستقلتان تفصل بينهما 24 ساعة على الأقل (الوقت من الخادم).
4) سؤال مراجعة *جديد* ناجح بعد سبعة أيام على الأقل من آخر سؤال أساسي.
بدون (1) => `collect_independent_evidence`؛ تحت (2) => `guided_practice`؛ دون نقل => `offer_transfer_check`؛ دون فصل زمني => `schedule_independent_check`؛ بعد الجلسات => `wait_for_retention` أو `run_retention_check`؛ فشل التذكر => `repair_then_recheck`.
حتى عند تحقق الشروط جميعًا: `retained_on_check` إشارة تجريبية لا شهادة ولا حكم تربوي نهائي. `canClaimValidatedMastery=false` دائمًا.
لا تُستخدم مخرجات هذا المحرك لاتخاذ قرار آلي مؤثر دون مراجعة خبير تربوي واعتماد نموذج القياس.

## 5. قاعدة بيانات مقترحة — لم تُعدَّل قاعدة الإنتاج
احتفظ بالجداول الحالية ولا تنفذ destructive migration.
- `learning_objectives`: هدف مشترك، إصدار، مهارات، دول ومنهج/CEFR refs، reviewer، rights.
- `assessment_item_versions`: `objective_id`, stem/version, difficulty, modality, independent/transfer/retention، canonical item family, reviewed_at, license.
- `authoritative_attempts`: `user_id` من المصادقة لا جسم الطلب، `attempt_id` idempotency مفتاح فريد، `item_version`, `server_grade`, `server_received_at`, hint audit، credential scope.
- `objective_evidence_snapshots`: user/objective/policy-version/time-window، `status`, reason, due_at (server-calculated), snapshot version.
- `teaching_interventions`: teacher action, review outcome, school/tenant scope, minimum-needed fields only.
- `assessment_policy_versions`: thresholds, activation flag, reviewer and rollback.

## 6. الأمان وأصالة الأدلة
Browser: يرسل معرف السؤال والإجابة/الطلب فقط. لا يُقبل `is_correct`, `earned_points`, `role` أو `reviewedItem` من العميل.
Server: `getUser`, authorized lesson under RLS, trusted answer key in server-only service, atomic insert by `attempt_id` (idempotency), compute snapshots transactionally, return explanations without raw answer keys.
Database: RLS owner/tenant, role-approval from trusted admin authority, no public access to answer keys, append-only grading/audit where possible. Review SECURITY DEFINER and views and direct Data API writes.
**حظر التنفيذ:** أي ثغرة P0 في #117 أو #57 أو عائق نشر #46 يستمر في منع الاستعمال الإنتاجي.

## 7. التعلّم الآلي في مرحلة لاحقة
نبدأ بقاعدة ثابتة قابلة للتفسير وقابلة للضبط البشري. لا نستخدم IRT/BKT أو نموذج تنبؤ قبل وجود بنوك أسئلة معايرة، واختبارات صدق وثبات، وعينة متنوعة وسجلات حقوقها واضحة.
في المستقبل يمكن اختبار IRT أو Bayesian Knowledge Tracing مع: تصحيح التحيز بحسب اللغة والعمر والجهاز، معايرة confidence، drift monitoring، مقارنة A/B بموافقة مناسبة؛ وليست "شخصية دقيقة تمامًا" بناءً على عدد محدود من الأسئلة.

## 8. الصوت والمخارج
في A1: فصل `ح/هـ` و`ق/ك` بواسطة تدريبات *تمييز سمعي* محكَّمة أولًا؛ يمكن أن يعرض النطق البشري المسجل مع تفريغ نصي.
تقييم نطق آلي فقط كاقتراح تجريبي، ومعه جودة الميكروفون والضوضاء واللهجة والعمر ودرجات عدم اليقين. عدم تصنيف الطفل خطأ دائمًا، ولا منح شهادة بناءً على ASR وحده.
البيانات الصوتية: إذن واضح، حذف مؤقت سريع، عدم حفظ التسجيل الخام افتراضيًا، لا مزود جديد أو إرسال صوت خارجي دون موافقة.

## 9. الواجهات والتحليلات
الطالب: "أتعلم، أتدرب، أتحقق، أراجع" + "ما التالي؟"؛ لا نقاط إتقان زائفة.
المعلم: أهداف تحتاج مراجعة بحسب إجابات مستقلة، مع تدخلات مقترحة وشرح سبب الاشتباه، لا تشخيص حتمي.
ولي الأمر: ملخص مهاري ونصيحة منزلية، لا محادثات خاصة افتراضيًا.
المدرسة: مؤشرات مجمعة مع حدود بيانات وصلاحيات. لا درجات متخيّلة ولا مقارنة علنية بالقاصرين.
قاموس أحداث минимизи: `lesson_started`, `independent_check_completed`, `hint_requested`, `retention_due`, `retention_checked`, `feedback_reported`, `model_cost_recorded`.
تحديد المقام والفترة الزمنية لكل نسبة، ومحو الأسماء والبريد من التحليلات العامة.

## 10. الأداء وإتاحة الوصول
القراءة العامة والملفات الثابتة تصلح للتخزين عند الحافة؛ **مفاتيح الإجابات وقرارات الصلاحيات والتصحيح والدرجات لا تُخزن في Edge public cache**.
Target field p75: LCP <=2.5s, INP <=200ms, CLS <=0.1؛ تسجيل البنية والبلد والنوع وفرق مختبر/بيانات حقيقية.
واجهة عربية RTL ولوحة مفاتيح وقارئ شاشة، وتباين وحجم أهداف لمس وحالة انقطاع وحفظ دون تكرار، وتوصيفات نصية للصوت.

## 11. بوابات قبول النسخ
1. **Engine Draft:** اختبارات وحدة لكل فروع القرار؛ no DB writes، no external APIs، لا كشف بيانات.
2. **Sandbox:** بيانات اصطناعية + Postgres مُعزلة + 100% حالات تكرار/إعادة إرسال/محاولة من حساب آخر/انتحال درجة ضمن مجموعة الاختبار المحددة.
3. **Content Beta:** 30 حالة تعلم **حقيقية بموافقات مناسبة** بعد مراجعة أهداف وأسئلة وحقوق 100% للعينة، مع مدرس معتمد ومقاييس تحسن مستقلة.
4. **Limited Launch:** P0=0، Cloudflare tested، استعادة backup tested، موافقات سياسة الصوت، اختبارات WCAG يدوية وآلية، جودة ضاد المراجعة.
5. **Scale:** A/B بعد خط أساس، تتبع drift والانحياز والتكلفة وبلاغات الأخطاء، وكل تغيير في policy version قابل للتراجع.

## 12. برنامج 90 يومًا (المدد مشروطة بتوافر مراجعين وبيئة اختبار)
الأيام 1–30: إغلاق #117 و#57 و#46، جرد مفاتيح الإجابات، تعريف canonical evidence، قاعدة عينات اصطناعية، مخطط آمن بRLS.
الأيام 31–60: ربط قارئ أحداث موثوق بالمحرك دون نشر درجات؛ تحقيق نواة 18 مهارة، اختبار 3 مسارات للصف السابع + A1، وإجازة مراجعة بشرية.
الأيام 61–90: Alpha مقيد ثم Beta مع مراجعين، اختبار الفهم والاحتفاظ وتجربة الجوال، مقارنة تجريبية بالتدريس غير المتكيف ومؤشرات فاعلية صريحة، قرار إطلاق.
**منهج حساب فريق المراجعة:** حجم العمل الشهري = عدد النسخ × (100%×عالي الخطورة +30%×متوسط +10%×منخفض) بحسب مزيجها؛ المراجعون = ceil(المراجعات المطلوبة / الطاقة الفعلية الشهرية للمراجع).
لا تعلن تفوقًا أو اعتمادًا ISO/CEFR/Cambridge/IB قبل إثبات مستقل أو موافقة الجهة.

## مصادر مراجعة
- https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
- https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-arabic-first-language-0508/
- https://www.cambridgeinternational.org/programmes-and-qualifications/cambridge-igcse-arabic-foreign-language-0544/
- https://www.1edtech.org/standards/qti/index
- https://www.iso.org/standard/78176.html
- https://www.w3.org/TR/WCAG22/
- https://www.nist.gov/itl/ai-risk-management-framework
