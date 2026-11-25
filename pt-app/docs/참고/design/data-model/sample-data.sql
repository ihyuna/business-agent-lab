-- 예시 데이터 v0.3 (2026-11-25, v0.2에 [v0.3] 행 추가): 가상 회원 김서연. 설계 검증용이며 숫자는 모두 가상이다.
-- 스키마: schema.sql v0.3. 실행·검사: python3 run_check.py > check-output.txt
--
-- 기준 시각: 2026-10-15 17:36. 13회차(후면사슬 루틴)가 진행 중이고 RDL·힙쓰러스트가 끝나 레그컬(마무리) 차례다.
-- 시나리오는 트레이너 인터뷰 1차-1번 예시를 그대로 옮겼다.
--   9/28 '뒷다리 루틴'에서 레그컬을 1번 워밍업 20kg으로 사용
--   → 오늘 '후면사슬 루틴'에서 레그컬을 마무리로 사용. 앞 두 종목을 끝낸 상태에서 레그컬 중량을 추천해야 한다.
-- 앱 설명 4-3의 예시(12회차 10/24, 18/18 세트)와는 다른, 새로 만든 숫자다.
--
-- 들어 있는 것: 트레이너 t1, 역할별 기준 임시값 rd1~rd6, 종목 8개, 루틴 템플릿 4개,
--               김서연 8~13회차 기록 + 14회차 예정, 메모 11개, AI 예상·추천·편차 검토 예시.
-- 1~7회차는 넣지 않았다. 생리 주기 기록은 9/20부터 시작한 것으로 둔다.
-- 일부러 넣은 경계 사례(쿼리 회귀 확인용):
--   8회차: 훈련 방향 블록 연결이 빠진 수업(Q7이 찾아냄), 레그프레스 2세트는 RIR·RPE 둘 다 입력 안 함
--   10회차: 레그컬 워밍업은 미리 채운 값을 확인만 함(act_source = confirmed_default, RIR 없음)
--   11회차: 랫풀다운은 RPE만 입력(RIR 없음)

-- ───────────── 트레이너와 설정 ─────────────
INSERT INTO trainer (id, name, effort_scale, effort_rater, created_at) VALUES
 ('t1', '담당 트레이너', 'RIR', NULL, '2026-09-01 00:00:00');   -- 척도·판단 주체는 추가질문 3번 답 대기 [O03]

-- 역할별 기본 기준: 트레이너 답변 전이라 추가질문 2번에 넣은 예시값을 임시로 쓴다. [O02]
INSERT INTO role_default (id, trainer_id, role, goal_type, reps_min, reps_max, rir_min, rir_max, sets_min, sets_max, rest_sec_min, rest_sec_max, work_sec_min, work_sec_max, tempo, note) VALUES
 ('rd1','t1','warmup',   NULL, 12, 15, 5,    NULL, 1, 2,  30,  60, NULL, NULL, NULL, '추가질문 2번 예시값(임시)'),
 ('rd2','t1','main',     NULL,  6, 10, 1,    3,    3, 5, 120, 180, NULL, NULL, NULL, '추가질문 2번 예시값(임시)'),
 ('rd3','t1','accessory',NULL,  8, 12, 1,    2,    3, 3,  60,  90, NULL, NULL, NULL, '추가질문 2번 예시값(임시)'),
 ('rd4','t1','finisher', NULL, 15, 20, 0,    1,    2, 3,  30,  60, NULL, NULL, NULL, '추가질문 2번 예시값(임시)'),
 ('rd5','t1','pump',     NULL, 15, 25, 1,    2,    2, 3,  30,  30, NULL, NULL, NULL, '추가질문 2번 예시값(임시)'),
 ('rd6','t1','circuit',  NULL, NULL, NULL, NULL, NULL, 3, 4, NULL, NULL, NULL, NULL, NULL, '여유 있게, 거의 안 쉼, 라운드 단위 (추가질문 2번 문구, 숫자는 답 대기)');

-- ───────────── 종목 ─────────────
INSERT INTO exercise (id, trainer_id, name, aliases, variant_of, movement_pattern, equipment, load_type, weight_basis, is_unilateral, e1rm_applicable) VALUES
 ('ex-squat',     NULL, '바벨 백스쿼트',     '스쿼트',       NULL, 'squat',        'barbell',    'external',   'total',            0, 1),
 ('ex-legpress',  NULL, '레그프레스',         NULL,           NULL, 'squat',        'machine',    'external',   'stack',            0, 1),
 ('ex-legcurl',   NULL, '라잉 레그컬',        '레그컬',       NULL, 'knee_flexion', 'machine',    'external',   'stack',            0, 1),
 ('ex-rdl',       NULL, '루마니안 데드리프트', 'RDL',          NULL, 'hinge',        'barbell',    'external',   'total',            0, 1),
 ('ex-hipthrust', NULL, '힙쓰러스트',         NULL,           NULL, 'hinge',        'barbell',    'external',   'total',            0, 1),
 ('ex-backext',   NULL, '백익스텐션',         NULL,           NULL, 'hinge',        'bodyweight', 'bodyweight', 'bodyweight_added', 0, 0),
 ('ex-latpull',   NULL, '랫풀다운',           NULL,           NULL, 'v_pull',       'cable',      'external',   'stack',            0, 1),
 ('ex-row',       NULL, '시티드 로우',        NULL,           NULL, 'h_pull',       'cable',      'external',   'stack',            0, 1);

INSERT INTO exercise_muscle (exercise_id, muscle_group, share) VALUES
 ('ex-squat','quads',1.0),('ex-squat','glutes',0.5),('ex-squat','adductors',0.5),
 ('ex-legpress','quads',1.0),('ex-legpress','glutes',0.5),
 ('ex-legcurl','hamstrings',1.0),
 ('ex-rdl','hamstrings',1.0),('ex-rdl','glutes',1.0),('ex-rdl','back_upper',0.5),
 ('ex-hipthrust','glutes',1.0),('ex-hipthrust','hamstrings',0.5),
 ('ex-backext','glutes',0.5),('ex-backext','hamstrings',0.5),
 ('ex-latpull','back_lats',1.0),('ex-latpull','biceps',0.5),
 ('ex-row','back_upper',1.0),('ex-row','back_lats',0.5),('ex-row','biceps',0.5);

