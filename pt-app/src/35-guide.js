/* ---------- 시나리오 따라 하기 (시나리오.md 2부, v3 화면 넷 순서의 장면 1~8) ----------
   장면마다 단계가 있고, 단계마다 할 말(say), 짚을 곳(at), 끝났는지(done), 대신 하기(auto)가 있다.
   화면을 그릴 때마다 지금 단계가 끝났는지 보고 다음 단계로 넘어간다. */
const G={open:true,scene:0,step:0,busy:false,lastAt:''};
const GD={
  m:()=>M('m3'),
  s107:()=>S.sessions.find(s=>s.memberId==='m3'&&s.date==='2026-10-07'),
  sLeg:()=>S.sessions.find(s=>s.memberId==='m3'&&s.templateId==='t3a'&&s.date>'2026-10-07'&&s.date<='2026-10-14'),
};
const gex=(s,id)=>s&&s.exercises.find(e=>e.exId===id&&e.status!=='swapped')||s&&s.exercises.find(e=>e.exId===id);
const isSet=(st,w,r)=>!!st&&st.done&&st.aw===w&&st.ar===r;
const onR=(name,s)=>UI.route.name===name&&(!s||UI.route.sid===s.id);
function ensureR(name,s){if(!onR(name,s))go(name,s?{sid:s.id}:{})}
function liveSet(s,x,i,w,r){ensureR('live',s);UI.cur[s.id]=x.uid;while(x.sets.length<=i)newSet(s,x);const st=x.sets[i];
  if(w!=null&&st.aw!==w)setField(s,x,i,'w',w);if(r!=null&&st.ar!==r)setField(s,x,i,'r',r);if(!st.done)confirmSet(x,st,s)}
/* 수업 중 세트 칸 짚기: 그 종목 카드가 아니면 '다음' 줄, 고치는 칸이 열려 있으면 그 칸 */
function atLive(s,x,i,f){
  if(UI.cur[s.id]!==x.uid) return `.next[data-uid="${x.uid}"]`;
  if(isEdit(x,i)) return `.editor [data-on="ev"][data-f="${f}"]`;
  return `[data-act="edit"][data-uid="${x.uid}"][data-i="${i}"][data-f="${f}"]`;
}
function atSame(s,x,i){if(UI.cur[s.id]!==x.uid)return `.next[data-uid="${x.uid}"]`;return `[data-act="same"][data-uid="${x.uid}"][data-i="${i}"]`}
function atMenu(s,x,type,pick){
  const mo=UI.modal;
  if(mo&&mo.type===type&&mo.uid===x.uid) return pick();
  if(mo&&mo.type==='exMenu'&&mo.uid===x.uid) return `.modal [data-act="modal"][data-type="${type}"]`;
  if(isLive(s)&&UI.cur[s.id]!==x.uid) return `.next[data-uid="${x.uid}"]`;
  return `[data-act="modal"][data-type="exMenu"][data-uid="${x.uid}"]`;
}
/* 수업 중 한 종목의 세트들: 아직 안 맞는 첫 세트를 짚는다. want = [[무게, 횟수, 'same'|'w'|'r'], ...] */
function atSets(s,x,want){
  for(let i=0;i<want.length;i++){const [w,r,how]=want[i];const st=x.sets[i];
    if(!st) return UI.cur[s.id]!==x.uid?`.next[data-uid="${x.uid}"]`:`[data-act="addSet"][data-uid="${x.uid}"]`;
    if(isSet(st,w,r)) continue;
    if(how==='same') return st.done?`[data-act="undoSet"][data-uid="${x.uid}"][data-i="${i}"]`:atSame(s,x,i);
    return atLive(s,x,i,how==='w'&&st.aw===w?'r':how);
  }
  return '';
}
function atRemove(s,x){
  const mo=UI.modal;
  if(mo&&mo.type==='exMenu'&&mo.uid===x.uid) return '.modal [data-act="removeNow"]';
  if(isLive(s)&&UI.cur[s.id]!==x.uid) return `.next[data-uid="${x.uid}"]`;
  return `[data-act="modal"][data-type="exMenu"][data-uid="${x.uid}"]`;
}
const atAsk=v=>UI.ask?`.askbar [data-act="askPick"][data-v="${v}"]`:'';
function atAdj(s,x,i){if(UI.modal&&UI.modal.type==='adj')return '.modal [data-act="closeModal"]';if(isLive(s)&&UI.cur[s.id]!==x.uid)return `.next[data-uid="${x.uid}"]`;return `[data-act="adj"][data-uid="${x.uid}"][data-i="${i}"]`}
const adjSeen=(x,i)=>UI.flags.adjLast===x.uid+':'+i&&!UI.modal;
function seedLater(d){
  const m=GD.m(); const p=S.sessions.find(s=>s.memberId==='m3'&&s.date===d&&s.status==='planned'); if(p) S.sessions.splice(S.sessions.indexOf(p),1);
  if(S.sessions.some(s=>s.memberId==='m3'&&s.date===d)) return;
  if(M3_LATER[d].t==='t3d'&&!tplOf(m,'t3d')){const T=M3_TEMPLATE_BACK;m.templates.push({id:T.id,name:T.name,items:T.items.map(([exId,role])=>({exId,role,structure:'스트레이트'})),versions:[{date:d,note:T.note}]})}
  seedSession(m,M3_LATER[d]);
}

