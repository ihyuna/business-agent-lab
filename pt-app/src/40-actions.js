/* ---------- 그리기 ---------- */
const routeKey=()=>UI.route.name+':'+(UI.route.sid||UI.route.mid||'');
UI.scrolls={};
function saveScroll(){const app=document.getElementById('app');if(!UI.rk)return;app.querySelectorAll('[data-sk]').forEach(el=>{UI.scrolls[UI.rk+'|'+el.dataset.sk]=el.scrollTop})}
function render(o={}){
  const app=document.getElementById('app');
  if(!o.noSave) saveScroll();
  const ae=document.activeElement; const fk=ae&&app.contains(ae)?ae.dataset.k:null; let sel=null; try{if(fk&&ae.selectionStart!=null)sel=[ae.selectionStart,ae.selectionEnd]}catch(e){}
  const r=UI.route; let html;
  try{html=(V[r.name]||V.today)(r)}catch(err){console.error(err);html=topBar('화면을 그리지 못했어요',esc(err.message),'',{noBack:true})+`<div class="scroll">${btn('처음 화면으로','home',null,'primary')}</div>`}
  if(UI.modal&&MOD[UI.modal.type]){let mh;try{mh=MOD[UI.modal.type](UI.modal)}catch(err){console.error(err);mh=`<h3>창을 열지 못했어요</h3>${btn('닫기','closeModal')}`}html+=`<div class="overlay" data-act="overlay"><div class="modal" role="dialog" aria-modal="true">${mh}</div></div>`}
  if(UI.ask) html+=askHTML();
  if(UI.toast) html+=`<div class="toast" role="status">${esc(UI.toast)}</div>`;
  app.innerHTML=html; UI.rk=routeKey();
  app.querySelectorAll('[data-sk]').forEach(el=>{const v=UI.scrolls[UI.rk+'|'+el.dataset.sk];if(v!=null)el.scrollTop=v});
  if(fk){const el=app.querySelector(`[data-k="${CSS.escape(fk)}"]`);if(el){el.focus({preventScroll:true});if(sel)try{el.setSelectionRange(sel[0],sel[1])}catch(e){}}}
  document.getElementById('b-orient').textContent=UI.orient==='land'?'세로로 보기':'가로로 보기';
  document.getElementById('b-fit').textContent=UI.fit?'실제 크기':'창에 맞추기';
  if(typeof guideAfter==='function') guideAfter();
}
let toastT=null;
function toast(msg){UI.toast=msg;render();clearTimeout(toastT);toastT=setTimeout(()=>{UI.toast=null;document.querySelector('#app .toast')?.remove()},2600)}
function go(name,params){
  saveScroll();
  if(params&&params.sid){const s=SES(params.sid); if(s){
    if(name==='start') name='live';
    if(name==='briefing'||name==='plan') name='prep';
    if((name==='live'||name==='start'||name==='summary'||name==='show'||name==='nextplan')&&s.status!=='planned'&&s.status!=='in_progress') name='detail';}}
  UI.stack.push(UI.route); if(UI.stack.length>60) UI.stack.shift();
  UI.route={name,...(params||{})}; UI.modal=null; UI.edit=null; UI.ask=null; UI.confirmReset=false; render({noSave:true});
}
function back(){saveScroll();UI.route=UI.stack.pop()||{name:'today'};UI.modal=null;UI.edit=null;UI.confirmReset=false;render({noSave:true})}
function home(name){UI.stack=[];UI.route={name:name||'today'};UI.modal=null;UI.edit=null;render({noSave:true})}
function fv(key){if(UI.draft[key]!=null)return UI.draft[key];const el=document.querySelector(`#app [data-k="${CSS.escape(key)}"]`);return el?el.value:''}
function clearDraft(...keys){for(const k of keys) delete UI.draft[k]}
function gx(d){const s=SES(d.sid);const x=s&&s.exercises.find(e=>e.uid===d.uid);return {s,x,st:x&&d.i!=null?x.sets[+d.i]:null,m:s&&M(s.memberId)}}
function startTimer(x){if(!S.settings.restTimer)return;UI.timer={end:Date.now()+(x.rest||60)*1000,name:EX(x.exId).name}}
function openSessionRoute(s){return s.status==='in_progress'?'live':s.status==='planned'?'prep':'detail'}
/* 바꾸기·빼기 바로 뒤 이유 칩: 다른 버튼을 누르거나 화면을 옮길 때까지 떠 있다 (2026-11-05 이현아님). 안 누르면 미리 고른 이유(남은 시간이 모자라면 '시간')나 '이유 없음' */
let askT=null;
function showAsk(o){UI.ask=o;clearTimeout(askT);render()}
function askHTML(){const a=UI.ask;const {x}=gx(a);if(!x)return '';const cur=x.reason;
  return `<div class="askbar" role="status"><span class="small"><b>${esc(EX(x.exId).name)}</b> ${a.kind==='remove'?'뺐어요':'바꿨어요'}. 이유</span>${REMOVE_REASONS.map(r=>`<button class="chip${cur===r?' on':''}" data-act="askPick" data-v="${r}">${r}</button>`).join('')}<span class="tiny muted">안 누르면 '${esc(cur||'이유 없음')}'으로 남아요 · 다른 곳을 누르면 닫혀요</span>${a.kind==='remove'?btn('되돌리기','askUndo',null,'small ghost'):''}</div>`}

