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
  return `input.numin[data-uid="${x.uid}"][data-i="${i}"][data-f="${f}"]`;
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
    at:()=>{const x=gex(GD.s107(),'hacksq');const i=x.sets.findIndex(st=>st.kind!=='warmup');if(isEdit(x,i))return x.sets[i].pr===12?'.chipedit [data-act="below"]':'.chipedit [data-on="ev"][data-f="r"]';return `.setchip[data-uid="${x.uid}"][data-i="${i}"]`},
    done:()=>{const w=gex(GD.s107(),'hacksq').sets.filter(st=>st.kind!=='warmup');return w.length>0&&w.every(st=>st.pr===12)},
    auto:()=>{const s=GD.s107(),x=gex(s,'hacksq');const i=x.sets.findIndex(st=>st.kind!=='warmup');setField(s,x,i,'r',12);applyBelow(s,x,i);UI.edit=null;ensureR('prep',s);render()}},
   {say:"워밍업은 한 세트면 된다고 봐요. 워밍업 '45kg × 12'를 눌러 '이 세트 빼기'를 눌러요.",
    at:()=>{const x=gex(GD.s107(),'hacksq');const i=x.sets.findIndex(st=>st.kind==='warmup'&&st.pw===45);if(i<0)return '';return isEdit(x,i)?'.chipedit [data-act="delSet"]':`.setchip[data-uid="${x.uid}"][data-i="${i}"]`},
    done:()=>!gex(GD.s107(),'hacksq').sets.some(st=>st.kind==='warmup'&&st.pw===45),
    auto:()=>{const x=gex(GD.s107(),'hacksq');const i=x.sets.findIndex(st=>st.kind==='warmup'&&st.pw===45);if(i>=0){x.sets.splice(i,1);x.edited=true}UI.edit=null;render()}},
   {say:"남은 워밍업 '30kg × 12'를 눌러 무게 40, 횟수 8로 고쳐요. 숫자 칸에 바로 써도 되고 −, +를 눌러도 돼요.",
    at:()=>{const x=gex(GD.s107(),'hacksq');const i=x.sets.findIndex(st=>st.kind==='warmup');if(i<0)return '';if(!isEdit(x,i))return `.setchip[data-uid="${x.uid}"][data-i="${i}"]`;return x.sets[i].pw!==40?'.chipedit [data-on="ev"][data-f="w"]':x.sets[i].pr!==8?'.chipedit [data-on="ev"][data-f="r"]':'.chipedit [data-act="closeEdit"]'},
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
   {say:"위 띠에 지금 시각, 끝까지 남은 분, 남은 종목 예상 분이 있어요(시연 시계는 세트를 누를 때마다 가요). 이너타이 1세트는 수첩에 30 × 20이에요. 무게 칸 '45'를 눌러 그 자리에서 30, 횟수 칸 '20-25'를 눌러 20을 넣어요. 가볍게 시작한 세트라 남은 세트는 그대로예요.",
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
    at:()=>{const s=GD.s107(),x=gex(s,'legpress');return atMenu(s,x,'swap',()=>UI.modal.to==='olhack'?'.modal [data-act="doSwap"][data-v="today"]':'.modal [data-act="pickSwap"][data-v="olhack"]')},
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
    at:()=>{const s=GD.sLeg();return atMenu(s,s.exercises.find(e=>e.exId==='legpress'),'swap',()=>UI.modal.to!=='olhack'?'.modal [data-act="pickSwap"][data-v="olhack"]':'.modal [data-act="doSwap"][data-v="template"]')},
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


/* ---------- v4.1 시나리오 (2026-11-05, D78): 수첩 10/7·10/14 흐름 8장면 전부. 장면마다 목표·상황·왜, 단계마다 할 일과 왜.
   시연에만 필요한 조작(시연 시계, 날짜 넘기기)은 안내 칸의 버튼 하나로 대신한다 ---------- */
function runOld(k,from,to){const sc=OLD[k];for(let i=from;i<(to??sc.steps.length);i++){const st=sc.steps[i];let ok=false;try{ok=st.done()}catch(e){}if(!ok)st.auto()}}
const R_=(k,i,say,why)=>({...OLD[k].steps[i],say,why});
const ACK=(say,why,label,done,auto)=>({say,why,ack:label,at:()=>'#guide [data-g="ack"]',done,auto});
const basisStep=(sGet,ex,say,why)=>({say,why,
  at:()=>UI.modal&&UI.modal.type==='basis'?'.modal [data-act="closeModal"]':`.linkbtn[data-uid="${gex(sGet(),ex).uid}"]`,
  done:()=>UI.flags.basisLast===gex(sGet(),ex).uid&&!UI.modal,
  auto:()=>{ensureR('prep',sGet());UI.flags.basisLast=gex(sGet(),ex).uid;UI.modal=null;render()}});
const SCENES=[
 {t:'1. 출근: 오늘 수업 훑기',sub:'10/7 (수) 14:30 · 화면: 오늘',
  goal:'오늘 누구를 몇 시에 무슨 분할로 하는지 보고, 회원이 미리 한 말을 그 수업에 붙여 둬요.',
  sit:"출근해서 앱을 열었어요. 오늘은 15:00 김00 상체, 17:00 최00 당기기, 19:00 이00_3 하체 수업이 있어요. 이00_3 회원이 카톡으로 \"2주 만이라 살살 해 주세요\"라고 보냈어요(가정).",
  why:"수업 직전에 카톡을 다시 뒤지지 않으려고요. 수업에 붙여 둔 메모는 수업 준비와 수업 시작 화면에 다시 떠요.",
  enter(){S.today='2026-10-07';save();home('today')},
  steps:[
   R_(0,0,"'19:00 · 이00_3 · 하체' 칸의 '…'을 눌러 오늘 메모 칸에 \"2주 만이라 살살 해 주세요\"를 적고 '넣기'.","회원이 한 말을 그 수업에 붙여 두면 잊지 않아요."),
   R_(0,1,"수업 30분 전이 됐다고 치고 그 칸을 눌러요.","칸을 누르면 그 수업의 '오늘 숫자 정하기'가 열려요.")]},
 {t:'2. 수업 30분 전: 지난 기록 읽기',sub:'18:30 · 화면: 오늘 숫자 정하기',
  goal:'오늘 숫자를 정하기 전에, 이 회원이 지난번에 실제로 몇 kg로 몇 회 했는지 확인해요.',
  sit:"지난 수업은 13일 전 9/24 당기기, 지난 하체는 9/22예요. 9/22 핵스쿼트는 40kg × 16, 12였고 수첩에 \"60kg 도전 예정\"이라고 적어 뒀어요.",
  why:"무게·횟수·세트를 기억이 아니라 기록으로 정하려고요. 앱이 근거를 붙여 숫자를 먼저 채워 두고, 정하는 건 트레이너예요.",
  steps:[
   {say:"맨 위 한 줄에 지난 수업, 주의사항, 물어볼 것, 오늘 메모 수가 있어요. '브리핑 펼치기'를 눌러요.",why:"수업 전에 꼭 알아야 할 것(통증, 지난 컨디션, 지난 메모, 오늘 메모)을 한 번에 보려고요.",
    at:()=>`[data-act="toggle"][data-t="brief-${GD.s107().id}"]`,
    done:()=>!!UI.open['brief-'+GD.s107().id],
    auto:()=>{ensureR('prep',GD.s107());UI.open['brief-'+GD.s107().id]=true;render()}},
   R_(1,0,"핵스쿼트 줄 '지난번' 칸(9/22 40kg × 16, 40kg × 12)을 눌러 최근 4회를 펼쳐요.","한 번 기록만 보면 우연일 수 있어서, 몇 주 흐름(8/24 20kg → 9/22 40kg)을 같이 봐요."),
   basisStep(GD.s107,'hacksq',"판단 칸이 '무게 ↑', 오늘 숫자가 60kg이에요. 근거 줄 '계산 보기 ›'를 눌러 읽고 '닫기'.","60kg이 어디서 나왔는지(9/22에 남긴 목표) 보고, 오늘 그대로 써도 될지 판단하려고요.")]},
 {t:'3. 같은 화면: 숫자 고치기',sub:'18:40 · 화면: 오늘 숫자 정하기',
  goal:'앱이 채운 숫자를 트레이너 판단으로 고쳐요.',
  sit:"앱은 핵스쿼트를 워밍업 30kg·45kg × 12, 본세트 60kg × 8 × 3으로 채웠어요. 수첩을 보면 이날 실제로는 워밍업 40kg × 8 한 세트, 60kg × 12 × 3을 했어요.",
  why:"앱 숫자는 출발점이에요. 트레이너가 고친 숫자는 '고침'으로 남아서, 나중에 앱 추천과 트레이너 판단을 비교할 수 있어요.",
  steps:[
   R_(2,0,"본세트 첫 칸 '60kg × 8'을 눌러 횟수를 12로 바꾸고 '아래 세트에도'.","40kg에서 16회를 했으니 60kg에서도 12회는 된다고 본 거예요. '아래 세트에도'는 세 세트를 한 번에 바꿔요."),
   R_(2,1,"워밍업 '45kg × 12'를 눌러 '이 세트 빼기'.","워밍업은 한 세트로 몸만 풀고 힘은 본세트에 쓰려고요(수첩대로)."),
   R_(2,2,"남은 워밍업 '30kg × 12'를 눌러 무게 40, 횟수 8로 고쳐요. 칩이 그 자리에서 입력 칸으로 바뀌어요.","본세트 60kg에 가까운 무게로 적게 해서 준비만 하려고요."),
   R_(2,3,"아래 '계획 약 N분 / 수업 60분'으로 시간이 맞는지 보고, 회원이 오면 '수업 시작 ›'.","저장 버튼은 없어요. 고친 숫자는 바로 남아요. 계획이 60분을 넘으면 지금 종목을 줄여요.")]},
 {t:'4. 회원 도착: 컨디션 확인',sub:'19:00 · 화면: 수업 시작',
  goal:'오늘 컨디션에 맞춰 숫자를 바꿀지 정해요.',
  sit:"회원이 왔어요. 말로 잠, 피로, 근육통, 통증을 물어봐요. 예로 \"어제 야근해서 좀 피곤해요\"라고 했다고 해 봐요(가정).",
  why:"피곤한 날 계획 숫자를 그대로 하면 무리할 수 있어요. 앱이 어느 숫자를 얼마나, 왜 줄이는지 보여 주고, 받을지는 트레이너가 정해요.",
  steps:[
   R_(3,0,"피로 '나쁨'을 눌러요.","모두 '평소'로 골라져 있어서, 다른 것만 누르면 돼요."),
   R_(3,1,"오른쪽 '오늘 숫자'가 주황색으로 바뀌었어요(핵스쿼트 60kg × 12 → × 11). 주황색 핵스쿼트 칸을 눌러 까닭을 읽고 '닫기'.","여유 1개를 더 남기려고 횟수를 줄였다는 까닭을 보고, 받아들일지 정하려고요."),
   R_(3,2,"피로를 '평소'로 되돌려요. 주황색이 사라져요.","수첩 10/7에는 계획 숫자로 했어요. 실제 기록과 맞추려고 되돌려요."),
   R_(3,3,"오른쪽 아래 '시작'.","수업 중 화면으로 넘어가고 시계가 가기 시작해요.")]},
 {t:'5. 수업 1시간: 세트마다 남기고 다시 맞추기',sub:'19:04~19:55 · 화면: 수업 중 · 수첩 10/7 칸 그대로',
  goal:'세트가 끝날 때마다 실제 숫자를 남기고, 계획과 다르면 남은 세트를 다시 정해요.',
  sit:"트레이너는 회원 옆에 있어서 앱은 세트가 끝날 때 한 번만 봐요. 아래 숫자는 모두 수첩 10/7 칸 그대로예요. 중간에 판단이 세 번 있어요: A 오래 쉬기, B 종목 바꾸기, C 종목 빼기.",
  why:"계획대로 됐으면 '그대로' 한 번이면 끝나고, 달랐을 때만 숫자를 고쳐요. 다르면 앱이 남은 세트를 다시 계산해 보라색으로 보여 줘요.",
  steps:[
   R_(4,0,"이너타이 1세트는 수첩에 30 × 20이에요. 무게 칸 '45'를 눌러 그 자리에서 30, 횟수 칸 '20-25'를 눌러 20을 넣어요.","가볍게 몸을 풀며 한 세트예요. 1세트만 가볍게 한 거라 남은 세트는 그대로 둬요."),
   R_(4,1,"2세트 횟수를 20으로 넣고, '+ 세트' → '그대로'로 한 세트 더(수첩 45 × 20 × 2).","'20-25'처럼 범위로 잡힌 횟수는 실제로 몇 개 했는지 숫자로 남겨야 다음 판단에 써요. 쉰 시간은 저절로 남아요."),
   R_(4,2,"'다음 종목: 시티드 레그컬'을 누르고, 1세트 무게를 40으로(40 × 20), 2세트 횟수를 25로(50 × 25) 넣어요.","2세트에서 계획 20회보다 5개 더 했어요. 이게 남은 세트와 다음 수업 숫자의 근거가 돼요."),
   R_(4,3,"3세트 횟수가 보라색 25회로 바뀌었어요. 보라색 꼬리표를 눌러 까닭을 읽고 '닫기'.","10회가 넘는 세트라 무게 대신 횟수를 맞췄다는 까닭을 확인해요."),
   R_(4,4,"3세트 '그대로'.","앱이 바꾼 숫자를 트레이너가 받아들인 거예요."),
   R_(4,5,"'다음 종목: 핵스쿼트'. 수첩은 \"40kg x 8, 60kg. x 12 x 3\", \"2set에서 1개를 실패\". 워밍업 '그대로', 1세트 '그대로', 2세트는 횟수 11.","1개 차이는 그날 범위 안이라 앱이 남은 세트를 바꾸지 않아요."),
   ACK("판단 A: 회원이 힘들어해 3세트 전에 5분 넘게 쉬어요. 앱에서 할 일은 없어요. 아래 '5분 지나기'를 눌러 시간만 넘겨요.","쉰 시간은 세트 사이 간격으로 저절로 남아요. 따로 적지 않아도 돼요.",'5분 지나기',OLD[4].steps[6].done,OLD[4].steps[6].auto),
   R_(4,7,"3세트 '그대로'. 세트 줄에 '쉼 7:30'이 노랗게 남고, 위 띠가 빨개져요. 뒤쪽 레그 익스텐션에 '뺄 수 있음'이 붙어요.","오래 쉰 만큼 남은 시간이 빠듯해졌다는 걸 앱이 알려 줘요. 무엇을 뺄지는 트레이너가 정해요."),
   R_(4,8,"판단 B: '다음 종목: 레그프레스' → '…' → '바꾸기' → '원레그 핵프레스' → '오늘만 바꾸기'.","수첩에서 레그프레스를 지우고 한쪽씩 하는 원레그 핵프레스를 했어요. 오늘만 바꾸면 루틴 틀은 그대로예요."),
   R_(4,9,"아래에 이유 칩이 떠요. 다른 곳을 누를 때까지 그대로 있어요. 예로 '컨디션'을 눌러요. 안 눌러도 돼요.","이유를 남겨 두면 나중에 왜 바꿨는지 찾을 수 있어요. 수첩에는 이유가 없어서 예시예요."),
   R_(4,10,"원레그 핵프레스는 처음이라 무게가 비어 있어요. 1세트 무게를 눌러 20을 넣어요(예시).","기록이 없는 종목은 1세트로 무게를 찾아요. 찾은 무게가 남은 세트에 보라색으로 채워져요."),
   ACK("한쪽씩 하느라 오래 걸렸어요. 아래 '5분 지나기'를 눌러요(예시).","남은 시간이 더 줄어서, 마지막 종목을 할 수 있을지 판단해야 해요.",'5분 지나기',()=>{const s=GD.s107(),x=gex(s,'olhack');return (s.extraRest||0)>=5||!!(x&&x.sets[1]&&x.sets[1].done)},()=>ACT.plusFive({sid:GD.s107().id})),
   {say:"원레그 핵프레스 2세트와 3세트 '그대로'.",why:"1세트에서 찾은 무게로 이어 가요.",
    at:()=>{const s=GD.s107(),x=gex(s,'olhack');return atSets(s,x,[[20,10,'w'],[20,10,'same'],[20,10,'same']])},
    done:OLD[4].steps[11].done,
    auto:()=>{const s=GD.s107(),x=gex(s,'olhack');liveSet(s,x,1,20,10);liveSet(s,x,2,20,10);UI.edit=null;render()}},
   R_(4,12,"판단 C: 남은 시간이 10분이에요. 레그 익스텐션으로 가서 '…' → '빼기'.","앱은 '뺄 수 있음'만 알려 주고 빼지는 않아요. 빼는 건 트레이너예요."),
   R_(4,13,"이유는 '시간'이 미리 골라져 있어요. 카드 아래 '수업 메모'에 \"쉬는 시간이 너무 필요하다.\"를 적어요(수첩 그대로).","특이하게 튄 날만 적는 관찰이에요. 다음 수업 준비 브리핑에 다시 떠요."),
   R_(4,14,"위쪽 '마무리'.","오늘 기록을 확인하고 다음 숫자를 정하러 가요.")]},
 {t:'6. 수업 끝: 결과 보여 주고 다음 수업 정하기',sub:'19:55 · 화면: 마무리 → 회원에게 보여 주기 → 다음 PT 계획',
  goal:'오늘 기록을 확인하고, 회원에게 결과를 보여 준 뒤, 다음 하체의 출발 숫자와 날짜를 정해요.',
  sit:"수업이 막 끝났어요. 회원은 아직 옆에 있어요. 마무리 화면에는 오늘 결과, 계획과 달라진 곳, 넘은 개인 기록이 있어요.",
  why:"회원은 숫자가 오른 걸 직접 보면 다음에도 오고 싶어져요. 그리고 수첩에서는 다음 목표를 따로 적어 둬야 했는데, 여기서 정해 두면 다음 수업 '오늘 숫자 정하기'에 근거와 함께 들어가요.",
  steps:[
   {say:"마무리는 트레이너가 오늘 기록을 확인하는 화면이에요. 회원이 아직 있으니 아래 '회원에게 보여 주기'를 눌러요.",why:"회원에게 보여 줄 화면을 따로 둬서, 메모나 주의사항 같은 트레이너용 내용은 안 보여요.",
    at:()=>'.actbar [data-to="show"]',done:()=>onR('show',GD.s107())||!!UI.flags.shown,auto:()=>{ensureR('show',GD.s107())}},
   {say:"오늘 한 운동, 지난번보다 오른 종목, 무게 흐름, 오늘 쓴 근육이 보여요. 무게 흐름에서 '시티드 레그컬'을 눌러 봐요.",why:"종목을 골라 가며 8월부터 오늘까지 무게가 어떻게 올랐는지 회원과 같이 봐요.",
    at:()=>`[data-act="pickShow"][data-v="scurl"]`,done:()=>UI.cur['show-'+GD.s107().id]==='scurl'||!!UI.flags.shown,auto:()=>{ensureR('show',GD.s107());UI.cur['show-'+GD.s107().id]='scurl';render()}},
   {say:"회원이 간 뒤 '다음 PT 계획 ›'을 눌러요.",why:"다음 수업 숫자와 날짜는 회원 없이 트레이너가 정하는 화면에서 따로 해요.",
    at:()=>'.actbar [data-to="nextplan"]',done:()=>onR('nextplan',GD.s107())||GD.s107().status==='completed',auto:()=>{UI.flags.shown=true;ensureR('nextplan',GD.s107())}},
   {...R_(5,0,"1번 '다음 하체 숫자'에서 시티드 레그컬에 '목표 넘음'이 붙었어요. '올리기 +2.5'를 눌러요.","세 세트 모두 계획 20회 이상이라 '목표 넘음'이에요. 앱은 표시만 하고, 올리는 건 트레이너예요."),auto:()=>{OLD[5].steps[0].auto();ensureR('nextplan',GD.s107())}},
   R_(5,1,"다음 목표가 52.5 × 25로 들어왔어요. 무게 칸을 60으로 고쳐요.","앱은 한 칸(2.5kg)만 올려요. 수첩에서는 다음 하체에 60kg으로 올렸어요."),
   R_(5,2,"3번 '다음에 확인할 것'에 \"원레그 핵프레스 시작 무게 다시 보기\"를 적고 '넣기'(예시).","다음 수업 브리핑에 떠서 잊지 않아요."),
   R_(5,3,"2번 다음 PT 날짜를 10/8 (목)로 바꿔요. 분할은 순서상 다음인 밀기예요.","수첩에서도 다음 날 밀기를 했어요."),
   R_(5,4,"'끝내기'.","오늘 화면으로 돌아가고, 10/8 밀기 수업의 숫자가 미리 채워져요.")]},
 {t:'7. 다음 하체: 숫자가 이어지는지 보기',sub:'10/12 (월) → 10/14 (수) · 수첩 10/14 칸 그대로',
  goal:'일정이 바뀌어도 계획이 따라가고, 10/7에 정한 목표가 오늘 숫자로 들어오는지 봐요.',
  sit:"10/12 (월)이에요. 10/8 밀기와 10/9 후면사슬은 수첩 기록으로 채워 뒀어요. 회원이 하체를 10/14로 미루자고 해요(예시).",
  why:"날짜가 바뀌어도 숫자는 그대로 따라와야 해요. 그리고 지난번 판단이 실제로 오늘 숫자가 되는지 확인해요.",
  enter:OLD[6].enter,
  steps:[
   R_(6,0,"이00_3 칸 '…' → '옮기기'.","수업을 지우지 않고 날짜만 바꿔요. 옮긴 기록도 남아요."),
   R_(6,1,"날짜를 10/14로 고르고 '옮기기'.","날짜만 바뀌고 계획 숫자는 그대로예요."),
   ACK("10/14 (수)가 됐다고 치고 아래 '10/14로 넘어가기'를 눌러요.","시연용 날짜를 넘기는 거예요. 실제 앱에서는 하지 않아요.",'10/14로 넘어가기',OLD[6].steps[2].done,OLD[6].steps[2].auto),
   R_(6,3,"이00_3 칸을 눌러 '오늘 숫자 정하기'를 열어요.","10/7에 정한 숫자가 들어왔는지 보려고요."),
   basisStep(GD.sLeg,'scurl',"시티드 레그컬 판단이 '무게 ↑', 근거가 '10/7 수업 끝에 정한 다음 목표'(60kg × 25)예요. '계산 보기 ›'로 확인하고 '닫기'.","지난번 마무리에서 정한 숫자가 오늘 숫자가 된 거예요. 핵스쿼트는 10/7 실제값에서 왔어요."),
   R_(6,4,"수첩 10/14에는 이너타이가 없어요. 이너타이 줄 '…' → '빼기', 이유 칩 '기타'.","'기타'는 이유가 따로 없을 때 골라요."),
   R_(6,5,"레그프레스 줄 '…' → '바꾸기' → '원레그 핵프레스' → 이번에는 '루틴 틀에도 바꾸기'.","두 번째로 바꾸는 거라 루틴 틀에도 넣어요. 다음 하체부터는 처음부터 원레그 핵프레스로 채워져요."),
   R_(6,6,"'수업 시작 ›', 컨디션은 그대로 두고 '시작'.","오늘은 컨디션이 평소라 숫자가 그대로예요."),
   R_(6,7,"시티드 레그컬은 수첩에 50x20, 60x25x2예요. 1세트를 50 × 20으로 고치고, 2·3세트는 '그대로'.","60kg은 10/7에 올린 목표예요. 1세트만 가볍게 해서 남은 세트는 그대로예요."),
   R_(6,8,"핵스쿼트는 수첩에 \"40 x 23reps, 60kg.\"이에요. 워밍업 횟수를 23으로 고치고, 본세트는 '그대로' 세 번(본세트 횟수는 수첩에 없어 예시).","워밍업만 다르게 했고 본세트는 계획대로예요."),
   R_(6,9,"원레그 핵프레스 1세트 횟수를 20으로 넣으면 남은 세트가 보라색 22.5 × 10으로 바뀌어요. 수첩대로 2세트를 20 × 20으로 고쳐요.","계획보다 10개 더 해서 앱이 무게를 올려 보자고 제안해요. 트레이너는 수첩대로 무게를 유지했어요. 제안은 안 받아도 돼요."),
   R_(6,10,"3세트도 20 × 20으로 고치고, '+ 세트' → '그대로'로 4세트를 채워요.","수첩 \"20 x 4\"를 20회 × 4세트로 읽었어요(해석)."),
   R_(6,11,"레그 익스텐션은 수첩에 30x25x2예요. 횟수를 25로 고치고 '+ 세트' → '그대로'.","10/7에 시간 때문에 뺀 종목이라 오늘 다시 들어와 있어요."),
   R_(6,12,"'마무리'. '루틴 틀도 고칠까요?'에 '예, 오늘 것으로'.","'기타'로 뺀 이너타이를 루틴 틀에서도 뺄지 물어요. 시간·컨디션 때문에 뺀 건 묻지 않아요."),
   {...R_(6,13,"'다음 PT 계획 ›'을 눌러, 다음 PT를 10/15 (목) 밀기로 두고 '끝내기'.","다음 밀기 숫자가 미리 채워져요. 오늘은 회원에게 보여 주기는 건너뛰어요."),at:()=>UI.route.name!=='nextplan'?'.actbar [data-to="nextplan"]':OLD[6].steps[13].at()}]},
 {t:'8. 몇 주 흐름 보고 훈련 방향 정하기',sub:'10/16 (금) · 화면: 회원 한눈에 → 추이',
  goal:'한 회원의 몇 주 흐름을 보고 다음 몇 주의 큰 방향을 정해요.',
  sit:"몇 주에 한 번은 회원별로 흐름을 봐요. 10/15 밀기와 10/16 당기기는 수첩 기록으로 채워 뒀어요. 10/16 메모에 \"라잉 레그컬과 워킹 런지를 통한 심박수 + 체중감량 고려.\"가 있어요.",
  why:"매 수업 숫자는 이 큰 방향 안에서 정해요. 앱은 데이터만 보여 주고 원인은 판단하지 않아요.",
  enter:OLD[7].enter,
  steps:[
   R_(7,0,"왼쪽 '회원' 메뉴를 누르고 이00_3을 눌러요.","회원 한 명의 기록을 한 화면에서 보려고요."),
   R_(7,1,"회원 한눈에서 위쪽 '추이'를 눌러요.","병원 차트처럼 요약, 이력, 다음 PT, 그래프가 한 장에 있어요. 추이는 종목 하나의 숫자 흐름이에요."),
   R_(7,2,"핵스쿼트 그래프 점을 눌러 그날 숫자와 수첩 원문을 봐요.","8/24 20kg → 9/22 40kg → 10/7·10/14 60kg으로 올랐는지 확인해요."),
   R_(7,3,"위 '훈련 방향 바꾸기'에서 방향 하나와 시작일을 골라 저장해요('대신 하기'는 예시로 조절).","무엇을 고를지는 수첩에 없어 트레이너가 정해요.")]}
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
  if(a==='ack'){const st=SCENES[G.scene].steps[G.step];if(st){G.busy=true;runAuto(st);G.busy=false;render()}return}
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
   ${sc.goal?`<div class="g-box goal"><b>이 장면에서 하는 일</b> ${esc(sc.goal)}</div>`:''}${sc.sit?`<div class="g-box"><b>상황</b> ${esc(sc.sit)}</div><div class="g-box why"><b>왜 하나요</b> ${esc(sc.why)}</div>`:''}
   <div class="tiny muted" style="margin-top:8px"><b>할 일</b></div><ol class="g-steps">${sc.steps.map((st,i)=>`<li class="${i<G.step?'done':i===G.step?'cur':''}">${esc(st.say)}${st.why&&i>=G.step?`<div class="g-why">왜: ${esc(st.why)}</div>`:''}${i===G.step&&st.ack?`<div style="margin-top:4px"><button class="btn small primary" data-g="ack">${esc(st.ack)}</button></div>`:''}</li>`).join('')}</ol>
   ${cur?`<div class="row"><span class="tiny muted">노란 테두리를 눌러요.</span><span class="sp"></span><button class="btn small" data-g="auto">이 단계 대신 하기</button></div>`
     :`<div class="g-done">${sc.end?esc(sc.end):last?'시나리오 끝이에요.':'이 장면은 끝났어요.'}</div>`}
   <div class="row" style="margin-top:10px">${last?'':`<button class="btn${cur?'':' primary'}" data-g="next">다음 장면 ›</button>`}<span class="sp"></span><button class="btn small ghost" data-g="restart">이 장면 처음부터</button></div>
   <div class="g-foot">숫자는 트레이너 수첩 그대로이고, 수첩에 없는 말·값은 (가정)·(예시)로 적었어요. 장면 번호를 누르면 그 장면부터 할 수 있어요.</div>`;
  const li=box.querySelector('.g-steps li.cur');if(li&&G.gKey!==G.scene+'.'+G.step){G.gKey=G.scene+'.'+G.step;try{li.scrollIntoView({block:'nearest'})}catch(e){}}
}