/* v3 장면 1~8 (수첩 10/7·10/14 칸 그대로 따라 하는 단계들). v4 시나리오는 이 단계들을 되쓰고, 화면에 보여 줄 단계만 골라 다시 쓴다 */
const OLD=[
 {t:'장면 1. 출근, 오늘',sub:'10/7 (수) 14:30 · 화면: 오늘',
  enter(){S.today='2026-10-07';save();home('today')},
  steps:[
   {say:"앱을 열면 '오늘'이에요. '19:00 · 이00_3 · 하체' 줄에 오늘 목표(핵스쿼트 60kg 도전)와 '마지막 수업 13일 전'이 보여요. 회원이 카톡으로 \"2주 만이라 살살 해 주세요\"라고 했다고 해 봐요(가정). 줄 오른쪽 '…'을 눌러 오늘 메모 칸에 적고 '넣기'를 눌러요.",
    at:()=>{const s=GD.s107();if(UI.modal&&UI.modal.type==='sessMenu')return (UI.draft['tm-'+s.id]||'').trim()?'.modal [data-act="todayMemo"]':`.modal [data-d="tm-${s.id}"]`;return UI.route.name==='today'?`.srow[data-sid="${s.id}"] .more`:'.tabbar [data-v="today"]'},
    done:()=>todayMemos(GD.m(),GD.s107()).length>0,
    auto:()=>{const s=GD.s107();GD.m().notes.push({id:uid('n'),kind:'check',text:'2주 만이라 살살 해 주세요 (가정)',created:'2026-10-07',due:s.id,done:false});UI.modal=null;save();home('today')}},
   {say:"줄 아래에 오늘 메모가 붙었어요. 수업 30분 전이 됐다고 치고 줄을 눌러요.",
    at:()=>UI.route.name==='today'?`[data-act="openSession"][data-sid="${GD.s107().id}"]`:'.tabbar [data-v="today"]',
    done:()=>onR('prep',GD.s107()),
    auto:()=>{home('today');ACT.openSession({sid:GD.s107().id})}}]},
 {t:'장면 2. 수업 30분 전, 기록 읽기',sub:'18:30 · 화면: 수업 준비 (위 띠와 지난 기록)',
  steps:[
   {say:"브리핑과 예정 루틴이 한 장이에요. 맨 위 띠 셋에 주의사항·물어볼 것과 오늘 메모, 목표, 지난 수업(13일 전 9/24 당기기, 9/30 하체는 계획만 있어 건너뜀)이 있어요. 아래 종목 줄 가운데가 지난 같은 분할 실제값이에요. 핵스쿼트 줄의 '9/22 40kg × 16, 12'를 눌러 최근 4회를 펼쳐요.",
    at:()=>`[data-act="toggle"][data-t="br-${gex(GD.s107(),'hacksq').uid}"]`,
    done:()=>!!UI.open['br-'+gex(GD.s107(),'hacksq').uid],
    auto:()=>{ensureR('prep',GD.s107());UI.open['br-'+gex(GD.s107(),'hacksq').uid]=true;render()}},
   {say:"8/24 20kg부터 9/22 40kg까지 보여요. 오른쪽 오늘 계획은 9/22에 남긴 목표 그대로 60kg이에요. '목표 9/22 !' 꼬리표를 눌러 근거를 읽어요. 40kg × 16은 10회가 넘어 추정 1RM 공식을 쓰지 않았다는 줄과, 기본 숫자가 컨디션 '보통' 기준이라는 줄이 있어요. '닫기'.",
    at:()=>UI.modal&&UI.modal.type==='basis'?'.modal [data-act="closeModal"]':`[data-act="basis"][data-uid="${gex(GD.s107(),'hacksq').uid}"]`,
    done:()=>!!UI.flags.basisSeen&&!UI.modal,
    auto:()=>{ensureR('prep',GD.s107());UI.flags.basisSeen=true;UI.modal=null;render()}}]},
 {t:'장면 3. 같은 화면에서 계획 고치기',sub:'18:40 · 화면: 수업 준비 (오늘 계획)',
  steps:[
   {say:"40kg에서 16회를 했으니 60kg도 12회를 노려요. 핵스쿼트 본세트 첫 칸 '60kg × 8'을 눌러 횟수를 12로 바꾸고 '아래 세트에도'를 눌러요.",
    at:()=>{const x=gex(GD.s107(),'hacksq');const i=x.sets.findIndex(st=>st.kind!=='warmup');if(isEdit(x,i))return x.sets[i].pr===12?'.editor [data-act="below"]':'.editor [data-on="ev"][data-f="r"]';return `.setchip[data-uid="${x.uid}"][data-i="${i}"]`},
    done:()=>{const w=gex(GD.s107(),'hacksq').sets.filter(st=>st.kind!=='warmup');return w.length>0&&w.every(st=>st.pr===12)},
    auto:()=>{const s=GD.s107(),x=gex(s,'hacksq');const i=x.sets.findIndex(st=>st.kind!=='warmup');setField(s,x,i,'r',12);applyBelow(s,x,i);UI.edit=null;ensureR('prep',s);render()}},
   {say:"워밍업은 한 세트면 된다고 봐요. 워밍업 '45kg × 12'를 눌러 '이 세트 빼기'를 눌러요.",
    at:()=>{const x=gex(GD.s107(),'hacksq');const i=x.sets.findIndex(st=>st.kind==='warmup'&&st.pw===45);if(i<0)return '';return isEdit(x,i)?'.editor [data-act="delSet"]':`.setchip[data-uid="${x.uid}"][data-i="${i}"]`},
    done:()=>!gex(GD.s107(),'hacksq').sets.some(st=>st.kind==='warmup'&&st.pw===45),
    auto:()=>{const x=gex(GD.s107(),'hacksq');const i=x.sets.findIndex(st=>st.kind==='warmup'&&st.pw===45);if(i>=0){x.sets.splice(i,1);x.edited=true}UI.edit=null;render()}},
   {say:"남은 워밍업 '30kg × 12'를 눌러 무게 40, 횟수 8로 고쳐요. 숫자 칸에 바로 써도 되고 −, +를 눌러도 돼요.",
    at:()=>{const x=gex(GD.s107(),'hacksq');const i=x.sets.findIndex(st=>st.kind==='warmup');if(i<0)return '';if(!isEdit(x,i))return `.setchip[data-uid="${x.uid}"][data-i="${i}"]`;return x.sets[i].pw!==40?'.editor [data-on="ev"][data-f="w"]':x.sets[i].pr!==8?'.editor [data-on="ev"][data-f="r"]':'.editor [data-act="closeEdit"]'},
    done:()=>{const w=gex(GD.s107(),'hacksq').sets.filter(st=>st.kind==='warmup');return w.length===1&&w[0].pw===40&&w[0].pr===8},
    auto:()=>{const s=GD.s107(),x=gex(s,'hacksq');const i=x.sets.findIndex(st=>st.kind==='warmup');if(i>=0){setField(s,x,i,'w',40);setField(s,x,i,'r',8)}UI.edit=null;render()}},
   {say:"나머지 종목은 그대로 둬요. 저장 버튼은 없어요. 아래 왼쪽 '계획 약 N분 / 수업 60분'으로 시간이 맞는지 보고, 회원이 오면 '수업 시작 ›'을 눌러요.",
    at:()=>'.actbar [data-to="live"]',
    done:()=>onR('live',GD.s107())||GD.s107().status!=='planned',
    auto:()=>go('live',{sid:GD.s107().id})}]},
 {t:'장면 4. 회원 도착, 컨디션',sub:'19:00 · 화면: 수업 (맨 위 시작 한 장)',
  steps:[
   {say:"컨디션은 모두 '평소'로 골라져 있고, 오른쪽 '오늘 숫자'는 수업 준비에서 정한 그대로예요. 말로 묻고 다른 것만 눌러요. 예로 피로 '나쁨'을 눌러 봐요.",
    at:()=>'[data-act="cond"][data-item="fatigue"][data-v="poor"]',
    done:()=>GD.s107().cond?.fatigue==='poor',
    auto:()=>{const s=GD.s107();ensureR('live',s);s.cond=s.cond||{sleep:'normal',fatigue:'normal',soreness:'normal',pain:'none',painWhere:''};s.cond.fatigue='poor';applyCondition(s);save();render()}},
   {say:"메인·보조 종목 숫자가 주황색으로 바뀌었어요(핵스쿼트 60kg × 12 → × 11). 주황색 핵스쿼트 칸을 눌러 까닭을 읽고 '닫기'. 여유 1개를 더 남기고, 10회가 넘는 세트라 무게 대신 횟수를 1개 줄였다고 나와요.",
    at:()=>{const s=GD.s107(),x=gex(s,'hacksq');if(UI.modal&&UI.modal.type==='adj')return '.modal [data-act="closeModal"]';const i=x.sets.findIndex(st=>adjCls(st));return i<0?'':`.setchip[data-act="adj"][data-uid="${x.uid}"][data-i="${i}"]`},
    done:()=>{const x=gex(GD.s107(),'hacksq');return !!UI.flags.adjLast&&UI.flags.adjLast.startsWith(x.uid+':')&&!UI.modal},
    auto:()=>{const x=gex(GD.s107(),'hacksq');UI.flags.adjLast=x.uid+':'+x.sets.findIndex(st=>st.kind!=='warmup');UI.modal=null;render()}},
   {say:"수첩 10/7에는 평소대로 했으니 피로를 '평소'로 되돌려요. 주황색이 사라지고 원래 숫자로 돌아와요.",
    at:()=>'[data-act="cond"][data-item="fatigue"][data-v="normal"]',
    done:()=>GD.s107().cond?.fatigue==='normal',
    auto:()=>{const s=GD.s107();s.cond.fatigue='normal';applyCondition(s);save();render()}},
   {say:"오른쪽 아래 '시작'을 눌러요.",
    at:()=>'.actbar [data-act="startSession"]',
    done:()=>GD.s107().status!=='planned',
    auto:()=>ACT.startSession({sid:GD.s107().id})}]},
 {t:'장면 5. 수업 1시간, 세트마다 한 번',sub:'19:04~19:55 · 화면: 수업 · 수첩 10/7 칸 그대로',
  steps:[
   {say:"위 띠에 지금 시각, 끝까지 남은 분, 남은 종목 예상 분이 있어요(시연 시계는 세트를 누를 때마다 가요). 이너타이 1세트는 수첩에 30 × 20이에요. 무게 '45'를 눌러 30, 횟수 '20-25'를 눌러 20을 넣어요. 가볍게 시작한 세트라 남은 세트는 그대로예요.",
    at:()=>{const s=GD.s107(),x=gex(s,'inner');return atSets(s,x,[[30,20,'w']])},
    done:()=>isSet(gex(GD.s107(),'inner').sets[0],30,20),
    auto:()=>{const s=GD.s107();liveSet(s,gex(s,'inner'),0,30,20);UI.edit=null;render()}},
   {say:"2세트는 횟수 '20-25'를 눌러 20을 넣고, '+ 세트'로 한 세트 더 넣어 '그대로'를 눌러요(수첩 45 × 20 × 2). 세트 줄에 '쉼 1:15'처럼 쉬는 시간이 저절로 남아요.",
    at:()=>{const s=GD.s107(),x=gex(s,'inner');return atSets(s,x,[[30,20,'w'],[45,20,'r'],[45,20,'same']])},
    done:()=>{const x=gex(GD.s107(),'inner');return isSet(x.sets[1],45,20)&&isSet(x.sets[2],45,20)},
    auto:()=>{const s=GD.s107(),x=gex(s,'inner');liveSet(s,x,1,45,20);liveSet(s,x,2,45,20);UI.edit=null;render()}},
   {say:"'다음 종목: 시티드 레그컬'을 누르고, 수첩대로 1세트 무게를 40으로(40 × 20), 2세트 횟수를 25로(50 × 25) 넣어요.",
    at:()=>{const s=GD.s107();return atSets(s,gex(s,'scurl'),[[40,20,'w'],[50,25,'r']])},
    done:()=>{const x=gex(GD.s107(),'scurl');return isSet(x.sets[0],40,20)&&isSet(x.sets[1],50,25)},
    auto:()=>{const s=GD.s107(),x=gex(s,'scurl');liveSet(s,x,0,40,20);liveSet(s,x,1,50,25);UI.edit=null;render()}},
   {say:"계획 20회보다 5개 더 해서 3세트 횟수가 보라색 25회로 바뀌었어요. 보라색 꼬리표를 눌러 까닭을 읽고 '닫기'. 10회가 넘는 세트라 무게는 그대로 두고 횟수만 맞췄어요.",
    at:()=>{const s=GD.s107();return atAdj(s,gex(s,'scurl'),2)},
    done:()=>adjSeen(gex(GD.s107(),'scurl'),2)||gex(GD.s107(),'scurl').sets[2]?.done,
    auto:()=>{UI.flags.adjLast=gex(GD.s107(),'scurl').uid+':2';UI.modal=null;render()}},
   {say:"3세트 '그대로'를 눌러요. 바뀐 숫자 50 × 25로 끝나요.",
    at:()=>{const s=GD.s107();return atSets(s,gex(s,'scurl'),[[40,20,'w'],[50,25,'r'],[50,25,'same']])},
    done:()=>isSet(gex(GD.s107(),'scurl').sets[2],50,25),
    auto:()=>{const s=GD.s107();liveSet(s,gex(s,'scurl'),2,50,25);render()}},
   {say:"'다음 종목: 핵스쿼트'. 수첩은 \"40kg x 8, 60kg. x 12 x 3\", \"2set에서 1개를 실패\"예요. 워밍업 '그대로', 1세트 '그대로', 2세트는 횟수를 눌러 11을 넣어요. 1개 차이라 3세트는 그대로예요.",
    at:()=>{const s=GD.s107();return atSets(s,gex(s,'hacksq'),[[40,8,'same'],[60,12,'same'],[60,11,'r']])},
    done:()=>{const x=gex(GD.s107(),'hacksq');return isSet(x.sets[0],40,8)&&isSet(x.sets[1],60,12)&&isSet(x.sets[2],60,11)},
    auto:()=>{const s=GD.s107(),x=gex(s,'hacksq');liveSet(s,x,0,40,8);liveSet(s,x,1,60,12);liveSet(s,x,2,60,11);UI.edit=null;render()}},
   {say:"판단 A: 회원이 힘들어해 쉬는 시간을 2분 30초에서 5분 넘게 늘려요. 앱에는 아무것도 안 눌러도 되지만, 시연에서는 시간이 지난 것을 보여 주려고 위 띠의 '시연 시계 +5분'을 눌러요.",
    at:()=>'[data-act="plusFive"]',
    done:()=>(GD.s107().extraRest||0)>=5||!!gex(GD.s107(),'hacksq').sets[3]?.done,
    auto:()=>ACT.plusFive({sid:GD.s107().id})},
   {say:"3세트 '그대로'. 세트 줄에 '쉼 7:30'이 노란색으로 남아요(계획의 2배 넘게 쉼). 오래 쉰 만큼 위 띠가 빨개졌어요: 남은 분이 남은 종목 예상 + 마무리 5분보다 5분 넘게 남지 않아요. 뒤쪽 레그 익스텐션에 '뺄 수 있음'이 붙어요.",
    at:()=>{const s=GD.s107();return atSets(s,gex(s,'hacksq'),[[40,8,'same'],[60,12,'same'],[60,11,'r'],[60,12,'same']])},
    done:()=>isSet(gex(GD.s107(),'hacksq').sets[3],60,12),
    auto:()=>{const s=GD.s107();liveSet(s,gex(s,'hacksq'),3,60,12);render()}},
   {say:"판단 B: 수첩에서 레그프레스는 지우고 원레그 핵프레스를 했어요. '다음 종목: 레그프레스' → '…' → '바꾸기' → '원레그 핵프레스' → '오늘만'인 채로 '바꾸기'.",
    at:()=>{const s=GD.s107(),x=gex(s,'legpress');return atMenu(s,x,'swap',()=>UI.modal.to==='olhack'?(UI.modal.scope==='template'?'.modal [data-act="pickScope"][data-v="today"]':'.modal [data-act="doSwap"]'):'.modal [data-act="pickSwap"][data-v="olhack"]')},
    done:()=>GD.s107().exercises.find(e=>e.exId==='legpress').status==='swapped',
    auto:()=>{const s=GD.s107();ensureR('live',s);const x=s.exercises.find(e=>e.exId==='legpress');if(x.status!=='swapped'){const y=swapExercise(s,x,'olhack','today');UI.cur[s.id]=y.uid}UI.modal=null;showAsk({sid:s.id,uid:x.uid,kind:'swap'})}},
   {say:"아래에 이유 칩이 5초 떠요. 수첩에 이유는 없어서 예로 '컨디션'을 눌러요. 안 누르면 '이유 없음'으로 남고 그냥 사라져요.",
    at:()=>atAsk('컨디션'),
    done:()=>{const x=GD.s107().exercises.find(e=>e.exId==='legpress');return x.reason==='컨디션'||!UI.ask},
    auto:()=>{const s=GD.s107();s.exercises.find(e=>e.exId==='legpress').reason='컨디션';UI.ask=null;save();render()}},
   {say:"원레그 핵프레스는 처음이라 무게가 비어 있고 꼬리표가 '무게 찾기'예요. 1세트 무게를 눌러 20을 넣어요(예시, 수첩에는 숫자가 없어요). 남은 두 세트 무게가 보라색 20으로 채워져요.",
    at:()=>{const s=GD.s107(),x=gex(s,'olhack');return x?atLive(s,x,0,'w'):''},
    done:()=>{const x=gex(GD.s107(),'olhack');return !!x&&x.sets[0]?.done&&x.sets[0].aw===20},
    auto:()=>{const s=GD.s107(),x=gex(s,'olhack');UI.cur[s.id]=x.uid;setField(s,x,0,'w',20);UI.edit=null;render()}},
   {say:"한쪽씩 하느라 오래 걸렸다고 보고 '시연 시계 +5분'을 한 번 더 누른 뒤(예시), 2세트와 3세트 '그대로'를 눌러요.",
    at:()=>{const s=GD.s107(),x=gex(s,'olhack');if(!x.sets[1]?.done&&(s.extraRest||0)<5)return '[data-act="plusFive"]';return atSets(s,x,[[20,10,'w'],[20,10,'same'],[20,10,'same']])},
    done:()=>{const x=gex(GD.s107(),'olhack');return isSet(x.sets[1],20,10)&&isSet(x.sets[2],20,10)},
    auto:()=>{const s=GD.s107(),x=gex(s,'olhack');if(!x.sets[1].done)ACT.plusFive({sid:s.id});liveSet(s,x,1,20,10);liveSet(s,x,2,20,10);UI.edit=null;render()}},
   {say:"판단 C: 원레그도 오래 걸려 남은 시간은 10분이에요. 위 띠는 여전히 빨갛고, 다음 줄 레그 익스텐션에 '뺄 수 있음'이 붙어 있어요. 앱이 빼지는 않아요. 레그 익스텐션으로 가서 '…' → '빼기'를 눌러요.",
    at:()=>{const s=GD.s107();return atRemove(s,gex(s,'legext'))},
    done:()=>gex(GD.s107(),'legext').status==='removed',
    auto:()=>{const s=GD.s107(),x=gex(s,'legext');ensureR('live',s);UI.cur[s.id]=x.uid;ACT.removeNow({sid:s.id,uid:x.uid})}},
   {say:"시간이 모자란 때라 이유 칩 '시간'이 미리 골라져 있어요. 그대로 두면 돼요. 카드 아래 '수업 메모'에 \"쉬는 시간이 너무 필요하다.\"를 적어요(수첩 그대로).",
    at:()=>'[data-on="sMemo"]',
    done:()=>/쉬는 시간/.test(GD.s107().memo||''),
    auto:()=>{GD.s107().memo='쉬는 시간이 너무 필요하다.';save();render()}},
   {say:"위쪽 '마무리'를 눌러요.",
    at:()=>'.top [data-to="summary"]',
    done:()=>onR('summary',GD.s107())||GD.s107().status==='completed',
    auto:()=>go('summary',{sid:GD.s107().id})}]},
 {t:'장면 6. 수업 직후 1분, 마무리',sub:'19:55 · 화면: 마무리',
  steps:[
   {say:"2번에 달라진 곳과 '핵스쿼트 3세트 앞 쉼 약 7:30'이 있어요. 4번 '다음 하체 초안'에서 시티드 레그컬에 '목표 넘음'이 붙었어요(세 세트 모두 계획 20회 이상). 표시만 하고 올리지는 않아요. 트레이너가 '올리기 +2.5'를 눌러요.",
    at:()=>'[data-act="raiseNext"][data-ex="scurl"]',
    done:()=>!!(ensureNext(GD.s107()).targets.scurl||{}).raised,
    auto:()=>{const s=GD.s107();ensureR('summary',s);ACT.raiseNext({sid:s.id,ex:'scurl'})}},
   {say:"다음 목표 52.5 × 25가 들어왔어요. 수첩에서는 다음 하체에 60으로 올렸으니 무게 칸을 60으로 고쳐요. 핵스쿼트는 2세트 11회라 '목표 넘음'이 없어요. 그대로 둬요.",
    at:()=>'[data-on="nt"][data-ex="scurl"][data-f="w"]',
    done:()=>(ensureNext(GD.s107()).targets.scurl||{}).w===60,
    auto:()=>{const t=ensureNext(GD.s107()).targets.scurl;t.w=60;save();render()}},
   {say:"레그 익스텐션은 '시간' 때문에 뺐으니 다음 하체에 다시 들어간다고 적혀 있어요. 6번 다음에 확인할 것에 '원레그 핵프레스 시작 무게 다시 보기'를 적고 '넣기'(예시).",
    at:()=>/원레그/.test(UI.draft['nCheck-m3']||'')?'[data-act="addNote"][data-kind="check"]':'[data-d="nCheck-m3"]',
    done:()=>checks(GD.m()).some(n=>/원레그/.test(n.text)),
    auto:()=>{GD.m().notes.push({id:uid('n'),kind:'check',text:'원레그 핵프레스 시작 무게 다시 보기',created:'2026-10-07',done:false});save();render()}},
   {say:"5번 다음 PT 날짜를 10/8 (목)로 바꿔요. 분할은 순서상 다음인 밀기예요(수첩에서도 다음 날 밀기).",
    at:()=>'[data-on="np"][data-f="date"]',
    done:()=>{const np=ensureNext(GD.s107()).np;return np.on&&np.date==='2026-10-08'&&np.tid==='t3b'},
    auto:()=>{const np=ensureNext(GD.s107()).np;Object.assign(np,{on:true,date:'2026-10-08',tid:'t3b'});save();render()}},
   {say:"'끝내기'. 오늘 화면으로 돌아가고, 10/8 밀기 수업 준비가 미리 채워져요.",
    at:()=>'.actbar [data-act="finish"]',
    done:()=>GD.s107().status==='completed',
    auto:()=>ACT.finish({sid:GD.s107().id})}]},
 {t:'장면 7. 다음 하체, 이어지는 숫자',sub:'10/12 (월) → 10/14 (수) · 수첩 10/14 칸 그대로',
  enter(){seedLater('2026-10-08');seedLater('2026-10-09');if(!GD.sLeg())createPlanned(GD.m(),'2026-10-12','19:00','t3a');S.today='2026-10-12';seedOthers(S.today);save();home('today')},
  steps:[
   {say:"10/12 (월)이에요. 10/8 밀기와 10/9 후면사슬은 수첩 기록으로 채워 뒀어요. 회원이 미루자고 해요(예시). 이00_3 줄 '…' → '옮기기'.",
    at:()=>UI.modal&&UI.modal.type==='sessMenu'?'.modal [data-type="schedule"]':`.srow[data-sid="${GD.sLeg().id}"] .more`,
    done:()=>UI.modal&&UI.modal.type==='schedule'||GD.sLeg().date!=='2026-10-12',
    auto:()=>{home('today');UI.modal={type:'schedule',mid:'m3',sid:GD.sLeg().id};render()}},
   {say:"날짜를 10/14로 고르고 '옮기기'. 날짜만 바뀌고 계획은 그대로예요.",
    at:()=>UI.modal&&UI.modal.type==='schedule'?((UI.draft['sc-d']||'')==='2026-10-14'?'.modal [data-act="saveSchedule"]':'.modal [data-d="sc-d"]'):'',
    done:()=>GD.sLeg().date==='2026-10-14',
    auto:()=>{GD.sLeg().date='2026-10-14';UI.modal=null;save();render()}},
   {say:"위 '›'를 두 번 눌러 시연 날짜를 10/14 (수)로 넘겨요.",
    at:()=>'.top [data-act="shiftDay"][data-dir="1"]',
    done:()=>todayIso()>='2026-10-14',
    auto:()=>{S.today='2026-10-14';save();home('today')}},
   {say:"이00_3 줄을 눌러 수업 준비를 열어요. 시티드 레그컬은 10/7에 올린 '목표 10/7' 60 × 25, 핵스쿼트는 10/7 실제값, 레그 익스텐션은 다시 들어와 있어요. 위 띠에 10/7 메모와 '원레그 핵프레스 시작 무게 다시 보기'가 떠요.",
    at:()=>`[data-act="openSession"][data-sid="${GD.sLeg().id}"]`,
    done:()=>onR('prep',GD.sLeg())||GD.sLeg().status!=='planned',
    auto:()=>go('prep',{sid:GD.sLeg().id})},
   {say:"수첩 10/14에는 이너타이가 없어요. 이너타이 줄 '…' → '빼기', 이유 칩 '기타'.",
    at:()=>{const s=GD.sLeg(),x=gex(s,'inner');return x.status==='removed'?atAsk('기타'):atRemove(s,x)},
    done:()=>{const x=gex(GD.sLeg(),'inner');return x.status==='removed'&&(x.reason==='기타'||!UI.ask)},
    auto:()=>{const s=GD.sLeg(),x=gex(s,'inner');ensureR('prep',s);removeExercise(s,x,'기타');UI.ask=null;UI.modal=null;save();render()}},
   {say:"레그프레스 줄 '…' → '바꾸기' → '원레그 핵프레스' → 이번에는 '루틴 틀에도' → '바꾸기'. 숫자는 10/7에 한 20 × 10으로 채워져요.",
    at:()=>{const s=GD.sLeg();return atMenu(s,s.exercises.find(e=>e.exId==='legpress'),'swap',()=>UI.modal.to!=='olhack'?'.modal [data-act="pickSwap"][data-v="olhack"]':UI.modal.scope!=='template'?'.modal [data-act="pickScope"][data-v="template"]':'.modal [data-act="doSwap"]')},
    done:()=>{const x=GD.sLeg().exercises.find(e=>e.exId==='legpress');return x.status==='swapped'&&x.scope==='template'},
    auto:()=>{const s=GD.sLeg();ensureR('prep',s);const x=s.exercises.find(e=>e.exId==='legpress');if(x.status!=='swapped')swapExercise(s,x,'olhack','template');UI.modal=null;UI.ask=null;render()}},
   {say:"'수업 시작 ›'을 누르고, 컨디션은 그대로 두고 '시작'.",
    at:()=>UI.route.name==='live'?'.actbar [data-act="startSession"]':'.actbar [data-to="live"]',
    done:()=>GD.sLeg().status!=='planned',
    auto:()=>{UI.ask=null;ACT.startSession({sid:GD.sLeg().id})}},
   {say:"시티드 레그컬은 수첩에 50x20, 60x25x2예요. 1세트를 50 × 20으로 고치고(가볍게 시작, 남은 세트는 그대로), 2·3세트는 '그대로'.",
    at:()=>{const s=GD.sLeg();return atSets(s,gex(s,'scurl'),[[50,20,'w'],[60,25,'same'],[60,25,'same']])},
    done:()=>{const x=gex(GD.sLeg(),'scurl');return isSet(x.sets[0],50,20)&&isSet(x.sets[1],60,25)&&isSet(x.sets[2],60,25)},
    auto:()=>{const s=GD.sLeg(),x=gex(s,'scurl');liveSet(s,x,0,50,20);liveSet(s,x,1,60,25);liveSet(s,x,2,60,25);UI.edit=null;render()}},
   {say:"핵스쿼트는 수첩에 \"40 x 23reps, 60kg.\"이에요. 워밍업 횟수를 23으로 고치고, 본세트는 '그대로' 세 번(본세트 횟수는 수첩에 없어 예시).",
    at:()=>{const s=GD.sLeg(),x=gex(s,'hacksq');const want=[[40,23,'r']].concat(x.sets.slice(1).map(st=>[st.pw,st.pr,'same']));return atSets(s,x,want)},
    done:()=>{const x=gex(GD.sLeg(),'hacksq');return isSet(x.sets[0],40,23)&&x.sets.every(st=>st.done)},
    auto:()=>{const s=GD.sLeg(),x=gex(s,'hacksq');liveSet(s,x,0,40,23);x.sets.forEach((st,i)=>{if(!st.done)liveSet(s,x,i,null,null)});UI.edit=null;render()}},
   {say:"원레그 핵프레스는 수첩에 \"20 x 4\"(20회 × 4세트로 본 해석)예요. 1세트 횟수를 20으로 넣으면, 계획 10회보다 10개 더 해서 남은 세트가 보라색 22.5 × 10으로 바뀌어요. 앱 제안일 뿐이에요. 수첩대로 2세트를 20 × 20으로 고쳐요.",
    at:()=>{const s=GD.sLeg();return atSets(s,gex(s,'olhack'),[[20,20,'r'],[20,20,'w']])},
    done:()=>{const x=gex(GD.sLeg(),'olhack');return isSet(x.sets[0],20,20)&&isSet(x.sets[1],20,20)},
    auto:()=>{const s=GD.sLeg(),x=gex(s,'olhack');liveSet(s,x,0,20,20);liveSet(s,x,1,20,20);UI.edit=null;render()}},
   {say:"3세트는 '원래 숫자로' 돌아가 20 × 10이에요. 3세트를 20 × 20으로 고치고, '+ 세트' → '그대로'로 4세트를 채워요.",
    at:()=>{const s=GD.sLeg();return atSets(s,gex(s,'olhack'),[[20,20,'r'],[20,20,'w'],[20,20,'r'],[20,20,'same']])},
    done:()=>{const x=gex(GD.sLeg(),'olhack');return [0,1,2,3].every(i=>isSet(x.sets[i],20,20))},
    auto:()=>{const s=GD.sLeg(),x=gex(s,'olhack');[2,3].forEach(i=>liveSet(s,x,i,20,20));UI.edit=null;render()}},
   {say:"레그 익스텐션은 수첩에 30x25x2예요. 횟수를 25로 고치고 '+ 세트' → '그대로'.",
    at:()=>{const s=GD.sLeg();return atSets(s,gex(s,'legext'),[[30,25,'r'],[30,25,'same']])},
    done:()=>{const x=gex(GD.sLeg(),'legext');return isSet(x.sets[0],30,25)&&isSet(x.sets[1],30,25)},
    auto:()=>{const s=GD.sLeg(),x=gex(s,'legext');liveSet(s,x,0,30,25);liveSet(s,x,1,30,25);UI.edit=null;render()}},
   {say:"'마무리'. 이너타이를 '기타'로 뺐으니 '루틴 틀도 고칠까요?'가 떠요. '예, 오늘 것으로'.",
    at:()=>UI.route.name==='summary'?'[data-act="tplAnswer"][data-v="yes"]':'.top [data-to="summary"]',
    done:()=>GD.sLeg().tplAnswer==='yes',
    auto:()=>{const s=GD.sLeg();ensureR('summary',s);answerTemplate(s,'yes');save();render()}},
   {say:"다음 PT를 10/15 (목) 밀기로 두고 '끝내기'.",
    at:()=>ensureNext(GD.sLeg()).np.date!=='2026-10-15'?'[data-on="np"][data-f="date"]':'.actbar [data-act="finish"]',
    done:()=>GD.sLeg().status==='completed',
    auto:()=>{const s=GD.sLeg();Object.assign(ensureNext(s).np,{on:true,date:'2026-10-15',tid:'t3b'});ACT.finish({sid:s.id})}}]},
 {t:'장면 8. 추이 보고 훈련 방향 정하기',sub:'10/16 (금) · 화면: 회원 한눈에 → 추이',
  enter(){seedLater('2026-10-15');seedLater('2026-10-16');S.today='2026-10-16';seedOthers(S.today);UI.cur['trend-m3']='hacksq';save();home('today')},
  steps:[
   {say:"몇 주에 한 번은 회원별로 흐름을 봐요. 10/15 밀기와 10/16 당기기는 수첩 기록으로 채워 뒀어요. 아래 '회원' 탭을 누르고 이00_3을 눌러요.",
    at:()=>UI.route.name==='members'?'[data-to="member"][data-mid="m3"]':'.tabbar [data-v="members"]',
    done:()=>UI.route.name==='member'&&UI.route.mid==='m3'||UI.route.name==='trend',
    auto:()=>{home('members');go('member',{mid:'m3'})}},
   {say:"회원 한눈에는 병원 차트 화면처럼 위에 요약 줄, 왼쪽에 수업 이력, 가운데에 다음 PT·주의사항·확인할 것·목표와 최근 수업 5회 표(10/16 메모 포함), 오른쪽에 월별 수업 그래프와 메인 종목 무게 그래프가 있어요. 위 '추이'를 눌러요.",
    at:()=>'.top [data-to="trend"]',
    done:()=>UI.route.name==='trend',
    auto:()=>go('trend',{mid:'m3'})},
   {say:"핵스쿼트가 골라져 있어요. 8/24 20kg, 8/31~9/22 40kg, 10/7·10/14 60kg이에요. 점을 눌러 그날 숫자와 수첩 원문을 봐요.",
    at:()=>'.chart [data-act="trendPt"]:last-of-type',
    done:()=>UI.cur['trendPt-m3']!=null,
    auto:()=>{ensureR('trend');UI.cur['trendPt-m3']=0;render()}},
   {say:"10/16 메모 \"라잉 레그컬과 워킹 런지를 통한 심박수 + 체중감량 고려.\"를 보고, 위 '훈련 방향 바꾸기'에서 방향 하나와 시작일을 골라 저장해요. 무엇을 고를지는 수첩에 없어 트레이너가 정해요('대신 하기'는 예시로 조절을 골라요). 앱은 원인을 판단하지 않고 데이터만 보여 줘요.",
    at:()=>UI.modal&&UI.modal.type==='block'?'.modal [data-act="saveBlock"]':'.top [data-type="block"]',
    done:()=>GD.m().blocks.length>0,
    auto:()=>{GD.m().blocks.push({dir:'조절',focus:'심박수·체중감량 (예시)',start:'2026-10-19'});UI.modal=null;save();render()}}]}
];