-- ───────────── 회원과 이력 ─────────────
INSERT INTO member (id, trainer_id, name, sex, birth_year, pt_type, registered_on, status, created_at) VALUES
 ('m-kim','t1','김서연','F',2002,'장기 PT','2024-03-21','active','2024-03-21 00:00:00');

-- 동의는 이력으로 남긴다. 생리 주기 동의는 감량 시작과 함께 받았다고 가정.
INSERT INTO member_consent (id, member_id, kind, granted_at, withdrawn_at, note) VALUES
 ('cs1','m-kim','app_health','2024-03-21',NULL,'통증·체성분 기록'),
 ('cs2','m-kim','cycle',     '2026-07-01',NULL,'시작일만 기록');

-- 목표는 여러 개를 동시에. 끝난 목표(g0)도 지우지 않는다. 10/1부터 근력 목표가 추가됐다.
INSERT INTO member_goal (id, member_id, goal_type, description, priority, started_on, ended_on) VALUES
 ('g0','m-kim','general',    '운동 습관 만들기',   1,'2024-03-21','2025-12-31'),
 ('g1','m-kim','fat_loss',   '체지방 감소',        1,'2024-03-21',NULL),
 ('g2','m-kim','hypertrophy','탄탄한 하체 라인',   2,'2024-03-21',NULL),
 ('g3','m-kim','strength',   '스쿼트 중량 늘리기', 3,'2026-10-01',NULL);

INSERT INTO body_comp_phase (id, member_id, phase, started_on, ended_on) VALUES
 ('bp0','m-kim','maintain','2026-01-01','2026-06-30'),
 ('bp1','m-kim','cut',     '2026-07-01',NULL);

INSERT INTO body_measurement (id, member_id, measured_on, height_cm, weight_kg, skeletal_muscle_kg, body_fat_pct, source) VALUES
 ('bm1','m-kim','2026-07-15',163,63.4,22.0,31.5,'inbody'),
 ('bm2','m-kim','2026-08-15',163,61.6,22.1,30.0,'inbody'),
 ('bm3','m-kim','2026-09-15',163,59.9,22.0,28.6,'inbody'),
 ('bm4','m-kim','2026-10-14',163,58.2,22.1,27.1,'inbody');

-- 훈련 방향(기간). tb1이 끝나고 tb2가 새 행으로 시작한다(덮어쓰지 않음).
INSERT INTO training_block (id, member_id, direction, progression_target, focus_target, reason_tags, note, started_on, ended_on) VALUES
 ('tb1','m-kim','maintain','volume',NULL,'["diet","cycle"]','감량 기간이라 하체 볼륨 유지, 주기 후반엔 강도 조절','2026-07-01','2026-09-30'),
 ('tb2','m-kim','increase','load',  NULL,'["performance_trend"]','하체: 스쿼트 수행이 안정적이라 중량 소폭 상승 시도','2026-10-01',NULL);

INSERT INTO cycle_log (id, member_id, period_start) VALUES
 ('cy1','m-kim','2026-09-20');

INSERT INTO movement_assessment (id, member_id, session_id, assessed_on, posture_stability, learning_speed, feedback_response, rep_form_retention, force_region_note, note) VALUES
 ('ma1','m-kim',NULL,'2024-03-21',3,4,4,3,'스쿼트 시 허리로 버티는 경향','첫 수업 워밍업 기준 (척도 1~5는 임시, O06)');

-- ───────────── 루틴 템플릿 ─────────────
INSERT INTO routine_template (id, trainer_id, member_id, name, focus) VALUES
 ('rt-ham',  't1','m-kim','뒷다리 루틴',      '하체 후면'),
 ('rt-post', 't1','m-kim','후면사슬 루틴',    '후면사슬'),
 ('rt-squat','t1','m-kim','스쿼트 중심 하체', '하체'),
 ('rt-upper','t1','m-kim','상체 당기기',      '상체');

-- 템플릿은 불러오는 틀이다. 13회차는 후면사슬 루틴을 불러온 뒤 마무리 종목을 레그컬 드롭세트로 바꿨다.
INSERT INTO routine_template_item (template_id, seq, exercise_id, role, set_structure, group_label) VALUES
 ('rt-ham',  1,'ex-legcurl',  'warmup',   'straight',   NULL),
 ('rt-ham',  2,'ex-rdl',      'main',     'straight',   NULL),
 ('rt-ham',  3,'ex-hipthrust','accessory','straight',   NULL),
 ('rt-ham',  4,'ex-backext',  'finisher', 'straight',   NULL),
 ('rt-post', 1,'ex-rdl',      'main',     'straight',   NULL),
 ('rt-post', 2,'ex-hipthrust','main',     'straight',   NULL),
 ('rt-post', 3,'ex-backext',  'finisher', 'straight',   NULL),
 ('rt-squat',1,'ex-squat',    'main',     'top_backoff',NULL),
 ('rt-squat',2,'ex-legpress', 'accessory','straight',   NULL),
 ('rt-squat',3,'ex-legcurl',  'accessory','straight',   NULL),
 ('rt-upper',1,'ex-latpull',  'main',     'straight',   NULL),
 ('rt-upper',2,'ex-row',      'accessory','straight',   NULL);

