-- Applied to Dadyoom main Supabase as migration 20261022195032 (2026-10-22).
-- Preserves the RPC name/response shape, but removes answers from question JSON.
-- Uses security-invoker published-only student questions view, not the raw table.
-- Does not change student records, question grants, or billing.
CREATE OR REPLACE FUNCTION public.get_lesson_page_bundle(p_lesson_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_lesson record;
  v_previous jsonb := null;
  v_next jsonb := null;
  v_questions jsonb := '[]'::jsonb;
  v_activities jsonb := '[]'::jsonb;
  v_progress jsonb := null;
  v_completed boolean := false;
  v_attempts jsonb := '[]'::jsonb;
  v_tutor jsonb := '[]'::jsonb;
begin
  select
    l.id,
    l.unit_id,
    l.title,
    l.lesson_number,
    l.status,
    l.lesson_type,
    l.content,
    l.summary,
    l.instructions,
    l.learning_objectives,
    l.vocabulary,
    l.estimated_minutes,
    l.source_page_start,
    l.source_page_end,
    l.source_pdf_url
  into v_lesson
  from public.lessons l
  where l.id = p_lesson_id
    and l.status = 'published'
  limit 1;

  if not found then
    return null;
  end if;

  select jsonb_build_object(
    'id', p.id,
    'title', p.title,
    'lesson_number', p.lesson_number
  )
  into v_previous
  from public.lessons p
  where p.unit_id = v_lesson.unit_id
    and p.status = 'published'
    and p.lesson_number < v_lesson.lesson_number
  order by p.lesson_number desc
  limit 1;

  select jsonb_build_object(
    'id', n.id,
    'title', n.title,
    'lesson_number', n.lesson_number
  )
  into v_next
  from public.lessons n
  where n.unit_id = v_lesson.unit_id
    and n.status = 'published'
    and n.lesson_number > v_lesson.lesson_number
  order by n.lesson_number asc
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', q.id,
        'lesson_id', q.lesson_id,
        'question_order', q.question_order,
        'question', q.question,
        'question_type', q.question_type,
        'options', q.options,
        'points', q.points
      )
      order by q.question_order
    ),
    '[]'::jsonb
  )
  into v_questions
  from public.dadyoom_student_questions q
  where q.lesson_id = v_lesson.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', a.id,
        'lesson_id', a.lesson_id,
        'title', a.title,
        'activity_type', a.activity_type,
        'instructions', a.instructions,
        'content', a.content,
        'activity_order', a.activity_order,
        'points', a.points,
        'is_published', a.is_published,
        'section', coalesce(a.content ->> 'section', ''),
        'created_at', a.created_at,
        'updated_at', a.updated_at
      )
      order by a.activity_order
    ),
    '[]'::jsonb
  )
  into v_activities
  from public.lesson_activities a
  where a.lesson_id = v_lesson.id
    and a.is_published = true;

  if v_uid is not null then
    select jsonb_build_object(
      'id', slp.id,
      'status', slp.status,
      'progress_percent', slp.progress_percent,
      'best_score', slp.best_score,
      'last_score', slp.last_score,
      'xp', slp.xp,
      'attempts', slp.attempts,
      'time_spent_seconds', slp.time_spent_seconds
    )
    into v_progress
    from public.student_lesson_progress slp
    where slp.student_id = v_uid
      and slp.lesson_id = v_lesson.id
    limit 1;

    v_completed :=
      coalesce(v_progress ->> 'status', '') in ('completed', 'mastered')
      or coalesce((v_progress ->> 'progress_percent')::numeric, 0) >= 100;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'question_id', qa.question_id,
          'is_correct', qa.is_correct
        )
        order by qa.answered_at
      ),
      '[]'::jsonb
    )
    into v_attempts
    from public.question_attempts qa
    join public.questions q2
      on q2.id = qa.question_id
     and q2.lesson_id = v_lesson.id
    where qa.user_id = v_uid;

    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', tm.id,
          'role', tm.role,
          'content', tm.content,
          'created_at', tm.created_at
        )
        order by tm.created_at
      ),
      '[]'::jsonb
    )
    into v_tutor
    from (
      select
        m.id,
        m.role,
        m.content,
        m.created_at
      from public.ai_tutor_messages m
      where m.user_id = v_uid
        and m.lesson_id = v_lesson.id
      order by m.created_at desc
      limit 50
    ) tm;
  end if;

  return jsonb_build_object(
    'lesson',
      to_jsonb(v_lesson)
      || jsonb_build_object(
        'previousLesson', v_previous,
        'nextLesson', v_next
      ),
    'questions', v_questions,
    'activities', v_activities,
    'student',
      case
        when v_uid is null then null
        else jsonb_build_object('id', v_uid)
      end,
    'completed', v_completed,
    'learningProgress', v_progress,
    'questionAttempts', v_attempts,
    'tutorMessages', v_tutor
  );
end;
$function$
;
COMMENT ON FUNCTION public.get_lesson_page_bundle(uuid) IS 'Returns published lesson content and student-owned progress, but question objects contain only student-safe fields from dadyoom_student_questions, without answer keys or explanations.';
