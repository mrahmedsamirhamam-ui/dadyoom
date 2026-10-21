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
