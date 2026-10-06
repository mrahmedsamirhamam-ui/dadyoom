-- Bahrain Grade 5 Arabic — verified semester-2 book components.
-- Current 2026-2027 official book list confirms the Arabic book, linguistic
-- exercises part 2, handwriting book, and Duroob Al-Kitaba remain prescribed.
-- Detailed component map comes from the official 2025-2026 semester-2 plan.
-- These rows are official-book content, not a claim about 2026-2027 S2 scheduling.

with target_grade as (
  select g.id
  from public.grades g
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=5
  limit 1
),
units_data(unit_number,sort_order,title) as (
  values
    (241,241,'الجزء الثاني — القراءة والنصوص'),
    (242,242,'الجزء الثاني — الاستماع'),
    (243,243,'الجزء الثاني — القواعد والتراكيب'),
    (244,244,'الجزء الثاني — الإملاء'),
    (245,245,'الجزء الثاني — التعبير الشفوي والكتابي'),
    (246,246,'الجزء الثاني — الخط العربي')
)
insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
select tg.id,ud.title,
       'مكوّنات كتب اللغة العربية الرسمية للصف الخامس — الفصل/الجزء الثاني. الكتب مثبتة في قائمة الكتب 2026-2027، وخريطة المحتوى مأخوذة من خطة الوزارة للفصل الثاني 2025-2026؛ لذلك لا تعني الجدولة الحالية قبل نشر خطة الفصل الثاني 2026-2027.',
       ud.unit_number,ud.sort_order,2
from target_grade tg cross join units_data ud
on conflict (grade_id,unit_number)
do update set
  title=excluded.title,
  description=excluded.description,
  sort_order=excluded.sort_order,
  semester=2;

