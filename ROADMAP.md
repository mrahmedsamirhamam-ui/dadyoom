# ضاديوم — حالة المنتج الفعلية

آخر مراجعة تشغيلية: 28 سبتمبر 2026.

## الخط الأساسي المعتمد

- فرع الإصدار الحالي: `fix/mobile-cloud-video-final-20260923`.
- هذا الفرع هو خط الإنتاج المعتمد حاليًا.
- `main` متباعد تاريخيًا عن خط الإصدار؛ لا يتم دمجه أو عمل reset/clean له بصورة عمياء. المزامنة الشاملة مشروع صيانة مستقل وليست شرطًا لإطلاق ضاديوم الحالي.
- كل تطوير محلي/Build/Cache/Temp يجب أن يبقى على قرص `G:` وفق سياسة المشروع.

## جاهز الآن

- المصادقة بالبريد وGoogle على مستوى الكود، مع توجيه الأدوار وProvider health في الإنتاج.
- Onboarding بحسب الدور والدولة والصف والهدف وأسلوب التعلم.
- الطالب: المناهج والدروس والتقدم والتقييم والمهارات والقاموس وضاد والتحفيز.
- المعلم: الفصول والطلاب وإثراء الدروس والأسئلة والأهداف والوسائط.
- ولي الأمر والمدرسة: الربط والمتابعة والتقارير والمكافآت.
- الإدارة: المناهج والدروس والطلاب والمعلمون ومراجعة المحتوى.
- XP والمستويات والشارات والتحدي اليومي والشهادات.
- SEO التقني: الصفحة الرئيسية وrobots وsitemap وmetadata وstructured data.
- Cloudflare Worker + Pages front door.
- Android Native 1.0.2: APK موقّع، Google OAuth deep link، TTS عربي Native، Qwen Offline، وفحص تحديثات من GitHub Releases.
- صفحة Plus: رجوع مباشر + رجوع للوحة المناسبة حسب الدور + رابط مكتبة الفيديوهات.
- Homepage: اتجاه بصري جديد قائم على هوية عربية احترافية، بدون فيديو/animation runtime ثقيل فوق الطيّة.

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
- Bytez/provider routing + fallback موجودان.
- Offline Qwen موجود داخل Native.
- انقطاع مزود خارجي لا يجب أن يسقط المنصة كلها.
- لا نغيّر Bytez أو مسارات AI المستقرة ضمن أعمال الإطلاق الحالية إلا عند وجود عطل مثبت.

## الاشتراك والدفع

- Free + Plus.
- Plus: 10 USD شهريًا.
- تجربة المستخدم الجديد: Plus لمدة 24 ساعة.
- Paddle Sandbox: Checkout + signed binding + webhook + subscription activation + billing management + cancellation + idempotency تم اختبارها.
- Success URL المعتمد: `https://dadyoom.pages.dev/payments/paddle/success`.
- مصدر حقيقة الاشتراك هو Paddle webhook/قاعدة البيانات، وليس redirect النجاح.
- Paddle Live مؤجل؛ لا يُعامل كحاجز حالي.

## الإعلانات

- Google AdSense مدمج تقنيًا.
- `ads.txt` وmeta verification جاهزان.
- تحميل AdSense مقصور عمدًا على الصفحة الرئيسية فقط.
- لا إعلانات داخل الطالب/المعلم/المدرسة/الدروس/التسعير/تسجيل الدخول.
- موافقة Google النهائية خطوة خارجية وليست تعديل كود.

## SEO والفهرسة

- Google Search Console بدأ تسجيل impressions.
- public SEO smoke يختبر Home + robots + sitemap في الإنتاج.
- تمت إضافة IndexNow ليتم إخطار Bing ومحركات IndexNow بعد عمليات النشر من خلال `dadyoom.pages.dev`.
- المتابعة داخل Search Console/Bing Webmaster Tools تظل تحققًا خارجيًا بعد النشر وليست blocker برمجيًا.

## الاستقرار والنشر

- بوابات Cloudflare Verify وMobile Final Verify تشمل TypeScript/ESLint/tests/security/curriculum/build/smoke.
- تمت إضافة فحص تكراري للروابط الحرجة `/`, `/courses`, `/login`, `/pricing` لاكتشاف رجوع أخطاء Worker 5xx/CPU.
- `app-version.json` أصبح يقرأ `WORKERS_CI_COMMIT_SHA` وبيانات Workers Builds حتى لا يفقد SHA في نشر Cloudflare Git.
- النشر القياسي هو Cloudflare Git integration من فرع الإصدار، وليس نشر archive قديم يدويًا.

## مؤجل صراحة

- iOS signed IPA / Apple Developer / provisioning الحقيقي.
- توليد فيديو AI جديد عند الطلب واعتمادات/مدفوعات مزودي الفيديو.
- Paddle Live/التحصيل الحي.
- أي مدفوعات أو خدمات خارجية جديدة غير لازمة للإطلاق الحالي.

## ما يحتاج تحققًا بشريًا/خارجيًا فقط

- Real Google OAuth round-trip بحساب Google فعلي حتى العودة إلى اللوحة المناسبة.
- موافقة AdSense النهائية.
- مراجعة Search Console/Bing Webmaster Tools بعد إعادة الزحف.
- فحص بصري نهائي للـHomepage الجديدة على Desktop + Mobile بعد وصول آخر deploy.

هذه البنود لا تعني نقصًا في المناهج أو Commerce Sandbox أو بوابات البناء.
