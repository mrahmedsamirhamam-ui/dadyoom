\set ON_ERROR_STOP on
-- Dummy curriculum only; role accounts are created in prior disposable step.
CREATE TABLE public.lesson_activities (
 id uuid PRIMARY KEY,
 lesson_id uuid NOT NULL,
 title text NOT NULL,
 activity_type text NOT NULL,
 instructions text,
 content jsonb,
 activity_order integer NOT NULL,
 points integer NOT NULL,
 is_published boolean NOT NULL,
 created_at timestamptz DEFAULT now(),
 updated_at timestamptz DEFAULT now(),
 section text,
 prompt text,
 answer jsonb,
 is_required boolean
);
INSERT INTO public.lesson_activities(
 id,lesson_id,title,activity_type,instructions,content,
 activity_order,points,is_published,section,prompt,answer,is_required
) VALUES
 ('11111111-1111-4111-8111-111111111111',
  '33333333-3333-4333-8333-333333333333',
  'اقرأ الكلمات','multiple_choice','اختر الكلمة',
  '{"items":[{"id":"a","text":"الماء"},{"id":"b","text":"الهواء"}]}',
  1,5,true,'practice','اختر من الصور','{"correctAnswer":"a"}',true),
 ('22222222-2222-4222-8222-222222222222',
  '33333333-3333-4333-8333-333333333333',
  'مسودة غير منشورة','multiple_choice','المعلم فقط',
  '{"items":[{"id":"a","text":"العين"}]}',
  2,5,false,'practice','خاص','{"correctAnswer":"a"}',false);
ALTER TABLE public.lesson_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY shadow_published_activities ON public.lesson_activities
 FOR SELECT TO anon,authenticated USING(is_published=true);
GRANT USAGE ON SCHEMA public TO anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lesson_activities
 TO anon,authenticated;
\echo SHADOW_ACTIVITY_PRIVACY_FIXTURE_READY=PASS
