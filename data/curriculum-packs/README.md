
# محرك حزم المناهج في ضاديوم

المسار المرجعي:

`الدولة ← السنة الدراسية ← المنهج ← المرحلة ← الصف ← الفصل ← المادة ← الوحدة ← الدرس`

- لا ننشر حزمة غير موثقة.
- لا ننسخ كتابًا محميًا كاملًا دون ترخيص.
- ترتيب الدروس والوحدات يأتي من مصدر منهجي موثوق.
- الشرح والأنشطة والأسئلة داخل ضاديوم أصلية أو مرخصة.
- الاستيراد يحافظ على الدروس الغنية والأسئلة الموجودة ولا يعمل delete/reinsert للتاريخ.
- كل درس منشور يجب أن يحتوي محتوى كافيًا و3 أسئلة على الأقل.

فحص حزمة دون كتابة:
`node scripts/import-curriculum-pack.mjs --pack data/curriculum-packs/<pack>.json`

استيراد حزمة بعد التحقق:
`node scripts/import-curriculum-pack.mjs --pack data/curriculum-packs/<pack>.json --apply`

تصدير حزمة البحرين الحالية:
`node scripts/export-bahrain-curriculum-pack.mjs`

التحقق من كل الحزم:
`node scripts/verify-curriculum-packs.mjs`
