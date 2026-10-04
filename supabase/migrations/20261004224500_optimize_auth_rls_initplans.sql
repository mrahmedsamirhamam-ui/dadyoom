-- RLS auth initialization optimization generated from the exact Supabase advisor findings on 2026-10-04.
-- Predicate logic is preserved. Only auth.uid()/auth.jwt()/auth.role() calls are scalar-subquery wrapped
-- so they are evaluated once per statement rather than once per row.

alter policy "Students manage own adaptive steps" on public."adaptive_learning_steps"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "students_insert_ai_assessments" on public."ai_assessments"
  with check ((student_email = auth.email()));

alter policy "students_select_ai_assessments" on public."ai_assessments"
  using ((student_email = auth.email()));

alter policy "students_update_ai_assessments" on public."ai_assessments"
  using ((student_email = auth.email()));

alter policy "Users can insert their own AI recommendations" on public."ai_recommendations"
  with check ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "Users can read their own AI recommendations" on public."ai_recommendations"
  using ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "Users can update their own AI recommendations" on public."ai_recommendations"
  using ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "Students delete own tutor messages" on public."ai_tutor_messages"
  using (((select auth.uid()) = user_id));

alter policy "Students insert own tutor messages" on public."ai_tutor_messages"
  with check (((select auth.uid()) = user_id));

alter policy "Students read own tutor messages" on public."ai_tutor_messages"
  using (((select auth.uid()) = user_id));

alter policy "Students manage own assessment answers" on public."assessment_session_answers"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "Students manage assessment sessions" on public."assessment_sessions"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "Users can delete their chat history" on public."chat_history"
  using (((select auth.uid()) = user_id));

alter policy "Users can insert their chat history" on public."chat_history"
  with check (((select auth.uid()) = user_id));

alter policy "Users can read their chat history" on public."chat_history"
  using (((select auth.uid()) = user_id));

alter policy "edu_assignment_questions_delete" on public."edu_assignment_questions"
  using ((EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_questions.assignment_id) AND (a.teacher_id = (select auth.uid()))))));

alter policy "edu_assignment_questions_insert" on public."edu_assignment_questions"
  with check ((EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_questions.assignment_id) AND (a.teacher_id = (select auth.uid()))))));

alter policy "edu_assignment_questions_select" on public."edu_assignment_questions"
  using ((EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_questions.assignment_id) AND ((a.teacher_id = (select auth.uid())) OR edu_assignment_visible_to_student(a.id, (select auth.uid())))))));

alter policy "edu_assignment_questions_update" on public."edu_assignment_questions"
  using ((EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_questions.assignment_id) AND (a.teacher_id = (select auth.uid()))))))
  with check ((EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_questions.assignment_id) AND (a.teacher_id = (select auth.uid()))))));

alter policy "edu_assignment_submissions_select" on public."edu_assignment_submissions"
  using (((student_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_submissions.assignment_id) AND (a.teacher_id = (select auth.uid())))))));

alter policy "edu_assignment_targets_delete" on public."edu_assignment_targets"
  using ((EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_targets.assignment_id) AND (a.teacher_id = (select auth.uid()))))));

alter policy "edu_assignment_targets_insert" on public."edu_assignment_targets"
  with check ((EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_targets.assignment_id) AND (a.teacher_id = (select auth.uid())) AND edu_is_class_student(a.class_id, edu_assignment_targets.student_id)))));

alter policy "edu_assignment_targets_select" on public."edu_assignment_targets"
  using (((student_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM edu_assignments a
  WHERE ((a.id = edu_assignment_targets.assignment_id) AND (a.teacher_id = (select auth.uid())))))));

alter policy "edu_assignments_delete" on public."edu_assignments"
  using ((teacher_id = (select auth.uid())));

alter policy "edu_assignments_insert" on public."edu_assignments"
  with check (((teacher_id = (select auth.uid())) AND edu_is_class_teacher(class_id, (select auth.uid()))));

alter policy "edu_assignments_teacher_select" on public."edu_assignments"
  using (((teacher_id = (select auth.uid())) OR edu_assignment_visible_to_student(id, (select auth.uid())) OR ((school_id IS NOT NULL) AND edu_is_school_owner(school_id, (select auth.uid())))));

