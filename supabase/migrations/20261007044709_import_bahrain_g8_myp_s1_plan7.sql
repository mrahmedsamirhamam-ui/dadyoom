-- Bahrain Grade 8 MYP Arabic Language & Literature, Semester 1, 2026-2027.
DO $$
DECLARE v_country uuid; v_curriculum uuid; v_grade uuid; v_unit uuid;
BEGIN
 SELECT id INTO v_country FROM public.countries WHERE code='BH' AND is_active=true LIMIT 1;
 IF v_country IS NULL THEN RAISE EXCEPTION 'BH_COUNTRY_NOT_FOUND'; END IF;
 SELECT id INTO v_curriculum FROM public.curricula
  WHERE country_id=v_country
    AND name_ar='اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP'
    AND academic_year='2026-2027' LIMIT 1;
 IF v_curriculum IS NULL THEN RAISE EXCEPTION 'BH_MYP_CURRICULUM_NOT_FOUND'; END IF;
 UPDATE public.curricula SET
   description='منهج رسمي للصف الثامن في برنامج السنوات المتوسطة MYP. تم استيراد تفاصيل الفصل الأول 2026-2027 من الخطة الرسمية الحالية Plan7 المنشورة في Edunet.',
   is_active=true
 WHERE id=v_curriculum;
 SELECT id INTO v_grade FROM public.grades
  WHERE curriculum_id=v_curriculum AND grade_number=8 AND is_active=true LIMIT 1;
 IF v_grade IS NULL THEN RAISE EXCEPTION 'BH_MYP_G8_NOT_FOUND'; END IF;

 INSERT INTO public.units(grade_id,title,description,unit_number,sort_order,semester)
 VALUES(v_grade,'جذور وبراعم','اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP، الصف الثامن، الفصل الدراسي الأول 2026-2027.',1,1,1)
 ON CONFLICT(grade_id,unit_number) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,sort_order=EXCLUDED.sort_order,semester=1
 RETURNING id INTO v_unit;

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'استماع الوحدة الأولى','bh-2026-2027-myp-g8-s1-u1-l01',
   1,1,'listening','الخطة الرسمية Plan7 تحدد «استماع الوحدة الأولى» ضمن وحدة «جذور وبراعم» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: عتبة الحنين','bh-2026-2027-myp-g8-s1-u1-l02',
   2,2,'reading','الخطة الرسمية Plan7 تحدد «القراءة: عتبة الحنين» ضمن وحدة «جذور وبراعم» للصف الثامن MYP، وصفحات الكتاب 10-21.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القواعد النحوية: الاسم المقصور والاسم المنقوص','bh-2026-2027-myp-g8-s1-u1-l03',
   3,3,'grammar','الخطة الرسمية Plan7 تحدد «القواعد النحوية: الاسم المقصور والاسم المنقوص» ضمن وحدة «جذور وبراعم» للصف الثامن MYP، وصفحات الكتاب 33-37.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: ساعة صفاء','bh-2026-2027-myp-g8-s1-u1-l04',
   4,4,'reading','الخطة الرسمية Plan7 تحدد «القراءة: ساعة صفاء» ضمن وحدة «جذور وبراعم» للصف الثامن MYP، وصفحات الكتاب 22-30.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'الإنتاج الكتابي: كتابة نص سردي ذي بنية ثلاثية','bh-2026-2027-myp-g8-s1-u1-l05',
   5,5,'writing','الخطة الرسمية Plan7 تحدد «الإنتاج الكتابي: كتابة نص سردي ذي بنية ثلاثية» ضمن وحدة «جذور وبراعم» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: نزهة مع الجد','bh-2026-2027-myp-g8-s1-u1-l06',
   6,6,'reading','الخطة الرسمية Plan7 تحدد «القراءة: نزهة مع الجد» ضمن وحدة «جذور وبراعم» للصف الثامن MYP، وصفحات الكتاب 31-40.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القواعد النحوية: الفعل اللازم والفعل المتعدي','bh-2026-2027-myp-g8-s1-u1-l07',
   7,7,'grammar','الخطة الرسمية Plan7 تحدد «القواعد النحوية: الفعل اللازم والفعل المتعدي» ضمن وحدة «جذور وبراعم» للصف الثامن MYP، وصفحات الكتاب 43-49.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: هيا ابتسم يا طفل','bh-2026-2027-myp-g8-s1-u1-l08',
   8,8,'reading','الخطة الرسمية Plan7 تحدد «القراءة: هيا ابتسم يا طفل» ضمن وحدة «جذور وبراعم» للصف الثامن MYP، وصفحات الكتاب 41-48.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'الإنتاج الكتابي: كتابة قصة تتضمن حوارًا بين طرفين أو أكثر','bh-2026-2027-myp-g8-s1-u1-l09',
   9,9,'writing','الخطة الرسمية Plan7 تحدد «الإنتاج الكتابي: كتابة قصة تتضمن حوارًا بين طرفين أو أكثر» ضمن وحدة «جذور وبراعم» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'دراسة الأثر الأدبي: رواية الأيام — الجزء الأول من الفصل 1 إلى الفصل 6','bh-2026-2027-myp-g8-s1-u1-l10',
   10,10,'reading','الخطة الرسمية Plan7 تحدد «دراسة الأثر الأدبي: رواية الأيام — الجزء الأول من الفصل 1 إلى الفصل 6» ضمن وحدة «جذور وبراعم» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.units(grade_id,title,description,unit_number,sort_order,semester)
 VALUES(v_grade,'عدسات صغيرة','اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP، الصف الثامن، الفصل الدراسي الأول 2026-2027.',2,2,1)
 ON CONFLICT(grade_id,unit_number) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,sort_order=EXCLUDED.sort_order,semester=1
 RETURNING id INTO v_unit;

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'استماع الوحدة الثانية','bh-2026-2027-myp-g8-s1-u2-l01',
   1,1,'listening','الخطة الرسمية Plan7 تحدد «استماع الوحدة الثانية» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: أحبك... لكني أريد أن ألعب','bh-2026-2027-myp-g8-s1-u2-l02',
   2,2,'reading','الخطة الرسمية Plan7 تحدد «القراءة: أحبك... لكني أريد أن ألعب» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP، وصفحات الكتاب 52-60.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القواعد النحوية: الحال','bh-2026-2027-myp-g8-s1-u2-l03',
   3,3,'grammar','الخطة الرسمية Plan7 تحدد «القواعد النحوية: الحال» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP، وصفحات الكتاب 85-90.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: حلم طفل','bh-2026-2027-myp-g8-s1-u2-l04',
   4,4,'reading','الخطة الرسمية Plan7 تحدد «القراءة: حلم طفل» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP، وصفحات الكتاب 61-71.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'الإنتاج الكتابي: كتابة الرسالة الشخصية','bh-2026-2027-myp-g8-s1-u2-l05',
   5,5,'writing','الخطة الرسمية Plan7 تحدد «الإنتاج الكتابي: كتابة الرسالة الشخصية» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   2,2,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: ثلاث رسائل من تيدي','bh-2026-2027-myp-g8-s1-u2-l06',
   6,6,'reading','الخطة الرسمية Plan7 تحدد «القراءة: ثلاث رسائل من تيدي» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP، وصفحات الكتاب 72-80.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القواعد النحوية: الاستثناء بإلا','bh-2026-2027-myp-g8-s1-u2-l07',
   7,7,'grammar','الخطة الرسمية Plan7 تحدد «القواعد النحوية: الاستثناء بإلا» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP، وصفحات الكتاب 97-101.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: لله ما أحلى الطفولة','bh-2026-2027-myp-g8-s1-u2-l08',
   8,8,'reading','الخطة الرسمية Plan7 تحدد «القراءة: لله ما أحلى الطفولة» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP، وصفحات الكتاب 81-87.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'التعبير الكتابي: كتابة المقال','bh-2026-2027-myp-g8-s1-u2-l09',
   9,9,'writing','الخطة الرسمية Plan7 تحدد «التعبير الكتابي: كتابة المقال» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'دراسة الأثر الأدبي: رواية الأيام — الجزء الأول من الفصل 7 إلى الفصل 13','bh-2026-2027-myp-g8-s1-u2-l10',
   10,10,'reading','الخطة الرسمية Plan7 تحدد «دراسة الأثر الأدبي: رواية الأيام — الجزء الأول من الفصل 7 إلى الفصل 13» ضمن وحدة «عدسات صغيرة» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.units(grade_id,title,description,unit_number,sort_order,semester)
 VALUES(v_grade,'وطني هويتي','اللغة العربية — اللغة والأدب — برنامج السنوات المتوسطة MYP، الصف الثامن، الفصل الدراسي الأول 2026-2027.',3,3,1)
 ON CONFLICT(grade_id,unit_number) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,sort_order=EXCLUDED.sort_order,semester=1
 RETURNING id INTO v_unit;

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'استماع الوحدة الثالثة','bh-2026-2027-myp-g8-s1-u3-l01',
   1,1,'listening','الخطة الرسمية Plan7 تحدد «استماع الوحدة الثالثة» ضمن وحدة «وطني هويتي» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: موطن الخالدين','bh-2026-2027-myp-g8-s1-u3-l02',
   2,2,'reading','الخطة الرسمية Plan7 تحدد «القراءة: موطن الخالدين» ضمن وحدة «وطني هويتي» للصف الثامن MYP، وصفحات الكتاب 90-96.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القواعد النحوية: التمييز','bh-2026-2027-myp-g8-s1-u3-l03',
   3,3,'grammar','الخطة الرسمية Plan7 تحدد «القواعد النحوية: التمييز» ضمن وحدة «وطني هويتي» للصف الثامن MYP، وصفحات الكتاب 119-122.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: أنين الصواري','bh-2026-2027-myp-g8-s1-u3-l04',
   4,4,'reading','الخطة الرسمية Plan7 تحدد «القراءة: أنين الصواري» ضمن وحدة «وطني هويتي» للصف الثامن MYP، وصفحات الكتاب 97-107.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'التعبير الكتابي: إجراء مقابلة صحفية','bh-2026-2027-myp-g8-s1-u3-l05',
   5,5,'writing','الخطة الرسمية Plan7 تحدد «التعبير الكتابي: إجراء مقابلة صحفية» ضمن وحدة «وطني هويتي» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: ذكريات المطوع وبهجة التخرج','bh-2026-2027-myp-g8-s1-u3-l06',
   6,6,'reading','الخطة الرسمية Plan7 تحدد «القراءة: ذكريات المطوع وبهجة التخرج» ضمن وحدة «وطني هويتي» للصف الثامن MYP، وصفحات الكتاب 108-117.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القواعد النحوية: النداء','bh-2026-2027-myp-g8-s1-u3-l07',
   7,7,'grammar','الخطة الرسمية Plan7 تحدد «القواعد النحوية: النداء» ضمن وحدة «وطني هويتي» للصف الثامن MYP، وصفحات الكتاب 131-136.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'التعبير الكتابي: كتابة قصة تتضمن مقطعًا وصفيًا','bh-2026-2027-myp-g8-s1-u3-l08',
   8,8,'writing','الخطة الرسمية Plan7 تحدد «التعبير الكتابي: كتابة قصة تتضمن مقطعًا وصفيًا» ضمن وحدة «وطني هويتي» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'القراءة: أميرة الصحراء','bh-2026-2027-myp-g8-s1-u3-l09',
   9,9,'reading','الخطة الرسمية Plan7 تحدد «القراءة: أميرة الصحراء» ضمن وحدة «وطني هويتي» للصف الثامن MYP، وصفحات الكتاب 118-127.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'دراسة الأثر الأدبي: رواية الأيام — الجزء الأول من الفصل 14 إلى الفصل 20','bh-2026-2027-myp-g8-s1-u3-l10',
   10,10,'reading','الخطة الرسمية Plan7 تحدد «دراسة الأثر الأدبي: رواية الأيام — الجزء الأول من الفصل 14 إلى الفصل 20» ضمن وحدة «وطني هويتي» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 INSERT INTO public.lessons(
   unit_id,title,slug,lesson_number,sort_order,lesson_type,summary,
   source_pdf_url,source_page_start,source_page_end,status,is_free,
   estimated_minutes,semester,official_content_scope
 )
 VALUES(
   v_unit,'مراجعة عامة','bh-2026-2027-myp-g8-s1-u3-l11',
   11,11,'assessment','الخطة الرسمية Plan7 تحدد «مراجعة عامة» ضمن وحدة «وطني هويتي» للصف الثامن MYP.',
   'https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   3,3,'published',true,45,1,'plan-scheduled'
 )
 ON CONFLICT(unit_id,lesson_number) DO UPDATE SET
   title=EXCLUDED.title,slug=EXCLUDED.slug,sort_order=EXCLUDED.sort_order,
   lesson_type=EXCLUDED.lesson_type,summary=EXCLUDED.summary,
   source_pdf_url=EXCLUDED.source_pdf_url,
   source_page_start=EXCLUDED.source_page_start,source_page_end=EXCLUDED.source_page_end,
   status='published',is_free=true,estimated_minutes=45,semester=1,
   official_content_scope='plan-scheduled';

 UPDATE public.curriculum_grade_terms SET
   publication_status='published',
   detail_status='detailed-imported',
   source_url='https://edunet.bh/manual/plans1-2026-2027/Arabic/Plan7.pdf',
   audited_at=date '2026-10-07',
   notes='تم استخراج جميع عناصر Plan7 الرسمية للصف الثامن MYP للفصل الأول 2026-2027: 3 وحدات و31 عنصرًا دراسيًا.',
   updated_at=now()
 WHERE curriculum_id=v_curriculum AND grade_number=8
   AND academic_year='2026-2027' AND semester=1;
END $$;