/* ---------- v4 시나리오 (2026-11-05, D78): 장면 다섯, 장면마다 상황·왜·할 일 1~4개. 숫자 판단(세트·무게·횟수)에만 집중 ---------- */
function runOld(k,from,to){const sc=OLD[k];for(let i=from;i<(to??sc.steps.length);i++){const st=sc.steps[i];let ok=false;try{ok=st.done()}catch(e){}if(!ok)st.auto()}}
const reuse=(k,i,say)=>({...OLD[k].steps[i],say});
const SCENES=[
 {t:'1. 수업 전: 오늘 숫자 정하기',sub:'10/7 (수) 18:30 · 화면: 오늘 숫자 정하기',
  sit:"19시에 이00_3 회원 하체 수업이 있어요. 지난 수업은 13일 전이에요. 지난 하체(9/22)에 핵스쿼트 40kg으로 16회를 해서 수첩에 \"60kg 도전 예정\"이라고 적어 뒀어요.",
  why:"오늘 몇 kg로 몇 회, 몇 세트 할지를 기억이 아니라 지난 기록으로 정하려고요. 앱이 근거를 붙여 숫자를 먼저 채우고, 정하는 건 트레이너예요.",
  enter(){S.today='2026-10-07';save();home('today')},
  steps:[
   reuse(0,1,"'오늘' 화면에서 '19:00 · 이00_3 · 하체' 줄을 눌러요."),
   {say:"핵스쿼트 줄을 봐요. 지난번 40kg × 16, 12 → 판단 '무게 ↑' → 오늘 60kg. 아래 근거 줄의 '계산 보기 ›'를 눌러 왜 이 숫자인지 읽고 '닫기'.",
    at:()=>UI.modal&&UI.modal.type==='basis'?'.modal [data-act="closeModal"]':`.linkbtn[data-uid="${gex(GD.s107(),'hacksq').uid}"]`,
    done:()=>UI.flags.basisLast===gex(GD.s107(),'hacksq').uid&&!UI.modal,
    auto:()=>{ensureR('prep',GD.s107());UI.flags.basisLast=gex(GD.s107(),'hacksq').uid;UI.modal=null;render()}},
   reuse(2,0,"트레이너 판단: 40kg에서 16회를 했으니 60kg도 12회를 노려요. 본세트 첫 칸 '60kg × 8'을 눌러 횟수를 12로 바꾸고 '아래 세트에도'를 눌러요."),
   {say:"나머지는 앱이 채운 숫자 그대로 둬요. 워밍업은 수첩대로 40kg × 8 한 세트로 맞춰 둘게요. '수업 시작 ›'을 눌러요.",
    at:()=>'.actbar [data-to="live"]',
    done:()=>onR('live',GD.s107())||GD.s107().status!=='planned',
    auto:()=>{runOld(2,1,3);go('live',{sid:GD.s107().id})}}]},
 {t:'2. 회원 도착: 컨디션 반영',sub:'19:00 · 화면: 수업 시작',
  sit:"회원이 와서 \"어제 야근해서 좀 피곤해요\"라고 해요. (가정: 수첩에는 없는 말이에요.)",
  why:"같은 계획이라도 피곤한 날은 여유를 더 남겨야 해요. 앱이 어느 숫자를 얼마나, 왜 줄였는지 보여 주고, 받을지는 트레이너가 정해요.",
  enter(){const s=GD.s107();runOld(2,1,3);UI.edit=null;ensureR('live',s)},
  steps:[
   reuse(3,0,"피로 '나쁨'을 눌러요."),
   reuse(3,1,"오른쪽 숫자가 주황색으로 바뀌었어요(핵스쿼트 60kg × 12 → × 11). 주황색 핵스쿼트 칸을 눌러 까닭을 읽고 '닫기'."),
   reuse(3,2,"수첩 10/7에는 평소 숫자로 했으니 피로를 '평소'로 되돌려요. 숫자가 원래대로 돌아와요."),
   reuse(3,3,"'시작'을 눌러요.")]},
 {t:'3. 수업 중: 남은 세트 다시 정하기',sub:'19:15 · 화면: 수업 중',
  sit:"이너타이는 끝났어요(수첩대로 채워 뒀어요). 지금은 시티드 레그컬이에요. 계획은 50kg × 20회인데, 수첩을 보면 1세트는 40kg × 20, 2세트는 50kg으로 25회를 했어요.",
  why:"계획보다 잘되거나 안 되면 남은 세트 숫자를 그 자리에서 다시 맞춰야 해요. 앱이 근거와 함께 바꿔 보여 주고, 트레이너는 그대로 하거나 고쳐요.",
  enter(){const s=GD.s107();if(s.status==='planned')ACT.startSession({sid:s.id});runOld(4,0,2);UI.edit=null;UI.cur[s.id]=gex(s,'scurl').uid;render()},
  steps:[
   reuse(4,2,"시티드 레그컬 1세트 무게를 40으로(40 × 20), 2세트 횟수를 25로(50 × 25) 넣어요."),
   reuse(4,3,"계획보다 5개 더 해서 3세트가 보라색 25회로 바뀌었어요. 보라색 꼬리표를 눌러 까닭을 읽고 '닫기'."),
   reuse(4,4,"3세트 '그대로'를 눌러요. 바뀐 숫자 50 × 25로 끝나요.")]},
 {t:'4. 수업 끝: 다음 수업 숫자',sub:'19:55 · 화면: 마무리',
  sit:"나머지 종목도 수첩대로 끝났어요. 핵스쿼트는 2세트에서 1개를 실패했고, 레그프레스는 원레그 핵프레스로 바꿨고, 레그 익스텐션은 시간이 없어 뺐어요.",
  why:"오늘 결과가 다음 수업의 출발 숫자가 돼요. 목표를 넘은 종목은 앱이 '목표 넘음'으로 알려 주고, 올릴지는 트레이너가 정해요.",
  enter(){runOld(4,5);UI.ask=null;const s=GD.s107();ensureR('summary',s);OLD[5].steps[3].auto();render()},
  steps:[
   reuse(5,0,"'다음 하체 초안'에서 시티드 레그컬에 '목표 넘음'이 붙었어요(세 세트 모두 계획 20회 이상). '올리기 +2.5'를 눌러요."),
   reuse(5,1,"다음 목표 52.5 × 25가 들어왔어요. 수첩에서는 다음 하체에 60kg으로 올렸으니 무게 칸을 60으로 고쳐요."),
   {say:"다음 PT는 10/8 밀기로 잡아 뒀어요. '끝내기'를 눌러요.",at:OLD[5].steps[4].at,done:OLD[5].steps[4].done,auto:OLD[5].steps[4].auto}]},
 {t:'5. 다음 하체: 숫자가 이어져요',sub:'10/14 (수) · 화면: 오늘 숫자 정하기',
  sit:"일주일 뒤 10/14 (수) 하체예요. 그 사이 밀기·후면사슬 수업은 수첩 기록으로 채워 뒀어요.",
  why:"지난번 끝에 정한 다음 목표가 오늘 숫자로 그대로 들어와요. 트레이너는 근거 줄에서 어디서 온 숫자인지만 확인하면 돼요.",
  enter(){OLD[6].enter();runOld(6,0,3);UI.modal=null;home('today');go('prep',{sid:GD.sLeg().id})},
  steps:[
   {say:"시티드 레그컬 근거가 '10/7 수업 끝에 정한 다음 목표'예요(60kg × 25). '계산 보기 ›'를 눌러 확인하고 '닫기'.",
    at:()=>UI.modal&&UI.modal.type==='basis'?'.modal [data-act="closeModal"]':`.linkbtn[data-uid="${gex(GD.sLeg(),'scurl').uid}"]`,
    done:()=>UI.flags.basisLast===gex(GD.sLeg(),'scurl').uid&&!UI.modal,
    auto:()=>{ensureR('prep',GD.sLeg());UI.flags.basisLast=gex(GD.sLeg(),'scurl').uid;UI.modal=null;render()}},
   {say:"핵스쿼트는 10/7 실제값 60kg × 12, 11, 12에서 왔어요. 판단 칸이 '유지'예요. 올릴지 말지는 트레이너가 숫자를 눌러 정해요. 여기서는 그대로 두고 '확인했어요'를 눌러요.",
    at:()=>'#guide [data-g="ack"]',
    done:()=>!!UI.flags.ack5,
    auto:()=>{UI.flags.ack5=true;render()}}],
  end:"한 바퀴 끝이에요: 지난 기록 → 오늘 숫자(근거) → 컨디션·세트 결과로 다시 맞추기 → 다음 수업 숫자."}
];
/* ---------- 장면 옮기기 ---------- */
function runAuto(st){try{st.auto();return true}catch(e){console.error(e);return false}}
function finishScene(k){const sc=SCENES[k];for(let i=(k===G.scene?G.step:0);i<sc.steps.length;i++){const st=sc.steps[i];let ok=false;try{ok=st.done()}catch(e){}if(!ok&&!runAuto(st))return false}return true}
function enterScene(k){G.scene=k;G.step=0;G.lastAt='';if(SCENES[k].enter)SCENES[k].enter()}
function gotoScene(k){
  G.busy=true; let ok=true;
  try{
    if(k>G.scene){ ok=finishScene(G.scene); for(let j=G.scene+1;ok&&j<k;j++){enterScene(j);ok=finishScene(j)} }
    if(!ok||k<=G.scene){ resetAll(); for(let j=0;j<k;j++){enterScene(j);if(!finishScene(j))break} }
    enterScene(k);
  }catch(e){console.error(e)}
  G.busy=false; saveView(); render();
}
function guideClick(ev){
  const el=ev.target.closest('[data-g]'); if(!el) return; const a=el.dataset.g;
  if(a==='ack'){UI.flags.ack5=true;render();return}
  if(a==='close'){G.open=false;saveView();fit();render();return}
  if(a==='scene'){gotoScene(+el.dataset.k);return}
  if(a==='restart'){gotoScene(G.scene);return}
  if(a==='auto'){const st=SCENES[G.scene].steps[G.step];if(st){G.busy=true;const ok=runAuto(st);G.busy=false;if(!ok)toast('이 단계를 대신 하지 못했어요. 장면을 처음부터 다시 해 보세요.');render()}return}
  if(a==='next'){if(G.scene<SCENES.length-1)gotoScene(G.scene+1);return}
}

