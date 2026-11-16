-- Synthetic isolated schema; no production dump.
CREATE SCHEMA auth;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$
 SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
GRANT USAGE ON SCHEMA auth,public TO anon,authenticated;
GRANT EXECUTE ON FUNCTION auth.uid(),auth.jwt() TO authenticated;
CREATE TABLE public.questions(
 id uuid PRIMARY KEY,lesson_id uuid,question_order integer,question text,question_type text,
 options jsonb,correct_answer text,explanation text,points integer,created_at timestamptz,updated_at timestamptz);
CREATE TABLE public.ai_assessments(
 id uuid PRIMARY KEY,student_email text,title text,passage text,question text,
 choices jsonb,correct_answer integer,explanation text,skill text,difficulty text,
 created_at timestamptz,completed boolean DEFAULT false,lesson_id uuid,question_hash text);
CREATE TABLE public.assessment_sessions(
 id uuid PRIMARY KEY,student_id uuid,lesson_id uuid,current_question integer DEFAULT 1,
 total_questions integer,correct_answers integer DEFAULT 0,wrong_answers integer DEFAULT 0,
 difficulty text DEFAULT 'easy',finished boolean DEFAULT false,created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now());
CREATE TABLE public.assessment_session_answers(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),session_id uuid REFERENCES public.assessment_sessions(id),
 assessment_id uuid REFERENCES public.ai_assessments(id),student_id uuid,lesson_id uuid,
 skill text,selected_answer integer,correct_answer integer,is_correct boolean,
 created_at timestamptz DEFAULT now(),UNIQUE(session_id,assessment_id));
INSERT INTO auth.users VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
INSERT INTO public.questions(id,lesson_id,question_order,question,question_type,options,correct_answer,points)
 VALUES ('11111111-1111-4111-8111-111111111111','cccccccc-cccc-4ccc-8ccc-cccccccccccc',1,'What?','multiple_choice','["A","B"]','1',1);
INSERT INTO public.assessment_sessions(id,student_id,lesson_id,total_questions)
 VALUES ('22222222-2222-4222-8222-222222222222','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','cccccccc-cccc-4ccc-8ccc-cccccccccccc',2),
 ('33333333-3333-4333-8333-333333333333','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','cccccccc-cccc-4ccc-8ccc-cccccccccccc',2);
INSERT INTO public.ai_assessments(id,student_email,choices,correct_answer,lesson_id,skill)
 VALUES ('44444444-4444-4444-8444-444444444444','student-a@test.invalid','["A","B"]',1,'cccccccc-cccc-4ccc-8ccc-cccccccccccc','reading');
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_sessions ON public.assessment_sessions FOR SELECT TO authenticated
 USING (student_id=(select auth.uid()));
CREATE POLICY own_answers ON public.assessment_session_answers FOR SELECT TO authenticated
 USING (student_id=(select auth.uid()));
CREATE POLICY own_questions ON public.ai_assessments FOR SELECT TO authenticated
 USING (student_email=(select auth.jwt()->>'email'));
CREATE POLICY visible_questions ON public.questions FOR SELECT TO authenticated USING (true);
-- Simulate dangerous broad legacy grants, which hardening must remove.
GRANT SELECT,UPDATE,DELETE ON public.questions,public.ai_assessments,
 public.assessment_sessions,public.assessment_session_answers TO authenticated;
