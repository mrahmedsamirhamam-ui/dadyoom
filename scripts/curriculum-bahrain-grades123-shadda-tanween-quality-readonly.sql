-- Read-only; do not include private answer values.
WITH t AS(
 SELECT l.id,g.grade_number,l.status,l.content,l.learning_objectives
 FROM lessons l JOIN units u ON u.id=l.unit_id JOIN grades g ON g.id=u.grade_id
 JOIN curricula cu ON cu.id=g.curriculum_id JOIN countries co ON co.id=cu.country_id
 WHERE l.title='الشدة والتنوين' AND co.code='BH' AND g.grade_number IN(1,2,3)
)
SELECT t.grade_number,t.id,t.status,length(t.content) content_chars,jsonb_array_length(t.learning_objectives) goal_count,
 (SELECT count(*) FROM questions q WHERE q.lesson_id=t.id) question_count,
 (SELECT count(*) FROM questions q WHERE q.lesson_id=t.id
  AND EXISTS(SELECT 1 FROM jsonb_array_elements(q.options) o WHERE o->>'id'=q.correct_answer)) correct_key_reference_count,
 (SELECT count(*) FROM questions q WHERE q.lesson_id=t.id AND
  (q.question LIKE 'ما المهارة الرئيسة%' OR q.question LIKE 'أي تطبيق يساعدك%' OR
  q.question LIKE 'ما الخطوة الأفضل%' OR q.question LIKE 'كيف تتحقق%')) generic_question_count,
 (SELECT count(*) FROM lesson_activities a WHERE a.lesson_id=t.id) activity_count,
 (SELECT count(*) FROM lesson_activities a WHERE a.lesson_id=t.id
  AND a.content->>'origin'='DADYOOM_BH_SHADDA_TANWEEN_G123_ORIGINAL_20261029') new_activity_count
FROM t ORDER BY t.grade_number;