alter policy "edu_assignments_update" on public."edu_assignments"
  using ((teacher_id = (select auth.uid())))
  with check (((teacher_id = (select auth.uid())) AND edu_is_class_teacher(class_id, (select auth.uid()))));

alter policy "edu_conversations_insert" on public."edu_conversations"
  with check ((((teacher_id = (select auth.uid())) AND edu_is_class_teacher(class_id, (select auth.uid())) AND edu_is_class_student(class_id, student_id)) OR ((student_id = (select auth.uid())) AND edu_is_class_student(class_id, (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM teacher_classes tc
  WHERE ((tc.id = edu_conversations.class_id) AND (tc.teacher_id = edu_conversations.teacher_id) AND (tc.is_active = true)))))));

alter policy "edu_conversations_select" on public."edu_conversations"
  using (((teacher_id = (select auth.uid())) OR (student_id = (select auth.uid()))));

alter policy "feature_usage_own_read" on public."edu_feature_usage"
  using (((select auth.uid()) = user_id));

alter policy "game_attempts_own_insert" on public."edu_game_attempts"
  with check (((select auth.uid()) = student_id));

alter policy "game_attempts_own_read" on public."edu_game_attempts"
  using (((select auth.uid()) = student_id));

alter policy "edu own progress insert" on public."edu_learner_progress"
  with check (((select auth.uid()) = student_id));

alter policy "edu own progress select" on public."edu_learner_progress"
  using (((select auth.uid()) = student_id));

alter policy "edu own progress update" on public."edu_learner_progress"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "students_delete_own_lesson_notebook" on public."edu_lesson_notebooks"
  using (((select auth.uid()) = student_id));

alter policy "students_insert_own_lesson_notebook" on public."edu_lesson_notebooks"
  with check (((select auth.uid()) = student_id));

alter policy "students_read_own_lesson_notebook" on public."edu_lesson_notebooks"
  using (((select auth.uid()) = student_id));

alter policy "students_update_own_lesson_notebook" on public."edu_lesson_notebooks"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "live attendance participant read" on public."edu_live_attendance"
  using (((user_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM edu_live_sessions s
  WHERE ((s.id = edu_live_attendance.session_id) AND (s.teacher_id = (select auth.uid())))))));

alter policy "live attendance self insert" on public."edu_live_attendance"
  with check (((user_id = (select auth.uid())) AND edu_can_join_live_session(session_id, (select auth.uid()))));

alter policy "live attendance self update" on public."edu_live_attendance"
  using ((user_id = (select auth.uid())))
  with check ((user_id = (select auth.uid())));

alter policy "live sessions participant read" on public."edu_live_sessions"
  using (edu_can_join_live_session(id, (select auth.uid())));

