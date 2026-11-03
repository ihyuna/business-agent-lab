'use strict';
/* ---------- 상수 ---------- */
const DOW=['일','월','화','수','목','금','토'];
const ROLES=['워밍업','메인','보조','마무리 털기','혈류 모으기','유산소성 순환'];
const STRUCTS=['스트레이트','탑세트+백오프','피라미드','드롭세트','레스트포즈','슈퍼세트'];
const KINDS={warmup:'워밍업',working:'본세트',top:'탑',backoff:'백오프',drop:'드롭',rest_pause:'레스트포즈',amrap:'최대 반복',test:'테스트'};
const KSHORT={warmup:'W',working:'',top:'T',backoff:'B',drop:'D',rest_pause:'RP',amrap:'MAX',test:'TEST'};
const COND_ITEMS=[['sleep','수면'],['fatigue','피로'],['soreness','근육통'],['pain','통증']];
const COND3=[['good','좋음'],['normal','평소'],['poor','나쁨']];
const PAIN3=[['none','없음'],['mild','약간'],['notable','뚜렷']];
const CHECK4=[['ok','괜찮음'],['same','같음'],['worse','나빠짐'],['better','좋아짐']];
const OBS=[['focus','집중'],['immersion','몰입'],['reaction','반응'],['stability','안정'],['recovery','회복'],['other','기타']];
const REMOVE_REASONS=['시간','컨디션','통증','기구 없음','기타'];
const DIRS=['발전','유지','조절','집중'];
const NOTE_KINDS={check:'다음에 확인할 것',lifestyle:'생활',diet:'식단',self_train:'개인 운동',personality:'성향',general:'메모'};
const MOVE_ITEMS=[['stability','자세 안정성'],['learning','동작 습득 속도'],['feedback','피드백 반영'],['holding','반복 시 자세 유지']];

/* 역할별 기준: 논문 기준 임시값(D59). 트레이너 답(O02)이 오면 바꾼다. target·sets는 숫자를 채울 때 쓰는 값 */
const ROLE_DEFAULTS={
  '워밍업':{rmin:12,rmax:15,target:12,rir:5,sets:1,smax:2,rest:45},
  '메인':{rmin:6,rmax:10,target:8,rir:2,sets:3,smax:5,rest:150},
  '보조':{rmin:8,rmax:12,target:10,rir:1,sets:3,smax:3,rest:75},
  '마무리 털기':{rmin:15,rmax:20,target:15,rir:1,sets:2,smax:3,rest:45},
  '혈류 모으기':{rmin:15,rmax:25,target:20,rir:1,sets:2,smax:3,rest:30},
  '유산소성 순환':{rmin:3,rmax:4,target:3,rir:1,sets:3,smax:4,rest:0,rounds:true}
};

