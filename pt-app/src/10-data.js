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
  frontraise:{name:'프론트 레이즈 (듀얼케이블)',part:'어깨',unit:'lb',inc:5},
  dbstsp:{name:'덤벨 스탠딩 숄더프레스',part:'어깨',unit:'lb',inc:5,side:true},
  bulls:{name:'불스',part:'하체',unit:'',inc:1},
  backext:{name:'백익스텐션',part:'등',unit:'',inc:1},
  monster:{name:'몬스터 글루트',part:'하체',unit:'',inc:2.5},
  seoullat:{name:'서울 랫풀다운 (뉴트럴)',part:'등',unit:'kg',inc:2.5,side:true},
  panasibl:{name:'파나타 시블 (뉴트럴)',part:'등',unit:'kg',inc:2.5,side:true},
  pecdeck:{name:'팩덱 플라이',part:'가슴',unit:'',inc:2.5},
  incunk:{name:'인클라인 (앞 글자 판독 불확실)',part:'가슴',unit:'',inc:2.5},
  cablechest:{name:'케이블 체스트',part:'가슴',unit:'',inc:2.5},
  onearmcable:{name:'원암 케이블',part:'등',unit:'',inc:2.5},
  rearfly:{name:'케이블 리어델트 플라이',part:'어깨',unit:'',inc:2.5},
  panapress:{name:'파나타 프레스',part:'어깨',unit:'kg',inc:2.5,side:true},
  crunch:{name:'크런치 (앞 글자 판독 불확실)',part:'기타',unit:'',inc:1},
  smithinc:{name:'스미스 인클라인',part:'가슴',unit:'kg',inc:2.5},
  dbchest:{name:'덤벨 체스트',part:'가슴',unit:'lb',inc:5,side:true},
  hipabd:{name:'힙 어브덕션',part:'하체',unit:'kg',inc:2.5,side:true},
  asspull:{name:'어시스트 풀업',part:'등',unit:'',inc:2.5},
  pendersp:{name:'펜더 숄더프레스 (가운데 판독 불가)',part:'어깨',unit:'',inc:2.5},
  arnold:{name:'아놀드 프레스',part:'어깨',unit:'',inc:1},
  dbupright:{name:'덤벨 업라이트로우',part:'어깨',unit:'',inc:1},
  curlunk:{name:'레그컬 (앞 글자 판독 불가)',part:'하체',unit:'kg',inc:2.5},
  trowunk:{name:'티바로우 (앞 글자 판독 불가)',part:'등',unit:'kg',inc:2.5},
  trabd:{name:'트렁크 어브덕션',part:'하체',unit:'kg',inc:2.5},
  trrow:{name:'트렁크 티바로우',part:'등',unit:'',inc:2.5},
  smithsplit:{name:'스미스 스플릿 스쿼트',part:'하체',unit:'kg',inc:2.5,side:true},
  incbench:{name:'인클라인 벤치프레스',part:'가슴',unit:'kg',inc:2.5},
  superinc:{name:'슈퍼인클라인 머신',part:'가슴',unit:'',inc:2.5},
  yraise:{name:'Y레이즈',part:'어깨',unit:'',inc:1},
  traise:{name:'T레이즈',part:'어깨',unit:'',inc:1},
  serratus:{name:'전거근 운동',part:'기타',unit:'',inc:1},
  kneepu:{name:'무릎 푸쉬업',part:'가슴',unit:'',inc:1},
  highrow:{name:'메가메스 하이로우',part:'등',unit:'',inc:2.5},
  panacirc:{name:'파나타 서큘 랫풀다운 (뉴트럴)',part:'등',unit:'kg',inc:2.5,side:true},
  smithplank:{name:'스미스 플랭크',part:'기타',unit:'',inc:1},
  pullover:{name:'덤벨 풀오버',part:'등',unit:'lb',inc:5},
  cstbar:{name:'체스트 서포트 티바로우',part:'등',unit:'kg',inc:2.5},
  dyrow:{name:'DY row',part:'등',unit:'',inc:2.5},
  nautchest:{name:'너틸러스 체스트 프레스',part:'가슴',unit:'',inc:2.5},
  dips:{name:'딥스 머신',part:'가슴',unit:'',inc:2.5},
  extrot:{name:'케이블 익스터널 로테이션',part:'어깨',unit:'kg',inc:2.5},
  upright:{name:'업라이트 로우 (후면)',part:'어깨',unit:'kg',inc:2.5},
  gym80sp:{name:'GYM 80 숄더프레스',part:'어깨',unit:'kg',inc:2.5},
  armpd:{name:'케이블 암풀다운',part:'등',unit:'',inc:2.5},
  primerow:{name:'프라임 시티드로우',part:'등',unit:'kg',inc:2.5},
  bench:{name:'벤치프레스',part:'가슴',unit:'kg',inc:2.5},
  incmach:{name:'인클라인 머신',part:'가슴',unit:'kg',inc:2.5},
  revpec:{name:'리버스 펙덱 플라이',part:'어깨',unit:'',inc:2.5},
  seatohp:{name:'시티드 OHP',part:'어깨',unit:'kg',inc:2.5},
  rdl:{name:'루마니안 데드리프트',part:'하체',unit:'kg',inc:2.5},
  lyingtri:{name:'라잉 트라이셉 익스텐션',part:'팔',unit:'kg',inc:2.5},
  bicurl:{name:'이두컬',part:'팔',unit:'lb',inc:5},
  hammer:{name:'해머컬',part:'팔',unit:'lb',inc:5},
  cabrev:{name:'케이블 리버스 플라이',part:'어깨',unit:'kg',inc:2.5},
  onearmlat:{name:'원암 사레레 (머신/케이블)',part:'어깨',unit:'kg',inc:2.5},
  dbinckg:{name:'아령 인클라인',part:'가슴',unit:'kg',inc:2.5},
  seatbbsp:{name:'시티드 바벨 숄더프레스',part:'어깨',unit:'kg',inc:2.5},
  atominc:{name:'아톰 인클라인',part:'가슴',unit:'kg',inc:2.5},
  karrow:{name:'Kar row',part:'등',unit:'',inc:2.5},
  legcurl:{name:'레그컬',part:'하체',unit:'',inc:2.5},
  stiffdl:{name:'스티프 데드리프트',part:'하체',unit:'kg',inc:2.5}
};

/* ---------- 수첩 기록 → 앱 데이터 ----------
   세트 표기: "45x20-25x2" = 무게 45, 횟수 20-25, 2세트. "40x16, 40x12" = 두 세트. "50" = 무게만.
   "x30x2" = 무게 없이 30회 2세트. 앞에 W: 워밍업, T: 탑, B: 백오프, D: 드롭.
   p = 계획(지운 숫자 등)이 실제와 다를 때만. 실제 사람 기록이라 이름은 성+00 코드(D61). */