-- ───────────── 수업(세션) ─────────────
-- cycle_day는 cy1(9/20 = 1일차) 기준 계산값. 9/20 이전 수업은 주기 기록이 없어 NULL.
-- 8회차 training_block_id는 일부러 비워 둠(블록 연결 누락 사례).
INSERT INTO session (id, member_id, trainer_id, session_no, routine_template_id, training_block_id,
                     scheduled_start, scheduled_end, status, started_at, ended_at, session_type, focus,
                     session_goal_type, session_goal_text, progression_intent, progression_target,
                     cond_sleep, cond_fatigue, cond_soreness, cond_pain, cond_checked_at, cond_note,
                     cycle_day, memo, summary, summary_source) VALUES
 ('s08','m-kim','t1', 8,'rt-squat',NULL,
  '2026-09-14 17:00','2026-09-14 18:00','completed','2026-09-14 17:01','2026-09-14 17:55','lower','하체',
  'hypertrophy','감량 중 하체 볼륨 유지','maintain','volume',
  'normal','normal','normal','none','2026-09-14 16:58',NULL,
  NULL,'스쿼트 할 때 허리가 과하게 젖혀짐. 다음부터 데드리프트 계열도 자세 체크',NULL,NULL),
 ('s09','m-kim','t1', 9,'rt-post','tb1',
  '2026-09-18 17:00','2026-09-18 18:00','completed','2026-09-18 17:00','2026-09-18 17:57','lower','후면사슬',
  'hypertrophy','후면 볼륨 유지','maintain','volume',
  'normal','normal','normal','none','2026-09-18 16:57',NULL,
  NULL,NULL,NULL,NULL),
 ('s10','m-kim','t1',10,'rt-ham','tb1',
  '2026-09-28 17:00','2026-09-28 18:00','completed','2026-09-28 17:02','2026-09-28 17:58','lower','하체 후면',
  'hypertrophy','감량 중 뒷다리 볼륨 유지','maintain','volume',
  'normal','poor','normal','none','2026-09-28 16:59','회사 마감으로 피곤',
  9,'RDL 3세트째 오른쪽 무릎 뒤쪽 당김 호소. 레그컬 워밍업 땐 문제 없음',
  'RDL 3세트 무게를 40→35kg로 낮춤(무릎 당김). 무릎 주의사항 새로 등록.','trainer'),
 ('s11','m-kim','t1',11,'rt-upper','tb2',
  '2026-10-08 17:00','2026-10-08 18:00','completed','2026-10-08 17:00','2026-10-08 17:55','upper','상체',
  'hypertrophy','등 볼륨','maintain','volume',
  'normal','normal','normal','none','2026-10-08 16:58',NULL,
  19,NULL,NULL,NULL),
 ('s12','m-kim','t1',12,'rt-squat','tb2',
  '2026-10-12 17:00','2026-10-12 18:00','completed','2026-10-12 17:01','2026-10-12 17:59','lower','하체 집중',
  'strength','스쿼트 중량 올려보기','increase','load',
  'good','normal','normal','none','2026-10-12 16:58',NULL,
  23,'스쿼트 42.5kg 8회 안정적. 무릎 통증 없음',
  '스쿼트 탑세트 42.5kg 8회(지난 40kg에서 증량). 레그컬 마지막 세트는 예상보다 적은 10회.','rule'),
 ('s13','m-kim','t1',13,'rt-post','tb2',
  '2026-10-15 17:00','2026-10-15 18:00','in_progress','2026-10-15 17:03',NULL,'lower','후면사슬',
  'hypertrophy','후면사슬 근비대','maintain','volume',
  'normal','normal','poor','none','2026-10-15 17:01','어제 계단 많이 걸어 종아리 뻐근',
  26,NULL,NULL,NULL),
 -- 다음 예정 수업 = 예정 루틴. 계획 숫자는 루틴 작성 때 넣음
 ('s14','m-kim','t1',14,'rt-upper','tb2',
  '2026-10-19 17:00','2026-10-19 18:00','planned',NULL,NULL,'upper','상체',
  'hypertrophy','등 볼륨 유지','maintain','volume',
  NULL,NULL,NULL,NULL,NULL,NULL,
  NULL,NULL,NULL,NULL);

-- ───────────── 회원 메모 ─────────────
INSERT INTO member_note (id, member_id, kind, title, detail, body_region, related_exercise_id, created_on,
                         created_by, accepted_at, source_session_id, due_session_id, status, resolved_on, resolved_session_id) VALUES
 ('n1', 'm-kim','caution',  '오른쪽 무릎 불편감','스쿼트·RDL 시 통증 여부 확인, 무게 조절','knee_r',  NULL,        '2026-09-28','trainer',NULL,'s10',NULL, 'open',    NULL,        NULL),
 ('n2', 'm-kim','caution',  '허리 과신전 주의',  '데드리프트 계열 자세 체크',             'low_back','ex-rdl',    '2026-09-14','trainer',NULL,'s08',NULL, 'open',    NULL,        NULL),
 ('n3', 'm-kim','caution',  '어깨 긴장',         '상체 운동 전 스트레칭 충분히',          'shoulder',NULL,        '2026-08-30','trainer',NULL,NULL, NULL, 'resolved','2026-10-08','s11'),
 ('n4', 'm-kim','check',    '스쿼트 무게 증량 확인',NULL,                                 NULL,      'ex-squat',  '2026-09-28','trainer',NULL,'s10','s12','resolved','2026-10-12','s12'),
 ('n5', 'm-kim','check',    '식단 사진 피드백',  NULL,                                    NULL,      NULL,        '2026-10-12','trainer',NULL,'s12',NULL, 'open',    NULL,        NULL),
 ('n6', 'm-kim','check',    '개인 루틴 숙지 여부 확인',NULL,                              NULL,      NULL,        '2026-10-12','trainer',NULL,'s12',NULL, 'open',    NULL,        NULL),
 ('n7', 'm-kim','self_train','주 2회 개인 유산소','퇴근 후 천국의 계단 20분',             NULL,      NULL,        '2026-10-01','trainer',NULL,NULL, NULL, 'open',    NULL,        NULL),
 ('n8', 'm-kim','diet',     '저녁 탄수 줄이는 중','단백질 목표 100g',                     NULL,      NULL,        '2026-10-05','trainer',NULL,NULL, NULL, 'open',    NULL,        NULL),
 ('n9', 'm-kim','lifestyle','월말 업무 마감',    '매달 마지막 주 수면 부족 경향',         NULL,      NULL,        '2026-09-28','trainer',NULL,'s10',NULL, 'open',    NULL,        NULL),
 -- 수업 밖에서 해결된 확인사항: 해결 수업 없이 날짜만
 ('n10','m-kim','check',    '체성분 재측정',     '10월 중순 인바디',                      NULL,      NULL,        '2026-09-28','trainer',NULL,'s10',NULL, 'resolved','2026-10-14',NULL),
 -- AI가 기록에서 제안하고 트레이너가 채택한 확인사항 (AI는 사실만 적고 판단하지 않음)
 ('n11','m-kim','check',    '레그컬 마지막 세트 횟수 확인','12회차 3세트 25kg 10회(예상 11~13회). 휴식 45초(계획 60초)', NULL,'ex-legcurl','2026-10-12','ai_suggested','2026-10-12 18:05','s12',NULL,'open',NULL,NULL);

