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
  dbchest:{name:'덤벨 체스트',part:'가슴',unit:'lb',inc:5,side:true}
};

/* ---------- 수첩 기록 → 앱 데이터 ----------
   세트 표기: "45x20-25x2" = 무게 45, 횟수 20-25, 2세트. "40x16, 40x12" = 두 세트. "50" = 무게만.
   "x30x2" = 무게 없이 30회 2세트. 앞에 W: 워밍업, T: 탑, B: 백오프, D: 드롭.
   p = 계획(지운 숫자 등)이 실제와 다를 때만. 실제 사람 기록이라 이름은 성+00 코드(D61). */
const SEED_MEMBERS=[
 {id:'m3',code:'이00_3',goals:[],notes:[],cautions:[],
  templates:[
   {id:'t3a',name:'하체',items:[['inner','보조'],['scurl','보조'],['hacksq','메인'],['legpress','보조'],['legext','마무리 털기']]},
   {id:'t3b',name:'밀기',items:[['incdb','메인','탑세트+백오프'],['nitro','보조'],['sdbsp','보조'],['machlat','마무리 털기']]},
   {id:'t3c',name:'당기기',items:[['cybrow','메인'],['bbrow','보조'],['truet','보조'],['multirow','보조'],['shrug','마무리 털기']]}],
  exMemos:{hacksq:{setting:'발판:1, 밴드o',memo:'',date:'2026-09-15'},cybrow:{setting:'패드:4, 의자:6',memo:'날개뼈 먼저',date:'2026-09-24'},legpress:{setting:'등받이:1',memo:'',date:'2026-08-31'}},
  sessions:[
   {d:'2026-08-24',t:'t3a',ex:[
     ['inner','보조','37.5x20-25x2',{raw:'1. 이너타이 37.5 x 20-25reps x 2sets.'}],
     ['scurl','보조','50x20x3',{raw:'2, 시티드 레그컬 50x 20 x 3sets.'}],
     ['hacksq','메인','20x8-15x3',{raw:'3, 핵스쿼트 (~~발판:2~~, 밴드o) 20kg x 8-15reps x 3sets. -▷ 발판: 1로 변경.',setting:'밴드o'}],
     ['legpress','보조','40x20x3',{raw:'4. 레그프레스(프라임)(등받이:1) 40/40kg x 20reps x 3sets.',setting:'등받이:1'}]]},
   {d:'2026-08-31',t:'t3a',ex:[
     ['inner','보조','37.5x45, 52.5x8',{raw:'1, 이너타이 37.5 x {위: 45reps}~~20-25reps~~ x ~~2sets~~. -▷ 52.5 kg x 8reps.'}],
     ['scurl','보조','40x20x3',{p:'50x20x3',raw:'2, 시티드 레그컬 ~~50 x 20reps x 3sets~~. 40 x 20reps x 3sets.'}],
     ['hacksq','메인','20x20, 40x',{raw:'3. 핵스쿼트 (발판:1, 밴드o) 20kg x 8~~-15reps x 3sets~~. 20reps, 40kg x (짝 불확실)',setting:'발판:1, 밴드o'}],
     ['legpress','보조','40x20x3',{raw:'4. 레그프레스(프라임, 등받이:1) 40/40kg x 20reps x 3sets.'}]]},
   {d:'2026-09-08',t:'t3a',ex:[
     ['inner','보조','45x25',{raw:'1. 이너타이 ~~위칭:3 52.5kg x 3sets~~ 45kg x 25reps.'}],
     ['scurl','보조','40x20, 50x15x2',{p:'40x20x3',raw:'2, 시티드 레그컬 40 x 20reps x ~~3sets~~ -▷ 50 x ~~25~~ ⑮ x2sets.'}],
     ['hacksq','메인','20x, 40x8-12x3',{raw:'3, 핵스쿼트(발판:1, 밴드o) 20kg 해보고 40kg 20개[?] -▷ 40kg x ~~12reps~~ x 3. {아래: 8-12reps.}'}],
     ['legpress','보조','',{status:'swapped',to:'lunge',raw:'4, ~~프라임 레그프레스(등받이:1) 40/40kg x 20reps x 3sets~~.'}],
     ['lunge','보조','x30x2',{origin:'swap',raw:'↳ 워킹런지로 마무리. x ~~3sets~~. 30reps x2sets'}],
     ['legext','마무리 털기','',{status:'removed',reason:'기타',raw:'4, ~~레그 익스텐션~~.'}]]},
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
  templates:[{id:'t1a',name:'밀기',items:[['bbinc','메인'],['ohp','보조'],['panadec','보조'],['pushdown','마무리 털기']]}],
  exMemos:{},
  sessions:[
   {d:'2026-07-07',t:'t1a',ex:[
     ['bbinc','메인','55x13, 60x6, 60x5',{raw:'바벨 인클라인 (55kg x 13reps.), 60kg x 6reps, 5reps.'}],
     ['ohp','보조','35x13, 40x6, 40x8',{raw:'~~시티드 OHP~~. OHP. 35kg x 13reps, 40kg x 6reps, 8reps.'}],
     ['panadec','보조','25x실패지점x2',{raw:'파나타 디클라인 25/25kg x 실패지점 x 2sets (보조 o).'}],
     ['pushdown','마무리 털기','30x20',{raw:'케이블 푸쉬다운 30lb x 20reps.'}]]}]},

 {id:'m2',code:'이00_2',goals:[{text:'3~4개월 안으로 10kg 감량',start:''}],
  notes:[{kind:'diet',text:'하루 2끼 식단 (끼니별 kcal는 수첩에 있음)'}],cautions:[],
  templates:[{id:'t2a',name:'앞다리',items:[['inout','보조'],['calf','마무리 털기'],['hacksq','메인'],['legpress','보조'],['legext','마무리 털기']]}],
  exMemos:{hacksq:{setting:'발판:2, 무릎 정렬',memo:'',date:'2026-08-03'}},
  sessions:[
   {d:'2026-07-17',t:'t2a',ex:[
     ['inout','보조','22.5x20',{raw:'1. 이너/아웃 타이 / 카프레이즈 — (22.5 / 45 / 0) / × 20reps (세트 부분 덧씀)'}],
     ['calf','마무리 털기','',{}],
     ['hacksq','메인','10x20',{raw:'2. 핵스쿼트 — (발판:4) … 10kg × 20 부분 확인',setting:'발판:4'}],
     ['legpress','보조','',{status:'swapped',to:'goblet',raw:'3. ~~[운동명]~~ 고블릿 스쿼트'}],
     ['goblet','보조','15x30x2',{origin:'swap',raw:'고블릿 스쿼트 — 15lb × 30reps × 2sets'}],
     ['legext','마무리 털기','',{raw:'4. 레그 익스텐션'}]]},
   {d:'2026-08-03',t:'t2a',ex:[
     ['inout','보조','',{raw:'1. 이너/아웃 타이'}],
     ['hacksq','메인','20x15',{raw:'2. 핵스쿼트 — (발판:2, 무릎 정렬) / 20kg × 15reps × [판독 불가]sets',setting:'발판:2, 무릎 정렬'}],
     ['legpress','보조','',{status:'swapped',to:'goblet'}],
     ['goblet','보조','15x30x2',{origin:'swap',raw:'3. 고블릿 스쿼트 — 15lb × 30reps × 2sets'}],
     ['legext','마무리 털기','30',{raw:'4. 레그 익스텐션 30'}]]},
   {d:'2026-09-01',t:'t2a',ex:[
     ['inout','보조','22.5x20-25, 30x8-12',{raw:'1. 이너타이 — 22.5 × 20~25, 30 × 8~12'}],
     ['hacksq','메인','40x15x2',{raw:'2. 핵스쿼트 — (발판:2, [판독 불가]:0) / 40kg × 15reps × 2sets (앞 수치 취소)',setting:'발판:2'}],
     ['legpress','보조','',{status:'swapped',to:'goblet'}],
     ['goblet','보조','25x25x3',{origin:'swap',raw:'3. 고블릿 스쿼트 — 25lb × 25 × 3'}],
     ['legext','마무리 털기','50x20x2',{raw:'4. 레그 익스텐션 — 50 × 20 × 2sets'}]]}]},

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

 {id:'m5',code:'정00',goals:[],notes:[],cautions:[],
  templates:[{id:'t5a',name:'앞',items:[['inner','보조'],['outer','보조'],['legpress','메인'],['dbsp','보조'],['dblat','마무리 털기']]}],
  exMemos:{},
  sessions:[
   {d:'2026-09-15',t:'t5a',ex:[
     ['inner','보조','15x20x3',{raw:'1. 이너타이 15 × 20 × 3'}],
     ['outer','보조','22.5x20x3',{raw:'2. 아웃타이 22.5 × 20 × 3 ([판독 불확실])'}],
     ['legpress','메인','20',{raw:'3. 레그프레스 20kg'}],
     ['dbsp','보조','5x5',{raw:'4. ~~[운동명 판독 불확실]~~ 덤벨 숄더프레스 5/5lb × 5'}],
     ['dblat','마무리 털기','1x25',{raw:'5. 덤벨 사레레 1/1kg × 25'}]]},
   {d:'2026-10-06',t:'t5a',ex:[
     ['inner','보조','15x20, 22.5x20x2',{p:'15x20x3',raw:'1. 이너타이 ~~15 × 20 × 3~~ 15 - 22.5 × 20 × 3 — 수정 부분의 구분 불확실'}],
     ['outer','보조','30x20x3',{p:'22.5x20x3',raw:'2. 아웃타이 ~~22.5 × 20 × 3~~ 30 × 20 × 3'}],
     ['legpress','메인','20x15x3',{raw:'3. 레그프레스 20/20kg × [판독 불확실] - 15reps × 3'}],
     ['dbsp','보조','5xx3',{raw:'4. 덤벨 숄더프레스 5/5lb × [판독 불확실] → [판독 불확실] × 3sets'}],
     ['dblat','마무리 털기','1x20',{raw:'5. 덤벨 사레레 1/1kg × [판독 불확실] → 20'}]]},
   {d:'2026-10-13',t:'t5a',ex:[
     ['inner','보조','15x20, 15x25x2',{raw:'1. 이너타이 15 × 20, ~~[판독 불확실]~~, 15 × 25 × 2'}],
     ['outer','보조','30x25x3',{raw:'2. 아웃타이 30 × 25 × 3'}],
     ['legpress','메인','20x20, 30x12x2',{raw:'3. 레그프레스 20/20kg × 20, 30/30kg × 12 × 2'}],
     ['dbsp','보조','',{raw:'4. 덤벨 [운동명 일부 불확실] → [판독 불확실] 17kg + 2.3 + 2.3kg × 20 × 3'}],
     ['dblat','마무리 털기','',{status:'swapped',to:'smithpu',raw:'5. → 스미스 푸쉬업 ([판독 불확실])'}],
     ['smithpu','마무리 털기','',{origin:'swap'}]]}],
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
