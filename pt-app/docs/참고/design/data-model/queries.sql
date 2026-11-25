-- 설계 검증 쿼리 v0.2: 인터뷰·PDF·앱 설명의 요구를 이 구조로 실제로 뽑을 수 있는지 확인한다.
-- 실행: python3 run_check.py > check-output.txt
--   (schema.sql + sample-data.sql을 메모리 DB에 올리고 아래 쿼리를 순서대로 실행, '-- expect:' 줄과 비교)
-- 기준: 회원 김서연(m-kim), 오늘 = 2026-10-15, 진행 중인 수업 = 13회차(s13).
--
-- 형식
--   '-- @ ' 줄이 쿼리 제목이다.
--   '-- expect: rows=N'                  결과 행 수
--   '-- expect: #k -> 열=값; 열=값'      k번째 행(1부터)의 값
--   '-- expect: 열=값 -> 열=값; 열=값'   앞 조건에 맞는 행의 값. 값 NULL은 빈 칸. 숫자는 숫자로 비교한다.
-- 문자열을 이을 때는 빈 값이 전체를 NULL로 만들지 않도록 항상 COALESCE나 iif로 감싼다.
-- 숫자 표시용 printf('%g', x)는 SQLite 함수다(40.0 → 40). PostgreSQL에서는 trim_scale(x)::text, iif는 CASE로 바꾼다.

-- @ Q1-a 브리핑: 현재 목표(여러 개, 우선순위) + 체성분 단계 + 훈련 방향 + 오늘 목표
-- expect: rows=3
-- expect: #1 -> goal_type=fat_loss; body_comp=cut; block=increase/load
-- expect: #3 -> goal_type=strength; started_on=2026-10-01
-- expect: #1 -> today_goal=hypertrophy: 후면사슬 근비대 (maintain/volume)
SELECT g.priority, g.goal_type, g.description, g.started_on,
       (SELECT phase FROM body_comp_phase WHERE member_id = 'm-kim' AND ended_on IS NULL) AS body_comp,
       (SELECT direction || '/' || COALESCE(progression_target, '-') || COALESCE(' ' || focus_target, '')
          FROM training_block WHERE member_id = 'm-kim' AND ended_on IS NULL) AS block,
       (SELECT COALESCE(session_goal_type, '-') || ': ' || COALESCE(session_goal_text, '')
               || ' (' || COALESCE(progression_intent, '-') || '/' || COALESCE(progression_target, '-') || ')'
          FROM session WHERE id = 's13') AS today_goal
FROM member_goal g
WHERE g.member_id = 'm-kim' AND g.ended_on IS NULL
ORDER BY g.priority;

-- @ Q1-b 브리핑: 열린 주의사항 + 마지막 확인 결과 + 오늘 확인했는지 (매 수업 확인)
-- expect: rows=2
-- expect: title=오른쪽 무릎 불편감 -> last_check=ok (13회차 10-15); checked_today=확인함
-- expect: title=허리 과신전 주의 -> last_check=same (12회차 10-12); checked_today=아직
SELECT n.title, n.body_region, n.created_on,
       (SELECT c.status || ' (' || COALESCE(s.session_no, '?') || '회차 ' || substr(COALESCE(s.started_at, s.scheduled_start), 6, 5) || ')'
          FROM session_caution_check c JOIN session s ON s.id = c.session_id
         WHERE c.note_id = n.id
         ORDER BY COALESCE(s.started_at, s.scheduled_start) DESC LIMIT 1) AS last_check,
       CASE WHEN EXISTS (SELECT 1 FROM session_caution_check c WHERE c.session_id = 's13' AND c.note_id = n.id)
            THEN '확인함' ELSE '아직' END AS checked_today
FROM member_note n
WHERE n.member_id = 'm-kim' AND n.kind = 'caution' AND n.status = 'open'
ORDER BY n.created_on DESC;