/* 종목 사전. 단위·눈금(inc)은 예시다(O36). side=true면 '40/40kg'처럼 한쪽 무게로 적는다 */
const EXERCISES={
  inner:{name:'이너타이',part:'하체',unit:'',inc:2.5},
  outer:{name:'아웃타이',part:'하체',unit:'',inc:2.5},
  inout:{name:'이너/아웃 타이',part:'하체',unit:'',inc:2.5},
  calf:{name:'카프레이즈',part:'하체',unit:'',inc:2.5},
  scurl:{name:'시티드 레그컬',part:'하체',unit:'',inc:2.5},
  hacksq:{name:'핵스쿼트',part:'하체',unit:'kg',inc:2.5},
  legpress:{name:'레그프레스',part:'하체',unit:'kg',inc:2.5,side:true},
  legext:{name:'레그 익스텐션',part:'하체',unit:'',inc:10},
  olhack:{name:'원레그 핵프레스',part:'하체',unit:'',inc:2.5,uni:true},
  lunge:{name:'워킹런지',part:'하체',unit:'',inc:1},
  hackpress:{name:'핵프레스',part:'하체',unit:'kg',inc:2.5,side:true},
  goblet:{name:'고블릿 스쿼트',part:'하체',unit:'lb',inc:5},
  dbsdl:{name:'덤벨 스티프 데드리프트',part:'하체',unit:'lb',inc:5,side:true},
  lycurl:{name:'라잉 레그컬',part:'하체',unit:'',inc:2.5},
  incdb:{name:'인클라인 덤벨 프레스',part:'가슴',unit:'lb',inc:5,side:true},
  nitro:{name:'너틸러스 니트로 체스트',part:'가슴',unit:'',inc:5},
  bbinc:{name:'바벨 인클라인',part:'가슴',unit:'kg',inc:2.5},
  panadec:{name:'파나타 디클라인',part:'가슴',unit:'kg',inc:2.5,side:true},
  smithpu:{name:'스미스 푸쉬업',part:'가슴',unit:'',inc:1},
  atlinc:{name:'아틀 인클라인',part:'가슴',unit:'',inc:2.5},
  sdbsp:{name:'시티드 덤벨 숄더프레스',part:'어깨',unit:'lb',inc:5,side:true},
  dbsp:{name:'덤벨 숄더프레스',part:'어깨',unit:'lb',inc:5,side:true},
  ohp:{name:'OHP',part:'어깨',unit:'kg',inc:2.5},
  machlat:{name:'머신 사레레',part:'어깨',unit:'',inc:2.5},
  dblat:{name:'덤벨 사레레',part:'어깨',unit:'kg',inc:1,side:true},
  panasp:{name:'파나타 숄더프레스',part:'어깨',unit:'kg',inc:2.5,side:true},
  pushdown:{name:'케이블 푸쉬다운',part:'팔',unit:'lb',inc:5},
  cybrow:{name:'싸이벡스 시티드로우',part:'등',unit:'',inc:1},
  bbrow:{name:'바벨로우',part:'등',unit:'kg',inc:2.5},
  truet:{name:'트루 티바로우',part:'등',unit:'kg',inc:2.5},
  multirow:{name:'멀티로우',part:'등',unit:'kg',inc:2.5,side:true},
  shrug:{name:'슈러그',part:'등',unit:'kg',inc:2.5,side:true},
  megat:{name:'메가머스 티바로우',part:'등',unit:'kg',inc:2.5},
  panalat:{name:'파나타 싱글 랫풀다운',part:'등',unit:'kg',inc:2.5,side:true},
  lowrow:{name:'로우 로우 (Low row)',part:'등',unit:'kg',inc:2.5,side:true},
  latpd:{name:'랫풀다운',part:'등',unit:'',inc:2.5},
  deadlift:{name:'데드리프트',part:'하체',unit:'kg',inc:2.5},
  pushup:{name:'푸쉬업',part:'가슴',unit:'',inc:1},
  strive:{name:'스트라이브',part:'기타',unit:'kg',inc:2.5},
  frontraise:{name:'프론트 레이즈 (듀얼케이블)',part:'어깨',unit:'lb',inc:5}
};

/* ---------- 예시 데이터 ----------
   모두 지어낸 가상 회원 기록이다. 실제 사람 기록이 아니다.
   세트 표기: "45x20-25x2" = 무게 45, 횟수 20-25, 2세트. "40x16, 40x12" = 두 세트. "50" = 무게만.
   "x30x2" = 무게 없이 30회 2세트. 앞에 W: 워밍업, T: 탑, B: 백오프, D: 드롭.
   p = 계획이 실제와 다를 때만. */