-- 수업마다 그때 열려 있던 주의사항을 확인한 결과. 13회차는 무릎(n1)만 확인했고 허리(n2)는 아직이다.
INSERT INTO session_caution_check (session_id, note_id, status, comment) VALUES
 ('s08','n3','same',  NULL),
 ('s09','n2','ok',    NULL),
 ('s09','n3','same',  NULL),
 ('s10','n2','ok',    NULL),
 ('s10','n3','better',NULL),
 ('s11','n1','ok',    '상체 수업이라 무릎 부하 없음'),
 ('s11','n2','ok',    NULL),
 ('s11','n3','ok',    '긴장 풀림, 해결로 정리'),
 ('s12','n1','ok',    '스쿼트 중 통증 없음'),
 ('s12','n2','same',  NULL),
 ('s13','n1','ok',    NULL);

INSERT INTO session_observation (id, session_id, kind, direction, note) VALUES
 ('ob1','s10','focus',    'worse', '마감 주간이라 집중력 떨어짐'),
 ('ob2','s12','stability','better','스쿼트 바 경로 안정');

-- ───────────── 수업 안의 종목과 세트 ─────────────
-- set_entry 열 순서(모든 INSERT 동일):
--   id, 종목, 세트번호, 종류 | plan 무게, 횟수 최소, 최대, RIR | dec 무게, 목표 횟수, 목표 RIR, 휴식 |
--   act 무게, 횟수, RIR, RPE, 직전 휴식, 출처, 완료, 통증, 기록 시각

-- 8회차 (9/14 스쿼트 중심 하체): 12회차 스쿼트 추천의 근거 기록
INSERT INTO session_exercise (id, session_id, exercise_id, plan_order, actual_order, role, set_structure, tempo, plan_sets, dec_sets, plan_rest_sec, purpose_note, origin, status) VALUES
 ('se08-1','s08','ex-squat',   1,1,'main',     'straight',NULL,3,NULL,180,'하체 메인','planned','done'),
 ('se08-2','s08','ex-legpress',2,2,'accessory','straight',NULL,3,NULL, 90,'대퇴사두 볼륨','planned','done');
INSERT INTO set_entry (id, session_exercise_id, set_index, set_kind,
                       plan_weight_kg, plan_reps_min, plan_reps_max, plan_rir,
                       dec_weight_kg, dec_reps_target, dec_rir_target, dec_rest_sec,
                       act_weight_kg, act_reps, act_rir, act_rpe, rest_before_sec, act_source, completed, pain_flag, logged_at) VALUES
 ('st08-1-1','se08-1',1,'working', 40,10,10,2, 40,10,2,NULL, 40,10,2,8,NULL,'entered',1,0,NULL),
 ('st08-1-2','se08-1',2,'working', 40,10,10,2, 40,10,2,180,  40,10,2,8,180, 'entered',1,0,NULL),
 ('st08-1-3','se08-1',3,'working', 40,10,10,2, 40,10,2,180,  40,10,2,8,180, 'entered',1,0,NULL),
 ('st08-2-1','se08-2',1,'working', 70,12,12,2, 70,12,2,NULL, 70,12,2,8,NULL,'entered',1,0,NULL),
 ('st08-2-2','se08-2',2,'working', 70,12,12,2, 70,12,2,90,   70,12,NULL,NULL,90,'entered',1,0,NULL),   -- 노력도 입력 안 함
 ('st08-2-3','se08-2',3,'working', 70,12,12,2, 70,12,2,90,   70,12,1,9,90,   'entered',1,0,NULL);

-- 9회차 (9/18 후면사슬 루틴, 레그컬 없음): '이전 동일 루틴' 비교용
INSERT INTO session_exercise (id, session_id, exercise_id, plan_order, actual_order, role, set_structure, tempo, plan_sets, dec_sets, plan_rest_sec, purpose_note, origin, status) VALUES
 ('se09-1','s09','ex-rdl',      1,1,'main',    'straight',NULL,3,NULL,150,'햄스트링·둔근 메인','planned','done'),
 ('se09-2','s09','ex-hipthrust',2,2,'main',    'straight',NULL,3,NULL,120,'둔근 메인','planned','done'),
 ('se09-3','s09','ex-backext',  3,3,'finisher','straight',NULL,2,NULL, 45,'후면 털기','planned','done');
