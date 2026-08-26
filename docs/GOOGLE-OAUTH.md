# Google OAuth — ضاديوم

الكود داخل ضاديوم جاهز لمسار Supabase PKCE عبر `/auth/callback`. يبقى إعداد مزود Google خارجيًا قبل الاختبار النهائي.

1. في Google Auth Platform أنشئ OAuth Client من نوع **Web application**.
2. أضف نطاق الموقع إلى **Authorized JavaScript origins**.
3. من Supabase > Authentication > Providers > Google انسخ Callback URL الخاص بالمشروع وضعه في **Authorized redirect URIs** لدى Google.
4. ضع Google Client ID وClient Secret في إعداد Google Provider داخل Supabase وفعّل المزود.
5. في Supabase > Authentication > URL Configuration أضف:
   - `http://localhost:3000/auth/callback` للتطوير المحلي.
   - `https://YOUR-DOMAIN/auth/callback` للإنتاج.
6. عند تحديد الدومين النهائي اجعل `NEXT_PUBLIC_SITE_URL` مساويًا له ثم أعد البناء.

لا تحفظ Google Client Secret داخل Git أو في متغيرات `NEXT_PUBLIC_*`.
