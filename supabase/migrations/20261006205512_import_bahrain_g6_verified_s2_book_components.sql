-- Bahrain Grade 6 Arabic — verified semester-2 book components.
-- Current 2026-2027 official book list confirms the Arabic book, linguistic
-- exercises part 2, and the narrative writing workbook remain prescribed.
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
    and g.grade_number=6
  limit 1
),
units_data(unit_number,sort_order,title) as (
  values
    (251,251,'الجزء الثاني — القراءة والنصوص'),
    (252,252,'الجزء الثاني — الاستماع'),
    (253,253,'الجزء الثاني — القواعد والتراكيب'),
    (254,254,'الجزء الثاني — الإملاء'),
    (255,255,'الجزء الثاني — الإنتاج الكتابي')
)
insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
select tg.id,ud.title,
       'مكوّنات كتب اللغة العربية الرسمية للصف السادس — الفصل/الجزء الثاني. الكتب مثبتة في قائمة الكتب 2026-2027، وخريطة المحتوى مأخوذة من خطة الوزارة للفصل الثاني 2025-2026؛ لذلك لا تعني الجدولة الحالية قبل نشر خطة الفصل الثاني 2026-2027.',
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
    and g.grade_number=6
    and u.unit_number between 251 and 255
),
items(unit_number,lesson_number,sort_order,title,lesson_type,summary,plan_page) as (
  values
  -- القراءة والنصوص
  (251,1,1,'زرقاء اليمامة','reading','القراءة ص 65-68.',24),
  (251,2,2,'صفية بنت عبد المطلب','reading','القراءة ص 69-72.',24),
  (251,3,3,'عالم المفاجآت','reading','القراءة ص 75-78.',24),
  (251,4,4,'راعي الميثاق','reading','القراءة ص 79-81؛ دراسة القصيدة كاملة، وحفظ الأبيات من 1 إلى 6.',25),
  (251,5,5,'النخلة المعوجة','reading','القراءة ص 86-88؛ دراسة القصيدة كاملة، وحفظ الأبيات من 1 إلى 8.',25),
  (251,6,6,'قصة نجاح','reading','القراءة ص 89-92.',25),
  (251,7,7,'أمنية تتحقق','reading','القراءة ص 93-96.',25),
  (251,8,8,'الإحسان إلى الخلق','reading','القراءة ص 97-102.',25),
  (251,9,9,'أخلاق كريمة','reading','القراءة ص 103-105؛ دراسة القصيدة كاملة، وحفظ الأبيات من 1 إلى 5.',25),
  (251,10,10,'مثل وقصة','reading','القراءة ص 110-113.',26),
  (251,11,11,'مراجعة عامة للقراءة والنحو والإملاء','assessment','مراجعة عامة كما يثبتها المصدر الرسمي في الأسبوع 13.',26),

  -- الاستماع
  (252,1,1,'يونس في بطن الحوت','listening','نص استماع مثبت في دليل المعلم.',24),
  (252,2,2,'مظلات الهبوط','listening','نص استماع مثبت في دليل المعلم.',24),
  (252,3,3,'مستشفيات الأسماك','listening','نص استماع مثبت في دليل المعلم.',25),
  (252,4,4,'الصدق منجاة','listening','نص استماع مثبت في دليل المعلم.',25),
  (252,5,5,'إن حاتمًا لم يمت','listening','نص استماع مثبت في دليل المعلم.',26),

  -- القواعد
  (253,1,1,'التطابق بين المبتدأ والخبر','grammar','القواعد النحوية؛ التدريبات ص 7-11.',24),
  (253,2,2,'تدريبات على كان وأخواتها وإن وأخواتها','grammar','القواعد النحوية؛ التدريبات ص 13-16.',24),
  (253,3,3,'النكرة والمعرفة','grammar','القواعد النحوية؛ التدريبات ص 19-21؛ يقسم الدرس إلى جزأين.',24),
  (253,4,4,'النكرة والمعرفة — أطبق','grammar','القواعد النحوية؛ التدريبات ص 21-23.',25),
  (253,5,5,'التطابق بين الصفة والموصوف','grammar','القواعد النحوية؛ التدريبات ص 24-27؛ يقسم الدرس إلى جزأين.',25),
  (253,6,6,'التطابق بين الصفة والموصوف — أطبق','grammar','القواعد النحوية؛ التدريبات ص 28-30.',25),
  (253,7,7,'الحال','grammar','القواعد النحوية؛ التدريبات ص 33-41.',25),
  (253,8,8,'المفعول المطلق','grammar','القواعد النحوية؛ التدريبات ص 45-48.',25),
  (253,9,9,'المفعول لأجله','grammar','القواعد النحوية؛ التدريبات ص 51-55.',26),
  (253,10,10,'الأسماء الخمسة','grammar','القواعد النحوية؛ التدريبات ص 60-67.',26),
  (253,11,11,'تمييز العدد من 3 إلى 10','grammar','القواعد النحوية؛ التدريبات ص 69-70.',26),
  (253,12,12,'تمييز العدد من 11 إلى 99','grammar','القواعد النحوية؛ التدريبات ص 70-76.',26),
  (253,13,13,'مراجعة القواعد النحوية','assessment','القواعد النحوية؛ التدريبات ص 80-86.',26),

  -- الإملاء
  (254,1,1,'تدريبات على الهمزة المتطرفة','writing','القواعد الإملائية؛ التدريبات ص 11-12.',24),
  (254,2,2,'تدريبات على الهمزة','writing','القواعد الإملائية؛ التدريبات ص 16-17.',24),
  (254,3,3,'القواعد الإملائية — الأسبوع السادس','writing','القواعد الإملائية؛ التدريبات ص 31-32، دون عنوان تفصيلي ظاهر في المصدر.',25),
  (254,4,4,'القواعد الإملائية — الأسبوع السابع','writing','القواعد الإملائية؛ التدريبات ص 41-43، دون عنوان تفصيلي ظاهر في المصدر.',25),
  (254,5,5,'القواعد الإملائية — الأسبوع الثامن','writing','القواعد الإملائية؛ التدريبات ص 48-50، دون عنوان تفصيلي ظاهر في المصدر.',25),
  (254,6,6,'دخول حروف الجر على ما الاستفهامية','writing','القواعد الإملائية: دخول (على، من، إلى، عن) على (ما) الاستفهامية؛ التدريبات ص 56-59.',26),
  (254,7,7,'القواعد الإملائية — الأسبوع العاشر','writing','القواعد الإملائية؛ التدريبات ص 67-68، دون عنوان تفصيلي ظاهر في المصدر.',26),
  (254,8,8,'القواعد الإملائية — الأسبوع الحادي عشر','writing','القواعد الإملائية؛ التدريبات ص 76-79، دون عنوان تفصيلي ظاهر في المصدر.',26),

  -- الإنتاج الكتابي
  (255,1,1,'تسلسل الأحداث في النص السردي — أتعرف وأكتشف','writing','كراسة الإنتاج الكتابي ص 28-31؛ يقسم الدرس إلى ثلاثة أجزاء.',24),
  (255,2,2,'تسلسل الأحداث في النص السردي — أثري وأنتج جزئيًا','writing','كراسة الإنتاج الكتابي ص 32-34.',24),
  (255,3,3,'تسلسل الأحداث في النص السردي — أنتج وأقوم','writing','كراسة الإنتاج الكتابي ص 35-37.',24),
  (255,4,4,'إغناء النص السردي بالوصف والحوار — أتعرف وأكتشف','writing','كراسة الإنتاج الكتابي ص 38-43؛ يقسم الدرس إلى ثلاثة أجزاء.',25),
  (255,5,5,'إغناء النص السردي بالوصف والحوار — أثري وأنتج جزئيًا','writing','كراسة الإنتاج الكتابي ص 44-50.',25),
  (255,6,6,'إغناء النص السردي بالوصف والحوار — أنتج وأقوم','writing','كراسة الإنتاج الكتابي ص 51-54.',25),
  (255,7,7,'تدريبات التعبير الكتابي — الأسبوع السابع','writing','التعبير الكتابي؛ التدريبات ص 50.',25),
  (255,8,8,'تدريبات التعبير الكتابي — الأسبوع الثامن','writing','التعبير الكتابي؛ التدريبات ص 59.',25),
  (255,9,9,'تدريبات التعبير الكتابي — الأسبوع التاسع','writing','التعبير الكتابي؛ التدريبات ص 68.',26),
  (255,10,10,'تدريبات التعبير الكتابي — الأسبوعان العاشر والحادي عشر','writing','التعبير الكتابي؛ التدريبات ص 79 كما يثبت المصدر الرسمي.',26)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,
  official_content_scope
)
select
  tu.id,i.title,i.lesson_number,i.sort_order,i.lesson_type,i.summary,
  'محتوى من كتب رسمية مقررة للصف السادس. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026، ولا تعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.',
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
  and cgt.grade_number=6
  and cgt.semester=2;
