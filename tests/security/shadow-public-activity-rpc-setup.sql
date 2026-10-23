-- Disposable PostgreSQL 16 only. Synthetic role + lesson schema.
-- NEVER run on the production Dadyoom database.
\set ON_ERROR_STOP on
DO $roles$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END $roles$;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $fn$
  SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid
$fn$;
GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;

CREATE TABLE public.lessons (
 id uuid PRIMARY KEY, unit_id uuid, title text, lesson_number integer,
 status text, lesson_type text, content text, summary text, instructions jsonb,
 learning_objectives jsonb, vocabulary jsonb, estimated_minutes integer,
 source_page_start integer, source_page_end integer, source_pdf_url text
);
CREATE TABLE public.questions (
 id uuid PRIMARY KEY, lesson_id uuid, question_order integer,question text,
 question_type text,options jsonb,points integer
);
CREATE TABLE public.lesson_activities (
 id uuid PRIMARY KEY, lesson_id uuid, title text, activity_type text,
 instructions text,content jsonb, activity_order integer, points integer,
 is_published boolean,created_at timestamptz,updated_at timestamptz
);
CREATE TABLE public.student_lesson_progress (
 id uuid PRIMARY KEY,student_id uuid,lesson_id uuid,status text,
 progress_percent integer,best_score integer,last_score integer,xp integer,
 attempts integer,time_spent_seconds integer
);
CREATE TABLE public.question_attempts (
 id uuid PRIMARY KEY,user_id uuid,question_id uuid,is_correct boolean,answered_at timestamptz
);
CREATE TABLE public.ai_tutor_messages (
 id uuid PRIMARY KEY,user_id uuid,lesson_id uuid,role text,content text,created_at timestamptz
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tutor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY lesson_published ON public.lessons FOR SELECT TO anon,authenticated
  USING(status='published');
CREATE POLICY question_published ON public.questions FOR SELECT TO anon,authenticated
  USING(EXISTS (SELECT 1 FROM public.lessons l WHERE l.id=lesson_id AND l.status='published'));
CREATE POLICY activity_published ON public.lesson_activities FOR SELECT TO anon,authenticated
  USING(is_published=true AND EXISTS (SELECT 1 FROM public.lessons l WHERE l.id=lesson_id AND l.status='published'));
CREATE POLICY progress_owner ON public.student_lesson_progress FOR SELECT TO authenticated
  USING(student_id=auth.uid());
CREATE POLICY attempt_owner ON public.question_attempts FOR SELECT TO authenticated
  USING(user_id=auth.uid());
CREATE POLICY tutor_owner ON public.ai_tutor_messages FOR SELECT TO authenticated
  USING(user_id=auth.uid());
GRANT SELECT ON public.lessons, public.questions, public.lesson_activities,
 public.student_lesson_progress,public.question_attempts,public.ai_tutor_messages
 TO anon,authenticated;
CREATE VIEW public.dadyoom_student_questions
WITH (security_invoker=true,security_barrier=true) AS
SELECT q.id,q.lesson_id,q.question_order,q.question,q.question_type,
 COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.opt->>'id','text',r.opt->>'text') ORDER BY r.ord)
 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(q.options)='array'
   THEN q.options ELSE '[]'::jsonb END)
 WITH ORDINALITY AS r(opt,ord)
 WHERE jsonb_typeof(r.opt)='object'),'[]'::jsonb) AS options,
 q.points
 FROM public.questions q
 JOIN public.lessons l ON l.id=q.lesson_id
 WHERE l.status='published';
GRANT SELECT ON public.dadyoom_student_questions TO anon,authenticated;

INSERT INTO public.lessons(id,unit_id,title,lesson_number,status,lesson_type,content)
VALUES
 ('00000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Published lesson',1,'published','interactive','Public lesson'),
 ('00000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Private draft',2,'draft','interactive','Private lesson');
INSERT INTO public.questions(id,lesson_id,question_order,question,question_type,options,points)
VALUES('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',
 1,'Which letter?','multiple_choice',
 '[{"id":"a","text":"alif","isCorrect":true},{"id":"b","text":"ba"}]'::jsonb,5);
INSERT INTO public.lesson_activities
(id,lesson_id,title,activity_type,instructions,content,activity_order,points,is_published,created_at,updated_at)
VALUES
 ('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001',
 'Activity','multiple_choice','Choose a letter',
 '{
  "section":"reading","text":"Choose the letter","image_url":"https://example.invalid/a.png",
  "options":[{"id":"a","text":"alif","isCorrect":true,"score":5},{"id":"b","text":"ba","correct_answer":"a"}],
  "nested":{"examples":[{"label":"Example","answerKey":"a"}],"marking-key":{"correctindex":0},"prompt":"Learn"},
  "forms":["alif","ba"]
 }'::jsonb,1,5,true,now(),now()),
 ('30000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000002',
 'Draft activity','multiple_choice',null,
 '{"options":[{"text":"DRAFT-SECRET","isCorrect":true}]}'::jsonb,1,5,true,now(),now());
INSERT INTO public.student_lesson_progress
(id,student_id,lesson_id,status,progress_percent,best_score,last_score,xp,attempts,time_spent_seconds)
VALUES
 ('40000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',
 '00000000-0000-4000-8000-000000000001','in_progress',45,45,45,10,1,10),
 ('40000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002',
 '00000000-0000-4000-8000-000000000001','completed',100,100,100,1000,10,500);
INSERT INTO public.question_attempts (id,user_id,question_id,is_correct,answered_at)
VALUES
 ('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',
 '20000000-0000-4000-8000-000000000001',true,now()),
 ('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002',
 '20000000-0000-4000-8000-000000000001',false,now());
INSERT INTO public.ai_tutor_messages (id,user_id,lesson_id,role,content,created_at)
VALUES
 ('70000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001',
 '00000000-0000-4000-8000-000000000001','student','private-first',now()),
 ('70000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000002',
 '00000000-0000-4000-8000-000000000001','student','private-second',now());
\echo SHADOW_PUBLIC_ACTIVITY_SETUP=PASS