-- @ Q1-c 브리핑: 다음에 물어보기로 한 것 + 개인 운동/식단/생활 메모 (열린 것만)
-- expect: rows=6
-- expect: title=레그컬 마지막 세트 횟수 확인 -> kind=check; created_by=ai_suggested
-- expect: #1 -> kind=check
SELECT n.kind, n.title, COALESCE(n.detail, '') AS detail, n.created_by, n.created_on
FROM member_note n
WHERE n.member_id = 'm-kim' AND n.status = 'open' AND n.kind IN ('check', 'self_train', 'diet', 'lifestyle')
ORDER BY CASE n.kind WHEN 'check' THEN 0 ELSE 1 END, n.created_on DESC, n.id;

-- @ Q1-d 브리핑: 지난 수업(가장 최근 완료)의 컨디션, 메모, 특이 관찰
-- expect: rows=1
-- expect: #1 -> session_no=12; observations=stability:better; cond_sleep=good
SELECT s.session_no, s.started_at, s.cond_sleep, s.cond_fatigue, s.cond_soreness, s.cond_pain,
       COALESCE(s.cond_note, '') AS cond_note, COALESCE(s.memo, '') AS memo,
       (SELECT group_concat(o.kind || ':' || o.direction, ', ') FROM session_observation o WHERE o.session_id = s.id) AS observations
FROM session s
WHERE s.member_id = 'm-kim' AND s.status = 'completed'
ORDER BY COALESCE(s.started_at, s.scheduled_start) DESC
LIMIT 1;

-- @ Q1-e 브리핑: 오늘 계획 종목마다 '지난 동일 종목' 기록 — 당시 역할과 함께
-- expect: rows=3
-- expect: exercise=라잉 레그컬 -> today_role=finisher; last_date=2026-10-12; last_role=accessory; last_sets=25x12 RIR2 RPE8 / 25x12 RIR1 RPE9 / 25x10 RIR0 RPE10
-- expect: exercise=힙쓰러스트 -> today_role=main; last_role=accessory; last_date=2026-09-28
-- expect: exercise=루마니안 데드리프트 -> last_sets=40x10 RIR2 RPE8 / 40x10 RIR2 RPE8 / 35x10 RIR3 RPE7
SELECT e.name AS exercise, se.role AS today_role,
       prev.last_date, prev.last_role, prev.last_sets
FROM session_exercise se
JOIN exercise e ON e.id = se.exercise_id
LEFT JOIN (
  SELECT x.exercise_id, x.last_date, x.last_role, x.last_sets,
         ROW_NUMBER() OVER (PARTITION BY x.exercise_id ORDER BY x.last_date DESC) AS rn
  FROM (
    SELECT se2.id, se2.exercise_id, substr(COALESCE(s2.started_at, s2.scheduled_start), 1, 10) AS last_date, se2.role AS last_role,
           (SELECT group_concat(iif(st.act_weight_kg IS NULL, '-', printf('%g', st.act_weight_kg)) || 'x' || COALESCE(st.act_reps, '-')
                                || iif(st.act_rir IS NULL, '', ' RIR' || printf('%g', st.act_rir)) || iif(st.act_rpe IS NULL, '', ' RPE' || printf('%g', st.act_rpe)), ' / ')
              FROM (SELECT * FROM set_entry WHERE session_exercise_id = se2.id AND completed = 1 ORDER BY set_index) st) AS last_sets
    FROM session_exercise se2
    JOIN session s2 ON s2.id = se2.session_id
    WHERE s2.member_id = 'm-kim' AND s2.status = 'completed' AND s2.id <> 's13'
  ) x
) prev ON prev.exercise_id = se.exercise_id AND prev.rn = 1
WHERE se.session_id = 's13'
ORDER BY se.plan_order;