const SEED_MEMBERS=[
 {id:'m3',code:'이00_3',goals:[],notes:[{kind:'general',text:'날짜 없는 목록 (8/19와 8/20 사이): 1, 싸이벡스 클래식 시티드 로우. 2, 바벨로우 3, 메가메스 티바로우. 4, (빈칸) — 오른쪽에 ↓ 화살표와 \'순서 변경.\''}],cautions:[],
  templates:[
   {id:'t3a',name:'하체',items:[['inner','보조'],['scurl','보조'],['hacksq','메인'],['legpress','보조'],['legext','마무리 털기']]},
   {id:'t3b',name:'밀기',items:[['incdb','메인','탑세트+백오프'],['nitro','보조'],['sdbsp','보조'],['machlat','마무리 털기']]},
   {id:'t3c',name:'당기기',items:[['cybrow','메인'],['bbrow','보조'],['truet','보조'],['multirow','보조'],['shrug','마무리 털기']]},
   {id:'t3x',name:'분할 이름 없음 (6-7월)',items:[['incbench','메인'],['bbrow','메인']]}],
  exMemos:{hacksq:{setting:'발판:1, 밴드o',memo:'',date:'2026-09-15'},cybrow:{setting:'패드:4, 의자:6',memo:'날개뼈 먼저',date:'2026-09-24'},legpress:{setting:'등받이:1',memo:'',date:'2026-08-31'}},
  sessions:[
   {d:'2026-06-24',t:'t3x',memo:'날짜 줄: 6월 ~~18[?]일 가슴운동~~. 24일 / * 인클라인 벤치프레스 저중량 고반복 연습시키기 (세[?]팅유지능력)',ex:[
     ['incbench','메인','40x11',{raw:'1, 인클라인 벤치프레스. 40kg x 11reps (최고 기록)',note:'최고 기록'}],
     ['superinc','보조','',{origin:'added',raw:'2, 슈퍼인클라인 머신.'}],
     ['dbsp','보조','',{origin:'added',raw:'3, 덤벨 숄더프레스 + 사레레.'}]]},
   {d:'2026-07-01',t:'t3x',ex:[
     ['incbench','메인','40x11',{raw:'1, 인클라인 벤치프레스. 40kg x 11reps'}],
     ['panadec','보조','20',{origin:'added',raw:'2, 파나타 디클라인 (전거근 기능과 날개뼈) 20/20kg',note:'전거근 기능과 날개뼈'}]]},
   {d:'2026-07-02',t:'t3x',memo:'이 칸에는 운동 줄이 한 줄뿐이다.',ex:[
     ['bbrow','메인','',{raw:'1, 바벨로우.'}]]},
   {d:'2026-07-08',t:'t3x',memo:'날짜 줄 순서: ①바벨로우. ②메가메스 티바로우 ③싸이벡스 시티드로우.',ex:[
     ['bbrow','메인','30x10-15x4',{raw:'1. 바벨로우 30kg x 10-15reps x 4sets.'}],
     ['megat','보조','0x20x4',{origin:'added',raw:'2, 메가메스 티바로우 20reps x 0kg x 4sets.'}],
     ['cybrow','보조','7x15-25x4',{origin:'added',raw:'3, 싸이벡스 클래식 시티드로우. 7 x 15-25reps x 4sets.'}],
     ['multirow','보조','0x25x4',{origin:'added',raw:'4, 멀티로우 0 x 25reps x[?] 4sets.'}],
     ['yraise','마무리 털기','',{origin:'added',raw:'5, Y레이즈. (가영[?])'}],
     ['traise','마무리 털기','',{origin:'added',raw:'6, T레이즈 (가영[?])'}]]},
   {d:'2026-07-10',t:'t3b',ex:[
     ['incbench','메인','40x11',{origin:'added',raw:'1, 인클라인 벤치프레스. ~~3[?]~~ 40kg x ~~9reps, 11reps, 11reps~~ 11reps.'}],
     ['panadec','보조','',{origin:'added',raw:'2[?], 파나타 디클라인.'}],
     ['incdb','보조','',{origin:'added',status:'removed',reason:'기타',raw:'2, ~~덤벨 인클라인~~.'}],
     ['serratus','보조','',{origin:'added',raw:'3, 전거근 운동.'}]]},
   {d:'2026-07-30',t:'t3b',memo:'날짜 줄: 7월 ~~1[7?]일 밀기.~~ 30일 밀기.',ex:[
     ['incbench','메인','30x8-15x4',{origin:'added',raw:'1, 인클라인 벤치 프레스. 30kg x 8-15reps x 4sets.'}],
     ['atlinc','보조','10x8x5',{origin:'added',raw:'2, 아틀란티스 인클라인 머신 10/10kg x. 8reps x5[?]sets'}],
     ['panadec','보조','10x8-15x5',{p:'10x8x5',origin:'added',raw:'3, 파나타 디클라인 10/10kg x ~~8reps~~ x 5sets. └▷ 8-15reps.'}],
     ['pecdeck','마무리 털기','20x40',{origin:'added',raw:'4, 펙덱 플라이 (아틀란티스) 20kg x 40reps'}]]},
   {d:'2026-07-31',t:'t3c',ex:[
     ['bbrow','메인','35x12-15x3',{p:'30x12-15x3',raw:'1. 바벨로우 ~~3[?]0kg~~ 35kg x 12-15reps x 3sets.'}],
     ['megat','보조','',{origin:'added',raw:'2, 메가메스 티바로우'}],
     ['cybrow','보조','',{raw:'3, 싸이벡스 시티드로우'}],
     ['multirow','보조','',{raw:'4, 멀티로우'}]]},
   {d:'2026-08-05',t:'t3c',memo:'* 힘 빼기. 목에[?] 힘',ex:[
     ['bbrow','메인','30x15-20x5',{raw:'1, 바벨로우 30kg x 15-20reps x 5sets (연습).',note:'연습'}],
     ['megat','보조','20x10-15x5',{origin:'added',raw:'2, 메가메스 티바로우 20kg x 10-15reps x 5[?]sets (연습)',note:'연습'}],
     ['cybrow','보조','8x15-20x5',{raw:'3, 싸이벡스 시티드로우 8 x 15-20reps x 5sets (연습)',note:'연습'}],
     ['multirow','보조','',{status:'removed',reason:'기타',raw:'~~4, 멀티로우~~'}]]},
   {d:'2026-08-06',t:'t3b',ex:[
     ['incbench','메인','35x10-15x4',{origin:'added',raw:'1. 인클라인 벤치프레스 35kg x 10-15reps x 4sets.'}],
     ['atlinc','보조','',{origin:'added',raw:'2, 아틀란티스 인클라인'}]]},
   {d:'2026-08-07',t:'t3a',memo:'분할 메모: 하체(머신으로 루틴부터 쉽게) / 4번 줄의 \'↳ 20kg x 12-15reps x 3sets.\'는 핵스쿼트 무게인지 레그프레스 새 처방인지 판독 불확실',ex:[
     ['inner','보조','30x20x3',{raw:'1, 이너타이 30 x 20reps x 3sets.'}],
     ['scurl','보조','50x20x3',{raw:'2, 시티드 레그컬 50 x 20reps x 3sets.'}],
     ['hacksq','메인','',{raw:'3, 핵스쿼트(~~발판 2~~, 밴드o, 아래와 위에서 힘 풀리는 구간x)',setting:'밴드o',note:'아래와 위에서 힘 풀리는 구간x'}],
     ['legpress','보조','40x12',{raw:'4, 프라임레그 프레스 40/40kg x 12reps 발판:1 ↳ 20kg x 12-15reps x 3sets.',setting:'발판:1'}],
     ['legext','마무리 털기','',{raw:'5, 레그 익스텐션.'}]]},
   {d:'2026-08-12',t:'t3c',memo:'분할 메모: 당기기 (힘 빼고 부드러운 연결로 연습).',ex:[
     ['bbrow','메인','40x10-15x2',{raw:'1, 바벨로우 30kg x 15-20reps x —▷ 40kg x 10-15reps x 2sets.'}],
     ['megat','보조','20x10-15',{origin:'added',raw:'2, 메가메스 티바로우 20kg x 10-15reps'}],
     ['cybrow','보조','10x12x3',{raw:'3, 싸이벡스 클래식 시티드 로우 8 x 15-20reps —▷ 10 x 12reps x 3sets.'}],
     ['panacirc','보조','20',{origin:'added',raw:'4, 파나타 서큘 랫풀다운(뉴트럴 그립) 20/20kg'}]]},
   {d:'2026-08-13',t:'t3b',memo:'* 밀기는 두 종류[?]가 있지만 등접는 느낌이 어려워서 풀가어[?] 느낌 본다[?]. / * 민다(x) 모은다(o) 넓게(x) 느낌 걸리는 곳까지(o)',ex:[
     ['incbench','메인','40',{p:'35',origin:'added',raw:'1. 인클라인 벤치프레스. ~~35kg~~ 40kg main (손 소지가 안쪽 날렁[?])'}],
     ['panadec','보조','',{origin:'added',raw:'2, 파나타 디클라인 ⊕ 푸쉬업으로 묶어서 [지운 글자 판독 불가] 가슴 털기.',note:'푸쉬업과 묶어서'}],
     ['panasp','보조','',{origin:'added',status:'swapped',to:'sdbsp',raw:'3, ~~파나타 숄더프레스~~.'}],
     ['sdbsp','보조','10',{origin:'swap',raw:'▷ 시티드 덤벨 숄더 프레스 (등받이x). 10/10lb',setting:'등받이x'}],
     ['kneepu','마무리 털기','',{origin:'added',raw:'4, 무릎 푸쉬업. -▷ 의자나 더 높이를 높게 설정해야겠다:',note:'의자나 더 높이를 높게 설정해야겠다'}]]},
   {d:'2026-08-14',t:'t3a',ex:[
     ['inner','보조','37.5x25x2',{raw:'1, 이너타이 37.5kg x 25reps x 2sets (보조o, 강하게).',note:'보조o, 강하게'}],
     ['scurl','보조','50x20x2',{raw:'2, 시티드 레그컬 50 x 20reps x 2sets.'}],
     ['hacksq','메인','20x8-15x2',{raw:'3, 핵스쿼트 (밴드o, 발판2) 20kg x 8-15reps x 2sets.',setting:'밴드o, 발판2'}],
     ['legpress','보조','40x20x2',{p:'40x20x3',raw:'4. 프라임 레그프레스. (등받이:1, 가변저항 아래, 발 가쪽[?]) 40/40kg x 20reps x {위: 2sets.}~~3sets~~,',setting:'등받이:1, 가변저항 아래, 발 가쪽[?]'}],
     ['legext','마무리 털기','',{status:'removed',reason:'기타',raw:'~~5, 레그 익스텐션~~.'}]]},
   {d:'2026-08-19',t:'t3c',memo:'분할 메모: 당기기 (힘 빼고 부드러운 연결 연습하기) / * 개인 운동 상체 진행하기. / * 생각을 덜어낼 필요가 있음. / * 무게와 횟수는 중요하지 않다. / ↳ 박자감과 가동범위를 세[밀?]을 우선으로 진행.',ex:[
     ['bbrow','메인','40x10-15x3',{raw:'1, 바벨로우 40kg x 10-15reps x 3sets.'}],
     ['highrow','보조','',{origin:'added',raw:'메가메스 하이로우 (아래 광배까지 사용 해보기.) — 화살표로 바벨로우 다음에 넣음',note:'아래 광배까지 사용 해보기'}],
     ['megat','보조','20x10-15x3',{origin:'added',raw:'2, 메가메스 티바로우 20kg x 10-15reps x 3sets.'}],
     ['cybrow','보조','10x12x3',{raw:'3. 싸이벡스 클래식 시티드로우 10 x 12reps x 3sets'}],
     ['panacirc','보조','20',{origin:'added',raw:'4, 파나타 서큘 랫풀다운(뉴트럴 그립) 20/20kg x.'}]]},
   {d:'2026-08-20',t:'t3b',memo:'3번 줄을 지운 뒤 ③, ④로 번호를 다시 매김',ex:[
     ['incbench','메인','40x12-15x3',{origin:'added',raw:'1, 인클라인 벤치프레스. 40kg x. 12-15reps x 3sets.'}],
     ['panadec','보조','15x20x3',{p:'20x20x3',origin:'added',raw:'2, 파나타 디클라인. ~~20/20kg~~ 15/15kg x 20reps x 3sets.'}],
     ['dblat','보조','',{origin:'added',status:'removed',reason:'기타',raw:'3, ~~사레레 5/5lb x~~'}],
     ['shrug','보조','20x20-30',{origin:'added',raw:'③, 슈러그 20/20kg x 20-30reps'}],
     ['smithpu','마무리 털기','',{origin:'added',raw:'④ 스미스 푸쉬업.'}]]},
   {d:'2026-08-24',t:'t3a',ex:[
     ['inner','보조','37.5x20-25x2',{raw:'1. 이너타이 37.5 x 20-25reps x 2sets.'}],
     ['scurl','보조','50x20x3',{raw:'2, 시티드 레그컬 50x 20 x 3sets.'}],
     ['hacksq','메인','20x8-15x3',{raw:'3, 핵스쿼트 (~~발판:2~~, 밴드o) 20kg x 8-15reps x 3sets. -▷ 발판: 1로 변경.',setting:'밴드o'}],
     ['legpress','보조','40x20x3',{raw:'4. 레그프레스(프라임)(등받이:1) 40/40kg x 20reps x 3sets.',setting:'등받이:1'}]]},
   {d:'2026-08-25',t:'t3b',memo:'* 슈러그 당기기에 적용하기 ↓',ex:[
     ['incbench','메인','40x12-15',{origin:'added',raw:'1, 인클라인 벤치프레스. 40kg x 12-15 reps'}],
     ['panadec','보조','15x20',{origin:'added',raw:'2, 파나타 디클라인 15/15kg x 20reps'}],
     ['sdbsp','보조','10',{raw:'3. 시티드 덤벨 숄더프레스. 10/10lb'}],
     ['smithpu','마무리 털기','',{origin:'added',raw:'4, 스미스 푸쉬업.'}]]},
   {d:'2026-08-26',t:'t3c',ex:[
     ['cybrow','메인','10x12x3, 13x15',{raw:'1, 싸이벡스 클래식 {위: ↗▷ (패드: 4, 의자: 6)} 시티드로우. 10 x 12reps x 3sets (퀄[?]리[?]티보며 상승) 13x15',setting:'패드:4, 의자:6',note:'퀄[?]리[?]티보며 상승'}],
     ['bbrow','보조','40xx3',{raw:'2, 바벨로우 40kg x3sets (손 평소보다 넓게 등 45°)',note:'손 평소보다 넓게 등 45°'}],
     ['megat','보조','20xx3',{origin:'added',raw:'3. 메가메스 티바로우 20kg x3sets (명치를 축으로 진행하기)',note:'명치를 축으로 진행하기'}],
     ['shrug','마무리 털기','40xx3',{raw:'4. 슈러그 40/40kg x 3sets.'}]]},
   {d:'2026-08-31',t:'t3a',ex:[
     ['inner','보조','37.5x45, 52.5x8',{raw:'1, 이너타이 37.5 x {위: 45reps}~~20-25reps~~ x ~~2sets~~. -▷ 52.5 kg x 8reps.'}],
     ['scurl','보조','40x20x3',{p:'50x20x3',raw:'2, 시티드 레그컬 ~~50 x 20reps x 3sets~~. 40 x 20reps x 3sets.'}],
     ['hacksq','메인','20x20, 40x',{raw:'3. 핵스쿼트 (발판:1, 밴드o) 20kg x 8~~-15reps x 3sets~~. 20reps, 40kg x (짝 불확실)',setting:'발판:1, 밴드o'}],
     ['legpress','보조','40x20x3',{raw:'4. 레그프레스(프라임, 등받이:1) 40/40kg x 20reps x 3sets.'}]]},
   {d:'2026-09-01',t:'t3b',ex:[
     ['incbench','메인','60x10-15x2, B:40x',{origin:'added',raw:'1. 인클라인 벤치프레스. 60kg x 10-15reps x ~~3[?]sets~~. 2sets, 40kg(backoff)'}],
     ['panadec','보조','20, 12.5',{origin:'added',raw:'2, 파나타 디클라인 20/20 (퀄[?]리티 아쉬움) main: 12.5/12.5kg.',note:'퀄[?]리티 아쉬움'}],
     ['sdbsp','보조','10xx3',{raw:'3. 시티드 덤벨 숄더프레스. 10/10lb x 3sets.'}],
     ['smithpu','마무리 털기','xx2',{origin:'added',raw:'4, 스미스 푸쉬업. x2sets'}],
     ['smithplank','마무리 털기','',{origin:'added',raw:'5, 스미스 플랭크 버티기.'}]]},
   {d:'2026-09-03',t:'t3c',ex:[
     ['cybrow','메인','14x8-12x3',{p:'13xx3',raw:'1. 싸이벡스 클래식 시티드로우(패드:4, 의자:6) ~~13 x [빈칸] x 3sets~~. 14 x 8-12reps x 3',setting:'패드:4, 의자:6'}],
     ['bbrow','보조','40',{raw:'2, 바벨로우 40kg'}],
     ['megat','보조','20',{origin:'added',raw:'3, 메가메스 티바로우 20kg'}],
     ['shrug','마무리 털기','40',{raw:'4, 슈러그 40/40kg'}]]},
   {d:'2026-09-08',t:'t3a',ex:[
     ['inner','보조','45x25',{raw:'1. 이너타이 ~~위칭:3 52.5kg x 3sets~~ 45kg x 25reps.'}],
     ['scurl','보조','40x20, 50x15x2',{p:'40x20x3',raw:'2, 시티드 레그컬 40 x 20reps x ~~3sets~~ -▷ 50 x ~~25~~ ⑮ x2sets.'}],
     ['hacksq','메인','20x, 40x8-12x3',{raw:'3, 핵스쿼트(발판:1, 밴드o) 20kg 해보고 40kg 20개[?] -▷ 40kg x ~~12reps~~ x 3. {아래: 8-12reps.}'}],
     ['legpress','보조','',{status:'swapped',to:'lunge',raw:'4, ~~프라임 레그프레스(등받이:1) 40/40kg x 20reps x 3sets~~.'}],
     ['lunge','보조','x30x2',{origin:'swap',raw:'↳ 워킹런지로 마무리. x ~~3sets~~. 30reps x2sets'}],
     ['legext','마무리 털기','',{status:'removed',reason:'기타',raw:'4, ~~레그 익스텐션~~.'}]]},
   {d:'2026-09-09',t:'t3b',memo:'동그라미 숫자 ①②가 바꾼 운동을 표시',ex:[
     ['incbench','메인','',{origin:'added',status:'swapped',to:'incdb',raw:'1, 인클라인 벤~~치프레스~~'}],
     ['incdb','메인','45x12x4',{origin:'swap',raw:'{위: ①}덤벨 프레스 45/45lb x 12reps x 4sets.'}],
     ['panadec','보조','',{origin:'added',status:'swapped',to:'nitro',raw:'2, 파나타- 디클라인'}],
     ['nitro','보조','40x10-12x3',{origin:'swap',raw:'②너틸 니트로 체스트 40 x 10-12reps x 3.'}],
     ['sdbsp','보조','',{raw:'3. 시티드 덤벨 숄더프레스'}],
     ['smithpu','마무리 털기','',{origin:'added',raw:'4. 스미스 푸쉬업 + 플랭크.'}]]},
   {d:'2026-09-11',t:'t3c',memo:'* ① 종목에서 12는 가볍고 13, 14로 가면 자세가 너무 안 나온다',ex:[
     ['cybrow','메인','12xx4',{raw:'1, 싸이벡스 클래식 시티드로우 (패드:4, 의자:6) 12 x [빈칸] x 4sets',setting:'패드:4, 의자:6'}],
     ['bbrow','보조','40',{raw:'2, 바벨로우 40kg'}],
     ['megat','보조','',{origin:'added',status:'removed',reason:'기타',raw:'3, ~~메가메스 티바로우 20kg~~'}],
     ['truet','보조','20x12-15x4',{raw:'4, 트루 티바로우 20kg (시도해보기.) x 12-15reps x 4sets',note:'시도해보기.'}],
     ['shrug','마무리 털기','20',{raw:'5, 슈러그 20/20kg'}]]},
   {d:'2026-09-15',t:'t3a',ex:[
     ['inner','보조','45x20-25x2',{raw:'1, 이너타이 45 x 20-25 x 2.'}],
     ['scurl','보조','50x20x2',{p:'50x15x3',raw:'2, 시티드 레그컬 50 x ~~15 x 3~~ 20 x ~~3~~2 (walking)'}],
     ['hacksq','메인','40x8-12x2',{p:'40x8-12x3',raw:'3, 핵스쿼트 (발판: 1, 밴드 o) 40kg x ~~8-12 x~~ 3 x 8-12 x 2',setting:'발판:1, 밴드o'}],
     ['legpress','보조','60x8, 40x13-20x2',{raw:'4, 레그프레스 (CYBEX) 60/60kg x 8, 40/40kg x 13-20 x 2'}],
     ['lunge','보조','',{origin:'added',raw:'5, 워킹런지 아 런지 마무리.'}]]},
   {d:'2026-09-16',t:'t3b',ex:[
     ['incdb','메인','45x12, T:55x6-10x2, B:35x',{raw:'1, 인클라인 덤벨 프레스 45/45lb x 12 x ~~4sets~~ , 55/55lb x 6-10 x 2 ⤵ backoff 35/35lb.'}],
     ['nitro','보조','30x20x3',{raw:'2, 너틸러스 니트로 체스트 30 x 20 x 3sets.'}],
     ['sdbsp','보조','10xx3',{raw:'3, 숄더 프레스 (시티드 덤벨) 10/10lb x ~~25reps x~~ 3 .'}],
     ['machlat','마무리 털기','x15-25x3',{raw:'4, 머신 사레레 [빈칸] 15-25 x 3.'}]]},
   {d:'2026-09-17',t:'t3c',memo:'▷ 이어가는 느낌이 없음. -▷ 핀으 수정.',ex:[
     ['cybrow','메인','8x12x3',{raw:'1, 싸이벡스 시티드로우 {위: ▷ 날개뼈로 시동걸고 시작으로 수정.} ~~12 x [빈칸] -15 x 3sets~~ ↳ 8 x 12 x 3sets.',note:'날개뼈로 시동걸고 시작으로 수정.'}],
     ['bbrow','보조','40x8-12x3',{raw:'2, 바벨로우 40 x 8-12 x 3sets'}],
     ['truet','보조','20',{raw:'3, 트루티바로우 20'}],
     ['multirow','보조','20',{raw:'4, 멀티로우 20/20'}],
     ['shrug','마무리 털기','20',{raw:'5, 슈러그. 20/20'}]]},
   {d:'2026-09-22',t:'t3a',targets:{hacksq:{w:60,text:'60kg 도전',raw:'-▷ 60kg 도전 예정.'}},ex:[
     ['inner','보조','45x20-25x2',{raw:'1, 이너타이 45 x 20-25 x 2'}],
     ['scurl','보조','50x20x3',{raw:'2, 시티드 레그컬 50 x 20 x 3'}],
     ['hacksq','메인','40x16, 40x12',{raw:'3, 핵스쿼트 40kg x 16reps, 12reps. -▷ 60kg 도전 예정.'}],
     ['legpress','보조','40x20x2',{raw:'4, 레그프레스 40/40kg x 20 x 2'}],
     ['legext','마무리 털기','30x20',{raw:'5, 레그 익스텐션 ~~30-50~~. 30 x 20.'}]]},
   {d:'2026-09-24',t:'t3c',memo:'* 종목 무게 줄이고 다시 기본 첵. (호흡, 가동범위, 텐션유지)',ex:[
     ['cybrow','메인','8',{raw:'1, 싸이벡스 시티드로우 (패드4, 의자6) ~~12 x 15 x 3~~ 8 (날개뼈 먼저)',setting:'패드:4, 의자:6',note:'날개뼈 먼저'}],
     ['bbrow','보조','',{status:'removed',reason:'기타',raw:'~~2, 바벨로우~~'}],
     ['truet','보조','20',{raw:'3, 트루티바로우 20 (키커지는 느낌, 척추 1자 만들기.)',note:'키커지는 느낌, 척추 1자 만들기.'}],
     ['multirow','보조','',{raw:'4, 멀티로우 (의자 없어서 3)(팔꿈치 벌리고 기대기) — 일부 판독 불확실'}],
     ['shrug','마무리 털기','',{status:'removed',reason:'기타',raw:'~~5, 슈러그~~'}]]},
   {d:'2026-09-30',t:'t3a',planOnly:true,ex:[
     ['inner','보조','45',{raw:'1, 이너타이 45'}],
     ['scurl','보조','50',{raw:'2, 시티드 레그컬 50'}],
     ['hacksq','메인','60',{raw:'3, 핵스쿼트 60 도전'}],
     ['legpress','보조','40',{raw:'4, 레그프레스 40/40kg'}],
     ['legext','마무리 털기','30',{raw:'5, 레그 익스텐션 30'}]]}],
  next:{d:'2026-10-07',t:'t3a',time:'19:00'}},

 {id:'m1',code:'이00_1',goals:[],notes:[],cautions:[],
  templates:[{id:'t1a',name:'밀기',items:[['bbinc','메인'],['ohp','보조'],['panadec','보조'],['pushdown','마무리 털기']]},
   {id:'t1b',name:'등',items:[["armpd","보조"],["bbrow","메인"],["megat","보조"],["highrow","보조"],["asspull","보조"]]},
   {id:'t1c',name:'어깨',items:[["revpec","보조"],["panasp","메인"],["dbsp","보조"],["dblat","보조"],["onearmlat","마무리 털기"]]},
   {id:'t1d',name:'당기기',items:[["highrow","메인"],["truet","보조"],["primerow","보조"],["panacirc","보조"],["shrug","마무리 털기"]]},
   {id:'t1e',name:'레이즈',items:[["extrot","메인"],["cabrev","보조"],["dblat","보조"],["onearmlat","보조"],["rearfly","마무리 털기"]]},
   {id:'t1f',name:'후면사슬',items:[["latpd","보조"],["truet","보조"],["deadlift","메인"],["lowrow","보조"]]},
   {id:'t1g',name:'하체',items:[["legcurl","보조"],["legext","보조"],["legpress","메인"],["stiffdl","보조"],["bulls","마무리 털기"]]},
   {id:'t1x',name:'분할 이름 없음',items:[["bbinc","메인"],["bbrow","메인"]]}],
  exMemos:{},
  sessions:[
   {d:'2026-03-03',t:'t1b',ex:[
     ["pullover","메인","",{"raw":"덤벨 풀오버 + 케이블 암풀다운 40lb x [blank], 23 x [blank] x 2sets.","origin":"added"}],
     ["cstbar","보조","",{"raw":"체스트 서포트 티바로우. Top set x 1set, mein set x 2sets. 무게 찾기.","origin":"added"}],
     ["megat","보조","",{"raw":"메가맥스 티바로우. 40kg x 1set, 25kg mein x 2sets."}],
     ["dyrow","보조","",{"raw":"DY row ~~20/20~~ x 12-20 reps x 2sets. 10/10","origin":"added"}],
     ["cybrow","보조","",{"raw":"싸이벡스 클래식. 10 x 12-20 reps x 1-2sets.","origin":"added"}]]},
   {d:'2026-03-06',t:'t1a',ex:[
     ["pecdeck","메인","55",{"raw":"펙덱 플라이 55lb.","origin":"added"}],
     ["incdb","보조","",{"raw":"인클라인 덤벨 TOP 55lb. main 35lb","origin":"added"}],
     ["smithinc","보조","",{"raw":"인클라인 스미스. TOP 20/20kg, main 10/10kg","origin":"added"}],
     ["nautchest","보조","40x30x2",{"raw":"너틸러스 체스트 프레스. 40 x 30reps x 2sets.","origin":"added"}],
     ["dips","보조","12x15",{"raw":"딥스. 12 x 15reps.","origin":"added"}]]},
   {d:'2026-03-13',t:'t1b',ex:[
     ["pullover","메인","",{"raw":"덤벨 풀오버 + 케이블 암풀다운. 40lb x [blank], 23 x [blank] x 2sets.","origin":"added"}],
     ["megat","보조","",{"raw":"메가맥스 티바로우. ~~40kg x 1sets~~, ~~25kg x 2sets~~. main 40kg."}],
     ["dyrow","보조","10",{"raw":"DY row 10/10.","origin":"added"}],
     ["cybrow","보조","8",{"raw":"싸이벡스 클래식. ~~10~~. 8.","origin":"added"}],
     ["panacirc","보조","",{"raw":"써클 랫풀다운 20/20 main","origin":"added"}]]},
   {d:'2026-03-17',t:'t1c',memo:"→ 뉴트럴",ex:[
     ["extrot","메인","",{"raw":"익스터널 로테이션 + 어브덕션 15/15.","origin":"added"}],
     ["upright","보조","25",{"raw":"업라이트 로우 (후면) ~~20~~. 25kg.","origin":"added"}],
     ["dbsp","보조","",{"raw":"덤벨 숄더 프레스. ~~TOP 40.~~ ~~back 30.~~ TOP ~~55kg~~ 55/55lb back off 40/40lb"}],
     ["gym80sp","보조","",{"raw":"GYM 80 숄더프레스 20kg.","origin":"added"}],
     ["dblat","보조","",{"raw":"사레레. → 언더그립 10lb x 20reps x 3sets"}]]},
   {d:'2026-03-20',t:'t1a',ex:[
     ["pullover","메인","40",{"raw":"덤벨 풀오버. 40lb.","origin":"added"}],
     ["incdb","보조","",{"raw":"인클라인 덤벨 프레스. T. 55lb ~~M 35lb~~. M 45lb.","origin":"added"}],
     ["smithinc","보조","",{"raw":"인클라인 스미스. T. 20/20kg, M 10/10kg.","origin":"added"}],
     ["dips","보조","90",{"raw":"딥스 머신 ~~1[5?]0~~ 90 (가슴 말고 곱등이처럼 진행)","origin":"added"}]]},
   {d:'2026-03-24',t:'t1d',ex:[
     ["armpd","메인","",{"raw":"케이블 암풀다운.","origin":"added"}],
     ["deadlift","보조","",{"raw":"데드리프트.","origin":"added"}],
     ["bbrow","보조","",{"raw":"바벨로우","origin":"added"}],
     ["megat","보조","",{"raw":"메가맥스 티바로우","origin":"added"}],
     ["primerow","보조","",{"raw":"프라임 시티드로우"}],
     ["dyrow","보조","",{"raw":"DY row.","origin":"added"}]]},
   {d:'2026-03-27',t:'t1a',ex:[
     ["panacirc","메인","",{"raw":"써큘 랫풀다운(복근잡고 흉추[?] 열고 팔꿈치 외회전 → 하부승모 텐션 유지)","origin":"added"}],
     ["incdb","보조","",{"raw":"인클라인 덤벨 프레스. T.55lb M.~~45lb~~ M.35lb","origin":"added"}],
     ["smithinc","보조","",{"raw":"스미스 인클라인 프레스. T.20/20kg M.10/10kg. → 인클머신 T.40/40 , M.20/20","origin":"added"}],
     ["bench","보조","",{"raw":"플랫 벤치 프레스 (고반복, 아치 상관x, 팡 칠[?]고 찢기에 집중) 46kg x 20reps.","origin":"added"}],
     ["dips","보조","",{"raw":"딥스 머신. ~~90lbs~~. 150 main","origin":"added"}]]},
   {d:'2026-03-31',t:'t1b',memo:"날짜 줄: 3월 ~~30일~~ 31일",ex:[
     ["deadlift","메인","",{"raw":"데드리프트(등) 60kg x ~~12reps~~,","origin":"added"}],
     ["bbrow","보조","30x20",{"raw":"바벨로우 (굴곡 패턴). 30kg x 20reps."}],
     ["primerow","보조","40x12-18x3",{"raw":"프라임 시티드 로우.(승모근 패턴) 40kg(상) x 12-18reps x 3sets.","origin":"added"}],
     ["megat","보조","20",{"raw":"메가맥스 티바로우. 20kg"}],
     ["panacirc","보조","20x20",{"raw":"써큘 랫풀다운.(굴곡패턴) 20/20kg x 20reps.","origin":"added"}]]},
   {d:'2026-04-07',t:'t1a',ex:[
     ["pecdeck","메인","",{"raw":"펙덱 플라이 (신장 위주로 진행, 흉곽 확장 목적)","origin":"added"}],
     ["bbinc","보조","",{"raw":"인클라인 벤치 프레스 (T,40kg M,30kg)"}],
     ["incmach","보조","57.5",{"raw":"인클라인 머신. (고반복) 57.5kg.","origin":"added"}],
     ["panadec","보조","",{"raw":"[↗] 파나타 디클라인. (운동 마무리 + 털기) 10/10kg x 20reps"}],
     ["bench","보조","",{"raw":"벤치프레스 (복근 잡고 가슴[이?] 땅과 평행) 30kg x 20reps","origin":"added"}]]},
   {d:'2026-04-10',t:'t1d',memo:"~~원암 덤벨 로우~~. / (광배) 아 (승모) 자극 달[?]. / [1?]70kg x 12reps (허리 쪽). / └▷ 다음에는 앞으로 보내보기.",ex:[
     ["deadlift","메인","60x15",{"raw":"데드리프트 / 데드리프트 60kg x 15reps.","origin":"added"}],
     ["asspull","보조","",{"raw":"어시스트 풀업","origin":"added"}],
     ["highrow","보조","",{"raw":"파나타 하이로우."}],
     ["megat","보조","",{"raw":"메가맥스 티바로우.","origin":"added"}],
     ["bbrow","보조","40x20",{"raw":"바벨!로우 (굴곡) 40kg x 20reps,","origin":"added"}],
     ["primerow","보조","",{"raw":"프라임 시티드로우(상) 20kg, (중) 10kg"}]]},
   {d:'2026-04-14',t:'t1c',ex:[
     ["extrot","메인","",{"raw":"[↗] 익스터널 로테이션 변형.","origin":"added"}],
     ["revpec","보조","",{"raw":"리버스 펙덱 플라이"}],
     ["dbsp","보조","",{"raw":"[↗] 덤벨 숄더 프레스 (고반복)"}],
     ["seatohp","보조","",{"raw":"~~OHP 프레스~~ OHP → 시[티?]드 OHP 40kg 탑세트.","origin":"added"}],
     ["dblat","보조","",{"raw":"사레레 측[?]면 → 전체."}]]},
   {d:'2026-04-17',t:'t1b',memo:"└ 광배 암풀다운 12kg x 20reps, 한[?]셋[?] 끝[?].",ex:[
     ["bbrow","메인","",{"raw":"[↗] 바벨로우 (굴곡, 상복) ~~40kg x 20reps~~. 50kg x 20reps (치팅 포함 Top 느낌.)"}],
     ["primerow","보조","",{"raw":"프라임 시티드로우 (상)20kg (중) 10kg.","origin":"added"}],
     ["megat","보조","20",{"raw":"메가맥스 티바로우 20kg."}],
     ["highrow","보조","",{"raw":"하이로우 파나타 (원암)"}],
     ["asspull","보조","",{"raw":"가능하면 써큘 아 어시스트 풀업"}]]},
   {d:'2026-04-21',t:'t1c',memo:"벤[?]트 오[?]버. / 덤벨 (스탠딩, 고반복).",ex:[
     ["dblat","메인","",{"raw":"사레레 조[?]면 (측면). / 사레레 후측 연결"}],
     ["ohp","보조","",{"raw":"OHP.","origin":"added"}]]},
   {d:'2026-04-24',t:'t1b',ex:[
     ["armpd","메인","",{"raw":"암[?]풀다운."}],
     ["bbrow","보조","",{"raw":"바벨로우 (흉추[?], 상부) 50kg. / 바벨로우 (선천[?], 광배) 40kg"}],
     ["megat","보조","30",{"raw":"메가메스 티바로우 30 시도하기."}],
     ["highrow","보조","",{"raw":"파나타 하이로우"}],
     ["asspull","보조","",{"raw":"어시스트 풀업."}]]},
   {d:'2026-04-28',t:'t1b',memo:"> → 아쉬우면 드랍 고려.",ex:[
     ["armpd","메인","",{"raw":"암풀다운 (광배). 2sets."}],
     ["bbrow","보조","",{"raw":"바벨로우 (흉추[?], 상부 유일한 상부 메인 종목) T2 M2 / 바벨로우 (광배, 선천[?]) T2"}],
     ["megat","보조","",{"raw":"메가 메스 티바로우 (광배, 가동범위) 2sets."}],
     ["highrow","보조","",{"raw":"파나하[?] 하이로우 (원암[?], 광배) or 싸이벡스 클래식 (상부) → 선택하기."}],
     ["asspull","보조","",{"raw":"어시스트 풀업. (스트레칭 + 가동범위)"}]]},
   {d:'2026-05-08',t:'t1c',memo:"~~덤벨 숄더~~. / ~~머신 프레스~~ .or ~~OHP 머신~~. / ~~인클라인 너틸러스~~. / ~~벤[?]트오버[?]~~.",ex:[
     ["ohp","메인","",{"raw":"OHP 30/30kg x 13[?]reps.","origin":"added"}],
     ["dblat","보조","",{"raw":"사레레 (boxed)"}]]},
   {d:'2026-05-12',t:'t1d',memo:"분할 메모: 당기기 (승모). / → 가묵기[?]",ex:[
     ["revpec","메인","27",{"raw":"리버스 펙덱 플라이 (승모). 27","origin":"added"}],
     ["bbrow","보조","",{"raw":"바벨로우 펜들레이.","origin":"added"}],
     ["multirow","보조","",{"raw":"덤벨 상부. or 멀티로우.","origin":"added"}],
     ["cybrow","보조","",{"raw":"싸이벡스 클래식 시티드 로우.","origin":"added"}]]},
   {d:'2026-05-15',t:'t1a',memo:"분할 메모: 밀기 (윗가슴) / ※장기적으로 루틴 고정 예정 (테크닉. 연습). / ~~너틸 인클~~→.",ex:[
     ["incdb","메인","",{"raw":"인클 덤벨 Top 40lb. 전거근 등 잡는[?] 연습.","origin":"added"}],
     ["superinc","보조","",{"raw":"슈퍼 인클라인","origin":"added"}],
     ["ohp","보조","",{"raw":"~~[scribbled word]~~ OHP"}],
     ["bench","보조","",{"raw":"벤치프레스,","origin":"added"}],
     ["dips","보조","",{"raw":"딥스 머신.","origin":"added"}]]},
   {d:'2026-05-17',t:'t1d',memo:"날짜 줄: 5월 1[7?]일",ex:[
     ["rdl","메인","",{"raw":"루마니안 데드리프트 걸[?]기 60kg x 6reps (잘 [봄?]).","origin":"added"}],
     ["bbrow","보조","",{"raw":"바벨로우 40kg x","origin":"added"}],
     ["megat","보조","",{"raw":"메가맥스","origin":"added"}],
     ["multirow","보조","",{"raw":"멀티로우.","origin":"added"}],
     ["asspull","보조","",{"raw":"어시스트 풀업","origin":"added"}]]},
   {d:'2026-06-12',t:'t1x',memo:"파나타 or ~~[벤치?]~~ 15/15kg 시도하기,",ex:[
     ["bbinc","메인","50x8-13x2",{"raw":"인클 벤치. 50kg x 8-13reps x2sets."}],
     ["superinc","보조","67.5x20x3",{"raw":"수퍼 인클라인. 67.5kg x20reps x3sets.","origin":"added"}],
     ["dips","보조","",{"raw":"딥스 머신. 130 x 2[0?]reps.","origin":"added"}]]},
   {d:'2026-06-16',t:'t1d',memo:"분할 메모: 당기기 + 삼두 / ~~케이블 푸쉬다운.~~ / ~~오버헤드 덤벨 트익~~ .",ex:[
     ["megat","메인","",{"raw":"~~바벨 로우~~ 메가메스 티바로우 T.2set (50kg)","origin":"added"}],
     ["multirow","보조","",{"raw":"멀티로우. 20/20 kg. x          x 3sets.","origin":"added"}],
     ["asspull","보조","",{"raw":"어시스트 풀업. 12 x ··· x3sets (잡아 놓고 패는 느낌) 연습","origin":"added"}],
     ["lyingtri","보조","25",{"raw":"라잉 트라이셉 익스텐션, 25kg.","origin":"added"}]]},
   {d:'2026-06-19',t:'t1b',memo:"분할 메모: 하체 없고 등운동. ⊕상복근.",ex:[
     ["yraise","메인","",{"raw":"~~[?]~~. ~~케이블 암풀다운.~~ Y레이즈.","origin":"added"}],
     ["megat","보조","",{"raw":"~~메가메스 티바로우~~ ~~T.50kg~~ ~~back off.~~ 티바로우. 40kg (상[부?])"}],
     ["cybrow","보조","",{"raw":"~~멀티로우~~ 싸이벡스 클래식 시티드 로우.","origin":"added"}],
     ["multirow","보조","",{"raw":"멀티로우","origin":"added"}],
     ["asspull","보조","",{"raw":"어시스트 풀업."}]]},
   {d:'2026-06-23',t:'t1c',memo:"분할 메모: 어깨 + 삼두. / ↳ 30kg",ex:[
     ["ohp","메인","",{"raw":"OHP T.40kg, back 20kg (Total 4sets).","origin":"added"}],
     ["frontraise","보조","",{"raw":"시티드 체스트 서폿 사레레 ⊕ 프론트 레이즈. (10/10lb x 20reps, 5/5lb x 30reps, x3sets)","origin":"added"}],
     ["lyingtri","보조","23x15x2",{"raw":"라잉 트라이셉 익스텐션 23lb x 15reps x2sets","origin":"added"}],
     ["pushdown","보조","",{"raw":"케이블 푸쉬다운 ⊕ 덤벨 오버헤드 익스텐션. (↳ , 10/10lb x 15reps)","origin":"added"}]]},
   {d:'2026-06-30',t:'t1x',memo:"↱ 의자 빨강 3칸.",ex:[
     ["bbinc","메인","",{"raw":"인클라인 바벨 벤치프레스. 50kg x 14reps, 55kg x, 5reps. 55kg x 5reps.→"}],
     ["ohp","보조","",{"raw":"OHP 30kg x 10reps x 2sets, 30kg x 1[2?]reps","origin":"added"}],
     ["panadec","보조","",{"raw":"파나타 디클라인 20/20kg 무게 올리기 25/25kg","origin":"added"}]]},
   {d:'2026-07-02',t:'t1x',ex:[
     ["bbrow","메인","50x15x2",{"raw":"바벨로우 50kg x 15reps x 2sets."}],
     ["megat","보조","30x20x3",{"raw":"메가맥스. 30kg x 20reps x 3sets.","origin":"added"}],
     ["multirow","보조","20x25x2",{"raw":"멀티로우 20/20kg x 25reps x 2sets","origin":"added"}],
     ["asspull","보조","",{"raw":"어시스트 풀업. 6 x 12reps (보조), 14 x","origin":"added"}],
     ["bicurl","보조","15",{"raw":"이두컬. 15/15lb","origin":"added"}],
     ["hammer","보조","10",{"raw":"해머컬. 10/10lb.","origin":"added"}]]},
   {d:'2026-07-03',t:'t1e',ex:[
     ["extrot","메인","",{"raw":"케이블 익스터널 로테이션 22.5kg x 20reps (보조 0, 가동범위 무[조건?] 채우기.) x 4sets."}],
     ["cabrev","보조","15x20x5",{"raw":"케이블 리버스 플라이 15kg x 20reps x 5sets."}],
     ["dblat","보조","",{"raw":"덤벨 사레레"}],
     ["onearmlat","보조","",{"raw":"머신 원암 사레레"}],
     ["rearfly","보조","",{"raw":"체스트 서폿 덤벨 리어델트 플라이."}]]},
   {d:'2026-07-07',t:'t1a',ex:[
     ['bbinc','메인','55x13, 60x6, 60x5',{raw:'바벨 인클라인 (55kg x 13reps.), 60kg x 6reps, 5reps.'}],
     ['ohp','보조','35x13, 40x6, 40x8',{raw:'~~시티드 OHP~~. OHP. 35kg x 13reps, 40kg x 6reps, 8reps.'}],
     ['panadec','보조','25x실패지점x2',{raw:'파나타 디클라인 25/25kg x 실패지점 x 2sets (보조 o).'}],
     ['pushdown','마무리 털기','30x20',{raw:'케이블 푸쉬다운 30lb x 20reps.'}]]},
   {d:'2026-07-09',t:'t1d',memo:"분할 메모: 당기기 + 이두.",ex:[
     ["bbrow","메인","",{"raw":"바벨로우 50kg x 15reps → 50kg x 15reps x 2sets (각[도?], 균[형?]적 [잡?]기).","origin":"added"}],
     ["megat","보조","",{"raw":"메가메스 티바로우 30kg x 20reps → 30kg x 25reps x 2sets (보조 o)","origin":"added"}],
     ["multirow","보조","",{"raw":"↗멀티로우 20/20kg x 25reps → 30/30kg x 25reps","origin":"added"}],
     ["asspull","보조","",{"raw":"어시스트 풀업. 6x 12reps, 14x ·· → 6x. 12reps x 2sets.","origin":"added"}],
     ["bicurl","보조","15",{"raw":"이두컬 15/15lb","origin":"added"}],
     ["hammer","보조","10",{"raw":"해머컬 10/10lb.","origin":"added"}],
     ["cybrow","보조","",{"raw":"싸이벡스 클래식 시티드로우 8, 손 단[전?]으로 당기기 x 2sets.","origin":"added"}]]},
   {d:'2026-07-10',t:'t1e',ex:[
     ["extrot","메인","",{"raw":"케이블 익스터널 로테이션 22.5kg x 20reps (main), 30kg x 10- (TOP)"}],
     ["cabrev","보조","",{"raw":"케이블 리버스 플라이 15kg x 20reps x 4sets; 7.5[?]x 2- x 20reps."}],
     ["dblat","보조","",{"raw":"덤벨 사레레. 20/20lb x 20reps (반동 + 보조) x 3sets."}],
     ["onearmlat","보조","",{"raw":"케이블 원암 사레레 15kg x ~~[?]~~ ~~드랍 7.5kg x 15-20reps~~. / 20reps x 4sets"}],
     ["rearfly","보조","10x30",{"raw":"체스트 서폿 덤벨 리어델트 플라이 10/10lb x 30reps"}]]},
   {d:'2026-07-14',t:'t1a',memo:"~~케이블 푸쉬다운~~. / → 무게 < 퀄리티.",ex:[
     ["bbinc","메인","",{"raw":"바벨 인클라인 55kg x 16reps, (60kg x 1[0?]reps), T ~~[?]reps~~,"}],
     ["ohp","보조","",{"raw":"OHP. (40kg) x 9reps, 10reps, 5reps,"}],
     ["panadec","보조","",{"raw":"파나타 디클라인."}],
     ["dbinckg","보조","",{"raw":"아령 인클라인.","origin":"added"}]]},
   {d:'2026-07-16',t:'t1d',ex:[
     ["bbrow","메인","53x20, 60x12",{"raw":"바벨로우 53kg x 20reps ~~x[?]~~ 60kg x 12reps (퀄리티 good)","origin":"added"}],
     ["megat","보조","",{"raw":"메가메스 티바로우 30kg x 20reps x 2sets. ▷2sets.","origin":"added"}],
     ["cybrow","보조","",{"raw":"싸이벡스 클래식 시티드 로우 8X 20reps x ~~3sets~~ (정지를 포함 [더?] 당기기).","origin":"added"}],
     ["multirow","보조","30x20",{"raw":"멀티로우 30/30kg x 20reps x ~~2sets~~. (치는 느낌).","origin":"added"}]]},
   {d:'2026-07-21',t:'t1a',ex:[
     ["bbinc","메인","60x12",{"raw":"바벨 인클라인 60kg x 12reps ~~[?]~~,"}],
     ["ohp","보조","40x13",{"raw":"OHP 40kg x 13reps,"}],
     ["dbinckg","보조","",{"raw":"아령 인클라인 (각[도?]:3, 손잡이:2) ~~12.5kg~~ x. 15kg x 20reps x 3sets.","origin":"added"}],
     ["panadec","보조","",{"raw":"파나타 디클라인. 15/15kg x 10-15reps x [2?]sets"}],
     ["nitro","보조","50x6x2",{"raw":"니트로 체스트 50 x 6reps x 2sets.","origin":"added"}]]},
   {d:'2026-07-23',t:'t1d',memo:"↳ 가슴펴기, 퀄리티 우선으로 / ~~바벨로우~~ / ~~메가메스 티바로우~~ / ~~싸이벡스 클래식~~ / ~~멀티로우.~~",ex:[
     ["extrot","메인","30x10, 15x30x3",{"raw":"케이블 익스터널로테이션 30kg x 10reps, ~~2[2?].5kg x~~ 15kg x 30reps x 3sets","origin":"added"}],
     ["cabrev","보조","7x30x3",{"raw":"리버스 플라이 (듀얼케이블 큰3, 작2) 7lb x 30reps x 3sets.","origin":"added"}],
     ["dblat","보조","20x20x2",{"raw":"덤벨 사레레 20/20lb x 20reps x 2sets (반동 0, 가동범위 채)","origin":"added"}],
     ["onearmlat","보조","",{"raw":"케이블 원암 사레레","origin":"added"}]]},
   {d:'2026-07-24',t:'t1d',memo:"↳ 무[거?][중?] 다음에 70kg",ex:[
     ["bbrow","메인","",{"raw":"바벨로우 60kg x 13reps. 65kg x 7reps (자세 망가진 개수), 퀄리티 잡[으?]며 40kg","origin":"added"}],
     ["megat","보조","",{"raw":"메가메스 티바로우 30kg x 20reps x 2sets (보[조?] 가동범위) 10kg 드랍까지","origin":"added"}],
     ["cybrow","보조","8x20x2",{"raw":"싸이벡스 클래식. 8X 20reps x 2sets. (정지를 포함)","origin":"added"}],
     ["multirow","보조","30x20, 20x20",{"raw":"멀티로우. 30/30kg x 20reps, 20/20kg x 20reps (치는 느낌).","origin":"added"}]]},
   {d:'2026-07-28',t:'t1a',ex:[
     ["bbinc","메인","",{"raw":"바벨 인클라인 60kg x ~~[?]~~ 10reps, 10reps."}],
     ["ohp","보조","40x11",{"raw":"OHP 40kg x 11reps."}],
     ["dbinckg","보조","20x12-18x3",{"raw":"아령 인클라인. 20/20kg x 12-~~[20?]~~18reps x 3sets.","origin":"added"}],
     ["panadec","보조","",{"raw":"파나타 디클라인"}]]},
   {d:'2026-07-30',t:'t1d',memo:"분할 메모: 당기기. (상부, 근[비대?] / ① ~~파나타 서클 (2번, 비하인드). ~~20/20kg~~ 10/10kg으로 시작하기.~~ / ③ ~~싸이벡스 클래식 (상부) 8 x20~~ / [④ scribbled over] ~~멀티로우 30/30kg x20.~~ / ③ ~~서클 비하인드 10/10kg~~ 연습. / ④ ~~멀티로우. 30/30kg~~",ex:[
     ["bbrow","메인","",{"raw":"바벨로우 (날개뼈 넓히기.) 12reps x 40kg.","origin":"added"}],
     ["multirow","보조","",{"raw":"② ~~프라임 시티드 로우~~ or ~~메가메스 티바로우~~ ~~③ 프라임 시티드~~ 멀티로우. / ④ 멀티로우","origin":"added"}],
     ["megat","보조","40x12-20x3",{"raw":"② 메가메스 티바로우. 40kg x 12-20reps x 3sets","origin":"added"}],
     ["panacirc","보조","20x20x3",{"raw":"① 비하인드 서클 20/20kg x 20reps x 3sets. / ~~바벨로우~~ / 메가메스 / 서클 비하인드"}],
     ["cybrow","보조","",{"raw":"③ 싸이벡스 클래식 시티드 로우 8 x 20reps x 3sets ([잘?] [거?/가?][야?]지.)","origin":"added"}],
     ["shrug","보조","",{"raw":"⑤ 슈러그."}]]},
   {d:'2026-07-31',t:'t1x',memo:"~~리버스 플라이~~ / ~~덤벨 리어델트 플라이~~.",ex:[
     ["yraise","메인","7x20x3",{"raw":"~~케이블 익스터널~~ ① Y레이즈 (듀얼 케이블) (큰3, 작3) 7/7lb x 20reps x 3sets.","origin":"added"}],
     ["onearmlat","보조","",{"raw":"③ 머신 사레레 (7/7/7) 5kg x 3sets.","origin":"added"}],
     ["dblat","보조","",{"raw":"② 케이블 사레레 (원암, 21) 15kg x 15-20reps x 3sets, back off 7.5kg x","origin":"added"}],
     ["revpec","보조","27",{"raw":"④ 머신 리버스 펙덱 플라이 27kg","origin":"added"}],
     ["frontraise","보조","",{"raw":"⑤ 듀얼 케이블 프론트 레이즈 10lb. x 1[5?]reps","origin":"added"}]]},
   {d:'2026-08-04',t:'t1a',memo:"분할 메모: 밀기. (퀄리티)",ex:[
     ["bbinc","메인","",{"raw":"바벨 인클라인 50kg (main 시도)"}],
     ["seatbbsp","보조","",{"raw":"시티드 바벨 숄더프레스 35kg (main 시도)","origin":"added"}],
     ["dbinckg","보조","20x15-20x3",{"raw":"~~[덤?]~~ 아령 인클라인 20/20kg x 15-20reps x 3sets","origin":"added"}],
     ["panadec","보조","15x10-15x2",{"raw":"파나타 디클라인 15/15kg x 10-15reps x 2sets."}]]},
   {d:'2026-08-06',t:'t1d',memo:"분할 메모: 당기기 (상부) / 오른쪽 옆 목록(대안이나 계획 메모로 보임): (하부) 원암 하이로우 / 파나타 뉴트럴. / 원암 덤벨 로우 / (로우로우) / (슈러그.)",ex:[
     ["panacirc","메인","",{"raw":"비하인드 서클 (20/20kg) x 3sets."}],
     ["megat","보조","",{"raw":"메가메스 티바: (40kg) x 3sets (드랍까지)","origin":"added"}],
     ["cybrow","보조","",{"raw":"싸이벡스 (1[0?] x 20) ~~8 x 20~~ x ~~3sets~~ 2sets. (12 x 15 x 1)","origin":"added"}],
     ["multirow","보조","20x20x3",{"raw":"(멀티로우) 20/20kg x 20reps x 3sets","origin":"added"}],
     ["shrug","보조","40x20x2",{"raw":"(슈러그.) 40/40kg x 20reps x 2sets. / (슈러그.)"}]]},
   {d:'2026-08-11',t:'t1a',memo:"날짜 줄: ~~5월 19[?]일~~ 8월 1[1?]일 / ~~4. 니트로 체스트 8-12reps x 3sets~~→ 어시스트 딥스. 10 x 12reps x ~~3sets~~ 2sets.",ex:[
     ["incdb","메인","",{"raw":"1. 덤벨 인클라인 TOP2sets 45/45lb x 12reps, 8reps.","origin":"added"}],
     ["atominc","보조","",{"raw":"2. 아톰 인클라인 8-15reps x 3sets. 20/20kg (의자:3)","origin":"added"}],
     ["bench","보조","",{"raw":"3. 벤치 프레스 (고반복) 20-25reps [2?]0kg x 2sets. / 6. 스미스 머신 클로즈 그립 벤치 프레스. 15reps x 3sets.","origin":"added"}],
     ["pushdown","보조","",{"raw":"5. 케이블 푸쉬다운 15reps x 3sets"}]]},
   {d:'2026-08-13',t:'t1d',ex:[
     ["highrow","메인","",{"raw":"1. 메가메스 원암 하이로우 12reps x 3sets. TOP 40/40kg (척추 1자, 쇄골안[?] 열고)."}],
     ["panacirc","보조","",{"raw":"2. 파나타 서큘[?] (뉴트럴) 15reps x 3sets. (30/30kg circled) (가슴열고, 아래 복근 잡기). [arrow from circle → main 20/20, written at right of next row]"}],
     ["bbrow","보조","",{"raw":"3. ~~원암 덤벨 로우~~ 바벨로우 (언더그립) 15reps x 3sets","origin":"added"}],
     ["multirow","보조","30x20x3",{"raw":"4. 멀티로우 30/30kg. x 20reps x 3sets","origin":"added"}],
     ["shrug","보조","40x20x3",{"raw":"5. 슈러그 40/40kg. x 20reps x 3sets."}]]},
   {d:'2026-08-14',t:'t1c',memo:"~~6. 프론트 레이즈~~.",ex:[
     ["revpec","메인","",{"raw":"1. 리버스 펙덱 플라이 ~~20 x 3.~~ 27 x 20~~rep~~s x 3sets. [above: 12-15reps.]"}],
     ["panasp","보조","",{"raw":"2. 파나타 숄더프레스 12-15reps x 3 (25kg)."}],
     ["dbsp","보조","",{"raw":"3. 덤벨 숄더프레스. ~~12-15reps~~ x 3 ↳ (20/20lb) x 15-25reps x 3sets"}],
     ["dblat","보조","",{"raw":"4. 덤벨 사레레 (의자 한칸 높이고 목 말[?][채?]게) 12 x 3      20reps x 3"}],
     ["onearmlat","보조","",{"raw":"5. 머신 사레레 20reps x 3sets."}]]},
   {d:'2026-08-18',t:'t1a',memo:"분할 메모: 가슴 메인.",ex:[
     ["incdb","메인","",{"raw":"1. 덤벨 인클라인. 45/45lb → 50/50lb x 4sets (클게어[?] 접기 → 박자 + 날개[?]치[?] 않게)","origin":"added"}],
     ["atominc","보조","",{"raw":"2. 아톰 인클라인. (의자:3) 20/20kg. (스킹[?])","origin":"added"}],
     ["bench","보조","",{"raw":"3. 벤치 프레스. 30kg x 30 → 40kg x 20-25reps x 3sets.","origin":"added"}],
     ["dips","보조","",{"raw":"4. 어시스트 딥스. 10 x 1[5?]rep x 2sets,","origin":"added"}],
     ["pushup","보조","",{"raw":"5. 푸쉬업 ~~2sets~~. 1.set.","origin":"added"}]]},
   {d:'2026-08-20',t:'t1d',memo:"분할 메모: ~~하체[?]~~ 당기기",ex:[
     ["highrow","메인","40x20x2",{"raw":"1. 메가메스 하이로우 (원암) 40/40kg x 20reps x 2sets."}],
     ["panacirc","보조","",{"raw":"④ ~~2.~~ 파나타 서큘[?] (뉴트럴 그립) ~~30/30kg~~ 20/20kg x 20reps,"}],
     ["truet","보조","",{"raw":"② ~~3.~~ 트루 티바로우 40kg x 12reps + 드랍 20reps"}],
     ["primerow","보조","",{"raw":"③ ~~4.~~ 프라임 시티드 로우 (상부) (6:6) ~~40[?]~~ 3[4?]kg x 15-20reps x 4[?]sets."}]]},
   {d:'2026-08-21',t:'t1c',ex:[
     ["revpec","메인","",{"raw":"리버스 펙덱 플라이 27 ~~x 12-15reps x 3sets~~ 34 x 20reps, 41 x 12reps."}],
     ["panasp","보조","",{"raw":"파나타 숄더 프레스 25~~kg x 12-15reps x 3sets~~ 30/30kg x 12reps x 3sets."}],
     ["dbsp","보조","30x20x3",{"raw":"덤벨 숄더프레스 ~~25/25lb x 15-20reps x 3sets~~ 30/30lb x 20reps x 3sets."}],
     ["dblat","보조","",{"raw":"덤벨 사레레 20reps x 3sets"}],
     ["onearmlat","보조","",{"raw":"머신 사레레 20reps x 3sets."}]]},
   {d:'2026-08-25',t:'t1a',memo:"분할 메모: 밀기 (가슴)",ex:[
     ["pullover","메인","40x12-15x2",{"raw":"1. 덤벨 풀오버 (시도해보기) 40lb x 12-15reps x 2sets.","origin":"added"}],
     ["incdb","보조","",{"raw":"2. 덤벨 인클라인 50/50lb (보며 결정) → 이게 좋음: 니트로 체스트 70 x 2, 50 x 1","origin":"added"}],
     ["bench","보조","",{"raw":"3. 벤치 프레스. 40kg x 20-25reps x 3.","origin":"added"}],
     ["dips","보조","",{"raw":"4. 어시스트 딥스. 10 x 15reps x 3","origin":"added"}],
     ["smithpu","보조","",{"raw":"5. 스미스 푸쉬업.","origin":"added"}]]},
   {d:'2026-08-27',t:'t1d',memo:"~~3. 파나타 서큘[?] (뉴트럴)~~",ex:[
     ["highrow","메인","40x20x2",{"raw":"1. 메가메스 하이로우 40/40kg x 20reps x 2sets"}],
     ["truet","보조","",{"raw":"2. 트루 티바로우 (반복속도[?] 중시) 40kg x 12 → 드랍"}],
     ["primerow","보조","",{"raw":"3. 프라임 시티드 로우 (6.6, 상부) 30-40kg x 10-15reps x 3sets."}],
     ["panacirc","보조","",{"raw":"4. 파나타 서큘[?] 20/20kg x 20reps x 3sets."}],
     ["shrug","보조","40x20x2",{"raw":"5. 슈러그 40/40kg x 20reps x 2sets."}]]},
   {d:'2026-08-28',t:'t1c',ex:[
     ["revpec","메인","",{"raw":"1. 리버스 펙덱 플라이 34-41 x 20-12reps x 3sets. (마지막 드랍 41→20)"}],
     ["panasp","보조","30x12",{"raw":"2. 파나타 숄더프레스 30/30kg x 12reps."}],
     ["dbsp","보조","40",{"raw":"3. 덤벨 숄더프레스 (의자 위로 1칸) 40/40lb (시도하기)"}],
     ["dblat","보조","",{"raw":"4. 덤벨 사레레"}],
     ["onearmlat","보조","",{"raw":"5. 머신 사레레."}]]},
   {d:'2026-09-01',t:'t1a',memo:"~~파나타 인클라인~~ b·벤치[?]40kg x 2 / ~~스미스[?] 푸쉬업~~. 삼두[?] 2개.",ex:[
     ["atominc","메인","",{"raw":"아톰 인클라인 (강하게) x 3sets 40/40kg (TOP 2sets). 20/20kg (back off).","origin":"added"}],
     ["incdb","보조","",{"raw":"덤벨 인클라인 (back off) x 3sets. 45/45lb.","origin":"added"}],
     ["dips","보조","",{"raw":"딥스 10 x 15 x 3","origin":"added"}]]},
   {d:'2026-09-03',t:'t1d',ex:[
     ["bbrow","메인","",{"raw":"1. 바벨로우 60kg 까지 체[?]킹[?] 예정.","origin":"added"}],
     ["primerow","보조","40x10-15x3",{"raw":"2. 프라임 시티드로우 (상부) (6.6) 40kg x 10-15reps x 3sets."}],
     ["truet","보조","",{"raw":"3. 트루 티바로우. 40kg → 드랍까지."}],
     ["multirow","보조","20",{"raw":"4. 멀티로우 (로우로우) 20/20kg","origin":"added"}],
     ["shrug","보조","40x20x2",{"raw":"5. 슈러그 40/40kg x 20reps x 2sets."}]]},
   {d:'2026-09-11',t:'t1f',memo:"~~1. 바벨로우~~ / ~~2. 트루티바로우~~ / ~~3. 언더그립 랫풀다운~~ / ~~4. 맥그립 암풀다운~~ / ~~3. 바벨로우 40 x 15~~→ x3.",ex:[
     ["latpd","메인","",{"raw":"1. 언더그립 랫풀다운 ~~3[5?] x 20 x 3.~~ 40 x 15 x 3"}],
     ["truet","보조","",{"raw":"2. 트루 티바로우 ~~40 x 12 x 3.~~ 20 x 20-25 x 3"}],
     ["deadlift","보조","",{"raw":"4. 데드리프트 60 x 15 x 3"}],
     ["armpd","보조","30",{"raw":"3. 맥그립 암풀다운. 30","origin":"added"}]]},
   {d:'2026-09-17',t:'t1a',ex:[
     ["smithinc","메인","",{"raw":"1. 스미스 인클라인 (어깨, 가슴 같이) ~~4[?]~~ 20/20kg x 8-15 x 3","origin":"added"}],
     ["incdb","보조","",{"raw":"2. 덤벨 인클라인 35/35lb x 15reps x 3.","origin":"added"}],
     ["superinc","보조","",{"raw":"3. ~~덤 스트라이브 숄더 프레스~~ 슈퍼인클라인 + 푸쉬업 (52.5 +10) x 2sets ([?][4?]7)","origin":"added"}],
     ["strive","보조","",{"raw":"4. 스트라이브 숄더 프레스 7 + ~~[2?]~~3 x 12 x 3","origin":"added"}],
     ["dips","보조","",{"raw":"5. 딥스 → Triceps press 13⁶ x 20 x 3.","origin":"added"}]]},
   {d:'2026-09-22',t:'t1f',memo:"~~4. 맥그립 암풀다운.~~",ex:[
     ["latpd","메인","30",{"raw":"1. 언더그립 랫풀다운 30"}],
     ["truet","보조","",{"raw":"2. 트루 티바"}],
     ["deadlift","보조","",{"raw":"⑤ 데드리프트 60 x 2 , 40 x 1"}],
     ["shrug","보조","",{"raw":"5. 슈러그 (in oval, circled ④)","origin":"added"}],
     ["karrow","보조","",{"raw":"or Kar row (in oval, circled ③)","origin":"added"}]]},
   {d:'2026-09-29',t:'t1g',memo:"날짜 줄: [9?]월 29일",ex:[
     ["legcurl","메인","",{"raw":"1. 레그컬 50 x 15 x 4."}],
     ["legext","보조","",{"raw":"2. 레그 익스텐션 70 x 20 x 3 (골반 박아 놓고 차기)."}],
     ["legpress","보조","",{"raw":"3. 레그 프레스 40/40kg x 12 x 2"}],
     ["bulls","보조","",{"raw":"4. 불스."}],
     ["lunge","보조","",{"raw":"5. 워킹 런지","origin":"added"}]]},
   {d:'2026-10-01',t:'t1c',ex:[
     ["rearfly","메인","20x25x3",{"raw":"1. ~~익스터널 + 어브덕션~~ 덤벨 리어 델트 플라이. 20/20lb x 25reps x 3sets.","origin":"added"}],
     ["ohp","보조","",{"raw":"2. OHP P[e?] 40kg x 8-12reps x 3sets.","origin":"added"}],
     ["dbsp","보조","",{"raw":"3. 덤벨 숄더 프레스"}],
     ["dblat","보조","",{"raw":"4. 사레레"}],
     ["onearmlat","보조","",{"raw":"5. 머신 사레레."}]]},
   {d:'2026-10-02',t:'t1f',ex:[
     ["latpd","메인","",{"raw":"1. 랫풀다운 (언더그립) 30-40 x 3 / 2. 랫풀다운 (오버그립) 30-40 x 3"}],
     ["truet","보조","",{"raw":"3. 트[로?]티바로우 20-30 x 3"}],
     ["deadlift","보조","",{"raw":"4. 데드리프트 60 x 3 x (12reps)"}],
     ["lowrow","보조","",{"raw":"5. Row row 20/20 - 30/30 x 3."}]]},
   {d:'2026-10-05',t:'t1a',memo:"7. 삼[?]두 케이블 + 오버헤드 익스텐션.",ex:[
     ["crunch","메인","",{"raw":"1. 상부 크런치 25 x 3 (골반, 중[?]간 에 거[?]8[?]). 41 x 15reps x 3sets.","origin":"added"}],
     ["cabrev","보조","",{"raw":"2. 리버스 플라이 (~~덤벨~~) ~~20/20lb - 30/30lb x 25reps -      reps x 3set~~s.","origin":"added"}],
     ["smithinc","보조","",{"raw":"3. 스미스 인클라인(고각)(사[진?]) 20/20kg x 12reps x 3sets.","origin":"added"}],
     ["incdb","보조","",{"raw":"4. 덤벨 인클라인(고각) 35/35lb x 3.","origin":"added"}],
     ["nitro","보조","",{"raw":"5. 니트로 체스트 50 x 20reps x 3","origin":"added"}],
     ["dips","보조","150",{"raw":"6. 어시스트 딥스 150","origin":"added"}]]},
   {d:'2026-10-06',t:'t1g',memo:"대각선 오른쪽 둘째 목록: 1. 이너 / 아웃타이 / 2. 스미스 ~~런지~~ 불스. / 3. 프라임 레그 프레스. / 4. 레그컬 / 5. 익스텐션.",ex:[
     ["legcurl","메인","",{"raw":"1. 레그컬"}],
     ["legext","보조","",{"raw":"2. 레그 익스텐션"}],
     ["legpress","보조","",{"raw":"3. 레그 프레스."}],
     ["stiffdl","보조","",{"raw":"4. ~~불스~~. 스티프 데드리프트."}],
     ["bulls","보조","",{"raw":"5. ~~워킹런지~~. 불스."}]]}]},

 {id:'m2',code:'이00_2',goals:[{text:'3~4개월 안으로 10kg 감량을 목표 (괄호 메모 일부 판독 불가)',start:''}],
  notes:[{kind:'diet',text:'하루 2끼 식단: ① 현미밥 130g, 닭 100g — 436kcal ② 현미밥 130g, 닭 100g — 485kcal ③ 일반식 — 1000kcal 관련 메모 (일부 판독 불가)'}],cautions:[],
  templates:[{id:'t2a',name:'앞다리',items:[['inout','보조'],['calf','마무리 털기'],['hacksq','메인'],['legpress','보조'],['legext','마무리 털기']]},
   {id:'t2b',name:'뒷다리',items:[['scurl','보조'],['legpress','보조'],['bulls','보조'],['monster','보조']]},
   {id:'t2c',name:'상체',items:[['megat','보조'],['asspull','보조'],['incdb','메인'],['dbsp','보조'],['dblat','마무리 털기']]},
   {id:'t2d',name:'하체',items:[['inout','보조'],['lycurl','보조'],['hacksq','메인'],['dbsdl','보조'],['lunge','보조']]},
   {id:'t2e',name:'전신',items:[['scurl','보조'],['legext','보조'],['legpress','보조'],['trabd','보조'],['panadec','메인'],['machlat','마무리 털기']]}],
  exMemos:{hacksq:{setting:'발판:2, 무릎 정렬',memo:'',date:'2026-08-10'},cybrow:{setting:'3,3',memo:'',date:'2026-09-22'}},
  sessions:[
   {d:'2026-07-07',t:'t2b',planOnly:true,memo:'루틴 예정 1차, 뒷다리 / 4. ~~[판독 불가]~~ → 맨몸 × 20reps (괄호 속 판독 불가)',ex:[
     ['lycurl','보조','50x10-15',{raw:'1. 라잉 레그컬 — 50 × 10~15reps'}],
     ['dbsdl','보조','35',{raw:'2. 덤벨 스티프 데드리프트 — 35/35lb (괄호 속 세부 메모 일부 판독 불가)'}],
     ['hacksq','메인','20x30',{raw:'3. 핵스쿼트 — 20kg × 30reps (운동명 뒤 괄호 메모 판독 불가)'}],
     ['hipabd','보조','10x30',{raw:'5. 힙 어브덕션 — 10/10kg × 30reps'}]]},
   {d:'2026-07-08',t:'t2c',memo:'* 자세 관련 필기 — 문장 일부 판독 불가',ex:[
     ['megat','보조','',{raw:'1. 메가머신 티바로우 — (5kg 조절...), 무게를 증가하며 진행 일부 판독'}],
     ['asspull','보조','20',{raw:'2. 어시스트 풀업 — 6× 뒤 판독 불가, 어시스트 풀업 20 부분 확인'}],
     ['incdb','메인','',{raw:'3. 인클라인 덤벨 프레스 — 중량 수정 부분 판독 불가'}],
     ['dbsp','보조','5',{raw:'4. 숄더 프레스 + 사레레 — 5lb, 1kg으로 읽힘'}],
     ['dblat','마무리 털기','1',{raw:'4. 숄더 프레스 + 사레레 — 5lb, 1kg으로 읽힘'}]]},
   {d:'2026-07-13',t:'t2d',memo:'5. ~~[운동명 판독 불가]~~',ex:[
     ['lycurl','보조','40x20',{raw:'1. 라잉 레그컬 — 취소·수정 수치가 함께 적힘, 40 × 20reps 확인'}],
     ['dbsdl','보조','35x20, 40x20',{raw:'2. 덤벨 스티프 — 35/35lb × 20reps, 오른쪽 40/40lb × 20reps'}],
     ['hacksq','메인','25',{raw:'3. 핵스쿼트 — 25kg × [판독 불가]reps × [판독 불가]sets'}],
     ['lunge','보조','15xx3',{raw:'4. 런지 — 15lb × [판독 불가]reps × 3sets'}]]},
   {d:'2026-07-16',t:'t2c',memo:'5·6번 오른쪽 화살표: 25reps씩 진행',ex:[
     ['megat','보조','10x8-12x3',{raw:'1. 메가머신 티바로우 — 10kg × 8~12reps × 3sets (앞쪽 취소선 있음)'}],
     ['cybrow','보조','6x20',{origin:'added',raw:'2. 싸이벡스 [운동명 뒷부분 판독 불가] — 6 (패드:3, 시트:3) × 20reps',setting:'패드:3, 시트:3'}],
     ['asspull','보조','20',{raw:'3. 어시스트 풀업 — 20, (마지막 진행)',note:'마지막 진행'}],
     ['incdb','메인','25x8',{raw:'4. 인클라인 덤벨 — ~~[앞 수치]~~ 25/25lb × 8reps'}],
     ['dbsp','보조','5',{raw:'5. 숄더 프레스 — 5lb'}],
     ['dblat','마무리 털기','1',{raw:'6. 사레레 — 1kg'}]]},
   {d:'2026-07-17',t:'t2a',ex:[
     ['inout','보조','22.5x20',{raw:'1. 이너/아웃 타이 / 카프레이즈 — (22.5 / 45 / 0) / × 20reps (세트 부분 덧씀)'}],
     ['calf','마무리 털기','',{}],
     ['hacksq','메인','10x20',{raw:'2. 핵스쿼트 — (발판:4) … 10kg × 20 부분 확인',setting:'발판:4'}],
     ['legpress','보조','',{status:'swapped',to:'goblet',raw:'3. ~~[운동명]~~ 고블릿 스쿼트'}],
     ['goblet','보조','15x30x2',{origin:'swap',raw:'고블릿 스쿼트 — 15lb × 30reps × 2sets'}],
     ['legext','마무리 털기','',{raw:'4. 레그 익스텐션'}]]},
   {d:'2026-07-30',t:'t2b',memo:'아래 별도 메모 40/40, 나머지 판독 불가',ex:[
     ['scurl','보조','35x20x3',{raw:'1. 시티드 레그컬 — × 3sets, (35kg × 20reps)'}],
     ['legpress','보조','40x20x3',{raw:'2. 프라임 레그 프레스 — × 3sets, 40/40kg × 20reps'}],
     ['bulls','보조','15xx2',{raw:'3. 불스 — 15lb × 2sets'}],
     ['monster','보조','',{raw:'4. 몬스터 글루트 — ~~[수치]~~ 2sets'}]]},
   {d:'2026-08-03',t:'t2a',ex:[
     ['inout','보조','',{raw:'1. 이너/아웃 타이'}],
     ['hacksq','메인','20x15',{raw:'2. 핵스쿼트 — (발판:2, 무릎 정렬) / 20kg × 15reps × [판독 불가]sets',setting:'발판:2, 무릎 정렬'}],
     ['legpress','보조','',{status:'swapped',to:'goblet'}],
     ['goblet','보조','15x30x2',{origin:'swap',raw:'3. 고블릿 스쿼트 — 15lb × 30reps × 2sets'}],
     ['legext','마무리 털기','30',{raw:'4. 레그 익스텐션 30'}]]},
   {d:'2026-08-04',t:'t2c',ex:[
     ['megat','보조','10x8-10x3',{raw:'1. 메가머신 티바로우 — 10kg × 8~10reps × 3sets → 15reps'}],
     ['cybrow','보조','6x20x3',{origin:'added',raw:'2. 싸이벡스 [판독 불가] 시티드로우 — (3,3) 6 × 20reps × 3sets',setting:'3,3'}],
     ['latpd','보조','10x20x3',{origin:'added',raw:'3. [판독 불가] 뉴트럴 그립 — 10/10kg × 20reps × 3sets'}],
     ['incdb','메인','15',{raw:'4. 인클라인 덤벨 — 취소한 수치, 15lb 및 자세 메모'}],
     ['dbsp','보조','5',{raw:'5. 숄더 프레스 — 5lb'}],
     ['dblat','마무리 털기','1x20x2',{raw:'6. 사레레 — 1kg, 화살표로 20reps × 2sets'}]]},
   {d:'2026-08-06',t:'t2b',ex:[
     ['scurl','보조','35x20x3',{raw:'1. 시티드 레그컬 — 35kg × 20reps × 3sets'}],
     ['legpress','보조','40x20x3',{raw:'2. 프라임 레그 프레스 — 40/40kg, 20reps × 3sets (중간 괄호 메모 일부 판독 불가)'}],
     ['bulls','보조','15x15, 5x20x2',{raw:'3. 불스 — 15lb × 15reps, 5lb × 20reps × 2sets (같은 줄에 함께 쓰임)'}],
     ['monster','보조','10x20-30x3',{raw:'4. 몬스터 글루트 — 10/10kg / 20~30reps × 3sets (중간 괄호 판독 불가)'}]]},
   {d:'2026-08-10',t:'t2a',ex:[
     ['inout','보조','22.5',{raw:'1. 이너/아웃 타이 — 취소선 뒤 22.5kg × [판독 불가]reps × [판독 불가]sets'}],
     ['hacksq','메인','20x15x3',{raw:'2. 핵스쿼트 — (발판:2, 무릎 정렬) / 20kg × 15reps × 3sets',setting:'발판:2, 무릎 정렬'}],
     ['legpress','보조','',{status:'swapped',to:'goblet'}],
     ['goblet','보조','',{origin:'swap',raw:'3. 고블릿 스쿼트 — (상체 세우고 다운할 때 ... ), 문장 일부 판독 불가'}],
     ['legext','마무리 털기','50x20x2',{raw:'4. 레그 익스텐션 — 30, 50 × 20reps × 2sets 등 수정 수치가 함께 쓰임'}],
     ['calf','마무리 털기','x30x2',{raw:'5. 카프레이즈 — 30reps × 2sets'}]]},
   {d:'2026-08-11',t:'t2c',memo:'아래 별표 및 화살표 메모 [판독 불가]',ex:[
     ['megat','보조','10x15',{raw:'1. 메가머신 티바로우 — 10kg × 15reps / 취소된 수치 / 오른쪽 12reps × 3sets'}],
     ['cybrow','보조','6x20x3',{origin:'added',raw:'2. 싸이벡스 [판독 불가] 시티드로우 — (3,3) 6 × 20 × 3sets (괄호 메모 있음)',setting:'3,3'}],
     ['latpd','보조','10x20x3',{origin:'added',raw:'3. [판독 불가] 랫풀다운 (뉴트럴 그립) — 10/10kg × 20reps × 3sets'}],
     ['incdb','메인','15',{raw:'4. 인클라인 덤벨 프레스 — 15/15lb 및 괄호 메모'}],
     ['dbsp','보조','5',{raw:'5. 숄더 프레스 (스탠딩) — 5lb'}],
     ['dblat','마무리 털기','1x20x2',{raw:'6. 사레레 — 1kg, 20reps × 2sets'}]]},
   {d:'2026-08-14',t:'t2c',memo:'동그라미 순서: ① 아놀드 프레스 ② 덤벨 업라이트로우 ③ 펜더 숄더프레스 ④ 덤벨 숄더프레스 ⑤ [판독 불가]',ex:[
     ['pendersp','보조','',{origin:'added',raw:'1. 펜더 [판독 불가] 숄더프레스 — 동그라미 ③'}],
     ['dbsp','보조','',{raw:'2. 덤벨 숄더프레스 — 동그라미 ④'}],
     ['arnold','보조','',{origin:'added',raw:'4. 아놀드 프레스 — 동그라미 ①'}],
     ['dbupright','보조','',{origin:'added',raw:'5. 덤벨 업라이트로우 — 동그라미 ②'}]]},
   {d:'2026-08-19',t:'t2c',memo:'허리 먼저 정렬로 보이는 메모 (문장 전체 판독 불가)',ex:[
     ['panadec','메인','10xx3',{origin:'added',raw:'1. 파나타 디클라인 — 10/10kg × [수정된 횟수, 판독 불가] × 3sets (컨디션 good)',note:'컨디션 good'}],
     ['panasp','보조','0x8-12x3',{origin:'added',raw:'2. 파나타 숄더프레스 — 0/0kg × 8~12reps × 3sets'}],
     ['megat','보조','10x12x3',{raw:'3. 메가머신 티바로우 — 10 × 12reps × 3sets, 옆에 20reps 관련 추가 메모'}],
     ['cybrow','보조','6x20',{origin:'added',raw:'4. 싸이벡스 [판독 불가] 시티드로우 — (3,3) 6 × 20',setting:'3,3'}]]},
   {d:'2026-08-26',t:'t2d',ex:[
     ['curlunk','보조','45x20x2',{p:'35x20x2',origin:'added',raw:'1. [판독 불가] 레그컬 — ~~35kg~~ 45kg × 20reps × 2sets (컨디션 good)',note:'컨디션 good'}],
     ['hacksq','메인','x20x2',{raw:'2. 핵스쿼트 — 취소선 뒤 [중량 판독 불가] × 20reps × 2sets'}],
     ['legpress','보조','25',{origin:'added',raw:'3. 레그 프레스 — 취소한 수치 뒤 25/25 및 횟수·세트 수정 표기 (일부 판독 불가)'}],
     ['legext','마무리 털기','30',{origin:'added',raw:'4. 레그 익스텐션 — 30, (빈 [판독 불가])'}]]},
   {d:'2026-08-28',t:'t2c',ex:[
     ['panadec','메인','10x20x3',{origin:'added',raw:'1. 파나타 디클라인 — 10/10kg × 20reps × 3sets'}],
     ['panasp','보조','0xx3',{origin:'added',raw:'2. 파나타 숄더프레스 — 0/0kg × [판독 불가] × 3sets'}],
     ['megat','보조','10x20, 15x15',{raw:'3. 메가머신 티바로우 — 10 × 20reps, 이어 15kg × 15reps 표기'}],
     ['cybrow','보조','8x15',{origin:'added',raw:'4. 싸이벡스 [판독 불가] 시티드로우 — (3,3), 취소한 수치 뒤 8 × 15와 기타 메모',setting:'3,3'}]]},
   {d:'2026-09-01',t:'t2a',ex:[
     ['inout','보조','22.5x20-25, 30x8-12',{raw:'1. 이너타이 — 22.5 × 20~25, 30 × 8~12'}],
     ['hacksq','메인','40x15x2',{raw:'2. 핵스쿼트 — (발판:2, [판독 불가]:0) / 40kg × 15reps × 2sets (앞 수치 취소)',setting:'발판:2'}],
     ['legpress','보조','',{status:'swapped',to:'goblet'}],
     ['goblet','보조','25x25x3',{origin:'swap',raw:'3. 고블릿 스쿼트 — 25lb × 25 × 3'}],
     ['legext','마무리 털기','50x20x2',{raw:'4. 레그 익스텐션 — 50 × 20 × 2sets'}]]},
   {d:'2026-09-02',t:'t2b',memo:'아래 메모 [판독 불가]',ex:[
     ['scurl','보조','45x18x3',{p:'35x18x3',raw:'1. 시티드 레그컬 — 35kg → 45kg × 18reps × 3sets'}],
     ['legpress','보조','40, 60x20x2',{raw:'2. 프라임 레그 프레스 — 40/40kg, 60/60kg × 20 × 2 (중간 메모 있음)'}],
     ['bulls','보조','25x15x3',{raw:'3. 불스 — 25lb × 15reps × 3sets'}],
     ['monster','보조','10xx2',{raw:'4. 몬스터 글루트 — 10/10kg × [판독 불가] × 2sets'}]]},
   {d:'2026-09-03',t:'t2c',ex:[
     ['panadec','메인','10x20x3',{origin:'added',raw:'1. 파나타 디클라인 — 10/10kg × 20reps × 3sets'}],
     ['panasp','보조','0',{origin:'added',raw:'2. 파나타 숄더프레스 — 0/0kg'}],
     ['smithpu','보조','x5',{origin:'added',raw:'3. 스미스 푸쉬업 — 5회'}],
     ['megat','보조','10x15-20x3',{raw:'4. 메가머신 티바로우 — 10kg × 15~20reps × 3sets'}],
     ['cybrow','보조','6x20x3',{origin:'added',raw:'5. 싸이벡스 [판독 불가] 시티드로우 — (3,3) 6 × 20 × 3',setting:'3,3'}]]},
   {d:'2026-09-16',t:'t2c',memo:'3. ~~[운동명 판독 불가]~~ / 별표 메모 [판독 불가]',ex:[
     ['panadec','메인','10xx3',{origin:'added',raw:'1. 파나타 디클라인 — 10/10kg × [판독 불가]reps × 3sets (오른쪽 짧은 메모)'}],
     ['panasp','보조','0x15-20x3',{origin:'added',raw:'2. 파나타 숄더프레스 — 0/0kg × 15~20reps × 3'}],
     ['megat','보조','5x15-20x3',{raw:'4. 메가머신 티바로우 — 5kg × 15~20 × 3'}],
     ['cybrow','보조','6x20x3',{origin:'added',raw:'5. 싸이벡스 [판독 불가] 시티드로우 — (3,3) 6 × 20 × 3',setting:'3,3'}]]},
   {d:'2026-09-21',t:'t2b',memo:'5. ~~[운동명 판독 불가]~~',ex:[
     ['inner','보조','',{origin:'added',raw:'1. 이너타이 — 오른쪽 자세 메모 [판독 불가]'}],
     ['hacksq','메인','40x20x3',{origin:'added',raw:'2. 핵스쿼트 — 40/40kg × 20 × 3 및 3초 등 메모',note:'3초'}],
     ['bulls','보조','30x10-12x3',{raw:'3. ~~고블릿~~ / 불스 — 30lb × 10~12reps × 3sets (괄호 메모 판독 불가)'}],
     ['legext','마무리 털기','20x20x2',{origin:'added',raw:'4. 레그 익스텐션 — 20kg × 20 × 2'}]]},
   {d:'2026-09-22',t:'t2c',memo:'화살표 메모: 가슴 [판독 불가] 진행',ex:[
     ['panadec','메인','7.5x20x3',{origin:'added',raw:'1. 파나타 디클라인 — 7.5/7.5kg × 20 × 3'}],
     ['panasp','보조','',{origin:'added',raw:'2. 파나타 숄더프레스'}],
     ['trowunk','보조','x20x3',{origin:'added',raw:'3. [판독 불가] 티바로우 — [판독 불가]kg × 20 × 3'}],
     ['cybrow','보조','6x20x3',{origin:'added',raw:'4. 싸이벡스 시티드로우 — (3,3) 6 × 20 × 3',setting:'3,3'}],
     ['machlat','마무리 털기','10x20x3',{origin:'added',raw:'5. 머신 사레레 — ~~20 × [판독 불가] × 3~~ 10 × 20 × 3'}]]},
   {d:'2026-09-28',t:'t2e',memo:'* 트렁크 티바로우 종료 → 싸이벡스 ... 등 운동에 집중 (중간 일부 판독 불가)',ex:[
     ['scurl','보조','45x15x3',{raw:'1. 시티드 레그컬 — 45kg × 15reps × 3sets'}],
     ['legext','보조','50x20, 70x20x2',{raw:'2. 레그 익스텐션 — 50 × 20 (easy), 70 × 20 × 2 (good)',note:'50 easy, 70 good'}],
     ['legpress','보조','',{raw:'3. 레그 프레스 (apex) — 30lb, 12, 25 × 2 등이 덧써짐 (세부 판독 불가)'}],
     ['trabd','보조','10x20',{raw:'4. 트렁크 어브덕션 — 10kg × 20reps'}],
     ['panadec','메인','5x20x3',{raw:'5. 파나타 디클라인 — 5/5kg × 20 × 3 (앞 숫자 취소선 있음)'}],
     ['machlat','마무리 털기','10x20x3',{raw:'6. 머신 사레레 (가슴 기대고) — 10 × 20 × 3',note:'가슴 기대고'}]]}
]},

 {id:'m4',code:'김00',goals:[{text:'일상과 함께할 수 있는 운동을 원하신다 (문장 일부 불확실)',start:''}],
  notes:[{kind:'general',text:'등근육이 약.'},{kind:'general',text:'주 2일 → 상하 / 주 3일 → 앞, 뒤, 상체 (10/13 메모, 끝 낱말 판독 불확실)'}],cautions:[],
  templates:[{id:'t4a',name:'하체',items:[['scurl','보조'],['hackpress','메인'],['legpress','보조'],['legext','마무리 털기']]},
   {id:'t4b',name:'상체',items:[['cybrow','메인'],['seoullat','보조'],['panadec','보조'],['panasp','보조']]}],
  exMemos:{cybrow:{setting:'4,4',memo:'',date:'2026-09-16'}},
  sessions:[
   {d:'2026-07-20',t:'t4b',memo:"* 손 꽉 쥐었을 때 기준으로 손목 각도 [판독 불가] / * 전완근이 앞에서 바로 [판독 불가] / * 어깨에 '푹' [판독 불가], '스윽'으로 변경하기. (일부 불확실) / * 프레스류는 발꿈치 세팅하며 전신을 잘 세팅하기. (일부 불확실)",ex:[
     ['incdb','메인','15',{raw:'1. 덤벨 인클라인 프레스 15/15lb × [취소된/비어 있는 부분]'}],
     ['dbstsp','보조','5',{raw:'2. 덤벨 스탠딩 숄더프레스 5/5lb. 뒤 괄호 메모 [일부 판독 불가]'}]]},
   {d:'2026-07-23',t:'t4a',memo:'* [판독 불가] 한 번 계단. / [판독 불가] 시도.',ex:[
     ['dbsdl','보조','',{raw:'1. 덤벨 스티프 데드리프트'}],
     ['bulls','보조','',{raw:'2. 불스.'}],
     ['backext','보조','',{raw:'2. 백익스텐션 (가슴 펴기 X, 엉덩이만 쓰게, 세팅 정확히.) [괄호 글씨 일부 불확실]',note:'가슴 펴기 X, 엉덩이만 쓰게, 세팅 정확히.'}]]},
   {d:'2026-08-11',t:'t4a',memo:'하체(뒷다리)',ex:[
     ['outer','보조','',{raw:'1. 아웃타이'}],['scurl','보조','',{raw:'2. 시티드 레그컬'}],['legpress','보조','',{raw:'3. 프라임 레그 프레스'}],['bulls','보조','',{raw:'4. 불스'}],['monster','보조','',{raw:'5. 몬스터 글루트'}]]},
   {d:'2026-08-12',t:'t4b',memo:'* 세팅 유지, 실패지점에서 [취소된 글씨] 않기. [중간 판독 불가]',ex:[
     ['megat','보조','',{raw:'1. 메가머신 티바로우'}],
     ['seoullat','보조','2.5',{p:'7.5',raw:'2. 서울 랫풀다운 (뉴트럴 그립) 7.5/7.5kg → 2.5/2.5kg [운동명 \'서울\' 및 왼쪽 수치 일부 불확실]'}],
     ['panadec','보조','5',{raw:'3. ~~[기존 운동명 판독 불가]~~ 파나타 수퍼 디클라인 프레스 5/5kg'}],
     ['panasp','보조','0',{raw:'4. 파나타 숄더프레스 0/0kg'}]]},
   {d:'2026-08-19',t:'t4a',ex:[
     ['scurl','보조','30',{raw:'1. 시티드 레그컬 (~~[횟수/세트 표기]~~) 30'}],
     ['hackpress','메인','50xx3',{raw:'2. 핵프레스 (3sets) 50/50kg.'}],
     ['legpress','보조','30xx3',{raw:'3. 레그프레스 (3sets) 30/30kg.'}],
     ['legext','마무리 털기','50x12',{p:'x20x3',raw:'4. 레그 익스텐션 (~~3sets~~) (~~20reps~~) 50 × 12'}]]},
   {d:'2026-08-21',t:'t4b',memo:'화살표 뒤 [운동/세트 관련 메모 판독 불가]',ex:[
     ['panadec','보조','2.5xx3',{raw:'1. 파나타 디클라인 2.5/2.5kg × 3sets.'}],
     ['panasp','보조','0xx3',{raw:'2. 파나타 숄더프레스 0/0kg × 3sets'}],
     ['seoullat','보조','7.5xx3',{raw:'3. 서울 랫풀다운 7.5/7.5kg × 3sets. [첫 단어 판독 불확실]'}],
     ['hackpress','메인','20',{origin:'added',raw:'4. 핵프레스 20/20kg'}],
     ['legpress','보조','20',{origin:'added',raw:'5. 레그프레스 20/20kg'}]]},
   {d:'2026-08-25',t:'t4a',memo:'제목 오른쪽 → 20reps. (괄호 안 수업 메모 판독 불가)',ex:[
     ['scurl','보조','30xx3',{raw:'1. 시티드 레그컬 30 × 3sets'}],
     ['hackpress','메인','',{raw:'2. 핵프레스 ~~50/50kg~~ × 3sets / 오른쪽에 ~~40/40kg~~ 수정 흔적 (최종값 확인 필요)'}],
     ['panadec','보조','5xx2',{p:'2.5xx2',origin:'added',raw:'3. 파나타 디클라인 ~~2.5/2.5kg~~ × 2 → 5/5kg [수정 방향 확인 필요]'}],
     ['panasp','보조','0xx2',{origin:'added',raw:'4. 파나타 숄더프레스 0/0kg × 2'}],
     ['panasibl','보조','7.5xx2',{origin:'added',raw:'5. 파나타 시블(뉴트럴) 7.5/7.5kg × 2 [운동명 중 \'시블\' 판독 불확실]'}]]},
   {d:'2026-08-31',t:'t4a',memo:'(괄호 안 메모 일부 판독 불가)',ex:[
     ['scurl','보조','30',{raw:'1. 시티드 레그컬 30'}],
     ['hackpress','메인','40',{raw:'2. 핵프레스 40/40kg'}],
     ['panadec','보조','5',{origin:'added',raw:'3. 파나타 디클라인 5/5kg'}],
     ['panasp','보조','0',{origin:'added',raw:'4. 파나타 숄더프레스 0/0kg'}],
     ['panasibl','보조','10',{origin:'added',raw:'5. 파나타 시블(뉴트럴) 10/10kg [운동명 일부 판독 불확실]'}]]},
   {d:'2026-09-10',t:'t4b',memo:'앞에 날짜 수정 흔적',ex:[
     ['panadec','보조','5',{raw:'1. 파나타 디클라인 5/5kg'}],
     ['panasp','보조','0',{raw:'2. 파나타 숄더프레스 0/0kg'}],
     ['cybrow','메인','5x15x3',{raw:'3. ~~[기존 운동명]~~ 싸이벡스 [운동명 판독 불가] (4,4) 5 × 15 × 3',setting:'4,4'}],
     ['panasibl','보조','10',{origin:'added',raw:'4. 파나타 시블(뉴트럴) 10/10kg [운동명 일부 판독 불확실]'}]]},
   {d:'2026-09-11',t:'t4a',planOnly:true,ex:[
     ['scurl','보조','30',{}],['hackpress','메인','40',{raw:'2. 핵프레스 40/40kg'}],['legpress','보조','30',{raw:'3. 레그프레스 30/30kg'}],['legext','마무리 털기','50x12',{}]]},
   {d:'2026-09-15',t:'t4a',ex:[
     ['scurl','보조','30',{}],
     ['hackpress','메인','',{status:'removed',reason:'기타',raw:'2. ~~핵프레스 40/40kg~~'}],
     ['legpress','보조','20x20x3',{raw:'3. 레그프레스 20/20kg × 20 × 3'}],
     ['legext','마무리 털기','50x20x3',{p:'30x20x3',raw:'4. 레그 익스텐션 ~~30~~ 50 × 20 × 3'}]]},
   {d:'2026-09-16',t:'t4b',ex:[
     ['cybrow','메인','6x15x3',{raw:'1. ~~[기존 운동명]~~ 싸이벡스 시티드로우 (4,4) ~~[기존 세트 표기]~~ 6 × 15 × 3',setting:'4,4'}],
     ['seoullat','보조','5x25x3',{raw:'2. 서울 랫풀다운 (뉴트럴) ~~10/[판독 불가]~~ 5/5kg × 25 × 3 [운동명·수정 앞부분 불확실]'}],
     ['panadec','보조','5',{raw:'3. 파나타 디클라인 5/5kg'}],
     ['panasp','보조','0',{raw:'4. 파나타 숄더프레스 0/0kg'}]]},
   {d:'2026-10-06',t:'t4a',ex:[
     ['scurl','보조','',{status:'swapped',to:'lycurl',raw:'1. 시티드 레그컬 → 라잉 레그컬'}],
     ['lycurl','보조','30x20x2, 40x15x2',{origin:'swap',raw:'라잉 레그컬 30 × 20 × 2, ~~[중간 수치]~~ 40 × 15 × 2'}],
     ['legext','마무리 털기','50x20x3',{raw:'2. 레그 익스텐션 50 × 20 × 3'}],
     ['legpress','보조','20x20x2, 40x12-15x2',{raw:'3. 레그프레스 20/20kg × 20 × 2, 40/40kg × 12~15 × 2'}],
     ['lunge','보조','',{origin:'added',raw:'4. 워킹런지.'}]]}],
  next:[{d:'2026-10-07',t:'t4b',time:'15:00'}]},

 {id:'m5',code:'정00',goals:[],notes:[{kind:'general',text:"날짜 없는 목록: 카프레이즈, 이너타이 15, 아웃타이 22.5, ~~덤벨 숄더프레스~~ or 펙덱 플라이, 덤벨 사레레, ~~핵프레스~~ or 레그프레스, 4. 백 익스텐션 / * [판독 불확실] ... 2-3회 ... / * 발목잡기 풀림, 가동범위를 [판독 불확실] 잡고."}],cautions:[],
  templates:[{id:'t5a',name:'앞',items:[['inner','보조'],['outer','보조'],['legpress','메인'],['dbsp','보조'],['dblat','마무리 털기']]},
   {id:'t5b',name:'뒤',items:[['lycurl','보조'],['scurl','보조'],['cybrow','메인'],['truet','보조'],['latpd','보조']]}],
  exMemos:{},
  sessions:[
   {d:'2026-09-01',t:'t5a',memo:'~~[운동명 판독 불확실]~~',ex:[
     ['dbsp','보조','5',{raw:'덤벨 숄더프레스 5/5lb'}],
     ['dblat','마무리 털기','1',{raw:'사레레 1/1kg'}],
     ['legpress','메인','20x25',{raw:'레그프레스 20kg × 25reps'}],
     ['lunge','보조','',{origin:'added',raw:'워킹런지 (마무리 운동)',note:'마무리 운동'}]]},
   {d:'2026-09-15',t:'t5a',ex:[
     ['inner','보조','15x20x3',{raw:'1. 이너타이 15 × 20 × 3'}],
     ['outer','보조','22.5x20x3',{raw:'2. 아웃타이 22.5 × 20 × 3 ([판독 불확실])'}],
     ['legpress','메인','20',{raw:'3. 레그프레스 20kg'}],
     ['dbsp','보조','5x5',{raw:'4. ~~[운동명 판독 불확실]~~ 덤벨 숄더프레스 5/5lb × 5'}],
     ['dblat','마무리 털기','1x25',{raw:'5. 덤벨 사레레 1/1kg × 25'}]]},
   {d:'2026-10-01',t:'t5b',ex:[
     ['cybrow','메인','5x20x3',{raw:'1. 싸이벡스 시티드로우 5 × 20 × 3 (가슴: 2, 의자: 3)',setting:'가슴: 2, 의자: 3'}],
     ['truet','보조','',{raw:'2. 트루 티바로우 20 × 3'}],
     ['latpd','보조','',{raw:'3. 랫풀다운'}],
     ['lycurl','보조','0x20x3',{raw:'4. 라잉 레그컬 0 × 20 × 3'}],
     ['scurl','보조','',{raw:'5. 시티드 레그컬 20 - [판독 불확실] × 3'}]]},
   {d:'2026-10-06',t:'t5a',ex:[
     ['inner','보조','15x20, 22.5x20x2',{p:'15x20x3',raw:'1. 이너타이 ~~15 × 20 × 3~~ 15 - 22.5 × 20 × 3 — 수정 부분의 구분 불확실'}],
     ['outer','보조','30x20x3',{p:'22.5x20x3',raw:'2. 아웃타이 ~~22.5 × 20 × 3~~ 30 × 20 × 3'}],
     ['legpress','메인','20x15x3',{raw:'3. 레그프레스 20/20kg × [판독 불확실] - 15reps × 3'}],
     ['dbsp','보조','5xx3',{raw:'4. 덤벨 숄더프레스 5/5lb × [판독 불확실] → [판독 불확실] × 3sets'}],
     ['dblat','마무리 털기','1x20',{raw:'5. 덤벨 사레레 1/1kg × [판독 불확실] → 20'}]]}],
  next:{d:'2026-10-20',t:'t5a',time:''}},

 {id:'m6',code:'최00',goals:[],notes:[{kind:'general',text:'9월 첫째주간 월 15시(당기기) 토요일 14시(어깨) (8/28 메모, 일부 판독 불확실)'}],cautions:[],
  templates:[
   {id:'t6a',name:'당기',items:[['panalat','메인'],['truet','보조'],['megat','보조'],['lowrow','보조'],['shrug','마무리 털기']]},
   {id:'t6b',name:'밀기',items:[['atlinc','메인'],['panadec','보조'],['panasp','보조'],['dblat','마무리 털기']]},
   {id:'t6c',name:'하체',items:[['scurl','보조'],['hacksq','메인'],['legpress','보조'],['legext','마무리 털기']]},
   {id:'t6d',name:'어깨',items:[['sdbsp','메인'],['dblat','보조'],['machlat','마무리 털기']]},
   {id:'t6e',name:'가슴',items:[['pecdeck','보조'],['incunk','메인'],['cablechest','보조'],['panadec','보조']]}],
  exMemos:{panalat:{setting:'2번',memo:'',date:'2026-09-15'},megat:{setting:'의자 4.5, 발 0.5',memo:'',date:'2026-09-15'}},
  sessions:[
   {d:'2026-08-28',t:'t6b',memo:'* 잘 되면 바로 체스트까지 진행. (일부 불확실) / * 좌우 15회 3번, 몸통 [판독 불확실] 고정. (끝의 분류 글씨 판독 불확실)',ex:[
     ['panadec','보조','',{raw:'1. 파나타 디클라인'}],['panasp','보조','',{raw:'2. 파나타 숄더프레스'}],['dblat','마무리 털기','',{raw:'3. 덤벨 사레레'}]]},
   {d:'2026-08-31',t:'t6a',ex:[
     ['panalat','메인','20',{raw:'1. 파나타 싱글 랫풀다운 ([괄호 내용 불확실]) 20/20kg'}],
     ['truet','보조','20',{raw:'2. 트루 티바로우 20kg'}],
     ['megat','보조','20',{raw:'3. 메가머스 티바로우 (가슴: 4?, 발: 0.5?) 20kg — 괄호·중량 일부 판독 불확실',setting:'가슴: 4?, 발: 0.5?'}],
     ['cybrow','보조','',{origin:'added',raw:'4. 싸이벡스 [판독 불확실] 시티드로우'}]]},
   {d:'2026-09-05',t:'t6c',memo:'* [판독 불확실] 고정.',ex:[
     ['scurl','보조','40',{raw:'1. 시티드 레그컬 40 -> [판독 불확실] / 오른쪽 자세 메모 판독 불확실'}],
     ['hacksq','메인','0x20',{raw:'2. 핵스쿼트 (발판: 3)([판독 불확실]) 0kg × 20reps — 일부 판독 불확실',setting:'발판: 3'}],
     ['legpress','보조','20x12',{raw:'3. 레그프레스 20/20kg × 12reps — 옆 기구 설정 숫자 판독 불확실'}],
     ['legext','마무리 털기','50x20',{raw:'4. 레그 익스텐션 50 × 20reps — 괄호 안 메모 판독 불확실'}]]},
   {d:'2026-09-08',t:'t6b',memo:'어깨 케어 -> ... [판독 불확실] / 5번 [운동명 판독 불확실]',ex:[
     ['atlinc','메인','',{raw:'1. 아틀 인클라인 [첫 단어 판독 불확실]'}],
     ['panadec','보조','',{raw:'2. 파나타 디클라인'}],
     ['panasp','보조','',{status:'removed',reason:'기타',raw:'3. ~~파나타 숄더프레스~~'}],
     ['dblat','마무리 털기','',{status:'removed',reason:'기타',raw:'4. ~~덤벨 사레레~~'}]]},
   {d:'2026-09-10',t:'t6a',memo:'5번 [운동명 판독 불확실] 20/20kg × 15 × 3sets',ex:[
     ['panalat','메인','20x20x3',{raw:'1. 파나타 싱글 (2번) 20/20kg × 20reps × 3sets',setting:'2번'}],
     ['truet','보조','20x20x2, 40x12',{raw:'2. 트루 티바로우 20kg × 20 × 2, 40kg × 12 — 맨 끝 횟수 표기 불확실'}],
     ['megat','보조','20x15-20x3',{raw:'3. 메가머스 티바로우 20kg × 15~20 × 3'}],
     ['cybrow','보조','',{status:'removed',reason:'기타',raw:'4. ~~싸이벡스 [판독 불확실] 시티드로우~~'}],
     ['shrug','마무리 털기','20x20x2',{raw:'6. 슈러그 20/20kg × 20 × 2sets'}]]},
   {d:'2026-09-15',t:'t6a',memo:'* 세팅에서부터 근육에 [판독 불확실] / ↓ 어깨 [판독 불확실]',ex:[
     ['panalat','메인','20x20x3',{raw:'1. 파나타 싱글 (2번) 20/20kg × 20reps × 3sets',setting:'2번'}],
     ['truet','보조','20x12-18x3',{p:'40x12x3',raw:'2. 트루 티바로우 ~~40kg × 12~~ → drop하여 20kg × 12~18reps × 3sets'}],
     ['megat','보조','20x15-20x3',{raw:'3. 메가머스 티바로우 20kg × 15~20 × 3 ([의자?] 4.5, 발 0.5)',setting:'의자 4.5, 발 0.5'}],
     ['lowrow','보조','20x15-20x3',{raw:'4. [운동명 판독 불확실] (Low row) 20/20kg × 15~20 × 3'}],
     ['shrug','마무리 털기','20x20x2',{raw:'5. 슈러그 20/20kg × 20 × 2sets'}]]},
   {d:'2026-09-17',t:'t6d',ex:[
     ['ohp','보조','',{origin:'added',raw:'1. ~~시티드 덤벨 숄더프레스~~ OHP or 머신 프레스'}],
     ['sdbsp','메인','',{raw:'2. 시티드 덤벨 숄더프레스'}],
     ['dblat','보조','',{raw:'3. 사레레'}],
     ['machlat','마무리 털기','',{raw:'4. 머신 사레레'}]]},
   {d:'2026-09-22',t:'t6e',ex:[
     ['pecdeck','보조','',{raw:'1. 팩덱 플라이 (리듬, [판독 불확실] 각? 위치?)'}],
     ['incunk','메인','',{raw:'2. [판독 불확실] 인클라인'}],
     ['cablechest','보조','',{raw:'3. 케이블 체스트'}],
     ['panadec','보조','',{raw:'4. 파나타 디클라인 → 10 [판독 불확실] (컨디션 good)',note:'컨디션 good'}]]},
   {d:'2026-09-29',t:'t6a',memo:'↓ 어깨 [판독 불확실] 라운드 [판독 불확실]',ex:[
     ['latpd','메인','20',{origin:'added',raw:'1. 랫풀다운 ([판독 불확실]) 20 → [판독 불확실]'}],
     ['truet','보조','30x12x3',{p:'20x12x3',raw:'2. 트루 티바로우 20kg → 30kg × 12reps × 3 — 화살표 뒤 숫자 일부 불확실'}],
     ['onearmcable','보조','',{origin:'added',raw:'3. 원암 케이블 [운동명 뒤쪽 판독 불확실]'}],
     ['cybrow','보조','x9',{origin:'added',raw:'4. 시티드로우 (2번, [판독 불확실]) (9reps)',setting:'2번'}],
     ['lowrow','보조','20',{raw:'5. Row row 20/20kg (영문 표현 그대로)'}]]},
   {d:'2026-09-30',t:'t6d',ex:[
     ['rearfly','보조','',{origin:'added',raw:'1. [판독 불확실] 로테이션, 케이블 리어델트 플라이 (높이 16) — 오른쪽 작은 10 표시',setting:'높이 16'}],
     ['panapress','메인','20x12x3',{origin:'added',raw:'2. 파나타 프레스 20/20kg × 12 × 3 (마지막 2개)',note:'마지막 2개'}],
     ['dbsp','보조','',{origin:'added',raw:'3. 덤벨 숄더프레스'}],
     ['dblat','보조','',{raw:'4. 사레레'}],
     ['machlat','마무리 털기','',{raw:'5. 머신 사레레'}]]},
   {d:'2026-10-06',t:'t6e',memo:'3번 덤벨 [판독 불확실]',ex:[
     ['crunch','보조','',{origin:'added',raw:'1. [운동명 판독 불확실] 크런치'}],
     ['smithinc','메인','',{origin:'added',raw:'2. 스미스 인클라인 (고강?, 세트?) — 괄호 안 불확실'}],
     ['dbchest','보조','',{origin:'added',raw:'4. 덤벨 체스트'}]]}],
  next:[{d:'2026-10-07',t:'t6a',time:'17:00'}]}
];

