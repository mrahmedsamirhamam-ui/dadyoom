# ضاديوم — حالة المنتج الفعلية

آخر مراجعة تشغيلية: 5 أكتوبر 2026.

## الخط الأساسي المعتمد

- فرع الإصدار الحالي: `fix/mobile-cloud-video-final-20260923`.
- هذا الفرع هو خط الإنتاج المعتمد حاليًا.
- `main` متباعد تاريخيًا عن خط الإصدار؛ لا يتم دمجه أو عمل reset/clean له بصورة عمياء.
- كل تطوير محلي/Build/Cache/Temp يجب أن يبقى على قرص `G:` وفق سياسة المشروع.

## جاهز الآن

- المصادقة بالبريد وGoogle على مستوى الكود، مع Google provider health ناجح في الإنتاج.
- Onboarding بحسب الدور والدولة والصف والهدف وأسلوب التعلم.
- الطالب: المناهج والدروس والتقدم والتقييم والمهارات والقاموس وضاد والتحفيز.
- المعلم: الفصول والطلاب وإثراء الدروس والأسئلة والأهداف والوسائط.
- ولي الأمر والمدرسة: الربط والمتابعة والتقارير والمكافآت.
- الإدارة: المناهج والدروس والطلاب والمعلمون ومراجعة المحتوى وتحقيق الدخل.
- XP والمستويات والشارات والتحدي اليومي والشهادات.
- SEO التقني: الصفحة الرئيسية وrobots وsitemap وmetadata وstructured data.
- Cloudflare Worker + Pages front door.
- Android Native 1.0.2: APK موقّع، Google OAuth deep link، TTS عربي Native، Qwen Offline، وفحص تحديثات من GitHub Releases.
- صفحة Plus: رجوع مباشر + رجوع للوحة المناسبة حسب الدور + رابط مكتبة الفيديوهات.
- Homepage: هوية عربية احترافية بدون runtime ثقيل فوق الطيّة.
- `npm run qa:full`: PASS في الإنتاج للأدوار الستة.
- AI assistant smoke الحقيقي: PASS.
- إصلاحات Worker 1101 و5xx للمعلم والإدارة والكتالوج العام: مطبقة ومختبرة.

## المناهج

يوجد فصل واضح بين المحتوى الأصلي والمطابقة الوطنية:

1. **Dadyoom Core**: مكتمل للدول العربية الـ22.
2. **National Official Match**: بوابة الإطلاق الرسمية تعمل بنظام fail-closed.

الحالة الحالية المعتمدة في CI:

- `OFFICIAL_SOURCE_CATALOG=22`
- `OFFICIAL_22_READY=22/22`
- `OFFICIAL_22_GATE=PASS`

لا تُعاد كتابة المناهج أو استيراد نسخ قديمة ولا تُعاد أرقام قديمة مثل 18 درسًا أو 11/22.

## الذكاء الاصطناعي

- ضاد وAI health متصلان بالإنتاج.
- مسار `/api/ask` اجتاز smoke حقيقيًا داخل بوابة E2E.
- Provider routing + fallback موجودان.
- Offline Qwen موجود داخل Native.
- انقطاع مزود خارجي لا يجب أن يسقط المنصة كلها.
- **زر إنشاء فيديو AI والتوليد الجديد عند الطلب مؤجلان صراحة حسب النطاق الحالي، ولا يتم العمل عليهما الآن.**

## Dadyoom Live

- البنية البرمجية مكتملة: إنشاء حصة، صفحة طالب، صفحة معلم، غرفة LiveKit، صوت/فيديو، وإصدار token آمن.
- `edu_can_join_live_session` يقيّد الدخول للمعلم أو طالب الفصل/المشتري المسموح.
- RLS موجود للحصص والحضور.
- الـE2E ينشئ حصة مؤقتة حقيقية ويختبر مسارات الطالب والمعلم.
- تمت إضافة `/api/live/health` وفحص readiness لا يعرض أسرارًا.
- نتيجة الإنتاج الحالية: `LIVE=READY`.
- `/api/live/health`: `ok=true`, `configured=true`, provider=`livekit`.
- مسارات الطالب والمعلم والحصص والاجتماعات المدرسية اجتازت اختبارات الإنتاج.