-- @ Q1-f 브리핑: 이전 '동일 루틴'(같은 routine_template)과 비교 — 설문 18-1 요구
-- expect: rows=2
-- expect: #1 -> session_no=13; sets=7/9
-- expect: #2 -> session_no=9; sets=8/8; total_volume_load=3200
SELECT v.session_no, substr(v.scheduled_start, 1, 10) AS date, r.name AS routine, v.status,
       v.exercise_count, v.completed_sets || '/' || v.total_sets AS sets, v.total_volume_load
FROM v_session_summary v
JOIN session s ON s.id = v.session_id
JOIN routine_template r ON r.id = s.routine_template_id
WHERE s.member_id = 'm-kim'
  AND s.routine_template_id = (SELECT routine_template_id FROM session WHERE id = 's13')
  AND s.status IN ('completed', 'in_progress')
ORDER BY v.scheduled_start DESC;

-- @ Q1-g 한눈에: 다음 PT 일정과 예정 루틴 (종목별 참고사항 포함, 앱 설명 4-5)
-- expect: rows=2
-- expect: #1 -> session_no=14; date=2026-10-19 17:00; exercise=랫풀다운; plan=3세트 35kg 10~12회; note=어깨 으쓱 없이 견갑 내리고 시작
-- expect: #2 -> exercise=시티드 로우; plan=3세트 30kg 12회; note=NULL
SELECT s.session_no, s.scheduled_start AS date, r.name AS routine, se.plan_order, e.name AS exercise, se.role,
       COALESCE(se.plan_sets, '-') || '세트 '
       || COALESCE((SELECT printf('%g', MIN(plan_weight_kg)) FROM set_entry WHERE session_exercise_id = se.id AND plan_weight_kg IS NOT NULL), '-') || 'kg '
       || COALESCE((SELECT MIN(plan_reps_min) || CASE WHEN MAX(plan_reps_max) > MIN(plan_reps_min) THEN '~' || MAX(plan_reps_max) ELSE '' END
                      FROM set_entry WHERE session_exercise_id = se.id AND plan_reps_min IS NOT NULL), '-') || '회' AS plan,
       se.note
FROM session s
LEFT JOIN routine_template r ON r.id = s.routine_template_id
JOIN session_exercise se ON se.session_id = s.id
JOIN exercise e ON e.id = se.exercise_id
WHERE s.id = (SELECT id FROM session WHERE member_id = 'm-kim' AND status = 'planned' AND scheduled_start >= '2026-10-15'
              ORDER BY scheduled_start LIMIT 1)
ORDER BY se.plan_order;

-- @ Q2 추천 입력: 오늘 각 종목 '직전까지'의 세션 내 맥락 — 인터뷰 1차-1 "앞 운동 볼륨"
-- expect: rows=3
-- expect: exercise=라잉 레그컬 -> prior_sets=7; prior_work_sets=7; prior_main_work_sets=7; prior_volume_load=3717.5; prior_min_rir_work=1; prior_avg_rir_work=1.4
-- expect: exercise=힙쓰러스트 -> prior_sets=4; prior_volume_load=1572.5
-- expect: exercise=루마니안 데드리프트 -> prior_sets=0; prior_volume_load=0
SELECT e.name AS exercise, pc.role, pc.status, pc.actual_order, pc.prior_sets, pc.prior_work_sets, pc.prior_warmup_sets,
       pc.prior_main_work_sets, pc.prior_volume_load, pc.prior_min_rir_work, pc.prior_avg_rir_work
FROM v_prior_context pc
JOIN exercise e ON e.id = pc.exercise_id
WHERE pc.session_id = 's13'
ORDER BY pc.plan_order;

