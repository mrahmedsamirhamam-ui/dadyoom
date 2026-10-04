-- Djibouti Grade 11 Arabic — verified readable detailed CRIPEN Première programme.
-- Official programme: https://cripen.dj/wp-content/uploads/2025/05/Programme-compile-1ere.pdf
-- One environmental table slot is intentionally unresolved because the extracted RTL text is not reliable enough to restore it without guessing.

create temp table if not exists tmp_dj_g11(data jsonb) on commit drop;
truncate tmp_dj_g11;
insert into tmp_dj_g11(data) values ($json${"units":[{"number":1,"title":"المجال الاجتماعي","topics":["مكافحة الفقر","محو الأمية","مشكلات القات"]},{"number":2,"title":"المجال الاقتصادي","topics":["الموارد البحرية","الزراعة","دور القطاع الخاص في تنمية الاقتصاد"]},{"number":3,"title":"المجال الصحي","topics":["ختان الإناث","الأمراض النفسية (القلق)","الأمراض المزمنة"]},{"number":4,"title":"المجال الأدبي — القصيدة العربية القديمة","topics":["النابغة — المدح","زهير بن أبي سلمى — الحكمة","عنترة — الفخر","الخنساء — الرثاء","جميل بن معمر (جميل بثينة) — الغزل","حسان بن ثابت — في مدح الرسول صلى الله عليه وسلم"]},{"number":5,"title":"المجال البيئي","topics":["النظافة","تلوث البحار"]},{"number":6,"title":"المجال القيمي الإنساني","topics":["الحقوق والواجبات","حرية التعبير","العدالة"]},{"number":7,"title":"المجال الإعلامي والاتصالات","topics":["ثورة الاتصالات","القنوات الفضائية","الهاتف النقال"]},{"number":8,"title":"المجال الأدبي — تطور القصيدة العربية وأغراضها في العصر العباسي","topics":["أبو العتاهية — الزهد","البحتري — الوصف","أبو تمام — الوصف والحكمة","المتنبي — الوصف والمدح"]},{"number":9,"title":"المجال الثقافي","topics":["السينما","المهرجانات","الرحلات"]},{"number":10,"title":"المجال الرياضي","topics":["النوادي الرياضية","ألعاب القوى","الألعاب الإفريقية"]},{"number":11,"title":"المجال العلمي","topics":["العلم بين الإنسانية والمصالح الاقتصادية","الاختراعات العلمية","علماء مشاهير"]},{"number":12,"title":"المجال الأدبي — الكتابة النثرية قديمًا","topics":["الرسائل","الخطابة","الخبر","الحكاية المثلية","المقامات","النادرة"]},{"number":13,"title":"النحو والصرف","topics":["الميزان الصرفي","الجامد والمشتق (مقدمة)","اسم الفاعل","اسم المفعول","اسم التفضيل","أفعال المقاربة","التوكيد المعنوي","الاستثناء إجمالًا","الاستثناء بإلا","أسماء الزمان والمكان (مراجعة)","الاسم المقصور والمنقوص والممدود","التعجب"]},{"number":14,"title":"البلاغة","topics":["أغراض التشبيه (فوائد التشبيه)","القصر","الإيجاز والإطناب"]},{"number":15,"title":"الإملاء","topics":["الحروف التي تنطق ولا تكتب","الحروف التي تكتب ولا تنطق","همزة ابن: إثباتها وحذفها"]}],"source":"https://cripen.dj/wp-content/uploads/2025/05/Programme-compile-1ere.pdf"}$json$::jsonb);

with c as (select id from public.countries where code='DJ' limit 1)
insert into public.curricula(country_id,name_ar,name_en,academic_year,description,is_active)
select id,'اللغة العربية — جيبوتي — Première — البرنامج الرسمي التفصيلي الموثق جزئيًا','Arabic — Djibouti Première — Verified Partial Detailed Official Programme','2026-2027',
'برنامج العربية الرسمي للصف الثاني الثانوي من MENFOP/CRIPEN. أُدخلت الموضوعات المقروءة بوضوح فقط؛ خانة بيئية واحدة غير واضحة تُركت دون تخمين.',true
from c
on conflict (country_id,name_ar,academic_year)
do update set description=excluded.description,is_active=true;