INSERT INTO set_entry (id, session_exercise_id, set_index, set_kind,
                       plan_weight_kg, plan_reps_min, plan_reps_max, plan_rir,
                       dec_weight_kg, dec_reps_target, dec_rir_target, dec_rest_sec,
                       act_weight_kg, act_reps, act_rir, act_rpe, rest_before_sec, act_source, completed, pain_flag, logged_at) VALUES
 ('st09-1-1','se09-1',1,'working', 40,10,10,2, 40,10,2,NULL, 40,10,2,8,NULL,'entered',1,0,NULL),
 ('st09-1-2','se09-1',2,'working', 40,10,10,2, 40,10,2,150,  40,10,2,8,150, 'entered',1,0,NULL),
 ('st09-1-3','se09-1',3,'working', 40,10,10,2, 40,10,2,150,  40, 9,1,9,150, 'entered',1,0,NULL),
 ('st09-2-1','se09-2',1,'working', 60,12,12,2, 60,12,2,NULL, 60,12,2,8,NULL,'entered',1,0,NULL),
 ('st09-2-2','se09-2',2,'working', 60,12,12,2, 60,12,2,120,  60,12,1,9,120, 'entered',1,0,NULL),
 ('st09-2-3','se09-2',3,'working', 60,12,12,2, 60,12,2,120,  60,10,0,10,120,'entered',1,0,NULL),
 ('st09-3-1','se09-3',1,'working',  0,20,20,1,  0,20,1,NULL,  0,20,1,9,NULL,'entered',1,0,NULL),
 ('st09-3-2','se09-3',2,'working',  0,20,20,1,  0,20,1,45,    0,17,0,10,45, 'entered',1,0,NULL);

-- 10회차 (9/28 뒷다리 루틴): 레그컬 = 1번 워밍업 20kg
INSERT INTO session_exercise (id, session_id, exercise_id, plan_order, actual_order, role, set_structure, tempo, plan_sets, dec_sets, plan_rest_sec, purpose_note, origin, status, change_reason) VALUES
 ('se10-1','s10','ex-legcurl',  1,1,'warmup',   'straight',NULL,     2,NULL, 45,'무릎 굽힘 패턴 예열','planned','done',NULL),
 ('se10-2','s10','ex-rdl',      2,2,'main',     'straight','3-1-1-0',3,NULL,150,'햄스트링 메인',     'planned','done','3세트 무릎 당김으로 무게 낮춤'),
 ('se10-3','s10','ex-hipthrust',3,3,'accessory','straight',NULL,     3,NULL, 90,'둔근 보조',         'planned','done',NULL),
 ('se10-4','s10','ex-backext',  4,4,'finisher', 'straight',NULL,     2,NULL, 45,'후면 털기',         'planned','done',NULL);
INSERT INTO set_entry (id, session_exercise_id, set_index, set_kind,
                       plan_weight_kg, plan_reps_min, plan_reps_max, plan_rir,
                       dec_weight_kg, dec_reps_target, dec_rir_target, dec_rest_sec,
                       act_weight_kg, act_reps, act_rir, act_rpe, rest_before_sec, act_source, completed, pain_flag, logged_at) VALUES
 ('st10-1-1','se10-1',1,'warmup',  20,15,15,5, 20,15,5,NULL, 20,15,NULL,NULL,NULL,'confirmed_default',1,0,NULL),
 ('st10-1-2','se10-1',2,'warmup',  20,15,15,5, 20,15,5,45,   20,15,NULL,NULL,45,  'confirmed_default',1,0,NULL),
 ('st10-2-1','se10-2',1,'working', 40,10,10,2, 40,10,2,NULL, 40,10,2,8,NULL,'entered',1,0,NULL),
 ('st10-2-2','se10-2',2,'working', 40,10,10,2, 40,10,2,150,  40,10,2,8,150, 'entered',1,0,NULL),
 ('st10-2-3','se10-2',3,'working', 40,10,10,2, 35,10,2,150,  35,10,3,7,150, 'entered',1,1,NULL),   -- 무릎 당김으로 결정 무게 35kg
 ('st10-3-1','se10-3',1,'working', 60,12,12,2, 60,12,2,NULL, 60,12,2,8,NULL,'entered',1,0,NULL),
 ('st10-3-2','se10-3',2,'working', 60,12,12,2, 60,12,2,90,   60,12,1,9,90,  'entered',1,0,NULL),
 ('st10-3-3','se10-3',3,'working', 60,12,12,2, 60,12,2,90,   60,11,0,10,90, 'entered',1,0,NULL),
 ('st10-4-1','se10-4',1,'working',  0,20,20,1,  0,20,1,NULL,  0,20,1,9,NULL,'entered',1,0,NULL),
 ('st10-4-2','se10-4',2,'working',  0,20,20,1,  0,20,1,45,    0,18,0,10,45, 'entered',1,0,NULL);

-- 11회차 (10/8 상체): 랫풀다운은 RPE만 기록
INSERT INTO session_exercise (id, session_id, exercise_id, plan_order, actual_order, role, set_structure, tempo, plan_sets, dec_sets, plan_rest_sec, purpose_note, origin, status) VALUES
 ('se11-1','s11','ex-latpull',1,1,'main',     'straight',NULL,3,NULL,120,'등 메인','planned','done'),
 ('se11-2','s11','ex-row',    2,2,'accessory','straight',NULL,3,NULL, 90,'등 보조','planned','done');
INSERT INTO set_entry (id, session_exercise_id, set_index, set_kind,
                       plan_weight_kg, plan_reps_min, plan_reps_max, plan_rir,
                       dec_weight_kg, dec_reps_target, dec_rir_target, dec_rest_sec,
                       act_weight_kg, act_reps, act_rir, act_rpe, rest_before_sec, act_source, completed, pain_flag, logged_at) VALUES
 ('st11-1-1','se11-1',1,'working', 35,10,12,2, 35,12,2,NULL, 35,12,NULL,8,NULL,'entered',1,0,NULL),
 ('st11-1-2','se11-1',2,'working', 35,10,12,2, 35,12,2,120,  35,11,NULL,8,120, 'entered',1,0,NULL),
 ('st11-1-3','se11-1',3,'working', 35,10,12,2, 35,12,2,120,  35,10,NULL,9,120, 'entered',1,0,NULL),
 ('st11-2-1','se11-2',1,'working', 30,12,12,2, 30,12,2,NULL, 30,12,2,NULL,NULL,'entered',1,0,NULL),
 ('st11-2-2','se11-2',2,'working', 30,12,12,2, 30,12,2,90,   30,12,1,NULL,90,  'entered',1,0,NULL),
 ('st11-2-3','se11-2',3,'working', 30,12,12,2, 30,12,2,90,   30,12,1,NULL,90,  'entered',1,0,NULL);

