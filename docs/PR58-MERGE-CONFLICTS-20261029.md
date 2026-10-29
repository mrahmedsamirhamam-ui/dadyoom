# PR #58 — دليل تعارض الدمج المثبت (29 أكتوبر 2026)

**المستودع:** `mrahmedsamirhamam-ui/dadyoom` · **فرع التطوير:** `fix/student-authorize-before-server-grading-20261022`.

**مصدر الدليل:** GitHub Actions [تشغيل الدمج المعزول 40923187341](https://github.com/mrahmedsamirhamam-ui/dadyoom/actions/runs/40923187341)، مرحلة «Rehearse merge with latest main only in this disposable checkout»، فشلت في `git merge --no-commit --no-ff refs/remotes/origin/main`.

**HEAD الذي فُحص:** `a0eae9125681f663f03edf4d22b12403ba7b5ec1`، **main الحالي عند الجرد:** `009b599905a8c691a3e1fbd746b9f2e7b7ec9a33`. تدقيق PR اللاحق: `mergeable=false`, `mergeable_state=dirty`؛ لا يعتمد هذا على ألوان واجهة GitHub ولا على تخمين.

## التعارضات الحقيقية (10 ملفات)

| الملف | إجراء حل التعارض الآمن |
|---|---|
| `app/about/page.tsx` | إضافتان متزامنتان (add/add) — مقارنة الرسالة/بيانات المؤسس والروابط وتجنب حذف أي صفحة |
| `app/api/admin/lessons/activity-count/route.ts` | منفذ إداري حساس — يُحفظ شرط التفويض الإداري وترشيح الأسئلة وإخفاء مفاتيح الإجابة |
| `app/api/admin/lessons/final-eleven-fix/route.ts` | إصلاح محتوى إداري — مراجعة RLS وحفظ محاولات الطلاب قبل أي تحرير |
| `app/api/admin/lessons/final-four-fix/route.ts` | إصلاح محتوى إداري — مراجعة التفويض ومنع التعديل دون بصمات |
| `app/api/admin/lessons/final-recovery/route.ts` | استعادة بيانات حساسة — منع تجاوز الوصول وإسقاط التقدم |
| `app/api/admin/lessons/prepare-source-pages/route.ts` | مصادر المناهج — صون المصدر وحقوق النشر والحدود على مسارات المدير |
| `app/lessons/[id]/page.tsx` | صفحة الدرس الأساسية — صون عرض النشاط والصوت وحماية سياق التقدّم |
| `app/page.tsx` | الواجهة — دمج الهيرو ذي زرين مع أحدث مكونات الرئيسية دون أرقام مزيفة |
| `app/sitemap.ts` | السيو — صون تقسيم آلاف الدروس وروابط الأدلة ومحركات البحث |
| `lib/site.ts` | ضبط Canonical — صون مطابقة عنوان الإنتاج وبدائل Dadyoom/ضاديوم |

**قرار أمان:** لا نستخدم `git merge -X ours` تلقائيًا على مسارات الإدارات أو مسار الدرس، لأن ذلك قد يتجاوز إصلاحات أمان وصلت إلى `main` أو يهدم اختبارات الطلاب. الحل الصحيح مراجعة التغييرات من قاعدة الدمج القديمة ثم إنشاء دمج له أبوين بعد اختبارات تفويض وتصحيح وتقدم؛ يستوجب إعادة فحص HEAD وقت التنفيذ لأن التطوير متزامن.

**ما نجح دون دمج:** [اختبارات المحتوى والأدلة](https://github.com/mrahmedsamirhamam-ui/dadyoom/actions/runs/40922282541) و[بناء Cloudflare Worker المعزول وفحصه](https://github.com/mrahmedsamirhamam-ui/dadyoom/actions/runs/40922744245) على Commits فرع التطوير المسجلة في كل تشغيل. هذه لا تعني أن PR أصبح قابلًا للدمج أو أن إصدار الإنتاج نشر.

**حالة الإصلاح:** التعارضات مثبتة ومصنفة؛ الدمج الفعلي **لم يكتمل**. يلزم الاحتفاظ بعمليات إصلاح `main` و`feature` معًا بدل اختيار طرف أعمى.
