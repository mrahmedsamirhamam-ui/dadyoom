# ضاد الخبير — جرد أولي للبوابة الأولى
الحالة: فحص محدود لملفات محددة في الفرع الرئيسي، وليس تدقيقًا شاملًا للمستودع.

## الموجود الذي تحققنا من ملفاته
- `package.json`: Next.js 16، React 19، TypeScript، Vitest، @supabase/ssr، @google/genai و @google/generative-ai.
- `app/api/ask/route.ts`: مسار ضاد موجود بالفعل؛ يستخدم متغيري GEMINI_API_KEY و GEMINI_MODEL، وينشئ Supabase session، ويقرأ profile عند تسجيل الدخول، ويكتب chat_history. لذلك يجب عدم بناء واجهة محادثة ثانية أو استبدال هذا المسار قبل تدقيقه كاملًا.
- `lib/supabase/server.ts`: عميل SSR قائم على cookies.
- `package.json`: توجد أوامر `search:semantic` و `embed:lessons`، ما يشير إلى بنية استرجاع يجب فحصها قبل اقتراح بديل.

## المخاطر والمجهولات
- لم يُراجع كامل ملف ask route أو سياسات RLS الخاصة بسجل المحادثات.
- لم يُثبت نوع مصادر الاسترجاع الحالية أو قيود التكلفة أو حماية حقن التعليمات.
- لم تُشغّل اختبارات أو بناء في هذه الدفعة.
- وحدة evidence الجديدة تتحقق من وجود معرّفات مصادر مصرح بها ومقاطع غير فارغة فقط؛ لا تثبت صحة الجمل ولا تقاوم حقن التعليمات بذاتها.

## أوامر تحقق مقترحة قبل اعتماد البوابة
```sh
npm ci
npx vitest run lib/dad-expert/evidence.test.ts
npm run test:run
npx tsc --noEmit
npm run lint
npm run build
```

## حدود التنفيذ
لا API جديد، ولا تعديل لمسار ask الحالي، ولا ترحيل قاعدة بيانات، ولا نشر، ولا دمج.