with cu as (
 select cu.id from public.countries c join public.curricula cu on cu.country_id=c.id
 where c.code='DJ' and cu.name_ar='اللغة العربية — جيبوتي — Première — البرنامج الرسمي التفصيلي الموثق جزئيًا' and cu.academic_year='2026-2027' limit 1
)
insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
select id,'Première / الصف الثاني الثانوي','Première / Grade 11',11,11,true
from cu
on conflict (curriculum_id,name_ar)
do update set grade_number=11,sort_order=11,is_active=true;

with g as (
 select g.id from public.countries c join public.curricula cu on cu.country_id=c.id join public.grades g on g.curriculum_id=cu.id
 where c.code='DJ' and cu.name_ar='اللغة العربية — جيبوتي — Première — البرنامج الرسمي التفصيلي الموثق جزئيًا' and g.grade_number=11 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_dj_g11)) as x(number int,title text,topics jsonb)
)
insert into public.units(grade_id,title,description,unit_number,sort_order)
select g.id,d.title,'مجال/فرع موثق ومقروء بوضوح من برنامج Première الرسمي للعربية.',d.number,d.number
from g cross join defs d
on conflict (grade_id,unit_number)
do update set title=excluded.title,description=excluded.description,sort_order=excluded.sort_order;

with g as (
 select g.id from public.countries c join public.curricula cu on cu.country_id=c.id join public.grades g on g.curriculum_id=cu.id
 where c.code='DJ' and cu.name_ar='اللغة العربية — جيبوتي — Première — البرنامج الرسمي التفصيلي الموثق جزئيًا' and g.grade_number=11 limit 1
), defs as (
 select * from jsonb_to_recordset((select data->'units' from tmp_dj_g11)) as x(number int,title text,topics jsonb)
), expanded as (
 select d.number unit_number,d.title unit_title,row_number() over(partition by d.number order by ordinality)::int lesson_number,topic #>> '{}' lesson_title
 from defs d cross join lateral jsonb_array_elements(d.topics) with ordinality as e(topic,ordinality)
), tu as (
 select u.id,u.unit_number from public.units u join g on g.id=u.grade_id
)
insert into public.lessons(unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,content,learning_objectives,vocabulary,instructions,source_pdf_url,status,is_free,estimated_minutes)
select tu.id,e.lesson_title,
'dj-official-g11-u'||lpad(e.unit_number::text,2,'0')||'-l'||lpad(e.lesson_number::text,2,'0'),
e.lesson_number,e.lesson_number,'reading',
'موضوع موثق من برنامج Première الرسمي «'||e.lesson_title||'» ضمن «'||e.unit_title||'».',
'يستخدم هذا الدرس عنوان البرنامج الرسمي كنقطة انطلاق ويقدم شرحًا وتطبيقات أصلية من ضاديوم دون نسخ نصوص المصدر.',
jsonb_build_array('أن يحدد المتعلم الفكرة أو المهارة المركزية في الموضوع.','أن يحلل المتعلم مثالًا أو شاهدًا مناسبًا.','أن يوظف المتعلم ما تعلمه في استجابة أصلية.'),
jsonb_build_array(
 jsonb_build_object('word','الفكرة','meaning','المعنى أو المهارة المركزية في الموضوع.'),
 jsonb_build_object('word','التحليل','meaning','تفكيك الفكرة وربطها بأدلتها أو أمثلتها.'),
 jsonb_build_object('word','التطبيق','meaning','توظيف المعرفة في موقف جديد.')
),
jsonb_build_array('راجع عنوان الموضوع في البرنامج الرسمي.','حدد الفكرة أو المهارة الرئيسة.','حلل مثالًا مناسبًا.','أنجز تطبيقًا قصيرًا من صياغتك.'),
(select data->>'source' from tmp_dj_g11),'published',true,40
from expanded e join tu on tu.unit_number=e.unit_number
on conflict (unit_id,lesson_number)
do update set title=excluded.title,slug=excluded.slug,sort_order=excluded.sort_order,summary=excluded.summary,content=excluded.content,
learning_objectives=excluded.learning_objectives,vocabulary=excluded.vocabulary,instructions=excluded.instructions,
source_pdf_url=excluded.source_pdf_url,status='published',is_free=true,estimated_minutes=excluded.estimated_minutes,updated_at=now();

