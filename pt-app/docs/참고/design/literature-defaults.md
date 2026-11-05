# 논문 기준 임시값

> 상태: 임시 · 버전 v0.1 · 최종 수정 2026-10-27 · 이 문서가 기준인 주제: 트레이너 답(O01·O02·O03·O08)과 추정 1RM 공식(O20)이 오기 전까지 쓰는 논문 기준 임시값과 출처

- 만든 까닭: 2026-10-27 이현아님 "지금 트레이너가 답변을 주기 어려운 상황이라 논문과 객관적인 정보를 바탕으로 일단 진행하고" (D59).
- 논문 인용 표기는 `[문헌 Craven 2022]`처럼 쓰고, 목록은 [9절](#9-출처)에 있다. 연구보고서가 이미 인용한 논문(Halperin 2022, Nuzzo 2024, Huang 2025, Vieira 2022)은 [project-analysis.md 6절](../analysis/project-analysis.md#6-문헌-기반-설계-원칙-pdf-317장)을 따른다.
- 예시 숫자는 모두 계산을 보여 주려고 지어낸 '예시'다. 회원 기록이 아니다.

---

## 0. 결론 먼저

1. **추정 1RM:** Epley 공식에 여유 횟수(RIR)를 더해 `무게 × (1 + (횟수 + RIR) / 30)`로 계산한다. 10회 이하 세트만 쓰고, 종목(기구)마다 따로 계산한다.
2. **역할별 기준:** 추가질문 2번에 넣었던 예시값이 논문과 크게 어긋나지 않는다. 그대로 임시값으로 쓰고, 근거 카드에 출처를 붙인다.
3. **세트 구성:** 백오프·피라미드 무게는 고정 %가 아니라 그 세트의 목표 횟수·RIR로 추정 1RM에서 다시 계산한다. 드롭세트만 논문 예시대로 약 20% 내린다.
4. **RIR과 RPE:** RIR('몇 개 더 할 수 있었나')로 적는다. 칸은 비워 두고(D37), 메인 종목 마지막 세트에서만 한 번 탭으로 고르게 권한다.
5. **컨디션:** 수면·피로·근육통이 '평소보다 나쁨'이면 목표 RIR을 1 늘려 무게를 다시 계산한다. 고정 %로 깎지 않는다. 통증은 숫자를 바꾸지 않고 트레이너가 확인한다.

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
| 메인 | 6~10회 / 1~3개 / 3~5세트 / 2~3분 | 3분 휴식이 1분보다 근력·근비대가 모두 컸다([문헌 Schoenfeld 2016]). 근력은 RIR 폭넓게 비슷했고 근비대는 실패에 가까울수록 컸다([문헌 Robinson 2024]) |
| 보조 | 8~12회 / 1~2개 / 3세트 / 60~90초 | 60초보다 길게 쉬면 근비대에 작은 이득이 있고, 90초를 넘으면 차이를 찾지 못했다([문헌 Singer 2024]) |
| 마무리 털기 | 15~20회 / 0~1개 / 2~3세트 / 30~60초 | 가벼운 무게도 실패 가까이 하면 근비대가 된다([문헌 Schoenfeld 2021]). 실패에 가까울수록 피로가 커지니 수업 끝에 둔다(Vieira 2022, [PDF 6장 표]) |
| 혈류 모으기 | 15~25회 / 1~2개 / 2~3세트 / 30초 | 60초보다 짧은 휴식은 근비대에 조금 불리할 수 있다([문헌 Singer 2024]). 트레이너가 목적을 갖고 고르는 역할이라 값은 두고, 근거 카드에 이 점을 적는다 [해석] |
| 유산소성 순환 | 횟수 대신 시간·라운드 / 여유 있게 / 3~4라운드 / 거의 안 쉼 | 길항근·상하체를 번갈아 하는 묶음은 시간을 아낀다([문헌 Krzysztofik 2019]) |

**목표에 따라 바뀌는 것:** 근력 목표면 메인을 3~6회로 둔다. 무거운 무게가 최대 근력에 유리하다는 반복수 연속체의 틀을 따른 것이다([문헌 Schoenfeld 2021]). 근비대·체지방 감소 목표는 위 표 그대로다 [해석]. 템포는 논문 기준값을 두지 않고 비워 둔다.

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

## 8. 바뀌는 곳

| 이 문서의 값 | 들어갈 곳 | 트레이너 답이 오면 |
|---|---|---|
| 2절 공식 | 새 뷰 `v_e1rm`(O20), `expectation.inputs_json` | O20을 정할 때 다시 본다 |
| 3절 역할별 기준 | `role_default` 임시값(D47). 지금 예시 데이터와 같은 값 | O02 답으로 바꾼다 |
| 4절 세트 구성 | `set_structure.rule_json` | O01 답으로 바꾼다 |
| 5절 RIR | `trainer.effort_scale` = RIR | O03 답으로 바꾼다 |
| 6절 컨디션 | `recommendation.inputs_json`, 근거 문장 `rationale` | O08 답으로 바꾼다 |
| 7절 무게 눈금 | `exercise`에 새 칸 (O36) | O36을 정할 때 함께 |

## 9. 출처

- [문헌 Craven 2022] Craven J, McCartney D, Desbrow B, Sabapathy S, Bellinger P, Roberts L, Irwin C. Effects of Acute Sleep Loss on Physical Performance: A Systematic and Meta-Analytical Review. *Sports Medicine*. 2022;52(11):2669–2690. https://doi.org/10.1007/s40279-022-01706-y
- [문헌 Helms 2016] Helms ER, Cronin J, Storey A, Zourdos MC. Application of the Repetitions in Reserve-based Rating of Perceived Exertion Scale for Resistance Training. *Strength and Conditioning Journal*. 2016;38(4):42–49. https://doi.org/10.1519/SSC.0000000000000218
- [문헌 Helms 2018] Helms ER et al. RPE vs. Percentage 1RM Loading in Periodized Programs Matched for Sets and Repetitions. *Frontiers in Physiology*. 2018;9:247. https://doi.org/10.3389/fphys.2018.00247
- [문헌 Krzysztofik 2019] Krzysztofik M, Wilk M, Wojdała G, Gołaś A. Maximizing Muscle Hypertrophy: A Systematic Review of Advanced Resistance Training Techniques and Methods. *International Journal of Environmental Research and Public Health*. 2019;16(24):4897. https://doi.org/10.3390/ijerph16244897
- [문헌 Reynolds 2006] Reynolds JM, Gordon TJ, Robergs RA. Prediction of One Repetition Maximum Strength from Multiple Repetition Maximum Testing and Anthropometry. *Journal of Strength and Conditioning Research*. 2006;20(3):584–592.
- [문헌 Robinson 2024] Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC. Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy: A Series of Meta-Regressions. *Sports Medicine*. 2024;54(9):2209–2231. https://doi.org/10.1007/s40279-024-02069-2
- [문헌 Schoenfeld 2016] Schoenfeld BJ, Pope ZK, Benik FM, et al. Longer Interset Rest Periods Enhance Muscle Strength and Hypertrophy in Resistance-Trained Men. *Journal of Strength and Conditioning Research*. 2016;30(7):1805–1812.
- [문헌 Schoenfeld 2021] Schoenfeld BJ, Grgic J, Van Every DW, Plotkin DL. Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum. *Sports*. 2021;9(2):32.
- [문헌 Singer 2024] Singer A, Wolf M, Generoso L, et al. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. *Frontiers in Sports and Active Living*. 2024;6. https://doi.org/10.3389/fspor.2024.1429789
- [문헌 Zourdos 2016] Zourdos MC, Klemp A, Dolan C, et al. Novel Resistance Training-specific Rating of Perceived Exertion Scale Measuring Repetitions in Reserve. *Journal of Strength and Conditioning Research*. 2016;30(1):267–275. https://doi.org/10.1519/JSC.0000000000001049
- Epley 공식은 원 출처(1985년 Boyd Epley의 무게 환산표)를 직접 보지 못했고, [문헌 Reynolds 2006]이 비교한 공식으로 인용한다.
- 2026-10-27에 초록과 출판사·저장소 페이지로 확인했다. 본문 전체를 읽은 것은 아니다.

## 변경 기록

- 2026-10-27 v0.1: 이현아님 요청(트레이너 답 대신 논문 기준으로 진행, D59)으로 새로 썼다.