-- 12회차 (10/12 스쿼트 중심): 레그컬 = 보조
INSERT INTO session_exercise (id, session_id, exercise_id, plan_order, actual_order, role, set_structure, tempo, plan_sets, dec_sets, plan_rest_sec, purpose_note, origin, status) VALUES
 ('se12-1','s12','ex-squat',   1,1,'main',     'top_backoff','2-0-1-0',4,NULL,180,'스쿼트 중량 상승 시도','planned','done'),
 ('se12-2','s12','ex-legpress',2,2,'accessory','straight',   NULL,     4,NULL, 90,'대퇴사두 볼륨',        'planned','done'),
 ('se12-3','s12','ex-legcurl', 3,3,'accessory','straight',   NULL,     3,NULL, 60,'햄스트링 균형',        'planned','done');
-- 스쿼트 탑세트 plan_ 무게는 비워 두고 수업 중 AI 추천(rc1)을 보고 dec_로 정했다.
INSERT INTO set_entry (id, session_exercise_id, set_index, set_kind,
                       plan_weight_kg, plan_reps_min, plan_reps_max, plan_rir,
                       dec_weight_kg, dec_reps_target, dec_rir_target, dec_rest_sec,
                       act_weight_kg, act_reps, act_rir, act_rpe, rest_before_sec, act_source, completed, pain_flag, logged_at) VALUES
 ('st12-1-1','se12-1',1,'top',     NULL, 6, 8,2, 42.5, 8,2,NULL, 42.5, 8,2,8,NULL,'entered',1,0,'2026-10-12 17:12'),
 ('st12-1-2','se12-1',2,'backoff',   40, 8,10,2,   40,10,2,180,    40,10,2,8,180, 'entered',1,0,'2026-10-12 17:16'),
 ('st12-1-3','se12-1',3,'backoff',   40, 8,10,2,   40,10,2,180,    40,10,2,8,180, 'entered',1,0,'2026-10-12 17:20'),
 ('st12-1-4','se12-1',4,'backoff',   40, 8,10,2,   40,10,2,180,    40, 9,1,9,180, 'entered',1,0,'2026-10-12 17:24'),
 ('st12-2-1','se12-2',1,'working',   75,12,12,2,   75,12,2,NULL,   75,12,2,8,NULL,'entered',1,0,'2026-10-12 17:30'),
 ('st12-2-2','se12-2',2,'working',   75,12,12,2,   75,12,2,90,     75,12,2,8,90,  'entered',1,0,'2026-10-12 17:33'),
 ('st12-2-3','se12-2',3,'working',   75,12,12,2,   75,12,2,90,     75,12,1,9,90,  'entered',1,0,'2026-10-12 17:36'),
 ('st12-2-4','se12-2',4,'working',   75,12,12,2,   75,12,2,90,     75,11,1,9,90,  'entered',1,0,'2026-10-12 17:39'),
 ('st12-3-1','se12-3',1,'working',   25,12,12,2,   25,12,2,NULL,   25,12,2,8,NULL,'entered',1,0,'2026-10-12 17:44'),
 ('st12-3-2','se12-3',2,'working',   25,12,12,2,   25,12,2,60,     25,12,1,9,60,  'entered',1,0,'2026-10-12 17:46'),
 ('st12-3-3','se12-3',3,'working',   25,12,12,2,   25,12,2,60,     25,10,0,10,45, 'entered',1,0,'2026-10-12 17:48');   -- 실제 휴식 45초

-- 13회차 (오늘 10/15, 진행 중): RDL·힙쓰러스트 끝, 레그컬(마무리, 드롭세트) 차례
-- 루틴 작성 때 레그컬 숫자는 비워 뒀다. 수업 시작 뒤 AI가 처음 채우는 숫자와 트레이너 결정은 dec_로 간다.
INSERT INTO session_exercise (id, session_id, exercise_id, plan_order, actual_order, role, set_structure, tempo, plan_sets, dec_sets, plan_rest_sec, purpose_note, origin, status) VALUES
 ('se13-1','s13','ex-rdl',      1,1,   'main',    'straight','3-1-1-0',4,NULL,150,'햄스트링·둔근 메인','planned','done'),
 ('se13-2','s13','ex-hipthrust',2,2,   'main',    'straight',NULL,     3,NULL,120,'둔근 메인',         'planned','done'),
 ('se13-3','s13','ex-legcurl',  3,NULL,'finisher','drop',    NULL,     2,NULL, 45,'햄스트링 털기',     'planned','pending');
INSERT INTO set_entry (id, session_exercise_id, set_index, set_kind,
                       plan_weight_kg, plan_reps_min, plan_reps_max, plan_rir,
                       dec_weight_kg, dec_reps_target, dec_rir_target, dec_rest_sec,
                       act_weight_kg, act_reps, act_rir, act_rpe, rest_before_sec, act_source, completed, pain_flag, logged_at) VALUES
 ('st13-1-1','se13-1',1,'working', 42.5, 8,10,2, 42.5,10,2,NULL, 42.5,10,2,8,NULL,'entered',1,0,'2026-10-15 17:10'),
 ('st13-1-2','se13-1',2,'working', 42.5, 8,10,2, 42.5,10,2,150,  42.5,10,2,8,150, 'entered',1,0,'2026-10-15 17:14'),
 ('st13-1-3','se13-1',3,'working', 42.5, 8,10,2, 42.5,10,2,150,  42.5, 9,1,9,150, 'entered',1,0,'2026-10-15 17:18'),
 ('st13-1-4','se13-1',4,'working', 42.5, 8,10,2, 42.5,10,2,150,  42.5, 8,1,9,150, 'entered',1,0,'2026-10-15 17:22'),
 ('st13-2-1','se13-2',1,'working',   65,10,12,2,   65,12,2,NULL,   65,12,2,8,NULL,'entered',1,0,'2026-10-15 17:28'),
 ('st13-2-2','se13-2',2,'working',   65,10,12,2,   65,12,2,120,    65,11,1,9,120, 'entered',1,0,'2026-10-15 17:31'),
 ('st13-2-3','se13-2',3,'working',   65,10,12,2,   65,12,2,120,    65,10,1,9,120, 'entered',1,0,'2026-10-15 17:34');
