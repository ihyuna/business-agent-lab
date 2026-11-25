"""데이터 구조 검사 v0.3.

schema.sql + sample-data.sql을 메모리 SQLite에 올리고
  1) 외래키·무결성 검사
  2) queries.sql의 쿼리를 실행해 '-- expect:' 줄과 비교
  3) 막아야 하는 입력이 실제로 막히는지(제약 위반 테스트), 허용해야 하는 입력이 통과하는지
를 확인한다. 하나라도 틀리면 종료 코드 1.

사용: python3 run_check.py > check-output.txt
같은 입력이면 출력이 같도록 실행 시각은 찍지 않는다.
"""
import pathlib
import re
import sqlite3
import sys

HERE = pathlib.Path(__file__).parent
SCHEMA = (HERE / "schema.sql").read_text()
SAMPLE = (HERE / "sample-data.sql").read_text()
QUERIES = (HERE / "queries.sql").read_text()

failures = []


def fresh_db():
    db = sqlite3.connect(":memory:")
    db.execute("PRAGMA foreign_keys = ON")
    db.executescript(SCHEMA)
    db.executescript(SAMPLE)
    return db


def show(v):
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def same(cell, expected):
    if expected == "NULL":
        return cell is None
    if cell is None:
        return False
    try:
        return abs(float(cell) - float(expected)) < 1e-9
    except (TypeError, ValueError):
        return show(cell) == expected


def parse_pairs(text, sep):
    pairs = []
    for part in text.split(sep):
        part = part.strip()
        if not part:
            continue
        key, _, val = part.partition("=")
        pairs.append((key.strip(), val.strip()))
    return pairs


def check_expect(title, line, cols, rows):
    """'rows=N' / '#k -> a=b; c=d' / 'x=y & z=w -> a=b; c=d'"""
    spec = line.strip()
    if "->" not in spec:
        key, _, val = spec.partition("=")
        if key.strip() == "rows":
            ok = len(rows) == int(val)
            return ok, f"rows={len(rows)} (expected {val.strip()})"
        return False, f"unknown expect: {spec}"
    selector, _, assigns = spec.partition("->")
    selector = selector.strip()
    if selector.startswith("#"):
        idx = int(selector[1:]) - 1
        if idx >= len(rows):
            return False, f"{selector}: no such row"
        row = rows[idx]
    else:
        conds = parse_pairs(selector, "&")
        for c, _ in conds:
            if c not in cols:
                return False, f"unknown column {c}"
        match = [r for r in rows if all(same(r[cols.index(c)], v) for c, v in conds)]
        if not match:
            return False, f"no row where {selector}"
        row = match[0]
    bad = []
    for col, val in parse_pairs(assigns, ";"):
        if col not in cols:
            bad.append(f"unknown column {col}")
            continue
        cell = row[cols.index(col)]
        if not same(cell, val):
            bad.append(f"{col}={show(cell)!r} (expected {val!r})")
    return (not bad), "; ".join(bad) if bad else spec


# ───────────── 헤더 ─────────────
print("# 데이터 구조 검사 결과")
print(f"schema: {SCHEMA.splitlines()[0].lstrip('- ').strip()}")
print(f"sample: {SAMPLE.splitlines()[0].lstrip('- ').strip()}")
print(f"SQLite {sqlite3.sqlite_version}")
print()

db = fresh_db()

# ───────────── 1. 무결성 ─────────────
print("## 1. 무결성")
fk = db.execute("PRAGMA foreign_key_check").fetchall()
integ = db.execute("PRAGMA integrity_check").fetchone()[0]
print(f"foreign_key_check: {'OK' if not fk else fk}")
print(f"integrity_check: {integ}")
if fk or integ != "ok":
    failures.append("integrity")
counts = {}
for (name,) in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"):
    counts[name] = db.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
n_views = db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='view'").fetchone()[0]
n_trig = db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='trigger'").fetchone()[0]
print(f"테이블 {len(counts)}개, 뷰 {n_views}개, 트리거 {n_trig}개")
print("행 수: " + ", ".join(f"{k} {v}" for k, v in counts.items()))
print()

