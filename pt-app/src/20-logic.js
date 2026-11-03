/* ---------- 도구 ---------- */
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let _n=0; const uid=p=>(p||'x')+Date.now().toString(36)+(_n++).toString(36);
const clone=o=>JSON.parse(JSON.stringify(o));
const pd=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const iso=dt=>`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
const md=s=>{if(!s)return'';const d=pd(s);return `${d.getMonth()+1}/${d.getDate()}`};
const mdw=s=>s?`${md(s)} (${DOW[pd(s).getDay()]})`:'';
const addDays=(s,n)=>{const d=pd(s);d.setDate(d.getDate()+n);return iso(d)};
const daysBetween=(a,b)=>Math.round((pd(b)-pd(a))/86400000);
const floorTo=(w,inc)=>{inc=+inc||2.5;return Math.round(Math.floor(w/inc+1e-9)*inc*100)/100};
const numOr=(v)=>{if(v===''||v==null)return null;const n=Number(v);return Number.isFinite(n)?n:String(v)};
const isNum=v=>typeof v==='number'&&Number.isFinite(v);
const firstNum=v=>{if(isNum(v))return v;const m=String(v??'').match(/\d+(\.\d+)?/);return m?Number(m[0]):null};

/* ---------- 상태 ---------- */
const KEY='pt-mvp-proto-v3.1';
let S=null;
const UI={ask:null,route:{name:'today'},stack:[],modal:null,draft:{},toast:null,orient:'land',fit:true,timer:null,cur:{},open:{},search:'',edit:null,flags:{}};
const todayIso=()=>(S&&S.today)||'2026-10-07';
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(typeof guideSoon==='function')guideSoon()}
function load(){try{const t=localStorage.getItem(KEY);if(t){const s=JSON.parse(t);if(s&&s.v===3)return s}}catch(e){}return buildSeed()}

const EX=id=>S.exercises[id]||{name:id,part:'',unit:'',inc:2.5};
const M=id=>S.members.find(m=>m.id===id);
const SES=id=>S.sessions.find(s=>s.id===id);
const byDate=(a,b)=>a.date<b.date?-1:a.date>b.date?1:((a.time||'')<(b.time||'')?-1:1);
const msessions=mid=>S.sessions.filter(s=>s.memberId===mid).sort(byDate);
const completed=mid=>msessions(mid).filter(s=>s.status==='completed');
const upcoming=mid=>msessions(mid).find(s=>s.status==='planned'||s.status==='in_progress');
const tplOf=(m,tid)=>m.templates.find(t=>t.id===tid);
const splitName=(s)=>{const m=M(s.memberId);return tplOf(m,s.templateId)?.name||s.splitName||'분할 없음'};
const hasAct=x=>x.sets.some(st=>st.aw!=null||st.ar!=null);
const liveEx=s=>s.exercises.filter(x=>x.status!=='removed'&&x.status!=='swapped');

function mkSet(kind,w,r){return {kind:kind||'working',pw:w??null,pr:r??null,aw:null,ar:null,src:null,done:false,rir:null,pain:false,added:false}}
function parseSets(spec){
  const out=[]; if(!spec) return out;
  for(let tok of String(spec).split(',')){
    tok=tok.trim(); if(!tok) continue;
    let kind='working'; const km=tok.match(/^(W|T|B|D):/);
    if(km){kind={W:'warmup',T:'top',B:'backoff',D:'drop'}[km[1]];tok=tok.slice(2)}
    const p=tok.split('x'); const w=p[0]?numOr(p[0]):null; const r=p[1]?numOr(p[1]):null; const n=p[2]?parseInt(p[2],10):1;
    for(let i=0;i<n;i++) out.push({kind,w,r});
  }
  return out;
}

function buildSeed(){
  const st={v:3,today:'2026-10-07',exercises:clone(EXERCISES),members:[],sessions:[],settings:{restTimer:false,basis:'same',roles:clone(ROLE_DEFAULTS)}};
  S=st;
  for(const sm of SEED_MEMBERS){
    const m={id:sm.id,code:sm.code,goals:clone(sm.goals).map(g=>({id:uid('g'),...g})),cautions:[],
      notes:sm.notes.map(n=>({id:uid('n'),kind:n.kind,text:n.text,created:'',done:false})),
      body:[],movement:[],blocks:[],exMemos:clone(sm.exMemos||{}),
      templates:sm.templates.map(t=>({id:t.id,name:t.name,items:t.items.map(([exId,role,structure])=>({exId,role,structure:structure||'스트레이트'})),versions:[{date:'',note:'수첩 목록에서 만듦'}]}))};
    st.members.push(m);
    for(const ss of sm.sessions) seedSession(m,ss);
    for(const n of [].concat(sm.next||[])) createPlanned(m,n.d,n.time,n.t);
  }
  return st;
}
/* 다른 회원의 10/7 뒤 수첩 기록: 시연 날짜가 그날을 지나면 넣는다. 같은 날 계획 수업이 있으면 기록으로 바꾼다 */
function seedOthers(upTo){
  for(const [mid,list] of Object.entries(OTHERS_LATER)){const m=M(mid);if(!m)continue;
    for(const ss of list){if(ss.d>=upTo)continue;
      const p=S.sessions.find(s=>s.memberId===mid&&s.date===ss.d&&s.status==='planned');if(p)S.sessions.splice(S.sessions.indexOf(p),1);
      if(S.sessions.some(s=>s.memberId===mid&&s.date===ss.d&&s.seeded))continue;
      seedSession(m,ss)}}
}
function seedSession(m,ss){
      const s={id:uid('s'),memberId:m.id,date:ss.d,time:'',templateId:ss.t,status:ss.planOnly?'plan_only':'completed',cond:null,cautionChecks:{},goal:'',memo:ss.memo||'',observations:[],nextTargets:clone(ss.targets||{}),seeded:true,exercises:[]};
      const byEx={};
      for(const [exId,role,spec,o] of ss.ex){
        const act=parseSets(spec); const plan=o.p?parseSets(o.p):act;
        const n=Math.max(act.length,plan.length); const sets=[];
        for(let i=0;i<n;i++){
          const a=act[i],p=plan[i]; const x=mkSet((a||p).kind,p?p.w:null,p?p.r:null);
          if(!ss.planOnly&&a){x.aw=a.w;x.ar=a.r;x.done=true;x.src='entered'}
          if(!p) x.added=true;
          sets.push(x);
        }
        const e={uid:uid('e'),exId,role,structure:'스트레이트',origin:o.origin||'template',status:o.status||'done',reason:o.reason||'',scope:'',raw:o.raw||'',note:o.note||'',setting:o.setting||'',sets,basis:null,rest:(ROLE_DEFAULTS[role]||{}).rest||60};
        byEx[exId]=e; s.exercises.push(e);
      }
      for(const [exId,,,o] of ss.ex){ if(o.to&&byEx[exId]&&byEx[o.to]) byEx[exId].replacedBy=byEx[o.to].uid; }
      S.sessions.push(s);
      return s;
}

/* ---------- 숫자 채우기 (D52, D57, D59, 워크플로우 v2 6단계) ---------- */
function prevDone(m,beforeDate){return completed(m.id).filter(s=>s.date<beforeDate).reverse()}
function findActual(m,exId,beforeDate,splitId,basis){
  for(const s of prevDone(m,beforeDate)){
    if(basis==='same'&&s.templateId!==splitId) continue;
    const x=s.exercises.find(e=>e.exId===exId&&e.status==='done'&&hasAct(e));
    if(x) return {s,x};
  }
  return null;
}
function findTarget(m,exId,beforeDate){
  for(const s of prevDone(m,beforeDate)){
    const x=s.exercises.find(e=>e.exId===exId&&e.status==='done');
    if(x){const t=s.nextTargets?.[exId];return t&&(t.w!=null||t.r!=null)?{s,t}:null}
  }
  return null;
}
function bestE1(m,exId,beforeDate){
  for(const s of prevDone(m,beforeDate)){
    const x=s.exercises.find(e=>e.exId===exId&&e.status==='done'); if(!x) continue;
    let best=null;
    for(const st of x.sets){
      if(st.kind==='warmup'||st.kind==='drop') continue;
      if(!isNum(st.aw)||!isNum(st.ar)||st.aw<=0||st.ar<1||st.ar>10) continue;
      const rir=isNum(st.rir)?st.rir:0; const e=st.aw*(1+(st.ar+rir)/30);
      if(!best||e>best.e) best={e,w:st.aw,r:st.ar,rir,date:s.date,rirBlank:!isNum(st.rir)};
    }
    if(best) return best;
  }
  return null;
}
function lastWeight(m,exId,beforeDate){
  for(const s of prevDone(m,beforeDate)){
    const x=s.exercises.find(e=>e.exId===exId&&e.status==='done'); if(!x) continue;
    const st=x.sets.filter(st=>st.kind!=='warmup'&&isNum(st.aw)&&st.aw>0).pop(); if(st) return {w:st.aw,date:s.date};
  }
  return null;
}
const wFor=(e1,reps,rir,inc)=>floorTo(e1/(1+(reps+rir)/30),inc);

function fillExercise(m,item,date,splitId,force,prevItems){
  const R=S.settings.roles[item.role]||S.settings.roles['보조']; const e=EX(item.exId); const inc=+e.inc||2.5;
  const out={sets:[],basis:{tag:'',date:'',lines:[],options:[]},rest:R.rest,prir:R.rir};
  const tgt=findTarget(m,item.exId,date), same=findActual(m,item.exId,date,splitId,'same'), recent=findActual(m,item.exId,date,splitId,'recent'), e1=bestE1(m,item.exId,date);
  const opts=[]; if(tgt)opts.push('target'); if(same)opts.push('same'); if(recent&&(!same||recent.s.id!==same.s.id))opts.push('recent'); opts.push('rule');
  let mode=force&&opts.includes(force)?force:null;
  if(!mode){ if(tgt) mode='target'; else if(S.settings.basis==='recent'&&recent) mode='recent'; else if(same) mode='same'; else if(recent) mode='recent'; else mode='rule'; }
  const B=out.basis; B.options=opts; B.mode=mode; B.e1=e1;
  const ruleSets=(w)=>{const n=R.sets;const a=[];for(let i=0;i<n;i++)a.push(mkSet('working',w,R.target));return a};
  if(mode==='target'){
    const w=tgt.t.w!=null?+tgt.t.w:null; const r=tgt.t.r!=null?tgt.t.r:R.target;
    for(let i=0;i<R.sets;i++) out.sets.push(mkSet('working',w,r));
    B.tag='목표';B.date=tgt.s.date;
    B.lines.push(`${md(tgt.s.date)} 수업 끝에 남긴 다음 목표: ${tgt.t.w!=null?fw(tgt.t.w,item.exId):''}${tgt.t.r!=null?' × '+tgt.t.r:''}${tgt.t.raw||tgt.t.text?` “${tgt.t.raw||tgt.t.text}”`:''}`);
    if(tgt.t.r==null) B.lines.push(`횟수·세트는 역할(${item.role}) 기준: ${R.rmin}~${R.rmax}회 가운데 ${R.target}회 × ${R.sets}세트 (논문 기준 임시값)`);
  } else if(mode==='same'||mode==='recent'){
    const src=mode==='same'?same:recent;
    out.sets=src.x.sets.filter(st=>st.aw!=null||st.ar!=null).map(st=>mkSet(st.kind,st.aw,st.ar));
    B.tag=mode==='same'?'같은 분할':'최근'; B.date=src.s.date;
    B.lines.push(`${mdw(src.s.date)} ${splitName(src.s)} 실제값: ${fsets(src.x.sets,item.exId,'a')||'—'}`);
    // 그날 무게나 횟수가 비어 있으면: 무게는 그 전 실제 무게, 횟수는 역할 기준으로 채운다
    const noW=v=>v==null||v==='';if(out.sets.some(st=>noW(st.pw))){const lw=lastWeight(m,item.exId,src.s.date);
      if(lw){out.sets.forEach(st=>{if(noW(st.pw))st.pw=lw.w});B.lines.push(`그날 무게가 없어 그 전 ${md(lw.date)} 실제 무게 ${fw(lw.w,item.exId)}를 씀`)}
      else{B.tag='무게 찾기';B.lines.push('이 종목의 무게 기록이 없어 무게를 비워 둠')}}
    const noR=v=>v==null||v==='';if(out.sets.some(st=>noR(st.pr))){out.sets.forEach(st=>{if(noR(st.pr))st.pr=R.target});B.lines.push(`그날 횟수가 없어 역할(${item.role}) 기준 ${R.target}회로 채움 (논문 기준 임시값)`)}
    if(src.x.role&&src.x.role!==item.role) B.lines.push(`그때 역할은 ${src.x.role}, 오늘 역할은 ${item.role}`);
    const between=msessions(m.id).filter(s=>s.date<date&&s.date>src.s.date&&(mode==='recent'||s.templateId===splitId));
    for(const k of between){const y=k.exercises.find(e=>e.exId===item.exId); if(!y) continue;
      if(k.status==='plan_only') B.lines.push(`${md(k.date)} 칸은 무게만 있어(했는지 모름) 건너뜀`);
      else if(k.status==='completed'&&y.status==='removed') B.lines.push(`${md(k.date)}에는 뺌${y.reason?' ('+y.reason+')':''}`);
      else if(k.status==='completed'&&y.status==='swapped'){const to=k.exercises.find(e=>e.uid===y.replacedBy);B.lines.push(`${md(k.date)}에는 ${to?EX(to.exId).name+'(으)로 ':''}바꿔서 기록 없음`)}}
  } else {
    if(e1){
      const w=wFor(e1.e,R.target,R.rir,inc); out.sets=ruleSets(w); B.tag='규칙';
      B.lines.push(`추정 1RM = ${e1.w} × (1 + (${e1.r} + ${e1.rir}) ÷ 30) = ${Math.round(e1.e*10)/10} (${md(e1.date)} ${e1.w} × ${e1.r}회${e1.rirBlank?', 여유 횟수 기록 없음 → 0':''})`);
      B.lines.push(`목표 ${R.target}회·여유 ${R.rir}회 → ${Math.round(e1.e*10)/10} ÷ (1 + ${R.target+R.rir}/30) = ${Math.round(e1.e/(1+(R.target+R.rir)/30)*10)/10} → 눈금 ${inc}에 맞춰 ${w}`);
      B.lines.push('공식: 무게 × (1 + (횟수 + 여유 횟수) ÷ 30), 10회 이하 세트만 (논문 기준 임시값, D59)');
    } else {
      out.sets=ruleSets(null); B.tag='무게 찾기'; out.prir=R.rir+1;
      B.lines.push('이 회원의 이 종목 기록이 없거나 10회 이하 세트가 없어 무게를 비워 둠');
      B.lines.push(`횟수는 역할(${item.role}) 기준 ${R.target}회, 목표 여유 횟수는 1 높여 ${R.rir+1}회로 가볍게 시작`);
    }
  }
  if((mode==='target'||mode==='rule')&&out.sets.length){
    const w0=out.sets[0].pw;
    if(item.structure==='탑세트+백오프'&&out.sets.length>1){
      out.sets[0].kind='top';
      for(let i=1;i<out.sets.length;i++){const st=out.sets[i];st.kind='backoff';st.pr=(isNum(st.pr)?st.pr:R.target)+4;st.pw=(e1&&w0!=null)?wFor(e1.e,st.pr,R.rir,inc):(w0!=null?floorTo(w0*0.85,inc):null)}
      B.lines.push('탑세트+백오프: 백오프는 횟수 +4, 무게는 추정 1RM에서 다시 계산(없으면 탑의 85%, 예시)');
    } else if(item.structure==='드롭세트'&&w0!=null){
      out.sets.push(mkSet('drop',floorTo(w0*0.8,inc),R.target)); B.lines.push('드롭세트: 마지막에 약 20% 내린 세트 하나 (논문 기준 임시값)');
    }
  }
  if(item.role==='메인'&&(mode==='target'||mode==='rule')&&!prevItems.some(p=>p.role==='워밍업')){
    const first=out.sets.find(st=>isNum(st.pw)); const lw=lastWarmup(m,item.exId,date);
    if(lw){out.sets.unshift(...lw.sets.map(st=>mkSet('warmup',st.aw,st.ar)));
      B.lines.push(`워밍업: ${md(lw.s.date)}에 실제로 한 워밍업 ${lw.sets.map(st=>fw(st.aw,item.exId)+' × '+st.ar).join(', ')}을 그대로 가져옴`);}
    else if(first){const w1=floorTo(first.pw*0.5,inc),w2=floorTo(first.pw*0.75,inc);out.sets.unshift(mkSet('warmup',w1,12),mkSet('warmup',w2,12));
      B.lines.push(`워밍업: 지난 워밍업 기록이 없어 첫 본세트 ${fw(first.pw,item.exId)}의 50%·75% → ${fw(w1,item.exId)}, ${fw(w2,item.exId)} (계산, 논문 기준 임시값)`);}
  }
  if(R.rounds) B.lines.push('유산소성 순환: 횟수 칸은 라운드 수로 씀');
  const lastTop=(same||recent)&&topSet(((same||recent).x));
  if(mode!=='rule'&&lastTop&&isNum(lastTop.r)&&lastTop.r>10&&isNum(lastTop.w)) B.lines.push(`${md((same||recent).s.date)} ${fw(lastTop.w,item.exId)} × ${lastTop.r}회로 추정 1RM 공식을 쓰면 ${Math.round(lastTop.w*(1+lastTop.r/30)*10)/10}이 나오지만, 10회가 넘는 세트라 공식을 쓰지 않았어요 (공식은 10회 이하만, D59)`);
  B.lines.push("기본 추천은 컨디션 '보통' 기준이에요. 수업 시작에서 컨디션이 다르면 바뀐 숫자를 주황색으로 보여 줘요 (D67)");
  return out;
}

function planExercise(m,item,date,splitId,prevItems,force){
  const f=fillExercise(m,item,date,splitId,force,prevItems||[]);
  const memo=m.exMemos[item.exId];
  return {uid:uid('e'),exId:item.exId,role:item.role,structure:item.structure||'스트레이트',origin:'template',status:'planned',reason:'',scope:'',raw:'',note:'',setting:memo?.setting||'',sets:f.sets,basis:f.basis,rest:f.rest,prir:f.prir,force:force||null,edited:false};
}
function createPlanned(m,date,time,tid){
  const t=tplOf(m,tid); const s={id:uid('s'),memberId:m.id,date,time:time||'',templateId:tid,status:'planned',cond:null,cautionChecks:{},goal:'',memo:'',observations:[],nextTargets:{},exercises:[]};
  const prev=[];
  for(const it of (t?t.items:[])){s.exercises.push(planExercise(m,it,date,tid,prev));prev.push(it)}
  const tg=s.exercises.map(x=>{const t=findTarget(m,x.exId,date);return t?(t.t.text?`${EX(x.exId).name} ${t.t.text}`:`${EX(x.exId).name} ${t.t.w!=null?fw(t.t.w,x.exId):''}${t.t.r!=null?' × '+t.t.r:''}`):null}).filter(Boolean);
  s.goal=tg.length?tg.join(' / '):'';
  S.sessions.push(s); return s;
}
function refill(s,x,force){
  const m=M(s.memberId); const idx=s.exercises.indexOf(x); const prev=s.exercises.slice(0,idx).map(e=>({role:e.role}));
  const f=fillExercise(m,{exId:x.exId,role:x.role,structure:x.structure},s.date,s.templateId,force,prev);
  x.sets=f.sets;x.basis=f.basis;x.rest=f.rest;x.prir=f.prir;x.force=force||null;x.edited=false;
}

/* ---------- 표기 ---------- */
function fw(w,exId){if(w==null||w==='')return '—';const e=EX(exId);const u=e.unit||'';return e.side?`${w}/${w}${u}`:`${w}${u}`}
function fsets(sets,exId,which){
  const g=st=>which==='a'?[st.aw,st.ar]:[st.pw,st.pr];
  const arr=sets.filter(st=>{const [w,r]=g(st);return w!=null||r!=null}); const parts=[]; let i=0;
  while(i<arr.length){
    const st=arr[i]; const [w,r]=g(st); let n=1;
    while(i+n<arr.length){const [tw,tr]=g(arr[i+n]);if(tw===w&&String(tr)===String(r)&&arr[i+n].kind===st.kind)n++;else break}
    let t=w!=null?fw(w,exId):'';
    if(r!=null) t+=(t?' × ':'')+r+(isNum(r)&&!t?'회':'');
    if(n>1) t+=r!=null?` × ${n}`:` (${n}세트)`;
    if(st.kind!=='working') t=KINDS[st.kind]+' '+t;
    parts.push(t); i+=n;
  }
  return parts.join(', ');
}
const roleShort=r=>r;

/* ---------- 요약 계산 (9단계) ---------- */
const ftop=(t,ex)=>fw(t.w,ex)+(t.r?' × '+t.r:'');
function topSet(x){let b=null;for(const st of x.sets){if(st.kind==='warmup'||!isNum(st.aw))continue;const r=isNum(st.ar)?st.ar:firstNum(st.ar)||0;if(!b||st.aw>b.w||(st.aw===b.w&&r>b.r))b={w:st.aw,r}}return b}
function prFor(m,s,x){
  const today=topSet(x); if(!today) return null;
  let best=null,bestDate='';
  for(const p of completed(m.id)){ if(p.id===s.id||p.date>=s.date) continue;
    for(const y of p.exercises){ if(y.exId!==x.exId||y.status!=='done') continue; const t=topSet(y); if(t&&(!best||t.w>best.w||(t.w===best.w&&t.r>best.r))){best=t;bestDate=p.date} } }
  if(!best) return {first:true,today};
  if(today.w>best.w||(today.w===best.w&&today.r>best.r)) return {best,bestDate,today};
  return null;
}
function lastSame(m,s,exId){
  for(const p of completed(m.id).reverse()){ if(p.id===s.id||p.date>=s.date||p.templateId!==s.templateId) continue; const y=p.exercises.find(e=>e.exId===exId&&e.status==='done'&&hasAct(e)); if(y) return {p,y}; }
  return null;
}
function sessionChanges(s){
  const ch=[];
  for(const x of s.exercises){
    const n=EX(x.exId).name;
    if(x.status==='removed'){ch.push(`${n} 뺌 (이유: ${x.reason||'이유 없음'})`);continue}
    if(x.status==='swapped'){const to=s.exercises.find(e=>e.uid===x.replacedBy);ch.push(`${n} → ${to?EX(to.exId).name:'?'} 바꿈 (${x.scope==='template'?'루틴 틀에도':'오늘만'}${x.reason?', 이유: '+x.reason:''})`);continue}
    if(x.origin==='added') ch.push(`${n} 새로 넣음`);
    const added=x.sets.filter(st=>st.added&&st.done).length; if(added) ch.push(`${n} 세트 ${added}개 추가`);
    const edited=x.sets.filter(st=>st.done&&!st.added&&(st.aw!==st.pw||String(st.ar)!==String(st.pr))).length; if(edited) ch.push(`${n} 숫자 고친 세트 ${edited}개`);
    const untouched=x.sets.filter(st=>!st.done&&!st.added).length; if(untouched&&x.status!=='planned') ch.push(`${n} 기록 안 한 세트 ${untouched}개`);
  }
  return ch;
}
/* 오늘 종목을 루틴 틀과 견줄 때: '오늘만' 바꾼 것은 원래 종목으로, 시간·컨디션·통증으로 뺀 것은 그대로 있는 것으로 본다 */
const SOFT_REASONS=['시간','컨디션','통증','기록 안 함'];
function todayItems(s){
  const out=[];
  for(const x of s.exercises){
    if(x.status==='swapped'){ if(x.scope!=='template') out.push(x); continue; }
    if(x.origin==='swap'){ const from=s.exercises.find(e=>e.replacedBy===x.uid); if(from&&from.scope!=='template') continue; }
    if(x.status==='removed'&&!SOFT_REASONS.includes(x.reason)) continue;
    out.push(x);
  }
  return out;
}
function differsFromTemplate(s){
  const t=tplOf(M(s.memberId),s.templateId); if(!t) return false;
  return t.items.map(i=>i.exId).join('|')!==todayItems(s).map(x=>x.exId).join('|');
}
function sessionVolume(s){let v=0;for(const x of s.exercises){if(x.status!=='done')continue;const e=EX(x.exId);for(const st of x.sets){if(st.kind==='warmup')continue;const w=isNum(st.aw)?st.aw:null,r=isNum(st.ar)?st.ar:firstNum(st.ar);if(w&&r)v+=w*r*(e.side?2:1)}}return Math.round(v)}

/* ---------- 세트 고치기 (예정 루틴은 계획 숫자, 수업 중에는 실제 숫자) ---------- */
const isLive=s=>s.status==='in_progress';
const liveDone=st=>st.ar!=null&&st.ar!==''&&(st.aw!=null||st.pw==null);
const sameGroup=(a,b)=>(a.kind==='warmup')===(b.kind==='warmup');
function updateExStatus(x){if(x.status==='planned'||x.status==='done')x.status=x.sets.some(st=>st.done)?'done':'planned'}
function setField(s,x,i,f,v){
  const st=x.sets[i]; if(!st) return;
  if(isLive(s)){
    const was=st.done;
    if(f==='w') st.aw=v; else st.ar=v;
    if(st.aw==null&&f!=='w'&&isNum(st.pw)) st.aw=st.pw;
    if(st.ar==null&&f!=='r'&&isNum(st.pr)) st.ar=st.pr;
    st.done=liveDone(st); st.src=st.done?'entered':null; updateExStatus(x);
    if(st.done&&!was) onSetDone(s,x,i); else if(st.done) replanAfter(s,x,i); else revertLive(x,i);
  } else { if(f==='w') st.pw=v; else st.pr=v; x.edited=true; delete st.adj; }
}
function confirmSet(x,st,s){const was=st.done;st.aw=st.pw;st.ar=st.pr;st.done=true;st.src='confirmed';updateExStatus(x);if(s&&!was)onSetDone(s,x,x.sets.indexOf(st))}
function applyBelow(s,x,i){
  const st=x.sets[i]; const live=isLive(s); const w=live?(st.aw??st.pw):st.pw, r=live?(st.ar??st.pr):st.pr; let n=0;
  x.sets.forEach((t,j)=>{if(j<=i||!sameGroup(t,st)||(live&&t.done))return;t.pw=w;t.pr=r;n++});
  if(!live) x.edited=true; return n;
}
function newSet(s,x){const l=x.sets[x.sets.length-1];const ns=mkSet(l&&l.kind!=='warmup'?l.kind:'working',l?(l.aw??l.pw):null,l?(l.ar??l.pr):null);if(isLive(s))ns.added=true;else x.edited=true;x.sets.push(ns);return ns}
function swapExercise(s,x,to,scope){
  const m=M(s.memberId); const i=s.exercises.indexOf(x);
  const y=planExercise(m,{exId:to,role:x.role,structure:x.structure},s.date,s.templateId,s.exercises.slice(0,i).map(e=>({role:e.role})));y.origin='swap';
  s.exercises.splice(i+1,0,y);x.status='swapped';x.scope=scope||'today';x.replacedBy=y.uid;
  if(x.scope==='template'){const t=tplOf(m,s.templateId);const it=t&&t.items.find(k=>k.exId===x.exId);if(it){it.exId=to;tplTouched(t,`${EX(x.exId).name} → ${EX(to).name}`,s.date)}}
  return y;
}
function removeExercise(s,x,reason){x.status='removed';x.reason=reason}
function tplTouched(t,note,date){const d=date||todayIso();const l=t.versions[t.versions.length-1];if(l&&l.date===d&&l.note===note)return;t.versions.push({date:d,note})}
function nextTpl(m,s){const i=m.templates.findIndex(t=>t.id===s.templateId);return m.templates.length?m.templates[(i+1)%m.templates.length].id:''}
function ensureNext(s){const m=M(s.memberId);if(!s.next)s.next={targets:{},np:{on:true,date:addDays(s.date,7),time:s.time||'',tid:nextTpl(m,s)}};return s.next}
function answerTemplate(s,v){
  const m=M(s.memberId); s.tplAnswer=v;
  if(v==='yes'){const t=tplOf(m,s.templateId);if(t){t.items=todayItems(s).map(x=>({exId:x.exId,role:x.role,structure:x.structure}));tplTouched(t,`${md(s.date)} 수업의 종목·순서로 고침`,s.date)}}
}
function finishSession(s){
  const m=M(s.memberId); const nx=ensureNext(s);
  for(const x of s.exercises){
    if(x.status==='planned'||x.status==='done'){if(x.sets.some(st=>st.done))x.status='done';else{x.status='removed';x.reason='기록 안 함'}}
    if(x.status!=='done') continue;
    if(x.setting||x.note){const p=m.exMemos[x.exId]||{};m.exMemos[x.exId]={setting:x.setting||p.setting||'',memo:x.note||p.memo||'',date:s.date}}
    const t=nx.targets[x.exId]; if(t&&(t.w!=null||t.r!=null||(t.text||'').trim())) s.nextTargets[x.exId]={w:t.w??null,r:t.r??null,text:(t.text||'').trim()};
  }
  s.status='completed'; s.endedAt=new Date().toISOString();
  return nx.np.on&&nx.np.tid?createPlanned(m,nx.np.date||addDays(s.date,7),nx.np.time,nx.np.tid):null;
}
function lastWarmup(m,exId,date){
  for(const s of prevDone(m,date)){const x=s.exercises.find(e=>e.exId===exId&&e.status==='done');if(!x)continue;
    const w=x.sets.filter(st=>st.kind==='warmup'&&st.done&&isNum(st.aw));return w.length?{s,sets:w}:null}
  return null;
}

/* ---------- v3: 컨디션 반영 (D67)과 수업 중 실시간 다시 맞추기 (D66) ----------
   예정 루틴은 컨디션 '보통' 기준으로 채운다. 수업 시작에서 수면·피로·근육통이 '나쁨'이면 메인·보조 종목의
   남은 세트를 여유 1개 더 남기게 바꾸고 주황색(cond)으로 표시한다. 세트를 끝낸 결과가 계획과 많이 다르면
   같은 종목의 남은 세트를 바꾸고 보라색(live)으로 표시한다. 바뀐 세트에는 원래 숫자(from)와 근거(lines)를 남긴다. */
const SET_MIN=1, SWITCH_MIN=2, START_MIN=4, WRAP_MIN=5, CLASS_MIN=60, SPARE_MIN=5;
const condBadNames=c=>COND_ITEMS.filter(([k])=>k!=='pain'&&c&&c[k]==='poor').map(([,l])=>l);
function repRange(r){if(isNum(r))return [r,r];const m=String(r??'').match(/^\s*(\d+)\s*[-~]\s*(\d+)\s*$/);return m?[+m[1],+m[2]]:null}
function shiftReps(r,d){if(isNum(r))return Math.max(1,r+d);const g=repRange(r);return g?`${Math.max(1,g[0]+d)}-${Math.max(1,g[1]+d)}`:r}
const r1=v=>Math.round(v*10)/10;
function applyCondition(s){
  const bad=condBadNames(s.cond);
  for(const x of liveEx(s)){
    const R=S.settings.roles[x.role]||S.settings.roles['보조']; const inc=+EX(x.exId).inc||2.5;
    for(const st of x.sets){
      if(st.done) continue;
      if(st.adj&&st.adj.by==='cond'){st.pw=st.adj.from.w;st.pr=st.adj.from.r;delete st.adj}
      if(!bad.length||st.kind==='warmup'||!['메인','보조'].includes(x.role)||st.adj) continue;
      const from={w:st.pw,r:st.pr}; const rir=isNum(x.prir)?x.prir:R.rir; const g=repRange(st.pr);
      const lines=[`오늘 ${bad.join('·')} '나쁨' → 여유 횟수를 1개 더 남기게 해요 (목표 여유 ${rir}회 → ${rir+1}회)`];
      if(isNum(st.pw)&&g&&g[1]<=10){
        const t=g[1]; const e1=st.pw*(1+(t+rir)/30); const raw=e1/(1+(t+rir+1)/30); const nw=floorTo(raw,inc);
        if(nw<st.pw){st.pw=nw;lines.push(`추정 1RM ${from.w} × (1 + (${t} + ${rir}) ÷ 30) = ${r1(e1)} → 같은 ${t}회를 여유 ${rir+1}회로 하면 ${r1(e1)} ÷ (1 + ${t+rir+1}/30) = ${r1(raw)} → 눈금 ${inc}에 맞춰 ${nw}`)}
        else {st.pr=shiftReps(st.pr,-1);lines.push(`무게를 한 눈금(${inc}) 내리면 여유 1개보다 많이 가벼워져서, 무게는 그대로 두고 횟수를 1개 줄였어요`)}
      } else if(st.pr!=null){st.pr=shiftReps(st.pr,-1);lines.push('10회 넘는 세트라 추정 1RM 공식을 쓰지 않고, 무게는 그대로 두고 횟수를 1개 줄였어요 (여유 1개 = 1회)')}
      else continue;
      lines.push('수면이 부족하면 하체 근력이 평균 약 3% 낮았다는 연구가 있어요 [Craven 2022]. 고정 %로 깎지 않고, 여러 항목이 나빠도 점수 하나로 합치지 않고 여유만 1개 늘려요 (논문 기준 임시값, D59)');
      lines.push('통증은 숫자를 바꾸지 않아요. 트레이너가 정해요');
      st.adj={by:'cond',from,lines};
    }
  }
}
function revertLive(x,i){for(const t of x.sets){if(t.done||!t.adj||t.adj.by!=='live'||t.adj.src!==i)continue;t.pw=t.adj.from.w;t.pr=t.adj.from.r;delete t.adj}}
function replanAfter(s,x,i){
  const st=x.sets[i]; if(!st) return;
  for(let j=i+1;j<x.sets.length;j++){const t=x.sets[j];if(!t.done&&t.adj&&t.adj.by==='live'){t.pw=t.adj.from.w;t.pr=t.adj.from.r;delete t.adj}}
  if(!st.done||st.kind==='warmup') return;
  const rest=x.sets.filter((t,j)=>j>i&&!t.done&&sameGroup(t,st)); if(!rest.length) return;
  const e=EX(x.exId), inc=+e.inc||2.5; const pw=st.pw, aw=st.aw; const ar=isNum(st.ar)?st.ar:firstNum(st.ar);
  if(isNum(aw)&&isNum(pw)&&aw<pw) return; // 가볍게 시작한 세트로 보고 남은 세트는 그대로 둔다
  const heavier=isNum(aw)&&(pw==null||(isNum(pw)&&aw>pw)); const g=repRange(st.pr); const no=setNo(x,i);
  const lines=[]; let over=false,under=false;
  if(heavier) lines.push(pw==null?`${no}세트를 ${fw(aw,x.exId)}으로 해서 남은 세트 무게도 ${fw(aw,x.exId)}으로 채웠어요`:`${no}세트를 계획 ${fw(pw,x.exId)}보다 무겁게 ${fw(aw,x.exId)}으로 해서 남은 세트도 ${fw(aw,x.exId)}으로 바꿨어요`);
  if(g&&ar!=null){
    if(ar>=g[1]+3){over=true;lines.push(g[1]<=10&&isNum(aw)?`${no}세트 ${ar}회 = 목표 ${st.pr}회보다 ${ar-g[1]}개 더 → 무게를 한 눈금(${inc}) 올렸어요. 그날 한 결과로 남은 세트를 맞추는 방식이에요 [Helms 2018]`:`${no}세트 ${ar}회 = 목표 ${st.pr}회보다 ${ar-g[1]}개 더 → 10회 넘는 세트라 무게는 그대로, 남은 세트 목표를 ${ar}회로 바꿨어요`)}
    else if(ar<=g[0]-2){under=true;lines.push(g[1]<=10&&isNum(aw)&&aw-inc>0?`${no}세트 ${ar}회 = 목표 ${st.pr}회보다 ${g[0]-ar}개 적음 → 무게를 한 눈금(${inc}) 내렸어요`:`${no}세트 ${ar}회 = 목표 ${st.pr}회보다 ${g[0]-ar}개 적음 → 무게는 그대로, 남은 세트 목표를 ${ar}회로 바꿨어요`)}
  }
  if(!lines.length) return;
  lines.push('기준: 무겁게 했거나, 횟수가 목표보다 3개 이상 많거나 2개 이상 적을 때만 바꿔요. 가볍게 시작한 세트는 따라가지 않아요 (Claude 기본값, 트레이너 확인 전)');
  for(const t of rest){
    const from={w:t.pw,r:t.pr}; const base=heavier?aw:t.pw; let nw=heavier?aw:t.pw, nr=t.pr;
    if(over){if(g[1]<=10&&isNum(base))nw=Math.round((base+inc)*100)/100;else nr=ar}
    if(under){if(g[1]<=10&&isNum(base)&&base-inc>0)nw=Math.round((base-inc)*100)/100;else nr=ar}
    if(nw===t.pw&&String(nr)===String(t.pr)) continue;
    t.pw=nw;t.pr=nr;t.adj={by:'live',src:i,from:t.adj&&t.adj.by==='cond'?t.adj.from:from,lines,cond:t.adj&&t.adj.by==='cond'?t.adj.lines:null};
  }
}
function undoAdj(x,st){if(!st.adj)return;st.pw=st.adj.from.w;st.pr=st.adj.from.r;st.adj={by:'undone',lines:st.adj.lines}}
/* 수업 시계(시연용): 세트를 끝낼 때마다 세트 1분 + 계획 쉬는 시간(종목 첫 세트면 옮기기 2분)만큼 간다.
   실제 앱에서는 '그대로'를 누른 시각 사이를 쉬는 시간으로 쓴다 */
function onSetDone(s,x,i){
  const st=x.sets[i]; const first=!x.sets.some((t,j)=>j!==i&&t.done&&t.doneMin!=null);
  const extra=s.extraRest||0; s.extraRest=0; // '시연 시계 +5분'으로 이미 시계에 더한 분
  const rest=first?null:(x.rest||60)/60+extra;
  s.clock=(s.clock??START_MIN)+(first?SWITCH_MIN:(x.rest||60)/60)+SET_MIN;
  st.doneMin=s.clock; st.restMin=rest;
  replanAfter(s,x,i);
}
function exMinutes(x){const n=x.sets.filter(st=>!st.done).length;if(!n)return 0;const k=EX(x.exId).uni?2:1;return (x.sets.some(st=>st.done)?0:SWITCH_MIN)+n*(SET_MIN*k+(x.rest||60)/60)}
function planMinutes(s){return Math.round(START_MIN+liveEx(s).reduce((a,x)=>a+SWITCH_MIN+x.sets.length*(SET_MIN*(EX(x.exId).uni?2:1)+(x.rest||60)/60),0)-SWITCH_MIN+WRAP_MIN)}
function timeState(s){const now=s.clock??START_MIN;const left=CLASS_MIN-now;const proj=liveEx(s).reduce((a,x)=>a+exMinutes(x),0);return {now,left,proj,tight:left-(proj+WRAP_MIN)<SPARE_MIN}}
const DROP_ORDER=['마무리 털기','혈류 모으기','유산소성 순환','보조'];
function canDrop(s,x){
  if(!isLive(s)||x.sets.some(st=>st.done)||!timeState(s).tight) return false;
  const cand=liveEx(s).filter(e=>!e.sets.some(st=>st.done)&&DROP_ORDER.includes(e.role));
  for(const r of DROP_ORDER){const c=cand.filter(e=>e.role===r);if(c.length)return c.includes(x)}
  return false;
}
function clockText(s,min){const [h,m]=(s.time||'19:00').split(':').map(Number);const t=h*60+m+Math.round(min);return `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`}
const restText=v=>v==null?'':`${Math.floor(v)}:${String(Math.round((v%1)*60)).padStart(2,'0')}`;
/* 마무리: 모든 본세트가 계획 범위 위 끝(또는 목표 횟수) 이상이면 '목표 넘음'. 표시만 하고 올리기는 트레이너가 누른다 */
function reachedTop(x){const w=x.sets.filter(st=>st.kind!=='warmup'&&st.done);if(!w.length)return false;return w.every(st=>{const g=repRange(st.adj&&st.adj.from?st.adj.from.r:st.pr);const a=isNum(st.ar)?st.ar:firstNum(st.ar);return g&&a!=null&&a>=g[1]})}
const todayMemos=(m,s)=>m.notes.filter(n=>n.kind==='check'&&n.due===s.id&&!n.done);