/* ---------- 누르기 ---------- */
function resetAll(){try{localStorage.removeItem(KEY)}catch(e){}S=buildSeed();save();clearTimeout(askT);Object.assign(UI,{ask:null,stack:[],route:{name:'today'},modal:null,draft:{},cur:{},open:{},search:'',timer:null,confirmReset:false,scrolls:{},edit:null,flags:{}})}
const ACT={
  back:()=>back(),
  home:()=>home(),
  tab:d=>home(d.v),
  histOpen:d=>{const k='hx-'+d.mid;const cur=UI.cur[k]===undefined?(completed(d.mid).slice(-1)[0]||{}).id:UI.cur[k];UI.cur[k]=cur===d.sid?null:d.sid;render()},
  copyEx:d=>{const src=SES(d.sid);const x=src.exercises.find(e=>e.uid===d.uid);const r=copyToNext(src,[x]);if(r)toast(`${EX(x.exId).name}을(를) ${md(r.date)} 수업에 복사했어요`)},
  copyAll:d=>{const src=SES(d.sid);const xs=src.exercises.filter(e=>e.status!=='removed'&&e.status!=='swapped');const r=copyToNext(src,xs);if(r)toast(`종목 ${xs.length}개를 ${md(r.date)} 수업에 복사했어요`)},
  setDay:d=>{S.today=d.v;seedOthers(S.today);save();render()},
  shiftDay:d=>{S.today=addDays(todayIso(),+d.dir);seedOthers(S.today);save();render()},
  noop:()=>{},
  go:d=>{const p={};if(d.mid)p.mid=d.mid;if(d.sid)p.sid=d.sid;go(d.to,p)},
  openSession:d=>{const s=SES(d.sid);go(openSessionRoute(s),{sid:s.id})},
  newMember:()=>{const m={id:uid('m'),code:'새 회원',goals:[],cautions:[],notes:[],body:[],movement:[],blocks:[],exMemos:{},templates:[]};S.members.push(m);save();saveScroll();UI.stack.push(UI.route);UI.route={name:'member',mid:m.id};go('memberEdit',{mid:m.id})},
  confirmReset:d=>{UI.confirmReset=d.v==='1';render()},
  reset:()=>{resetAll();toast('처음 상태로 되돌렸어요')},
  modal:d=>{const o={...d};delete o.act;UI.modal=o;UI.edit=null;render()},
  closeModal:()=>{UI.modal=null;render()},
  overlay:(d,el,ev)=>{if(ev.target===el){UI.modal=null;render()}},
  toggle:d=>{UI.open[d.t]=!UI.open[d.t];render()},
  draftSet:d=>{UI.draft[d.key]=d.v;render()},
  // 회원
  addCaution:d=>{const m=M(d.mid);const text=fv('cText-'+m.id).trim();if(!text)return toast('주의사항 내용을 적어 주세요');m.cautions.push({id:uid('c'),part:fv('cPart-'+m.id)||'기타',text,since:todayIso(),status:'open'});clearDraft('cText-'+m.id);save();render()},
  closeCaution:d=>{const c=M(d.mid).cautions.find(c=>c.id===d.id);c.status='closed';c.closed=todayIso();save();toast('주의사항을 닫았어요. 기록은 남아요.')},
  noteDone:d=>{const n=M(d.mid).notes.find(n=>n.id===d.id);n.done=true;n.doneAt=todayIso();save();render()},
  addNote:d=>{const m=M(d.mid);const kind=d.kind||fv('nKind-'+m.id)||'general';const key=d.kind==='check'?'nCheck-'+m.id:'nText-'+m.id;const text=fv(key).trim();if(!text)return toast('내용을 적어 주세요');
    const s=UI.route.sid?SES(UI.route.sid):null;m.notes.push({id:uid('n'),kind,text,created:s?s.date:todayIso(),done:false});clearDraft(key);save();render()},
  delNote:d=>{const m=M(d.mid);m.notes=m.notes.filter(n=>n.id!==d.id);save();render()},
  addGoal:d=>{const m=M(d.mid);const text=fv('gText-'+m.id).trim();if(!text)return toast('목표를 적어 주세요');m.goals.push({id:uid('g'),text,start:fv('gStart-'+m.id)});clearDraft('gText-'+m.id,'gStart-'+m.id);save();render()},
  endGoal:d=>{const g=M(d.mid).goals.find(g=>g.id===d.id);g.end=todayIso();save();render()},
  addBody:d=>{const m=M(d.mid);const n=k=>{const v=fv(k+'-'+m.id).trim();return v===''?null:numOr(v)};const b={date:fv('bDate-'+m.id)||todayIso(),height:n('bH'),weight:n('bW'),muscle:n('bM')};
    if(b.height==null&&b.weight==null&&b.muscle==null)return toast('숫자를 하나 이상 넣어 주세요');m.body.push(b);m.body.sort((a,c)=>a.date<c.date?-1:1);clearDraft('bDate-'+m.id,'bH-'+m.id,'bW-'+m.id,'bM-'+m.id);save();render()},
  move:d=>{const m=M(d.mid);m.move=m.move||{};m.move[d.item]=m.move[d.item]===+d.v?null:+d.v;m.move.date=todayIso();save();render()},
  saveBlock:()=>{const m=M(UI.modal.mid);const b=curBlock(m);m.blocks.push({dir:UI.modal.dir||b?.dir||'발전',focus:fv('bl-f').trim(),start:fv('bl-s')});clearDraft('bl-f','bl-s');UI.modal=null;save();toast('훈련 방향을 바꿨어요. 지난 방향도 남아요.')},
  pickDir:d=>{UI.modal.dir=d.v;render()},
  // 루틴 틀
  pickTpl:d=>{UI.cur['tpl-'+d.mid]=d.tid;render()},
  tplNew:d=>{const m=M(d.mid);const t={id:uid('t'),name:'새 분할',items:[],versions:[{date:todayIso(),note:'만듦'}]};m.templates.push(t);UI.cur['tpl-'+m.id]=t.id;save();render()},
  tplMove:d=>{const t=tplOf(M(d.mid),d.tid);const i=+d.i,j=i+(+d.dir);if(j<0||j>=t.items.length)return;[t.items[i],t.items[j]]=[t.items[j],t.items[i]];tplTouched(t,'순서 바꿈');save();render()},
  tplDel:d=>{const t=tplOf(M(d.mid),d.tid);const [it]=t.items.splice(+d.i,1);tplTouched(t,EX(it.exId).name+' 뺌');save();render()},
  tplAdd:d=>{const t=tplOf(M(d.mid),d.tid);const exId=fv('tplAdd-'+t.id)||'hacksq';t.items.push({exId,role:fv('tplAddRole-'+t.id)||'보조',structure:'스트레이트'});tplTouched(t,EX(exId).name+' 넣음');save();render()},
  // 일정
  markSession:d=>{const s=SES(d.sid);const prev=s.status;s.status=d.v;UI.modal=null;
    if(d.v==='planned'&&s.example){S.sessions=S.sessions.filter(x=>x!==s);S.changes=(S.changes||[]).filter(c=>c.sid!==s.id);save();return toast('예시 칸을 지웠어요.')}
    if(d.v==='planned'){S.changes=(S.changes||[]).filter(c=>!(c.sid===s.id&&(c.kind==='cancelled'||c.kind==='no_show')));save();return toast('되돌렸어요. 다시 예정 수업이에요.')}
    logChange({kind:d.v,sid:s.id,mid:s.memberId,date:s.date,reason:fv('cx-'+s.id)||''});clearDraft('cx-'+s.id);save();toast(`${statusLabel[d.v]}으로 남겼어요. 다음 목표와 확인할 것은 다음 수업으로 넘어가요.`)},
  setExampleCx:d=>{S.settings.exampleCx=d.v==='1';if(S.settings.exampleCx)addExampleCx();else removeExampleCx();save();render()},
  musRange:d=>{UI.cur['mus-'+d.mid]=d.v;render()},
  recentTab:d=>{UI.cur.recentTab=d.v;render()},
  saveSchedule:()=>{const o=UI.modal;const m=M(o.mid);const date=fv('sc-d');if(!date)return toast('날짜를 골라 주세요');
    if(o.sid){const s=SES(o.sid);if(s.date!==date||(s.time||'')!==fv('sc-t'))logChange({kind:'moved',sid:s.id,mid:s.memberId,date,from:s.date,fromTime:s.time||'',toTime:fv('sc-t')||'',reason:fv('mv-r')||''});s.date=date;s.time=fv('sc-t');UI.modal=null;clearDraft('sc-d','sc-t');save();toast('날짜만 옮겼어요. 계획은 그대로예요.')}
    else{const tid=fv('sc-s');if(!tid)return toast('루틴 틀에서 분할을 먼저 만들어 주세요');createPlanned(m,date,fv('sc-t'),tid);UI.modal=null;clearDraft('sc-d','sc-t','sc-s');save();toast('잡았어요. 수업 준비를 미리 채워 뒀어요.')}},
  // 예정 루틴
  basis:d=>{UI.modal={type:'basis',sid:d.sid,uid:d.uid};UI.flags.basisSeen=true;UI.flags.basisLast=d.uid;UI.edit=null;render()},
  rebasis:d=>{const {s,x}=gx(d);refill(s,x,d.v);if(s.cond)applyCondition(s);save();render()},
  refillAll:d=>{const s=SES(d.sid);let n=0;for(const x of liveEx(s)){if(x.edited)continue;refill(s,x,x.force);n++}save();toast(`직접 고치지 않은 ${n}종목을 다시 채웠어요`)},
  edit:d=>{const {s,x}=gx(d);if(!s||!x)return;if(UI.edit&&UI.edit.uid===d.uid&&+UI.edit.i===+d.i){UI.edit=null}else{UI.edit={sid:d.sid,uid:d.uid,i:+d.i,f:d.f||'r'};if(isLive(s))UI.cur[s.id]=x.uid}render();if(UI.edit&&!isLive(s)){const el=document.querySelector(`#app .chipedit input[data-f="${d.f||'w'}"]`);if(el){el.focus();try{el.select()}catch(e){}}}},
  closeEdit:()=>{UI.edit=null;render()},
  estep:d=>{const {s,x,st}=gx(d);const live=isLive(s);const isW=d.f==='w';const inc=isW?(+EX(x.exId).inc||2.5):1;
    let base=firstNum(isW?(live?st.aw??st.pw:st.pw):(live?st.ar??st.pr:st.pr));if(base==null)base=0;setField(s,x,+d.i,d.f,Math.max(0,Math.round((base+(+d.dir)*inc)*100)/100));if(live&&st.done)startTimer(x);save();render()},
  below:d=>{const {s,x}=gx(d);const n=applyBelow(s,x,+d.i);UI.edit=null;save();toast(n?`아래 ${n}세트도 같은 숫자로 바꿨어요`:'바꿀 아래 세트가 없어요')},
  pickRole:d=>{const {s,x}=gx(d);x.role=d.v;if(x.edited){const R=S.settings.roles[d.v];x.rest=R.rest;x.prir=R.rir}else refill(s,x,x.force);UI.modal=null;save();render()},
  setKindPick:d=>{const {x,st,s}=gx(d);st.kind=d.v;if(s.status==='planned')x.edited=true;UI.modal=null;save();render()},
  delSet:d=>{const {s,x}=gx(d);x.sets.splice(+d.i,1);if(s.status==='planned')x.edited=true;updateExStatus(x);UI.modal=null;UI.edit=null;save();render()},
  addSet:d=>{const {s,x}=gx(d);newSet(s,x);if(isLive(s))UI.cur[s.id]=x.uid;save();render()},
  moveEx:d=>{const {s,x}=gx(d);UI.modal=null;const i=s.exercises.indexOf(x);let j=i+(+d.dir);while(j>=0&&j<s.exercises.length&&['removed','swapped'].includes(s.exercises[j].status))j+=(+d.dir);if(j<0||j>=s.exercises.length)return render();s.exercises.splice(i,1);s.exercises.splice(j,0,x);save();render()},
  restoreEx:d=>{const {s,x}=gx(d);x.status='planned';x.reason='';updateExStatus(x);save();render()},
  doRemove:d=>{const {s,x}=gx(UI.modal);removeExercise(s,x,d.v);if(UI.cur[s.id]===x.uid)delete UI.cur[s.id];UI.modal=null;save();toast(`${EX(x.exId).name} 뺐어요 (${d.v})`)},
  pickSwap:d=>{UI.modal.to=d.v;render()},
  pickScope:d=>{UI.modal.scope=d.v;render()},
  doSwap:d=>{const o=UI.modal;const {s,x}=gx(o);const to=o.to;if(!to)return;const y=swapExercise(s,x,to,(d&&d.v)||o.scope||'today');
    UI.cur[s.id]=y.uid;UI.modal=null;save();showAsk({sid:s.id,uid:x.uid,kind:'swap'})},
  removeNow:d=>{const {s,x}=gx(d);const pre=canDrop(s,x)?'시간':'';removeExercise(s,x,pre);if(UI.cur[s.id]===x.uid)delete UI.cur[s.id];UI.modal=null;save();showAsk({sid:s.id,uid:x.uid,kind:'remove'})},
  askPick:d=>{const a=UI.ask;if(!a)return;const {x}=gx(a);x.reason=x.reason===d.v?'':d.v;save();showAsk(a)},
  askUndo:()=>{const a=UI.ask;if(!a)return;const {x}=gx(a);x.status='planned';x.reason='';updateExStatus(x);UI.ask=null;clearTimeout(askT);save();render()},
  adj:d=>{UI.modal={type:'adj',sid:d.sid,uid:d.uid,i:d.i};UI.edit=null;UI.flags.adjLast=d.uid+':'+d.i;render()},
  undoAdj:d=>{const {x,st}=gx(d);undoAdj(x,st);UI.modal=null;save();render()},
  plusFive:d=>{const s=SES(d.sid);s.clock=(s.clock??START_MIN)+5;s.extraRest=(s.extraRest||0)+5;save();render()},
  todayMemo:d=>{const s=SES(d.sid),m=M(s.memberId);const k='tm-'+s.id;const text=fv(k).trim();if(!text)return toast('메모를 적어 주세요');m.notes.push({id:uid('n'),kind:'check',text,created:todayIso(),due:s.id,done:false});clearDraft(k);UI.modal=null;save();toast('오늘 메모를 남겼어요')},
  pickShow:d=>{UI.cur['show-'+d.sid]=d.v;render()},
  raiseNext:d=>{const s=SES(d.sid);const x=s.exercises.find(e=>e.exId===d.ex&&e.status==='done');const top=x&&topDone(x);if(!top)return;const inc=+EX(d.ex).inc||2.5;ensureNext(s).targets[d.ex]={w:Math.round((top.w+inc)*100)/100,r:top.r,text:'',raised:true};save();render()},
  keepNext:d=>{delete ensureNext(SES(d.sid)).targets[d.ex];save();render()},
  doAddEx:()=>{const o=UI.modal;const s=SES(o.sid);const m=M(s.memberId);if(!o.to)return;const y=planExercise(m,{exId:o.to,role:fv('addRole')||'보조',structure:'스트레이트'},s.date,s.templateId,s.exercises.map(e=>({role:e.role})));
    y.origin='added';s.exercises.push(y);UI.cur[s.id]=y.uid;clearDraft('addRole');UI.modal=null;save();render()},
  // 수업 시작
  cond:d=>{const s=SES(d.sid);s.cond[d.item]=d.v;applyCondition(s);save();render()},
  ccheck:d=>{const s=SES(d.sid);s.cautionChecks[d.id]=d.v;save();render()},
  checkSame:d=>{const s=SES(d.sid),m=M(s.memberId);const p=prevDone(m,s.date)[0]?.cautionChecks||{};for(const c of openCautions(m))s.cautionChecks[c.id]=p[c.id]||'same';save();render()},
  painToCaution:d=>{const s=SES(d.sid),m=M(s.memberId);m.cautions.push({id:uid('c'),part:'기타',text:s.cond.painWhere||'수업 전 통증',since:s.date,status:'open'});save();toast('주의사항에 넣었어요')},
  startSession:d=>{const s=SES(d.sid);if(!s.cond)s.cond={sleep:'normal',fatigue:'normal',soreness:'normal',pain:'none',painWhere:''};applyCondition(s);s.clock=START_MIN;s.extraRest=0;s.status='in_progress';s.startedAt=new Date().toISOString();s.cond.checkedAt=s.startedAt;UI.edit=null;save();saveScroll();UI.stack=[{name:'today'}];UI.route={name:'live',sid:s.id};render({noSave:true})},
  // 수업 진행
  pickEx:d=>{saveScroll();UI.cur[d.sid]=d.uid;UI.edit=null;UI.modal=null;UI.scrolls[UI.rk+'|main']=0;render({noSave:true})},
  backToEx:d=>{UI.cur[d.sid]=d.uid;go('live',{sid:d.sid})},
  same:d=>{const {s,x,st}=gx(d);if(st.pr!=null&&!isNum(st.pr)){UI.edit={sid:d.sid,uid:d.uid,i:+d.i,f:'r'};render();return}confirmSet(x,st,s);UI.edit=null;startTimer(x);save();render()},
  undoSet:d=>{const {x,st}=gx(d);Object.assign(st,{aw:null,ar:null,done:false,src:null,rir:null,doneMin:null,restMin:null});updateExStatus(x);revertLive(x,+d.i);save();render()},
  pain:d=>{const {st}=gx(d);st.pain=!st.pain;save();render()},
  rir:d=>{const {st}=gx(d);st.rir=st.rir===+d.v?null:+d.v;save();render()},
  obs:d=>{const s=SES(d.sid);s.observations=s.observations||[];const o=s.observations.find(v=>v.kind===d.item);if(o&&o.dir===d.v)s.observations=s.observations.filter(v=>v!==o);else if(o)o.dir=d.v;else s.observations.push({kind:d.item,dir:d.v});save();render()},
  timerOff:()=>{UI.timer=null;render()},
  swStart:()=>{SW.on=true;SW.t0=Date.now();render()},
  swStop:()=>{SW.acc+=Date.now()-SW.t0;SW.on=false;render()},
  swLap:()=>{const t=swNow();SW.laps.push(t-SW.lapAcc);SW.lapAcc=t;render()},
  swReset:()=>{Object.assign(SW,{on:false,acc:0,lapAcc:0,laps:[]});render()},
  swFold:()=>{SW.fold=!SW.fold;render()},
  // 요약
  promote:d=>{const s=SES(d.sid),m=M(s.memberId);m.cautions.push({id:uid('c'),part:'기타',text:d.text,since:s.date,status:'open',from:s.id});s.promoted=(s.promoted||[]).concat(d.text);save();render()},
  tplAnswer:d=>{answerTemplate(SES(d.sid),d.v);save();render()},
  npOn:d=>{ensureNext(SES(d.sid)).np.on=d.v==='1';save();render()},
  finish:d=>{const s=SES(d.sid);const made=finishSession(s);UI.timer=null;UI.edit=null;save();home('today');toast(made?`수업을 저장했어요. ${mdw(made.date)} ${splitName(made)} 수업 준비를 미리 채웠어요.`:'수업을 저장했어요.')},
  // 추이, 기록, 찾기
  pickTrend:d=>{UI.cur['trend-'+d.mid]=d.v;UI.cur['trendPt-'+d.mid]=null;render()},
  trendPt:d=>{const k='trendPt-'+UI.route.mid;UI.cur[k]=UI.cur[k]===+d.i?null:+d.i;render()},
  pickHist:d=>{UI.cur['hist-'+d.mid]=d.v;render()},
  doSearch:()=>{UI.search=fv('search');render()},
  // 설정
  setTimer:d=>{S.settings.restTimer=d.v==='1';if(!S.settings.restTimer)UI.timer=null;save();render()},
  setBasis:d=>{S.settings.basis=d.v;save();render()},
  exSide:(d,el)=>{S.exercises[d.id].side=el.checked;save()},
  newEx:()=>{const name=fv('newExName').trim();if(!name)return toast('종목 이름을 적어 주세요');const id=uid('ex');S.exercises[id]={name,part:fv('newExPart')||'기타',unit:fv('newExUnit'),inc:numOr(fv('newExInc'))||2.5};clearDraft('newExName','newExInc');save();toast(name+' 종목을 만들었어요')},
};

