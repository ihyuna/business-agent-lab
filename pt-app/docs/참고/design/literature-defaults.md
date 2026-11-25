# 논문 기준 임시값

> 상태: 임시 · 버전 v0.3 · 최종 수정 2026-11-25 · 이 문서가 기준인 주제: 트레이너 답(O01~O14, O28, O29)과 추정 1RM 공식(O20)이 오기 전까지 쓰는 논문 기준 임시값과 출처

- 만든 까닭: 2026-10-27 이현아님 "지금 트레이너가 답변을 주기 어려운 상황이라 논문과 객관적인 정보를 바탕으로 일단 진행하고" (D59). 2026-11-25 이현아님 "답 기다리고 있는 것들 전부 논문 임시값으로 진행해줘"로 나머지 질문도 넣었다(D115, [8절](#8-나머지-트레이너-질문의-임시값-d115)).
- 논문 인용 표기는 `[문헌 Craven 2022]`처럼 쓰고, 목록은 [10절](#10-출처)에 있다. 연구보고서가 이미 인용한 논문(Halperin 2022, Nuzzo 2024, Huang 2025, Vieira 2022)은 [project-analysis.md 6절](../analysis/project-analysis.md#6-문헌-기반-설계-원칙-pdf-317장)을 따른다.
- 예시 숫자는 모두 계산을 보여 주려고 지어낸 '예시'다. 회원 기록이 아니다.

---

## 0. 결론 먼저

1. **추정 1RM:** Epley 공식에 여유 횟수(RIR)를 더해 `무게 × (1 + (횟수 + RIR) / 30)`로 계산한다. 10회 이하 세트만 쓰고, 종목(기구)마다 따로 계산한다.
2. **역할별 기준:** 추가질문 2번에 넣었던 예시값이 논문과 크게 어긋나지 않는다. 그대로 임시값으로 쓰고, 근거 카드에 출처를 붙인다.
3. **세트 구성:** 백오프·피라미드 무게는 고정 %가 아니라 그 세트의 목표 횟수·RIR로 추정 1RM에서 다시 계산한다. 드롭세트만 논문 예시대로 약 20% 내린다.
4. **RIR과 RPE:** RIR('몇 개 더 할 수 있었나')로 적는다. 칸은 비워 두고(D37), 메인 종목 마지막 세트에서만 한 번 탭으로 고르게 권한다.
5. **컨디션:** 수면·피로·근육통이 '평소보다 나쁨'이면 목표 RIR을 1 늘려 무게를 다시 계산한다. 고정 %로 깎지 않는다. 통증은 숫자를 바꾸지 않고 트레이너가 확인한다.
6. **나머지 질문 13개(D115):** 생리 주기는 숫자를 자동으로 바꾸지 않고, 몸 쓰는 감각 점수에 뜻을 붙이고, 같은 부위 통증이 7일 넘거나 2번 연달아면 주의사항으로 옮기기를 권하고, 훈련 방향은 4주 단위로 한다. 나머지는 지금 가정 그대로다.
7. **근거 점검(D116):** 추천 숫자를 받치는 논문 11편을 다시 봤다. 강함 5편, 보통 5편, 약함 1편(설명 글). 잘못 쓰던 1편을 메타분석 2편으로 바꿨고 값은 그대로다([11절](#11-근거-논문-점검-d116)).

## 1. 논문 값을 쓰는 원칙

연구보고서는 "RIR 1 → 다음 중량 -10%" 같은 논문 수치를 증감 계수로 박아 두는 것을 금지했다 (D13, [PDF 16장]). 이 문서의 값은 그 규칙 안에서 쓴다.

- **출발값이다.** 트레이너 기준 표(`role_default`, `set_structure`)에 넣는 처음 값이고 코드에 박지 않는다. 트레이너가 화면에서 고칠 수 있다.
- **범위로 낸다.** 한 값이 아니라 범위로 보여 준다 (D13, [PDF 12.1]).
- **바뀐다.** 트레이너 답이 오면 트레이너 값으로 바꾼다. 회원 기록이 쌓이면 회원별 공식이 앞선다 (D49, D50, D57).
- **밝힌다.** 근거 카드에 '논문 기준 임시값'이라고 적고 출처를 붙인다 (D58). 원인 진단이나 "더 정확하다" 같은 말은 쓰지 않는다 (D11).

## 2. 추정 1RM (O20)

| 항목 | 임시값 | 근거 |
|---|---|---|
| 공식 | `추정 1RM = 무게 × (1 + (횟수 + RIR) / 30)` | Epley 공식 `무게 × (1 + 횟수/30)`. [문헌 Reynolds 2006]에서 Epley는 레그프레스에서 평균 오차가 작은 편이었다. RIR을 횟수에 더하는 것은 RIR을 '실패까지 남은 횟수'로 쓰는 방식([문헌 Helms 2016], [문헌 Zourdos 2016])을 따른 것이다 [해석] |
| 쓰는 세트 | 횟수 10회 이하 | [문헌 Reynolds 2006] "no more than 10 repetitions should be used in linear equations to estimate 1RM". 5RM이 가장 정확했다 |
| RIR이 비었을 때 | RIR 0으로 계산한다 | 실제보다 낮게 나와 무게가 보수적으로 나온다 [해석]. 새 회원은 보수적으로 시작하는 방식은 경쟁 앱 Fitbod와 같다 |
| 종목 단위 | 종목(기구)마다 따로 | 일반 %1RM-반복수 관계는 처음 기준일 뿐 종목마다 다를 수 있다(Nuzzo 2024, [PDF 6.1]). 기구마다 무게 표시가 달라 다른 기구끼리는 숫자를 비교하지 않는다 [해석] |
| 불확실성 | 결과를 범위로 낸다 | RIR은 평균 약 1회 적게 말한다(Halperin 2022, [PDF 5.3]) |

**무게 거꾸로 계산하기:** 목표 횟수 r, 목표 RIR q이면 `무게 = 추정 1RM / (1 + (r + q) / 30)`를 계산하고 기구 눈금([7절](#7-기구-무게-눈금-o36-일부))에 맞춰 내린다.

예시: 레그프레스 100kg × 8회, RIR 2 → 추정 1RM = 100 × (1 + 10/30) ≈ 133.3kg. 다음에 10회 RIR 2를 하려면 133.3 / (1 + 12/30) ≈ 95.2kg → 눈금 2.5kg이면 95kg.

## 3. 역할별 기준 (O02)

임시값은 [추가질문 2]에 넣었던 예시값(횟수 / RIR / 세트 / 휴식)이다. 논문과 견준 결과를 붙였다.

| 역할 | 임시값 | 논문과 견준 것 |
|---|---|---|
| 워밍업 | 12~15회 / 5개 이상 / 1~2세트 / 30~60초. 무게는 첫 본세트의 약 50%, 75% | 워밍업 세트 무게는 논문 근거를 찾지 못한 실무 관행이다 [해석]. 경쟁 앱 Alpha Progression도 워밍업 세트를 자동으로 넣는다 |
| 메인 | 6~10회 / 1~3개 / 3~5세트 / 2~3분 | 3분 휴식이 1분보다 근력·근비대가 모두 컸다([문헌 Schoenfeld 2016], 훈련된 남성 21명 무작위 실험 하나라 [문헌 Singer 2024] 메타분석으로 함께 받친다). 근력은 RIR 폭넓게 비슷했고 근비대는 실패에 가까울수록 컸다([문헌 Robinson 2024]) |
| 보조 | 8~12회 / 1~2개 / 3세트 / 60~90초 | 60초보다 길게 쉬면 근비대에 작은 이득이 있고, 90초를 넘으면 차이를 찾지 못했다([문헌 Singer 2024]) |
| 마무리 털기 | 15~20회 / 0~1개 / 2~3세트 / 30~60초 | 가벼운 무게도 실패 가까이 하면 근비대는 무거운 무게와 비슷했다([문헌 Schoenfeld 2017], [문헌 Lopez 2021]). 실패에 가까울수록 피로가 커지니 수업 끝에 둔다(Vieira 2022, [PDF 6장 표]) |
| 혈류 모으기 | 15~25회 / 1~2개 / 2~3세트 / 30초 | 60초보다 짧은 휴식은 근비대에 조금 불리할 수 있다([문헌 Singer 2024]). 트레이너가 목적을 갖고 고르는 역할이라 값은 두고, 근거 카드에 이 점을 적는다 [해석] |
| 유산소성 순환 | 횟수 대신 시간·라운드 / 여유 있게 / 3~4라운드 / 거의 안 쉼 | 길항근·상하체를 번갈아 하는 묶음은 시간을 아낀다([문헌 Krzysztofik 2019]) |

**목표에 따라 바뀌는 것:** 근력 목표면 메인을 3~6회로 둔다. 최대 근력(1RM)은 무거운 무게가 가벼운 무게보다 더 올랐다는 메타분석 두 편을 따른 것이다([문헌 Schoenfeld 2017], [문헌 Lopez 2021]). 무거운 무게와 중간 무게의 차이는 뚜렷하지 않았다([문헌 Lopez 2021]). 근비대·체지방 감소 목표는 위 표 그대로다 [해석]. 템포는 논문 기준값을 두지 않고 비워 둔다.

## 4. 세트 구성 규칙 (O01)

| 세트 구성 | 임시 규칙 | 근거 |
|---|---|---|
| 스트레이트 | 모든 세트 같은 목표 횟수·RIR, 같은 무게 | [2절](#2-추정-1rm-o20) 공식 |
| 탑세트 + 백오프 | 탑세트 1세트(목표 RIR 1~2). 백오프는 탑세트 결과로 다시 계산한 추정 1RM에서 목표 횟수·RIR로 무게를 정한다 | 고정 % 대신 그날 수행으로 정하는 자동 조절([문헌 Helms 2018], Huang 2025 [PDF 6장 표]) |
| 피라미드·역피라미드 | 세트마다 목표 횟수를 바꾸고(예: 12→10→8) 같은 추정 1RM에서 무게를 계산한다 | [해석]. 무게를 정하는 방식만 정한 것이고, 효과가 더 낫다는 뜻은 아니다 |
| 드롭세트 | 한계 근처(RIR 0~1)에서 무게를 약 20% 내려 이어 간다 | [문헌 Krzysztofik 2019] "immediately reducing the load (e.g., ~20%)". 전통 세트보다 근비대가 낫다는 근거는 없었다 |
| 레스트포즈·클러스터 | 같은 무게로 20~60초 쉬고 이어 간다 | [문헌 Krzysztofik 2019] 클러스터 세트 "short, inter-set rest intervals (20−60s)" |
| 슈퍼세트 | 길항근·상하체 짝은 각자 규칙대로. 같은 근육 짝은 두 번째 종목을 횟수 범위 아래쪽으로 | 길항근 짝은 볼륨이 유지되고 같은 근육 짝은 볼륨이 줄었다([문헌 Krzysztofik 2019]) |
| 자이언트세트·서킷 | 유산소성 순환 역할 기준을 쓴다 | 위와 같음 |

**예시:** 탑세트 100kg × 6회, RIR 1 → 추정 1RM ≈ 123.3kg. 백오프 3세트 8~10회, RIR 2 → 123.3 / (1 + 10/30) ≈ 92.5kg, 123.3 / (1 + 12/30) ≈ 88.1kg → 87.5~92.5kg.

## 5. RIR과 RPE (O03)

- **RIR로 적는다.** 트레이너에게 '몇 개 더 할 수 있었나'가 숫자 척도보다 묻기 쉽다고 본다 [해석]. RPE와는 RPE 10 = RIR 0, RPE 9 = RIR 1로 바꿔 읽는다([문헌 Zourdos 2016], [문헌 Helms 2016]).
- **기본은 비워 둔다(D37).** 메인 종목의 마지막 세트에서 0, 1, 2, 3, 4 이상 가운데 한 번 탭으로 고르게 권한다. 추정 1RM에 RIR이 들어가기 때문이다([2절](#2-추정-1rm-o20)).
- **누가 판단했는지**(회원이 말함 / 트레이너가 봄)는 기존 칸(`effort_rater`)에 남긴다. 기본값은 정하지 않는다.
- RIR은 평균 약 1회 적게 말하는 경향이 있어(Halperin 2022), 결과는 범위로 낸다.

## 6. 컨디션 반영 (O08)

**논문이 말하는 크기:** 급성 수면 부족은 운동 수행을 평균 7.56% 낮췄다. 근력은 -2.85%로 작았고 하체(-3.42%)만 뚜렷했다. 오후·저녁 수업(-8.31%)이 오전(-5.42%)보다 컸고, 깨어 있던 시간이 한 시간 늘 때마다 약 0.4% 낮아졌다([문헌 Craven 2022]). 같은 수면 부족이라도 종목, 시간, 사람에 따라 크기가 달라서 고정 %로 깎기 어렵다 [해석].

**임시 규칙:**

1. 수면·피로·근육통 가운데 하나라도 '평소보다 나쁨'이면 그날 목표 RIR을 1 늘린다(여유 1개 더). 무게는 [2절](#2-추정-1rm-o20) 공식으로 다시 계산하고, 횟수 범위는 그대로 둔다.
2. 여러 항목이 나빠도 1만 늘린다. 항목을 점수 하나로 합치지 않는다 (D13).
3. 첫 본세트의 실제 횟수·RIR이 나오면 남은 세트를 그 결과로 다시 맞춘다(4b). 고정 %보다 그날 수행으로 정하는 자동 조절이다([문헌 Helms 2018], Huang 2025 [PDF 6장 표]).
4. 통증은 숫자를 바꾸지 않는다. 주의사항 확인을 띄우고, 종목을 바꿀지는 트레이너가 정한다 (D12, D32).
5. 계획을 고정하기 전, 수업 시작 단계에서 한다 (D36, D57).

**예시:** 위 레그프레스(추정 1RM 133.3kg), 오늘 10회. 평소면 RIR 2 → 95kg. 수면 '부족'이면 RIR 3 → 133.3 / (1 + 13/30) ≈ 93.0kg → 눈금 2.5kg이면 92.5kg.

**근거 카드 문구 예:** "오늘 수면 '부족' → 여유를 1개 더 남기도록 95kg → 92.5kg. 수면이 부족하면 하체 근력이 평균 약 3% 낮았다는 연구가 있다 [Craven 2022]. 첫 세트 결과로 다시 맞춘다."

## 7. 기구 무게 눈금 (O36 일부)

무게를 거꾸로 계산하면 기구 눈금에 맞춰 내려야 한다. 그래서 종목 사전에 **무게 눈금**(원판 2.5kg·5kg, 핀 한 칸 무게) 칸이 필요하다. 눈금이 너무 커서 한 칸 올리면 범위를 넘을 때는 무게 대신 횟수를 하나 올린다. 이 방식은 경쟁 앱 RP Hypertrophy에서 가져왔다([경쟁 앱 분석](https://claude.ai/artifact/2ESBBjsAsBztcDGNQUcJEH)). 지금 데이터 구조에는 이 칸이 없다.

## 8. 나머지 트레이너 질문의 임시값 (D115)

2026-11-25 이현아님 "답 기다리고 있는 것들 전부 논문 임시값으로 진행해줘" (D115). 아직 안 보낸 질문 13개(O04~O14, O28, O29)도 트레이너 답을 기다리지 않고 아래 값으로 간다. 논문이 직접 답하는 질문은 논문 값을 쓰고, 논문이 다룰 수 없는 질문(기기 예절, 말뜻, 수업 습관)은 객관적 근거(수첩 기록, 일반 기준)로 정하고 [해석]이라고 밝힌다. 1절 원칙(출발값, 범위, 바뀜, 밝힘)은 그대로다. 트레이너가 나중에 답하면 그 답이 앞선다.

| 질문 | 임시값 | 근거 | 앱에서 |
|---|---|---|---|
| O04 생리 주기 | 시작일만 적는다(동의한 회원만, D41). 주기 단계로 무게·횟수를 자동으로 바꾸지 않는다. 브리핑에 '주기 n일째'만 보이고, 바꿀지는 트레이너가 정한다 | 주기 단계에 따른 수행 차이는 평균적으로 아주 작았고(초기 난포기만 '사소한' 감소) 사람마다 달라 개인별로 보라고 했다([문헌 McNulty 2020]). 근력 수행과 근력 운동 적응에 주기 단계 영향이 없다는 정리도 있다([문헌 Colenso-Semple 2023]) | 바뀌는 것 없음. 시작일 칸과 동의 확인은 그대로 |
| O05 수업 중 iPad | 써도 된다고 가정한다(D02). 화면은 한 손 탭 위주, 수업 중 입력은 3~5분 안(D03) | 논문이 답할 수 없는 질문이다 [해석]. 트레이너 설문에서 폰을 꺼리는 이유는 '예의'로 읽힌다([설문 Q5]). 센터 규정이면 그때 다시 본다 | 바뀌는 것 없음 |
| O06 몸 쓰는 감각 단계 | 1~5점 그대로. 점수 뜻을 정해 둔다: 5 보상 동작 없이 깔끔, 3 보상 동작이 있지만 해냄, 1 못 하거나 통증. 2·4는 그 사이. 첫 수업 워밍업·테스트 세트에서 본다(D30) | 기능 동작 검사(FMS)는 동작마다 '보상 없이 수행 / 보상 동작으로 수행 / 수행 못 함 / 통증'의 단계로 점수를 매긴다([문헌 Cook 2014]). 그 기준을 5점 척도의 1·3·5에 맞췄다 [해석] | 회원 화면 안내 문구를 '1 못 함·통증 / 3 보상 있음 / 5 깔끔'으로 |
| O07 무게 적는 기준 | 덤벨은 한 개 무게(표시값), 바벨은 바 포함, 머신은 표시값(핀·스택) 그대로, 한쪽씩 하는 운동은 한쪽 횟수. 다른 기구끼리는 숫자를 비교하지 않는다(2절) | 수첩에는 기구에 보이는 숫자를 그대로 적은 것으로 읽힌다 [해석]. 덤벨이 한 개 무게인지는 수첩만으로 확정할 수 없어 트레이너 답이 오면 다시 본다. 수첩 숫자는 고치지 않고 그대로 쓴다. 볼륨은 세트 × 횟수 × 무게로, 같은 종목 안에서만 비교한다 | 바뀌는 것 없음. 종목 사전의 무게 기준 칸(`exercise.weight_basis`) 기본값 |
| O08 컨디션 반영 | 6절 그대로 | 6절 | 이미 들어가 있음 |
| O09 세팅을 바꾸는 관찰 | 숫자를 자동으로 바꾸는 관찰은 없다. 5종(집중력·몰입도·반응·동작 안정성·회복 속도)은 '튀는 날만' 메모로 남긴다(D38). 동작 안정성이 무너지면 그 세트 RIR을 0~1로 보고 남은 세트를 다시 맞추는 것만 권한다 | 실패에 가까울수록 피로가 커지고(Vieira 2022, [PDF 6장 표]), 남은 세트는 그날 수행으로 맞춘다(6절 3, [문헌 Helms 2018]) [해석] | 바뀌는 것 없음 |
| O10 '이상치'의 뜻 | 화면 이름은 '기대 범위'로 쓴다. 그 회원 기록과 기준으로 계산한 오늘 예상 무게·횟수 범위를 말한다. '최소 기댓값'은 범위의 아래 끝이다 | 말뜻 질문이라 논문이 없다 [해석]. 값 하나 대신 범위로 내는 원칙(D13)에 맞춘 이름이다 | 바뀌는 것 없음(지금 화면도 범위) |
| O11 오늘 목표 방식 | 운동 목표, 진행 방향, 부위 셋 다 저장하고, 화면은 '부위 + 진행 방향(올리기/유지/조절)' 한 줄로 먼저 고르게 한다 | 트레이너 답 "오늘은 그 틀을 따라서"([인터뷰 2차 질문 2])와 수첩 머리글(하체, 밀기, 당기기)이 부위 단위다 [해석] | 바뀌는 것 없음 |
| O12 오래 가는 통증과 그날 불편 | 그날 불편은 컨디션 통증(`cond_pain`)에 적는다. 같은 부위가 7일 넘게 이어지거나 수업 2번 이상 연달아 나오면 '주의사항으로 옮길까요?'를 띄우고 트레이너가 정한다 | 운동 뒤 근육통(지연성 근육통)은 24~72시간에 가장 심하고 대개 5~7일 안에 사라진다([문헌 Cheung 2003]). 그보다 오래가면 근육통이 아닐 수 있다 [해석]. 원인은 앱이 판단하지 않는다(D11, D12) | 웹앱 수업 시작 화면: 오늘 통증이 있고 지난 수업에도 통증이 있었으면 '이어지면 주의사항으로 옮길지 정해요' 안내가 뜬다. 옮기는 버튼은 원래 있던 '주의사항에 추가' |
| O13 수업 중 루틴 변경 | 자주 바뀐다고 본다. 수업 중 종목 바꾸기·세트 추가·빼기는 한 번 탭으로 둔다(지금 화면 그대로) | 이00_3 수첩은 머신 세팅을 거의 매번 고쳐 적었다 [해석]. 트레이너 답 "대화를 통해서 바꾸기도"([인터뷰 2차 질문 3]) | 바뀌는 것 없음 |
| O14 숫자 자동 채우기 | 쓴다고 보고 D56대로 간다. 채운 숫자는 범위와 근거 카드로 보이고 트레이너가 고친다 | 2026-10-27 일부 답(R09) "있어도 안 쓸 수준이면 없는 게 좋고". 그래서 근거와 수정이 쉬워야 한다 [해석] | 바뀌는 것 없음 |
| O28 목표 우선순위 | 목표가 여러 개면 하나를 '먼저'로 둔다(`member_goal.priority` = 1). 브리핑은 그 목표를 맨 위에 둔다 | 근력 운동과 유산소를 같이 하면 근비대·근력 이득이 줄 수 있다([문헌 Wilson 2012]). 목표가 겹칠 때 무엇을 먼저 볼지 정해 두는 근거로 쓴다 [해석] | 바뀌는 것 없음(우선순위 칸 있음) |
| O29 훈련 방향 기간 | 4주를 기본으로 잡고, 끝나는 날 '다음 4주 방향'을 다시 고르게 한다. 진행 방향(`progression_target`)도 같이 정한다. 트레이너가 기간을 바꿀 수 있다 | 주기화(기간을 나눠 진행을 바꾸는 방식)가 주기화하지 않은 훈련보다 최대 근력 증가가 컸다([문헌 Williams 2017]). 한 기간을 4주로 잡는 것은 흔한 실무 단위를 따른 것이다 [해석] | 데이터 구조에는 시작·종료일 칸이 있어 기본 종료일 = 시작 + 4주. 웹앱은 시작일로 쌓고 훈련 방향 창에 '기본은 4주마다 다시 골라요'를 적었다 |

**질문지는 버리지 않는다.** O01~O14, O28, O29는 트레이너가 답할 수 있게 되면 그대로 보낸다. 답이 오면 이 표의 값을 바꾸고 변경 기록에 남긴다.

## 9. 바뀌는 곳

| 이 문서의 값 | 들어갈 곳 | 트레이너 답이 오면 |
|---|---|---|
| 2절 공식 | 새 뷰 `v_e1rm`(O20), `expectation.inputs_json` | O20을 정할 때 다시 본다 |
| 3절 역할별 기준 | `role_default` 임시값(D47). 지금 예시 데이터와 같은 값 | O02 답으로 바꾼다 |
| 4절 세트 구성 | `set_structure.rule_json` | O01 답으로 바꾼다 |
| 5절 RIR | `trainer.effort_scale` = RIR | O03 답으로 바꾼다 |
| 6절 컨디션 | `recommendation.inputs_json`, 근거 문장 `rationale` | O08 답으로 바꾼다 |
| 7절 무게 눈금 | `exercise`에 새 칸 (O36) | O36을 정할 때 함께 |
| 8절 나머지 질문 | 회원 화면 감각 점수 안내(O06), 통증 → 주의사항 안내(O12), 훈련 방향 기본 4주(O29), 나머지는 지금 칸 그대로 | 각 O 답으로 바꾼다 |

## 10. 출처

- [문헌 Cheung 2003] Cheung K, Hume PA, Maxwell L. Delayed Onset Muscle Soreness: Treatment Strategies and Performance Factors. *Sports Medicine*. 2003;33(2):145–164. https://doi.org/10.2165/00007256-200333020-00005
- [문헌 Colenso-Semple 2023] Colenso-Semple LM, D'Souza AC, Elliott-Sale KJ, Phillips SM. Current evidence shows no influence of women's menstrual cycle phase on acute strength performance or adaptations to resistance exercise training. *Frontiers in Sports and Active Living*. 2023;5:1054542. https://doi.org/10.3389/fspor.2023.1054542
- [문헌 Cook 2014] Cook G, Burton L, Hoogenboom BJ, Voight M. Functional movement screening: the use of fundamental movements as an assessment of function - part 1. *International Journal of Sports Physical Therapy*. 2014;9(3):396–409. PMID 24944860 (DOI 없음)
- [문헌 Craven 2022] Craven J, McCartney D, Desbrow B, Sabapathy S, Bellinger P, Roberts L, Irwin C. Effects of Acute Sleep Loss on Physical Performance: A Systematic and Meta-Analytical Review. *Sports Medicine*. 2022;52(11):2669–2690. https://doi.org/10.1007/s40279-022-01706-y
- [문헌 Helms 2016] Helms ER, Cronin J, Storey A, Zourdos MC. Application of the Repetitions in Reserve-based Rating of Perceived Exertion Scale for Resistance Training. *Strength and Conditioning Journal*. 2016;38(4):42–49. https://doi.org/10.1519/SSC.0000000000000218
- [문헌 Helms 2018] Helms ER, Byrnes RK, Cooke DM, Haischer MH, Carzoli JP, Johnson TK, Cross MR, Cronin JB, Storey AG, Zourdos MC. RPE vs. Percentage 1RM Loading in Periodized Programs Matched for Sets and Repetitions. *Frontiers in Physiology*. 2018;9:247. https://doi.org/10.3389/fphys.2018.00247
- [문헌 Krzysztofik 2019] Krzysztofik M, Wilk M, Wojdała G, Gołaś A. Maximizing Muscle Hypertrophy: A Systematic Review of Advanced Resistance Training Techniques and Methods. *International Journal of Environmental Research and Public Health*. 2019;16(24):4897. https://doi.org/10.3390/ijerph16244897
- [문헌 McNulty 2020] McNulty KL, Elliott-Sale KJ, Dolan E, Swinton PA, Ansdell P, Goodall S, Thomas K, Hicks KM. The Effects of Menstrual Cycle Phase on Exercise Performance in Eumenorrheic Women: A Systematic Review and Meta-Analysis. *Sports Medicine*. 2020;50(10):1813–1827. https://doi.org/10.1007/s40279-020-01319-3
- [문헌 Lopez 2021] Lopez P, Radaelli R, Taaffe DR, Newton RU, Galvão DA, Trajano GS, Teodoro JL, Kraemer WJ, Häkkinen K, Pinto RS. Resistance Training Load Effects on Muscle Hypertrophy and Strength Gain: Systematic Review and Network Meta-analysis. *Medicine & Science in Sports & Exercise*. 2021;53(6):1206–1216. https://doi.org/10.1249/MSS.0000000000002585 (2022년 정정 공지 있음, 철회 아님)
- [문헌 Reynolds 2006] Reynolds JM, Gordon TJ, Robergs RA. Prediction of One Repetition Maximum Strength from Multiple Repetition Maximum Testing and Anthropometry. *Journal of Strength and Conditioning Research*. 2006;20(3):584–592. https://doi.org/10.1519/00124278-200608000-00020
- [문헌 Robinson 2024] Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC. Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions. *Sports Medicine*. 2024;54(9):2209–2231. https://doi.org/10.1007/s40279-024-02069-2
- [문헌 Schoenfeld 2016] Schoenfeld BJ, Pope ZK, Benik FM, Hester GM, Sellers J, Nooner JL, Schnaiter JA, Bond-Williams KE, Carter AS, Ross CL, Just BL, Henselmans M, Krieger JW. Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men. *Journal of Strength and Conditioning Research*. 2016;30(7):1805–1812. https://doi.org/10.1519/JSC.0000000000001272
- [문헌 Schoenfeld 2017] Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis. *Journal of Strength and Conditioning Research*. 2017;31(12):3508–3523. https://doi.org/10.1519/JSC.0000000000002200
- [문헌 Singer 2024] Singer A, Wolf M, Generoso L, et al. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. *Frontiers in Sports and Active Living*. 2024;6. https://doi.org/10.3389/fspor.2024.1429789
- [문헌 Williams 2017] Williams TD, Tolusso DV, Fedewa MV, Esco MR. Comparison of Periodized and Non-Periodized Resistance Training on Maximal Strength: A Meta-Analysis. *Sports Medicine*. 2017;47(10):2083–2100. https://doi.org/10.1007/s40279-017-0734-y
- [문헌 Wilson 2012] Wilson JM, Marin PJ, Rhea MR, Wilson SMC, Loenneke JP, Anderson JC. Concurrent Training: A Meta-Analysis Examining Interference of Aerobic and Resistance Exercises. *Journal of Strength and Conditioning Research*. 2012;26(8):2293–2307. https://doi.org/10.1519/JSC.0b013e31823a3e2d
- [문헌 Zourdos 2016] Zourdos MC, Klemp A, Dolan C, et al. Novel Resistance Training-specific Rating of Perceived Exertion Scale Measuring Repetitions in Reserve. *Journal of Strength and Conditioning Research*. 2016;30(1):267–275. https://doi.org/10.1519/JSC.0000000000001049
- Epley 공식은 원 출처(1985년 Boyd Epley의 무게 환산표)를 직접 보지 못했고, [문헌 Reynolds 2006]이 비교한 공식으로 인용한다.
- 2026-10-27에 초록과 출판사·저장소 페이지로 확인했다. 본문 전체를 읽은 것은 아니다.
- 2026-11-25에 넣은 6편(Cheung, Colenso-Semple, Cook, McNulty, Williams, Wilson)은 DOI 등록처(Crossref) 기록으로 저자·권호·쪽을 확인했고 철회·정정 기록이 없었다. Cook 2014는 DOI가 없어 OpenAlex·PubMed 번호로 확인했다.

## 11. 근거 논문 점검 (D116)

2026-11-25 이현아님 "가장 중요한 추천값의 근거가 되는 논문들도 다시 제대로 점검해줘. 공신력있는지, 인정받은 결과인지, 객관적인지" (D116). 추천 숫자(추정 1RM, 역할별 기준, 세트 구성, RIR, 컨디션)를 받치는 논문을 DOI 등록처(Crossref)와 OpenAlex 기록으로 다시 봤다.

**보는 기준**
- 공신력: 동료 심사 학술지인가, 철회나 정정이 있는가.
- 인정: 다른 연구가 얼마나 인용했나(OpenAlex 인용 수, 2026-11-25 기준).
- 객관성: 여러 연구를 모은 메타분석인가 연구 하나인가, 대상이 누구이고 몇 명인가, 저자와 이해관계가 겹치는가.
- 판정: **강함** = 메타분석·체계적 문헌고찰이고 많이 인용됨. **보통** = 연구 하나이거나 새 논문이라 인용이 적음, 다른 근거와 같이 쓴다. **약함** = 연구가 아닌 설명 글이거나 이해관계가 있음, 혼자서는 근거로 쓰지 않는다.

| 논문 | 쓰는 곳 | 학술지 · 종류 | 규모 | 인용 수 | 철회·정정 | 판정 |
|---|---|---|---|---|---|---|
| Craven 2022 | 컨디션 반영(6절) | Sports Medicine · 체계적 문헌고찰 + 메타분석 | 논문 69편, 참가자 959명 | 142 | 없음 | 강함. 다만 참가자 89%가 남성이라 여성 회원에게 그대로 옮기기는 조심 |
| Robinson 2024 | 메인 RIR(3절) | Sports Medicine · 체계적 문헌고찰 + 메타회귀 | (초록에 편수 없음) | 63 | 없음 | 강함 |
| Schoenfeld 2017 | 근력 목표 3~6회, 마무리 털기(3절) | J Strength Cond Res · 메타분석 | 연구 21편 | 1,119 | 없음 | 강함 (이번에 새로 넣음) |
| Lopez 2021 | 근력 목표 3~6회, 마무리 털기(3절) | Med Sci Sports Exerc · 네트워크 메타분석 | 연구 28편, 747명 | 400 | 2022년 정정 공지 1건(철회 아님) | 강함 (이번에 새로 넣음) |
| Krzysztofik 2019 | 드롭·클러스터·슈퍼세트(4절) | IJERPH · 체계적 문헌고찰 | 연구 30편 | 390 | 없음 | 강함. 단, 이 논문은 '이 방법들이 더 낫다'는 근거가 부족하다고 결론냈다. 그래서 효과가 아니라 방법을 정의하는 데만 쓴다 |
| Reynolds 2006 | 추정 1RM 공식, 10회 이하(2절) | J Strength Cond Res · 회귀 연구 | 70명(남 34, 여 36, 18~69세) | 473 | 없음 | 보통. 연구 하나지만 많이 인용됐고 남녀·나이대가 넓다 |
| Schoenfeld 2016 | 메인 휴식 2~3분(3절) | J Strength Cond Res · 무작위 실험 | 훈련된 남성 21명, 8주 | 262 | 없음 | 보통. 규모가 작아 Singer 2024 메타분석과 같이 쓴다 |
| Singer 2024 | 보조·혈류 휴식(3절) | Front Sports Act Living · 베이즈 메타분석(사전 등록) | 연구 9편 | 14 | 없음 | 보통. 방법은 탄탄하지만 새 논문이라 인용이 아직 적다 |
| Zourdos 2016 | RIR 척도(5절) | J Strength Cond Res · 측정 도구 검증 | 29명, 한 번 측정 | 469 | 없음 | 보통. 척도를 정의한 원 논문이라 쓰고, RIR을 실제보다 적게 말하는 경향은 Halperin 2022 메타분석(보고서 인용)으로 받친다 |
| Helms 2018 | 백오프·남은 세트 다시 맞추기(4·6절) | Frontiers in Physiology · 8주 훈련 비교 | 21명 | 126 | 없음 | 보통. 규모가 작다. 자동 조절의 주 근거는 Huang 2025 메타분석(보고서 인용)이고 이 논문은 보조다 |
| Helms 2016 | RIR ↔ RPE 바꿔 읽기(5절) | Strength Cond J · 실무 설명 글 | 연구 아님 | 217 (Crossref) | 없음 | 약함. 연구 결과가 아니라 척도 쓰는 법을 설명한 글이다. 바꿔 읽는 규칙은 Zourdos 2016에도 있어 그쪽을 주 근거로 둔다 |

**고친 것**
- **Schoenfeld 2021을 뺐다.** 이 논문은 '무거운 무게가 최대 근력에 가장 좋다'는 반복수 연속체를 **따져 보는** 서술형 리뷰다. 우리는 거꾸로 그 틀을 받치는 근거로 썼다. 같은 내용을 메타분석 두 편(Schoenfeld 2017, Lopez 2021)으로 바꿨다. 1RM은 무거운 무게가 가벼운 무게보다 더 올랐고, 근비대는 무게와 상관없이 비슷했다. 값(근력 목표 3~6회, 마무리 15~20회)은 바뀌지 않는다.
- **Schoenfeld 2016은 단독으로 쓰지 않는다.** 휴식 근거에 Singer 2024 메타분석을 함께 적었다.

**객관성에서 눈여겨볼 것**
- RIR 관련 논문(Zourdos 2016, Helms 2016, Helms 2018, Robinson 2024)은 같은 연구 모임 저자가 겹친다. 그래서 RIR을 쓰는 방식은 다른 연구진의 메타분석(Halperin 2022, Huang 2025, 보고서 인용)으로도 받친다.
- 대부분 훈련 경험이 있는 젊은 남성 대상이다. 짐노트 회원(여성, 초보 포함)에게는 그대로 맞지 않을 수 있어서, 값은 범위로 내고 회원 기록이 쌓이면 회원별 공식이 앞선다(1절, D57).

**D115에서 넣은 6편**: McNulty 2020, Wilson 2012, Williams 2017은 메타분석이고, Colenso-Semple 2023, Cheung 2003은 리뷰라 근거 수준이 한 단계 낮다. **Cook 2014는 약함**이다. 저자 Gray Cook이 FMS를 만든 사람이라 이해관계가 있다. 그래서 점수 뜻(1·3·5)을 정하는 표현만 빌리고, 효과 근거로는 쓰지 않는다.

## 변경 기록

- 2026-10-27 v0.1: 이현아님 요청(트레이너 답 대신 논문 기준으로 진행, D59)으로 새로 썼다.
- 2026-11-25 v0.2: 이현아님 요청(답을 기다리는 질문 전부 논문 임시값으로, D115)으로 8절을 넣고 바뀌는 곳·출처를 9·10절로 옮겼다. 논문 6편 추가.
- 2026-11-25 v0.3: 이현아님 요청(추천값 근거 논문 공신력·인정·객관성 점검, D116)으로 11절을 넣음. Schoenfeld 2021을 빼고 메타분석 Schoenfeld 2017, Lopez 2021로 바꿈. 빠진 DOI·저자를 채움.