with target_units as (
  select u.id,u.unit_number
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number=5
    and u.unit_number between 241 and 246
),
items(unit_number,lesson_number,sort_order,title,lesson_type,summary,plan_page) as (
  values
  -- القراءة والنصوص
  (241,1,1,'الكهرباء في وطني','reading','القراءة ص 62-65.',20),
  (241,2,2,'نزهة في أحضان الطبيعة','reading','القراءة ص 70-73.',20),
  (241,3,3,'بيئتنا حياتنا','reading','القراءة ص 74-76؛ دراسة القصيدة كاملة، والحفظ من البيت 1 إلى 6.',20),
  (241,4,4,'الفارس العربي','reading','القراءة ص 78-81.',21),
  (241,5,5,'الممثل البارع','reading','القراءة ص 82-85.',21),
  (241,6,6,'إنها تحب التصميم','reading','القراءة ص 86-89.',21),
  (241,7,7,'على شواطئ البحرين','reading','القراءة ص 90-94؛ دراسة القصيدة كاملة، والحفظ من البيت 1 إلى 5.',21),
  (241,8,8,'الكلب والحمامة','reading','القراءة ص 100-103؛ دراسة القصيدة كاملة، والحفظ من البيت 1 إلى 5.',22),
  (241,9,9,'سابق الريح','reading','القراءة ص 104-107.',22),
  (241,10,10,'صدى الحياة','reading','القراءة ص 108-111.',22),
  (241,11,11,'مراجعة عامة للفصل الثاني','assessment','مراجعة عامة للفصل الثاني كما يثبتها المصدر الرسمي.',23),

  -- الاستماع
  (242,1,1,'النفايات الإلكترونية','listening','الاستماع؛ التدريبات ص 7-8.',20),
  (242,2,2,'الفروسية','listening','الاستماع؛ التدريبات ص 32-33.',21),
  (242,3,3,'الخديعة','listening','الاستماع؛ التدريبات ص 66-67.',22),

  -- القواعد والتراكيب
  (243,1,1,'الحروف الناسخة','grammar','القواعد النحوية؛ التدريبات ص 9-13.',20),
  (243,2,2,'الأسماء المجرورة بحروف الجر','grammar','القواعد النحوية؛ التدريبات ص 14-18.',20),
  (243,3,3,'الأسماء المجرورة بالإضافة','grammar','القواعد النحوية؛ التدريبات ص 24-29.',20),
  (243,4,4,'الصفة والموصوف','grammar','القواعد النحوية؛ التدريبات ص 34-39.',21),
  (243,5,5,'ظرفا الزمان والمكان','grammar','القواعد النحوية؛ التدريبات ص 45-50.',21),
  (243,6,6,'ضمائر الرفع المتصلة (1)','grammar','القواعد النحوية؛ التدريبات ص 55-58؛ يقسم الدرس إلى جزأين.',21),
  (243,7,7,'ضمائر الرفع المتصلة (2)','grammar','القواعد النحوية؛ التدريبات ص 59-61.',22),
  (243,8,8,'النفي بـ(ما - لم - لن - لا - ليس) (1)','grammar','القواعد النحوية؛ التدريبات ص 68-71؛ يقسم الدرس إلى جزأين.',22),
  (243,9,9,'النفي بـ(ما - لم - لن - لا - ليس) (2)','grammar','القواعد النحوية؛ التدريبات ص 71-74.',22),
  (243,10,10,'العطف بـ(الواو - ثم - أو) (1)','grammar','القواعد النحوية؛ التدريبات ص 82-84؛ يقسم الدرس إلى جزأين.',22),
  (243,11,11,'العطف بـ(الواو - ثم - أو) (2)','grammar','القواعد النحوية؛ التدريبات ص 84-88.',22),
  (243,12,12,'أنشطة تقويمية في القواعد النحوية','assessment','القواعد النحوية؛ التدريبات ص 93-95.',23),

  -- الإملاء
  (244,1,1,'الهمزة المتوسطة المكسورة (1)','writing','الإملاء؛ التدريبات ص 18-21.',20),
  (244,2,2,'الهمزة المتوسطة المكسورة (2)','writing','الإملاء؛ التدريبات ص 29-30.',20),
  (244,3,3,'الهمزة المتوسطة المكسور ما قبلها','writing','الإملاء؛ التدريبات ص 40-43.',21),
  (244,4,4,'الهمزة المتطرفة المفتوح ما قبلها','writing','الإملاء؛ التدريبات ص 51-53.',21),
  (244,5,5,'الهمزة المتطرفة المكسور ما قبلها','writing','الإملاء؛ التدريبات ص 61-64.',22),
  (244,6,6,'الهمزة المتطرفة المسبوقة بحرف ساكن صحيح أو حرف علة','writing','الإملاء؛ التدريبات ص 75-80.',22),
  (244,7,7,'الألف الفارقة','writing','الإملاء؛ التدريبات ص 89-91.',23),
  (244,8,8,'أنشطة تقويمية في الإملاء','assessment','الإملاء؛ التدريبات ص 98-100.',23),

  -- التعبير الشفوي
  (245,1,1,'التعبير الشفوي — الأسبوع الأول','speaking','بند التعبير الشفوي؛ التدريبات ص 13، دون عنوان ظاهر في المصدر.',20),
  (245,2,2,'التعبير الشفوي — الأسبوع الثاني','speaking','بند التعبير الشفوي؛ التدريبات ص 22، دون عنوان ظاهر في المصدر.',20),
  (245,3,3,'التعبير الشفوي — الأسبوع الثالث','speaking','بند التعبير الشفوي؛ التدريبات ص 30، دون عنوان ظاهر في المصدر.',21),
  (245,4,4,'التعبير الشفوي — الأسبوع الخامس','speaking','بند التعبير الشفوي؛ التدريبات ص 44، دون عنوان ظاهر في المصدر.',21),
  (245,5,5,'التعبير الشفوي — الأسبوع السادس','speaking','بند التعبير الشفوي؛ التدريبات ص 53، دون عنوان ظاهر في المصدر.',21),
  (245,6,6,'التعبير الشفوي — الأسبوع السابع','speaking','بند التعبير الشفوي؛ التدريبات ص 64، دون عنوان ظاهر في المصدر.',22),
  (245,7,7,'التعبير الشفوي — الأسبوع التاسع','speaking','بند التعبير الشفوي؛ التدريبات ص 80، دون عنوان ظاهر في المصدر.',22),
  (245,8,8,'التعبير الشفوي — الأسبوع الحادي عشر','speaking','بند التعبير الشفوي؛ التدريبات ص 92، دون عنوان ظاهر في المصدر.',23),

  -- الإنتاج الكتابي
  (245,101,101,'المذكرات اليومية — أكتشف','writing','دروب الكتابة؛ قسم أكتشف من درس المذكرات اليومية.',20),
  (245,102,102,'المذكرات اليومية — أتدرب','writing','دروب الكتابة ص 82.',20),
  (245,103,103,'المذكرات اليومية — أنتج','writing','دروب الكتابة ص 83-85.',21),
  (245,104,104,'تثرية النص السردي بالحوار — أكتشف','writing','دروب الكتابة ص 87-91.',21),
  (245,105,105,'تثرية النص السردي بالحوار — أتدرب','writing','دروب الكتابة ص 92-97.',21),
  (245,106,106,'تثرية النص السردي بالحوار — أنتج','writing','دروب الكتابة ص 98-100.',21),
  (245,107,107,'تلخيص قصة — أكتشف','writing','دروب الكتابة ص 101-107.',22),
  (245,108,108,'تلخيص قصة — أتدرب','writing','دروب الكتابة ص 108-110.',22),
  (245,109,109,'تلخيص قصة — أنتج','writing','دروب الكتابة ص 111-113.',22),
  (245,110,110,'بطاقة الدعوة — أكتشف','writing','دروب الكتابة ص 115-118.',22),
  (245,111,111,'بطاقة الدعوة — أتدرب','writing','دروب الكتابة ص 118-119.',23),
  (245,112,112,'بطاقة الدعوة — أنتج','writing','دروب الكتابة ص 120-121.',23),

  -- الخط
  (246,1,1,'حرف (ض)','writing','كراسة الخط العربي ص 34-35.',20),
  (246,2,2,'حرف (ط)','writing','كراسة الخط العربي ص 36-37.',20),
  (246,3,3,'حرف (ظ)','writing','كراسة الخط العربي ص 38-39.',21),
  (246,4,4,'حرف (ع)','writing','كراسة الخط العربي ص 40-41.',21),
  (246,5,5,'حرف (ف)','writing','كراسة الخط العربي ص 44-45.',21),
  (246,6,6,'حرف (ق)','writing','كراسة الخط العربي ص 46-47.',21),
  (246,7,7,'حرف (ك)','writing','كراسة الخط العربي ص 48-49.',22),
  (246,8,8,'حرف (ل)','writing','كراسة الخط العربي ص 50-51.',22),
  (246,9,9,'حرف (م)','writing','كراسة الخط العربي ص 52-53.',22),
  (246,10,10,'حرف (ن)','writing','كراسة الخط العربي ص 54-55.',22),
  (246,11,11,'حرف (هـ)','writing','كراسة الخط العربي ص 56-57.',23),
  (246,12,12,'حرفا (و) و(ي)','writing','كراسة الخط العربي ص 58-61.',23)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,
  official_content_scope
)
select
  tu.id,i.title,i.lesson_number,i.sort_order,i.lesson_type,i.summary,
  'محتوى من كتب رسمية مقررة للصف الخامس. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.',
  'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan5.pdf',
  i.plan_page,i.plan_page,'published',true,2,'official-book-unscheduled'
from items i
join target_units tu on tu.unit_number=i.unit_number
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
  semester=2,
  official_content_scope='official-book-unscheduled',
  updated_at=now();

update public.curriculum_grade_terms cgt
set detail_status='detailed-imported',
    audited_at=current_date
from public.curricula cur
join public.countries c on c.id=cur.country_id
where cgt.curriculum_id=cur.id
  and c.code='BH'
  and cur.name_ar='اللغة العربية'
  and cur.academic_year='2026-2027'
  and cgt.grade_number=5
  and cgt.semester=2;
