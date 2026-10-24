\set ON_ERROR_STOP on
-- Fixture only, within disposable shadow_question_privacy PostgreSQL DB.
DO $roles$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon')
   OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated')
 THEN RAISE EXCEPTION 'DISPOSABLE_ROLES_NOT_READY'; END IF;
END $roles$;

CREATE TABLE public.lessons (id uuid PRIMARY KEY, status text NOT NULL);
CREATE TABLE public.questions (
 id uuid PRIMARY KEY,
 lesson_id uuid NOT NULL REFERENCES public.lessons(id),
 question_order integer NOT NULL,
 question text NOT NULL,
 question_type text NOT NULL,
 options jsonb NOT NULL,
 correct_answer text NOT NULL,
 explanation text,
 points integer NOT NULL
);
INSERT INTO public.lessons(id,status) VALUES
 ('11111111-1111-4111-8111-111111111111','published'),
 ('22222222-2222-4222-8222-222222222222','draft');
INSERT INTO public.questions
 (id,lesson_id,question_order,question,question_type,options,
  correct_answer,explanation,points) VALUES
 ('33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',1,'سؤال علني؟',
  'multiple_choice',
  '[{"id":"a","text":"خيار أول"},{"id":"b","text":"خيار ثان"}]',
  'a','شرح خاص لا يظهر للطالب قبل الإجابة',1),
 ('44444444-4444-4444-8444-444444444444',
  '22222222-2222-4222-8222-222222222222',1,'سؤال مسودة؟',
  'multiple_choice',
  '[{"id":"a","text":"خيار أول"},{"id":"b","text":"خيار ثان"}]',
  'b','خاص بالمسودة',1);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fake_lesson_read ON public.lessons FOR SELECT TO anon,authenticated
 USING(status='published');
CREATE POLICY fake_questions_read ON public.questions FOR SELECT TO anon,authenticated
 USING(EXISTS (SELECT 1 FROM public.lessons l
               WHERE l.id=lesson_id AND l.status='published'));
GRANT USAGE ON SCHEMA public TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.questions TO anon,authenticated;
GRANT SELECT ON public.lessons TO anon,authenticated;
CREATE VIEW public.dadyoom_student_questions
WITH (security_invoker=true,security_barrier=true) AS
SELECT q.id,q.lesson_id,q.question_order,q.question,q.question_type,
 COALESCE((
  SELECT jsonb_agg(jsonb_build_object('id',o.opt->>'id','text',o.opt->>'text')
                   ORDER BY o.ord)
  FROM jsonb_array_elements(q.options) WITH ORDINALITY o(opt,ord)
 ),'[]'::jsonb) AS options,
 q.points
FROM public.questions q JOIN public.lessons l ON l.id=q.lesson_id
WHERE l.status='published';
GRANT SELECT ON public.dadyoom_student_questions TO anon,authenticated;
\echo SHADOW_QUESTION_PRIVACY_FIXTURE_READY=PASS
