-- Bahrain religious secondary Arabic — semester-2 official-book content.
-- Current 2026-2027 religious book catalog (books3.pdf) confirms the relevant
-- Ibn Aqil / morphology / rhetoric / literature books remain prescribed.
-- Detailed lesson map comes from the official 2025-2026 S2 Plan2.
-- The 2026-2027 S2 teaching plan is still unpublished, so lessons are
-- official-book-unscheduled and publication_status remains unchanged.

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
  if v_country is null then raise exception 'BH_COUNTRY_NOT_FOUND'; end if;

  insert into public.curricula(
    country_id,name_ar,name_en,academic_year,description,is_active
  )
  values(
    v_country,
    'اللغة العربية — التعليم الديني — الجزء الثاني (محتوى كتاب رسمي)',
    'Bahrain religious Arabic S2 official-book content',
    '2026-2027',
    'محتوى كتب اللغة العربية التخصصية للتعليم الديني للجزء الثاني. الكتب مثبتة في قائمة 2026-2027، وخريطة الدروس من Plan2 الرسمي للفصل الثاني 2025-2026. لا يعني ذلك نشر جدول الفصل الثاني 2026-2027.',
    true
  )
  on conflict(country_id,name_ar,academic_year)
  do update set description=excluded.description,is_active=true
  returning id into v_curriculum;

  --------------------------------------------------------------------
  -- Grade 10: Nahw 112 + Adab 112
  --------------------------------------------------------------------
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الأول الثانوي','Grade 10',10,10,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=10,sort_order=10,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,
    'نحو 112 — شرح ابن عقيل والصرف الميسر وأسرار البيان',
    'مقرر ديني رسمي للجزء الثاني وفق Plan2؛ الكتب مستمرة في قائمة الكتب 2026-2027.',
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
  select v_unit,x.title,x.n,x.n,'grammar',
         'نحو 112 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan2 للفصل الثاني 2025-2026، والكتب ذات الصلة مثبتة في دليل التعليم الديني 2026-2027. لا يُعرض كجدول حالي حتى نشر خطة S2.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
         2,2,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'النحو: مواضع الابتداء بالنكرة'),
    (2,'الصرف: اسم الآلة'),
    (3,'الصرف: صيغ المبالغة'),
    (4,'النحو: أفعال المقاربة — أحكامها وشروطها واقتران خبرها بأن'),
    (5,'البلاغة: الاستعارة التصريحية والمكنية'),
    (6,'النحو: لا النافية للجنس — عملها وشروطها وأحوال اسمها'),
    (7,'الصرف: اسما الزمان والمكان'),
    (8,'الصرف: أسلوب التعجب'),
    (9,'النحو: ظن وأخواتها'),
    (10,'الصرف: أسلوب التفضيل'),
    (11,'البلاغة: الكناية')
  ) as x(n,title)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,
    'أدب 112 — الأدب والنصوص',
    'مقرر ديني رسمي للجزء الثاني وفق Plan2؛ الكتاب مستمر في قائمة 2026-2027.',
    2,2,2
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
         'أدب 112 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan2 للفصل الثاني 2025-2026، والكتاب مثبت في دليل التعليم الديني 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
         3,3,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'الأدب الإسلامي وخصائصه — الفترة الأولى','reading'),
    (2,'الأدب الإسلامي وخصائصه — الفترة الثانية','reading'),
    (3,'«قصة كرم» للحطيئة','reading'),
    (4,'العروض: البحر الكامل وتدريبات عليه','grammar'),
    (5,'من الهدي النبوي','reading'),
    (6,'ترجمة الإمام علي بن أبي طالب رضي الله عنه','reading'),
    (7,'«تهديد ووعيد» لحسان بن ثابت','reading'),
    (8,'العروض: البحر المتقارب وتدريبات عليه','grammar'),
    (9,'«من أين لك هذا؟» للفاروق عمر بن الخطاب رضي الله عنه','reading')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  --------------------------------------------------------------------
  -- Grade 11: Adab 212 + Qira'a 212 + Nahw 212
  --------------------------------------------------------------------
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الثاني الثانوي','Grade 11',11,11,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=11,sort_order=11,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'أدب 212 — الأدب والنصوص','مقرر ديني رسمي للجزء الثاني وفق Plan2.',1,1,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'أدب 212 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan2 للفصل الثاني 2025-2026، والكتاب مثبت في دليل التعليم الديني 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
         4,4,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'العصر الأندلسي','reading'),
    (2,'خصائص الأدب الأندلسي','reading'),
    (3,'فنون النثر الأندلسي','reading'),
    (4,'أغراض الشعر الأندلسي','reading'),
    (5,'معاني الشعر وأخيلته وألفاظه وعباراته وأوزانه وقافيته','reading'),
    (6,'«حنين وشوق» لابن زيدون','reading'),
    (7,'العروض: البحر الطويل وتدريبات عليه','grammar'),
    (8,'«أدب المجالس» لابن حزم','reading'),
    (9,'ترجمة ابن خفاجة','reading'),
    (10,'«من رثاء الممالك الزائلة» لابن عبدون','reading'),
    (11,'العروض: البحر المديد وتدريبات عليه','grammar'),
    (12,'من الرسائل الجدية لابن زيدون','reading')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,
    'قرأ 212 — عرب 202: الأدب والحياة',
    'مقرر القراءة للتعليم الديني باستخدام عرب 202، وفق Plan2.',
    2,2,2
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
         'قرأ 212 — محتوى قراءة رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan2 للفصل الثاني 2025-2026، ومادة عرب 202/قرأ 212 موجودة ضمن الكتب الحالية.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
         5,5,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'«الطبع والتطبع» — ابن عبد ربه','reading'),
    (2,'الإنتاج الكتابي: إنتاج نص حجاجي مغتنٍ بالسرد','writing'),
    (3,'«أهمية المشورة» — الأبشيهي','reading'),
    (4,'«الوطنية» — محمد عبده','reading'),
    (5,'الإنتاج الكتابي: إنتاج نص حجاجي مغتنٍ بالوصف','writing'),
    (6,'رسالة الأمين إلى المأمون — الطبري','reading'),
    (7,'«الفردية سوس ينخر المجتمع» — خليل هنداوي','reading')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,
    'نحو 212 — شرح ابن عقيل وتيسير الصرف والمنار',
    'مقرر ديني رسمي للجزء الثاني وفق Plan2.',
    3,3,2
  )
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,'grammar',
         'نحو 212 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan2 للفصل الثاني 2025-2026، والكتب ذات الصلة مثبتة في دليل التعليم الديني 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
         6,6,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'النحو: الاستثناء بإلا وأحكامه'),
    (2,'النحو: الاستثناء بغير وسوى'),
    (3,'النحو: الاستثناء بخلا وعدا'),
    (4,'الصرف: التصغير'),
    (5,'البلاغة: القصر'),
    (6,'البلاغة: طرق القصر'),
    (7,'النحو: الحال'),
    (8,'النحو: تعدد الحال وصاحبها'),
    (9,'النحو: مجيء الحال جملة'),
    (10,'النحو: أحكام الجملة الواقعة حالًا من حيث الربط بالواو أو الضمير'),
    (11,'الصرف: النسب'),
    (12,'الصرف: النسب إلى فعيل وفعيلة'),
    (13,'البلاغة: الجناس التام وغير التام'),
    (14,'النحو: التمييز'),
    (15,'البلاغة: السجع')
  ) as x(n,title)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  --------------------------------------------------------------------
  -- Grade 12: Nahw 312 + Adab 312
  --------------------------------------------------------------------
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الثالث الثانوي','Grade 12',12,12,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=12,sort_order=12,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,
    'نحو 312 — شرح ابن عقيل والصرف الميسر ج3 ومفتاح البلاغة',
    'مقرر ديني رسمي للجزء الثاني وفق Plan2.',
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
  select v_unit,x.title,x.n,x.n,'grammar',
         'نحو 312 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan2 للفصل الثاني 2025-2026، والكتب ذات الصلة مثبتة في دليل التعليم الديني 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
         7,7,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'النحو: الممنوع من الصرف'),
    (2,'الصرف: إبدال الواو والياء تاء'),
    (3,'الصرف: إبدال التاء طاء'),
    (4,'الصرف: إبدال التاء دالًا'),
    (5,'البلاغة: الإيجاز والإطناب والمساواة'),
    (6,'النحو: إعراب الفعل'),
    (7,'الصرف: الإعلال بالنقل'),
    (8,'الصرف: الإعلال بالحذف'),
    (9,'البلاغة: الطباق'),
    (10,'البلاغة: المقابلة'),
    (11,'النحو: العدد'),
    (12,'الصرف: الإدغام الواجب والجائز'),
    (13,'البلاغة: التورية'),
    (14,'البلاغة: تأكيد المدح بما يشبه الذم وعكسه')
  ) as x(n,title)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(
    v_grade,
    'أدب 312 — الأدب والنصوص',
    'مقرر ديني رسمي للجزء الثاني وفق Plan2.',
    2,2,2
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
         'أدب 312 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan2 للفصل الثاني 2025-2026، والكتاب مثبت في دليل التعليم الديني 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
         8,8,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'تطور النثر وخصائصه: حركة التطور وتطور فنون النثر','reading'),
    (2,'الأدب واليقظة القومية','reading'),
    (3,'الأدب والحياة الاجتماعية','reading'),
    (4,'الأدب والحياة السياسية','reading'),
    (5,'الأجناس الأدبية في الشعر','reading'),
    (6,'«قيود» للشاعر عمر أبي ريشة','reading'),
    (7,'العروض: القافية — تعريفها وحروفها وأنواعها وعيوبها','grammar'),
    (8,'«هذه بعض سماتنا» لزكي نجيب محمود','reading'),
    (9,'«وامعتصماه» للشاعر إبراهيم العريض','reading'),
    (10,'ترجمة إبراهيم المازني','reading'),
    (11,'«رسالة من تجاربي» لأحمد أمين','reading'),
    (12,'العروض: تدريبات على القافية','grammar')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  --------------------------------------------------------------------
  -- Link religious-specific curriculum to religious track.
  --------------------------------------------------------------------
  select id into v_track
  from public.secondary_tracks
  where country_code='BH'
    and academic_year='2026-2027'
    and track_name_ar='التعليم الديني'
    and is_active=true
  limit 1;

  if v_track is null then raise exception 'BH_RELIGIOUS_TRACK_NOT_FOUND'; end if;

  insert into public.secondary_track_curricula(
    secondary_track_id,curriculum_id,relation_type,is_default,notes
  )
  values(
    v_track,v_curriculum,'track-specific',false,
    'محتوى كتب دينية رسمية للجزء الثاني، مفصل من Plan2 S2 2025-2026. المقرران المشتركان عرب 102 وعرب 311 مرتبطان من Curriculum توحيد المسارات.'
  )
  on conflict(secondary_track_id,curriculum_id)
  do update set relation_type='track-specific',is_default=false,notes=excluded.notes;

  insert into public.secondary_track_units(
    secondary_track_id,unit_id,relation_type,notes
  )
  select v_track,u.id,'track-specific',
         'وحدة دينية رسمية من كتاب الجزء الثاني؛ غير مجدولة حاليًا. المصدر التفصيلي Plan2 S2 2025-2026.'
  from public.units u
  join public.grades g on g.id=u.grade_id
  where g.curriculum_id=v_curriculum
  on conflict(secondary_track_id,unit_id)
  do update set relation_type='track-specific',notes=excluded.notes;

  update public.secondary_track_grade_terms
  set detail_status='partial-imported',
      source_url='https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
      audited_at=current_date,
      notes='خطة S2 2026-2027 غير منشورة. أُضيف محتوى الكتب الدينية الرسمية الحالية من Plan2 السابق، مع المقررات المشتركة عرب 102 وعرب 311 المرتبطة من Plan4.',
      updated_at=now()
  where secondary_track_id=v_track
    and academic_year='2026-2027'
    and semester=2
    and grade_number in (10,11,12)
    and publication_status='not-published-as-of-audit';

  update public.secondary_track_terms
  set detail_status='partial-imported',
      source_url='https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan2.pdf',
      audited_at=current_date,
      notes='خطة S2 2026-2027 غير منشورة؛ أضيفت مكونات الكتب الدينية الرسمية غير المجدولة، مع روابط المقررات المشتركة من Plan4.',
      updated_at=now()
  where secondary_track_id=v_track
    and academic_year='2026-2027'
    and semester=2
    and publication_status='not-published-as-of-audit';
end $$;