const SEED_MEMBERS=[
 {"id":"m3","code":"회원 A","goals":[],"notes":[],"cautions":[],"templates":[{"id":"t3a","name":"하체","items":[["inner","보조"],["scurl","보조"],["hacksq","메인"],["legpress","보조"],["legext","마무리 털기"]]},{"id":"t3b","name":"밀기","items":[["incdb","메인","탑세트+백오프"],["nitro","보조"],["sdbsp","보조"],["machlat","마무리 털기"]]},{"id":"t3c","name":"당기기","items":[["cybrow","메인"],["bbrow","보조"],["truet","보조"],["multirow","보조"],["shrug","마무리 털기"]]}],"exMemos":{"hacksq":{"setting":"발판:2","memo":"","date":"2026-09-15"},"cybrow":{"setting":"패드:3, 의자:5","memo":"가슴 먼저 열고 당기기","date":"2026-09-24"},"legpress":{"setting":"등받이:2","memo":"","date":"2026-08-31"}},"sessions":[{"d":"2026-08-24","t":"t3a","ex":[["inner","보조","32.5x20-25x2",{}],["scurl","보조","45x20x3",{}],["hacksq","메인","15x8-15x3",{"setting":"발판:2"}],["legpress","보조","35x20x3",{"setting":"등받이:2"}]]},{"d":"2026-08-31","t":"t3a","ex":[["inner","보조","32.5x45, 47.5x8",{}],["scurl","보조","35x20x3",{"p":"45x20x3"}],["hacksq","메인","15x20, 35x",{"setting":"발판:2"}],["legpress","보조","35x20x3",{}]]},{"d":"2026-09-08","t":"t3a","ex":[["inner","보조","40x25",{}],["scurl","보조","35x20, 45x15x2",{"p":"35x20x3"}],["hacksq","메인","15x, 35x8-12x3",{}],["legpress","보조","",{"status":"swapped","to":"lunge"}],["lunge","보조","x30x2",{"origin":"swap"}],["legext","마무리 털기","",{"status":"removed","reason":"기타"}]]},{"d":"2026-09-15","t":"t3a","ex":[["inner","보조","40x20-25x2",{}],["scurl","보조","45x20x2",{"p":"45x15x3"}],["hacksq","메인","35x8-12x2",{"p":"35x8-12x3","setting":"발판:2"}],["legpress","보조","50x8, 35x13-20x2",{}],["lunge","보조","",{"origin":"added"}]]},{"d":"2026-09-16","t":"t3b","ex":[["incdb","메인","40x12, T:50x6-10x2, B:30x",{}],["nitro","보조","35x20x3",{}],["sdbsp","보조","15xx3",{}],["machlat","마무리 털기","x15-25x3",{}]]},{"d":"2026-09-17","t":"t3c","memo":"당기기 첫 동작 연결이 어색함 (가상)","ex":[["cybrow","메인","7x12x3",{"note":"가슴 먼저 열고 당기기"}],["bbrow","보조","35x8-12x3",{}],["truet","보조","25",{}],["multirow","보조","15",{}],["shrug","마무리 털기","25",{}]]},{"d":"2026-09-22","t":"t3a","targets":{"hacksq":{"w":50,"text":"50kg 도전"}},"ex":[["inner","보조","40x20-25x2",{}],["scurl","보조","45x20x3",{}],["hacksq","메인","35x16, 35x12",{}],["legpress","보조","35x20x2",{}],["legext","마무리 털기","40x20",{}]]},{"d":"2026-09-24","t":"t3c","memo":"무게 줄이고 호흡·가동범위 다시 확인 (가상)","ex":[["cybrow","메인","7",{"setting":"패드:3, 의자:5","note":"가슴 먼저 열고 당기기"}],["bbrow","보조","",{"status":"removed","reason":"기타"}],["truet","보조","25",{"note":"허리 중립 유지"}],["multirow","보조","",{}],["shrug","마무리 털기","",{"status":"removed","reason":"기타"}]]},{"d":"2026-09-30","t":"t3a","planOnly":true,"ex":[["inner","보조","40",{}],["scurl","보조","45",{}],["hacksq","메인","50",{}],["legpress","보조","35",{}],["legext","마무리 털기","40",{}]]}],"next":{"d":"2026-10-07","t":"t3a","time":"19:00"}},
 {"id":"m1","code":"회원 B","goals":[],"notes":[],"cautions":[],"templates":[{"id":"t1a","name":"밀기","items":[["bbinc","메인"],["ohp","보조"],["panadec","보조"],["pushdown","마무리 털기"]]}],"exMemos":{},"sessions":[{"d":"2026-07-07","t":"t1a","ex":[["bbinc","메인","52.5x13, 57.5x8, 57.5x6",{}],["ohp","보조","37.5x15, 42.5x5, 42.5x10",{}],["panadec","보조","22.5x실패지점x2",{}],["pushdown","마무리 털기","25x22",{}]]}]},
 {"id":"m2","code":"회원 C","goals":[{"text":"4개월 안에 체지방 줄이기 (가상)","start":""}],"notes":[{"kind":"diet","text":"저녁을 늦게 먹는 편 (가상)"}],"cautions":[],"templates":[{"id":"t2a","name":"앞다리","items":[["inout","보조"],["calf","마무리 털기"],["hacksq","메인"],["legpress","보조"],["legext","마무리 털기"]]}],"exMemos":{"hacksq":{"setting":"발판:2","memo":"","date":"2026-08-03"}},"sessions":[{"d":"2026-07-17","t":"t2a","ex":[["inout","보조","17.5x20",{}],["calf","마무리 털기","",{}],["hacksq","메인","5x18",{"setting":"발판:2"}],["legpress","보조","",{"status":"swapped","to":"goblet"}],["goblet","보조","20x32x2",{"origin":"swap"}],["legext","마무리 털기","",{}]]},{"d":"2026-08-03","t":"t2a","ex":[["inout","보조","",{}],["hacksq","메인","15x16",{"setting":"발판:2"}],["legpress","보조","",{"status":"swapped","to":"goblet"}],["goblet","보조","20x31x2",{"origin":"swap"}],["legext","마무리 털기","10",{}]]},{"d":"2026-09-01","t":"t2a","ex":[["inout","보조","17.5x20-25, 25x7-14",{}],["hacksq","메인","35x13x2",{"setting":"발판:2"}],["legpress","보조","",{"status":"swapped","to":"goblet"}],["goblet","보조","30x26x3",{"origin":"swap"}],["legext","마무리 털기","30x19x2",{}]]}]},
 {"id":"m4","code":"회원 D","goals":[{"text":"계단 오를 때 덜 지치기 (가상)","start":""}],"notes":[{"kind":"general","text":"상체 뒤쪽이 약한 편 (가상)"}],"cautions":[],"templates":[{"id":"t4a","name":"하체","items":[["scurl","보조"],["hackpress","메인"],["legpress","보조"],["legext","마무리 털기"]]}],"exMemos":{},"sessions":[{"d":"2026-08-19","t":"t4a","ex":[["scurl","보조","25",{}],["hackpress","메인","52.5xx3",{}],["legpress","보조","32.5xx3",{}],["legext","마무리 털기","60x13",{"p":"x21x3"}]]},{"d":"2026-09-11","t":"t4a","planOnly":true,"ex":[["scurl","보조","25",{}],["hackpress","메인","42.5",{}],["legpress","보조","32.5",{}],["legext","마무리 털기","60x13",{}]]},{"d":"2026-09-15","t":"t4a","ex":[["scurl","보조","25",{}],["hackpress","메인","",{"status":"removed","reason":"기타"}],["legpress","보조","22.5x18x3",{}],["legext","마무리 털기","60x19x3",{"p":"40x19x3"}]]},{"d":"2026-10-12","t":"t4a","ex":[["scurl","보조","25x21x4",{}],["legext","마무리 털기","60x20x4",{}],["legpress","보조","22.5x19",{}],["hackpress","메인","x26x3",{}]]}],"next":{"d":"2026-10-19","t":"t4a","time":""}},
 {"id":"m5","code":"회원 E","goals":[],"notes":[],"cautions":[],"templates":[{"id":"t5a","name":"앞","items":[["inner","보조"],["outer","보조"],["legpress","메인"],["dbsp","보조"],["dblat","마무리 털기"]]}],"exMemos":{},"sessions":[{"d":"2026-09-15","t":"t5a","ex":[["inner","보조","12.5x21x3",{}],["outer","보조","20x20x3",{}],["legpress","메인","17.5",{}],["dbsp","보조","10x5",{}],["dblat","마무리 털기","1x26",{}]]},{"d":"2026-10-06","t":"t5a","ex":[["inner","보조","12.5x20, 20x20x2",{"p":"12.5x20x3"}],["outer","보조","27.5x18x3",{"p":"20x19x3"}],["legpress","메인","17.5x15x3",{}],["dbsp","보조","10xx3",{}],["dblat","마무리 털기","1x20",{}]]},{"d":"2026-10-13","t":"t5a","ex":[["inner","보조","12.5x20, 12.5x24x2",{}],["outer","보조","27.5x25x3",{}],["legpress","메인","17.5x18, 27.5x13x2",{}],["dbsp","보조","",{}],["dblat","마무리 털기","",{"status":"swapped","to":"smithpu"}],["smithpu","마무리 털기","",{"origin":"swap"}]]}],"next":{"d":"2026-10-20","t":"t5a","time":""}},
 {"id":"m6","code":"회원 F","goals":[],"notes":[{"kind":"general","text":"월·토 오후 수업 선호 (가상)"}],"cautions":[],"templates":[{"id":"t6a","name":"당기","items":[["panalat","메인"],["truet","보조"],["megat","보조"],["lowrow","보조"],["shrug","마무리 털기"]]},{"id":"t6b","name":"밀기","items":[["atlinc","메인"],["panadec","보조"],["panasp","보조"],["dblat","마무리 털기"]]}],"exMemos":{"panalat":{"setting":"1번","memo":"","date":"2026-09-15"},"megat":{"setting":"의자 3","memo":"","date":"2026-09-15"}},"sessions":[{"d":"2026-09-08","t":"t6b","memo":"어깨 쪽 부담 확인 (가상)","ex":[["atlinc","메인","",{}],["panadec","보조","",{}],["panasp","보조","",{"status":"removed","reason":"기타"}],["dblat","마무리 털기","",{"status":"removed","reason":"기타"}]]},{"d":"2026-09-15","t":"t6a","memo":"세팅부터 다시 잡기 (가상)","ex":[["panalat","메인","17.5x18x3",{"setting":"1번"}],["truet","보조","22.5x12-20x3",{"p":"42.5x12x3"}],["megat","보조","17.5x15-20x3",{"setting":"의자 3"}],["lowrow","보조","22.5x16-19x3",{}],["shrug","마무리 털기","17.5x20x2",{}]]}]}
];

