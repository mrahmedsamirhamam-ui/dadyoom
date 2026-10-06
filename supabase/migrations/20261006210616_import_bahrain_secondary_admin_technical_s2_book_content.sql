-- Bahrain secondary Arabic semester-2 official-book content for:
-- 1) Administrative/technological-engineering track (Plan1, 2025-2026 S2)
-- 2) Technical/vocational track including vocational-training subcourses (Plan3, 2025-2026 S2)
--
-- Current 2026-2027 book guide confirms the corresponding books/codes remain in
-- the secondary catalog. The 2026-2027 semester-2 teaching plan is not published
-- as of the audit date, so every imported lesson is marked official-book-unscheduled.

do $$
declare
  v_country uuid;
  v_track uuid;
  v_curriculum uuid;
  v_grade uuid;
  v_unit uuid;
begin
  select id into v_country
  from public.countries
  where code='BH' and is_active=true
  limit 1;

  if v_country is null then
    raise exception 'BH_COUNTRY_NOT_FOUND';
  end if;

  ----------------------------------------------------------------------
  -- Administrative / technological-engineering track — S2 book content
  ----------------------------------------------------------------------
  insert into public.curricula(
    country_id,name_ar,name_en,academic_year,description,is_active
  )
  values(
    v_country,
    'اللغة العربية — المسار الإداري والتكنولوجي - الهندسي — الجزء الثاني (محتوى كتاب رسمي)',
    'Bahrain Arabic admin-tech-engineering S2 official-book content',
    '2026-2027',
    'محتوى كتب رسمية للجزء/الفصل الثاني. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026 (Plan1)، مع بقاء حالة الجدولة الحالية 2026-2027 غير منشورة.',
    true
  )
  on conflict(country_id,name_ar,academic_year)
  do update set description=excluded.description,is_active=true
  returning id into v_curriculum;

  -- Grade 10 / Arab 812
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الأول الثانوي','Grade 10',10,10,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=10,sort_order=10,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,
    'عرب 812 — اللغة العربية للمسار الإداري والتكنولوجي - الهندسي',
    'محتوى الجزء الثاني من الكتاب الرسمي؛ التفصيل مأخوذ من Plan1 للفصل الثاني 2025-2026 ولا يثبت جدولة 2026-2027.',
    1,1,2
  )
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 812 — محتوى كتاب رسمي للجزء الثاني؛ غير مثبت كجدول 2026-2027.',
         'مكوّن مثبت في المصدر الرسمي السابق للفصل الثاني، والكتاب/المقرر باقٍ في دليل الكتب الحالي. لا يُعرض باعتباره مجدولًا في 2026-2027 قبل نشر خطة الفصل الثاني.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan1.pdf',
         2,2,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'القراءة: الشباب بين الواقع والآمال','reading'),
    (2,'الظواهر اللغوية: الفعل المبني للمعلوم والفعل المبني للمجهول','grammar'),
    (3,'الإنتاج الكتابي: بناء الحوار الحجاجي','writing'),
    (4,'القراءة: «تحية للشباب» لأحمد رفيق المهدوي','reading'),
    (5,'الظواهر اللغوية: الخبر والإنشاء (1)','grammar'),
    (6,'التواصل الشفوي: حوار تفاعلي — العمل التطوعي','speaking'),
    (7,'القراءة: حُلم','reading'),
    (8,'الظواهر اللغوية: المجرد والمزيد','grammar'),
    (9,'التواصل الشفوي: حوار تفاعلي — علاقة الإنسان بالمكان','speaking'),
    (10,'القراءة: «من أعاجيب أهل مرو» للجاحظ','reading'),
    (11,'الظواهر البلاغية: التشبيه — أركانه وأنواعه','grammar'),
    (12,'الإنتاج الكتابي: تعليمات السلامة في الورشة','writing'),
    (13,'القراءة: «أعيتني فيك الحيلة» لابن عبد ربه','reading'),
    (14,'الظواهر اللغوية: الخبر والإنشاء (2)','grammar'),
    (15,'التواصل الشفوي: حوار تفاعلي — آداب الزيارة','speaking'),
    (16,'القراءة: من أخبار أبي دلامة','reading'),
    (17,'الظواهر اللغوية: كم الاستفهامية وكم الخبرية','grammar'),
    (18,'الإنتاج الكتابي: مهارة إبداء الرأي','writing')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  -- Grade 11 / Arab 814
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الثاني الثانوي','Grade 11',11,11,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=11,sort_order=11,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,'عرب 814 — اللغة العربية للمسار الإداري والتكنولوجي - الهندسي',
    'محتوى الجزء الثاني من الكتاب الرسمي؛ التفصيل من Plan1 للفصل الثاني 2025-2026.',
    1,1,2
  )
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 814 — محتوى كتاب رسمي للجزء الثاني؛ غير مثبت كجدول 2026-2027.',
         'مكوّن رسمي من كتاب الجزء الثاني وفق Plan1 السابق؛ لا يعني اعتماده ضمن جدول 2026-2027 قبل نشر الخطة.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan1.pdf',
         3,3,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'القراءة: شرف العمل','reading'),
    (2,'الظواهر اللغوية: أساليب التوكيد بالنفي وأداة الاستثناء','grammar'),
    (3,'الإنتاج الكتابي: كتابة تعليمات عن السلامة في الورشة','writing'),
    (4,'الحجاج بالسرد: «الطبع والتطبع» لابن عبد ربه','reading'),
    (5,'الظواهر البلاغية: التشبيه — أنواعه وأدواته ووظائفه','grammar'),
    (6,'القراءة: على أبواب الرحلة الأولى','reading'),
    (7,'الظواهر اللغوية: جزم الفعل المضارع بـ«لا» الناهية','grammar'),
    (8,'القراءة: الكنوز الضائعة','reading'),
    (9,'الظواهر اللغوية: طرائق التوكيد وهمزة القطع والوصل','grammar'),
    (10,'الحجاج بالسرد: «الفردية سوس ينخر المجتمع» لخليل هنداوي','reading'),
    (11,'القراءة: رسالة إلى ابني','reading'),
    (12,'الظواهر اللغوية: النعت والمنعوت','grammar'),
    (13,'الإنتاج الكتابي: مهارة التلخيص','writing')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  -- Grade 12 / Arab 816
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الثالث الثانوي','Grade 12',12,12,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=12,sort_order=12,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,'عرب 816 — اللغة العربية للمسار الإداري والتكنولوجي - الهندسي',
    'محتوى الجزء الثاني من الكتاب الرسمي؛ التفصيل من Plan1 للفصل الثاني 2025-2026.',
    1,1,2
  )
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 816 — محتوى كتاب رسمي للجزء الثاني؛ غير مثبت كجدول 2026-2027.',
         'مكوّن رسمي من كتاب الجزء الثاني وفق Plan1 السابق؛ لا يعني اعتماده ضمن جدول 2026-2027 قبل نشر الخطة.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan1.pdf',
         4,4,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'القراءة: رحلة إلى البحرين','reading'),
    (2,'الظواهر اللغوية: تطبيق على أسلوب التفضيل','grammar'),
    (3,'الإنتاج الكتابي: كتابة التقرير وفق بيانات','writing'),
    (4,'التعليق الصحفي: «حديث في الحداثة» لقمر الكيلاني','reading'),
    (5,'القراءة: منظر الرياض','reading'),
    (6,'الظواهر اللغوية: النداء والتمني','grammar'),
    (7,'التعقيب الصحفي: «اللغة العربية والفكر والعلم» لأدونيس','reading'),
    (8,'الإنتاج الكتابي: المقالة الأدبية','writing'),
    (9,'القراءة: يموت الهوى مني','reading'),
    (10,'الظواهر اللغوية: بناء الفعل للمجهول','grammar'),
    (11,'القراءة: «أغنية السعادة» لجبران خليل جبران','reading'),
    (12,'الظواهر اللغوية: معاني حروف الجر','grammar')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  select id into v_track
  from public.secondary_tracks
  where country_code='BH'
    and academic_year='2026-2027'
    and track_name_ar='المسار الإداري والتكنولوجي - الهندسي'
    and is_active=true
  limit 1;

  if v_track is null then raise exception 'BH_ADMIN_TECH_TRACK_NOT_FOUND'; end if;

  insert into public.secondary_track_curricula(
    secondary_track_id,curriculum_id,relation_type,is_default,notes
  )
  values(
    v_track,v_curriculum,'track-specific',false,
    'محتوى الجزء الثاني من كتب رسمية حالية، مفصّل بالاستناد إلى Plan1 للفصل الثاني 2025-2026؛ الجدولة الحالية 2026-2027 لم تُنشر بعد.'
  )
  on conflict(secondary_track_id,curriculum_id)
  do update set relation_type='track-specific',is_default=false,notes=excluded.notes;

  insert into public.secondary_track_units(
    secondary_track_id,unit_id,relation_type,notes
  )
  select v_track,u.id,'track-specific',
         'وحدة محتوى كتاب رسمي للجزء الثاني؛ غير مجدولة حاليًا. المصدر التفصيلي: Plan1 2025-2026 S2.'
  from public.units u
  join public.grades g on g.id=u.grade_id
  where g.curriculum_id=v_curriculum
  on conflict(secondary_track_id,unit_id)
  do update set relation_type='track-specific',notes=excluded.notes;

  update public.secondary_track_grade_terms
  set detail_status='partial-imported',
      source_url='https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan1.pdf',
      audited_at=current_date,
      notes='الجدول الرسمي للفصل الثاني 2026-2027 غير منشور. أُضيف محتوى الكتاب الرسمي اعتمادًا على استمرار الكتب الحالية وخريطة Plan1 الرسمية للفصل الثاني 2025-2026.',
      updated_at=now()
  where secondary_track_id=v_track
    and academic_year='2026-2027'
    and semester=2
    and grade_number in (10,11,12)
    and publication_status='not-published-as-of-audit';

  update public.secondary_track_terms
  set detail_status='partial-imported',
      source_url='https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan1.pdf',
      audited_at=current_date,
      notes='الجدول الرسمي للفصل الثاني 2026-2027 غير منشور؛ أُضيفت فقط مكوّنات الكتب الرسمية غير المجدولة.',
      updated_at=now()
  where secondary_track_id=v_track
    and academic_year='2026-2027'
    and semester=2
    and publication_status='not-published-as-of-audit';

  ----------------------------------------------------------------------
  -- Technical / vocational track — S2 book content + training subcourses
  ----------------------------------------------------------------------
  insert into public.curricula(
    country_id,name_ar,name_en,academic_year,description,is_active
  )
  values(
    v_country,
    'اللغة العربية — التعليم الفني والمهني — الجزء الثاني (محتوى كتاب رسمي)',
    'Bahrain Arabic technical-vocational S2 official-book content',
    '2026-2027',
    'محتوى كتب رسمية للجزء/الفصل الثاني. خريطة التفصيل من خطة الوزارة للفصل الثاني 2025-2026 (Plan3)، وتشمل مساقات عرب 802/804/806 ومساقات التدريب المهني 502/504 حيث تنطبق.',
    true
  )
  on conflict(country_id,name_ar,academic_year)
  do update set description=excluded.description,is_active=true
  returning id into v_curriculum;

  -- Grade 10 / Arab 802
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الأول الثانوي','Grade 10',10,10,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=10,sort_order=10,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 802 — اللغة العربية للتعليم الفني والمهني','المقرر الرئيسي للجزء الثاني وفق Plan3 السابق.',1,1,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 802 — محتوى كتاب رسمي للجزء الثاني؛ غير مثبت كجدول 2026-2027.',
         'مكوّن رسمي من الكتاب وفق Plan3 للفصل الثاني 2025-2026؛ لا يعني جدولة 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan3.pdf',
         2,2,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'القراءة: الشباب بين الواقع والآمال','reading'),
    (2,'الظواهر اللغوية: الفعل المبني للمعلوم والفعل المبني للمجهول','grammar'),
    (3,'الإنتاج الكتابي: بناء الحوار الحجاجي','writing'),
    (4,'القراءة: «تحية للشباب» لأحمد رفيق المهدوي','reading'),
    (5,'الظواهر اللغوية: الخبر والإنشاء (1)','grammar'),
    (6,'التواصل الشفوي: حوار تفاعلي — العمل التطوعي','speaking'),
    (7,'القراءة: «من أعاجيب أهل مرو» للجاحظ','reading'),
    (8,'الظواهر البلاغية: التشبيه — أركانه وأنواعه','grammar'),
    (9,'الإنتاج الكتابي: تعليمات السلامة في الورشة','writing'),
    (10,'القراءة: «أعيتني فيك الحيلة» لابن عبد ربه','reading'),
    (11,'الظواهر اللغوية: الخبر والإنشاء (2)','grammar'),
    (12,'التواصل الشفوي: حوار تفاعلي — آداب الزيارة','speaking')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  -- Grade 10 / Arab 502 vocational training
  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 502 — التدريب المهني / السنة الأولى','مساق التدريب المهني الصناعي للجزء الثاني وفق Plan3.',2,2,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 502 — تدريب مهني؛ محتوى كتاب رسمي للجزء الثاني.',
         'مكوّن مثبت في خطة Plan3 السابقة، مع بقاء جدولة 2026-2027 للفصل الثاني غير منشورة.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan3.pdf',
         5,5,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'القراءة: بلادك يا ولدي','reading'),
    (2,'الظواهر اللغوية: إعراب المضارع','grammar'),
    (3,'القراءة: السيد المطاع','reading'),
    (4,'الظواهر اللغوية: بعض الجموع والاسم والفعل والحرف','grammar'),
    (5,'الإنتاج الكتابي: إنتاج نص في حدود 10 أسطر / 120 كلمة','writing'),
    (6,'القراءة: ما أشبه العمل بالصلاة','reading'),
    (7,'الظواهر اللغوية: الجمع والمفرد والترادف والتضاد','grammar'),
    (8,'القراءة: الحديث النبوي الشريف','reading'),
    (9,'الظواهر اللغوية: الاستفهام والنداء ورسم الهمزة وفك الإدغام في الفعل الماضي','grammar'),
    (10,'الإنتاج الكتابي: إنتاج نص في حدود 10 أسطر / 120 كلمة — تدريب ثانٍ','writing'),
    (11,'القراءة: إلى الشباب','reading'),
    (12,'الظواهر اللغوية: غرض النداء وغرض الاستفهام والألف الفارقة','grammar')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  -- Grade 11 / Arab 804 + Arab 504
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الثاني الثانوي','Grade 11',11,11,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=11,sort_order=11,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 804 — اللغة العربية للتعليم الفني والمهني','المقرر الرئيسي للجزء الثاني وفق Plan3 السابق.',1,1,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 804 — محتوى كتاب رسمي للجزء الثاني.',
         'مكوّن رسمي وفق Plan3 للفصل الثاني 2025-2026؛ لا يعني جدولة 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan3.pdf',
         3,3,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'القراءة: شرف العمل','reading'),
    (2,'الظواهر اللغوية: أساليب التوكيد بالنفي وأداة الاستثناء','grammar'),
    (3,'الإنتاج الكتابي: كتابة تعليمات عن السلامة في الورشة','writing'),
    (4,'الحجاج بالسرد: «الطبع والتطبع» لابن عبد ربه','reading'),
    (5,'القراءة: على أبواب الرحلة الأولى','reading'),
    (6,'الظواهر اللغوية: جزم الفعل المضارع بـ«لا» الناهية','grammar'),
    (7,'الحجاج بالسرد: «الفردية سوس ينخر المجتمع» لخليل هنداوي','reading'),
    (8,'القراءة: رسالة إلى ابني','reading'),
    (9,'الظواهر اللغوية: النعت والمنعوت','grammar'),
    (10,'الإنتاج الكتابي: مهارة التلخيص','writing')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 504 — التدريب المهني / السنة الثانية','مساق التدريب المهني الصناعي للجزء الثاني وفق Plan3.',2,2,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 504 — تدريب مهني؛ محتوى كتاب رسمي للجزء الثاني.',
         'مكوّن مثبت في خطة Plan3 السابقة، مع بقاء جدولة 2026-2027 للفصل الثاني غير منشورة.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan3.pdf',
         6,6,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'القراءة: أوقات الفراغ','reading'),
    (2,'الظواهر اللغوية: استخدام إذا والاستفهام بعد حرف الجر وركنا الجملة الاسمية والفعلية وظواهر إملائية','grammar'),
    (3,'القراءة: الخفافيش والرادار','reading'),
    (4,'الظواهر اللغوية: الفاعل وتحويل الجملة الاسمية إلى فعلية والفعلية إلى اسمية','grammar'),
    (5,'الإنتاج الكتابي: إنتاج نص في حدود 10 أسطر / 120 كلمة','writing'),
    (6,'القراءة: من وصايا الآباء للأبناء','reading'),
    (7,'الظواهر اللغوية: الأمر والنهي ورسم الهمزة (1) ولام الأمر','grammar'),
    (8,'القراءة: التواضع','reading'),
    (9,'الظواهر اللغوية: المفرد والجمع ولام الأمر ورسم الهمزة (2)','grammar'),
    (10,'الإنتاج الكتابي: إنتاج نص في حدود 10 أسطر / 120 كلمة — تدريب ثانٍ','writing')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  -- Grade 12 / Arab 806
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الثالث الثانوي','Grade 12',12,12,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=12,sort_order=12,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 806 — اللغة العربية للتعليم الفني والمهني','المقرر الرئيسي للجزء الثاني وفق Plan3 السابق.',1,1,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 806 — محتوى كتاب رسمي للجزء الثاني.',
         'مكوّن رسمي وفق Plan3 للفصل الثاني 2025-2026؛ لا يعني جدولة 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan3.pdf',
         4,4,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'القراءة: رحلة إلى البحرين','reading'),
    (2,'الظواهر اللغوية: تطبيق على أسلوب التفضيل','grammar'),
    (3,'الإنتاج الكتابي: كتابة التقرير وفق بيانات','writing'),
    (4,'التعليق الصحفي: «حديث في الحداثة» لقمر الكيلاني','reading'),
    (5,'القراءة: منظر الرياض','reading'),
    (6,'الظواهر اللغوية: أسلوب النداء وأسلوب التمني','grammar'),
    (7,'التعقيب الصحفي: «اللغة العربية والفكر والعلم» لأدونيس','reading'),
    (8,'الإنتاج الكتابي: المقالة الأدبية','writing'),
    (9,'القراءة: يموت الهوى مني','reading'),
    (10,'الظواهر اللغوية: بناء الفعل للمجهول','grammar')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  select id into v_track
  from public.secondary_tracks
  where country_code='BH'
    and academic_year='2026-2027'
    and track_name_ar='التعليم الفني والمهني'
    and is_active=true
  limit 1;

  if v_track is null then raise exception 'BH_TECHNICAL_TRACK_NOT_FOUND'; end if;

  insert into public.secondary_track_curricula(
    secondary_track_id,curriculum_id,relation_type,is_default,notes
  )
  values(
    v_track,v_curriculum,'track-specific',false,
    'محتوى الجزء الثاني من الكتب الرسمية الحالية، مفصّل بالاستناد إلى Plan3 للفصل الثاني 2025-2026؛ لا توجد خطة فصل ثانٍ 2026-2027 منشورة بعد.'
  )
  on conflict(secondary_track_id,curriculum_id)
  do update set relation_type='track-specific',is_default=false,notes=excluded.notes;

  insert into public.secondary_track_units(
    secondary_track_id,unit_id,relation_type,notes
  )
  select v_track,u.id,'track-specific',
         'وحدة محتوى كتاب رسمي للجزء الثاني؛ غير مجدولة حاليًا. المصدر التفصيلي: Plan3 2025-2026 S2.'
  from public.units u
  join public.grades g on g.id=u.grade_id
  where g.curriculum_id=v_curriculum
  on conflict(secondary_track_id,unit_id)
  do update set relation_type='track-specific',notes=excluded.notes;

  update public.secondary_track_grade_terms
  set detail_status='partial-imported',
      source_url='https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan3.pdf',
      audited_at=current_date,
      notes='الجدول الرسمي للفصل الثاني 2026-2027 غير منشور. أُضيف محتوى الكتب الرسمية، بما في ذلك مساقات التدريب المهني حيث تنطبق، اعتمادًا على Plan3 الرسمي للفصل الثاني 2025-2026.',
      updated_at=now()
  where secondary_track_id=v_track
    and academic_year='2026-2027'
    and semester=2
    and grade_number in (10,11,12)
    and publication_status='not-published-as-of-audit';

  update public.secondary_track_terms
  set detail_status='partial-imported',
      source_url='https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan3.pdf',
      audited_at=current_date,
      notes='الجدول الرسمي للفصل الثاني 2026-2027 غير منشور؛ أُضيفت مكوّنات الكتب الرسمية غير المجدولة.',
      updated_at=now()
  where secondary_track_id=v_track
    and academic_year='2026-2027'
    and semester=2
    and publication_status='not-published-as-of-audit';
end $$;
