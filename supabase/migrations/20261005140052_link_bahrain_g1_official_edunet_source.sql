-- Link the verified Bahrain Grade 1 Semester 1 national lessons
-- to the exact official Edunet student-book source already retained in repository data.

update public.lessons l
set source_pdf_url='https://www.edunet.bh/e_content/level_1/stage_1/subject_ID_1/Part_1/e_books/Arabic-Baraem-G1-P1-2026/Arabic%20Baraem%20G1%20P1%202026/index.html',
    updated_at=now()
where l.slug like 'bh-2026-g1-s1-%'
  and l.status='published'
  and coalesce(nullif(trim(l.source_pdf_url),''),'')='';