/* ---------- 입력 칸 (바뀌면 저장, 화면은 필요할 때만 다시 그림) ---------- */
const ON={
  ev:(v,d)=>{const {s,x,st}=gx(d);if(!st)return;const was=st.done;setField(s,x,+d.i,d.f,numOr(v.trim()));if(isLive(s)&&st.done&&!was)startTimer(x);save();renderSoon()},
  nt:(v,d)=>{const nx=ensureNext(SES(d.sid));const t=nx.targets[d.ex]=nx.targets[d.ex]||{};t[d.f]=d.f==='text'?v:numOr(v.trim());save()},
  np:(v,d)=>{ensureNext(SES(d.sid)).np[d.f]=v;save()},
  sGoal:(v,d)=>{SES(d.sid).goal=v;save()},
  painWhere:(v,d)=>{SES(d.sid).cond.painWhere=v;save()},
  exSetting:(v,d)=>{gx(d).x.setting=v;save()},
  exNote:(v,d)=>{gx(d).x.note=v;save()},
  sMemo:(v,d)=>{SES(d.sid).memo=v;save()},
  mCode:(v,d)=>{M(d.mid).code=v.trim()||'이름 없음';save()},
  mForce:(v,d)=>{const m=M(d.mid);m.move=m.move||{};m.move.force=v;save()},
  tplName:(v,d)=>{const t=tplOf(M(d.mid),d.tid);t.name=v.trim()||'분할';save()},
  tplEx:(v,d)=>{const t=tplOf(M(d.mid),d.tid);const it=t.items[+d.i];tplTouched(t,`${EX(it.exId).name} → ${EX(v).name}`);it.exId=v;save();render()},
  tplRole:(v,d)=>{const t=tplOf(M(d.mid),d.tid);t.items[+d.i].role=v;tplTouched(t,'역할 바꿈');save();render()},
  tplStruct:(v,d)=>{const t=tplOf(M(d.mid),d.tid);t.items[+d.i].structure=v;tplTouched(t,'세트 구성 바꿈');save();render()},
  roleVal:(v,d)=>{const n=numOr(v);if(isNum(n)){S.settings.roles[d.role][d.f]=n;save()}},
  exName:(v,d)=>{if(v.trim()){S.exercises[d.id].name=v.trim();save()}},
  exPart:(v,d)=>{S.exercises[d.id].part=v;save()},
  exUnit:(v,d)=>{S.exercises[d.id].unit=v;save()},
  exInc:(v,d)=>{const n=numOr(v);if(isNum(n)&&n>0){S.exercises[d.id].inc=n;save()}},
  search:v=>{UI.search=v;render()},
};

