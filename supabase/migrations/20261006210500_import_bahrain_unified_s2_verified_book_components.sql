-- Bahrain unified secondary Arabic: verified semester-2 book components.
-- Current 2026-2027 semester-2 schedule has not been published as of audit.
-- These rows are grounded in the Ministry's official 2025-2026 S2 Plan4 for
-- the same official books/courses and are therefore book-content only.

with target_grades as (
  select g.id,g.grade_number
  from public.grades g
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number in (10,11,12)
),
units_data(grade_number,unit_number,sort_order,title) as (
  values
    (10,3102,3102,'الجزء الثاني — عرب 102: من فنون الأدب'),
    (11,3202,3202,'الجزء الثاني — عرب 202: الأدب والحياة'),
    (12,3302,3302,'الجزء الثاني — عرب 302: النص على النص')
)
insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
select tg.id,ud.title,
       'محتوى كتاب رسمي للفصل/الجزء الثاني، مستخرج من خطة الوزارة الرسمية 2025-2026. لا يعني أنه مجدول حاليًا في 2026-2027 قبل نشر الخطة الجديدة.',
       ud.unit_number,ud.sort_order,2
from target_grades tg
join units_data ud on ud.grade_number=tg.grade_number
on conflict (grade_id,unit_number)
do update set
  title=excluded.title,
  description=excluded.description,
  sort_order=excluded.sort_order,
  semester=2;

with target_units as (
  select g.grade_number,u.id,u.unit_number
  from public.units u
  join public.grades g on g.id=u.grade_id
  join public.curricula cur on cur.id=g.curriculum_id
  join public.countries c on c.id=cur.country_id
  where c.code='BH'
    and cur.name_ar='اللغة العربية'
    and cur.academic_year='2026-2027'
    and g.grade_number in (10,11,12)
    and u.unit_number in (3102,3202,3302)
),
items(grade_number,unit_number,lesson_number,sort_order,title,lesson_type,summary,plan_page) as (
  values
  (10,3102,1,1,'الطبيعة في الشعر العربي: «وقوف على ظهر الفلاة» لابن خفاجة','reading','من فنون الأدب ص 34-41؛ الحفظ من 1 إلى 6.',2),
  (10,3102,2,2,'القضايا الصرفية: الميزان الصرفي','grammar','من فنون الأدب ص 152-158.',2),
  (10,3102,3,3,'القضايا الصرفية: الجامد والمشتق','grammar','من فنون الأدب ص 159-162.',2),
  (10,3102,4,4,'الإنتاج الكتابي: إنتاج نص سردي','writing','الإنتاج الكتابي ص 10-31.',2),
  (10,3102,5,5,'قصيدة الغزل: «وهل يخفى القمر» لعمر بن أبي ربيعة','reading','من فنون الأدب ص 46-63.',2),
  (10,3102,6,6,'المصدر','grammar','من فنون الأدب ص 163-169.',2),
  (10,3102,7,7,'اسم الفاعل','grammar','من فنون الأدب ص 170-174.',2),
  (10,3102,8,8,'الصفة المشبهة باسم الفاعل','grammar','من فنون الأدب ص 175-181.',2),
  (10,3102,9,9,'الإنتاج الكتابي: إنتاج نص وصفي','writing','الإنتاج الكتابي ص 34-70.',2),
  (10,3102,10,10,'النادرة الأدبية: «الولد سِرّ أبيه» للجاحظ','reading','من فنون الأدب ص 97-103.',2),
  (10,3102,11,11,'اسم المفعول','grammar','من فنون الأدب ص 182-187.',2),
  (10,3102,12,12,'فن المقامة: «المقامة البغدادية» لبديع الزمان الهمذاني','reading','من فنون الأدب ص 108-115.',2),
  (10,3102,13,13,'صيغ المبالغة','grammar','من فنون الأدب ص 188-192.',2),
  (10,3102,14,14,'القصة القصيرة: «تحت سماء المدينة» لمحمد عبد الملك','reading','من فنون الأدب ص 120-139.',2),
  (10,3102,15,15,'الإنتاج الكتابي: إنتاج نص سردي مغنى بالوصف','writing','الإنتاج الكتابي ص 72-80.',2),

  (11,3202,1,1,'أهمية المشورة - الأبشيهي','reading','الأدب والحياة ص 24-29.',3),
  (11,3202,2,2,'التشبيه: أنواعه وأدواته ووظائفه','reading','الأدب والحياة ص 137-144.',3),
  (11,3202,3,3,'الحقيقة والمجاز','reading','الأدب والحياة ص 145-149.',3),
  (11,3202,4,4,'الوطنية - محمد عبده','reading','الأدب والحياة ص 37-50.',3),
  (11,3202,5,5,'الإنتاج الكتابي: إنتاج نص حجاجي مقنع بالسرد','writing','إنتاج جزئي وإنتاج كامل كما تثبته الخطة الرسمية.',3),
  (11,3202,6,6,'الاستعارة: أنواعها وأركانها','reading','الأدب والحياة ص 153-157.',3),
  (11,3202,7,7,'رسالة الأمين إلى المأمون - الطبري','reading','الأدب والحياة ص 60-67.',3),
  (11,3202,8,8,'المجاز المرسل','reading','الأدب والحياة ص 158-162.',3),
  (11,3202,9,9,'في الكلام على أهل باريس - رفاعة الطهطاوي','reading','الأدب والحياة ص 106-119.',3),
  (11,3202,10,10,'الإنتاج الكتابي: إنتاج نص حجاجي مقنع بالوصف','writing','إنتاج جزئي وإنتاج كامل كما تثبته الخطة الرسمية.',3),
  (11,3202,11,11,'الكناية','reading','الأدب والحياة ص 166-171.',3),
  (11,3202,12,12,'الجناس والسجع','reading','الأدب والحياة ص 173-177.',3),
  (11,3202,13,13,'الطباق والمقابلة','reading','الأدب والحياة ص 182-189.',3),

  (12,3302,1,1,'شرح بيتين للمتنبي','reading','النص على النص ص 16-20.',4),
  (12,3302,2,2,'دلالات المركبات','grammar','النص على النص ص 100-104.',4),
  (12,3302,3,3,'حروف الجر ومعانيها','grammar','من، إلى، عن، على، في، الباء، الكاف، اللام؛ ص 105-110.',4),
  (12,3302,4,4,'الإنتاج الكتابي: الشرح والتحليل','writing','إنتاج مقال أدبي من خلال شرح وتحليل نص قصير.',4),
  (12,3302,5,5,'حديث في الحداثة - قمر الكيلاني','reading','النص على النص ص 26-37.',4),
  (12,3302,6,6,'جودة الأدب ومصير المطالعة','reading','النص على النص ص 40-52.',4),
  (12,3302,7,7,'العدد والمعدود','grammar','النص على النص ص 143-153.',4),
  (12,3302,8,8,'اللغة العربية والفكر والعلم - أدونيس','reading','النص على النص ص 53-57.',4),
  (12,3302,9,9,'الإنتاج الكتابي: التعليق الصحفي','writing','كتابة تعليق صحفي انطلاقًا من خبر أو مقال أو حدث أو قضية.',4),
  (12,3302,10,10,'الأفعال الناسخة: معانيها ودلالاتها','grammar','النص على النص ص 120-128.',4),
  (12,3302,11,11,'الحروف الناسخة: معانيها ودلالاتها','grammar','النص على النص ص 129-137.',4),
  (12,3302,12,12,'الممنوع من الصرف','grammar','النص على النص ص 138-142.',4),
  (12,3302,13,13,'قراءة أثر متكامل: الأيام لطه حسين - الجزء الأول','reading','تخصص له عشر حصص وفق الخطة الرسمية ويدخل ضمن نظام التقويم.',4)
)
insert into public.lessons(
  unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
  source_pdf_url,source_page_start,source_page_end,status,is_free,semester,
  official_content_scope
)
select
  tu.id,i.title,i.lesson_number,i.sort_order,i.lesson_type,i.summary,
  'مكوّن موثق من كتاب رسمي. خريطة المحتوى من خطة وزارة التربية والتعليم للفصل الثاني 2025-2026؛ لا يُعرض على أنه مقرر حاليًا في 2026-2027 قبل نشر خطة الفصل الثاني.',
  'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
  i.plan_page,i.plan_page,'published',true,2,'official-book-unscheduled'
