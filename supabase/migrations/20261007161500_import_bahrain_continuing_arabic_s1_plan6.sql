-- Bahrain Arabic continuing education: import the full current S1 Plan6 scope
-- without inventing grade 10-12 mappings. Non-standard levels use grades.grade_number = NULL.
-- Sources:
-- https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan6.pdf
-- https://edunet.bh/manual/books2026/books4.pdf
-- https://www.edunet.bh/Econtent/BooksGuide

with bh as (
  select id from public.countries where code='BH' limit 1
)
insert into public.curricula (
  country_id,name_ar,name_en,academic_year,description,is_active
)
select
  bh.id,
  'اللغة العربية — التعليم المستمر',
  'Arabic — Continuing Education',
  '2026-2027',
  'المستويات الرسمية غير القياسية للتعليم المستمر في البحرين. لا تُربط بصفوف 10–12. الفصل الأول مستورد حرفيًا من Plan6 الحالي 2026-2027.',
  true
from bh
on conflict (country_id,name_ar,academic_year)
do update set
  name_en=excluded.name_en,
  description=excluded.description,
  is_active=true;

with cur as (
  select cur.id
  from public.curricula cur
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية — التعليم المستمر'
    and cur.academic_year='2026-2027'
  limit 1
),
rows(name_ar,name_en,grade_number,sort_order,is_active) as (
  values
  ('الأول محو الأمية','الأول محو الأمية',NULL::integer,1,true),
  ('الثاني محو الأمية','الثاني محو الأمية',NULL::integer,2,true),
  ('الأول متابعة','الأول متابعة',NULL::integer,3,true),
  ('الثاني متابعة','الثاني متابعة',NULL::integer,4,true),
  ('الأول تقوية','الأول تقوية',NULL::integer,5,true),
  ('الثاني تقوية','الثاني تقوية',NULL::integer,6,true)
)
insert into public.grades (
  curriculum_id,name_ar,name_en,grade_number,sort_order,is_active
)
select cur.id,r.name_ar,r.name_en,r.grade_number,r.sort_order,r.is_active
from cur cross join rows r
on conflict (curriculum_id,name_ar)
do update set
  name_en=excluded.name_en,
  grade_number=NULL,
  sort_order=excluded.sort_order,
  is_active=true;

with target_grades as (
  select g.id,g.name_ar
  from public.grades g
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية — التعليم المستمر'
    and cur.academic_year='2026-2027'
    and g.grade_number is null
),
rows(level_name,unit_number,sort_order,title,description) as (
  values
  ('الأول محو الأمية',1,1,'الفصل الدراسي الأول — الأول محو الأمية','خطة اللغة العربية الرسمية للتعليم المستمر — الأول محو الأمية — الفصل الأول 2026-2027. الكتب الحالية: اللغة العربية للصف الأول محو الأمية لتعليم الكبار'),
  ('الثاني محو الأمية',1,1,'الفصل الدراسي الأول — الثاني محو الأمية','خطة اللغة العربية الرسمية للتعليم المستمر — الثاني محو الأمية — الفصل الأول 2026-2027. الكتب الحالية: اللغة العربية للصف الثاني محو الأمية لتعليم الكبار'),
  ('الأول متابعة',1,1,'الفصل الدراسي الأول — الأول متابعة','خطة اللغة العربية الرسمية للتعليم المستمر — الأول متابعة — الفصل الأول 2026-2027. الكتب الحالية: اللغة العربية للصف الخامس؛ اللغة العربية للصف السادس؛ التدريبات اللغوية الجزء الأول للصف الخامس؛ التدريبات اللغوية الجزء الثاني للصف الخامس؛ التدريبات اللغوية الجزء الأول للصف السادس؛ التدريبات اللغوية الجزء الثاني للصف السادس'),
  ('الثاني متابعة',1,1,'الفصل الدراسي الأول — الثاني متابعة','خطة اللغة العربية الرسمية للتعليم المستمر — الثاني متابعة — الفصل الأول 2026-2027. الكتب الحالية: اللغة العربية للصف السابع الجزء الأول؛ اللغة العربية للصف السابع الجزء الثاني'),
  ('الأول تقوية',1,1,'الفصل الدراسي الأول — الأول تقوية','خطة اللغة العربية الرسمية للتعليم المستمر — الأول تقوية — الفصل الأول 2026-2027. الكتب الحالية: اللغة العربية للصف الثامن الجزء الأول؛ اللغة العربية للصف الثامن الجزء الثاني'),
  ('الثاني تقوية',1,1,'الفصل الدراسي الأول — الثاني تقوية','خطة اللغة العربية الرسمية للتعليم المستمر — الثاني تقوية — الفصل الأول 2026-2027. الكتب الحالية: اللغة العربية للصف التاسع الجزء الأول؛ اللغة العربية للصف التاسع الجزء الثاني')
)
insert into public.units(
  grade_id,title,description,unit_number,sort_order,semester
)
select tg.id,r.title,r.description,r.unit_number,r.sort_order,1
from rows r
join target_grades tg on tg.name_ar=r.level_name
on conflict (grade_id,unit_number)
do update set
  title=excluded.title,
  description=excluded.description,
  sort_order=excluded.sort_order,
  semester=1;

