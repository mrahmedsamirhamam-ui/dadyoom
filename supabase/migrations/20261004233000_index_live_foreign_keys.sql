-- Cover foreign keys used by live learning, school, marketplace and commerce flows.
-- Deferred while AI Video remains disabled:
-- lesson_ai_analysis_proposals_matched_activity_id_fkey
-- video_batch_jobs_requested_by_fkey
-- video_generation_requests_lesson_id_fkey

create index if not exists "idx_ai_tutor_messages_lesson_id_fk" on public."ai_tutor_messages" ("lesson_id");
create index if not exists "idx_assessment_session_answers_assessment_id_fk" on public."assessment_session_answers" ("assessment_id");
create index if not exists "idx_assessment_session_answers_lesson_id_fk" on public."assessment_session_answers" ("lesson_id");
create index if not exists "idx_assessment_sessions_lesson_id_fk" on public."assessment_sessions" ("lesson_id");
create index if not exists "idx_courses_category_id_fk" on public."courses" ("category_id");
create index if not exists "idx_edu_assignments_lesson_id_fk" on public."edu_assignments" ("lesson_id");
create index if not exists "idx_edu_assignments_school_id_fk" on public."edu_assignments" ("school_id");
create index if not exists "idx_edu_assignments_teacher_id_fk" on public."edu_assignments" ("teacher_id");
create index if not exists "idx_edu_conversations_student_id_fk" on public."edu_conversations" ("student_id");
create index if not exists "idx_edu_conversations_teacher_id_fk" on public."edu_conversations" ("teacher_id");
create index if not exists "idx_edu_game_attempts_lesson_id_fk" on public."edu_game_attempts" ("lesson_id");
create index if not exists "idx_edu_learner_progress_lesson_id_fk" on public."edu_learner_progress" ("lesson_id");
create index if not exists "idx_edu_lesson_notebooks_lesson_id_fk" on public."edu_lesson_notebooks" ("lesson_id");
create index if not exists "idx_edu_lessons_created_by_fk" on public."edu_lessons" ("created_by");
create index if not exists "idx_edu_marketplace_course_lessons_course_id_fk" on public."edu_marketplace_course_lessons" ("course_id");
create index if not exists "idx_edu_marketplace_purchases_course_id_fk" on public."edu_marketplace_purchases" ("course_id");
create index if not exists "idx_edu_marketplace_purchases_payment_order_id_fk" on public."edu_marketplace_purchases" ("payment_order_id");
create index if not exists "idx_edu_messages_sender_id_fk" on public."edu_messages" ("sender_id");
create index if not exists "idx_edu_payment_orders_course_id_fk" on public."edu_payment_orders" ("course_id");
create index if not exists "idx_edu_payment_orders_plan_id_fk" on public."edu_payment_orders" ("plan_id");
create index if not exists "idx_edu_point_transactions_activity_id_fk" on public."edu_point_transactions" ("activity_id");
create index if not exists "idx_edu_point_transactions_lesson_id_fk" on public."edu_point_transactions" ("lesson_id");
create index if not exists "idx_edu_rewards_class_id_fk" on public."edu_rewards" ("class_id");
create index if not exists "idx_edu_rewards_issuer_id_fk" on public."edu_rewards" ("issuer_id");
create index if not exists "idx_edu_rewards_school_id_fk" on public."edu_rewards" ("school_id");
create index if not exists "idx_edu_student_badges_badge_id_fk" on public."edu_student_badges" ("badge_id");
create index if not exists "idx_edu_subscription_events_performed_by_fk" on public."edu_subscription_events" ("performed_by");
create index if not exists "idx_edu_subscription_events_subscription_id_fk" on public."edu_subscription_events" ("subscription_id");
create index if not exists "idx_edu_subscriptions_granted_by_fk" on public."edu_subscriptions" ("granted_by");
create index if not exists "idx_edu_subscriptions_plan_id_fk" on public."edu_subscriptions" ("plan_id");
create index if not exists "idx_edu_teacher_earnings_course_id_fk" on public."edu_teacher_earnings" ("course_id");
create index if not exists "idx_edu_teacher_earnings_teacher_id_fk" on public."edu_teacher_earnings" ("teacher_id");
create index if not exists "idx_lesson_chat_messages_lesson_id_fk" on public."lesson_chat_messages" ("lesson_id");
create index if not exists "idx_lesson_mastery_lesson_id_fk" on public."lesson_mastery" ("lesson_id");
create index if not exists "idx_quiz_attempts_student_id_fk" on public."quiz_attempts" ("student_id");
create index if not exists "idx_school_interventions_created_by_fk" on public."school_interventions" ("created_by");
create index if not exists "idx_school_interventions_teacher_id_fk" on public."school_interventions" ("teacher_id");
create index if not exists "idx_student_lesson_progress_lesson_id_fk" on public."student_lesson_progress" ("lesson_id");
create index if not exists "idx_teacher_class_lessons_assigned_by_fk" on public."teacher_class_lessons" ("assigned_by");