-- @ Q3 추천 입력: 레그컬의 과거 기록 전체를 '역할 + 당시 선행 맥락'과 함께 (다른 역할 기록에서 오늘 역할을 추정)
-- expect: rows=3
-- expect: date=2026-09-28 -> role=warmup; prior_sets=0; sets=20x15 / 20x15
-- expect: date=2026-10-12 -> role=accessory; prior_work_sets=8; prior_main_work_sets=4; prior_volume_load=5025
-- expect: date=2026-10-15 -> role=finisher; prior_sets=7; sets=-
SELECT substr(COALESCE(s.started_at, s.scheduled_start), 1, 10) AS date, r.name AS routine, se.role, se.set_structure,
       pc.prior_sets, pc.prior_work_sets, pc.prior_main_work_sets, pc.prior_volume_load, pc.prior_avg_rir_work,
       COALESCE((SELECT group_concat(iif(st.act_weight_kg IS NULL, '-', printf('%g', st.act_weight_kg)) || 'x' || COALESCE(st.act_reps, '-')
                                     || iif(st.act_rir IS NULL, '', ' RIR' || printf('%g', st.act_rir)), ' / ')
                   FROM (SELECT * FROM set_entry WHERE session_exercise_id = se.id AND completed = 1 ORDER BY set_index) st), '-') AS sets
FROM session_exercise se
JOIN session s ON s.id = se.session_id
LEFT JOIN routine_template r ON r.id = s.routine_template_id
JOIN v_prior_context pc ON pc.session_exercise_id = se.id
WHERE s.member_id = 'm-kim' AND se.exercise_id = 'ex-legcurl' AND s.status IN ('completed', 'in_progress')
ORDER BY COALESCE(s.started_at, s.scheduled_start);

-- @ Q4 추천 출발점: 오늘 역할(마무리)의 트레이너 기본 기준. 회원 목표별 행이 있으면 그것을, 없으면 공통 행을 쓴다.
-- expect: rows=1
-- expect: #1 -> role=finisher; reps_min=15; reps_max=20; rir_min=0; rir_max=1; applies_to=공통
SELECT rd.role, COALESCE(rd.goal_type, '공통') AS applies_to, rd.reps_min, rd.reps_max, rd.rir_min, rd.rir_max,
       rd.sets_min, rd.sets_max, rd.rest_sec_min, rd.rest_sec_max, rd.note
FROM role_default rd
WHERE rd.trainer_id = 't1' AND rd.role = 'finisher'
  AND (rd.goal_type IS NULL
       OR rd.goal_type = (SELECT goal_type FROM member_goal WHERE member_id = 'm-kim' AND ended_on IS NULL ORDER BY priority LIMIT 1))
ORDER BY rd.goal_type IS NULL
LIMIT 1;

-- @ Q5 수업 기록 카드: 회차별 요약 (앱 설명 4-3: 날짜, 부위, 종목 수, 완료/전체 세트, 평균 강도, 메모)
-- expect: rows=6
-- expect: session_no=13 -> sets=7/9; status=in_progress; total_volume_load=3717.5; caution_checked=1
-- expect: session_no=12 -> sets=11/11; total_volume_load=5875; avg_rir_work=1.5
-- expect: session_no=11 -> avg_rpe_work=8.3; avg_rir_work=1.3
-- expect: session_no=10 -> total_volume_load=3250
-- expect: session_no=8 -> total_volume_load=3720
SELECT session_no, substr(scheduled_start, 1, 10) AS date, session_type, focus, status, exercise_count,
       completed_sets || '/' || total_sets AS sets, avg_rpe_work, avg_rir_work, total_volume_load, caution_checked,
       COALESCE(substr(memo, 1, 20), '') AS memo_head
FROM v_session_summary
WHERE member_id = 'm-kim' AND status IN ('completed', 'in_progress')
ORDER BY scheduled_start;

-- @ Q6 주간 부위별 볼륨 (작업 세트만, 주 = 월요일 시작)
-- expect: rows=16
-- expect: week_start=2026-10-12 -> muscle_group=glutes; weighted_sets=11
-- expect: week_start=2026-09-28 & muscle_group=hamstrings -> weighted_sets=5.5
SELECT week_start, muscle_group, weighted_sets, weighted_volume_load
FROM v_weekly_muscle_volume
WHERE member_id = 'm-kim'
ORDER BY week_start, weighted_sets DESC, muscle_group;