alter policy "marketplace_lessons_read" on public."edu_marketplace_course_lessons"
  using (((is_preview = true) OR (EXISTS ( SELECT 1
   FROM edu_marketplace_courses c
  WHERE ((c.id = edu_marketplace_course_lessons.course_id) AND (c.teacher_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM edu_marketplace_purchases p
  WHERE ((p.course_id = edu_marketplace_course_lessons.course_id) AND (p.buyer_id = (select auth.uid())) AND (p.status = 'active'::text))))));

alter policy "marketplace_lessons_teacher_insert" on public."edu_marketplace_course_lessons"
  with check ((EXISTS ( SELECT 1
   FROM edu_marketplace_courses c
  WHERE ((c.id = edu_marketplace_course_lessons.course_id) AND (c.teacher_id = (select auth.uid()))))));

alter policy "marketplace_lessons_teacher_update" on public."edu_marketplace_course_lessons"
  using ((EXISTS ( SELECT 1
   FROM edu_marketplace_courses c
  WHERE ((c.id = edu_marketplace_course_lessons.course_id) AND (c.teacher_id = (select auth.uid()))))));

alter policy "marketplace_courses_public_read" on public."edu_marketplace_courses"
  using (((status = 'published'::text) OR ((select auth.uid()) = teacher_id)));

alter policy "marketplace_courses_teacher_delete" on public."edu_marketplace_courses"
  using (((select auth.uid()) = teacher_id));

alter policy "marketplace_courses_teacher_insert" on public."edu_marketplace_courses"
  with check (((select auth.uid()) = teacher_id));

alter policy "marketplace_courses_teacher_update" on public."edu_marketplace_courses"
  using (((select auth.uid()) = teacher_id))
  with check (((select auth.uid()) = teacher_id));

alter policy "marketplace_purchases_own_or_teacher_read" on public."edu_marketplace_purchases"
  using ((((select auth.uid()) = buyer_id) OR (EXISTS ( SELECT 1
   FROM edu_marketplace_courses c
  WHERE ((c.id = edu_marketplace_purchases.course_id) AND (c.teacher_id = (select auth.uid())))))));

alter policy "edu_messages_insert" on public."edu_messages"
  with check (((sender_id = (select auth.uid())) AND edu_can_access_conversation(conversation_id, (select auth.uid()))));

alter policy "edu_messages_select" on public."edu_messages"
  using (edu_can_access_conversation(conversation_id, (select auth.uid())));

alter policy "edu_messages_update" on public."edu_messages"
  using (edu_can_access_conversation(conversation_id, (select auth.uid())))
  with check (edu_can_access_conversation(conversation_id, (select auth.uid())));

alter policy "payment_orders_own_read" on public."edu_payment_orders"
  using (((select auth.uid()) = buyer_id));

alter policy "edu own points insert" on public."edu_point_transactions"
  with check (((select auth.uid()) = student_id));

alter policy "edu own points select" on public."edu_point_transactions"
  using (((select auth.uid()) = student_id));

alter policy "edu_rewards_insert" on public."edu_rewards"
  with check (((issuer_id = (select auth.uid())) AND (((issuer_role = 'teacher'::text) AND (class_id IS NOT NULL) AND edu_is_class_teacher(class_id, (select auth.uid())) AND edu_is_class_student(class_id, student_id)) OR ((issuer_role = 'school'::text) AND (school_id IS NOT NULL) AND edu_is_school_owner(school_id, (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM ((teacher_class_students tcs
     JOIN teacher_classes tc ON (((tc.id = tcs.class_id) AND (tc.is_active = true))))
     JOIN school_teachers st ON (((st.teacher_id = tc.teacher_id) AND (st.is_active = true))))
  WHERE ((tcs.student_id = edu_rewards.student_id) AND (tcs.is_active = true) AND (st.school_id = edu_rewards.school_id))))) OR ((issuer_role = 'admin'::text) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = 'admin'::text))))))));

alter policy "edu_rewards_select" on public."edu_rewards"
  using (((student_id = (select auth.uid())) OR (issuer_id = (select auth.uid())) OR ((school_id IS NOT NULL) AND edu_is_school_owner(school_id, (select auth.uid())))));

alter policy "edu own badges select" on public."edu_student_badges"
  using (((select auth.uid()) = student_id));

alter policy "subscriptions_own_read" on public."edu_subscriptions"
  using (((select auth.uid()) = user_id));

alter policy "teacher_earnings_own_read" on public."edu_teacher_earnings"
  using (((select auth.uid()) = teacher_id));

alter policy "teacher_payout_profile_own_all" on public."edu_teacher_payout_profiles"
  using (((select auth.uid()) = teacher_id))
  with check (((select auth.uid()) = teacher_id));

alter policy "teacher_payout_routing_admin_all" on public."edu_teacher_payout_routing"
  using ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = 'admin'::text)))))
  with check ((EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.role = 'admin'::text)))));

alter policy "Students can create their learning plans" on public."learning_plans"
  with check ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "Students can read their learning plans" on public."learning_plans"
  using ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "Students can update their learning plans" on public."learning_plans"
  using ((student_email = ((select auth.jwt()) ->> 'email'::text)))
  with check ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "Users can insert own activity attempts" on public."lesson_activity_attempts"
  with check (((select auth.uid()) = user_id));

alter policy "Users can read own activity attempts" on public."lesson_activity_attempts"
  using (((select auth.uid()) = user_id));