-- 레그컬 두 세트는 아직 숫자 없음: 추천(rc4)은 따로 저장되고, 트레이너가 정하면 dec_가 채워진다.
INSERT INTO set_entry (id, session_exercise_id, set_index, set_kind, completed) VALUES
 ('st13-3-1','se13-3',1,'working',0),
 ('st13-3-2','se13-3',2,'drop',   0);

-- 14회차 (10/19 예정): 예정 루틴. 루틴 작성 때 정한 숫자는 plan_
INSERT INTO session_exercise (id, session_id, exercise_id, plan_order, actual_order, role, set_structure, tempo, plan_sets, dec_sets, plan_rest_sec, purpose_note, note, origin, status) VALUES
 ('se14-1','s14','ex-latpull',1,NULL,'main',     'straight',NULL,3,NULL,120,'등 메인','어깨 으쓱 없이 견갑 내리고 시작','planned','pending'),
 ('se14-2','s14','ex-row',    2,NULL,'accessory','straight',NULL,3,NULL, 90,'등 보조',NULL,'planned','pending');
INSERT INTO set_entry (id, session_exercise_id, set_index, set_kind, plan_weight_kg, plan_reps_min, plan_reps_max, plan_rir, completed) VALUES
 ('st14-1-1','se14-1',1,'working',35,10,12,2,0),('st14-1-2','se14-1',2,'working',35,10,12,2,0),('st14-1-3','se14-1',3,'working',35,10,12,2,0),
 ('st14-2-1','se14-2',1,'working',30,12,12,2,0),('st14-2-2','se14-2',2,'working',30,12,12,2,0),('st14-2-3','se14-2',3,'working',30,12,12,2,0);

-- ───────────── AI: 예상 수행, 추천, 편차 검토 ─────────────
-- (1) 12회차 스쿼트 탑세트 42.5kg: 네 방식으로 예상을 모두 계산해 두고, 화면에는 personal 추천 하나만 보여 줌.
--     근거 기록은 8회차 스쿼트 40kg x10 3세트(모두 RIR 2). 연구 비교(RQ1·RQ2)는 이 행들로 한다.
INSERT INTO expectation (id, set_entry_id, session_exercise_id, method, model_version, at_weight_kg, exp_reps_low, exp_reps_high, inputs_json) VALUES
 ('xp-sq-pop','st12-1-1','se12-1','population',      'v0',42.5,7,8, '{"e1rm_kg":56,"e1rm_from":"8회차 40kg x10 RIR2","target_rir":2}'),
 ('xp-sq-rec','st12-1-1','se12-1','recent',          'v0',42.5,9,10,'{"last_same_exercise":"8회차 40kg x10 RIR2"}'),
 ('xp-sq-per','st12-1-1','se12-1','personal',        'v0',42.5,8,9, '{"e1rm_kg":56,"member_offset_reps":0.5,"target_rir":2}'),
 ('xp-sq-pc', 'st12-1-1','se12-1','personal_context','v0',42.5,8,9, '{"e1rm_kg":56,"member_offset_reps":0.5,"role":"main","order":1,"prior_work_sets":0,"session_goal":"strength"}');

INSERT INTO recommendation (id, session_exercise_id, set_entry_id, expectation_id, trigger, method, model_version, shown,
                            direction, changed_variable, rec_weight_min, rec_weight_max, rec_reps_min, rec_reps_max, rec_sets, rec_rir, rec_rest_sec,
                            rationale, inputs_json, trainer_action, action_at, reject_reason_tags, trainer_feedback) VALUES
 ('rc1','se12-1','st12-1-1','xp-sq-per','pre_set','personal','v0',1,
  'increase','load',42.5,45,6,8,1,2,180,
  '8회차(9/14) 스쿼트 40kg 10회 3세트 모두 RIR 2. 오늘 목표가 중량 올리기라 탑세트 무게를 올리는 쪽. 무릎 주의사항은 오늘 확인함(괜찮음).',
  NULL,'accepted','2026-10-12 17:08',NULL,NULL),
 -- 같은 시점 population 방식 추천: 화면에 안 보이는 비교용 기록
 ('rc2','se12-1','st12-1-1','xp-sq-pop','pre_set','population','v0',0,
  'increase','load',42.5,42.5,7,8,1,2,180,
  NULL,NULL,NULL,NULL,NULL,NULL);

-- (2) 12회차 레그프레스: 루틴 작성 때(전날 밤) 종목 단위 추천. 트레이너가 증량 폭을 줄여 범위 밖(75kg)으로 정함 → modified
INSERT INTO recommendation (id, session_exercise_id, set_entry_id, expectation_id, trigger, method, model_version, shown,
                            direction, changed_variable, rec_weight_min, rec_weight_max, rec_reps_min, rec_reps_max, rec_sets, rec_rir, rec_rest_sec,
                            rationale, inputs_json, trainer_action, action_at, reject_reason_tags, trainer_feedback) VALUES
 ('rc3','se12-2',NULL,NULL,'routine_plan','personal','v0',1,
  'increase','load',77.5,80,10,12,4,2,90,
  '8회차(9/14) 레그프레스 70kg 12회 3세트. 이번 기간 방향이 중량 상승이라 무게를 올리는 쪽.',
  NULL,'modified','2026-10-11 21:10','["pain_caution"]','무릎 주의사항 때문에 증량 폭을 줄임');