# ───────────── 2. 쿼리와 기대값 ─────────────
print("## 2. 검증 쿼리")
n_q = n_exp = 0
for block in re.split(r"^-- @ ", QUERIES, flags=re.M)[1:]:
    title, _, body = block.partition("\n")
    expects = [l.split("-- expect:", 1)[1] for l in body.splitlines() if l.strip().startswith("-- expect:")]
    sql = "\n".join(l for l in body.splitlines() if not l.strip().startswith("--")).strip()
    n_q += 1
    print(f"### {title.strip()}")
    try:
        cur = db.execute(sql)
    except sqlite3.Error as e:
        print(f"ERROR: {e}\n")
        failures.append(f"{title}: {e}")
        continue
    cols = [d[0] for d in cur.description]
    rows = cur.fetchall()
    print(" | ".join(cols))
    for r in rows:
        print(" | ".join(show(v) for v in r))
    for e in expects:
        n_exp += 1
        ok, msg = check_expect(title, e, cols, rows)
        print(f"{'PASS' if ok else 'FAIL'} expect: {msg if not ok else e.strip()}")
        if not ok:
            failures.append(f"{title.split()[0]}: {msg}")
    print()

# ───────────── 3. 제약 테스트 ─────────────
# (이름, 준비 SQL(성공해야 함), 검사 SQL, 막혀야 하면 오류 메시지 일부 / 통과해야 하면 None)
CASES = [
    ("역할별 공통 기준 중복", "",
     "INSERT INTO role_default (id, trainer_id, role, goal_type) VALUES ('rdx','t1','main',NULL)", "UNIQUE"),
    ("목표별 기준은 공통 기준과 따로 허용", "",
     "INSERT INTO role_default (id, trainer_id, role, goal_type, reps_min, reps_max) VALUES ('rdx','t1','main','strength',3,6)", None),
    ("열린 훈련 방향 두 개", "",
     "INSERT INTO training_block (id, member_id, direction, started_on) VALUES ('tbx','m-kim','maintain','2026-10-10')", "UNIQUE"),
    ("집중 대상은 direction=focus일 때만", "",
     "UPDATE training_block SET focus_target = '하체' WHERE id = 'tb2'", "CHECK"),
    ("열린 체성분 단계 두 개", "",
     "INSERT INTO body_comp_phase (id, member_id, phase, started_on) VALUES ('bpx','m-kim','bulk','2026-10-15')", "UNIQUE"),
    ("동의 없는 회원의 생리 주기 기록",
     "INSERT INTO member (id, trainer_id, name, registered_on) VALUES ('m-x','t1','테스트','2026-10-01')",
     "INSERT INTO cycle_log (id, member_id, period_start) VALUES ('cyx','m-x','2026-10-01')", "cycle consent required"),
    ("동의 없는 회원의 수업에 주기 일차",
     "INSERT INTO member (id, trainer_id, name, registered_on) VALUES ('m-x','t1','테스트','2026-10-01')",
     "INSERT INTO session (id, member_id, trainer_id, session_no, cycle_day) VALUES ('sx','m-x','t1',1,5)", "cycle consent required"),
    ("동의 없는 회원의 수업에 주기 일차를 나중에 입력",
     "INSERT INTO member (id, trainer_id, name, registered_on) VALUES ('m-x','t1','테스트','2026-10-01');"
     "INSERT INTO session (id, member_id, trainer_id, session_no) VALUES ('sx','m-x','t1',1)",
     "UPDATE session SET cycle_day = 5 WHERE id = 'sx'", "cycle consent required"),
    ("동의 철회 뒤 주기 기록",
     "UPDATE member_consent SET withdrawn_at = '2026-10-15' WHERE id = 'cs2'",
     "INSERT INTO cycle_log (id, member_id, period_start) VALUES ('cyx','m-kim','2026-10-18')", "cycle consent required"),
    ("수업 시작 뒤 계획값 변경", "",
     "UPDATE set_entry SET plan_weight_kg = 45 WHERE id = 'st13-1-1'", "frozen"),
    ("수업 시작 뒤 결정값 기록은 허용", "",
     "UPDATE set_entry SET dec_weight_kg = 20, dec_reps_target = 15 WHERE id = 'st13-3-1'", None),
    ("시작 전 수업의 계획값 변경은 허용", "",
     "UPDATE set_entry SET plan_weight_kg = 37.5 WHERE id = 'st14-1-1'", None),
    ("수업 시작 뒤 계획 시간 변경",
     "UPDATE set_entry SET plan_duration_sec = 30 WHERE id = 'st13-3-1'",
     "UPDATE set_entry SET plan_duration_sec = 40 WHERE id = 'st13-3-1'", "frozen"),
    ("수업 시작 뒤 종목 계획 세트 수 변경", "",
     "UPDATE session_exercise SET plan_sets = 5 WHERE id = 'se13-1'", "frozen"),
    ("시작 전 수업의 종목 계획 변경은 허용", "",
     "UPDATE session_exercise SET plan_sets = 4, plan_rest_sec = 100 WHERE id = 'se14-1'", None),
    ("RPE 범위 밖(15)", "",
     "UPDATE set_entry SET act_rpe = 15 WHERE id = 'st12-1-1'", "CHECK"),
    ("완료 세트인데 입력 출처 없음", "",
     "INSERT INTO set_entry (id, session_exercise_id, set_index, act_weight_kg, act_reps, completed) VALUES ('stx','se13-2',4,65,10,1)", "CHECK"),
    ("계획 횟수 최소 > 최대", "",
     "INSERT INTO set_entry (id, session_exercise_id, set_index, plan_reps_min, plan_reps_max) VALUES ('stx','se14-2',4,12,8)", "CHECK"),
    ("같은 회원 같은 회차 중복", "",
     "INSERT INTO session (id, member_id, trainer_id, session_no) VALUES ('sx','m-kim','t1',13)", "UNIQUE"),
    ("주의사항 확인이 caution이 아닌 메모를 가리킴", "",
     "INSERT INTO session_caution_check (session_id, note_id, status) VALUES ('s13','n5','ok')", "caution"),
    ("다른 회원의 주의사항을 확인",
     "INSERT INTO member (id, trainer_id, name, registered_on) VALUES ('m-x','t1','테스트','2026-10-01');"
     "INSERT INTO member_note (id, member_id, kind, title, created_on) VALUES ('nx','m-x','caution','손목 통증','2026-10-01')",
     "INSERT INTO session_caution_check (session_id, note_id, status) VALUES ('s13','nx','ok')", "caution"),
    ("해결 상태인데 해결일 없음", "",
     "UPDATE member_note SET status = 'resolved' WHERE id = 'n2'", "CHECK"),
    ("부위는 caution 메모에만", "",
     "UPDATE member_note SET body_region = 'knee' WHERE id = 'n5'", "CHECK"),
    ("화면에 보이는 같은 추천 두 개", "",
     "INSERT INTO recommendation (id, session_exercise_id, set_entry_id, trigger, method, model_version, shown) VALUES ('rcx','se12-1','st12-1-1','pre_set','personal_context','v0',1)", "UNIQUE"),
    ("보이지 않은 추천에 트레이너 반응", "",
     "UPDATE recommendation SET trainer_action = 'accepted' WHERE id = 'rc2'", "CHECK"),
    ("이탈 후 재추천은 여러 번 허용", "",
     "INSERT INTO recommendation (id, session_exercise_id, set_entry_id, trigger, method, model_version, shown) VALUES "
     "('rcx','se12-3','st12-3-3','replan_after_deviation','personal_context','v0',1),"
     "('rcy','se12-3','st12-3-3','replan_after_deviation','personal_context','v0',1)", None),
    ("추천의 세트와 종목 불일치", "",
     "INSERT INTO recommendation (id, session_exercise_id, set_entry_id, trigger, method, model_version, shown) VALUES ('rcx','se12-2','st12-1-1','pre_set','personal','v0',0)", "mismatch"),
    ("예상의 세트와 종목 불일치", "",
     "INSERT INTO expectation (id, set_entry_id, session_exercise_id, method, model_version, at_weight_kg, exp_reps_low, exp_reps_high) VALUES ('xpx','st12-1-1','se12-2','personal','v0',75,10,12)", "mismatch"),
    ("같은 예상 중복 계산", "",
     "INSERT INTO expectation (id, set_entry_id, session_exercise_id, method, model_version, at_weight_kg, exp_reps_low, exp_reps_high) VALUES ('xpx','st12-1-1','se12-1','personal','v0',42.5,8,9)", "UNIQUE"),
    ("예상 범위 low > high", "",
     "INSERT INTO expectation (id, set_entry_id, session_exercise_id, method, model_version, at_weight_kg, exp_reps_low, exp_reps_high) VALUES ('xpx','st12-2-1','se12-2','personal','v0',75,13,10)", "CHECK"),
    ("편차 검토의 세트와 예상 불일치", "",
     "INSERT INTO deviation_review (id, set_entry_id, expectation_id, direction) VALUES ('dvx','st12-3-2','xp-lc12-pc','below')", "mismatch"),
    ("다른 회원 전용 루틴으로 수업 만들기",
     "INSERT INTO member (id, trainer_id, name, registered_on) VALUES ('m-x','t1','테스트','2026-10-01')",
     "INSERT INTO session (id, member_id, trainer_id, session_no, routine_template_id) VALUES ('sx','m-x','t1',1,'rt-post')", "another member"),
    ("없는 세트 구성 코드", "",
     "UPDATE session_exercise SET set_structure = 'cluster' WHERE id = 'se14-1'", "FOREIGN KEY"),
    # [v0.3]
    ("옮김인데 옮긴 날짜 없음", "",
     "INSERT INTO session_change (id, session_id, kind) VALUES ('c-x','s14','moved')", "CHECK"),
    ("옮김을 횟수에서 차감", "",
     "INSERT INTO session_change (id, session_id, kind, from_start, to_start, deduct) VALUES ('c-x','s14','moved','2026-10-20 19:00','2026-10-21 19:00',1)", "CHECK"),
    ("안 옴 차감은 허용", "",
     "INSERT INTO session_change (id, session_id, kind, reason, deduct) VALUES ('c-x','s14','no_show','no_contact',1)", None),
    ("없는 일정 변경 이유", "",
     "INSERT INTO session_change (id, session_id, kind, reason) VALUES ('c-x','s14','cancelled','weather')", "CHECK"),
    ("내용 없는 다음 목표", "",
     "INSERT INTO next_target (id, member_id, exercise_id, source_session_id) VALUES ('nt-x','m-kim','ex-squat','s13')", "CHECK"),
    ("같은 수업 같은 종목 다음 목표 두 번", "",
     "INSERT INTO next_target (id, member_id, exercise_id, source_session_id, target_reps) VALUES ('nt-x','m-kim','ex-rdl','s13',10)", "UNIQUE"),
    ("종목 범위 메모인데 종목 없음", "",
     "INSERT INTO member_note (id, member_id, kind, title, scope, created_on) VALUES ('n-x','m-kim','general','x','exercise','2026-10-20')", "CHECK"),
    ("분할 범위 메모는 루틴 틀과 함께 허용", "",
     "INSERT INTO member_note (id, member_id, kind, title, scope, scope_template_id, created_on) VALUES ('n-x','m-kim','general','x','split','rt-post','2026-10-20')", None),
    ("계획 무게 범위 최소 > 최대", "",
     "UPDATE set_entry SET plan_weight_kg = 40, plan_weight_max_kg = 30 WHERE id = (SELECT s.id FROM set_entry s JOIN session_exercise se ON se.id = s.session_exercise_id WHERE se.session_id = 's14' LIMIT 1)", "CHECK"),
    ("없는 숫자 채우기 기준", "",
     "UPDATE set_entry SET plan_basis = 'guess' WHERE id = (SELECT s.id FROM set_entry s JOIN session_exercise se ON se.id = s.session_exercise_id WHERE se.session_id = 's14' LIMIT 1)", "CHECK"),
    ("없는 입력 단위", "",
     "UPDATE exercise SET input_unit = 'oz' WHERE id = 'ex-squat'", "CHECK"),
    ("빼기 이유 칩은 뺀 종목에", "",
     "UPDATE session_exercise SET change_reason_tag = 'time' WHERE id = 'se14-2'", "CHECK"),
    ("같은 날 같은 종목 세팅 두 번", "",
     "INSERT INTO member_exercise_setting (id, member_id, exercise_id, setting, set_on) VALUES ('mes-x','m-kim','ex-legpress','x','2026-10-08')", "UNIQUE"),
]

print("## 3. 제약 테스트")
for name, setup, stmt, expect_err in CASES:
    t = fresh_db()
    try:
        if setup:
            t.executescript(setup)
    except sqlite3.Error as e:
        print(f"FAIL {name}: 준비 단계 오류 {e}")
        failures.append(f"case {name}: setup {e}")
        continue
    try:
        t.execute(stmt)
        err = None
    except sqlite3.Error as e:
        err = str(e)
    if expect_err is None:
        ok = err is None
        detail = "통과" if ok else f"막힘: {err}"
    else:
        ok = err is not None and expect_err.lower() in err.lower()
        detail = f"막힘: {err}" if err else "막히지 않음"
    print(f"{'PASS' if ok else 'FAIL'} {name} → {detail}")
    if not ok:
        failures.append(f"case {name}: {detail}")
    t.close()
print()

# ───────────── 요약 ─────────────
print("## 요약")
print(f"쿼리 {n_q}개, 기대값 {n_exp}개, 제약 테스트 {len(CASES)}개")
if failures:
    print(f"실패 {len(failures)}건:")
    for f in failures:
        print(f"- {f}")
    sys.exit(1)
print("전부 통과")