alter policy "students own chat" on public."lesson_chat_messages"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "Students manage own mastery" on public."lesson_mastery"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "Students can insert own lesson progress" on public."lesson_progress"
  with check (((select auth.uid()) = user_id));

alter policy "Students can read own lesson progress" on public."lesson_progress"
  using (((select auth.uid()) = user_id));

alter policy "Students can update own lesson progress" on public."lesson_progress"
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

alter policy "lesson_vocabulary_delete" on public."lesson_vocabulary"
  using ((EXISTS ( SELECT 1
   FROM (lessons
     LEFT JOIN profiles ON ((profiles.id = (select auth.uid()))))
  WHERE ((lessons.id = lesson_vocabulary.lesson_id) AND ((lessons.created_by = (select auth.uid())) OR (lower(TRIM(BOTH FROM profiles.role)) = 'admin'::text))))));

alter policy "lesson_vocabulary_insert" on public."lesson_vocabulary"
  with check ((EXISTS ( SELECT 1
   FROM (lessons
     LEFT JOIN profiles ON ((profiles.id = (select auth.uid()))))
  WHERE ((lessons.id = lesson_vocabulary.lesson_id) AND ((lessons.created_by = (select auth.uid())) OR (lower(TRIM(BOTH FROM profiles.role)) = 'admin'::text))))));

alter policy "lesson_vocabulary_update" on public."lesson_vocabulary"
  using ((EXISTS ( SELECT 1
   FROM (lessons
     LEFT JOIN profiles ON ((profiles.id = (select auth.uid()))))
  WHERE ((lessons.id = lesson_vocabulary.lesson_id) AND ((lessons.created_by = (select auth.uid())) OR (lower(TRIM(BOTH FROM profiles.role)) = 'admin'::text))))))
  with check ((EXISTS ( SELECT 1
   FROM (lessons
     LEFT JOIN profiles ON ((profiles.id = (select auth.uid()))))
  WHERE ((lessons.id = lesson_vocabulary.lesson_id) AND ((lessons.created_by = (select auth.uid())) OR (lower(TRIM(BOTH FROM profiles.role)) = 'admin'::text))))));

alter policy "Users insert own profile" on public."profiles"
  with check (((( SELECT auth.uid() AS uid) = id) AND (email = ( SELECT ((select auth.jwt()) ->> 'email'::text))) AND (lower(TRIM(BOTH FROM role)) = ANY (ARRAY['student'::text, 'child'::text, 'teacher'::text, 'parent'::text, 'school'::text]))));

alter policy "Users update own profile" on public."profiles"
  using ((( SELECT auth.uid() AS uid) = id))
  with check (((( SELECT auth.uid() AS uid) = id) AND (email = ( SELECT ((select auth.jwt()) ->> 'email'::text))) AND ((lower(TRIM(BOTH FROM role)) = ANY (ARRAY['student'::text, 'child'::text, 'teacher'::text, 'parent'::text, 'school'::text])) OR (EXISTS ( SELECT 1
   FROM edu_admin_users a
  WHERE (a.user_id = ( SELECT auth.uid() AS uid)))))));

alter policy "Students can insert own attempts" on public."question_attempts"
  with check (((select auth.uid()) = user_id));

alter policy "Students can read own attempts" on public."question_attempts"
  using (((select auth.uid()) = user_id));

alter policy "Students can update own attempts" on public."question_attempts"
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

alter policy "Students can delete own reading passport" on public."reading_passport_entries"
  using ((student_id = (select auth.uid())));

alter policy "Students can insert own reading passport" on public."reading_passport_entries"
  with check ((student_id = (select auth.uid())));

alter policy "Students can read own reading passport" on public."reading_passport_entries"
  using ((student_id = (select auth.uid())));

alter policy "Students can update own reading passport" on public."reading_passport_entries"
  using ((student_id = (select auth.uid())))
  with check ((student_id = (select auth.uid())));

alter policy "teacher_view_own_school_link_codes" on public."school_teacher_link_codes"
  using (((teacher_id = (select auth.uid())) OR is_admin()));