from items i
join target_units tu
  on tu.grade_number=i.grade_number
 and tu.unit_number=i.unit_number
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

insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'official',
       'Official book content for semester/part 2; current 2026-2027 S2 schedule not yet published.'
from public.secondary_tracks st
join public.countries c on c.code='BH' and c.code=st.country_code
join public.curricula cur on cur.country_id=c.id and cur.name_ar='اللغة العربية' and cur.academic_year='2026-2027'
join public.grades g on g.curriculum_id=cur.id and g.grade_number=any(st.grades)
join public.units u on u.grade_id=g.id and u.unit_number in (3102,3202,3302)
where st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar='توحيد المسارات'
on conflict (secondary_track_id,unit_id)
do update set relation_type='official',notes=excluded.notes;

-- Arab 102 is explicitly shared with religious education in the official source.
insert into public.secondary_track_units(secondary_track_id,unit_id,relation_type,notes)
select st.id,u.id,'official',
       'Arab 102 is shared by unified tracks and religious education in the official Ministry source.'
from public.secondary_tracks st
join public.countries c on c.code='BH' and c.code=st.country_code
join public.curricula cur on cur.country_id=c.id and cur.name_ar='اللغة العربية' and cur.academic_year='2026-2027'
join public.grades g on g.curriculum_id=cur.id and g.grade_number=10
join public.units u on u.grade_id=g.id and u.unit_number=3102
where st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar='التعليم الديني'
on conflict (secondary_track_id,unit_id)
do update set relation_type='official',notes=excluded.notes;

update public.secondary_track_grade_terms gt
set detail_status='partial-imported',
    audited_at=current_date,
    notes=coalesce(gt.notes,'') || ' Verified official-book S2 components imported from Ministry 2025-2026 plan; current 2026-2027 S2 schedule remains unpublished.',
    updated_at=now()
from public.secondary_tracks st
where gt.secondary_track_id=st.id
  and st.country_code='BH'
  and st.academic_year='2026-2027'
  and st.track_name_ar in ('توحيد المسارات','التعليم الديني')
  and gt.academic_year='2026-2027'
  and gt.semester=2
  and (
    st.track_name_ar='توحيد المسارات'
    or (st.track_name_ar='التعليم الديني' and gt.grade_number=10)
  );