with target_units as (
  select u.id,g.name_ar as level_name
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية — التعليم المستمر'
    and cur.academic_year='2026-2027'
    and g.grade_number is null
    and u.semester=1
),
rows(level_name,lesson_number,title,lesson_type,source_page_start,source_page_end) as (
  values
  ('الأول محو الأمية',1,'القراءة: الدرس الأول: أسرة جاسم (1)','reading',2,5),
  ('الأول محو الأمية',2,'التراكيب اللغوية: الجمل القصيرة (من كلمتين)','grammar',2,5),
  ('الأول محو الأمية',3,'الإملاء والخط: رسم الكلمات بحسب التنقيط؛ مراعاة الحركات والمدود بأنواعها','spelling',2,5),
  ('الأول محو الأمية',4,'القراءة: الدرس الثاني: أسرة جاسم (2)','reading',2,5),
  ('الأول محو الأمية',5,'التراكيب اللغوية: الجمل القصيرة (من كلمتين أو ثلاث)','grammar',2,5),
  ('الأول محو الأمية',6,'الإملاء والخط: تحليل الكلمات إلى حروف ومقاطع؛ الحرف المستهدف (ج)','spelling',2,5),
  ('الأول محو الأمية',7,'القراءة: الدرس الثالث: زيارة إلى بيت جاسم (1)','reading',2,5),
  ('الأول محو الأمية',8,'التراكيب اللغوية: أسلوب الاستفهام','grammar',2,5),
  ('الأول محو الأمية',9,'الإملاء والخط: تحليل الكلمات إلى حروف ومقاطع؛ الحرف المستهدف (م)؛ رسم الكلمات بحسب التنقيط','spelling',2,5),
  ('الأول محو الأمية',10,'القراءة: الدرس الرابع: زيارة إلى بيت جاسم (2)','reading',2,5),
  ('الأول محو الأمية',11,'التراكيب اللغوية: الفعل الماضي؛ الجملة الفعلية','grammar',2,5),
  ('الأول محو الأمية',12,'الإملاء والخط: تحليل الكلمات إلى حروف ومقاطع؛ الحرفان المستهدفان (د، ر)؛ تركيب كلمات من الحروف والمقاطع؛ رسم الكلمات بحسب التنقيط','spelling',2,5),
  ('الأول محو الأمية',13,'القراءة: الدرس الخامس: رحلة','reading',2,5),
  ('الأول محو الأمية',14,'التراكيب اللغوية: استعمال بعض ظروف الزمان والمكان (داخل، خارج، بعد، قبل)','grammar',2,5),
  ('الأول محو الأمية',15,'الإملاء والخط: تحليل الكلمات إلى حروف ومقاطع؛ الحرفان المستهدفان (خ، ظ)؛ تركيب كلمات من الحروف والمقاطع؛ رسم الكلمات بحسب التنقيط','spelling',2,5),
  ('الأول محو الأمية',16,'القراءة: الدرس السادس: سهرة عائلية','reading',2,5),
  ('الأول محو الأمية',17,'التراكيب اللغوية: الحوار','grammar',2,5),
  ('الأول محو الأمية',18,'الإملاء والخط: تحليل الكلمات إلى حروف ومقاطع؛ الحرفان المستهدفان (ف، ق)؛ تركيب كلمات من الحروف والمقاطع؛ كتابة الكلمات بحسب الصور','spelling',2,5),
  ('الأول محو الأمية',19,'القراءة: الدرس السابع: بيت جاسم','reading',2,5),
  ('الأول محو الأمية',20,'التراكيب اللغوية: استعمال الضمير (أنا)','grammar',2,5),
  ('الأول محو الأمية',21,'الإملاء والخط: تحليل الكلمات إلى حروف ومقاطع؛ الحرفان المستهدفان (ث، ن)؛ تركيب كلمات من الحروف والمقاطع','spelling',2,5),
  ('الأول محو الأمية',22,'القراءة: الدرس الثامن: حسن جار جاسم','reading',2,5),
  ('الأول محو الأمية',23,'التراكيب اللغوية: استعمال حروف الجر','grammar',2,5),
  ('الأول محو الأمية',24,'الإملاء والخط: تحليل الكلمات إلى حروف ومقاطع؛ الحرفان المستهدفان (س، ك)؛ تركيب كلمات من الحروف والمقاطع؛ كتابة الكلمات بحسب الصور؛ مراعاة التضعيف (الشدة) في الكلمات','spelling',2,5),
  ('الأول محو الأمية',25,'مراجعة عامة','assessment',2,5),
  ('الثاني محو الأمية',1,'القراءة: من القرآن الكريم (أقرأ وأتدبر)','reading',6,9),
  ('الثاني محو الأمية',2,'التراكيب اللغوية: استعمال فعل الأمر','grammar',6,9),
  ('الثاني محو الأمية',3,'الإملاء والخط: مراجعة عامة لما سبق دراسته','spelling',6,9),
  ('الثاني محو الأمية',4,'القراءة: الصندوق الخيري','reading',6,9),
  ('الثاني محو الأمية',5,'التراكيب اللغوية: استعمال الفعل الناسخ (كان)؛ أقسام الكلام (الاسم، الفعل، الحرف)؛ استعمال حروف الجر','grammar',6,9),
  ('الثاني محو الأمية',6,'الإملاء والخط: كتابة آية بخط النسخ','spelling',6,9),
  ('الثاني محو الأمية',7,'التعبير: تكوين جمل قصيرة للتعبير عن فكرة أو موقف؛ كتابة فقرة مترابطة (في حدود سبع جمل)','writing',6,9),
  ('الثاني محو الأمية',8,'القراءة: جمعية مدينتنا التعاونية','reading',6,9),
  ('الثاني محو الأمية',9,'التراكيب اللغوية: استعمال أداة الشرط «كلما» في تكوين جمل','grammar',6,9),
  ('الثاني محو الأمية',10,'الإملاء والخط: التاء المفتوحة والتاء المربوطة','spelling',6,9),
  ('الثاني محو الأمية',11,'التعبير: تكوين جمل قصيرة للتعبير عن فكرة أو موقف؛ كتابة فقرة مترابطة للتعبير عن مقترح','writing',6,9),
  ('الثاني محو الأمية',12,'القراءة: أوقات الفراغ','reading',6,9),
  ('الثاني محو الأمية',13,'التراكيب اللغوية: استعمال السين وسوف مع الفعل المضارع؛ استعمال أداة الجزم «لم» وأداة النصب «لن»؛ استعمال أدوات الاستفهام المختلفة','grammar',6,9),
  ('الثاني محو الأمية',14,'الإملاء والخط: علامات الترقيم','spelling',6,9),
  ('الثاني محو الأمية',15,'التعبير: كتابة فقرة مترابطة بتوظيف علامات الترقيم المناسبة','writing',6,9),
  ('الثاني محو الأمية',16,'القراءة: البحرين ترحب بكم','reading',6,9),
  ('الثاني محو الأمية',17,'التراكيب اللغوية: الجملة الفعلية والجملة الاسمية','grammar',6,9),
  ('الثاني محو الأمية',18,'الإملاء والخط: كتابة جملة بخط النسخ','spelling',6,9),
  ('الثاني محو الأمية',19,'التعبير: التعبير شفويًا عن الصور؛ كتابة لافتة إعلانية؛ كتابة فقرة مترابطة بتوظيف علامات الترقيم المناسبة','writing',6,9),
  ('الثاني محو الأمية',20,'القراءة: صنع في البحرين','reading',6,9),
  ('الثاني محو الأمية',21,'التراكيب اللغوية: أسلوب النفي','grammar',6,9),
  ('الثاني محو الأمية',22,'الإملاء والخط: كتابة حديث شريف بخط النسخ','spelling',6,9),
  ('الثاني محو الأمية',23,'التعبير: كتابة حوار بتوظيف أدوات الاستفهام','writing',6,9),
  ('الثاني محو الأمية',24,'القراءة: في ذاكرتي','reading',6,9),
  ('الثاني محو الأمية',25,'التراكيب اللغوية: استعمال الظرف (منذ، مع، بعد)','grammar',6,9),
  ('الثاني محو الأمية',26,'الإملاء والخط: مواضع كتابة التاء المفتوحة؛ كتابة جملة بخط النسخ','spelling',6,9),
  ('الثاني محو الأمية',27,'التعبير: كتابة فقرة مترابطة للمقارنة بين شيئين؛ كتابة فقرة مترابطة لوصف المشاعر','writing',6,9),
  ('الثاني محو الأمية',28,'القراءة: الأرض الطيبة','reading',6,9),
  ('الثاني محو الأمية',29,'التراكيب اللغوية: استعمال الفعل الناسخ (أصبح)؛ اشتقاق كلمات مختلفة من نفس الجذر','grammar',6,9),
  ('الثاني محو الأمية',30,'الإملاء والخط: كتابة آية بخط النسخ','spelling',6,9),
  ('الثاني محو الأمية',31,'التعبير: التعبير شفويًا عن الصور؛ كتابة فقرة مترابطة بتوظيف علامات الترقيم المناسبة','writing',6,9),
  ('الثاني محو الأمية',32,'مراجعة عامة','assessment',6,9),
  ('الأول متابعة',1,'القراءة: معلمنا الأول','reading',11,13),
  ('الأول متابعة',2,'القواعد النحوية: إعراب الفعل الماضي','grammar',11,13),
  ('الأول متابعة',3,'الإملاء: الألف اللينة','spelling',11,13),
  ('الأول متابعة',4,'القواعد النحوية: إعراب الفعل المضارع - رفع الفعل المضارع','grammar',11,13),
  ('الأول متابعة',5,'الإملاء: همزتا الوصل والقطع','spelling',11,13),
  ('الأول متابعة',6,'القراءة: جدتي','reading',11,13),
  ('الأول متابعة',7,'القواعد النحوية: إعراب الفعل المضارع - نصب الفعل المضارع','grammar',11,13),
  ('الأول متابعة',8,'الإملاء: الهمزة المتوسطة المفتوحة وما قبلها مفتوح','spelling',11,13),
  ('الأول متابعة',9,'القراءة: اعتذار صديق','reading',11,13),
  ('الأول متابعة',10,'القواعد النحوية: إعراب الفعل المضارع - جزم الفعل المضارع','grammar',11,13),
  ('الأول متابعة',11,'الإنتاج الكتابي: التقرير (1)','writing',11,13),
  ('الأول متابعة',12,'الإنتاج الكتابي: التقرير (2)','writing',11,13),
  ('الأول متابعة',13,'القواعد النحوية: إعراب فعل الأمر','grammar',11,13),
  ('الأول متابعة',14,'الإنتاج الكتابي: الرسالة الشخصية (1)','writing',11,13),
  ('الأول متابعة',15,'القواعد النحوية: الفاعل','grammar',11,13),
  ('الأول متابعة',16,'الإملاء: الهمزة المتوسطة المفتوحة وما قبلها حرف ساكن غير المد','spelling',11,13),
  ('الأول متابعة',17,'الإنتاج الكتابي: الرسالة الشخصية (2)','writing',11,13),
  ('الأول متابعة',18,'القراءة: البحرين تتكلم - دراسة القصيدة كاملة وحفظ القصيدة كاملة','reading',11,13),
  ('الأول متابعة',19,'القواعد النحوية: المفعول به','grammar',11,13),
  ('الأول متابعة',20,'القواعد النحوية: المبتدأ والخبر','grammar',11,13),
  ('الأول متابعة',21,'القواعد النحوية: الأفعال الناسخة','grammar',11,13),
  ('الأول متابعة',22,'الإملاء: الهمزة المتوسطة المضمومة','spelling',11,13),
  ('الأول متابعة',23,'القراءة: الكهرباء في وطني','reading',11,13),
  ('الأول متابعة',24,'القواعد النحوية: الحروف الناسخة','grammar',11,13),
  ('الأول متابعة',25,'الإنتاج الكتابي: المذكرات اليومية (1) و(2)','writing',11,13),
  ('الأول متابعة',26,'القراءة: نزهة في أحضان الطبيعة','reading',11,13),
  ('الأول متابعة',27,'القواعد النحوية: الأسماء المجرورة بحروف الجر','grammar',11,13),
  ('الأول متابعة',28,'الإملاء: الهمزة المتوسطة المكسورة (1)','spelling',11,13),
  ('الأول متابعة',29,'الإنتاج الكتابي: المذكرات اليومية (3)','writing',11,13),
  ('الأول متابعة',30,'القراءة: بيئتنا حياتنا - دراسة القصيدة كاملة، والحفظ من 1 إلى 6','reading',11,13),
  ('الأول متابعة',31,'القواعد النحوية: الأسماء المجرورة بالإضافة','grammar',11,13),
  ('الأول متابعة',32,'الإملاء: الهمزة المتوسطة المكسورة (2)','spelling',11,13),
  ('الأول متابعة',33,'القواعد النحوية: الصفة والموصوف','grammar',11,13),
  ('الأول متابعة',34,'الإملاء: الهمزة المتوسطة المكسور ما قبلها','spelling',11,13),
  ('الأول متابعة',35,'القراءة: على شواطئ البحرين - دراسة القصيدة كاملة، والحفظ من 1 إلى 5','reading',11,13),
  ('الأول متابعة',36,'القواعد النحوية: النفي بـ(ما، لم، لن، لا، ليس)','grammar',11,13),
  ('الأول متابعة',37,'القراءة: الكلب والحمامة - دراسة القصيدة كاملة، والحفظ من 1 إلى 5','reading',11,13),
  ('الأول متابعة',38,'الإملاء: الهمزة المتطرفة المكسور ما قبلها','spelling',11,13),
  ('الأول متابعة',39,'الإنتاج الكتابي: بطاقة الدعوة (1) و(2)','writing',11,13),
  ('الأول متابعة',40,'القواعد النحوية: العطف بـ(الواو، ثم، أو)','grammar',11,13),
  ('الأول متابعة',41,'الإنتاج الكتابي: بطاقة الدعوة (3)','writing',11,13),
  ('الأول متابعة',42,'الإملاء: الهمزة المتطرفة المسبوقة بحرف ساكن صحيح أو حرف علة','spelling',11,13),
  ('الأول متابعة',43,'مراجعة عامة','assessment',11,13),
  ('الثاني متابعة',1,'القراءة: من الهدي القرآني','reading',14,15),
  ('الثاني متابعة',2,'الإملاء: رسم ألف التفريق','spelling',14,15),
  ('الثاني متابعة',3,'القراءة: لماذا نقرأ؟','reading',14,15),
  ('الثاني متابعة',4,'الإملاء: الاسم المعرف بـ(أل) والمبدوء بلام','spelling',14,15),
  ('الثاني متابعة',5,'القراءة: أمير البحرين في عهد الرسول صلى الله عليه وسلم','reading',14,15),
  ('الثاني متابعة',6,'الإنتاج الكتابي: إعداد خطة عمل للموضوع الإنشائي السردي (تحديد الأحداث الرئيسة مرتبة)','writing',14,15),
  ('الثاني متابعة',7,'القواعد: الإعراب والبناء - المبني من الأسماء','grammar',14,15),
  ('الثاني متابعة',8,'الإملاء: رسم الهمزة المتوسطة على النبرة','spelling',14,15),
  ('الثاني متابعة',9,'القراءة: بلادي - دراسة القصيدة كاملة، والحفظ من 10 إلى 16','reading',14,15),
  ('الثاني متابعة',10,'القواعد: أحوال بناء الفعل الماضي وأحوال بناء فعل الأمر','grammar',14,15),
  ('الثاني متابعة',11,'القراءة: المخترع - دراسة القصيدة كاملة، وحفظ القصيدة كاملة','reading',14,15),
  ('الثاني متابعة',12,'الإنتاج الكتابي: كتابة نص سردي ذي بنية ثلاثية تتوفر فيه عناصر القصة','writing',14,15),
  ('الثاني متابعة',13,'القواعد: علامات الإعراب الأصلية وعلامات إعراب المثنى','grammar',14,15),
  ('الثاني متابعة',14,'الإنتاج الكتابي: كتابة التقرير (رحلة، زيارة، فعالية، حدث...)','writing',14,15),
  ('الثاني متابعة',15,'القواعد: جمع المذكر السالم','grammar',14,15),
  ('الثاني متابعة',16,'الإملاء: ألف التفريق','spelling',14,15),
  ('الثاني متابعة',17,'القراءة: الحرية','reading',14,15),
  ('الثاني متابعة',18,'القواعد: جمع المؤنث السالم والأسماء الخمسة','grammar',14,15),
  ('الثاني متابعة',19,'الإملاء: رسم الهمزة المتطرفة بعد مد (ألف)','spelling',14,15),
  ('الثاني متابعة',20,'القراءة: ابن ماجد بحار الخليج الأكبر','reading',14,15),
  ('الثاني متابعة',21,'القواعد: المبتدأ والخبر، أنواع الخبر','grammar',14,15),
  ('الثاني متابعة',22,'الإنتاج الكتابي: كتابة قصة تُسرد فيها الأحداث سردًا خطيًا','writing',14,15),
  ('الثاني متابعة',23,'القواعد: الأفعال الناسخة - كان وأخواتها','grammar',14,15),
  ('الثاني متابعة',24,'الإملاء: الهمزة المتطرفة','spelling',14,15),
  ('الثاني متابعة',25,'القراءة: الأزهار','reading',14,15),
  ('الثاني متابعة',26,'القواعد: الحروف الناسخة (إن وأخواتها)','grammar',14,15),
  ('الثاني متابعة',27,'مراجعة عامة','assessment',14,15),
  ('الأول تقوية',1,'القراءة: قائد دون العشرين','reading',17,18),
  ('الأول تقوية',2,'القواعد: الاسم المقصور والاسم المنقوص','grammar',17,18),
  ('الأول تقوية',3,'القراءة: البحرين في عيون زائريها','reading',17,18),
  ('الأول تقوية',4,'الإنتاج الكتابي: تفكيك الموضوع الإنشائي الوصفي إلى عناصره الأساسية','writing',17,18),
  ('الأول تقوية',5,'القواعد: اللازم والمتعدي من الأفعال، والفعل المتعدي إلى مفعولين أصلهما مبتدأ وخبر','grammar',17,18),
  ('الأول تقوية',6,'القراءة: البنفسجة الطموح','reading',17,18),
  ('الأول تقوية',7,'الإنتاج الكتابي: إعداد خطة عمل لكتابة فقرة وصفية','writing',17,18),
  ('الأول تقوية',8,'القواعد: الفعل المتعدي إلى مفعولين ليس أصلهما المبتدأ والخبر','grammar',17,18),
  ('الأول تقوية',9,'الإملاء: حذف ألف (ما) الاستفهامية','spelling',17,18),
  ('الأول تقوية',10,'الإنتاج الكتابي: كتابة قصة تتضمن مقطعًا وصفيًا (وصف شخص خِلقيًا وخُلقيًا)','writing',17,18),
  ('الأول تقوية',11,'الإملاء: مراجعة رسم الهمزة المتوسطة','spelling',17,18),
  ('الأول تقوية',12,'القراءة: حب وإيمان - دراسة القصيدة كاملة، والحفظ من 9 إلى 14','reading',17,18),
  ('الأول تقوية',13,'الإنتاج الكتابي: كتابة بطاقة التهنئة','writing',17,18),
  ('الأول تقوية',14,'القواعد: المفعول المطلق','grammar',17,18),
  ('الأول تقوية',15,'القراءة: عصير الذهن','reading',17,18),
  ('الأول تقوية',16,'الإملاء: مراجعة رسم الهمزة المتوسطة','spelling',17,18),
  ('الأول تقوية',17,'الإنتاج الكتابي: كتابة قصة تتضمن مقطعًا وصفيًا (وصف مكان مفتوح أو مغلق)','writing',17,18),
  ('الأول تقوية',18,'القواعد: الحال','grammar',17,18),
  ('الأول تقوية',19,'القواعد: الاستثناء - المستثنى بإلا','grammar',17,18),
  ('الأول تقوية',20,'الإملاء: الهمزة المتطرفة','spelling',17,18),
  ('الأول تقوية',21,'القراءة: الخليج العربي - دراسة القصيدة كاملة، والحفظ من 6 إلى 10','reading',17,18),
  ('الأول تقوية',22,'القراءة: فن الإصغاء','reading',17,18),
  ('الأول تقوية',23,'الإنتاج الكتابي: تلخيص قصة قصيرة تتضمن مقطعًا وصفيًا','writing',17,18),
  ('الأول تقوية',24,'القواعد: التمييز','grammar',17,18),
  ('الأول تقوية',25,'القراءة: من أغاني الرعاة - دراسة القصيدة كاملة، وحفظ المقطعين 1 و2','reading',17,18),
  ('الأول تقوية',26,'القواعد: النداء','grammar',17,18),
  ('الأول تقوية',27,'الإنتاج الكتابي: كتابة كلمة توعوية','writing',17,18),
  ('الأول تقوية',28,'مراجعة عامة','assessment',17,18),
  ('الثاني تقوية',1,'القواعد: مراجعة عامة لما سبقت دراسته','grammar',19,20),
  ('الثاني تقوية',2,'القراءة: أنت الهوى - دراسة القصيدة كاملة، والحفظ من 1 إلى 7','reading',19,20),
  ('الثاني تقوية',3,'القواعد: المقصور والمنقوص والممدود (تثنيتها وجمعها جمعًا سالمًا)','grammar',19,20),
  ('الثاني تقوية',4,'الإنتاج الكتابي: إعداد خطة عمل للموضوع الإنشائي السردي - تحديد الأحداث الرئيسة','writing',19,20),
  ('الثاني تقوية',5,'القراءة: إلى ولدي','reading',19,20),
  ('الثاني تقوية',6,'القواعد: أسلوب الاستثناء - المستثنى بـ(إلا)','grammar',19,20),
  ('الثاني تقوية',7,'القراءة: كن بلسمًا - دراسة القصيدة كاملة، والحفظ من 1 إلى 6','reading',19,20),
  ('الثاني تقوية',8,'الإنتاج الكتابي: كتابة قصة متسلسلة الأحداث مستوفية العناصر (1)','writing',19,20),
  ('الثاني تقوية',9,'القواعد: أسلوب الاستثناء - المستثنى بغير وسوى وخلا وعدا','grammar',19,20),
  ('الثاني تقوية',10,'الإنتاج الكتابي: كتابة قصة متسلسلة الأحداث مستوفية العناصر (2)','writing',19,20),
  ('الثاني تقوية',11,'القراءة: يا شباب العرب','reading',19,20),
  ('الثاني تقوية',12,'القواعد: الممنوع من الصرف لعلة واحدة','grammar',19,20),
  ('الثاني تقوية',13,'القراءة: لا تسل كيف كنا - دراسة القصيدة كاملة','reading',19,20),
  ('الثاني تقوية',14,'القواعد: أسلوب الشرط','grammar',19,20),
  ('الثاني تقوية',15,'القراءة: الإنسان وأسرار الكون','reading',19,20),
  ('الثاني تقوية',16,'الإنتاج الكتابي: تضمين القصة مقطعًا وصفيًا لوصف الشخصيات خارجيًا وداخليًا ووصف المشاعر والحركة والعمل','writing',19,20),
  ('الثاني تقوية',17,'القراءة: إن الكرام قليل - دراسة القصيدة كاملة، والحفظ من 1 إلى 6','reading',19,20),
  ('الثاني تقوية',18,'الإنتاج الكتابي: تضمين القصة مقطعًا وصفيًا لوصف مكان مغلق أو مكان مفتوح','writing',19,20),
  ('الثاني تقوية',19,'القواعد: أسلوب التعجب','grammar',19,20),
  ('الثاني تقوية',20,'القراءة: مروءة ووفاء','reading',19,20),
  ('الثاني تقوية',21,'القواعد: أسلوب الاستفهام (مراجعة)','grammar',19,20),
  ('الثاني تقوية',22,'مراجعة عامة','assessment',19,20)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,
  official_content_scope
)
select
  tu.id,
  r.title,
  r.lesson_number,
  r.lesson_number,
  r.lesson_type,
  concat('درس رسمي من خطة اللغة العربية للتعليم المستمر — ',r.level_name,' — الفصل الأول 2026-2027.'),
  'محتوى مقرر في الخطة الرسمية الحالية. يُحفظ العنوان كما في المصدر بعد تنظيف أخطاء OCR الشكلية فقط.',
  'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan6.pdf',
  r.source_page_start,
  r.source_page_end,
  'published',
  true,
  1,
  'plan-scheduled'