alter policy "school_owner_view_teachers" on public."school_teachers"
  using ((EXISTS ( SELECT 1
   FROM schools s
  WHERE ((s.id = school_teachers.school_id) AND ((s.owner_id = (select auth.uid())) OR is_admin())))));

alter policy "school_owner_view_school" on public."schools"
  using (((owner_id = (select auth.uid())) OR is_admin()));

alter policy "Users manage own achievements" on public."student_achievements"
  using ((auth.email() = student_email))
  with check ((auth.email() = student_email));

alter policy "students can insert their own assessments" on public."student_assessments"
  with check ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "students can read their own assessments" on public."student_assessments"
  using ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "students can update their own assessments" on public."student_assessments"
  using ((student_email = ((select auth.jwt()) ->> 'email'::text)))
  with check ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "students insert own daily challenges" on public."student_daily_challenges"
  with check (((select auth.uid()) = user_id));

alter policy "students read own daily challenges" on public."student_daily_challenges"
  using (((select auth.uid()) = user_id));

alter policy "students update own daily challenges" on public."student_daily_challenges"
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

alter policy "Students manage own learning profile" on public."student_learning_profile"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "Students insert own progress" on public."student_lesson_progress"
  with check (((select auth.uid()) = student_id));

alter policy "Students read own progress" on public."student_lesson_progress"
  using (((select auth.uid()) = student_id));

alter policy "Students update own progress" on public."student_lesson_progress"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "Students insert own memory" on public."student_memory"
  with check (((select auth.uid()) = student_id));

alter policy "Students read own memory" on public."student_memory"
  using (((select auth.uid()) = student_id));

alter policy "Students update own memory" on public."student_memory"
  using (((select auth.uid()) = student_id))
  with check (((select auth.uid()) = student_id));

alter policy "student_mistakes_insert_own" on public."student_mistakes"
  with check ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))));

alter policy "student_mistakes_select_own" on public."student_mistakes"
  using ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))));

alter policy "student_mistakes_update_own" on public."student_mistakes"
  using ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))))
  with check ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))));

alter policy "students_view_own_parent_link_codes" on public."student_parent_link_codes"
  using (((student_id = (select auth.uid())) OR is_admin()));

alter policy "Students can insert own progress" on public."student_progress"
  with check ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "Students can update own progress" on public."student_progress"
  using ((student_email = ((select auth.jwt()) ->> 'email'::text)))
  with check ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "Students can view own progress" on public."student_progress"
  using ((student_email = ((select auth.jwt()) ->> 'email'::text)));

alter policy "student_recommendation_cache_delete" on public."student_recommendation_cache"
  using ((student_id = (select auth.uid())));

alter policy "student_recommendation_cache_insert" on public."student_recommendation_cache"
  with check ((student_id = (select auth.uid())));

alter policy "student_recommendation_cache_select" on public."student_recommendation_cache"
  using ((student_id = (select auth.uid())));

alter policy "student_recommendation_cache_update" on public."student_recommendation_cache"
  using ((student_id = (select auth.uid())))
  with check ((student_id = (select auth.uid())));

alter policy "Students can read own skill mastery" on public."student_skill_mastery"
  using ((student_id = (select auth.uid())));

alter policy "students insert own skill progress" on public."student_skill_progress"
  with check (((select auth.uid()) = user_id));

alter policy "students read own skill progress" on public."student_skill_progress"
  using (((select auth.uid()) = user_id));

alter policy "students update own skill progress" on public."student_skill_progress"
  using (((select auth.uid()) = user_id))
  with check (((select auth.uid()) = user_id));

alter policy "student_skills_insert_own" on public."student_skills"
  with check ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))));

alter policy "student_skills_select_own" on public."student_skills"
  using ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))));

alter policy "student_skills_update_own" on public."student_skills"
  using ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))))
  with check ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))));

alter policy "Students can read own stats" on public."student_stats"
  using ((lower(TRIM(BOTH FROM student_email)) = lower(TRIM(BOTH FROM COALESCE(((select auth.jwt()) ->> 'email'::text), ''::text)))));

alter policy "Users manage own streak" on public."student_streaks"
  using ((auth.email() = student_email))
  with check ((auth.email() = student_email));
