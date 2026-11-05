# 데이터 구조 설계 v0.2

> 상태: 최신 · 버전 v0.2 · 최종 수정 2026-10-15 · 이 문서가 기준인 주제: 테이블·필드·선택지 목록의 뜻과 쓰는 규칙(정의 자체는 `schema.sql`)
> 근거: [project-analysis.md](../../analysis/project-analysis.md)(PDF 연구보고서 + 앱 설명), [trainer-interview.md](../../analysis/trainer-interview.md)(트레이너 설문·인터뷰). 결정(D··)·열린 질문(O··)은 [decisions.md](../../decisions.md), 용어는 [glossary.md](../../glossary.md).

같은 폴더 파일:

| 파일 | 내용 |
|---|---|
| `schema.sql` | 테이블 24개, 뷰 4개, 트리거 10개, 인덱스, 세트 구성 기본 목록. SQLite 3.45로 검증, PostgreSQL로 옮길 때 바꿀 것은 파일 머리말에 |
| `sample-data.sql` | 가상 회원 김서연: 트레이너 t1, 역할별 기준 임시값 rd1~rd6, 종목 8개, 루틴 템플릿 4개, 8~13회차 기록 + 14회차 예정, 메모 11개, AI 예상·추천·편차 예시 |
| `queries.sql` | 요구사항별 검증 쿼리 18개. 각 쿼리에 `-- expect:` 기대값 |
| `run_check.py` | 무결성 검사 + 쿼리 기대값 59개 비교 + 제약 테스트 33개. 하나라도 틀리면 종료 코드 1 |
| `check-output.txt` | `python3 run_check.py > check-output.txt` 결과. 지금은 전부 통과 |

