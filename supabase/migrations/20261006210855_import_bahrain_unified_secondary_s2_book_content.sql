-- Bahrain unified secondary path — official semester-2 book content.
-- Current 2026-2027 book catalogs confirm these Arabic books/codes remain active.
-- Detailed lesson map comes from the official 2025-2026 S2 Plan4.
-- Current 2026-2027 S2 scheduling remains unpublished; lessons are therefore
-- marked official-book-unscheduled and term publication_status is preserved.

do $$
declare
  v_country uuid;
  v_track uuid;
  v_religious_track uuid;
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
    'اللغة العربية — توحيد المسارات — الجزء الثاني (محتوى كتاب رسمي)',
    'Bahrain unified Arabic S2 official-book content',
    '2026-2027',
    'محتوى كتب عربية رسمية للجزء الثاني. الكتب/المقررات مثبتة في دليل 2026-2027، وخريطة الدروس من Plan4 الرسمي للفصل الثاني 2025-2026. لا يعني ذلك نشر جدول الفصل الثاني 2026-2027.',
    true
  )
  on conflict(country_id,name_ar,academic_year)
  do update set description=excluded.description,is_active=true
  returning id into v_curriculum;

  --------------------------------------------------------------------
  -- Grade 10 — Arab 102
  --------------------------------------------------------------------
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الأول الثانوي','Grade 10',10,10,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=10,sort_order=10,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 102 — من فنون الأدب','مقرر مشترك في الجزء الثاني؛ تفاصيله من Plan4 S2 2025-2026.',1,1,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 102 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan4 للفصل الثاني 2025-2026، والكتاب باقٍ في دليل 2026-2027. لا يُعرض باعتباره مجدولًا حاليًا قبل نشر خطة الفصل الثاني 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
         2,2,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'الطبيعة في الشعر العربي: «وقور على ظهر الفلاة» لابن خفاجة','reading'),
    (2,'القضايا الصرفية: الميزان الصرفي','grammar'),
    (3,'القضايا الصرفية: الجامد والمشتق','grammar'),
    (4,'الإنتاج الكتابي: إنتاج نص سردي','writing'),
    (5,'قصيدة الغزل: «وهل يخفى القمر» لعمر بن أبي ربيعة','reading'),
    (6,'القضايا الصرفية: المصدر','grammar'),
    (7,'القضايا الصرفية: اسم الفاعل','grammar'),
    (8,'القضايا الصرفية: الصفة المشبهة باسم الفاعل','grammar'),
    (9,'الإنتاج الكتابي: إنتاج نص وصفي','writing'),
    (10,'النادرة الأدبية: «الولد سر أبيه» للجاحظ','reading'),
    (11,'القضايا الصرفية: اسم المفعول','grammar'),
    (12,'فن المقامة: «المقامة البغدادية» لبديع الزمان الهمذاني','reading'),
    (13,'القضايا الصرفية: صيغ المبالغة','grammar'),
    (14,'القصة القصيرة: «تحت سماء المدينة» لمحمد عبد الملك','reading'),
    (15,'الإنتاج الكتابي: إنتاج نص سردي مغتنٍ بالوصف','writing')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  --------------------------------------------------------------------
  -- Grade 11 — Arab 202 + elective Arab 214
  --------------------------------------------------------------------
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الثاني الثانوي','Grade 11',11,11,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=11,sort_order=11,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 202 — الأدب والحياة','المقرر المشترك للجزء الثاني وفق Plan4.',1,1,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 202 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan4 للفصل الثاني 2025-2026، والكتاب باقٍ في دليل 2026-2027؛ الجدولة الحالية غير منشورة.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
         3,3,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'أهمية المشورة — الأبشيهي','reading'),
    (2,'التشبيه: أنواعه وأدواته ووظائفه','grammar'),
    (3,'الحقيقة والمجاز','grammar'),
    (4,'الوطنية — محمد عبده','reading'),
    (5,'الإنتاج الكتابي: إنتاج نص حجاجي مغتنٍ بالسرد — إنتاج جزئي وكامل','writing'),
    (6,'الاستعارة: أنواعها وأركانها','grammar'),
    (7,'رسالة الأمين إلى المأمون — الطبري','reading'),
    (8,'المجاز المرسل','grammar'),
    (9,'في الكلام على أهل باريس — رفاعة الطهطاوي','reading'),
    (10,'الإنتاج الكتابي: إنتاج نص حجاجي مغتنٍ بالوصف — إنتاج جزئي وكامل','writing'),
    (11,'الكناية','grammar'),
    (12,'الجناس والسجع','grammar'),
    (13,'الطباق والمقابلة','grammar')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 214 — الأدب والحضارة في العصر العباسي والأندلسي (اختياري أساسي)','مقرر اختياري رسمي، الجزء الثاني وفق Plan4.',2,2,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 214 — مقرر اختياري رسمي.',
         'المكوّن مثبت في Plan4 للفصل الثاني 2025-2026، والمقرر موجود في دليل الكتب 2026-2027. لا يعني جدولة حالية قبل نشر خطة S2.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
         5,5,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'الأدب وتطور الحياة الاجتماعية في العصر العباسي','reading'),
    (2,'وصف بركة المتوكل — البحتري','reading'),
    (3,'التجديد في الأغراض الشعرية: «أتوك يجرون الحديد» للمتنبي','reading'),
    (4,'التجديد في النثر: المقامة الموصلية للهمذاني','reading'),
    (5,'الإنتاج الكتابي: مقالان حول مظاهر الرقي الحضاري في الأدب العباسي','writing'),
    (6,'إعداد الورقة البحثية: العصر العباسي','writing'),
    (7,'الأدب وتطور الحياة الاجتماعية في العصر الأندلسي','reading'),
    (8,'مدينة الزاهرة — ابن هذيل','reading'),
    (9,'الأدب والنهضة الفكرية في العصر الأندلسي','reading'),
    (10,'من قصة «حي بن يقظان» لابن طفيل','reading'),
    (11,'التجديد في الشعر الأندلسي: موشح «جادك الغيث» للسان الدين ابن الخطيب','reading'),
    (12,'الإنتاج الكتابي: مقالان حول مظاهر الرقي الحضاري في الأدب الأندلسي','writing'),
    (13,'إعداد الورقة البحثية: العصر الأندلسي','writing')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  --------------------------------------------------------------------
  -- Grade 12 — Arab 302 + elective Arab 222 + elective Arab 311
  --------------------------------------------------------------------
  insert into public.grades(curriculum_id,name_ar,name_en,grade_number,sort_order,is_active)
  values(v_curriculum,'الثالث الثانوي','Grade 12',12,12,true)
  on conflict(curriculum_id,name_ar)
  do update set grade_number=12,sort_order=12,is_active=true
  returning id into v_grade;

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 302 — النص على النص','المقرر المشترك للجزء الثاني وفق Plan4.',1,1,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 302 — محتوى كتاب رسمي للجزء الثاني.',
         'المكوّن مثبت في Plan4 للفصل الثاني 2025-2026، والكتاب باقٍ في دليل 2026-2027؛ الجدولة الحالية غير منشورة.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
         4,4,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'شرح بيتين للمتنبي','reading'),
    (2,'دلالات المركبات','grammar'),
    (3,'حروف الجر ومعانيها: من، إلى، عن، على، في، الباء، الكاف، اللام','grammar'),
    (4,'الإنتاج الكتابي: الشرح والتحليل — مقال أدبي في شرح نص قصير وتحليله','writing'),
    (5,'التعليق الصحفي: «حديث في الحداثة» لقمر الكيلاني','reading'),
    (6,'التعقيب الصحفي: «جودة الأدب ومصير المطالعة»','reading'),
    (7,'العدد والمعدود','grammar'),
    (8,'«اللغة العربية والفكر والعلم» لأدونيس','reading'),
    (9,'الإنتاج الكتابي: كتابة تعليق صحفي انطلاقًا من خبر أو مقال أو قضية','writing'),
    (10,'الأفعال الناسخة: معانيها ودلالاتها','grammar'),
    (11,'الحروف الناسخة: معانيها ودلالاتها','grammar'),
    (12,'الممنوع من الصرف','grammar'),
    (13,'قراءة أثر متكامل: «الأيام» لطه حسين — الجزء الأول','reading')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 222 — الأدب العربي الحديث: المدرسة الواقعية (اختياري أساسي)','مقرر اختياري رسمي وفق Plan4.',2,2,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 222 — مقرر اختياري رسمي.',
         'المكوّن مثبت في Plan4 للفصل الثاني 2025-2026، والمقرر موجود في دليل الكتب 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
         6,6,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'التيار الواقعي — الشعر: «ردي علي عواطفي» لإلياس قنصل','reading'),
    (2,'التيار الواقعي — الشعر: «الكوكب الأرضي» لفدوى طوقان','reading'),
    (3,'الإنتاج الكتابي: المقال الأدبي — إنتاج جزئي وإنتاج كامل','writing'),
    (4,'التيار الواقعي — القصة القصيرة: «الضحك في آخر الليل» لعبد الله عبد','reading'),
    (5,'التيار الواقعي — المسرح: «النائبة المحترمة» لتوفيق الحكيم','reading'),
    (6,'الواقعية الجديدة — الرواية العربية الحديثة: «دواء المتقدم في السن» لنجيب محفوظ','reading'),
    (7,'الإنتاج الكتابي: القصة القصيرة — إنتاج جزئي وإنتاج كامل','writing'),
    (8,'شعر الواقعية الجديدة: «احتجاج العائد من رحلة الخوف» لعبد العزيز المقالح','reading')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  insert into public.units(grade_id,title,description,unit_number,sort_order,semester)
  values(v_grade,'عرب 311 — من الأدب العالمي (اختياري)','مقرر اختياري مشترك مع التعليم الديني وفق Plan4.',3,3,2)
  on conflict(grade_id,unit_number)
  do update set title=excluded.title,description=excluded.description,semester=2
  returning id into v_unit;

  insert into public.lessons(
    unit_id,title,lesson_number,sort_order,lesson_type,summary,content,
    source_pdf_url,source_page_start,source_page_end,status,is_free,estimated_minutes,
    semester,official_content_scope
  )
  select v_unit,x.title,x.n,x.n,x.kind,
         'عرب 311 — مقرر اختياري رسمي مشترك.',
         'المكوّن مثبت في Plan4 للفصل الثاني 2025-2026، والمقرر موجود في دليل الكتب 2026-2027.',
         'https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
         7,7,'published',true,45,2,'official-book-unscheduled'
  from (values
    (1,'أثر «كليلة ودمنة» في خرافات لافونتين','reading'),
    (2,'الإنتاج الكتابي: مقال أدبي في تأثير الأدب العربي القديم في الأدب العالمي والدراسة المقارنة','writing'),
    (3,'أثر المقامة في الأدب البيكاريسكي','reading'),
    (4,'دراسة مقارنة بين «الأرض الخراب» و«أنشودة المطر»','reading'),
    (5,'«مرثية نواح للشروق الجديد» — إيديث سيتول','reading'),
    (6,'الإنتاج الكتابي: مقال أدبي في قضية إنسانية كونية','writing')
  ) as x(n,title,kind)
  on conflict(unit_id,lesson_number)
  do update set
    title=excluded.title,sort_order=excluded.sort_order,lesson_type=excluded.lesson_type,
    summary=excluded.summary,content=excluded.content,source_pdf_url=excluded.source_pdf_url,
    source_page_start=excluded.source_page_start,source_page_end=excluded.source_page_end,
    status='published',is_free=true,estimated_minutes=45,semester=2,
    official_content_scope='official-book-unscheduled',updated_at=now();

  --------------------------------------------------------------------
  -- Link all unified S2 units to unified track.
  --------------------------------------------------------------------
  select id into v_track
  from public.secondary_tracks
  where country_code='BH'
    and academic_year='2026-2027'
    and track_name_ar='توحيد المسارات'
    and is_active=true
  limit 1;
  if v_track is null then raise exception 'BH_UNIFIED_TRACK_NOT_FOUND'; end if;

  insert into public.secondary_track_curricula(
    secondary_track_id,curriculum_id,relation_type,is_default,notes
  )
  values(
    v_track,v_curriculum,'official',false,
    'محتوى كتب رسمية للجزء الثاني؛ مفصّل من Plan4 2025-2026، دون ادعاء نشر خطة S2 2026-2027.'
  )
  on conflict(secondary_track_id,curriculum_id)
  do update set relation_type='official',is_default=false,notes=excluded.notes;

  insert into public.secondary_track_units(
    secondary_track_id,unit_id,relation_type,notes
  )
  select v_track,u.id,'official',
         'وحدة رسمية من كتاب الجزء الثاني؛ غير مجدولة حاليًا. المصدر التفصيلي Plan4 S2 2025-2026.'
  from public.units u
  join public.grades g on g.id=u.grade_id
  where g.curriculum_id=v_curriculum
  on conflict(secondary_track_id,unit_id)
  do update set relation_type='official',notes=excluded.notes;

  update public.secondary_track_grade_terms
  set detail_status='partial-imported',
      source_url='https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
      audited_at=current_date,
      notes='خطة S2 2026-2027 غير منشورة. أُضيفت مكونات الكتب الرسمية الحالية، بما فيها المقررات الاختيارية الواردة في Plan4 السابق.',
      updated_at=now()
  where secondary_track_id=v_track
    and academic_year='2026-2027'
    and semester=2
    and grade_number in (10,11,12)
    and publication_status='not-published-as-of-audit';

  update public.secondary_track_terms
  set detail_status='partial-imported',
      source_url='https://edunet.bh/manual/plans2-2025-2026/Arabic/Plan4.pdf',
      audited_at=current_date,
      notes='خطة S2 2026-2027 غير منشورة؛ أُضيف محتوى الكتب الرسمية الحالي غير المجدول، مع المقررات الاختيارية.',
      updated_at=now()
  where secondary_track_id=v_track
    and academic_year='2026-2027'
    and semester=2
    and publication_status='not-published-as-of-audit';

  --------------------------------------------------------------------
  -- Shared Arab 102 and Arab 311 are also explicitly mapped to religious.
  --------------------------------------------------------------------
  select id into v_religious_track
  from public.secondary_tracks
  where country_code='BH'
    and academic_year='2026-2027'
    and track_name_ar='التعليم الديني'
    and is_active=true
  limit 1;

  if v_religious_track is not null then
    insert into public.secondary_track_curricula(
      secondary_track_id,curriculum_id,relation_type,is_default,notes
    )
    values(
      v_religious_track,v_curriculum,'official',false,
      'يشترك التعليم الديني في عرب 102 وعرب 311 وفق Plan4؛ رُبطت وحدتاهما فقط.'
    )
    on conflict(secondary_track_id,curriculum_id)
    do update set relation_type='official',is_default=false,notes=excluded.notes;

    insert into public.secondary_track_units(
      secondary_track_id,unit_id,relation_type,notes
    )
    select v_religious_track,u.id,'official',
           'مقرر مشترك مع التعليم الديني وفق Plan4: عرب 102 أو عرب 311.'
    from public.units u
    join public.grades g on g.id=u.grade_id
    where g.curriculum_id=v_curriculum
      and (
        (g.grade_number=10 and u.title like 'عرب 102%')
        or
        (g.grade_number=12 and u.title like 'عرب 311%')
      )
    on conflict(secondary_track_id,unit_id)
    do update set relation_type='official',notes=excluded.notes;
  end if;
end $$;