-- @ Q7 회차별 당시 목표·체성분 단계·훈련 방향 — 현재 값으로 덮어쓰지 않았는지, 블록 연결이 빠지지 않았는지
-- expect: rows=6
-- expect: session_no=8 -> block_by_link=NULL; block_by_date=maintain/volume; block_check=연결 없음
-- expect: session_no=10 -> goals_then=fat_loss,hypertrophy; phase_then=cut; block_check=같음
-- expect: session_no=12 -> goals_then=fat_loss,hypertrophy,strength; block_by_link=increase/load
SELECT s.session_no, substr(s.scheduled_start, 1, 10) AS date,
       (SELECT group_concat(g.goal_type, ',' ORDER BY g.priority) FROM member_goal g
         WHERE g.member_id = s.member_id AND g.started_on <= date(s.scheduled_start)
           AND (g.ended_on IS NULL OR g.ended_on >= date(s.scheduled_start))) AS goals_then,
       (SELECT p.phase FROM body_comp_phase p
         WHERE p.member_id = s.member_id AND p.started_on <= date(s.scheduled_start)
           AND (p.ended_on IS NULL OR p.ended_on >= date(s.scheduled_start))) AS phase_then,
       tb.direction || '/' || COALESCE(tb.progression_target, '-') AS block_by_link,
       (SELECT b.direction || '/' || COALESCE(b.progression_target, '-') FROM training_block b
         WHERE b.member_id = s.member_id AND b.started_on <= date(s.scheduled_start)
           AND (b.ended_on IS NULL OR b.ended_on >= date(s.scheduled_start))) AS block_by_date,
       CASE WHEN s.training_block_id IS NULL THEN '연결 없음'
            WHEN s.training_block_id = (SELECT b.id FROM training_block b
                                         WHERE b.member_id = s.member_id AND b.started_on <= date(s.scheduled_start)
                                           AND (b.ended_on IS NULL OR b.ended_on >= date(s.scheduled_start))) THEN '같음'
            ELSE '다름' END AS block_check
FROM session s
LEFT JOIN training_block tb ON tb.id = s.training_block_id
WHERE s.member_id = 'm-kim' AND s.status IN ('completed', 'in_progress')
ORDER BY s.scheduled_start;

-- @ Q8-a 피드백 루프(세트 직전 추천): 추천 vs 트레이너 결정 vs 실제, 근거 예상과의 오차 (RQ3)
-- expect: rows=3
-- expect: rec_id=rc1 -> trainer_action=accepted; decided_kg=42.5; actual_reps=8; expected_reps=8~9; error_reps=-0.5; vs_expected=within
-- expect: rec_id=rc2 -> shown=0; trainer_action=NULL; expected_reps=7~8; error_reps=0.5
-- expect: rec_id=rc4 -> trainer_action=NULL; actual_reps=NULL; vs_expected=아직
SELECT r.id AS rec_id, r.method, r.shown, r.direction, r.changed_variable,
       iif(r.rec_weight_min IS NULL, '-', printf('%g', r.rec_weight_min)) || '~' || iif(r.rec_weight_max IS NULL, '-', printf('%g', r.rec_weight_max)) AS rec_kg,
       COALESCE(r.rec_reps_min, '-') || '~' || COALESCE(r.rec_reps_max, '-') AS rec_reps,
       r.trainer_action, st.dec_weight_kg AS decided_kg, st.dec_reps_target AS decided_reps,
       st.act_weight_kg AS actual_kg, st.act_reps AS actual_reps,
       iif(x.exp_reps_low IS NULL, '-', printf('%g', x.exp_reps_low)) || '~' || iif(x.exp_reps_high IS NULL, '-', printf('%g', x.exp_reps_high)) AS expected_reps,
       CASE WHEN st.completed = 1 THEN st.act_reps - (x.exp_reps_low + x.exp_reps_high) / 2.0 END AS error_reps,
       CASE WHEN st.completed = 0 THEN '아직'
            WHEN st.act_reps < x.exp_reps_low THEN 'below'
            WHEN st.act_reps > x.exp_reps_high THEN 'above' ELSE 'within' END AS vs_expected
