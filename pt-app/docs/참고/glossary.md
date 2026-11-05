# 용어집

> 상태: 최신 · 최종 수정 2026-10-15 · 이 문서가 기준인 주제: 문서·화면·DB에서 쓰는 용어의 뜻과 대응 이름
> DB 값의 정확한 정의는 [schema.sql](design/data-model/schema.sql)의 CHECK 제약이고, 한국어 대응표는 [data-model.md 부록](design/data-model/data-model.md#부록-선택지-목록)이다. 쓰는 규칙은 [data-model.md](design/data-model/data-model.md)가 기준이다. 결정 번호(D··)와 열린 질문(O··)은 [decisions.md](decisions.md) 기준.

'누가 정하나' 열: **트레이너** = 트레이너가 입력·선택, **AI** = 앱이 계산해 제안(트레이너가 채택·수정·거부), **계산** = 저장된 기록에서 정해진 식으로 계산, **회원** = 회원이 말한 값.

## 1. 기본 단위

| 한국어 | 영어/PDF 용어 | DB 이름 | 뜻 | 누가 정하나 |
|---|---|---|---|---|
| 회원 | Member | `member` | PT를 받는 사람. 이름 등 거의 안 바뀌는 최소 정보만 둔다 | 트레이너 |
| 수업 = 세션 = PT 1회 | Session | `session` | 한 번의 PT. 예정 상태로 미리 만든 수업이 곧 '예정 루틴' | 트레이너 |
| 회차 | session number | `session.session_no` | 회원별 몇 번째 수업인지 | 트레이너 |
| 종목 | Exercise | `exercise` | 스쿼트, 레그컬 같은 운동 하나(라이브러리) | 트레이너 |
| 수업 안의 종목 | Session exercise | `session_exercise` | 특정 수업에서 쓴 종목 하나. 역할·세트 구성·순서를 가짐 | 트레이너 |
| 세트 | Set | `set_entry` | 가장 작은 기록 단위. 한 줄에 계획·결정·실제를 함께 둔다 | 트레이너 |
| 루틴 템플릿 | Routine template | `routine_template`, `routine_template_item` | '뒷다리 루틴', '후면사슬 루틴'처럼 이름 붙은 종목 구성. 불러오는 틀 | 트레이너 |

## 2. 목표와 방향 (층이 다르니 섞지 않는다)

PDF 14장의 목표 계층: 회원 장기 목표 → 훈련기간 방향 → 오늘 세션 목표 → 개별 종목의 역할.

| 한국어 | 영어/PDF 용어 | DB 이름 | 뜻 | 누가 정하나 |
|---|---|---|---|---|
| 트레이너 의도 | Trainer Intent | 여러 칸에 나뉨 | PDF 13장: 트레이너가 먼저 정하는 훈련 방향, 당일 세션의 목적, 수행할 운동, 운동별 이유와 역할. AI 추천의 출발점이다. PDF 21장은 같은 말을 '오늘 세션의 주된 목표와 방향'이라는 좁은 뜻으로도 쓴다 | 트레이너 |
| 장기 목표 | long-term goal | `member_goal.goal_type` | 근비대·근력·체지방 감소 등. 여러 개 동시에, 기간이 있다 (D27). 우선순위 칸은 설계 선택 (O28) | 트레이너 |
| 체성분 단계 | body composition phase | `body_comp_phase.phase` | 감량(cut)·유지(maintain)·증량(bulk). 운동 목표와 따로 둔다 (D28) | 트레이너 |
| 훈련 방향(기간) | training block direction | `training_block.direction` | 여러 주에 걸친 방향(기간 단위는 O29). 발전(increase)·유지(maintain)·조절(adjust)·집중(focus) (D29) | 트레이너 |
| 진행 방식 | progression target | `training_block.progression_target`, `session.progression_target` | 무엇을 올리거나 지킬지: 볼륨(volume)·중량(load)·횟수(reps)·없음. '볼륨 유지' = 방향 maintain + 진행 방식 volume | 트레이너 |
| 오늘 목표 | session goal (PDF 21장의 좁은 뜻의 Trainer Intent) | `session.session_goal_type`, `session_goal_text` | 이번 수업의 목적. 유형(근비대·근력·동작 연습 등) + 한 줄 문장 | 트레이너 |
| 오늘 진행 의도 | session progression intent | `session.progression_intent` | 이번 수업에서 올릴지(increase)·유지할지(maintain)·조절할지(adjust) | 트레이너 |
| 역할 | exercise role | `session_exercise.role` | 그 종목을 오늘 왜 넣었는지: 워밍업·메인·보조·마무리 털기·혈류 모으기·유산소성 순환 (D39) | 트레이너 |
| 세트 구성 | set structure | `session_exercise.set_structure` → `set_structure` | 스트레이트, 탑세트+백오프, 슈퍼세트, 드롭세트 등. 숫자 규칙은 추가질문 1번 답 대기 (O01) | 트레이너 |
| AI 추천 방향 | Increase / Maintain / Adjust | `recommendation.direction` | 개별 세팅에 대한 AI 제안의 방향 (PDF 15장). 훈련 방향(기간)과 값 이름은 비슷하지만 다른 층이다 | AI |
| 바꿀 변수 | changed variable | `recommendation.changed_variable` | 추천이 무엇을 바꾸는지: 중량·횟수·세트·노력도·휴식 | AI |

**자주 헷갈리는 짝**
- 역할 `circuit`(유산소성 순환 운동)과 세트 구성 `giant_circuit`(자이언트세트/서킷, 3종목 이상 연속)은 다른 개념이다. 세트 구성 이름은 추가질문 1번 답을 받을 때 다시 정한다.
- 트레이너 인터뷰의 '다이어트면 볼륨 유지, 벌크업이면 볼륨 상승'은 AI 규칙이 아니라 트레이너가 고르는 훈련 방향 + 진행 방식이다. 체성분 단계와 자동으로 연결하지 않는다 (D19).

## 3. 기록 값

| 한국어 | 영어/PDF 용어 | DB 이름 | 뜻 | 누가 정하나 |
|---|---|---|---|---|
| 계획값 | planned | `set_entry.plan_*`, `session_exercise.plan_sets`·`plan_rest_sec`·`plan_order` | 수업 전 루틴 작성 때 정한 숫자. 수업이 시작되면 이미 채운 값은 고칠 수 없다 (D36) | 트레이너 (AI 제안 채택 포함) |
| 결정값 | Trainer Decision | `set_entry.dec_*`, `session_exercise.dec_sets` | 수업 중 세트 직전에 트레이너가 최종으로 정한 숫자 (PDF 24장) | 트레이너 |
| 실제값 | Actual Performance | `set_entry.act_*` | 회원이 실제로 한 결과 | 트레이너가 입력 |
| 입력 출처 | act source | `set_entry.act_source` | 직접 입력(entered)인지, 미리 채운 값을 확인만 했는지(confirmed_default). RIR·RPE는 미리 채우지 않는다 | 계산(앱이 기록) |
| 참고사항 | routine note | `session_exercise.note` | 예정 루틴의 종목별 자세·통증·수행 관련 메모 ([앱 설명 4-5]). 세트 하나에 대한 메모는 `set_entry.note` | 트레이너 |
| RIR | Repetitions in Reserve | `act_rir`, `plan_rir`, `dec_rir_target` | 세트를 끝냈을 때 몇 개 더 할 수 있었는지. 0 = 한계 | 회원·트레이너 (누가 판단하는지는 O03) |
| RPE | Rating of Perceived Exertion | `act_rpe` | 1~10 힘든 정도. 생리값이 아니라 자각 강도 | 회원·트레이너 (O03) |
| 노력도 척도 | effort scale | `trainer.effort_scale` | 수업 중 RIR·RPE·둘 다·'쉬움/적당/힘듦' 중 무엇을 쓰는지. 임시값 RIR (O03) | 트레이너 |
| 템포, TUT | tempo, time under tension | `session_exercise.tempo` | 예 '3-1-1-0'(내림-정지-올림-정지 초). 볼륨에 곱하지 않고 따로 저장 (D20) | 트레이너 |
| 컨디션 4항목 | Pre-session Context | `session.cond_sleep/fatigue/soreness/pain` | 수업 전 수면·피로·근육통·통증. 비어 있으면 '확인 안 함' (D33) | 트레이너 (회원에게 물어봄) |
| 주의사항 | caution | `member_note` (kind = caution) | 통증·불편감 등 운동 중 주의할 것. 매 수업 확인한다 (D32) | 트레이너 |
| 확인사항 | check | `member_note` (kind = check) | 다음에 확인하거나 할 일. 물어보기로 한 것도 포함 (예: 스쿼트 무게 증량 확인, 체성분 재측정, [앱 설명 4-6]) | 트레이너 (AI 제안 채택 가능) |
| 특이 관찰 | observation | `session_observation` | 집중력·몰입도 등이 평소와 다르게 튄 날만 남기는 기록 (D38) | 트레이너 |
| 몸 쓰는 감각 | movement sense | `movement_assessment` | 자세 안정성·동작 습득 속도·피드백 반영·반복 시 자세 유지 + 힘 쓰는 부위. 신규 회원 Cold Start 입력 (D30, 척도 O06) | 트레이너 |

## 4. 계산 값과 AI

| 한국어 | 영어/PDF 용어 | DB 이름 | 뜻 | 누가 정하나 |
|---|---|---|---|---|
| 볼륨 로드 | volume load | `v_set_volume.volume_load` | 중량 × 횟수. 외부 중량 종목의 작업 세트만 합산. 맨몸·보조·시간 종목은 비워 둠 (O16) | 계산 |
| 작업 세트 | work set | `v_set_volume.is_work_set` | 역할이 워밍업이 아니고 세트 종류도 워밍업이 아닌 완료 세트 | 계산 |
| 선행 맥락 | prior context | `v_prior_context` | 그 종목 직전까지 같은 수업에서 한 세트 수·볼륨·메인 세트 수·RIR | 계산 |
| 1RM, 추정 1RM | 1RM, e1RM | (아직 없음) | 1RM = 한 번 들 수 있는 최대 중량. e1RM = 세트 기록으로 추정한 1RM. 공식은 추천 엔진 설계에서 정함 (O20) | 계산 |
| 예상 수행 | Expected Performance | `expectation` | "이 무게면 몇 회 가능할까"를 범위로 (예: 8~9회). 추천과 따로 둔다 (D14) | AI |
| 추천 | Recommendation | `recommendation` | "오늘 목적에 맞게 얼마나 시킬까". 범위 + 근거 문장 | AI |
| 트레이너 반응 | trainer action | `recommendation.trainer_action` | accepted = 결정값이 추천 범위 안 / modified = 범위 밖이거나 다른 변수를 바꿈 / rejected = 추천과 다른 방향 | 트레이너 |
| 추천 시점 | trigger | `recommendation.trigger` | 루틴 작성 때(routine_plan) / 세트 직전(pre_set) / 예상 이탈 뒤 다시 짤 때(replan_after_deviation) | 계산 |
| 기댓값 이탈 | deviation | `deviation_review` | 실제가 예상 범위 밖. AI는 데이터상 차이만 보여 주고 원인은 트레이너가 태그 (D16) | AI(차이) + 트레이너(원인) |
| 기준선 | baseline, Population Expectation (PDF 6.1) | method = `population` | 일반 공식을 그대로 적용한 값. 회원별로 학습한 보정 없음. 아래 연구질문의 '비교 기준'과는 다른 말이다 | AI |
| 예측 방식 4종 | prediction method | `expectation.method`, `recommendation.method` | population 일반 공식 / recent 같은 종목 직전 기록 그대로 / personal 일반 공식 + 회원별 보정 / personal_context personal + 오늘 맥락(역할·노력도·선행 수행·목적). 정확한 정의는 [data-model.md 3-6](design/data-model/data-model.md#3-6-ai-관련) | AI |
| 연구질문 | RQ1·RQ2·RQ3 | — | RQ1 맥락의 가치: personal_context(검증 대상) 대 personal(비교 기준). RQ2 개인화의 가치: personal(검증 대상) 대 population·recent(비교 기준). RQ3 트레이너에게 유용한가: 채택·수정·거부와 이유 태그, 사용 후 인터뷰 (PDF 26장). 방식 대응은 [해석], [project-analysis.md 10절](analysis/project-analysis.md#10-연구질문-pdf-26장) | — |
| 신규 회원 시작값 | Cold Start | `body_measurement` + `movement_assessment` | 기록이 없는 회원의 첫 중량·횟수를 정할 때 쓰는 정보: 키·체중·근육량(DB는 골격근량) + 몸 쓰는 감각 (D30) | 트레이너 |
| 기록 요약 | session summary | `session.summary`, `summary_source` | 수업 후 요약. 규칙 계산(rule) 우선, 문장 생성(llm)은 보조 (D07) | 계산·AI |

## 5. 개발·연구 용어

| 용어 | 뜻 |
|---|---|
| MVP | 최소 기능 제품. 트레이너가 실제로 써 볼 수 있는 첫 버전 |
| 테이블 | 기록을 담는 표. 예: `session`(수업), `set_entry`(세트) |
| 뷰 | 저장하지 않고 테이블에서 그때그때 계산해 보여 주는 표. 예: `v_session_summary`(수업 기록 카드) |
| 트리거 | 잘못된 입력을 DB가 자동으로 막는 규칙. 예: 수업이 시작된 뒤 계획값 수정 막기 |
| 제약 (CHECK·외래키·유니크) | 칸에 들어갈 수 있는 값을 정하는 규칙. CHECK = 허용 값 목록·범위, 외래키 = 다른 표에 있는 값만, 유니크 = 중복 금지 |
| 쿼리, Q1-a~Q10 | DB에서 화면에 필요한 정보를 꺼내는 질의. 번호는 [queries.sql](design/data-model/queries.sql)의 제목이고 목록은 [data-model.md 4절](design/data-model/data-model.md#4-요구사항--구조--검증-쿼리) |
| 기대값 (expect) | 예시 데이터로 쿼리를 돌렸을 때 나와야 하는 값. 자동 검사가 실제 결과와 비교한다 |
| 제약 테스트 | 막아야 할 입력이 실제로 막히는지, 허용해야 할 입력이 통과하는지 확인하는 자동 검사 |
| UUID | 기기에서 만들어도 겹치지 않는 긴 id. iPad에서 오프라인으로 기록을 만들기 위해 씀 (D44) |
| SQLite, PostgreSQL | DB 프로그램. 설계는 SQLite로 검증하고, 서버를 둘 때 PostgreSQL로 옮기기 쉽게 썼다 (D45) |
| JSON 태그 | 칸 하나에 여러 선택지를 목록으로 저장하는 방식. 예: 이탈 원인 `["breathing"]` |
| STT | 음성을 글로 바꾸는 기능. 이 앱에서는 쓰지 않는다 (D01) |
| LLM | 문장을 만드는 AI 모델. 요약 문장 생성에 보조로만 쓴다 (D07) |
| IRB | 사람을 대상으로 한 연구의 윤리 심의. 실제 회원 기록을 연구에 쓸 때 필요한지 확인해야 한다 (O18) |
| 가명 처리 | 보고서에 실명 대신 다른 이름이나 기호를 쓰는 것 (O18) |