from rows r
join target_units tu on tu.level_name=r.level_name
on conflict (unit_id,lesson_number)
do update set
  title=excluded.title,
  sort_order=excluded.sort_order,
  lesson_type=excluded.lesson_type,
  summary=excluded.summary,
  content=excluded.content,
  source_pdf_url=excluded.source_pdf_url,
  source_page_start=excluded.source_page_start,
  source_page_end=excluded.source_page_end,
  status='published',
  semester=1,
  official_content_scope='plan-scheduled',
  updated_at=now();

-- Map the official non-standard curriculum to the Bahrain continuing-education track.
insert into public.secondary_track_curricula(
  secondary_track_id,curriculum_id,relation_type,is_default,notes
)
select
  st.id,
  cur.id,
  'official',
  true,
  'Official Bahrain continuing-education Arabic curriculum. Level rows have grade_number NULL by design; no grade 10-12 mapping is asserted.'
from public.secondary_tracks st
join public.curricula cur
  on cur.academic_year=st.academic_year
join public.countries c
  on c.id=cur.country_id and c.code=st.country_code
where st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar='التعليم المستمر'
  and cur.name_ar='اللغة العربية — التعليم المستمر'
  and not exists (
    select 1
    from public.secondary_track_curricula x
    where x.secondary_track_id=st.id
      and x.curriculum_id=cur.id
      and x.relation_type='official'
  );

