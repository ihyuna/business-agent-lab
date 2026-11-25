-- PT 트레이너 의사결정 지원 앱(짐노트): 데이터 구조 v0.3 (2026-11-25)
-- 설명 문서: data-model.md (같은 폴더). 결정·열린 질문 ID(D.., O..)는 ../../decisions.md 기준.
-- v0.1 → v0.2: 2026-10-15 문서 정리 때 나온 SQL 버그·제약 누락 수정 (data-model.md 9절 변경 기록).
-- v0.2 → v0.3: 2026-11-25 수첩 기록·워크플로우 빈칸(데이터-구조.md 9절)과 웹앱 짐노트가 실제로 저장하는 것을 넣음. [v0.3] 표시.
--   트레이너 답(O01~O03)은 아직 없어 그 부분은 v0.2 그대로다.
--
-- 방언: SQLite 3.45로 검증. PostgreSQL로 옮길 때 바꿀 것:
--   * 타입: TEXT id → uuid, 날짜 TEXT → date / timestamptz, JSON TEXT → jsonb, 0/1 INTEGER → boolean
--   * 함수: group_concat → string_agg, date(x,'-3 months') → x::date - interval '3 months',
--           date(x,'-N days') 주 시작 계산 → date_trunc('week', x)::date, CAST(... AS NUMERIC)은 그대로 동작
--   * 트리거: SQLite의 SELECT RAISE(ABORT, ...) → PL/pgSQL 함수 + RAISE EXCEPTION
--   * 부분 유니크 인덱스(… WHERE …)와 식 인덱스는 두 DB 모두 지원
-- 시각 규칙:
--   * created_at 계열은 CURRENT_TIMESTAMP(UTC).
--   * 업무 시각(scheduled_start, started_at, logged_at, action_at 등)은 트레이너 현지 시각(trainer.timezone) 'YYYY-MM-DD HH:MM'.
-- 공통 규칙:
--   * id는 클라이언트(iPad)에서 만드는 UUID 문자열. MVP는 iPad 한 대 로컬 저장, 서버 동기화는 다음 버전(O15).
--   * 변하는 정보(목표, 체성분 단계, 체중, 훈련 방향, 몸 쓰는 감각)는 덮어쓰지 않고 기간·측정일로 쌓는다. (D24)
--   * 세트 한 줄에 계획(plan_) / 트레이너 결정(dec_) / 실제(act_)를 나눠 담고, AI 예상·추천은 별도 테이블. (D25)
--   * 단일 '피로 점수'나 논문 계수 하드코딩 없음. 원자료를 각각 저장한다. (D13)
--   * [미확정 Oxx] 표시는 열린 질문 답에 따라 값이나 목록이 바뀌는 부분.

PRAGMA foreign_keys = ON;

-- ───────────────────────── 1. 트레이너와 설정 ─────────────────────────