`[미확정 O··]` 표시는 열린 질문의 답에 따라 값이나 목록이 바뀌는 부분이다. 6절에 트레이너 답이 오면 바뀌는 곳을, 7절에 설계에서 정할 것을 모아 두었다. 용어는 [glossary.md 5절](../../glossary.md#5-개발연구-용어)(테이블·뷰·트리거·제약 테스트 등).

---

## 1. 적용한 설계 원칙

근거가 된 문헌 원칙은 [project-analysis.md 6절](../../analysis/project-analysis.md#6-문헌-기반-설계-원칙-pdf-317장).

| # | 원칙 | 결정 | 근거 |
|---|---|---|---|
| 1 | **회원 → 수업 → 종목 → 세트** 4단 계층. 세트 한 줄이 가장 작은 기록 단위 | D23 | [PDF 18.1] |
| 2 | 변하는 정보(목표, 체성분 단계, 체중, 훈련 방향, 몸 쓰는 감각)는 **덮어쓰지 않고 기간·측정일로 쌓는다**. 과거 수업 당시의 맥락을 그대로 다시 볼 수 있다 | D24 | [PDF 18.2] |
| 3 | 세트마다 **계획 / 트레이너 결정 / 실제**를 따로 두고, **AI 예상 수행과 AI 추천**은 별도 테이블 | D14·D25 | [PDF 12·24장] |
| 4 | 같은 세트에 대해 **여러 예측 방식을 함께 계산해 기록**하고 화면에는 하나만 보여 준다. 연구질문 RQ1·RQ2를 같은 데이터로 비교할 수 있다 | D17 | [PDF 26장] |
| 5 | 원자료만 저장한다(중량, 횟수, RIR/RPE, 휴식, 템포, 역할). **피로 점수나 볼륨×TUT 같은 합성 점수는 만들지 않고**, 요약값은 뷰로 계산한다 | D13·D20·D26 | [PDF 4·16·17장] |
| 6 | 추천 단계의 역할별 범위는 논문 수치가 아니라 **트레이너 본인의 역할별 기준**(설정 테이블)에서 출발한다. 예상 수행의 출발점은 일반 운동과학 기준(population) | D18 | [PDF 3장·10장·11.1], [인터뷰 기능] |
| 7 | 입력은 종이보다 빨라야 한다. 컨디션은 화면에서 '평소'를 미리 골라 두고, 관찰은 튀는 날만 | D03·D33·D38 | [설문 Q8], [인터뷰 2차-5], [인터뷰 3차-3] |
| 8 | 미리 채운 값과 직접 입력한 값을 구분한다. 분석에서 추정값이 실제값으로 섞이지 않게 | D37 | 설계(2026-10-15 문서 정리) |

## 2. 전체 구조

```
트레이너 ─┬─ 설정: 역할별 기준(role_default), 세트 구성(set_structure), 노력도 척도(trainer.effort_scale)
          ├─ 종목 라이브러리(exercise) ─ 종목별 사용 부위(exercise_muscle)
          ├─ 루틴 템플릿(routine_template) ─ 템플릿 종목(routine_template_item)
          └─ 회원(member)
               ├─ 동의 이력(member_consent): 건강 기록 · 생리 주기 · 연구 활용
               ├─ 이력: 목표(member_goal, 여러 개) · 체성분 단계(body_comp_phase) · 체성분 측정(body_measurement)
               │        · 훈련 방향(training_block) · 생리 주기(cycle_log, 동의 시) · 몸 쓰는 감각(movement_assessment)
               ├─ 메모(member_note): 주의사항 · 확인사항 · 생활 · 개인 운동 · 식단 · 성향 · 기타
               └─ 수업(session): 오늘 목표 · 진행 의도 · 컨디션 4항목 · 주기 일차 · 메모 · 요약
                    ├─ 주의사항 확인(session_caution_check)
                    ├─ 특이 관찰(session_observation)
                    └─ 종목(session_exercise): 순서 · 역할 · 세트 구성 · 템포 · 계획/결정 세트 수 · 이유
                         ├─ 세트(set_entry): 계획 / 결정 / 실제 + 입력 출처
                         ├─ 예상 수행(expectation): 방식별
                         ├─ AI 추천(recommendation): 시점·방식별, 채택/수정/거부 + 이유 태그
                         └─ 기댓값 이탈 검토(deviation_review): 데이터상 차이 + 트레이너 원인 태그
```

## 3. 테이블별 설명

### 3-1. 트레이너 설정

| 테이블 | 무엇 | 왜 |
|---|---|---|
| `trainer` | 트레이너. `effort_scale` = RIR / RPE / 둘 다 / 쉬움·적당·힘듦, `effort_rater` = 회원이 말함 / 트레이너가 판단 / 섞음, `timezone` | 세트 입력 칸 개수가 이 값에 따라 바뀐다 `[미확정 O03]` |
| `role_default` | 역할 × (선택) 회원 장기 목표별 횟수·RIR·세트·휴식·작업 시간·템포 범위. `goal_type`이 비어 있으면 모든 목표 공통이며, 역할마다 공통 행은 하나만 둘 수 있다 | [인터뷰 마지막] "1, 6을 정하면 2, 3, 4, 5는 정해져요"(1 = 종목·순서, 6 = 세트 구성)의 '정해지는 기준'. 추천 단계에서 역할에 맞는 범위를 정하는 출발점 (D18) `[미확정 O02]` |
| `set_structure` | 스트레이트, 탑세트+백오프, 피라미드, 슈퍼세트, 드롭 등 + 숫자 규칙(`rule_json`). 트레이너 1명 전제의 전역 코드 테이블이며 기본 목록은 `schema.sql` 끝에 있다 | 예: 백오프 무게 = 탑세트 -10% 같은 트레이너 규칙 `[미확정 O01]` |

`role_default.goal_type`은 **회원 장기 목표**(`member_goal.goal_type`) 어휘를 쓴다. 오늘 목표(`session.session_goal_type`)별 기준이 필요하면 그때 칸을 더한다 (O32).

### 3-2. 종목 라이브러리

| 테이블 | 무엇 | 왜 |
|---|---|---|
| `exercise` | 종목명, 별칭, 같은 계열 종목(`variant_of`), 움직임 패턴, 기구, 부하 종류(외부 중량/맨몸/보조/시간), **무게 기록 기준**(`weight_basis`: 바 포함 전체 / 덤벨 한 손 / 머신 표시값 / 맨몸+추가 중량), 편측 여부, e1RM 공식 적용 가능 여부 | 같은 종목 검색, 운동별 기준 분리([PDF 11.2]). 무게 기준이 다르면 볼륨·e1RM이 달라진다 `[미확정 O07]` |
| `exercise_muscle` | 종목이 쓰는 부위와 비중(주동근 1.0, 협응근 0.5) | 당주 부위별 총볼륨([인터뷰 기능] "당일 or 당주 총볼륨") |

### 3-3. 회원과 이력

| 테이블 | 무엇 | 근거 |
|---|---|---|
| `member` | 이름, 성별·출생연도(선택), PT 유형, 등록일, 상태 | 최소 식별 정보([PDF 19·20장], D31) |
| `member_consent` | 동의 이력: 건강 기록(app_health) / 생리 주기(cycle) / 연구 활용(research). 철회는 행을 지우지 않고 `withdrawn_at`을 채운다. 종류마다 유효한 동의는 하나 | 민감정보 최소 수집 `[미확정 O17·O18]` |
| `member_goal` | 목표 여러 개 + 우선순위(설계 선택, O28) + 시작/종료일 | [인터뷰 2차-1] "장기로 틀을 잡고 동시에 고려" (D27) |
| `body_comp_phase` | 감량/유지/증량 + 기간. 목표와 분리. 회원당 열린 기간은 하나 | [PDF 19장] "감량 중 + 근력 유지" (D28) |
| `body_measurement` | 키, 체중, 골격근량, 체지방률, 측정 출처 | 진행 추이([앱 설명 4-2]), Cold Start([인터뷰 2차-3] "키, 체중, 근육양". 근육량은 InBody식 골격근량 칸에 기록) |
| `training_block` | 훈련 방향(기간): 발전 / 유지 / 조절 / 집중(+ 집중 대상) + **진행 방식**(볼륨 / 중량 / 횟수 / 없음) + 근거 태그 + 기간(단위는 O29). 회원당 열린 블록은 하나 | [인터뷰 2차-2], [인터뷰 3차-1] (D29). **"다이어트=볼륨 유지, 벌크=볼륨 상승"은 AI 규칙이 아니라 트레이너가 여기서 고르는 값** (D19) |
| `cycle_log` | 생리 시작일만. cycle 동의가 유효한 회원만 넣을 수 있다(트리거) | [인터뷰 2차-2] "여성은 호르몬 주기를 바탕으로 큰 틀" (D41) `[미확정 O04]` |
| `movement_assessment` | 몸 쓰는 감각: 자세 안정성, 동작 습득 속도, 피드백 반영, 반복 시 자세 유지(1~5점) + 힘 쓰는 부위(메모) | [인터뷰 2차-3], [인터뷰 3차-2] (D30) `[미확정 O06]` |
| `member_note` | 메모 통합. 종류: 주의사항(caution), 확인사항(check), 생활, 개인 운동, 식단, 성향, 기타. 생긴 수업, 확인할 수업, 해결 여부, **AI 제안 여부**(`created_by`, 채택 시각 `accepted_at`). 부위는 주의사항에만, 확인할 수업은 확인사항에만 | [앱 설명 4-6] 주의사항/다음 확인사항 + [PDF 18.3] 장기/단기 메모 (D40). [설문 Q10] "생활 습관, 회원 성향" |

식단·생활 메모는 브리핑용 자유 메모이고 예측·추천 입력에는 쓰지 않는다. 개인 운동 메모가 없으면 '운동 안 함'이 아니라 '알 수 없음'으로 다룬다(D42, [PDF 23장]).

### 3-4. 루틴과 수업

| 테이블 | 무엇 | 근거 |
|---|---|---|
| `routine_template`, `routine_template_item` | 이름 붙은 루틴('후면사슬 루틴')과 그 종목·역할·세트 구성. 루틴 작성 화면에서 불러오는 틀이다. 회원 전용 템플릿은 그 회원 수업에만 쓸 수 있다(트리거) | [설문 Q18-1] "이 전에 진행한 동일한 루틴과 비교" (D21) |
| `session` | 회차(회원별로 중복 불가), 일정(알림 기준), 상태(예정/진행/완료/취소/노쇼), 당시 훈련 방향, 수업 종류(하체/상체/전신), **오늘 목표**(유형 + 문장), 진행 의도(올림/유지/조절) + 진행 방식, **컨디션 4항목**, 주기 일차, 수업 메모, 수업 후 요약과 그 출처(규칙/LLM/트레이너) | [PDF 21장], [인터뷰 2차-5·6], [앱 설명 4-3]. 예정 상태 수업 = '예정 루틴' |
| `session_caution_check` | 수업마다 열린 주의사항을 확인한 결과(괜찮음/그대로/나빠짐/좋아짐). 같은 회원의 주의사항만 가리킬 수 있다(트리거) | [인터뷰 2차-4] "매일 확인" (D32). "김서연 회원이 지난번 하체 운동할 때 무릎이 어땠지?"([앱 설명 4-7])에 구조화된 답이 생긴다 |
| `session_observation` | 집중력·몰입도·반응·동작 안정성·회복 속도가 평소와 다를 때만 | [인터뷰 3차-3] (D38) `[미확정 O09]` |

컨디션 칸은 비어 있으면 '확인 안 함'이다. 화면은 '평소'(수면·피로·근육통 normal, 통증 none)를 미리 골라 두고 트레이너가 확인하면 저장하며, 그 시각을 `cond_checked_at`에 남긴다(D33).

### 3-5. 종목과 세트

`session_exercise`: 트레이너가 사전에 정하는 것 = **종목 + 순서 + 역할 + 세트 구성 (+ 템포, 이유)** (D35). 계획 순서와 실제 순서를 따로 두고, 계획 세트 수(`plan_sets`)와 수업 중 바꾼 세트 수(`dec_sets`)를 따로 둔다. 수업 중 추가·건너뜀·교체와 그 이유를 남긴다([인터뷰 1차-3], [인터뷰 2차-7], D36). 예정 루틴의 **참고사항**(자세·통증·수행 메모, [앱 설명 4-5])은 `note`에 둔다.

수업 상세에서 "자세나 통증 관련 메모를 연결"([앱 설명 4-4])하는 곳: 세트 하나에 대한 메모는 `set_entry.note`와 통증 발생 `pain_flag`, 계속 볼 주의사항은 `member_note`(종목은 `related_exercise_id`).

`set_entry`: 세트 한 줄에 세 묶음.

| 묶음 | 칸 | 언제, 누가 채우나 |
|---|---|---|
| 계획 `plan_` | 중량, 횟수 범위, 목표 RIR, 시간 | 수업 전 루틴 작성 때. AI 제안을 받아들인 숫자도 여기. **수업이 시작되면 이미 채워진 값은 고칠 수 없다**(트리거). 종목의 계획 세트 수·휴식·순서도 같다 |
| 트레이너 결정 `dec_` | 중량, 목표 횟수, 목표 RIR, 휴식, 시간 | 수업 시작 뒤 세트 직전. 시작 뒤에 AI가 처음 채우는 숫자도 여기로 간다 |
| 실제 `act_` | 중량, 횟수, RIR, RPE, 시간, 직전 휴식, 통증 발생, 기록 시각 | 세트 직후 |

숫자를 쓰는 규칙:
- 계획을 수업 전에 비워 둔 세트(예: 13회차 레그컬)는 행만 만들어 두고, 수업 중 추천을 보고 정한 값을 `dec_`에 쓴다.
- 화면은 결정값을 계획값으로, 실제값을 결정값으로 미리 채워 두고 다를 때만 고친다. 미리 채운 값을 확인만 했으면 `act_source = confirmed_default`, 직접 입력했으면 `entered`. 완료한 세트는 출처가 반드시 있어야 한다(CHECK).
- **RIR·RPE는 미리 채우지 않는다.** 입력하지 않으면 비어 있다.
- 연구 분석(RQ1·RQ2 오차 비교)은 `act_source`가 있는 완료 세트만 쓴다.
- 기록 시각(`logged_at`)은 세트를 완료할 때 앱이 채운다. 슈퍼세트처럼 두 종목을 번갈아 할 때 세트 단위 순서는 이 값으로 본다.

### 3-6. AI 관련

**예측 방식(method)과 연구질문**

| 방식 | 쓰는 정보 | 연구질문에서의 역할 |
|---|---|---|
| `population` | 일반 공식을 그대로 적용(입력은 최근 수행에서 구한 e1RM 하나, 회원별 보정 없음) | RQ2 비교 기준 |
| `recent` | 같은 종목의 직전 기록을 그대로 이어 씀(공식·보정 없음) | RQ2 비교 기준 |
| `personal` | 일반 공식 + 회원별 보정(그 회원의 '예상 대비 실제' 기록으로 학습) | RQ2 검증 대상, RQ1 비교 기준 |
| `personal_context` | personal + 오늘 맥락(역할·노력도·선행 수행·목적) | RQ1 검증 대상 |

'검증 대상'은 나아지는지 보려는 방식, '비교 기준'은 그 방식과 견주는 방식이다. 연구질문과의 대응과 그 근거는 [project-analysis.md 10절](../../analysis/project-analysis.md#10-연구질문-pdf-26장)이 기준이다. 트레이너 역할별 기준(`role_default`)은 예상 수행이 아니라 **추천 단계**의 입력이다.

| 테이블 | 무엇 | 근거 |
|---|---|---|
| `expectation` | "이 무게면 몇 회 가능할까" 범위(예: 8~9회). 방식·모델 버전·계산에 쓴 입력 스냅샷(`inputs_json`). 같은 대상·방식·버전·무게로는 한 번만 | [PDF 12.1] Expected Performance (D14) |
| `recommendation` | "오늘 목적에 맞게 얼마나 시킬까". 시점(루틴 작성 / 세트 직전 / 이탈 뒤 재계획), 방식, 근거가 된 예상(`expectation_id`), 화면 표시 여부, 방향(올림/유지/조절), 바꿀 변수, 권장 범위, **근거 문장**, 트레이너 반응, 수정·거부 이유 태그, 자유 피드백 | [PDF 12.2, 15장] (D15), RQ3 |
| `deviation_review` | 기댓값 이탈(아래/위), **데이터상 차이**(자동), **트레이너 원인 태그**(호흡, 힘 쓰는 방식, 신경계, 컨디션, 수면, 통증, 모름) | [PDF 25장] 원인을 진단하지 않음 + [인터뷰 기능] "이유를 찾을 수도 있을 거고용" (D16) |

**트레이너 반응(`trainer_action`) 정의**
- `accepted`: 트레이너 결정값이 추천 범위 안
- `modified`: 범위 밖으로 정했거나, 다른 변수를 바꿈(예: 증량 폭만 줄임)
- `rejected`: 추천과 다른 방향으로 감(예: 올리라는데 유지)
- 화면에 보이지 않은 비교용 추천(`shown = 0`)에는 반응을 남길 수 없다. 같은 대상·같은 시점에 보이는 추천은 하나이고, 이탈 뒤 재추천은 여러 번 있을 수 있다(가장 최근 것을 표시).

### 3-7. 계산 뷰 (저장하지 않고 계산)

'작업 세트' = 역할이 워밍업이 아니고 세트 종류도 워밍업이 아닌 완료 세트.

| 뷰 | 용도 |
|---|---|
| `v_set_volume` | 세트별 볼륨 로드(중량 × 횟수). 외부 중량 종목만 계산하고 맨몸·보조·시간 종목은 비워 둔다 `[미확정 O16]`. 작업 세트 여부 표시 |
| `v_session_summary` | 수업 기록 카드: 종목 수, 완료/전체 세트, 작업 세트 평균 RPE·RIR, 총 볼륨(작업 세트), 주의사항 확인 여부(그 수업에 확인 기록이 하나라도 있으면 1. 열린 주의사항을 모두 확인했는지는 Q1-b로 본다), 메모. 전체 세트 = 건너뛰거나 교체되지 않은 종목의 세트 행 + 그 밖의 완료 세트. 진행 중인 수업은 '7/9'처럼 보인다 |
| `v_prior_context` | 각 종목 **직전까지**의 같은 수업 안 누적: 세트 수, 작업·워밍업·메인 작업 세트 수, 볼륨(작업 세트), 최저·평균 RIR. 아직 시작 안 한 종목은 같은 수업에서 끝난 다른 종목 전부가 선행이고, 시작했거나 끝난 종목은 실제 순서가 앞선 종목이 선행이다 |
| `v_weekly_muscle_volume` | 주간 부위별 작업 세트 수(부위 비중 반영)와 볼륨. 주는 월요일 시작, `week_start` = 그 주 월요일 날짜 |

### 3-8. 정합성 규칙 (트리거·제약)

`run_check.py`의 제약 테스트 33개가 아래 규칙마다 막혀야 할 입력이 막히고 허용할 입력이 통과하는지 확인한다.

- 생리 주기 기록과 수업의 주기 일차는 cycle 동의가 유효한 회원만(새로 넣을 때, 나중에 고칠 때, 동의 철회 뒤 모두 막힘)
- 수업이 시작되면 이미 채워진 계획값(세트의 중량·횟수 범위·목표 RIR·시간, 종목의 세트 수·휴식·순서)은 고칠 수 없음. 결정값 기록과 시작 전 수업의 계획 수정은 허용
- 주의사항 확인은 같은 회원의 주의사항 메모만(다른 종류 메모, 다른 회원 메모 모두 막힘), 회원 전용 루틴은 그 회원 수업만
- 예상·추천·편차 검토가 가리키는 세트는 그 종목·그 예상에 속해야 함
- 위 두 줄(주의사항 확인, 회원 전용 루틴, 예상·추천·편차 검토)의 트리거는 새로 넣을 때(INSERT)만 검사한다. 나중에 UPDATE로 가리키는 대상을 바꾸는 것은 지금 막지 않는다(O31)
- 열린 훈련 방향·체성분 단계는 회원당 하나, 역할별 공통 기준은 역할당 하나, 회차는 회원별로 하나
- 범위 값은 최소 ≤ 최대, RPE는 1~10, 완료 세트는 입력 출처 필수, 해결된 메모는 해결일 필수

## 4. 요구사항 → 구조 → 검증 쿼리

모든 쿼리의 결과와 기대값 비교는 `check-output.txt`에 있다.

| 요구 | 출처 | 구조 | 쿼리 |
|---|---|---|---|
| 수업 전 브리핑: 현재 목표·오늘 목표·체성분 단계·훈련 방향 | [인터뷰 1차-2], [설문 Q19] | member_goal, body_comp_phase, training_block, session | Q1-a |
| 브리핑: 최근 통증(매 수업 확인, 오늘 아직 확인 안 한 것 표시) | [인터뷰 1차-2], [인터뷰 2차-4] | member_note, session_caution_check | Q1-b |
| 브리핑: 다음에 물어보기로 한 것, 개인 운동/식단, 생활 | [인터뷰 1차-2], [앱 설명 4-6] | member_note | Q1-c |
| 브리핑: 지난 컨디션, 지난 수업 특이사항 | [인터뷰 1차-2] | session(컨디션·메모), session_observation | Q1-d |
| 브리핑: 지난 동일 종목 중량/횟수(당시 역할과 함께) | [인터뷰 1차-2], [앱 설명 4-4] | session_exercise, set_entry | Q1-e |
| 이전 동일 루틴과 비교 | [설문 Q18-1] | routine_template + v_session_summary | Q1-f |
| 다음 PT 일정과 예정 루틴(종목별 참고사항 포함) | [앱 설명 4-2·4-5] | session(planned), session_exercise(note), set_entry.plan_ | Q1-g |
| 수업 상세의 자세·통증 메모 연결 | [앱 설명 4-4] | set_entry.note·pain_flag, member_note.related_exercise_id | 예시 10회차 RDL 3세트(pain_flag) |
| 앞 운동 볼륨에 따른 다음 종목 무게 | [인터뷰 1차-1] | v_prior_context | Q2 |
| 다른 역할로 했던 같은 종목 기록 활용 | [인터뷰 1차-1] 레그컬 예시 | session_exercise.role + v_prior_context | Q3 |
| 역할별 기준에서 출발 | [인터뷰 기능], [인터뷰 마지막] | role_default | Q4 |
| 수업 기록 카드(세트 7/9, 평균 RPE, 메모) | [앱 설명 4-3] | v_session_summary | Q5 |
| 당주 부위별 총볼륨 | [인터뷰 기능] | exercise_muscle + v_weekly_muscle_volume | Q6 |
| 과거 맥락을 덮어쓰지 않음, 블록 연결 누락 찾기 | [PDF 18.2] | 기간 칸 + session.training_block_id | Q7 |
| 세트 직전 추천 vs 결정 vs 실제, 근거 예상과의 오차 | [PDF 24장] RQ3 | recommendation, expectation, set_entry | Q8-a |
| 루틴 작성 때 추천 vs 계획, 수정 이유 태그 | [PDF 24장] RQ3 | recommendation(routine_plan), session_exercise.plan_sets, set_entry.plan_ | Q8-b |
| 같은 세트에 대한 예측 방식별 오차 | [PDF 26장] RQ1·RQ2 | expectation(method) | Q8-c |
| 진행 추이(최근 3개월 -5.2kg) | [앱 설명 4-2] | body_measurement | Q9 |
| 기댓값 이탈: 데이터상 차이 + 트레이너 원인 태그 | [PDF 25장] | deviation_review | Q10 |
| 예상 이탈 뒤 다음 세트 재추천 | [인터뷰 2차 질문 끝] | recommendation.trigger = replan_after_deviation | 제약 테스트(여러 번 허용) |
| 일정 알림 | [인터뷰 1차-4] | session.scheduled_start | 후순위(D08) |
| 수업 메모를 주의사항으로 승격 | [앱 설명 6] | member_note.source_session_id | 예시 n1(10회차에서 생김) |
| 생리 주기 반영 | [인터뷰 2차-2] | cycle_log, session.cycle_day, member_consent | 제약 테스트 |
| 종목별 e1RM 추이, 운동 히스토리 타임라인, 1RM 직접 측정 | [인터뷰 기능], [설문 Q13], [PDF 6.2] | **아직 없음** | O20 |
| 회원 검색·새 회원 추가 | [앱 설명 4-1] | member | 화면 기능(쿼리 없음) |

## 5. 김서연 예시로 본 핵심 장면

**예시 데이터의 기준 시각: 2026-10-15(오늘) 17:36.** 13회차 '후면사슬 루틴'이 진행 중이고 RDL·힙쓰러스트가 끝나 레그컬(마무리) 차례다. 숫자는 인터뷰의 레그컬 예시에 맞춰 새로 만든 것이라 [앱 설명 4-3]의 예시(12회차 10/24, 5종목, 18/18)와 날짜·숫자가 다르다. 앱 설명과 같은 값은 진행 추이 -5.2kg([앱 설명 4-2])과 주의사항·확인사항의 제목, 주의사항 날짜([앱 설명 4-6])다. 세부 문구는 조금 다르다. 무릎은 예시 세트(10회차 RDL 통증)에 맞춰 'RDL'을 더했고, 허리는 '데드리프트 계열'로 넓혔다.

트레이너 인터뷰의 예시를 그대로 데이터로 만들었다. 9/28 '뒷다리 루틴'에서 레그컬을 **1번 워밍업 20kg**으로 했고, 오늘 '후면사슬 루틴'에서는 레그컬을 **마무리**로 쓸 차례다.

추천 엔진이 이 시점에 받는 입력 (Q1-b·Q2·Q3·Q4 결과):
- **오늘 맥락**: 앞에서 RDL 4세트 + 힙쓰러스트 3세트로 메인 작업 세트 7개, 선행 볼륨 3,717.5kg, 작업 세트 최저 RIR 1, 평균 RIR 1.4
- **같은 종목 이력**: 9/28 워밍업 20kg×15 2세트(선행 0세트, RIR 미입력), 10/12 보조 25kg×12·12·10(선행 작업 세트 8개 = 메인 4 + 보조 4, 볼륨 5,025kg, 마지막 세트 RIR 0)
- **역할 기준**: 마무리 = 15~20회, RIR 0~1, 2~3세트, 휴식 30~60초 (추가질문 2번 예시값, 임시)
- **주의사항**: 오른쪽 무릎 불편감은 오늘 확인함(괜찮음). 허리 과신전 주의는 오늘 아직 확인 안 함

이 정보로 만든 예시 추천(rc4, 숫자는 가상): "레그컬 기록: 9/28 워밍업 20kg 15회 2세트, 10/12 보조 25kg 12·12·10회. 오늘은 앞에서 메인 7세트(작업 세트 평균 RIR 1.4)를 한 뒤 마무리 역할이라 마무리 기준(15~20회, RIR 0~1)에 맞춰 무게를 낮춰 시작" → 17.5~20kg, 15~18회. 근거 문장에는 데이터에 있는 사실만 쓴다. 실제 계산 방식은 추천 엔진 설계에서 정하고(O21), 이 구조가 그 계산에 필요한 입력을 모두 담는다는 것까지 확인했다.

예시 데이터에 함께 넣은 장면:
- 12회차 스쿼트 탑세트: 네 방식으로 예상을 계산하고 personal 추천만 표시, 트레이너가 범위 안에서 정함(accepted). 근거는 8회차 스쿼트 40kg×10 3세트 RIR 2 (Q8-a, Q8-c)
- 12회차 레그프레스: 루틴 작성 때 추천 77.5~80kg, 무릎 주의사항 때문에 75kg으로 계획(modified, 이유 태그 pain_caution) (Q8-b)
- 12회차 레그컬 3세트: 예상 11~13회, 실제 10회 → 편차 검토(휴식 45초로 계획보다 짧음, 트레이너 원인 태그: 호흡) (Q10). AI가 이 사실로 다음 확인사항을 제안했고 트레이너가 채택함(n11, Q1-c)

## 6. 트레이너 답변이 오면 바뀌는 곳

질문 원문: [sources/trainer-followup-questions.md](../../sources/trainer-followup-questions.md).

| 질문 | 바뀌는 곳 | 구조 변경 필요? |
|---|---|---|
| O01 세트 구성 종류와 규칙 ([추가질문 1]) | `set_structure` 행과 `rule_json`. 새 세트 종류가 필요하면 `set_entry.set_kind` CHECK | 목록만이면 행 추가. `set_kind`가 늘면 CHECK 수정(SQLite는 테이블 재생성) |
| O02 역할별 횟수·RIR·세트·휴식·템포, 목표별 차이 ([추가질문 2]) | `role_default` 값(목표별 행 추가) | 없음. 오늘 목표별 기준이면 칸 추가 |
| O03 RIR/RPE, 누가 판단, 어느 세트에 기록 ([추가질문 3]) | `trainer.effort_scale`·`effort_rater`, iPad 입력 칸 | **RIR만이면 없음.** RPE를 목표로 쓰면 `plan_rpe`·`dec_rpe_target`·`role_default.rpe_min/max`·`rec_rpe` 추가, '쉬움/적당/힘듦'이면 `act_effort_simple` 추가 |
| O04 생리 주기 기록 방식 | `cycle_log`, `session.cycle_day` | 단계까지 기록하면 칸 추가 |
| O06 몸 쓰는 감각 척도 | `movement_assessment` CHECK(지금 1~5) | CHECK 수정 |
| O07 무게 기록 기준 | `exercise.weight_basis`, 볼륨 계산 | 덤벨 한 손 기준이면 볼륨 뷰에서 ×2 처리 |
| O08 컨디션이 세팅을 얼마나 바꾸나 | 컨디션 선택지 `cond_sleep/fatigue/soreness`, 추천 입력에 쓸지 | 선택지가 바뀌면 CHECK 수정. 추천 입력으로 쓰면 `inputs_json`에 추가(구조 변경 없음) |
| O09 세팅을 바꾸게 하는 관찰 | `session_observation.kind` | CHECK 수정 |
| O11 오늘 목표를 생각하는 형식 | `session.session_goal_type`·`progression_intent`·`progression_target` 선택지, 입력 화면 기본값 | 선택지가 바뀌면 CHECK 수정 |
| O12 장기 통증과 당일 불편감 구분 | `member_note`(caution)와 `session.cond_pain`의 경계 | 구분 방식에 따라 `cond_pain` 선택지 CHECK 수정 |
| O28 목표 우선순위를 두나 | `member_goal.priority` | 안 두면 모두 기본값 1로 두거나 칸을 삭제(지금은 NOT NULL이라 비워 둘 수 없음) |
| O29 훈련 방향의 기간 단위·진행 방향 | `training_block` | 주 단위 길이를 받으면 칸 추가 |

## 7. 아직 열린 설계 결정

번호가 있는 것은 [decisions.md](../../decisions.md)에서 상태를 관리한다.

- **O15 저장소와 동기화**: MVP는 iPad 한 대 로컬 저장, 서버 동기화는 다음 버전(D44). 동기화를 넣으면 모든 테이블에 `updated_at`·`deleted_at`을 추가하고 실제 삭제는 하지 않는다.
- **O16 맨몸·보조·시간 종목 볼륨**: 지금은 외부 중량만 볼륨 로드를 계산하고 나머지는 비워 둔다. 수업 카드의 총볼륨에는 '맨몸·보조 제외' 표시가 필요하다.
- **O17·O18 민감정보와 연구 활용**: 동의 이력은 `member_consent`에 있다. 암호화·접근 범위·철회 시 삭제 범위, 연구 활용 동의·가명 처리·IRB는 정해야 한다.
- **O19 브리핑의 '지난 동일 종목'**: 지금은 가장 최근 1건을 당시 역할과 함께 보여 준다(D46). 같은 역할 기록을 먼저 보여 줄지는 화면 설계에서 트레이너 반응을 보고 정한다.
- **O20 e1RM**: 공식(Epley/Brzycki/RIR 보정 여부)을 추천 엔진 v1 설계에서 고른 뒤 `v_e1rm` 뷰를 만든다. 1RM 직접 측정은 `set_kind = test`로 받을 수 있다.
- **O21 추천 계산 방식**: 예시 데이터의 예상·추천 숫자는 구조 확인용 가상 값이다.
- **O27 AI 검색 로그**: AI 기록 검색은 별도 테이블 없이 저장된 기록 전체(예: `session_caution_check`, `member_note`, `session.memo`, 세트 기록)를 근거로 답한다. 질문 로그가 필요하면 그때 추가한다.
- **O30 대리 수업**: `session.trainer_id`와 `member.trainer_id`가 다를 수 있다. 막을지 정하기 전까지는 허용한다.
- **O31 더 강한 참조 제약**: 수업 ↔ 훈련 방향 블록, 예상·추천 ↔ 세트를 복합 외래키로 묶는 방법이 있다. 지금은 트리거로 주요 경우만 막고, 참조 일치 트리거(주의사항 확인, 회원 전용 루틴, 예상·추천·편차 검토)는 새로 넣을 때만 검사한다. UPDATE까지 막을지도 이때 정한다. PostgreSQL로 옮기면 기간 겹침 금지를 `EXCLUDE USING gist`(btree_gist 확장, 날짜 캐스팅 필요)로 더 엄격하게 할 수 있다.
- **O32 오늘 목표와 장기 목표·역할 기준 연결**: 필요하면 `session.member_goal_id`와 오늘 목표별 `role_default` 행을 추가한다.
- **O34 설계로 정한 선택지 목록**: 부록에서 상태가 '임시(O34)'인 목록(장기 목표 종류, 주의사항 확인 결과, 훈련 방향 근거 태그, 이탈 원인 태그, 수정·거부 이유 태그)은 화면 프로토타입에서 트레이너 반응을 보고 확정한다.

## 8. 다음 단계

전체 로드맵은 [README 다음 단계](../../README.md#다음-단계) 하나만 둔다. 데이터 구조 쪽 할 일은 트레이너 추가 답변(O01~O03)을 반영한 v0.3이다.

## 9. 변경 기록

| 버전 | 날짜 | 바뀐 것 |
|---|---|---|
| v0.1 | 2026-10-15 | 첫 설계: 테이블 22개, 뷰 4개, 검증 쿼리 14개 |
| v0.2 | 2026-10-15 | 2026-10-15 문서 정리 반영. **추가**: `member_consent`, `routine_template_item`, 트리거 10개(동의·계획 고정(세트·종목)·참조 일치·루틴 소유), 부분 유니크 인덱스, 범위 CHECK, 인덱스. **칸 추가**: `set_entry.act_source`·`dec_rest_sec`·`plan/dec_duration_sec`, `session_exercise.plan_sets/dec_sets`·`note`(참고사항), `session.session_type`·`progression_target`·`cond_checked_at`, `recommendation.expectation_id`·`reject_reason_tags`·`trainer_feedback`, `exercise.weight_basis`·`variant_of`, `member_note.created_by`·`accepted_at`, `trainer.effort_rater`·`timezone`, `role_default.work_sec_*`. **고침**: 진행 중인 수업의 세트 수(7/7 → 7/9), 아직 시작 안 한 종목의 선행 맥락, 워밍업 판정(역할 + 세트 종류), 주 키(월요일 날짜), 볼륨은 작업 세트·외부 중량만, 방향 어휘 통일(increase/maintain/adjust/focus), 컨디션 '확인 안 함' 구분. **예시 데이터**: 오늘 = 10/15로 맞춤, 8회차·14회차 예정 추가, 경계 사례 추가. **검사**: 쿼리 18개에 기대값 59개, 제약 테스트 33개 |

## 부록: 선택지 목록

DB 값의 기준은 `schema.sql`의 CHECK와 `set_structure` 행이다. 상태: 확정 = 출처에서 확인됨, 임시 = 열린 질문 답에 따라 바뀜.

| 목록 | DB 값 → 한국어 | 출처 | 상태 |
|---|---|---|---|
| 역할 `role` | warmup 워밍업, main 메인, accessory 보조, finisher 마무리 털기, pump 혈류 모으기, circuit 유산소성 순환 | [PDF 2장] 예시 4종 + [인터뷰 기능] 2종 | 목록 확정(D39). 보조를 포함한 역할별 숫자 기준은 O02 |
| 세트 구성 `set_structure` | straight 스트레이트, top_backoff 탑세트+백오프, pyramid 피라미드, reverse_pyramid 역피라미드, superset 슈퍼세트, giant_circuit 자이언트세트/서킷, drop 드롭세트, rest_pause 레스트포즈, custom 기타 | [인터뷰 마지막] 질문 예시 + [추가질문 1] | 임시(O01) |
| 세트 종류 `set_kind` | warmup 워밍업, working 작업, top 탑, backoff 백오프, drop 드롭, rest_pause 레스트포즈, amrap 최대 반복, test 테스트 | 설계 | 임시(O01) |
| 훈련 방향 `training_block.direction` | increase 발전, maintain 유지, adjust 조절, focus 집중 | [인터뷰 3차-1] | 확정 |
| 진행 방식 `progression_target` | volume 볼륨, load 중량, reps 횟수, none 없음 | [인터뷰 기능], [인터뷰 2차 질문 2] | 임시(O11·O29) |
| 오늘 진행 의도 `session.progression_intent` | increase 올림, maintain 유지, adjust 조절 | [인터뷰 2차 질문 2] 예시 | 임시(O11) |
| AI 추천 방향 `recommendation.direction` | increase, maintain, adjust | [PDF 15장] | 확정 |
| 장기 목표 `member_goal.goal_type` (= `role_default.goal_type`) | hypertrophy 근비대, strength 근력, fat_loss 체지방 감소, endurance 지구력, rehab_posture 재활·자세, general 일반 | [앱 설명 4-1], [PDF 14장] | 임시(O34) |
| 오늘 목표 유형 `session.session_goal_type` | hypertrophy 근비대, strength 근력, power 파워, endurance 지구력, technique 동작 연습, recovery 회복, general 일반 | [인터뷰 2차 질문 2] 예시, [PDF 8.1] | 임시(O11) |
| 체성분 단계 `body_comp_phase.phase` | cut 감량, maintain 유지, bulk 증량 | [PDF 19장] | 확정 |
| 컨디션 `cond_sleep/fatigue/soreness` | good 좋음, normal 평소, poor 나쁨 (비어 있으면 확인 안 함) | [인터뷰 2차-5] | 임시(O08) |
| 컨디션 통증 `cond_pain` | none 없음, mild 약간, notable 뚜렷함 | [인터뷰 2차-5] | 임시(O12) |
| 메모 종류 `member_note.kind` | caution 주의사항, check 확인사항, lifestyle 생활, self_train 개인 운동, diet 식단, personality 성향, general 기타 | [앱 설명 4-6], [인터뷰 1차-2], [설문 Q10] | 확정 |
| 주의사항 확인 결과 `session_caution_check.status` | ok 괜찮음, same 그대로, worse 나빠짐, better 좋아짐 | 설계 | 임시(O34) |
| 관찰 종류 `session_observation.kind` | focus 집중력, immersion 몰입도, reaction 반응, stability 동작 안정성, recovery 회복 속도, other 기타 | [인터뷰 3차-3] 질문 예시 | 임시(O09) |
| 훈련 방향 근거 `reason_tags` | performance_trend 수행 추세, sleep 수면, fatigue 피로, diet 식단, work_schedule 업무 일정, training_frequency 운동 빈도, cycle 생리 주기, pain 통증(해석) | [인터뷰 2차-2], [인터뷰 3차-1] | 임시(O34) |
| 이탈 원인 태그 `cause_tags` | breathing 호흡, force_pattern 힘 쓰는 방식, neural 신경계(트레이너 판단), condition 컨디션, sleep 수면, pain 통증, unknown 모름 | [인터뷰 기능] | 임시(O34) |
| 수정·거부 이유 `reject_reason_tags` | condition 컨디션, pain_caution 통증·주의사항, purpose_mismatch 목적과 안 맞음, too_heavy 너무 무거움, too_light 너무 가벼움 | 설계 | 임시(O34) |
| 무게 기록 기준 `weight_basis` | total 바 포함 전체, per_hand 덤벨 한 손, stack 머신 표시값, bodyweight_added 맨몸+추가 중량 | 설계 | 임시(O07) |
| 노력도 척도 `effort_scale` | RIR, RPE, BOTH 둘 다, SIMPLE 쉬움/적당/힘듦 | [추가질문 3] | 임시(O03) |
| 입력 출처 `act_source` | entered 직접 입력, confirmed_default 미리 채운 값 확인 | 설계 (D37) | 확정 |
| 추천 시점 `recommendation.trigger` | routine_plan 루틴 작성 때, pre_set 세트 직전, replan_after_deviation 이탈 뒤 재계획 | [인터뷰 2차 질문 끝], [PDF 24장] | 확정 |
| 바꿀 변수 `changed_variable` | load 중량, reps 횟수, sets 세트, effort 노력도, rest 휴식, none 없음 | [PDF 8.3·15장] | 확정 |
| 트레이너 반응 `trainer_action` | accepted 채택, modified 수정, rejected 거부 | [PDF 1.2] 표, [PDF 24장] | 확정 |
| 이탈 방향 `deviation_review.direction` | below 예상보다 낮음, above 예상보다 높음 | [PDF 25장] | 확정 |
| 요약 출처 `summary_source` | rule 규칙 계산, llm 문장 생성, trainer 트레이너 작성 | 설계 (D07) | 확정 |
| 수업 상태 `session.status` | planned 예정, in_progress 진행 중, completed 완료, cancelled 취소, no_show 노쇼 | 설계 | 확정 |
| 수업 종류 `session.session_type` | lower 하체, upper 상체, full 전신, other 기타 | [앱 설명 4-3] | 확정 |
| 수업 안 종목 상태 `session_exercise.status` | pending 대기, in_progress 진행 중, done 완료, partial 일부만, skipped 건너뜀, replaced 교체 | [인터뷰 2차 질문 3], D36 | 확정 |
| 동의 종류 `member_consent.kind` | app_health 건강 기록, cycle 생리 주기, research 연구 활용 | 설계 (O17·O18) | 임시 |

이름 충돌 메모: 역할 `circuit`(유산소성 순환 운동)과 세트 구성 `giant_circuit`(3종목 이상 연속)은 다른 개념이다. 세트 구성 쪽 한국어 이름은 추가질문 1번 답을 받을 때 정한다.