/* ---------- 화면 크기: 아이패드 9세대 1080×810pt ---------- */
function fit(){
  const st=document.getElementById('stage'),fr=document.getElementById('frame'),dev=document.getElementById('device');
  dev.classList.toggle('port',UI.orient==='port'); st.classList.toggle('actual',!UI.fit);
  const W=(UI.orient==='land'?1080:810)+2,H=(UI.orient==='land'?810:1080)+2;
  const sc=UI.fit?Math.min(st.clientWidth/W,st.clientHeight/H):1;
  fr.style.transform=`scale(${sc})`; fr.style.left=Math.max(0,(st.clientWidth-W*sc)/2)+'px'; fr.style.width=W+'px'; fr.style.height=H+'px';
}
function saveView(){try{localStorage.setItem(KEY+'-view',JSON.stringify({orient:UI.orient,fit:UI.fit,guide:{open:G.open,scene:G.scene,step:G.step}}))}catch(e){}}
/* 입력 칸이 바뀐 직후 버튼을 누르면 그 버튼이 다시 그려지며 사라지지 않게, 그리기를 잠깐 미룬다 */
let soonT=null;
function renderSoon(){clearTimeout(soonT);soonT=setTimeout(()=>{soonT=null;render()},300)}
function cancelSoon(){clearTimeout(soonT);soonT=null}
function flushRender(){if(soonT){cancelSoon();render()}}