update public.secondary_tracks
set lesson_coverage='detailed-current-s1-nonstandard-levels',
    arabic_policy='official-plan-nonstandard-levels-no-grade-10-12-mapping',
    source_urls=jsonb_build_array(
      'https://www.edunet.bh/Econtent/LessonsGuide',
      'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan6.pdf',
      'https://www.edunet.bh/Econtent/BooksGuide',
      'https://edunet.bh/manual/books2026/books4.pdf'
    ),
    last_audited_date=date '2026-10-07',
    updated_at=now()
where country_code='BH'
  and academic_year='2026-2027'
  and track_name_ar='التعليم المستمر';

update public.secondary_track_terms t
set detail_status='detailed-imported',
    publication_status='published',
    source_url='https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan6.pdf',
    audited_at=date '2026-10-07',
    notes='استُخرجت مستويات التعليم المستمر الستة وعناوين دروس اللغة العربية للفصل الأول 2026-2027 من Plan6 الحالي، دون ربطها بصفوف 10–12.',
    updated_at=now()
from public.secondary_tracks st
where t.secondary_track_id=st.id
  and st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar='التعليم المستمر'
  and t.academic_year='2026-2027'
  and t.semester=1;

-- Teach coverage view to count official curricula with NULL grade_number
-- only for genuinely non-standard tracks whose grade array is empty.
do $$
declare
  v_def text;
  v_old text := 'JOIN grades g ON g.curriculum_id = cur.id AND g.grade_number >= 10';
  v_new text := 'JOIN grades g ON g.curriculum_id = cur.id AND (g.grade_number >= 10 OR (COALESCE(cardinality(st.grades), 0) = 0 AND g.grade_number IS NULL))';