## الاشتراك والدفع

- Free + Plus.
- Plus: 10 USD شهريًا.
- تجربة المستخدم الجديد: Plus لمدة 24 ساعة.
- Paddle Sandbox: Checkout + signed binding + webhook + subscription activation + billing management + cancellation + idempotency: PASS.
- تمت إضافة معالجة `transaction.payment_failed` وتحويل الاشتراك إلى `past_due`.
- تمت إضافة حاجز يمنع خلط مفاتيح Sandbox وProduction.
- مصدر حقيقة الاشتراك هو Paddle webhook/قاعدة البيانات، وليس redirect النجاح.
- نتيجة الإنتاج الحالية: `PADDLE=CONFIGURED PADDLE_ENV=sandbox`.
- Paddle Live ليس مفعّلًا بعد. الانتقال إلى التحصيل الحقيقي يحتاج بيانات Paddle Live في بيئة التشغيل + webhook Live + دفعة حقيقية مضبوطة للاختبار.

## الإعلانات

- Google AdSense مدمج تقنيًا.
- نتيجة الإنتاج الحالية: `ADSENSE=CONFIGURED`.
- `ads.txt` وmeta verification مربوطان بالـPublisher ID من البيئة.
- تحميل AdSense مقصور عمدًا على الصفحة الرئيسية فقط.
- لا إعلانات داخل الطالب/المعلم/المدرسة/الدروس/التسعير/تسجيل الدخول أو التطبيق Native.
- Plus بدون إعلانات.
- إثبات ملكية الموقع تم بنجاح عبر `ads.txt` في 5 أكتوبر 2026.
- تم إرسال طلب المراجعة إلى Google، والحالة الحالية في لوحة AdSense: جارٍ تجهيز الموقع لعرض الإعلانات.
- الموافقة النهائية من Google خطوة خارجية وليست تعديل كود.

## SEO والفهرسة

- public SEO smoke يختبر Home + robots + sitemap في الإنتاج.
- تمت إضافة IndexNow لإخطار Bing ومحركات IndexNow بعد النشر.
- متابعة Search Console/Bing بعد إعادة الزحف تحقق خارجي وليست نقصًا في المناهج أو البناء.

## الاستقرار والنشر

- Cloudflare Verify: PASS على آخر إصدار مختبر.
- Mobile/production verify: PASS على آخر إصدار مختبر.
- Workers Build: PASS.
- Authenticated role QA: PASS.
- الكتالوج العام `/api/courses/catalog?country=BH&grade=1` كان يسقط بعد nested join استغرق أكثر من 15 ثانية؛ تم تفكيكه إلى استعلامات bounded صغيرة، وبعده عادت بوابات verify إلى PASS.
- النشر القياسي هو Cloudflare Git integration من فرع الإصدار.

## مؤجل صراحة حسب النطاق الحالي

- iOS signed IPA / Apple Developer / provisioning الحقيقي.
- زر إنشاء فيديو AI / توليد فيديو جديد عند الطلب.

هذان البندان ليسا blockers في الإغلاق الحالي.

## ما يحتاج تنفيذًا/تحققًا خارجيًا فقط

- تحويل Paddle من Sandbox إلى Production ببيانات Live الحقيقية، ضبط Live webhook، ثم دفعة حقيقية صغيرة مضبوطة — مؤجل ولا يتم بدون موافقة صريحة ودفع حقيقي مضبوط.
- Google OAuth round-trip بحساب Google فعلي: مؤكد ويعمل في الإنتاج.
- AdSense: إثبات الملكية وطلب المراجعة مكتملان؛ الموافقة النهائية ما زالت لدى Google.
- مراجعة Search Console/Bing Webmaster Tools بعد إعادة الزحف؛ Bing verification token اختياري وغير مهيأ حاليًا.
- فحص بصري نهائي للـHomepage على Desktop + Mobile.

هذه البنود لا تعني نقصًا في المناهج أو فشلًا في QA البرمجي.