/* ---------- 시작 ---------- */
(function boot(){
  try{const v=JSON.parse(localStorage.getItem(KEY+'-view')||'null');if(v){UI.orient=v.orient==='port'?'port':'land';UI.fit=v.fit!==false;if(v.guide){G.open=v.guide.open!==false;G.scene=Math.min(+v.guide.scene||0,SCENES.length-1);G.step=+v.guide.step||0}}}catch(e){}
  S=load(); save();
  const app=document.getElementById('app');
  app.addEventListener('click',ev=>{const el=ev.target.closest('[data-act]');if(!el||el.disabled||!app.contains(el)){flushRender();return}cancelSoon();if(UI.ask&&!/^ask/.test(el.dataset.act))UI.ask=null;const f=ACT[el.dataset.act];if(f)f(el.dataset,el,ev)});
  app.addEventListener('change',ev=>{const el=ev.target.closest('[data-on]');if(!el)return;const f=ON[el.dataset.on];if(f)f(el.value,el.dataset,el)});
  let selNext=null;app.addEventListener('focusin',ev=>{const el=ev.target;if(el.matches&&el.matches('input.numin,input.ci')){try{el.select()}catch(e){}selNext=el}});
  app.addEventListener('mouseup',ev=>{if(selNext&&ev.target===selNext){ev.preventDefault()}selNext=null});
  app.addEventListener('keydown',ev=>{const el=ev.target;if(ev.key==='Enter'&&el.matches&&el.matches('input.numin,input.ci'))el.blur()});
  app.addEventListener('input',ev=>{const el=ev.target;if(el.dataset&&el.dataset.d!=null)UI.draft[el.dataset.d]=el.value});
  app.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&UI.modal){UI.modal=null;render()}});
  document.getElementById('b-orient').addEventListener('click',()=>{UI.orient=UI.orient==='land'?'port':'land';saveView();fit();render()});
  document.getElementById('b-fit').addEventListener('click',()=>{UI.fit=!UI.fit;saveView();fit();render()});
  document.getElementById('b-guide').addEventListener('click',()=>{G.open=!G.open;saveView();fit();render()});
  document.getElementById('guide').addEventListener('click',guideClick);
  window.addEventListener('resize',fit);
  try{new ResizeObserver(fit).observe(document.getElementById('stage'))}catch(e){}
  setInterval(()=>{const el=document.getElementById('timer-text');if(el&&UI.timer)el.innerHTML=timerText()},1000);
  render(); fit();
})();