begin
  select pg_get_viewdef('public.secondary_track_coverage'::regclass,true)
  into v_def;

  if position(v_old in v_def)=0 then
    raise exception 'SECONDARY_TRACK_COVERAGE_GRADE_JOIN_NOT_FOUND';
  end if;

  v_def := replace(v_def,v_old,v_new);
  execute 'create or replace view public.secondary_track_coverage as ' || v_def;
  execute 'alter view public.secondary_track_coverage set (security_invoker=true)';
end $$;

-- Accept the verified non-standard S1 detailed state in the track-level audit.
do $$
declare
  v_name text;
  v_def text;
  v_old text := 'ARRAY[''detailed-current-semester-1''::text, ''detailed''::text, ''detailed-current-s1-plus-current-book-s2''::text]';
  v_new text := 'ARRAY[''detailed-current-semester-1''::text, ''detailed''::text, ''detailed-current-s1-plus-current-book-s2''::text, ''detailed-current-s1-nonstandard-levels''::text]';
begin
  foreach v_name in array array[
    'secondary_track_audit_report',
    'secondary_track_grade_audit_report'
  ]
  loop
    select pg_get_viewdef(format('public.%I',v_name)::regclass,true)
    into v_def;

    if position(v_old in v_def)=0 then
      raise exception 'EXPECTED_COVERAGE_ARRAY_NOT_FOUND_IN_%',v_name;
    end if;

    v_def := replace(v_def,v_old,v_new);
    execute format('create or replace view public.%I as %s',v_name,v_def);
    execute format('alter view public.%I set (security_invoker=true)',v_name);
  end loop;
end $$;

create or replace view public.secondary_track_grade_scope_violations
with (security_invoker=true)
as
select
  id,country_code,country_name_ar,system_name_ar,track_name_ar,
  academic_year,grades,lesson_coverage
from public.secondary_tracks
where is_active
  and coalesce(cardinality(grades),0)=0
  and lesson_coverage not in (
    'current-detailed-source-nonstandard-levels',
    'detailed-current-s1-nonstandard-levels'
  );

grant select on public.secondary_track_coverage to anon,authenticated;
grant select on public.secondary_track_audit_report to anon,authenticated;
grant select on public.secondary_track_grade_audit_report to anon,authenticated;
grant select on public.secondary_track_grade_scope_violations to anon,authenticated;
