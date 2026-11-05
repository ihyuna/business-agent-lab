# PT 트레이너 의사결정 지원 앱: 프로젝트 문서

> 상태: 최신 · 최종 수정 2026-10-27 · 이 문서가 기준인 주제: 현재 상태, 문서 지도와 우선순위, 원자료 목록, 로드맵(다음 단계), 화면 대응표, 리스크, 인용 규칙

**"트레이너가 ‘무엇을 왜 할지’를 정하면, AI가 ‘이 회원에게 오늘 어느 정도로 할지’를 회원별 데이터로 보조한다."** [PDF 1.2]

현직 PT 트레이너가 수업 중 **iPad**로 쓰는 회원 관리·의사결정 지원 앱이다. 기록 앱(회원·수업·세트)을 바탕으로, AI가 중량·횟수·세트의 권장 범위와 근거를 내고 트레이너가 최종 결정한다. 연구질문은 셋이다. RQ1 맥락 정보를 넣으면 예측이 나아지는가, RQ2 회원별 개인화가 일반 기준·최근 기록보다 정확한가, RQ3 그 권장 범위와 근거가 트레이너에게 유용한가 ([PDF 26장], [project-analysis.md 10절](analysis/project-analysis.md#10-연구질문-pdf-26장)).

---

## 현재 상태 (2026-10-27)

- **완료**
  - 연구보고서·앱 설명 분석 ([project-analysis.md](analysis/project-analysis.md)), 트레이너 설문·인터뷰 분석 ([trainer-interview.md](analysis/trainer-interview.md))
  - 데이터 구조 v0.2 ([design/data-model/](design/data-model/data-model.md)): 테이블 24개, 뷰 4개, 트리거 10개. 가상 회원 김서연 데이터로 화면·추천·연구에 필요한 쿼리 18개를 돌려 기대값 59개가 모두 맞았고, 제약 테스트 33개(막아야 할 입력은 막히고 허용할 입력은 들어가는지)도 모두 통과했다 ([check-output.txt](design/data-model/check-output.txt)). 용어는 [glossary.md 5절](glossary.md#5-개발연구-용어)
  - 트레이너 종이수첩 기록 1명분(이00_1 회원님, 사진 17장): 글씨 판독본 [transcription.md](sources/member-records/이00_1/transcription.md)과 기록 방식 분석 [notebook-records.md](analysis/notebook-records.md)
  - 트레이너 본인 운동 밀기 기록 2장(2026-10-17 받음, 2026-10-19 트레이너 확인): 판독본 [transcription.md](sources/member-records/트레이너-본인/transcription.md)과 분석 [notebook-records.md 9절](analysis/notebook-records.md#9-밀기-기록-2장-트레이너-본인-운동)
  - 이00_3 회원님 수첩 사진 3장(2026-10-19 받음, 6/24~10/16): 판독본 [transcription.md](sources/member-records/이00_3/transcription.md)과 분석 [notebook-records.md 10절](analysis/notebook-records.md#10-이00_3-회원님-기록). 트레이너에게 물을 후보는 [8절](analysis/notebook-records.md#8-트레이너에게-물어볼-후보) 20~38번
  - 다른 회원님 4명의 PT 수기 기록 판독본 4개(2026-10-25 받음): [김00](sources/member-records/김00/김00%20회원님%20PT%20수기%20기록.md) 7/20~10/13, [정00](sources/member-records/정00/정00%20회원%20PT%20수기기록.md) 9/1~10/16, [최00](sources/member-records/최00/최00%20회원%20PT%20수기기록.md) 8/28~10/16, [이00_2](sources/member-records/이00_2/이00_2%20회원%20PT%20수기%20기록.md) 7/7~10/15. 다른 곳에서 수첩 사진(2026-10-20 첨부)을 보고 만든 판독본이라 받은 그대로 저장했다. 사진은 이 프로젝트에 없고, 분석은 아직 하지 않았다
  - 워크플로우 초안 v0.1(2026-10-25): 실제 회원님 6분 기록과 설문·인터뷰로 트레이너 업무를 8단계로 나누고, 단계별 앱 화면 흐름과 프로토타입 기본 예(이00_3 회원님 10/7 하체)를 정함 ([design/workflow.md](design/workflow.md)). 네 분 판독본은 워크플로우 근거로 썼고, 회원님별 기록 분석(notebook-records.md)은 아직이다
  - 프로토타입 v1(2026-10-26): [디자인 캔버스](https://claude.ai/artifact/NRJ2Hrm6zEssrkGjuK4TPR)(비공개 claude.ai 페이지)에 iPad 화면 12장. 기본 경로는 이00_3 회원님 10/7 하체(회원 목록 → 한눈에 → 예정 루틴 → 수업 시작 → 수업 진행 → 종목 바꾸기 → 수업 후 요약 → 추이), 보조는 최00·김00·이00_2·정00 회원님 화면. 실명(D54)이고 수첩에 없는 값은 '예시'로 표시 ([workflow.md 5-4](design/workflow.md#5-4-프로토타입-v1-2026-10-26))
  - 앱 워크플로우 전체 흐름 v0.1(2026-10-27): 이현아님 요청으로 트레이너 설문·인터뷰 답과 지금까지의 결정만으로 앱이 도는 세 고리(처음 한 번, 수업마다, 쌓이면)와 12단계를 정리했다. [Claude 문서](https://claude.ai/artifact/XKDUkrwkP2m4ff4E7mZrmo)로 썼다(이 폴더 밖). 수첩 근거와 화면별 세부는 [workflow.md](design/workflow.md)
  - 앱 워크플로우 v2(2026-10-27): 비슷한 앱 분석과 제안을 넣어 같은 문서를 v2로 다시 짰다. 단계마다 화면, 트레이너 동작, 앱이 하는 일, 갈림길, 남는 기록, 출시를 적고 수업 한 번 그림, 숫자 규칙, 예외 상황을 더했다 (D60). 이어서 예와 숫자를 보내 준 수첩 기록으로 바꾸고, 회원은 이00_1처럼 성과 번호로만 적었다 (D61)
  - MVP 웹 프로토타입(2026-10-27): 워크플로우 v2의 4a 범위(1~11단계)를 웹에서 눌러 볼 수 있게 만들었다. 아이패드 9세대 화면(1080×810, 가로·세로)에 맞췄고 디자인은 아직 보지 않았다. 회원 6명의 수첩 기록을 성+00 코드로 넣었다. [MVP 프로토타입](https://claude.ai/artifact/B1wbL4u6af4oFWYjAbLptk)(비공개 claude.ai 페이지), 원본 [prototype/mvp/index.html](prototype/mvp/index.html) (D62)
  - 수업 시나리오와 MVP v2(2026-10-27): 이현아님 요청으로 트레이너가 이00_3 10/7 하체 수업을 준비하고, 수업하고, 끝내는 과정을 화면과 누르는 순서대로 8장면 시나리오로 썼다([Claude 문서](https://claude.ai/artifact/Cp4vbnZEP5sujKZnyWL3az), 이 폴더 밖). 그 순서대로 MVP를 v2로 다시 만들어 같은 링크에 올렸다. 첫 화면은 '오늘', 화면마다 큰 버튼 하나, 앱 오른쪽 '시나리오 따라 하기'가 장면 1~8을 안내한다 (D63)
  - 앱 없는 1시간 PT 시나리오(2026-10-27): 앱이 트레이너를 따라가도록, 가상 '윤 트레이너'(설문·인터뷰 답을 본뜸)가 앱 없이 이00_3 10/7 하체를 준비(일정 확인 → 기록 보기 → 계획과 이유)하고, 1시간 수업하고, 수업 중 계획을 바꾸고, 다음 수업을 정하는 과정을 분 단위로 그렸다. 숫자와 메모는 실제 수첩, 시각과 대화는 가정이다. [Claude 문서](https://claude.ai/artifact/BCEZ75w3YFwhiAH7WXxKZ7)(이 폴더 밖) (D64)
  - 경쟁 앱 분석(2026-10-27): 국내 트레이너용 PT 일지 앱 5개, 해외 트레이너 플랫폼 7개, 개인용 자동 추천 앱 5개를 비교하고 12단계별로 가져올 것과 가져오지 않을 것을 정리했다. [Claude 문서](https://claude.ai/artifact/2ESBBjsAsBztcDGNQUcJEH)로 썼다(이 폴더 밖)
  - 비슷한 앱 워크플로우 분석(2026-10-27): 기능이 가장 비슷한 5개(헬린캠프, GymPT, Trainerize, Hevy Coach, TeamBuildr)의 수업 전·시작·중·끝·그 뒤 흐름을 우리 12단계와 나란히 놓고, 우리 워크플로우에 바꿀 것 9가지를 제안했다. [Claude 문서](https://claude.ai/artifact/Q4xDY9PoLmX4JQ895whi1v)로 썼다(이 폴더 밖). 영상은 이 환경에서 열리지 않아 회사 사용 안내·도움말로 분석했다
  - 논문 기준 임시값 v0.1(2026-10-27): 트레이너 답을 기다리던 추정 1RM 공식, 역할별 기준, 세트 구성 규칙, RIR, 컨디션 반영 크기를 논문으로 채웠다 ([design/literature-defaults.md](design/literature-defaults.md), D59)
  - 문서 정리: 이 README, [decisions.md](decisions.md)(결정·열린 질문), [glossary.md](glossary.md)(용어집), 원자료 분리([sources/](sources/))
- **이현아님이 할 것·정할 것** (전체 목록은 [decisions.md 지금 할 일](decisions.md#지금-할-일))
  - 앱 워크플로우 v2, 워크플로우 초안, 프로토타입 v1 확인 ([앱 워크플로우 v2](https://claude.ai/artifact/XKDUkrwkP2m4ff4E7mZrmo), [workflow.md](design/workflow.md), [디자인 캔버스](https://claude.ai/artifact/NRJ2Hrm6zEssrkGjuK4TPR))
  - MVP v2와 수업 시나리오 확인 ([MVP 프로토타입](https://claude.ai/artifact/B1wbL4u6af4oFWYjAbLptk), [수업 시나리오](https://claude.ai/artifact/Cp4vbnZEP5sujKZnyWL3az), D62·D63)
  - 앱 없는 1시간 PT 시나리오 확인 ([Claude 문서](https://claude.ai/artifact/BCEZ75w3YFwhiAH7WXxKZ7), D64)
  - O36 종목 사전에 머신 정보를 무엇까지 담을지 (4a 전, D56)
  - O38 경쟁 앱에서 가져온 것의 출시 단계 확인 ([앱 워크플로우 v2](https://claude.ai/artifact/XKDUkrwkP2m4ff4E7mZrmo)의 'v2에서 바뀐 것' 표, 기본값으로 들어감, D60)
  - 수첩 p08~p14 7장은 트레이너도 누구 것인지 잘 기억하지 못했다(2026-10-17). 다른 회원님 기록으로 보고 주인을 모르는 채로 둔다. 이00_3 회원님의 앞 기록일 가능성도 따져 봤지만 정하지 못했다([10-5](analysis/notebook-records.md#10-5-다른-기록과-겹치는-것)). 회원 수첩의 탭이 튀어나온 가장자리를 정면에서 찍은 사진이 있으면 주인 후보를 좁히는 데 도움이 될 수 있다 ([notebook-records.md 3절](analysis/notebook-records.md#3-17장이-모두-한-분의-기록인가))
  - 다른 회원님들의 수첩 기록 보내기 (회원님별로 나눠서). 김00·정00·최00·이00_2 회원님은 판독본만 받아서, 사진이 있으면 애매한 글씨를 대조할 수 있다
  - O04~O14, O28, O29를 다음 질문 묶음에 넣을지, O23 GitHub 저장소, O24 일정
- **기다리는 것**: 트레이너의 답 (O01~O03, [질문지](sources/trainer-followup-questions.md)). 이현아님이 보냈고, 답이 오면 알려 주기로 함 (2026-10-16). 트레이너가 지금 답하기 어려워 그동안 논문 기준 임시값으로 진행한다 (D59, 2026-10-27)
- **정한 것**: 첫 MVP에 루틴 숫자 자동 채우기를 넣는다 (D52, 2026-10-16). 워크플로우와 프로토타입은 가상 회원 김서연 대신 실제 회원님 기록으로 만든다 (D53, 2026-10-25). 프로토타입 디자인 캔버스에는 실제 기록을 실명 그대로 쓴다 (D54, 2026-10-26, README 규칙의 예외). 실제 회원 기록 사용 허락은 받았다 (D55, 2026-10-27). 트레이너 새 답[인터뷰 10-27]을 보고도 예정 루틴 숫자 채우기를 유지한다. 루틴 전체 추천은 하지 않고 종목 사전에 머신 정보를 보강한다 (D56, 2026-10-27). 트레이너가 종목(머신)과 역할을 고르고, 앱이 회원별 공식과 그날 컨디션으로 무게·횟수를 추천하고 근거를 설명한다 (D57). 근거는 '!'나 '자세히 보기'를 눌러야 펼쳐지고, 한 화면에는 그 순간 필요한 것만 둔다 (D58, 2026-10-27). 트레이너 답을 기다리던 숫자 기준은 논문 기준 임시값으로 먼저 진행한다 (D59, 2026-10-27). 폴더 밖 문서에는 회원을 성+00 코드로만 쓰고 실제 기록 숫자를 쓴다 (D61, 2026-10-27). MVP 프로토타입은 웹으로 아이패드 9세대 비율에 맞춰 먼저 만들고 디자인은 나중에 본다 (D62, 2026-10-27). 수업 시나리오를 먼저 쓰고 MVP를 그 순서대로 다시 만든다 (D63, 2026-10-27)
- **다음** (이현아님, 2026-10-25): 기록은 지금 받은 것으로 충분하다고 함. 프로토타입 전에 실제 회원 기록으로 워크플로우부터 정리 → 프로토타입 ([다음 단계](#다음-단계) 2단계). 둘 다 첫 판까지 했다(2026-10-26). 2026-10-16 계획의 마크다운 문서 다시 정리와 트레이너 질문 정리는 아직 하지 않았다

## 읽는 순서

1. 이 README
2. [decisions.md](decisions.md#지금-할-일) '지금 할 일'
3. [project-analysis.md](analysis/project-analysis.md) 1·4·7·10절 (연구가 무엇을 하려는지)
4. [trainer-interview.md](analysis/trainer-interview.md) 0·7절 (트레이너가 실제로 어떻게 일하는지, PDF와 부딪히는 부분)
5. [notebook-records.md](analysis/notebook-records.md) 0·4·7절 (트레이너가 수첩에 실제로 적는 것과 안 적는 것)
6. [workflow.md](design/workflow.md) 0·2·5절 (실제 회원 기록으로 본 업무 흐름과 앱 화면 흐름)
7. [data-model.md](design/data-model/data-model.md) 1·2·5절 (데이터 구조와 김서연 예시)
8. 모르는 용어는 [glossary.md](glossary.md)
9. 개발용: [schema.sql](design/data-model/schema.sql) → [sample-data.sql](design/data-model/sample-data.sql) → [queries.sql](design/data-model/queries.sql). 검사는 `design/data-model/`에서 `python3 run_check.py > check-output.txt`

## 파일 지도

| 파일 | 내용 | 이 파일이 기준인 주제 |
|---|---|---|
| [consolidated/](consolidated/) | 통합 문서 4개 (2026-10-27): 앱-정의.md, 워크플로우.md, 시나리오.md, 데이터-구조.md. 지금까지 정한 것을 링크·출처 없이 한곳에 모았고 회원은 코드만 쓴다(D61, 실명 대응표 없음). 수기 기록 판독본은 넣지 않고 분석 결론만 넣었다 | 이현아님이 앞으로 이 4개로 프로젝트를 진행한다. 옛 파일은 지우지 않고 그대로 둔다 |
| [README.md](README.md) | 입구 문서 | 현재 상태, 문서 지도와 우선순위, 원자료 목록, 로드맵(다음 단계), 화면 대응표, 리스크, 인용 규칙 |
| [decisions.md](decisions.md) | 결정 D01~D63, 열린 질문 O01~O38, 답이 나온 질문 R01~R09 | 이미 정한 것(D), 아직 답이 없는 것(O)과 그 상태·정할 사람, 답이 나온 것(R), 지금 할 일 |
| [glossary.md](glossary.md) | 용어집 (한국어 · PDF 용어 · DB 이름) | 문서·화면·DB에서 쓰는 용어의 뜻과 대응 이름 |
| [analysis/project-analysis.md](analysis/project-analysis.md) | 연구보고서(PDF)·앱 설명 분석 v2 | 연구 목적, 연구질문(RQ1~3), 문헌에서 나온 AI 동작 원칙, PDF와 앱 설명의 대응, 최종결과보고서 수정 목록(15절) |
| [analysis/trainer-interview.md](analysis/trainer-interview.md) | 트레이너 설문·인터뷰 분석 v1.1 | 트레이너의 실제 업무 방식, 입력 항목, 원하는 기능, PDF와 부딪히는 부분의 조정안(7절) |
| [analysis/notebook-records.md](analysis/notebook-records.md) | 트레이너 수기 PT 기록(종이수첩 사진) 분석 v0.4, 회원 2명분 + 트레이너 본인 운동 2장 | 트레이너가 수첩에 실제로 적는 것과 안 적는 것, 사진 장 순서·날짜 재구성, 앱·데이터 구조에 주는 의미(7절) |
| [design/workflow.md](design/workflow.md) | 워크플로우 초안 v0.1: 실제 회원님 기록으로 본 트레이너 업무 8단계와 앱 화면 흐름 | 트레이너 업무 흐름(단계), 단계별 앱 화면 흐름(To-Be), 프로토타입에 쓸 실제 회원 예시 |
| [앱 워크플로우 v2](https://claude.ai/artifact/XKDUkrwkP2m4ff4E7mZrmo) (Claude 문서, 이 폴더 밖) | 앱 워크플로우 v2(예와 숫자는 실제 수첩 기록, 회원은 성+00 코드, D61): 세 고리와 12단계, v2에서 바뀐 것(경쟁 앱에서 가져온 13가지), 단계별 세부 흐름(화면, 트레이너 동작, 앱이 하는 일, 갈림길, 남는 기록, 출시), 수업 한 번 그림, 숫자 규칙, 예외 상황, 앱이 하지 않는 것 | 앱이 도는 순서와 단계 안의 동작. 수첩 근거와 실제 회원 예는 workflow.md |
| [수업 시나리오](https://claude.ai/artifact/Cp4vbnZEP5sujKZnyWL3az) (Claude 문서, 이 폴더 밖) | 트레이너가 이00_3 10/7 하체 수업을 준비·진행·마무리하는 8장면(장면 7·8은 10/14 하체와 추이). 장면마다 화면, 보이는 것, 누르는 것, 남는 것. 화면 목록, MVP v1과 v2의 차이, Claude가 고른 기본값 (D63) | 앱을 실제로 어떤 순서로 누르는지. MVP v2의 화면 순서와 '시나리오 따라 하기' 안내의 기준 |
| [앱 없는 1시간 PT 시나리오](https://claude.ai/artifact/BCEZ75w3YFwhiAH7WXxKZ7) (Claude 문서, 이 폴더 밖) | 가상 윤 트레이너가 앱 없이 이00_3 10/7 하체를 준비·진행·조정하는 과정: 페르소나, 일정 확인, 기록 보는 순서와 수업 전 일곱 가지를 찾은 곳, 계획과 이유, 분 단위 진행, 계획과 실제 시간 그림, 바꾼 판단 A·B·C와 다른 경우, 수업 뒤 기록과 10/14 비교, 손이 많이 간 순간 13가지, 가정 목록 (D64) | 앱 없이 트레이너가 무엇을 보고 무엇을 정하는지. 앱 흐름을 다시 짤 때의 기준 |
| [prototype/mvp/index.html](prototype/mvp/index.html) | MVP 웹 프로토타입 v2(D62·D63). 같은 내용이 [MVP 프로토타입](https://claude.ai/artifact/B1wbL4u6af4oFWYjAbLptk)(비공개 claude.ai 페이지, 이 폴더 밖)로 올라가 있다. 회원은 성+00 코드(D61). index.html은 [src/](prototype/mvp/src/)의 조각을 [build.sh](prototype/mvp/build.sh)로 합친 결과이고, [test/](prototype/mvp/test/)의 smoke.js는 시나리오 8장면을 자동으로 돌려 본다(Playwright) | 4a 화면 흐름을 직접 눌러 보기. 고칠 때는 src/를 고치고 build.sh로 합친 뒤 같은 링크에 다시 올린다 |
| [design/literature-defaults.md](design/literature-defaults.md) | 논문 기준 임시값 v0.1: 추정 1RM 공식, 역할별 기준, 세트 구성 규칙, RIR, 컨디션 반영 크기와 출처 | 트레이너 답이 오기 전까지 쓰는 숫자 기준과 그 출처 (D59). 트레이너 답이 오면 트레이너 값이 앞선다 |
| [경쟁 앱 분석 · 가져올 것](https://claude.ai/artifact/2ESBBjsAsBztcDGNQUcJEH) (Claude 문서, 이 폴더 밖) | 비슷한 앱 17개 비교, 12단계별로 가져올 것·가져오지 않을 것, 한계, 출처 | 경쟁 앱 비교와 가져올 기능 후보 (O38) |
| [비슷한 앱 워크플로우 분석](https://claude.ai/artifact/Q4xDY9PoLmX4JQ895whi1v) (Claude 문서, 이 폴더 밖) | 기능이 가장 비슷한 앱 5개의 수업 흐름, 흐름 그림, 우리 12단계와 비교, 바꿀 것 제안 9가지, 한계, 출처 | 다른 앱은 수업을 어떤 순서로 처리하는지, 우리 흐름에서 무엇을 바꿀지 (O38) |
| [design/data-model/data-model.md](design/data-model/data-model.md) | 데이터 구조 설명 v0.2 | 테이블·필드·선택지 목록의 뜻과 쓰는 규칙(정의 자체는 `schema.sql`) |
| [design/data-model/schema.sql](design/data-model/schema.sql) | 스키마 (SQLite, PostgreSQL로 옮기기 쉽게) | 테이블·필드·선택지·제약의 정확한 정의 |
| [design/data-model/sample-data.sql](design/data-model/sample-data.sql) | 가상 회원 김서연 예시 데이터 (숫자는 모두 가상) | — |
| [design/data-model/queries.sql](design/data-model/queries.sql) | 화면·추천·연구용 검증 쿼리 18개와 기대값 | 검증 쿼리(Q1-a~Q10)의 정의와 기대값. 화면별로 보여 주는 데이터는 아래 [화면 대응표](#화면-대응표) |
| [design/data-model/run_check.py](design/data-model/run_check.py) | 자동 검사 (무결성, 기대값, 제약 테스트). 하나라도 틀리면 종료 코드 1 | — |
| [design/data-model/check-output.txt](design/data-model/check-output.txt) | 마지막 검사 결과 | — |
| [sources/](sources/) | 원자료 (아래 표) | 원문 그대로. 고치지 않는다. 예외: [trainer-followup-questions.md](sources/trainer-followup-questions.md)는 우리가 쓴 질문지라 답 칸과 후보 질문을 채워 간다. `member-records/<회원>/transcription.md`는 사진 글씨를 우리가 옮겨 적은 판독본이라, 잘못 읽은 곳이 나오면 고친다. 김00·정00·최00·이00_2 폴더의 판독본은 받은 파일이라 고치지 않는다 |
| [sources/member-records/](sources/member-records/) | 회원별 수첩 사진(`<회원>/photos/`)과 판독본(`<회원>/transcription.md`). 트레이너 본인 운동 기록은 `트레이너-본인/`. 김00·정00·최00·이00_2 폴더에는 받은 판독본(원래 파일 이름 그대로)만 있고 사진은 없다. 실제 사람의 기록이라 프로젝트 폴더 밖으로 내보내지 않는다(예외: 프로토타입 디자인 캔버스는 실명 D54, 앱 워크플로우 v2 Claude 문서와 MVP 웹 프로토타입은 성+00 코드 D61, D62) | 수첩에 적힌 글씨(판독), 사진 장 번호와 원래 파일의 대응, 날짜순 장 순서 |
| `uploads/hearth/` | 채팅에 올린 파일이 자동 저장되는 시스템 폴더 (파일 이름이 id) | 옮기거나 이름을 바꾸지 않는다 |
| `.notes/inputs.md` | Claude 작업용 메모(영어). 읽지 않아도 됨 | — |

**문서끼리 부딪힐 때:** 업무 방식과 입력 항목은 인터뷰 우선, AI 동작 원칙(논문 수치 하드코딩 금지, 원인 진단 금지, 단일 피로 점수 금지)은 PDF 우선, 둘이 부딪히면 [trainer-interview.md 7절](analysis/trainer-interview.md#7-pdf-연구보고서와의-충돌과-조정안)을 따른다. 결정 번호가 붙은 내용은 [decisions.md](decisions.md)가 최신이다.

## 원자료

| 원래 이름 | 종류·분량 | 저장 경로 | 무엇이 들었나 | 분석한 곳 |
|---|---|---|---|---|
| 26-2_프로젝트학기제_연구보고서10.15.pdf | PDF 17쪽 | [sources/originals/26-2_프로젝트학기제_연구보고서10.15.pdf](sources/originals/26-2_프로젝트학기제_연구보고서10.15.pdf) (업로드 원본 `uploads/hearth/9bdb7386-08db-41fb-9c67-9a74be86e051`) | 이현아님 중간 연구보고서: 연구 정의, 문헌 검토, 데이터 설계 원칙, RQ1~3, 트레이너 확인 질문 | [project-analysis.md](analysis/project-analysis.md) |
| 앱 설명 (채팅 메시지) | 텍스트 | [sources/app-description.md](sources/app-description.md) | 앱이 하려는 일, 기능 4-1~4-7, 김서연 사용 시나리오 | [project-analysis.md](analysis/project-analysis.md) 1·12절 |
| AI 트레이너 업무 보조 앱 개발을 위한 설문조사 - Google Forms.pdf | PDF 5쪽 | [sources/originals/트레이너_설문응답_GoogleForms.pdf](sources/originals/트레이너_설문응답_GoogleForms.pdf) (업로드 원본 `uploads/hearth/eaa5e38d-144e-4491-94aa-19cb56e9a400`) | 트레이너 1명의 설문 응답. 체크 항목은 페이지 이미지로만 보임 | [trainer-interview.md](analysis/trainer-interview.md) 1절 |
| image.png (1차 인터뷰 질문) | PNG 480×424 | [sources/originals/1차_인터뷰_질문.png](sources/originals/1차_인터뷰_질문.png) (업로드 원본 `uploads/hearth/84d07f5e-6ed1-46df-9d76-2cb30be50450`) | 이현아님이 보낸 1차 질문 목록 | [trainer-interview.md](analysis/trainer-interview.md) 3절 |
| 인터뷰 답변 (채팅 메시지) | 텍스트 | [sources/trainer-interview-raw.md](sources/trainer-interview-raw.md) | 원하는 기능, 1차·2차·3차·마지막 질문과 답, 녹음 제외·iPad 결정 | [trainer-interview.md](analysis/trainer-interview.md) |
| 트레이너 답 (채팅 메시지, 2026-10-27) | 텍스트 | [sources/trainer-interview-2026-10-27.md](sources/trainer-interview-2026-10-27.md) | 다음 PT 계획을 앱이 짤지, 횟수·중량만 추천할지에 대한 질문 1개와 답 | [trainer-interview.md 11절](analysis/trainer-interview.md#11-추가-답-2026-10-27-계획을-앱이-짤까-숫자만-추천할까) |
| 트레이너 추가 질문지 | 텍스트 | [sources/trainer-followup-questions.md](sources/trainer-followup-questions.md) | 보낸 질문 3개(O01~O03, 답 기다림), 답 칸, 아직 안 보낸 후보 | [data-model.md](design/data-model/data-model.md) 6절 |
| `image.png`, `image 2.png` … `image 14.png` (프로젝트 폴더) + 채팅 첨부 3장 | PNG 17장, 3024×4032 | [sources/member-records/이00_1/photos/](sources/member-records/이00_1/photos/) p01~p17. 원래 파일과의 대응은 [판독본 표](sources/member-records/이00_1/transcription.md#사진과-원래-파일) (채팅 첨부 원본은 `uploads/hearth/`에 그대로) | 트레이너 종이수첩의 PT 기록. 이현아님 설명으로는 전부 이00_1 회원님의 3월~10월 기록 (2026-10-16). p08~p14 7장은 다른 회원님 기록으로 보인다(트레이너도 기억하지 못함, 2026-10-17) | [notebook-records.md](analysis/notebook-records.md) |
| image.png 2장 (채팅 첨부, 2026-10-17) | PNG 2장, 3024×4032 (한 장의 앞뒷면) | [sources/member-records/트레이너-본인/photos/](sources/member-records/트레이너-본인/photos/) p01~p02 (원본 `uploads/hearth/38a4fb9c-1b0d-4934-a80b-8f64bff292ea`, `uploads/hearth/fee12f76-ecf3-49c3-a771-129624de9470`) | 다른 수첩의 '밀기.' 장, 6/25~10/16 밀기 12번. 2026-10-19 트레이너 확인: 본인 운동 기록 | [notebook-records.md 9절](analysis/notebook-records.md#9-밀기-기록-2장-트레이너-본인-운동) |
| 채팅 첨부 사진 3장 (2026-10-19) | PNG 3장, 3024×4032 (종이 2장의 3면) | [sources/member-records/이00_3/photos/](sources/member-records/이00_3/photos/) p01~p03 (원본 `uploads/hearth/6bfa9e00-2876-4a03-a4c6-d8dede73f3fe`, `uploads/hearth/0fc16fee-8460-4c20-9d6a-277720a784e9`, `uploads/hearth/cecd0757-4f52-47e8-9239-80618478157c`) | 이00_3 회원님 PT 기록, 6/24~10/16 37칸. 금색 스프링 수첩, 장 맨 위에 회원 이름 | [notebook-records.md 10절](analysis/notebook-records.md#10-이00_3-회원님-기록) |
| 김00 회원님 PT 수기 기록.md (채팅 첨부, 2026-10-25) | 마크다운 141줄 (판독본, 사진 2장 기준) | [sources/member-records/김00/김00 회원님 PT 수기 기록.md](sources/member-records/김00/김00%20회원님%20PT%20수기%20기록.md) (원본 `uploads/hearth/72622998-7aa6-4aa6-9b03-16541cad8989`) | 김00 회원님 PT 기록, 7/20~10/13 16칸. 맨 위에 회원 메모(등근육이 약함, 1차 루틴 구성), 10/13에 주 2일·주 3일 분할 메모 | 워크플로우 근거로만 씀 ([workflow.md](design/workflow.md)). 기록 분석은 아직 |
| 정00 회원 PT 수기기록.md (채팅 첨부, 2026-10-25) | 마크다운 88줄 (판독본, 사진 1장 기준) | [sources/member-records/정00/정00 회원 PT 수기기록.md](sources/member-records/정00/정00%20회원%20PT%20수기기록.md) (원본 `uploads/hearth/2b7829ce-af7f-4dd3-a35f-0fe480228a9c`) | 정00 회원님 PT 기록, 9/1~10/16 8칸과 맨 위의 날짜 없는 운동 목록. 9/15 오른쪽에 따로 적힌 목록은 날짜를 읽지 못함 | 워크플로우 근거로만 씀 ([workflow.md](design/workflow.md)). 기록 분석은 아직 |
| 최00 회원 PT 수기기록.md (채팅 첨부, 2026-10-25) | 마크다운 113줄 (판독본, 사진 1장 기준) | [sources/member-records/최00/최00 회원 PT 수기기록.md](sources/member-records/최00/최00%20회원%20PT%20수기기록.md) (원본 `uploads/hearth/5193b352-d5c1-4415-9fcc-153baec7b1ab`) | 최00 회원님 PT 기록, 8/28~10/16 14칸. 8/28에 9월 첫째 주 수업 시간 메모, 분할 이름은 당기·하체·밀기·어깨·가슴. 10/16은 날짜 옆 글씨만 있음 | 워크플로우 근거로만 씀 ([workflow.md](design/workflow.md)). 기록 분석은 아직 |
| 이00_2 회원 PT 수기 기록.md (채팅 첨부, 2026-10-25) | 마크다운 227줄 (판독본, 재촬영 사진 3장 기준) | [sources/member-records/이00_2/이00_2 회원 PT 수기 기록.md](sources/member-records/이00_2/이00_2%20회원%20PT%20수기%20기록.md) (원본 `uploads/hearth/8227b728-cd30-44ae-83a4-288d00310e05`) | 이00_2 회원님 PT 기록, 7/7~10/15 25칸. 맨 위에 회원 이름, 날짜 없는 앞다리·상체·하체 목록, 감량 목표와 하루 2끼 식단 메모 | 워크플로우 근거로만 씀 ([workflow.md](design/workflow.md)). 기록 분석은 아직 |

김00·정00·최00·이00_2 회원님 파일 4개는 다른 곳에서 2026-10-20에 첨부한 수첩 사진을 보고 만든 판독본이다. 사진은 이 프로젝트에 없어서 `[판독 불가]`·`[불확실]`로 남은 글씨를 여기서 다시 볼 수 없다. 표기도 우리 판독본과 다르다(곱하기는 `×`, 못 읽은 곳은 `[판독 불가]`·`[판독 불확실]`).

## 다음 단계

로드맵은 이 표 하나만 둔다 (D48).

| 단계 | 내용 | 상태 | 산출물 |
|---|---|---|---|
| 0 | 분석: 연구보고서·앱 설명, 트레이너 설문·인터뷰, 트레이너 수첩 기록 | 연구보고서·설문·인터뷰 완료. 수첩 기록은 회원님 6명분과 트레이너 본인 운동 2장을 받았다(분석은 이00_1·이00_3 회원님과 트레이너 본인 기록. 김00·정00·최00·이00_2 회원님 판독본 4개는 워크플로우 근거로만 씀). 2026-10-25 이현아님: 기록은 지금 받은 것으로 충분. 문서를 한 번 더 정리하고 트레이너 질문을 정리하는 일은 아직 | [project-analysis.md](analysis/project-analysis.md), [trainer-interview.md](analysis/trainer-interview.md), [notebook-records.md](analysis/notebook-records.md) |
| 1 | 데이터 구조 | v0.2 완료. O01~O03 답이 오면 v0.3 ([data-model.md 6절](design/data-model/data-model.md#6-트레이너-답변이-오면-바뀌는-곳)) | [design/data-model/](design/data-model/data-model.md) |
| 2 | 화면 흐름·프로토타입: 아래 화면 대응표의 화면. 수업 진행 화면이 가장 중요 | **진행 중.** 워크플로우 초안 v0.1 완료(2026-10-25, 실제 회원 기록으로, D53). 프로토타입 v1 완료(2026-10-26): 디자인 캔버스에 기본 경로 8화면과 보조 4화면, 실명(D54) ([workflow.md 5-4](design/workflow.md#5-4-프로토타입-v1-2026-10-26)). MVP 웹 프로토타입 완료(2026-10-27): 4a 범위, 아이패드 9세대 비율, 성+00 코드 (D62). 같은 날 수업 시나리오(8장면)를 쓰고 그 순서대로 v2로 다시 만듦 (D63). 이현아님 확인 대기 | [design/workflow.md](design/workflow.md), [prototype/mvp/index.html](prototype/mvp/index.html), 화면은 `design/screens/` (예정). 시작하면 화면 대응표도 이리로 옮긴다 |
| 3 | 추천 엔진 v1 설계: 일반 공식(population) + 트레이너 역할별 기준(D49). e1RM 공식(O20), 계산 방식(O21). 이 가운데 루틴 숫자 채우기 규칙은 4a에 들어가므로 먼저 정한다 (D52) | 대기 | — |
| 4 | MVP 개발. 4a 기록 앱 + 루틴 숫자 자동 채우기(D52) → 4b 수업 중 추천 v1(예상 수행, 세트 직전·이탈 뒤 추천) → 4c 개인화·맥락 보정(회원별 공식, 컨디션 반영, D57)과 방식별 기록(RQ1·RQ2 비교용) | 대기. GitHub 저장소(O23)와 기술 스택(O15)이 정해져야 시작 | — |
| 5 | AI 기능: 추천 근거를 문장으로 설명(근거 카드 자체는 4a부터, D58), 이탈 때 데이터상 차이 정리, 저장된 기록 검색·요약 | 대기 | — |

**정한 것 (D52, 2026-10-16):** 트레이너는 종목·순서·세트 구성만 정하면 나머지 숫자는 정해진다고 답했다([인터뷰 마지막]). 그래서 첫 MVP(4a)의 루틴 작성 화면에 숫자 자동 채우기를 넣는다. 역할별 기준·세트 구성 규칙·일반 공식으로 세트·횟수·무게·휴식을 채워 제안하고 트레이너가 확인하거나 고친다. 역할별 기준은 트레이너 답(O02)이 오기 전까지 임시값으로 만든다. 무게를 일반 공식으로 채우려면 e1RM 공식(O20)도 4a 전에 정해야 한다. 트레이너가 기록 앱을 먼저 써서 데이터를 쌓기 시작하는 것은 그대로다 (D50).

## 화면 대응표

화면 이름은 앱 설명 용어를 기본으로 하고, 인터뷰에서 넓어진 부분을 함께 적었다. 인터뷰가 각 화면에 더한 요구는 [trainer-interview.md 9절](analysis/trainer-interview.md#9-화면-요구-인터뷰에서-나온-것). MVP 열은 위 로드맵 단계다.

| 화면 | 앱 설명 | 인터뷰 근거 | 보여 주는 데이터 (테이블·쿼리) | MVP |
|---|---|---|---|---|
| 회원 목록 | 4-1 회원 목록 및 기본정보 (이름 검색, 새 회원 추가) | — | `member`, `member_goal` | 4a |
| 한눈에 = 수업 전 브리핑 | 4-2 한눈에 (다음 PT, 오늘 확인할 것, 진행 추이) | [인터뷰 1차-2] 7항목 "이건 다 알아야 됨", [설문 Q18-1] 이전 동일 루틴과 비교, [설문 Q19] | Q1-a 목표·훈련 방향, Q1-b 주의사항, Q1-c 확인사항·메모, Q1-d 지난 컨디션, Q1-e 지난 동일 종목, Q1-f 이전 동일 루틴, Q1-g 다음 PT | 4a |
| 예정 루틴 = 루틴 작성 | 4-5 예정 루틴 | [인터뷰 마지막] "1, 6을 정하면 2, 3, 4, 5는 정해져요", [인터뷰 2차-7] 카톡·대화로 조율 | `routine_template`, `session`(예정), `session_exercise`(종목별 참고사항 `note` 포함), `set_entry` 계획값, `role_default`, `set_structure`, Q4, Q8-b | 4a (숫자 자동 채우기 포함, D52) |
| 수업 진행 (오늘 PT 시작하기) | 4-2의 '오늘 PT 시작하기' 버튼 | [설문 Q4·Q7·Q8] 종이수첩에 수업 중 3~5분 기록, [인터뷰 1차-1] 앞 운동 볼륨에 따른 다음 종목 무게 | `set_entry` 결정값·실제값, `session` 컨디션, `session_caution_check`, `v_prior_context`, Q2, Q3, `expectation`, `recommendation`, Q8-a | 4a 기록, 4b 추천 |
| 수업 기록·상세 | 4-3 수업 기록, 4-4 수업 상세 | [인터뷰 기능] 당일·당주 총볼륨 | `v_session_summary`, Q5, Q6. 자세·통증 메모 연결은 `set_entry.note`·`pain_flag`, 계속 볼 것은 `member_note` | 4a |
| 수업 후 요약 | (없음. 4-7과 일부 겹침) | [인터뷰 기능] 기록 요약이 녹음보다 정확, [설문 Q13] 특이사항 정리·다음 확인사항 추천 | `session.summary`, `member_note`(AI 제안 채택), `deviation_review`, Q10 | 4a 규칙 요약, 5 문장 생성 |
| 진행 추이 = 회원 추이 | 4-2 진행 추이 | [설문 Q13] 운동·체중 변화 추이, 운동 히스토리 타임라인 | `body_measurement`, Q9. 종목별 e1RM 추이는 O20. 회원에게 보여 줄 목표를 둘지는 O33 | 4a 체중, 4b 이후 e1RM |
| 주의사항·확인사항 | 4-6 | [인터뷰 2차-4] "매일 확인도 해야됩니다" | `member_note`, `session_caution_check`, Q1-b, Q1-c | 4a |
| AI 기록 검색 | 4-7 | [인터뷰 1차-5] 다시 검토해야 하는 수준이면 안 씀 | 저장된 기록 전체. 질문 로그를 남길지는 O27 | 5 |

## 리스크

- **데이터 양:** 개인화(RQ2)는 회원마다 같은 종목의 반복 기록이 충분해야 검증된다. 기록 앱을 일찍 쓰기 시작해야 한다 (D50, O26). 데이터 구조 검증에는 가상 회원 김서연 데이터를 쓰고, 워크플로우·프로토타입은 실제 회원 기록으로 만든다(D53).
- **입력 부담:** 지금 트레이너는 종이수첩에 수업 중 3~5분 기록한다 [설문 Q4·Q8]. 앱은 이보다 편해야 쓰인다 [해석]. 트레이너는 "일 2번해야되는 느낌이면 절대 쓸 일 없습니다"[인터뷰 기능]라고 했다. 미리 채운 값은 확인만 하고, RIR·RPE는 빠르게 고른다 (D37).
- **iPad를 수업 중 써도 되는지:** 폰을 못 쓰는 이유가 센터 규정인지 예의 문제인지 아직 모른다. 규정이라면 iPad도 막힐 수 있다 (O05).
- **과장 표현:** "AI가 더 정확하다", "피로도 72%", 원인 진단 같은 문구를 쓰지 않는다 (D11).
- **건강 정보:** 통증 메모와 생리 주기가 들어간다. 암호화, 접근 범위, 동의 철회 때 지울 범위를 정해야 한다 (O17).
- **연구 활용 동의:** 실제 회원 기록 사용 허락은 받았다(D55, 2026-10-27 이현아님). 보고서용 가명 처리와 IRB 필요 여부는 지도교수님께 확인해야 한다 (O18). 2026-10-16부터 실제 회원의 수첩 기록(운동, 무게, 몸 상태 메모)이 [sources/member-records/](sources/member-records/)에 들어와 있다. 이00_2 회원님 기록에는 감량 목표와 식단도 적혀 있다. 프로젝트 폴더 밖으로 내보내지 않고 공개 페이지로 만들지 않는다. 보고서에 쓸 때는 가명으로 바꾼다. 예외는 두 곳이다. 하나는 프로토타입 디자인 캔버스다. 이현아님이 실제 기록을 실명 그대로 쓰기로 정했다(D54, 2026-10-26). 캔버스는 비공개 claude.ai 페이지이고, 공유 메뉴로 열어 주면 실제 기록과 건강에 가까운 메모도 함께 보인다. 다른 하나는 앱 워크플로우 v2 Claude 문서다. 회원을 성+00 코드(이00_1 등)로만 적고 실제 기록의 숫자와 메모를 쓴다(D61, 2026-10-27). 코드와 실명의 대응은 decisions.md D61에만 있다. MVP 웹 프로토타입(D62)도 같은 규칙으로 실제 기록을 코드로 담는다.
- **트레이너 1명 사례:** 연구보고서는 협력 트레이너와의 사례 기반 요구 확인이고 [PDF 2장], 설문·인터뷰 응답자도 1명이다. 추천 단계의 역할별 기준도 그 트레이너의 기준에서 출발한다 (D18). 다른 트레이너에게 쓰려면 설정값을 다시 받아야 하고, 연구 결과를 일반화할 때도 주의한다.

## 인용 규칙

| 표기 | 가리키는 곳 |
|---|---|
| `[PDF 1.2]`, `[PDF 24장]`, `[PDF 표지]` | 연구보고서의 절·장 번호 |
| `[앱 설명 4-3]`, `[앱 설명 3]` | [sources/app-description.md](sources/app-description.md)의 절 번호 |
| `[설문 Q18-1]`, `[설문 Q15-1]` | 설문 문항 번호. `-1`은 그 문항의 하위 문항 ([trainer-interview.md 1절](analysis/trainer-interview.md#1-설문-응답-체크-항목-포함) 표) |
| `[인터뷰 기능]`, `[인터뷰 1차-1]`, `[인터뷰 2차-5]`, `[인터뷰 3차-1]`, `[인터뷰 마지막]` | [sources/trainer-interview-raw.md](sources/trainer-interview-raw.md)의 제목. 숫자는 1차는 이현아님이 매긴 7개 번호, 2차는 트레이너의 답 번호 1~8, 3차는 질문 번호 1~3 (답은 "1.2는 그냥 맞고 3번은 특이하게 튀는 날만" 한 줄이라 `[인터뷰 3차]`만 쓰기도 한다) |
| `[인터뷰 2차 질문 1]`~`[인터뷰 2차 질문 3]`, `[인터뷰 2차 질문 끝]` | 2차 질문 쪽(이현아님이 보낸 질문 1~3과, 끝에 덧붙인 폰 기록·다음 세트 재추천 질문). 트레이너 답이 아니라 질문 문구를 가리킬 때 |
| `[인터뷰 10-27]` | [sources/trainer-interview-2026-10-27.md](sources/trainer-interview-2026-10-27.md)의 질문과 답 (2026-10-27 전달) |
| `[문헌 Craven 2022]` | [design/literature-defaults.md 9절](design/literature-defaults.md#9-출처)의 논문 목록. 연구보고서가 인용한 논문은 `[PDF 6장 표]`처럼 PDF 쪽을 쓴다 |
| `[추가질문 1]` | [sources/trainer-followup-questions.md](sources/trainer-followup-questions.md)의 질문 번호 |
| `[밀기 p01 8/14]` | 트레이너 본인 운동 밀기 기록 사진 p01의 8월 14일 칸. 분석은 notebook-records.md 9절, 글씨는 판독본 `sources/member-records/트레이너-본인/transcription.md` |
| `[이00_3 p01 8/14]`, `[이00_3 p01 날짜 없음]` | 이00_3 회원님 수첩 사진 p01의 8월 14일 칸, 날짜 없는 칸. 분석은 notebook-records.md 10절, 글씨는 판독본 `sources/member-records/이00_3/transcription.md` |
| `[김00 8/19 L52]`, `[김00 날짜 없음 L10]` | 받은 판독본(김00·정00·최00·이00_2) 파일의 줄 번호와 그 줄이 있는 날짜 칸. 받은 파일은 고치지 않아 줄 번호가 바뀌지 않는다. 쓰는 법은 [workflow.md 1절](design/workflow.md#1-이-문서가-쓰는-자료) |
| `[이00_3 10/7]`, `[김00 8/19]` | 프로젝트 폴더 밖 문서(Claude 문서)에서 쓰는 회원 코드와 날짜 칸. 코드와 실명의 대응은 [decisions.md](decisions.md) D61에만 있다 |
| `[수첩 p03 8/21]` | 이00_1 회원님 수첩 사진 p03의 8월 21일 칸. 분석은 [notebook-records.md](analysis/notebook-records.md), 글씨는 판독본 `sources/member-records/<회원>/transcription.md`의 같은 장 |
| D··, O··, R·· | [decisions.md](decisions.md)의 결정·열린 질문·답이 나온 질문 |
| Q1-a~Q10 | [queries.sql](design/data-model/queries.sql)의 검증 쿼리 제목. 목록은 [data-model.md 4절](design/data-model/data-model.md#4-요구사항--구조--검증-쿼리) |
| `[미확정 O··]` | schema.sql 주석. 그 열린 질문의 답에 따라 바뀌는 부분 |
| [해석] | 원문에 없는 분석자 해석. 원문 답과 구분해서 읽는다 |

링크는 상대 경로 마크다운 링크로 쓴다.

## 변경 기록

- 2026-10-27: 이현아님 요청으로 수업 시나리오(8장면, Claude 문서)를 쓰고 그 순서대로 MVP를 v2로 다시 만들어 같은 링크에 올림(D63, 원본 조각 prototype/mvp/src/). 현재 상태·할 것·파일 지도·다음 단계에 반영.
- 2026-10-27: 이현아님 요청으로 워크플로우 v2를 따라 MVP 웹 프로토타입을 만듦(D62, [prototype/mvp/index.html](prototype/mvp/index.html), 비공개 링크). 현재 상태·할 것·파일 지도·다음 단계·리스크에 반영.
- 2026-10-27: 이현아님 요청으로 앱 워크플로우 v2의 예와 숫자를 실제 수첩 기록으로 바꾸고 회원을 성+00 코드로 적음(D61). 현재 상태·파일 지도·리스크·인용 규칙에 반영.
- 2026-10-27: 이현아님 요청으로 앱 워크플로우를 v2로 다시 짜고(같은 Claude 문서, D60) 현재 상태·할 것·파일 지도에 반영.
- 2026-10-27: 이현아님 요청으로 기능이 가장 비슷한 앱 5개의 워크플로우를 분석(Claude 문서)하고 현재 상태·할 것·파일 지도에 추가.
- 2026-10-27: 이현아님 요청으로 경쟁 앱 분석(Claude 문서, O38)과 논문 기준 임시값([design/literature-defaults.md](design/literature-defaults.md), D59)을 만들고 현재 상태·할 것·파일 지도·인용 규칙에 추가.
- 2026-10-27: 이현아님 요청으로 추천 역할 분담(D57)과 근거를 눌러서 보는 규칙(D58)을 정한 것·다음 단계 표에 반영.
- 2026-10-27: 트레이너 답 [인터뷰 10-27] 원문 저장, 원자료 표·인용 규칙에 추가. R09, O36, O37 생김. O37은 같은 날 이현아님이 숫자 채우기 유지로 정함(D56).
- 2026-10-27: 기록 사용 허락(D55)을 정한 것·리스크에 반영. 앱 워크플로우 전체 흐름 문서(Claude 문서)를 현재 상태·할 것·파일 지도에 추가.
- 2026-10-26: 프로토타입 v1(디자인 캔버스 12화면)을 현재 상태·할 것·다음 단계에 적음. [workflow.md 5-4](design/workflow.md#5-4-프로토타입-v1-2026-10-26) 추가.
- 2026-10-26: O35 결정(D54). 프로토타입 디자인 캔버스에는 실제 회원 기록을 실명 그대로 쓴다. README 규칙의 예외로 리스크와 파일 지도에 적음.
- 2026-10-25: 워크플로우 초안 v0.1([design/workflow.md](design/workflow.md)) 추가. 이현아님 요청으로 가상 회원 대신 실제 회원 기록으로 만듦(D53). 프로토타입에 실제 기록을 어떻게 보여 줄지 열린 질문 O35 추가. 받은 판독본 인용 표기 `[김00 8/19 L52]` 추가.
- 2026-10-25: 김00·정00·최00·이00_2 회원님 PT 수기 기록 판독본 4개를 받은 그대로 `sources/member-records/<회원>/`에 저장하고 원자료 표에 넣음. 분석은 아직.
- 2026-10-24: 이00_3 회원님 수첩 사진 3장의 판독본과 분석(notebook-records.md 10절) 추가. 트레이너 질문 후보 20~38번. `[이00_3 …]` 인용 표기 추가.
- 2026-10-19: 트레이너 답 반영. 밀기 기록 2장은 트레이너 본인 운동이고 '대표님'은 센터 대표님. 폴더 이름을 `트레이너-본인/`으로 바꾸고 할 일에서 확인 요청을 뺌.
- 2026-10-17: 밀기 기록 2장(트레이너 본인 운동으로 추정)의 판독본과 분석(notebook-records.md 9절) 추가. p08~p14는 트레이너도 기억하지 못해 주인 미상으로 둠. `[밀기 …]` 인용 표기 추가.
- 2026-10-17: 이00_1 회원님 수첩 사진 17장의 판독본과 기록 방식 분석(notebook-records.md) 추가. 사진을 sources/member-records/로 옮김. p08~p14가 다른 회원님 기록일 수 있다는 확인 요청을 할 일에 넣음. O01~O03 상태를 '보냄, 답 기다림'으로 고침. 수첩 인용 표기 추가.
- 2026-10-16: 이현아님이 첫 MVP에 루틴 숫자 자동 채우기를 넣기로 정함(O22 → D52). 로드맵 3·4단계, 화면 대응표, 관련 문서 반영.
- 2026-10-15: 문서 정리 뒤 교차 검증. 계획값 고정을 종목 계획(세트 수·휴식·순서)과 계획 시간까지 넓힘(트리거 10개, 제약 테스트 33개), 종목별 참고사항(`session_exercise.note`) 추가, 인용을 원문 그대로 맞춤, 연구질문 용어 통일(검증 대상·비교 기준), 이름 없던 설계 항목에 번호 부여(O28~O34, D51), decisions.md에 '지금 할 일' 정리.
- 2026-10-15: 문서 정리. README·decisions.md·glossary.md 새로 만듦, 원자료를 sources/로 분리, project-analysis.md v2와 trainer-interview.md v1.1로 본문 수정, 데이터 구조 v0.2(예시 데이터·검증 쿼리 다시 씀, 자동 검사 추가).
- 2026-10-15: 데이터 구조 v0.1, 트레이너 설문·인터뷰 분석, 연구보고서·앱 설명 분석.
