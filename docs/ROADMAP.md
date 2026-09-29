# ضاديوم — حالة الإطلاق المختصرة

آخر مراجعة: 29 سبتمبر 2026.

## مغلق برمجيًا

- Dadyoom Core وNational Official Match: 22/22 PASS.
- TypeScript / ESLint / tests / Vinext / Workers Builds: PASS.
- Cloudflare Worker + Pages: يعملان من فرع `fix/mobile-cloud-video-final-20260923`.
- `npm run qa:full`: PASS للأدوار الستة.
- AI assistant عبر `/api/ask`: PASS.
- Android Native 1.0.2 ومسار التحديث: جاهز.
- Paddle Sandbox الكامل: PASS.
- AdSense: مركب ومهيأ في الإنتاج، الصفحة الرئيسية فقط.
- إصلاحات استقرار teacher/admin/catalog مطبقة ومختبرة.

## Live

الكود مكتمل للحصص المباشرة: teacher/student pages، إنشاء الحصة، LiveKit room، authorization، RLS، attendance، token endpoint وE2E fixture.

حالة الإنتاج الحالية: `LIVE=MISSING`.

المتبقي خارجي: إضافة `LIVEKIT_URL` و`LIVEKIT_API_KEY` و`LIVEKIT_API_SECRET` إلى بيئة الإنتاج ثم إعادة الـsmoke.

## Paddle

- Plus = 10 USD/month.
- Welcome Trial = 24h.
- Webhook موقّع + idempotency + activation/cancel/manage: PASS.
- `transaction.payment_failed` أصبح يسجل `payment_failed` ويحوّل الحالة إلى `past_due`.
- يوجد fail-closed guard يمنع خلط Sandbox/Production credentials.
- حالة الإنتاج الحالية: `PADDLE=CONFIGURED PADDLE_ENV=sandbox`.

المتبقي خارجي: Live credentials + Live webhook + controlled real payment test.

## AdSense

حالة الإنتاج الحالية: `ADSENSE=CONFIGURED`.

- `ads.txt` جاهز.
- metadata جاهزة.
- السكربت لا يحمل إلا على الصفحة الرئيسية.
- Plus وNative ومساحات التعلم بلا إعلانات.
- موافقة Google النهائية تبقى خطوة خارجية.

## مؤجل بطلب صاحب المشروع

- iOS signed device release.
- زر إنشاء فيديو AI / on-demand AI video generation.

لا يتم العمل على هذين البندين ضمن الإغلاق الحالي.

## آخر بوابة إنتاج

على commit `923f8b51d7b2deb49f48ffe84b965269ba6d5812`:

- Workers Builds: PASS.
- verify: PASS.
- verify: PASS.
- role-qa: PASS.
- `FINAL_E2E_RELEASE_GATE=PASS`.

## لا تلمس

- لا تعيد بناء أو استيراد المناهج 22/22.
- لا تعرض secrets.
- لا تضع إعلانات خارج الصفحة الرئيسية.
- لا تضعف تحقق Paddle webhook أو ربط المستخدم.
