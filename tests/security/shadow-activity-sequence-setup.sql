-- Synthetic fixture in disposable database shadow_activity_sequence only.
\set ON_ERROR_STOP on
CREATE TABLE public.lesson_activity_attempts (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL,
  activity_id uuid NOT NULL,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  earned_points integer NOT NULL DEFAULT 0
);
INSERT INTO public.lesson_activity_attempts (user_id,activity_id,attempt_number,earned_points)
VALUES
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',1,10),
 ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',2,20);
\echo SHADOW_ACTIVITY_SEQUENCE_INITIAL_ROWS=PASS