FROM recommendation r
JOIN set_entry st ON st.id = r.set_entry_id
LEFT JOIN expectation x ON x.id = r.expectation_id
WHERE r.trigger IN ('pre_set', 'replan_after_deviation')
ORDER BY r.id;

-- @ Q8-b 피드백 루프(루틴 작성 때 종목 단위 추천): 추천 vs 계획(plan_) — 수정·거부 이유 태그 (RQ3)
-- expect: rows=1
-- expect: rec_id=rc3 -> trainer_action=modified; rec_kg=77.5~80; plan_kg=75; rec_sets=4; plan_sets=4; reasons=["pain_caution"]
SELECT r.id AS rec_id, e.name AS exercise, r.direction, r.changed_variable,
       iif(r.rec_weight_min IS NULL, '-', printf('%g', r.rec_weight_min)) || '~' || iif(r.rec_weight_max IS NULL, '-', printf('%g', r.rec_weight_max)) AS rec_kg,
       (SELECT printf('%g', MIN(plan_weight_kg)) || CASE WHEN MAX(plan_weight_kg) > MIN(plan_weight_kg) THEN '~' || printf('%g', MAX(plan_weight_kg)) ELSE '' END
          FROM set_entry WHERE session_exercise_id = se.id) AS plan_kg,
       r.rec_sets, se.plan_sets, r.trainer_action, COALESCE(r.reject_reason_tags, '') AS reasons, COALESCE(r.trainer_feedback, '') AS feedback
FROM recommendation r
JOIN session_exercise se ON se.id = r.session_exercise_id
JOIN exercise e ON e.id = se.exercise_id
WHERE r.trigger = 'routine_plan'
ORDER BY r.id;

-- @ Q8-c 연구 비교: 같은 세트에 대한 예측 방식별 예상과 실제의 오차 (RQ1 = personal vs personal_context, RQ2 = population·recent vs personal)
-- expect: rows=5
-- expect: expectation_id=xp-sq-rec -> method=recent; error_reps=-1.5
-- expect: expectation_id=xp-sq-pop -> error_reps=0.5
-- expect: expectation_id=xp-lc12-pc -> error_reps=-2; vs_expected=below
SELECT x.id AS expectation_id, e.name AS exercise, x.method, x.at_weight_kg,
       printf('%g~%g', x.exp_reps_low, x.exp_reps_high) AS expected_reps, st.act_reps AS actual_reps,
       st.act_reps - (x.exp_reps_low + x.exp_reps_high) / 2.0 AS error_reps,
       CASE WHEN st.act_reps < x.exp_reps_low THEN 'below' WHEN st.act_reps > x.exp_reps_high THEN 'above' ELSE 'within' END AS vs_expected
FROM expectation x
JOIN set_entry st ON st.id = x.set_entry_id
JOIN session_exercise se ON se.id = x.session_exercise_id
JOIN exercise e ON e.id = se.exercise_id
WHERE st.completed = 1 AND st.act_source IN ('entered', 'confirmed_default')
ORDER BY x.set_entry_id, CASE x.method WHEN 'population' THEN 1 WHEN 'recent' THEN 2 WHEN 'personal' THEN 3 ELSE 4 END;

-- @ Q9 진행 추이: 체중·근육량·체지방 (오늘 기준 최근 3개월)
-- expect: rows=4
-- expect: #4 -> measured_on=2026-10-14; change_kg=-5.2
SELECT measured_on, weight_kg, skeletal_muscle_kg, body_fat_pct,
       ROUND(weight_kg - FIRST_VALUE(weight_kg) OVER (ORDER BY measured_on), 1) AS change_kg
FROM body_measurement
WHERE member_id = 'm-kim' AND measured_on >= date('2026-10-15', '-3 months')
ORDER BY measured_on;