-- (3) 12회차 레그컬 3세트: 예상 11~13회, 실제 10회 → 편차 검토. AI는 데이터 차이만, 원인 태그는 트레이너.
INSERT INTO expectation (id, set_entry_id, session_exercise_id, method, model_version, at_weight_kg, exp_reps_low, exp_reps_high, inputs_json) VALUES
 ('xp-lc12-pc','st12-3-3','se12-3','personal_context','v0',25,11,13,'{"role":"accessory","order":3,"prior_work_sets":8,"planned_rest_sec":60}');
INSERT INTO deviation_review (id, set_entry_id, expectation_id, direction, data_diffs_json, cause_tags, note) VALUES
 ('dv1','st12-3-3','xp-lc12-pc','below',
  '{"reps":{"expected":"11~13","actual":10},"rest_before_sec":{"planned":60,"actual":45}}',
  '["breathing"]','마지막 세트 호흡 끊김 (트레이너 판단)');

-- (4) 오늘 13회차 레그컬 마무리 첫 세트: 지금 화면에 떠 있는 추천. 트레이너 결정 전이라 trainer_action은 비어 있다.
INSERT INTO expectation (id, set_entry_id, session_exercise_id, method, model_version, at_weight_kg, exp_reps_low, exp_reps_high, inputs_json) VALUES
 ('xp-lc13-pc','st13-3-1','se13-3','personal_context','v0',20,15,17,'{"role":"finisher","order":3,"prior_work_sets":7,"prior_avg_rir_work":1.4,"structure":"drop"}');
INSERT INTO recommendation (id, session_exercise_id, set_entry_id, expectation_id, trigger, method, model_version, shown,
                            direction, changed_variable, rec_weight_min, rec_weight_max, rec_reps_min, rec_reps_max, rec_sets, rec_rir, rec_rest_sec,
                            rationale, inputs_json, trainer_action, action_at, reject_reason_tags, trainer_feedback) VALUES
 ('rc4','se13-3','st13-3-1','xp-lc13-pc','pre_set','personal_context','v0',1,
  'adjust','load',17.5,20,15,18,NULL,1,45,
  '레그컬 기록: 9/28 워밍업 20kg 15회 2세트, 10/12 보조 25kg 12·12·10회. 오늘은 앞에서 메인 7세트(작업 세트 평균 RIR 1.4)를 한 뒤 마무리 역할이라 마무리 기준(15~20회, RIR 0~1)에 맞춰 무게를 낮춰 시작.',
  NULL,NULL,NULL,NULL,NULL);


-- ───────────── [v0.3] 추가 예시 (가상 회원 김서연, 숫자는 모두 가상) ─────────────
-- 레그프레스 세팅: 처음 세팅 → 바꾼 세팅(시험 중). 이력으로 쌓는다.
INSERT INTO member_exercise_setting (id, member_id, exercise_id, setting, set_on, source_session_id, is_trial) VALUES
 ('mes1','m-kim','ex-legpress','등받이:2, 발판:3','2026-09-30','s10',0),
 ('mes2','m-kim','ex-legpress','등받이:1, 발판:3','2026-10-08','s12',1);

-- 13회차 끝에 정한 다음 목표. 14회차 준비 때 숫자 채우기의 첫 출처.
INSERT INTO next_target (id, member_id, exercise_id, source_session_id, target_weight_kg, target_reps, text, used_session_id) VALUES
 ('nt1','m-kim','ex-rdl','s13',62.5,8,'다음에 62.5kg 도전',NULL),
 ('nt2','m-kim','ex-hipthrust','s13',NULL,12,NULL,NULL);

-- 루틴 틀을 고친 기록: 앞 구성을 남긴다.
INSERT INTO routine_template_version (id, template_id, valid_from, items_json, note) VALUES
 ('rtv1','rt-post','2026-09-01','[{"seq":1,"exercise_id":"ex-legcurl","role":"accessory"},{"seq":2,"exercise_id":"ex-rdl","role":"main"}]','처음 구성'),
 ('rtv2','rt-post','2026-10-01','[{"seq":1,"exercise_id":"ex-rdl","role":"main"},{"seq":2,"exercise_id":"ex-legcurl","role":"finisher"}]','순서 변경');

-- 일정 변경: 옮김 1건, 취소 1건(차감 안 함). 취소된 수업은 빈 수업 행으로 둔다.
INSERT INTO session (id, member_id, trainer_id, session_no, routine_template_id, scheduled_start, status) VALUES
 ('s-cx','m-kim','t1',NULL,'rt-upper','2026-10-03 19:00','cancelled');
INSERT INTO session_change (id, session_id, kind, reason, from_start, to_start, deduct, created_at) VALUES
 ('chg1','s12','moved','work','2026-10-07 19:00','2026-10-08 19:00',0,'2026-10-06 09:00:00'),
 ('chg2','s-cx','cancelled','member',NULL,NULL,0,'2026-10-03 10:00:00');

-- 등록 횟수 30회.
INSERT INTO member_package (id, member_id, sessions_n, registered_on) VALUES ('pk1','m-kim',30,'2024-03-21');

-- 종목 메모 범위: 레그컬은 이 종목에만 다시 뜬다.
INSERT INTO member_note (id, member_id, kind, title, related_exercise_id, scope, important, created_on, source_session_id) VALUES
 ('n-ex1','m-kim','general','발끝 당기고 내릴 때 천천히','ex-legcurl','exercise',1,'2026-10-13','s13');

-- 13회차 RDL 마지막 세트를 '연습'으로 표시, 힙스러스트 1세트 느낌 'good'.
UPDATE set_entry SET is_practice = 1 WHERE id = (SELECT s.id FROM set_entry s WHERE s.session_exercise_id = 'se13-1' ORDER BY s.set_index DESC LIMIT 1);
UPDATE set_entry SET feel = 'good' WHERE id = (SELECT s.id FROM set_entry s WHERE s.session_exercise_id = 'se13-2' ORDER BY s.set_index LIMIT 1);