CREATE TABLE trainer (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  -- [미확정 O03] 수업 중 쓰는 노력도 척도와 판단 주체. RPE 목표나 '쉬움/적당/힘듦'을 고르면 열 추가 필요(data-model.md 6절).
  effort_scale  TEXT NOT NULL DEFAULT 'RIR' CHECK (effort_scale IN ('RIR','RPE','BOTH','SIMPLE')),
  effort_rater  TEXT CHECK (effort_rater IN ('member','trainer','mixed')),
  timezone      TEXT NOT NULL DEFAULT 'Asia/Seoul',
  created_at    TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 역할별 기본 기준. 추천 단계에서 역할에 맞는 범위를 정하는 기준이며, 논문 수치가 아니라 트레이너 본인의 기준을 넣는다. (D18)
-- 예상 수행(expectation)의 출발점은 일반 운동과학 기준(population)이고 이 표는 쓰지 않는다.
-- goal_type은 '회원 장기 목표'(member_goal.goal_type) 기준. NULL이면 모든 목표 공통. [미확정 O02]
CREATE TABLE role_default (
  id            TEXT PRIMARY KEY,
  trainer_id    TEXT NOT NULL REFERENCES trainer(id),
  role          TEXT NOT NULL CHECK (role IN ('warmup','main','accessory','finisher','pump','circuit')),
  goal_type     TEXT CHECK (goal_type IN ('hypertrophy','strength','fat_loss','endurance','rehab_posture','general')),
  reps_min      INTEGER, reps_max INTEGER,
  rir_min       REAL,    rir_max  REAL,
  sets_min      INTEGER, sets_max INTEGER,       -- circuit은 라운드 수
  rest_sec_min  INTEGER, rest_sec_max INTEGER,
  work_sec_min  INTEGER, work_sec_max INTEGER,   -- 시간 기반(circuit 등)
  tempo         TEXT,                            -- 예: '3-1-1-0' (내림-정지-올림-정지 초)
  note          TEXT,
  CHECK (reps_min IS NULL OR reps_max IS NULL OR reps_min <= reps_max),
  CHECK (rir_min  IS NULL OR rir_max  IS NULL OR rir_min  <= rir_max),
  CHECK (sets_min IS NULL OR sets_max IS NULL OR sets_min <= sets_max),
  CHECK (rest_sec_min IS NULL OR rest_sec_max IS NULL OR rest_sec_min <= rest_sec_max),
  CHECK (work_sec_min IS NULL OR work_sec_max IS NULL OR work_sec_min <= work_sec_max),
  CHECK (rir_min IS NULL OR rir_min >= 0),
  UNIQUE (trainer_id, role, goal_type)
);
-- UNIQUE는 NULL끼리 다르다고 보므로, '공통(goal_type NULL)' 행이 역할마다 하나만 있도록 따로 막는다.
CREATE UNIQUE INDEX ux_role_default_common ON role_default(trainer_id, role) WHERE goal_type IS NULL;

-- 세트 구성 종류와 숫자 규칙. 트레이너 1명 전제의 전역 코드 테이블. 기본 행은 파일 끝에서 넣는다. [미확정 O01]
CREATE TABLE set_structure (
  code          TEXT PRIMARY KEY,
  name_ko       TEXT NOT NULL,
  description   TEXT,
  rule_json     TEXT   -- 예: {"top":{"sets":1,"reps":[5,6],"rir":[1,2]},"backoff":{"load_from_top_pct":-10,"sets":3,"reps":[8,10]}}
);

-- ───────────────────────── 2. 종목 라이브러리 ─────────────────────────

CREATE TABLE exercise (
  id                TEXT PRIMARY KEY,
  trainer_id        TEXT REFERENCES trainer(id),   -- NULL이면 기본 제공 종목
  name              TEXT NOT NULL,
  aliases           TEXT,                           -- 검색용 별칭, 쉼표 구분
  variant_of        TEXT REFERENCES exercise(id),   -- 같은 계열 종목 묶음 (예: 시티드 레그컬 → 라잉 레그컬)
  movement_pattern  TEXT CHECK (movement_pattern IN ('squat','hinge','lunge','h_push','v_push','h_pull','v_pull','knee_flexion','knee_extension','isolation_upper','isolation_lower','core','carry','cardio')),
  equipment         TEXT CHECK (equipment IN ('barbell','dumbbell','machine','cable','smith','bodyweight','kettlebell','band','other')),
  load_type         TEXT NOT NULL DEFAULT 'external' CHECK (load_type IN ('external','bodyweight','assisted','time')),
  -- [미확정 O07] 무게를 어떻게 적는지: total(바 포함 전체), per_hand(덤벨 한 손), stack(머신 표시값), bodyweight_added(맨몸+추가 중량)
  -- [v0.3] per_side = 한쪽 판(봉·기구 무게 제외, 수첩 '20/20kg')
  weight_basis      TEXT CHECK (weight_basis IN ('total','per_hand','per_side','stack','bodyweight_added')),
  -- [v0.3] 적는 단위. set_entry의 *_weight_kg 칸은 이 단위로 적은 숫자를 그대로 담는다(lb는 볼륨 뷰에서 kg로 바꿈, stack·none은 볼륨 없음)
  input_unit        TEXT NOT NULL DEFAULT 'kg' CHECK (input_unit IN ('kg','lb','stack','none')),
  weight_step       REAL CHECK (weight_step IS NULL OR weight_step > 0),   -- [v0.3] 기구 무게 눈금 (+/− 한 칸, 자동 채우기는 눈금 값만)
  is_unilateral     INTEGER NOT NULL DEFAULT 0 CHECK (is_unilateral IN (0,1)),
  e1rm_applicable   INTEGER NOT NULL DEFAULT 1 CHECK (e1rm_applicable IN (0,1))
);

-- 종목이 쓰는 부위. 주간 부위별 볼륨 계산용. share: 주동근 1.0, 협응근 0.5 등.
CREATE TABLE exercise_muscle (
  exercise_id   TEXT NOT NULL REFERENCES exercise(id),
  muscle_group  TEXT NOT NULL CHECK (muscle_group IN ('quads','hamstrings','glutes','adductors','calves','chest','back_lats','back_upper','shoulders_front','shoulders_side','shoulders_rear','biceps','triceps','core','full_body')),
  share         REAL NOT NULL DEFAULT 1.0 CHECK (share > 0 AND share <= 1),
  PRIMARY KEY (exercise_id, muscle_group)
);

-- ───────────────────────── 3. 회원 (고정 정보 + 이력) ─────────────────────────

-- 거의 안 변하는 최소 식별 정보만. 성별·나이는 선택. (PDF 19·20장, D31)
CREATE TABLE member (
  id             TEXT PRIMARY KEY,
  trainer_id     TEXT NOT NULL REFERENCES trainer(id),
  name           TEXT NOT NULL,
  sex            TEXT CHECK (sex IN ('F','M','X')),
  birth_year     INTEGER CHECK (birth_year IS NULL OR birth_year BETWEEN 1900 AND 2100),
  pt_type        TEXT,                     -- 예: 장기 PT
  registered_on  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  is_self        INTEGER NOT NULL DEFAULT 0 CHECK (is_self IN (0,1)),   -- [v0.3] 트레이너 본인 운동. 연구·회원 통계에서 뺀다
  created_at     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 동의 이력. app_health = 통증·체성분 등 건강 기록, cycle = 생리 주기, research = 연구 분석 활용. [미확정 O17·O18]
-- 철회는 withdrawn_at을 채운다(행을 지우지 않음).
CREATE TABLE member_consent (
  id            TEXT PRIMARY KEY,
  member_id     TEXT NOT NULL REFERENCES member(id),
  kind          TEXT NOT NULL CHECK (kind IN ('app_health','cycle','research')),
  granted_at    TEXT NOT NULL,
  withdrawn_at  TEXT,
  note          TEXT,
  CHECK (withdrawn_at IS NULL OR withdrawn_at >= granted_at)
);
CREATE UNIQUE INDEX ux_consent_active ON member_consent(member_id, kind) WHERE withdrawn_at IS NULL;

-- 목표는 여러 개를 동시에, 이력으로. 끝난 목표는 ended_on을 채우고 지우지 않는다. (D27)
CREATE TABLE member_goal (
  id          TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES member(id),
  goal_type   TEXT NOT NULL CHECK (goal_type IN ('hypertrophy','strength','fat_loss','endurance','rehab_posture','general')),
  description TEXT,                         -- 예: 탄탄한 하체 라인
  -- [v0.3] 숫자 목표와 기한 (수첩 '3~4개월 안으로 10kg 감량'). 체중 목표는 body_measurement와 잇는다
  target_metric TEXT CHECK (target_metric IN ('body_weight','body_fat_pct','muscle_mass','lift_weight','lift_reps','other')),
  target_value  REAL,
  target_exercise_id TEXT REFERENCES exercise(id),
  due_on      TEXT,
  priority    INTEGER NOT NULL DEFAULT 1 CHECK (priority >= 1),
  started_on  TEXT NOT NULL,
  ended_on    TEXT,
  CHECK (ended_on IS NULL OR ended_on >= started_on)
);

-- 체성분 단계는 훈련 목표와 분리. 예: 감량 중 + 근력 유지 목표. (D28) 회원당 열린 기간은 하나.
CREATE TABLE body_comp_phase (
  id          TEXT PRIMARY KEY,
  member_id   TEXT NOT NULL REFERENCES member(id),
  phase       TEXT NOT NULL CHECK (phase IN ('cut','maintain','bulk')),
  started_on  TEXT NOT NULL,
  ended_on    TEXT,
  CHECK (ended_on IS NULL OR ended_on >= started_on)
);
CREATE UNIQUE INDEX ux_body_comp_open ON body_comp_phase(member_id) WHERE ended_on IS NULL;

-- 키·체중·근육량 등 측정. 진행 추이와 신규 회원 Cold Start에 사용.
CREATE TABLE body_measurement (
  id                  TEXT PRIMARY KEY,
  member_id           TEXT NOT NULL REFERENCES member(id),
  measured_on         TEXT NOT NULL,
  height_cm           REAL CHECK (height_cm IS NULL OR height_cm > 0),
  weight_kg           REAL CHECK (weight_kg IS NULL OR weight_kg > 0),
  skeletal_muscle_kg  REAL CHECK (skeletal_muscle_kg IS NULL OR skeletal_muscle_kg > 0),
  body_fat_pct        REAL CHECK (body_fat_pct IS NULL OR body_fat_pct BETWEEN 0 AND 100),
  source              TEXT CHECK (source IN ('inbody','scale','manual'))
);

-- 훈련 방향(기간). direction: increase 발전 / maintain 유지 / adjust 조절 / focus 집중. (D29)
-- progression_target: 무엇을 올리거나 지킬지. 예) maintain+volume = 볼륨 유지, increase+volume = 볼륨 상승.
-- '다이어트=볼륨 유지, 벌크=볼륨 상승'은 AI 규칙이 아니라 트레이너가 여기서 고른다. (D19)
-- reason_tags(JSON 배열): performance_trend, sleep, fatigue, diet, work_schedule, training_frequency, cycle, pain(해석)
CREATE TABLE training_block (
  id                 TEXT PRIMARY KEY,
  member_id          TEXT NOT NULL REFERENCES member(id),
  direction          TEXT NOT NULL CHECK (direction IN ('increase','maintain','adjust','focus')),
  progression_target TEXT CHECK (progression_target IN ('volume','load','reps','none')),
  focus_target       TEXT,                  -- direction='focus'일 때만: 부위/종목
  reason_tags        TEXT,
  note               TEXT,
  started_on         TEXT NOT NULL,
  ended_on           TEXT,
  CHECK (focus_target IS NULL OR direction = 'focus'),
  CHECK (ended_on IS NULL OR ended_on >= started_on)
);
CREATE UNIQUE INDEX ux_training_block_open ON training_block(member_id) WHERE ended_on IS NULL;

-- 생리 시작일만 기록(최소 수집). 주기 일차는 계산한다. cycle 동의가 유효한 회원만(트리거). [미확정 O04]
CREATE TABLE cycle_log (
  id            TEXT PRIMARY KEY,
  member_id     TEXT NOT NULL REFERENCES member(id),
  period_start  TEXT NOT NULL,
  UNIQUE (member_id, period_start)
);

-- ───────────────────────── 4. 루틴 템플릿과 수업(세션) ─────────────────────────

-- '뒷다리 루틴', '후면사슬 루틴'처럼 이름 붙은 루틴과 그 구성. 루틴 작성 화면에서 불러오는 틀. (D21)
CREATE TABLE routine_template (
  id          TEXT PRIMARY KEY,
  trainer_id  TEXT NOT NULL REFERENCES trainer(id),
  member_id   TEXT REFERENCES member(id),   -- NULL이면 공용
  name        TEXT NOT NULL,
  focus       TEXT
);

CREATE TABLE routine_template_item (
  template_id    TEXT NOT NULL REFERENCES routine_template(id),
  seq            INTEGER NOT NULL CHECK (seq >= 1),
  exercise_id    TEXT NOT NULL REFERENCES exercise(id),
  role           TEXT NOT NULL CHECK (role IN ('warmup','main','accessory','finisher','pump','circuit')),
  set_structure  TEXT NOT NULL DEFAULT 'straight' REFERENCES set_structure(code),
  group_label    TEXT,
  PRIMARY KEY (template_id, seq)
);

-- [v0.3] 루틴 틀의 판. 틀을 고치면 덮어쓰지 않고 앞 구성을 items_json으로 남긴다(D24를 틀에도). 수첩 '8/19부터', '↓ 순서 변경.'
CREATE TABLE routine_template_version (
  id           TEXT PRIMARY KEY,
  template_id  TEXT NOT NULL REFERENCES routine_template(id),
  valid_from   TEXT NOT NULL,              -- 이 구성이 쓰이기 시작한 날
  items_json   TEXT NOT NULL,              -- [{seq, exercise_id, role, set_structure}] 그때 구성
  note         TEXT,                       -- 예: 순서 변경
  UNIQUE (template_id, valid_from)
);

-- 한 번의 PT. 예정(planned) 상태로 미리 만들어 두면 그게 '예정 루틴'이다.
CREATE TABLE session (
  id                  TEXT PRIMARY KEY,
  member_id           TEXT NOT NULL REFERENCES member(id),
  trainer_id          TEXT NOT NULL REFERENCES trainer(id),
  session_no          INTEGER CHECK (session_no IS NULL OR session_no >= 1),   -- 회차
  routine_template_id TEXT REFERENCES routine_template(id),
  training_block_id   TEXT REFERENCES training_block(id),   -- 당시 훈련 방향 (블록은 끝나면 새 행으로 바뀌므로 과거 값이 유지됨)
  scheduled_start     TEXT,                 -- 일정 + 알림 기준 (현지 시각)
  scheduled_end       TEXT,
  status              TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','cancelled','no_show')),
  started_at          TEXT,                 -- 이 시점에 계획값이 고정됨(트리거)
  ended_at            TEXT,
  session_type        TEXT CHECK (session_type IN ('lower','upper','full','other')),   -- 하체/상체/전신 (앱 설명 4-3)
  focus               TEXT,                 -- 자유 문구: 하체 집중, 후면사슬 ...
  -- Trainer Intent: 오늘의 목표 (PDF 21장, 인터뷰 2차-6). 형식은 [미확정 O11]
  session_goal_type   TEXT CHECK (session_goal_type IN ('hypertrophy','strength','power','endurance','technique','recovery','general')),
  session_goal_text   TEXT,                 -- 예: 스쿼트 중량 올려보기
  progression_intent  TEXT CHECK (progression_intent IN ('increase','maintain','adjust')),
  progression_target  TEXT CHECK (progression_target IN ('volume','load','reps','none')),
  -- Pre-session Context 4항목. NULL = 아직 확인 안 함. 화면은 '평소'를 미리 선택해 두고 트레이너가 확인하면 저장. (D33)
  cond_sleep          TEXT CHECK (cond_sleep    IN ('good','normal','poor')),
  cond_fatigue        TEXT CHECK (cond_fatigue  IN ('good','normal','poor')),
  cond_soreness       TEXT CHECK (cond_soreness IN ('good','normal','poor')),
  cond_pain           TEXT CHECK (cond_pain     IN ('none','mild','notable')),
  cond_checked_at     TEXT,
  cond_note           TEXT,
  cycle_day           INTEGER CHECK (cycle_day IS NULL OR cycle_day >= 1),  -- cycle 동의 회원만(트리거)
  memo                TEXT,                 -- Session Memo
  summary             TEXT,                 -- 수업 후 요약 (기록에서 생성)
  summary_source      TEXT CHECK (summary_source IN ('rule','llm','trainer')),
  created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (member_id, session_no)
);

-- 몸 쓰는 감각 평가. 첫 수업 워밍업·테스트 세트에서, 이후 필요할 때 다시. [미확정 O06: 척도 1~5 가정]
CREATE TABLE movement_assessment (
  id                  TEXT PRIMARY KEY,
  member_id           TEXT NOT NULL REFERENCES member(id),
  session_id          TEXT REFERENCES session(id),
  assessed_on         TEXT NOT NULL,
  posture_stability   INTEGER CHECK (posture_stability BETWEEN 1 AND 5),
  learning_speed      INTEGER CHECK (learning_speed BETWEEN 1 AND 5),
  feedback_response   INTEGER CHECK (feedback_response BETWEEN 1 AND 5),
  rep_form_retention  INTEGER CHECK (rep_form_retention BETWEEN 1 AND 5),
  force_region_note   TEXT,                 -- 힘 쓰는 부위 (예: 스쿼트 시 허리로 버팀)
  note                TEXT
);

-- 회원 메모 통합. 앱 설명의 '주의사항/다음 확인사항'과 PDF의 '장기/단기 메모'를 kind로 구분. (D40)
--   caution 주의사항(통증·부상, 매 수업 확인) / check 확인사항(다음에 확인하거나 할 일. 물어보기로 한 것 포함)
--   lifestyle 생활(업무 일정 등) / self_train 개인 운동 / diet 식단 / personality 성향 / general 기타
-- 식단·생활 메모는 브리핑용이며 예측·추천 모델 입력에는 쓰지 않는다(PDF 23장). 개인 운동 메모도 지금은 브리핑용이고,
-- 기록이 없으면 '운동 안 함'이 아니라 '알 수 없음'으로 본다. (D42)
CREATE TABLE member_note (
  id                  TEXT PRIMARY KEY,
  member_id           TEXT NOT NULL REFERENCES member(id),
  -- [v0.3] to_send = 회원에게 보낼 것 (수첩 '스트레칭 영상 보내드리기')
  kind                TEXT NOT NULL CHECK (kind IN ('caution','check','lifestyle','self_train','diet','personality','general','to_send')),
  title               TEXT NOT NULL,
  detail              TEXT,
  body_region         TEXT CHECK (body_region IN ('neck','shoulder','shoulder_l','shoulder_r','upper_back','low_back','elbow','wrist','hip','hip_l','hip_r','knee','knee_l','knee_r','ankle','other')),
  related_exercise_id TEXT REFERENCES exercise(id),
  -- [v0.3] 메모가 가리키는 범위: 이 종목 / 이 분할(루틴 틀) / 회원 전체. 종목 메모는 다음에 그 종목 카드와 브리핑에 다시 뜬다
  scope               TEXT NOT NULL DEFAULT 'member' CHECK (scope IN ('exercise','split','member')),
  scope_template_id   TEXT REFERENCES routine_template(id),
  important           INTEGER NOT NULL DEFAULT 0 CHECK (important IN (0,1)),
  promoted_from_note_id TEXT REFERENCES member_note(id),   -- [v0.3] 메모를 주의사항·목표로 올렸을 때 원래 메모
  created_on          TEXT NOT NULL,
  created_by          TEXT NOT NULL DEFAULT 'trainer' CHECK (created_by IN ('trainer','ai_suggested')),
  accepted_at         TEXT,                 -- AI 제안 메모를 트레이너가 채택한 시각
  source_session_id   TEXT REFERENCES session(id),
  due_session_id      TEXT REFERENCES session(id),   -- check: 확인할 수업 (NULL이면 다음 수업)
  status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  resolved_on         TEXT,
  resolved_session_id TEXT REFERENCES session(id),
  CHECK (kind = 'caution' OR body_region IS NULL),
  CHECK (scope <> 'exercise' OR related_exercise_id IS NOT NULL),
  CHECK (scope <> 'split' OR scope_template_id IS NOT NULL),
  CHECK (kind = 'check' OR due_session_id IS NULL),
  CHECK ((status = 'open' AND resolved_on IS NULL AND resolved_session_id IS NULL)
      OR (status = 'resolved' AND resolved_on IS NOT NULL)),
  CHECK (created_by = 'trainer' OR accepted_at IS NOT NULL OR status = 'open')
);

-- 수업마다 열린 주의사항을 확인한 결과. 통증 경과가 데이터로 남는다. (D32)
CREATE TABLE session_caution_check (
  session_id  TEXT NOT NULL REFERENCES session(id),
  note_id     TEXT NOT NULL REFERENCES member_note(id),
  status      TEXT NOT NULL CHECK (status IN ('ok','same','worse','better')),
  comment     TEXT,
  PRIMARY KEY (session_id, note_id)
);

-- 특이하게 튀는 날만 남기는 관찰. (D38) 종류 목록은 [미확정 O09]
CREATE TABLE session_observation (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES session(id),
  kind        TEXT NOT NULL CHECK (kind IN ('focus','immersion','reaction','stability','recovery','other')),
  direction   TEXT NOT NULL CHECK (direction IN ('better','worse')),
  note        TEXT
);

-- ───────────────────────── 5. 수업 안의 종목과 세트 ─────────────────────────

-- 세션 안의 종목 하나. 트레이너가 사전에 고르는 것 = 종목 + 순서 + 역할 + 세트 구성 (+ 이유). (D35)
CREATE TABLE session_exercise (
  id                 TEXT PRIMARY KEY,
  session_id         TEXT NOT NULL REFERENCES session(id),
  exercise_id        TEXT NOT NULL REFERENCES exercise(id),
  plan_order         INTEGER CHECK (plan_order IS NULL OR plan_order >= 1),     -- 계획 순서 (수업 중 추가된 종목은 NULL)
  actual_order       INTEGER CHECK (actual_order IS NULL OR actual_order >= 1), -- 실제 수행 순서. 시작하는 순간 채운다
  role               TEXT NOT NULL CHECK (role IN ('warmup','main','accessory','finisher','pump','circuit')),
  set_structure      TEXT NOT NULL DEFAULT 'straight' REFERENCES set_structure(code),
  group_label        TEXT,                  -- 슈퍼세트/서킷 묶음: 'A' -> A1, A2
  tempo              TEXT,                  -- TUT. 볼륨에 곱하지 않고 따로 저장 (D20)
  plan_sets          INTEGER CHECK (plan_sets IS NULL OR plan_sets >= 1),
  dec_sets           INTEGER CHECK (dec_sets IS NULL OR dec_sets >= 1),
  plan_rest_sec      INTEGER CHECK (plan_rest_sec IS NULL OR plan_rest_sec >= 0),
  purpose_note       TEXT,                  -- 이 종목을 오늘 넣은 이유
  note               TEXT,                  -- 참고사항: 자세·통증·수행 관련 메모 [앱 설명 4-5]
  origin             TEXT NOT NULL DEFAULT 'planned' CHECK (origin IN ('planned','added_in_session')),
  status             TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','partial','skipped','replaced')),
  replaced_by_id     TEXT REFERENCES session_exercise(id),
  change_reason      TEXT,
  -- [v0.3] 빼기·바꾸기 이유 칩. not_recorded = 했지만 숫자를 안 적음(다음 채우기에 쓰지 않음)
  change_reason_tag  TEXT CHECK (change_reason_tag IN ('time','condition','pain','no_equipment','not_recorded','other')),
  alt_group          TEXT,                  -- [v0.3] '또는' 대안: 같은 값끼리 둘 중 하나 (수첩 'OHP or 머신 프레스')
  is_optional        INTEGER NOT NULL DEFAULT 0 CHECK (is_optional IN (0,1)),   -- [v0.3] 시간 되면 할 종목
  target_region      TEXT,                  -- [v0.3] 같은 종목을 목적을 달리해 두 번 할 때 이 줄의 목표 부위 (예: 상부, 광배)
  setting            TEXT,                  -- [v0.3] 그날 기구 세팅 (예: 발판:1, 밴드o). 회원별 기본은 member_exercise_setting
  note_important     INTEGER NOT NULL DEFAULT 0 CHECK (note_important IN (0,1)),   -- [v0.3] 수첩 빨간 밑줄·별표
  CHECK (change_reason_tag IS NULL OR status IN ('skipped','replaced','partial','done'))
);

-- 세트 한 줄 = 계획 / 트레이너 결정 / 실제. (D25)
-- 숫자를 쓰는 규칙 (data-model.md 3-5):
--   * 수업 전 루틴 작성 때 정한 숫자(AI 제안을 받아들인 것 포함)는 plan_. 수업 시작 뒤에는 고칠 수 없다(트리거).
--   * 수업 시작 뒤 세트 직전에 정한 숫자는 dec_. 시작 뒤에 AI가 처음 채우는 숫자도 dec_로 간다.
--   * act_는 실제 관측값. act_source로 직접 입력인지, 화면에 미리 채운 값을 확인만 했는지 남긴다.
--     RIR/RPE는 미리 채우지 않는다(입력 없으면 NULL).
CREATE TABLE set_entry (
  id                  TEXT PRIMARY KEY,
  session_exercise_id TEXT NOT NULL REFERENCES session_exercise(id),
  set_index           INTEGER NOT NULL CHECK (set_index >= 1),
  set_kind            TEXT NOT NULL DEFAULT 'working' CHECK (set_kind IN ('warmup','working','top','backoff','drop','rest_pause','amrap','test')),
  -- 계획
  plan_weight_kg      REAL    CHECK (plan_weight_kg IS NULL OR plan_weight_kg >= 0),
  plan_reps_min       INTEGER CHECK (plan_reps_min IS NULL OR plan_reps_min >= 0),
  plan_reps_max       INTEGER CHECK (plan_reps_max IS NULL OR plan_reps_max >= 0),
  plan_rir            REAL    CHECK (plan_rir IS NULL OR plan_rir >= 0),
  plan_duration_sec   INTEGER CHECK (plan_duration_sec IS NULL OR plan_duration_sec >= 0),
  -- 트레이너 결정
  dec_weight_kg       REAL    CHECK (dec_weight_kg IS NULL OR dec_weight_kg >= 0),
  dec_reps_target     INTEGER CHECK (dec_reps_target IS NULL OR dec_reps_target >= 0),
  dec_rir_target      REAL    CHECK (dec_rir_target IS NULL OR dec_rir_target >= 0),
  dec_rest_sec        INTEGER CHECK (dec_rest_sec IS NULL OR dec_rest_sec >= 0),
  dec_duration_sec    INTEGER CHECK (dec_duration_sec IS NULL OR dec_duration_sec >= 0),
  -- 실제
  act_weight_kg       REAL    CHECK (act_weight_kg IS NULL OR act_weight_kg >= 0),
  act_reps            INTEGER CHECK (act_reps IS NULL OR act_reps >= 0),
  act_rir             REAL    CHECK (act_rir IS NULL OR act_rir >= 0),         -- RIR 값만
  act_rpe             REAL    CHECK (act_rpe IS NULL OR act_rpe BETWEEN 1 AND 10),
  act_duration_sec    INTEGER CHECK (act_duration_sec IS NULL OR act_duration_sec >= 0),
  rest_before_sec     INTEGER CHECK (rest_before_sec IS NULL OR rest_before_sec >= 0),
  act_source          TEXT CHECK (act_source IN ('entered','confirmed_default')),
  completed           INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  pain_flag           INTEGER NOT NULL DEFAULT 0 CHECK (pain_flag IN (0,1)),
  -- [v0.3] 계획 범위(수첩 '30-40kg')와 숫자를 채운 기준
  plan_weight_max_kg  REAL    CHECK (plan_weight_max_kg IS NULL OR plan_weight_max_kg >= 0),
  plan_basis          TEXT CHECK (plan_basis IN ('next_target','same_split','recent','rule','weight_find','trainer')),
  -- [v0.3] 세트 느낌·연습·실패·보조 (수첩 '(easy)', '(연습)', '1개를 실패', '8reps부터 보조')
  feel                TEXT CHECK (feel IN ('easy','good','hard')),
  is_practice         INTEGER NOT NULL DEFAULT 0 CHECK (is_practice IN (0,1)),   -- 예상 보정·추정 1RM에서 뺀다
  failed_reps         INTEGER CHECK (failed_reps IS NULL OR failed_reps >= 0),
  assisted_from_rep   INTEGER CHECK (assisted_from_rep IS NULL OR assisted_from_rep >= 1),   -- 이 회부터 보조. 분석은 그 앞까지만
  technique_tags      TEXT,                  -- JSON: ["grip_change","stack_down","partial","hold","cheat","alternating"]
  note                TEXT,
  logged_at           TEXT,
  CHECK (plan_weight_max_kg IS NULL OR plan_weight_kg IS NULL OR plan_weight_kg <= plan_weight_max_kg),
  CHECK (plan_reps_min IS NULL OR plan_reps_max IS NULL OR plan_reps_min <= plan_reps_max),
  CHECK (completed = 0 OR act_source IS NOT NULL),
  UNIQUE (session_exercise_id, set_index)
);

-- ───────────────────────── 6. AI: 예상 수행, 추천, 편차 ─────────────────────────
-- 예측 방식(method) 정의와 연구질문 대응 (data-model.md 3-6):
--   population       일반 공식을 그대로 적용. 입력은 최근 수행에서 구한 e1RM뿐이고 회원별로 학습한 보정은 없다
--   recent           같은 종목의 직전 기록을 그대로 이어 씀 (공식·보정 없음)
--   personal         일반 공식 + 회원별 보정 (그 회원의 '예상 대비 실제' 기록으로 학습)
--   personal_context personal + 오늘 맥락(역할·노력도·선행 수행·목적)
--   RQ1 = personal vs personal_context, RQ2 = population·recent vs personal

-- Expected Performance: "이 무게면 몇 회 가능할까". 추천과 분리한다. (D14)
CREATE TABLE expectation (
  id                  TEXT PRIMARY KEY,
  set_entry_id        TEXT REFERENCES set_entry(id),
  session_exercise_id TEXT NOT NULL REFERENCES session_exercise(id),
  method              TEXT NOT NULL CHECK (method IN ('population','recent','personal','personal_context')),
  model_version       TEXT NOT NULL,
  at_weight_kg        REAL NOT NULL CHECK (at_weight_kg >= 0),
  exp_reps_low        REAL NOT NULL CHECK (exp_reps_low >= 0),
  exp_reps_high       REAL NOT NULL,
  inputs_json         TEXT,                 -- 계산에 쓴 입력 스냅샷 → 재현 가능
  created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (exp_reps_low <= exp_reps_high)
);
CREATE UNIQUE INDEX ux_expectation_once ON expectation(COALESCE(set_entry_id, session_exercise_id), method, model_version, at_weight_kg);

-- AI Recommendation: "오늘 목적에 맞게 얼마나 시킬까". (PDF 12.2, 15장)
-- trainer_action 정의: accepted = 결정값이 추천 범위 안 / modified = 범위 밖이거나 다른 변수를 바꿈 / rejected = 추천과 다른 방향으로 감
CREATE TABLE recommendation (
  id                  TEXT PRIMARY KEY,
  session_exercise_id TEXT NOT NULL REFERENCES session_exercise(id),
  set_entry_id        TEXT REFERENCES set_entry(id),   -- NULL이면 종목 전체(루틴 작성 시) 추천
  expectation_id      TEXT REFERENCES expectation(id), -- 근거가 된 예상 수행
  trigger             TEXT NOT NULL CHECK (trigger IN ('routine_plan','pre_set','replan_after_deviation')),
  method              TEXT NOT NULL CHECK (method IN ('population','recent','personal','personal_context')),
  model_version       TEXT NOT NULL,
  shown               INTEGER NOT NULL DEFAULT 0 CHECK (shown IN (0,1)),  -- 화면에 보여준 추천. 나머지는 비교용 기록
  direction           TEXT CHECK (direction IN ('increase','maintain','adjust')),
  changed_variable    TEXT CHECK (changed_variable IN ('load','reps','sets','effort','rest','none')),
  rec_weight_min      REAL, rec_weight_max REAL,
  rec_reps_min        INTEGER, rec_reps_max INTEGER,
  rec_sets            INTEGER CHECK (rec_sets IS NULL OR rec_sets >= 1),
  rec_rir             REAL CHECK (rec_rir IS NULL OR rec_rir >= 0),
  rec_rest_sec        INTEGER CHECK (rec_rest_sec IS NULL OR rec_rest_sec >= 0),
  rationale           TEXT,                 -- 근거 문장 (데이터에 있는 사실만)
  inputs_json         TEXT,
  trainer_action      TEXT CHECK (trainer_action IN ('accepted','modified','rejected')),
  action_at           TEXT,
  reject_reason_tags  TEXT,                 -- JSON: ["condition","pain_caution","purpose_mismatch","too_heavy","too_light"]
  trainer_feedback    TEXT,
  created_at          TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (rec_weight_min IS NULL OR rec_weight_max IS NULL OR rec_weight_min <= rec_weight_max),
  CHECK (rec_reps_min IS NULL OR rec_reps_max IS NULL OR rec_reps_min <= rec_reps_max),
  CHECK (shown = 1 OR trainer_action IS NULL)
);
-- 같은 대상·같은 시점에 화면에 보이는 추천은 하나. 이탈 후 재추천은 여러 번 가능(가장 최근 것이 표시).
CREATE UNIQUE INDEX ux_rec_shown ON recommendation(COALESCE(set_entry_id, session_exercise_id), trigger)
  WHERE shown = 1 AND trigger <> 'replan_after_deviation';

-- 기댓값 이탈 검토. AI는 데이터상 차이만, 원인은 트레이너가 태그. (D16)
-- cause_tags(JSON): breathing 호흡, force_pattern 힘 쓰는 방식, neural 신경계(트레이너 판단), condition, sleep, pain, unknown
--   [v0.3] + rest_short 휴식 부족, rom 가동범위, tension 텐션 유지 (수첩 '호흡, 가동범위, 텐션유지')
CREATE TABLE deviation_review (
  id              TEXT PRIMARY KEY,
  set_entry_id    TEXT NOT NULL REFERENCES set_entry(id),
  expectation_id  TEXT NOT NULL REFERENCES expectation(id),
  direction       TEXT NOT NULL CHECK (direction IN ('below','above')),
  data_diffs_json TEXT,
  cause_tags      TEXT,
  note            TEXT,
  created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ───────────────────────── [v0.3] 6. 회원별 기구 세팅 · 다음 목표 · 일정 변경 · 등록 횟수 ─────────────────────────

-- 회원 × 종목 기구 세팅 이력. 바뀌면 새 행(덮어쓰지 않음). 수첩: 같은 세팅을 3~8번 되풀이, "(발판: 3)".
CREATE TABLE member_exercise_setting (
  id                TEXT PRIMARY KEY,
  member_id         TEXT NOT NULL REFERENCES member(id),
  exercise_id       TEXT NOT NULL REFERENCES exercise(id),
  setting           TEXT NOT NULL,          -- 예: 패드:4, 의자:6 / 밴드o, 등받이x
  set_on            TEXT NOT NULL,
  source_session_id TEXT REFERENCES session(id),
  is_trial          INTEGER NOT NULL DEFAULT 0 CHECK (is_trial IN (0,1)),   -- 시험 중인 세팅 ("5,5로 해보기")
  UNIQUE (member_id, exercise_id, set_on)
);

-- 수업 끝에 정하는 종목별 다음 목표. 다음 같은 분할 준비 때 숫자 채우기의 첫 출처(plan_basis = next_target).
-- 수첩: "60kg 도전 예정", "(30 예정)", "다음에 70kg".
CREATE TABLE next_target (
  id                TEXT PRIMARY KEY,
  member_id         TEXT NOT NULL REFERENCES member(id),
  exercise_id       TEXT NOT NULL REFERENCES exercise(id),
  source_session_id TEXT NOT NULL REFERENCES session(id),
  target_weight_kg  REAL CHECK (target_weight_kg IS NULL OR target_weight_kg >= 0),
  target_reps       INTEGER CHECK (target_reps IS NULL OR target_reps >= 0),
  text              TEXT,
  used_session_id   TEXT REFERENCES session(id),   -- 이 목표로 숫자를 채운 수업
  CHECK (target_weight_kg IS NOT NULL OR target_reps IS NOT NULL OR text IS NOT NULL),
  UNIQUE (source_session_id, exercise_id)
);

-- 일정 바뀐 기록 (D73). 되돌리면 행을 지우고 session.status를 planned로.
-- deduct = 취소·안 옴을 등록 횟수에서 뺄지(트레이너가 정함). 30일 요약·회원별 수는 저장하지 않고 계산한다.
CREATE TABLE session_change (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES session(id),
  kind        TEXT NOT NULL CHECK (kind IN ('cancelled','no_show','moved')),
  reason      TEXT CHECK (reason IN ('member','pain','work','no_contact','trainer','other')),
  from_start  TEXT,
  to_start    TEXT,
  deduct      INTEGER NOT NULL DEFAULT 0 CHECK (deduct IN (0,1)),
  created_at  TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((kind = 'moved') = (from_start IS NOT NULL AND to_start IS NOT NULL)),
  CHECK (kind <> 'moved' OR deduct = 0)
);

-- 등록 횟수(회차권). 남은 횟수 = 합계 − (완료·진행 중 + 차감한 취소·안 옴). 저장하지 않고 계산.
CREATE TABLE member_package (
  id             TEXT PRIMARY KEY,
  member_id      TEXT NOT NULL REFERENCES member(id),
  sessions_n     INTEGER NOT NULL CHECK (sessions_n >= 1),
  registered_on  TEXT NOT NULL
);

-- ───────────────────────── 7. 정합성 트리거 ─────────────────────────

-- 생리 주기: cycle 동의가 유효한 회원만
CREATE TRIGGER trg_cycle_log_consent BEFORE INSERT ON cycle_log
WHEN NOT EXISTS (SELECT 1 FROM member_consent c WHERE c.member_id = NEW.member_id AND c.kind = 'cycle' AND c.withdrawn_at IS NULL)
BEGIN SELECT RAISE(ABORT, 'cycle consent required'); END;

CREATE TRIGGER trg_session_cycle_consent_ins BEFORE INSERT ON session
WHEN NEW.cycle_day IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM member_consent c WHERE c.member_id = NEW.member_id AND c.kind = 'cycle' AND c.withdrawn_at IS NULL)
BEGIN SELECT RAISE(ABORT, 'cycle consent required'); END;

CREATE TRIGGER trg_session_cycle_consent_upd BEFORE UPDATE OF cycle_day ON session
WHEN NEW.cycle_day IS NOT NULL
 AND NOT EXISTS (SELECT 1 FROM member_consent c WHERE c.member_id = NEW.member_id AND c.kind = 'cycle' AND c.withdrawn_at IS NULL)
BEGIN SELECT RAISE(ABORT, 'cycle consent required'); END;

-- 계획값 고정 (D36): 수업이 시작된 뒤에는 이미 채워진 계획값을 바꿀 수 없다.
--   세트: plan_weight_kg, plan_reps_min, plan_reps_max, plan_rir, plan_duration_sec
--   종목: plan_sets, plan_rest_sec, plan_order
--   비어 있던 계획 칸은 시작 뒤에도 채우지 않는다(시작 뒤 숫자는 dec_). 이 규칙은 앱에서 지킨다.
CREATE TRIGGER trg_plan_frozen BEFORE UPDATE ON set_entry
WHEN (SELECT s.started_at FROM session s JOIN session_exercise se ON se.session_id = s.id WHERE se.id = NEW.session_exercise_id) IS NOT NULL
 AND ((OLD.plan_weight_kg    IS NOT NULL AND NEW.plan_weight_kg    IS NOT OLD.plan_weight_kg)
   OR (OLD.plan_reps_min     IS NOT NULL AND NEW.plan_reps_min     IS NOT OLD.plan_reps_min)
   OR (OLD.plan_reps_max     IS NOT NULL AND NEW.plan_reps_max     IS NOT OLD.plan_reps_max)
   OR (OLD.plan_rir          IS NOT NULL AND NEW.plan_rir          IS NOT OLD.plan_rir)
   OR (OLD.plan_duration_sec IS NOT NULL AND NEW.plan_duration_sec IS NOT OLD.plan_duration_sec))
BEGIN SELECT RAISE(ABORT, 'plan values are frozen after session start'); END;

CREATE TRIGGER trg_plan_frozen_exercise BEFORE UPDATE ON session_exercise
WHEN (SELECT started_at FROM session WHERE id = NEW.session_id) IS NOT NULL
 AND ((OLD.plan_sets     IS NOT NULL AND NEW.plan_sets     IS NOT OLD.plan_sets)
   OR (OLD.plan_rest_sec IS NOT NULL AND NEW.plan_rest_sec IS NOT OLD.plan_rest_sec)
   OR (OLD.plan_order    IS NOT NULL AND NEW.plan_order    IS NOT OLD.plan_order))
BEGIN SELECT RAISE(ABORT, 'plan values are frozen after session start'); END;

-- 회원 전용 루틴 템플릿은 그 회원의 수업에서만 (공용 템플릿은 member_id NULL)
CREATE TRIGGER trg_session_template_member BEFORE INSERT ON session
WHEN NEW.routine_template_id IS NOT NULL
 AND (SELECT member_id FROM routine_template WHERE id = NEW.routine_template_id) IS NOT NULL
 AND (SELECT member_id FROM routine_template WHERE id = NEW.routine_template_id) <> NEW.member_id
BEGIN SELECT RAISE(ABORT, 'routine template belongs to another member'); END;

-- 주의사항 확인은 같은 회원의 caution 메모에만
CREATE TRIGGER trg_caution_check_kind BEFORE INSERT ON session_caution_check
WHEN NOT EXISTS (SELECT 1 FROM member_note n JOIN session s ON s.member_id = n.member_id
                 WHERE n.id = NEW.note_id AND s.id = NEW.session_id AND n.kind = 'caution')
BEGIN SELECT RAISE(ABORT, 'caution check must reference a caution note of the same member'); END;

-- 예상·추천의 세트는 가리킨 종목에 속해야 함
CREATE TRIGGER trg_expectation_set_match BEFORE INSERT ON expectation
WHEN NEW.set_entry_id IS NOT NULL
 AND (SELECT session_exercise_id FROM set_entry WHERE id = NEW.set_entry_id) IS NOT NEW.session_exercise_id
BEGIN SELECT RAISE(ABORT, 'expectation set/exercise mismatch'); END;

CREATE TRIGGER trg_recommendation_set_match BEFORE INSERT ON recommendation
WHEN NEW.set_entry_id IS NOT NULL
 AND (SELECT session_exercise_id FROM set_entry WHERE id = NEW.set_entry_id) IS NOT NEW.session_exercise_id
BEGIN SELECT RAISE(ABORT, 'recommendation set/exercise mismatch'); END;

CREATE TRIGGER trg_deviation_match BEFORE INSERT ON deviation_review
WHEN (SELECT set_entry_id FROM expectation WHERE id = NEW.expectation_id) IS NOT NEW.set_entry_id
BEGIN SELECT RAISE(ABORT, 'deviation_review set/expectation mismatch'); END;

-- ───────────────────────── 8. 인덱스 ─────────────────────────

CREATE INDEX ix_session_member_time   ON session(member_id, scheduled_start);
CREATE INDEX ix_se_session_order      ON session_exercise(session_id, actual_order);
CREATE INDEX ix_se_exercise           ON session_exercise(exercise_id);
CREATE INDEX ix_set_se                ON set_entry(session_exercise_id, set_index);
CREATE INDEX ix_note_member_kind      ON member_note(member_id, kind, status);
CREATE INDEX ix_caution_check_note    ON session_caution_check(note_id);
CREATE INDEX ix_goal_member           ON member_goal(member_id, started_on);
CREATE INDEX ix_measure_member        ON body_measurement(member_id, measured_on);
CREATE INDEX ix_block_member          ON training_block(member_id, started_on);
CREATE INDEX ix_expectation_set       ON expectation(set_entry_id, method);
CREATE INDEX ix_rec_se                ON recommendation(session_exercise_id);
CREATE INDEX ix_rec_set               ON recommendation(set_entry_id);
CREATE INDEX ix_setting_member_ex     ON member_exercise_setting(member_id, exercise_id, set_on);   -- [v0.3]
CREATE INDEX ix_next_target_member_ex ON next_target(member_id, exercise_id);                       -- [v0.3]
CREATE INDEX ix_change_session        ON session_change(session_id);                                -- [v0.3]

-- ───────────────────────── 9. 파생 값 (뷰) ─────────────────────────
-- 원자료만 저장하고 요약값은 계산한다. (D26)
-- '작업 세트' = 역할이 워밍업이 아니고 세트 종류도 워밍업이 아닌 완료 세트.

-- 세트별 볼륨 로드(중량 x 횟수). 외부 중량 종목만 계산하고 맨몸·보조·시간 종목은 NULL [미확정 O16]. TUT는 곱하지 않는다.
CREATE VIEW v_set_volume AS
SELECT s.id AS set_id, se.id AS session_exercise_id, se.session_id, se.exercise_id, se.role,
       COALESCE(se.actual_order, se.plan_order) AS ex_order, s.set_index, s.set_kind,
       s.act_weight_kg, s.act_reps, s.act_rir, s.act_rpe, s.rest_before_sec,
       CASE WHEN se.role <> 'warmup' AND s.set_kind <> 'warmup' THEN 1 ELSE 0 END AS is_work_set,
       -- [v0.3] lb는 kg로 바꾸고, 머신 번호(stack)·단위 없음(none)은 볼륨을 비운다. 보조가 붙은 세트는 보조 전까지만
       CASE WHEN e.load_type = 'external' AND e.input_unit IN ('kg','lb')
            THEN COALESCE(s.act_weight_kg, 0) * CASE e.input_unit WHEN 'lb' THEN 0.45359237 ELSE 1 END
                 * COALESCE(CASE WHEN s.assisted_from_rep IS NOT NULL THEN MIN(s.act_reps, s.assisted_from_rep - 1) ELSE s.act_reps END, 0) END AS volume_load,
       s.is_practice
FROM set_entry s
JOIN session_exercise se ON se.id = s.session_exercise_id
JOIN exercise e          ON e.id = se.exercise_id
WHERE s.completed = 1;

-- 수업 기록 카드: 종목 수, 완료/전체 세트, 작업 세트 평균 RPE·RIR, 총 볼륨(작업 세트·외부 중량만), 주의사항 확인 여부.
-- 전체 세트 = 건너뛰거나 교체되지 않은 종목의 세트 행 + 그 밖의 완료 세트. 진행 중이면 '7/9'처럼 보인다.
CREATE VIEW v_session_summary AS
SELECT ses.id AS session_id, ses.member_id, ses.session_no, ses.scheduled_start, ses.session_type, ses.focus, ses.status,
       (SELECT COUNT(*) FROM session_exercise se WHERE se.session_id = ses.id AND se.status NOT IN ('skipped','replaced')) AS exercise_count,
       (SELECT COUNT(*) FROM set_entry s JOIN session_exercise se ON se.id = s.session_exercise_id
          WHERE se.session_id = ses.id AND (s.completed = 1 OR se.status NOT IN ('skipped','replaced'))) AS total_sets,
       (SELECT COUNT(*) FROM set_entry s JOIN session_exercise se ON se.id = s.session_exercise_id
          WHERE se.session_id = ses.id AND s.completed = 1) AS completed_sets,
       (SELECT ROUND(CAST(AVG(v.act_rpe) AS NUMERIC), 1) FROM v_set_volume v WHERE v.session_id = ses.id AND v.is_work_set = 1) AS avg_rpe_work,
       (SELECT ROUND(CAST(AVG(v.act_rir) AS NUMERIC), 1) FROM v_set_volume v WHERE v.session_id = ses.id AND v.is_work_set = 1) AS avg_rir_work,
       (SELECT SUM(v.volume_load) FROM v_set_volume v WHERE v.session_id = ses.id AND v.is_work_set = 1) AS total_volume_load,
       EXISTS (SELECT 1 FROM session_caution_check c WHERE c.session_id = ses.id) AS caution_checked,
       ses.memo
FROM session ses;

-- 각 종목 '직전까지'의 세션 내 누적 맥락. 추천 엔진의 현재 세션 맥락 입력. (D21)
-- 아직 시작 안 한 종목(actual_order NULL)은 같은 수업에서 이미 끝난 다른 종목의 세트 전부가 선행이다.
-- 시작했거나 끝난 종목은 실제 순서가 더 앞선 종목의 세트가 선행이다. 같은 묶음(슈퍼세트) 안 순서는 세트 단위 쿼리로 따로 본다.
CREATE VIEW v_prior_context AS
SELECT se.id AS session_exercise_id, se.session_id, se.exercise_id, se.role, se.status,
       se.actual_order, se.plan_order,
       COUNT(v.set_id)                                                   AS prior_sets,
       COALESCE(SUM(v.is_work_set), 0)                                   AS prior_work_sets,
       COALESCE(SUM(CASE WHEN v.role = 'warmup' OR v.set_kind = 'warmup' THEN 1 ELSE 0 END), 0) AS prior_warmup_sets,
       COALESCE(SUM(CASE WHEN v.role = 'main' AND v.is_work_set = 1 THEN 1 ELSE 0 END), 0)     AS prior_main_work_sets,
       COALESCE(SUM(CASE WHEN v.is_work_set = 1 THEN v.volume_load END), 0) AS prior_volume_load,   -- 작업 세트만
       MIN(CASE WHEN v.is_work_set = 1 THEN v.act_rir END)               AS prior_min_rir_work,
       ROUND(CAST(AVG(CASE WHEN v.is_work_set = 1 THEN v.act_rir END) AS NUMERIC), 1) AS prior_avg_rir_work
FROM session_exercise se
LEFT JOIN v_set_volume v
       ON v.session_id = se.session_id
      AND v.session_exercise_id <> se.id
      AND (se.actual_order IS NULL OR v.ex_order < se.actual_order)
GROUP BY se.id;

-- 주간 부위별 볼륨: 작업 세트 수(부위 비중 반영)와 볼륨 로드. 주 = 월요일 시작, week_start는 그 주 월요일 날짜.
CREATE VIEW v_weekly_muscle_volume AS
SELECT ses.member_id,
       date(COALESCE(ses.started_at, ses.scheduled_start),
            '-' || ((CAST(strftime('%w', COALESCE(ses.started_at, ses.scheduled_start)) AS INTEGER) + 6) % 7) || ' days') AS week_start,
       em.muscle_group,
       ROUND(CAST(SUM(em.share) AS NUMERIC), 1)                    AS weighted_sets,
       ROUND(CAST(SUM(v.volume_load * em.share) AS NUMERIC), 0)    AS weighted_volume_load
FROM v_set_volume v
JOIN session ses        ON ses.id = v.session_id
JOIN exercise_muscle em ON em.exercise_id = v.exercise_id
WHERE v.is_work_set = 1
GROUP BY ses.member_id, week_start, em.muscle_group;

-- ───────────────────────── 10. 기본 코드값 ─────────────────────────
-- 세트 구성 목록. [미확정 O01] 추가질문 1번 답을 받으면 목록과 rule_json을 고친다.
INSERT INTO set_structure (code, name_ko, description) VALUES
 ('straight','스트레이트','같은 무게·횟수 반복'),
 ('top_backoff','탑세트+백오프','무거운 세트 후 무게 낮춰 여러 세트'),
 ('pyramid','피라미드','세트마다 무게 올림'),
 ('reverse_pyramid','역피라미드','무겁게 시작해 내림'),
 ('superset','슈퍼세트','두 종목 번갈아'),
 ('giant_circuit','자이언트세트/서킷','3종목 이상 연속 (역할 circuit과 다른 개념)'),
 ('drop','드롭세트','한계 근처에서 무게 내려 이어감'),
 ('rest_pause','레스트포즈','짧게 쉬고 같은 무게로 이어감'),
 ('custom','기타','직접 정의');