-- @ Q10 기댓값 이탈 검토: 데이터상 차이(AI) + 원인 태그(트레이너) — PDF 25장
-- expect: rows=1
-- expect: #1 -> exercise=라잉 레그컬; direction=below; cause_tags=["breathing"]; actual=25x10
SELECT substr(COALESCE(s.started_at, s.scheduled_start), 1, 10) AS date, e.name AS exercise, st.set_index,
       x.method, printf('%g~%g', x.exp_reps_low, x.exp_reps_high) AS expected_reps,
       iif(st.act_weight_kg IS NULL, '-', printf('%g', st.act_weight_kg)) || 'x' || COALESCE(st.act_reps, '-') AS actual,
       d.direction, d.data_diffs_json, COALESCE(d.cause_tags, '') AS cause_tags, COALESCE(d.note, '') AS note
FROM deviation_review d
JOIN set_entry st ON st.id = d.set_entry_id
JOIN expectation x ON x.id = d.expectation_id
JOIN session_exercise se ON se.id = st.session_exercise_id
JOIN session s ON s.id = se.session_id
JOIN exercise e ON e.id = se.exercise_id
ORDER BY d.created_at;


-- @ Q11 [v0.3] 종목 카드 맨 위: 회원별 지금 기구 세팅 (가장 최근 행)
SELECT exercise_id, setting, set_on, is_trial
FROM member_exercise_setting m
WHERE member_id = 'm-kim'
  AND set_on = (SELECT MAX(set_on) FROM member_exercise_setting x WHERE x.member_id = m.member_id AND x.exercise_id = m.exercise_id);
-- expect: rows=1
-- expect: #1 -> exercise_id=ex-legpress; setting=등받이:1, 발판:3; is_trial=1

-- @ Q12 [v0.3] 다음 PT 준비: 종목별 숫자 채우기 첫 출처(아직 쓰지 않은 다음 목표)
SELECT exercise_id, target_weight_kg, target_reps
FROM next_target WHERE member_id = 'm-kim' AND used_session_id IS NULL ORDER BY exercise_id;
-- expect: rows=2
-- expect: exercise_id=ex-rdl -> target_weight_kg=62.5; target_reps=8

-- @ Q13 [v0.3] 일정 바뀐 기록 요약과 남은 등록 횟수
SELECT
  (SELECT COUNT(*) FROM session_change c JOIN session s ON s.id = c.session_id WHERE s.member_id = 'm-kim' AND c.kind = 'moved') AS moved,
  (SELECT COUNT(*) FROM session_change c JOIN session s ON s.id = c.session_id WHERE s.member_id = 'm-kim' AND c.kind IN ('cancelled','no_show')) AS cancelled,
  (SELECT SUM(sessions_n) FROM member_package WHERE member_id = 'm-kim')
  - (SELECT COUNT(*) FROM session s WHERE s.member_id = 'm-kim' AND s.status IN ('completed','in_progress'))
  - (SELECT COUNT(*) FROM session_change c JOIN session s ON s.id = c.session_id WHERE s.member_id = 'm-kim' AND c.deduct = 1) AS left_n;
-- expect: #1 -> moved=1; cancelled=1; left_n=24

-- @ Q14 [v0.3] 연습 세트를 뺀 작업 세트 볼륨 (13회차)
SELECT COUNT(*) AS work_sets, SUM(volume_load) AS vol
FROM v_set_volume WHERE session_id = 's13' AND is_work_set = 1 AND is_practice = 0;
-- expect: rows=1
-- expect: #1 -> work_sets=6

-- @ Q15 [v0.3] 종목 카드에 다시 뜨는 종목 메모
SELECT id, title, important FROM member_note
WHERE member_id = 'm-kim' AND scope = 'exercise' AND related_exercise_id = 'ex-legcurl' AND status = 'open';
-- expect: rows=1
-- expect: #1 -> id=n-ex1; important=1