/* 시나리오 장면 7·8에서 넣는 이00_3 수첩 기록 (10/7 뒤). 앱의 '오늘'이 그 날짜를 지날 때만 넣는다 */
const M3_TEMPLATE_BACK={id:'t3d',name:'후면사슬',items:[['deadlift','메인'],['bbrow','보조'],['truet','보조']],note:'수첩 10/9 칸에서 만듦'};
const M3_LATER={
 '2026-10-08':{d:'2026-10-08',t:'t3b',ex:[
   ['incdb','메인','55x10-15x3',{raw:'1, 인클라인 덤벨 55/55lb x 10-15reps x 3sets. (부위를 느낌)(강도 유지x)',note:'부위를 느낌, 강도 유지x'}],
   ['nitro','보조','30x15x3',{raw:'2, 너틸러스 니트로 체스트 ⊕ 푸쉬업. (30 x 15reps ⊕ 13reps) x 3.',note:'푸쉬업과 슈퍼세트'}],
   ['pushup','보조','x13x3',{origin:'added',raw:'(니트로 체스트와 슈퍼세트) 13reps x 3'}],
   ['sdbsp','보조','',{raw:'3, 숄더프레스 (덤벨시티드) ⊕'}],
   ['machlat','마무리 털기','',{raw:'4, 머신 사레레'}]]},
 '2026-10-09':{d:'2026-10-09',t:'t3d',memo:'수첩에는 종목 이름만 있다.',ex:[
   ['deadlift','메인','',{raw:'1, 데드리프트'}],
   ['bbrow','보조','',{raw:'2, 바벨로우'}],
   ['truet','보조','',{raw:'3, 트루 티바로우'}]]},
 '2026-10-15':{d:'2026-10-15',t:'t3b',ex:[
   ['ohp','메인','30x12x3',{origin:'added',raw:'1, OHP, 30kg. x 12 x 3'}],
   ['strive','보조','7.5x20x3',{origin:'added',raw:'2, 스트라이브 7.5kg x 20x3'}],
   ['frontraise','보조','10x12-15x3',{origin:'added',raw:'3, 프론트 레이즈(듀얼케이블)(원암) 10lb x 12-15 x 3 (끝 숫자 판독 불확실)'}]]},
 '2026-10-16':{d:'2026-10-16',t:'t3c',memo:'* 2, 3, 4번 종목에서는 날개뼈의 움직임에 집중. 5. 라잉 레그컬과 워킹 런지를 통한 심박수 + 체중감량 고려. └▷ 오늘 시간적인 여유가 없음.',ex:[
   ['deadlift','메인','',{origin:'added',raw:'1, 데드리프트 (심박수 + 강도)'}],
   ['bbrow','보조','',{status:'swapped',to:'truet',raw:'2, ~~바벨로우~~ 트루 티바로우 20kg'}],
   ['truet','보조','20',{origin:'swap',raw:'트루 티바로우 20kg'}],
   ['latpd','보조','',{origin:'added',raw:'③④ 오버그립 랫풀다운 (그립 단어 판독 불확실)'}],
   ['cybrow','메인','8',{raw:'3, 싸이벡스 시티드 로우. (패드:4, 의자:6) 8',setting:'패드:4, 의자:6'}]]}
};