with tl as (
 select l.id,l.title,u.title unit_title from public.countries c join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id join public.units u on u.grade_id=g.id join public.lessons l on l.unit_id=u.id
 where c.code='DJ' and cu.name_ar='اللغة العربية — جيبوتي — Première — البرنامج الرسمي التفصيلي الموثق جزئيًا' and g.grade_number=11
)
insert into public.questions(lesson_id,question_order,question,question_type,options,correct_answer,explanation,points)
select tl.id,q.n,
case q.n when 1 then 'ما الخطوة الأولى الأنسب لدراسة «'||tl.title||'»؟' when 2 then 'ما الذي يثبت فهمك للموضوع ضمن «'||tl.unit_title||'»؟' else 'ما دور ضاديوم في هذا الموضوع؟' end,
'multiple_choice',
case q.n
 when 1 then jsonb_build_array(jsonb_build_object('id','a','text','تحديد الفكرة أو المهارة وربطها بالسياق.'),jsonb_build_object('id','b','text','حفظ إجابة بلا فهم.'),jsonb_build_object('id','c','text','تجاهل الأمثلة.'))
 when 2 then jsonb_build_array(jsonb_build_object('id','a','text','تفسير مثال أو شاهد وتطبيق الفكرة.'),jsonb_build_object('id','b','text','نسخ العنوان فقط.'),jsonb_build_object('id','c','text','إعادة عبارة محفوظة.'))
 else jsonb_build_array(jsonb_build_object('id','a','text','دعم البرنامج الرسمي بشرح وتدريب أصلي.'),jsonb_build_object('id','b','text','إعادة نشر المصدر.'),jsonb_build_object('id','c','text','استبدال المنهج الوطني.'))
end,'a',
case q.n when 1 then 'الفهم يبدأ بتحديد الفكرة أو المهارة في سياقها.' when 2 then 'التحليل والتطبيق يبرهنان على الفهم.' else 'ضاديوم يدعم المنهج الرسمي بمحتوى أصلي.' end,1
from tl cross join generate_series(1,3) q(n)
on conflict (lesson_id,question_order)
do update set question=excluded.question,question_type=excluded.question_type,options=excluded.options,correct_answer=excluded.correct_answer,
explanation=excluded.explanation,points=excluded.points,updated_at=now();

with tl as (
 select l.id,l.title from public.countries c join public.curricula cu on cu.country_id=c.id
 join public.grades g on g.curriculum_id=cu.id join public.units u on u.grade_id=g.id join public.lessons l on l.unit_id=u.id
 where c.code='DJ' and cu.name_ar='اللغة العربية — جيبوتي — Première — البرنامج الرسمي التفصيلي الموثق جزئيًا' and g.grade_number=11
)
insert into public.lesson_activities(lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,section,prompt,answer,is_required)
select tl.id,
case a.n when 1 then 'فهم الموضوع' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end,
case a.n when 1 then 'reading' when 2 then 'multiple_choice' else 'writing' end,
case a.n when 1 then 'حدد الفكرة أو المهارة الرئيسة في «'||tl.title||'».' when 2 then 'اختر مثالًا أو شاهدًا مناسبًا وفسر علاقته بالموضوع.' else 'اكتب استجابة قصيرة من صياغتك تطبق فيها ما تعلمته.' end,
jsonb_build_object('origin','DADYOOM_DJ_G11_OFFICIAL_PROGRAMME','officialTitle',tl.title),
a.n,5,true,case a.n when 1 then 'understanding' when 2 then 'analysis' else 'production' end,null,'{}'::jsonb,true
from tl cross join generate_series(1,3) a(n)
where not exists (
 select 1 from public.lesson_activities x where x.lesson_id=tl.id and x.activity_order=a.n
 and x.title=case a.n when 1 then 'فهم الموضوع' when 2 then 'تحليل وتطبيق' else 'إنتاج قصير' end
);