/* ---------- 그릴 때마다: 단계 넘기기, 짚을 곳 표시, 옆 칸 그리기 ---------- */
let gT=null;
function guideSoon(){if(G.busy)return;clearTimeout(gT);gT=setTimeout(guideAfter,0)}
function guideAfter(){
  if(G.busy||!S) return;
  const sc=SCENES[G.scene]; const box=document.getElementById('guide'); if(!sc||!box) return;
  const before=G.step;
  while(G.step<sc.steps.length){let ok=false;try{ok=sc.steps[G.step].done()}catch(e){}if(!ok)break;G.step++}
  if(G.step!==before) saveView();
  const app=document.getElementById('app');
  app.querySelectorAll('.hl').forEach(e=>e.classList.remove('hl'));
  const cur=sc.steps[G.step];
  if(G.open&&cur){let sel='';try{sel=cur.at()}catch(e){}
    if(sel){const el=app.querySelector(sel);if(el){el.classList.add('hl');const key=G.scene+'.'+G.step+'.'+sel;if(key!==G.lastAt){G.lastAt=key;try{el.scrollIntoView({block:'nearest'})}catch(e){}}}}}
  document.getElementById('b-guide').textContent=G.open?'시나리오 닫기':'시나리오 열기';
  box.classList.toggle('open',G.open);
  if(!G.open){box.innerHTML='';return}
  const last=G.scene===SCENES.length-1;
  box.innerHTML=`<div class="g-head"><b>시나리오 따라 하기</b><span class="sp"></span><button class="btn small ghost" data-g="close">닫기</button></div>
   <div class="g-scenes">${SCENES.map((x,k)=>`<button class="chip${k===G.scene?' on':''}" data-g="scene" data-k="${k}" title="${esc(x.t)}">${k+1}</button>`).join('')}</div>
   <div class="g-title">${esc(sc.t)}</div><div class="tiny muted">${esc(sc.sub)}</div>
   ${sc.sit?`<div class="g-box"><b>상황</b> ${esc(sc.sit)}</div><div class="g-box why"><b>왜 하나요</b> ${esc(sc.why)}</div>`:''}
   <div class="tiny muted" style="margin-top:8px"><b>할 일</b></div><ol class="g-steps">${sc.steps.map((st,i)=>`<li class="${i<G.step?'done':i===G.step?'cur':''}">${esc(st.say)}${i===G.step&&/확인했어요/.test(st.say)?` <button class="btn small primary" data-g="ack">확인했어요</button>`:''}</li>`).join('')}</ol>
   ${cur?`<div class="row"><span class="tiny muted">노란 테두리를 눌러요.</span><span class="sp"></span><button class="btn small" data-g="auto">이 단계 대신 하기</button></div>`
     :`<div class="g-done">${sc.end?esc(sc.end):last?'시나리오 끝이에요.':'이 장면은 끝났어요.'}</div>`}
   <div class="row" style="margin-top:10px">${last?'':`<button class="btn${cur?'':' primary'}" data-g="next">다음 장면 ›</button>`}<span class="sp"></span><button class="btn small ghost" data-g="restart">이 장면 처음부터</button></div>
   <div class="g-foot">숫자는 트레이너 수첩 그대로이고, 수첩에 없는 말·값은 (가정)·(예시)로 적었어요. 장면 번호를 누르면 그 장면부터 할 수 있어요.</div>`;
}