/* 김00·최00의 10/7 뒤 수첩 기록. 앱의 '오늘'이 그 날짜를 지날 때만 넣는다 (시나리오 1부: 10/7은 세 수업) */
const OTHERS_LATER={
 m1:[
   {d:'2026-10-09',t:'t1f',ex:[
     ["latpd","메인","",{"raw":"1. 랫풀다운 (언더그립) / 2. 랫풀다운(오버그립)"}],
     ["truet","보조","",{"raw":"3. 트[럭?]티바로[우?]"}],
     ["deadlift","보조","",{"raw":"4. 데드리프트"}],
     ["lowrow","보조","",{"raw":"5. Low row."}]]},
   {d:'2026-10-13',t:'t1g',ex:[
     ["lycurl","메인","",{"raw":"1. 라잉컬 40 x 20 x 3.","origin":"added"}],
     ["legpress","보조","",{"raw":"2. 레그프레스 (~~T x 2, M x 2~~) 60/60kg x ~~T[?] x 3~~ 15 x 3"}],
     ["legext","보조","",{"raw":"3. 레그 익스텐션 70 x 15 x 3,"}],
     ["scurl","보조","",{"raw":"4. 시티드 컬. [3?]0 x 15 x 3,","origin":"added"}]]},
   {d:'2026-10-16',t:'t1x',ex:[
     ["asspull","메인","",{"raw":"1. 어시스트 풀업","origin":"added"}],
     ["truet","보조","",{"raw":"2. 트루[?]티바로우","origin":"added"}],
     ["deadlift","보조","60",{"raw":"3. ~~싸이벡스 광배[?]~~ 데드리프트 60","origin":"added"}],
     ["lowrow","보조","",{"raw":"4. ~~싸이벡스 광배[?], 시티드로우~~. low row","origin":"added"}]]}],
 m2:[
  {d:'2026-10-09',t:'t2e',memo:'3. ~~[운동명 판독 불가]~~ / 6. ~~[운동명 일부 판독 불가]~~ (옆에 짧은 메모)',ex:[
    ['scurl','보조','30x20, 40x20x3',{raw:'1. 시티드 레그컬 — 30 × 20, 40 × 20 × 3'}],
    ['legext','보조','50x20, 70xx3',{raw:'2. 레그 익스텐션 — 50 × 20, 70 × [판독 불가] × 3'}],
    ['trabd','보조','20x15-20x4',{raw:'4. 트렁크 어브덕션 — 20 × 15~20 × 4'}],
    ['panadec','메인','',{raw:'5. 파나타 디클라인'}]]},
  {d:'2026-10-12',t:'t2c',ex:[
    ['trrow','보조','20',{origin:'added',raw:'1. 트렁크 티바로우 — 20'}],
    ['cybrow','보조','7x15',{p:'6x20',origin:'added',raw:'2. 싸이벡스 시티드로우 — (3,3) 6 × 20에서 7 × 15로 적은 수정 표기',setting:'3,3'}],
    ['incunk','메인','',{origin:'added',raw:'3. 인클라인 [판독 불가] — 숫자·괄호 메모 일부 판독 불가'}],
    ['panadec','보조','7.5',{p:'5',origin:'added',raw:'4. 파나타 디클라인 — 5/5 → 7.5/7.5kg으로 쓰인 표기'}],
    ['panasp','보조','0',{origin:'added',raw:'5. 파나타 숄더 — 0/0kg'}]]},
  {d:'2026-10-15',t:'t2d',ex:[
    ['lycurl','보조','',{status:'swapped',to:'scurl',raw:'1. ~~라잉 레그컬 50~~ → 시티드 레그컬'}],
    ['scurl','보조','40x20x3',{origin:'swap',raw:'시티드 레그컬 — 40 × 20 × 3'}],
    ['smithsplit','보조','5x15-20x3',{origin:'added',raw:'2. 스미스 ~~[취소된 글씨]~~ 스플릿 스쿼트 — 5/5kg × 15~20reps × 3'}],
    ['legpress','보조','20x20x3',{p:'40x20x3',origin:'added',raw:'3. 프라임 레그 프레스 — ~~40/40kg~~ 20/20kg × 20reps × 3'}],
    ['calf','마무리 털기','',{origin:'added',raw:'4. [판독 불가], 카프레이즈'}]]}],
 m5:[
  {d:'2026-10-08',t:'t5b',ex:[
    ['lycurl','보조','5x20, 6x20x2',{raw:'1. 라잉 레그컬 (가슴: 2, 의자: 3) 5 × 20, 6 × 20 × 2 — 맨 앞 화살표 메모 0 × 20, 10 × 20, 15 × 20도 원본에 보임',setting:'가슴: 2, 의자: 3'}],
    ['scurl','보조','20x20x3',{raw:'2. 시티드 레그컬 20 × 20 × 3'}],
    ['cybrow','메인','',{raw:'3. 싸이벡스 시티드로우'}],
    ['truet','보조','0x20x2, 2.5',{raw:'4. 트루 티바로우 0 × 20 × 2, 2.5kg × [뒤가 비어 있음]'}],
    ['latpd','보조','15x20x2',{raw:'5. 랫풀다운 15 × 20 × 2'}]]},
  {d:'2026-10-13',t:'t5a',ex:[
     ['inner','보조','15x20, 15x25x2',{raw:'1. 이너타이 15 × 20, ~~[판독 불확실]~~, 15 × 25 × 2'}],
     ['outer','보조','30x25x3',{raw:'2. 아웃타이 30 × 25 × 3'}],
     ['legpress','메인','20x20, 30x12x2',{raw:'3. 레그프레스 20/20kg × 20, 30/30kg × 12 × 2'}],
     ['dbsp','보조','',{raw:'4. 덤벨 [운동명 일부 불확실] → [판독 불확실] 17kg + 2.3 + 2.3kg × 20 × 3'}],
     ['dblat','마무리 털기','',{status:'swapped',to:'smithpu',raw:'5. → 스미스 푸쉬업 ([판독 불확실])'}],
     ['smithpu','마무리 털기','',{origin:'swap'}]]},
  {d:'2026-10-15',t:'t5b',ex:[
    ['lycurl','보조','',{raw:'1. 라잉 레그컬'}],
    ['scurl','보조','',{raw:'2. 시티드 레그컬'}],
    ['cybrow','메인','5x20, 6x20',{raw:'3. 싸이벡스 시티드로우 (의자: 4, 가슴: 2) 5 × 20, 6 × 20',setting:'의자: 4, 가슴: 2'}],
    ['truet','보조','2.5x20x3',{raw:'4. 트루 티바로우 2.5kg × 20 × 3'}],
    ['latpd','보조','',{raw:'5. 랫풀다운'}]]},
  {d:'2026-10-16',t:'t5b',memo:'(흉추 ... 날개뼈 움직임 잡기) — 가운데 글씨 판독 불확실 / * 1. 랫풀다운: (날개뼈 먼저 움직이는 감각으로 연결)',ex:[
    ['latpd','보조','15x20, 20x20',{raw:'1. 랫풀다운 (뉴트럴, 한 어깨?) 15 × 20, 20 × 20 × [끝 수치 판독 불확실]',note:'날개뼈 먼저 움직이는 감각으로 연결'}],
    ['truet','보조','7.5x20x2',{p:'2.5x20x2',raw:'2. 트루 티바로우 2.5kg → 7.5kg × 20 × 2'}],
    ['cybrow','메인','5, 6x20x2',{raw:'3. 싸이벡스 시티드로우 5 (가슴: 2, 의자: 3), 6 × 20 × 2',setting:'가슴: 2, 의자: 3'}],
    ['lycurl','보조','15x20x3',{raw:'4. 라잉 레그컬 15 × 20 × 3'}],
    ['scurl','보조','20x20, 25x20',{raw:'5. 시티드 레그컬 20 × 20, 25 × 20 (30 예정)',note:'30 예정'}]]}],
 m4:[
  {d:'2026-10-07',t:'t4b',memo:'(괄호 안 운동 부위/메모 판독 불가) 2·3번 운동명 판독 불가: 2. ~~[기존 운동명]~~ [변경 운동명 일부 판독 불가] (뉴트럴, 중간에) 20 × 20 / 3. ~~[기존 운동명]~~ [판독 불가] (사도[?])',ex:[
    ['cybrow','메인','6x15x3',{raw:'1. 싸이벡스 시티드로우 (4,4, [판독 불가]) 6 × 15 × 3',setting:'4,4'}],
    ['panadec','보조','',{raw:'4. 파나타 디클라인'}],
    ['panasp','보조','',{raw:'5. 파나타 숄더프레스'}]]},
  {d:'2026-10-12',t:'t4a',ex:[
    ['scurl','보조','30x20x4',{raw:'1. 시티드 레그컬 30 × 20 × 4'}],
    ['legext','마무리 털기','50x20x4',{raw:'2. 레그 익스텐션 50 × 20 × 4'}],
    ['legpress','보조','20x20',{raw:'3. 레그 프레스 20/20kg × 20, ~~30/30kg × [판독 불가]~~'}],
    ['hackpress','메인','x25x3',{raw:'4. 핵프레스 ([괄호 안 판독 불가]) 25reps × 3sets.'}]]},
  {d:'2026-10-13',t:'t4b',memo:'2. [운동명 판독 불가] (사도[?]) 2.5kg × 25reps × 3sets',ex:[
    ['latpd','보조','20x12-20x4',{p:'20x30x4',origin:'added',raw:'1. 랫풀다운 (뉴트럴, [판독 불가]) 20 × ~~30~~ 12~20 × 4sets.'}],
    ['cybrow','메인','4x25x3',{p:'5x15x3',raw:'3. 싸이벡스 시티드로우 (4,4) ~~5×15~~ 4 × 25 × 3 [중간 수정 값 불확실]',setting:'4,4'}],
    ['panadec','보조','5',{raw:'4. 파나타 디클라인 5/5kg'}],
    ['panasp','보조','0',{raw:'5. 파나타 숄더프레스 0/0kg'}]]}],
 m6:[
  {d:'2026-10-07',t:'t6a',memo:'당기 특수',ex:[
    ['latpd','메인','20',{origin:'added',raw:'1. 랫풀다운 (2번 그립, 날개뼈 [판독 불확실]) 20kg 연습',note:'20kg 연습',setting:'2번 그립'}],
    ['truet','보조','',{raw:'2. 트루 티바로우 20~30kg'}],
    ['onearmcable','보조','',{origin:'added',raw:'3. 원암 케이블 (파나타?) — 괄호 안 불확실'}],
    ['cybrow','보조','',{origin:'added',raw:'4. 시티드로우 (2번, [판독 불확실], [기구명?])',setting:'2번'}],
    ['lowrow','보조','20',{raw:'5. Low row 20/20kg'}]]},
  {d:'2026-10-15',t:'t6b',memo:'3. [판독 불확실] 푸쉬 15',ex:[
    ['ohp','메인','30x12x3',{origin:'added',raw:'OHP. 30kg × 12 × 3'}],
    ['incdb','보조','25x15',{origin:'added',raw:'인클라인 덤벨 25/25lb × 15'}]]}]
};