/* 시나리오 장면 7·8에서 넣는 회원 A 기록 (10/7 뒤). 앱의 '오늘'이 그 날짜를 지날 때만 넣는다 */
const M3_TEMPLATE_BACK={"id":"t3d","name":"후면사슬","items":[["deadlift","메인"],["bbrow","보조"],["truet","보조"]],"note":"10/9 기록에서 만든 틀"};
const M3_LATER={"2026-10-08":{"d":"2026-10-08","t":"t3b","ex":[["incdb","메인","50x10-15x3",{"note":"내릴 때 천천히"}],["nitro","보조","35x15x3",{"note":"다른 종목과 묶어서"}],["pushup","보조","x13x3",{"origin":"added"}],["sdbsp","보조","",{}],["machlat","마무리 털기","",{}]]},"2026-10-09":{"d":"2026-10-09","t":"t3d","memo":"종목 이름만 남김 (가상)","ex":[["deadlift","메인","",{}],["bbrow","보조","",{}],["truet","보조","",{}]]},"2026-10-15":{"d":"2026-10-15","t":"t3b","ex":[["ohp","메인","25x12x3",{"origin":"added"}],["strive","보조","10x20x3",{"origin":"added"}],["frontraise","보조","15x12-15x3",{"origin":"added"}]]},"2026-10-16":{"d":"2026-10-16","t":"t3c","memo":"시간 여유 없음, 등 종목 움직임 위주 (가상)","ex":[["deadlift","메인","",{"origin":"added"}],["bbrow","보조","",{"status":"swapped","to":"truet"}],["truet","보조","25",{"origin":"swap"}],["latpd","보조","",{"origin":"added"}],["cybrow","메인","7",{"setting":"패드:3, 의자:5"}]]}};
