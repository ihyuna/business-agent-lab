/* ---------- 화면 조각 ---------- */
function attrs(d){if(!d)return'';return Object.entries(d).map(([k,v])=>` data-${k}="${esc(v)}"`).join('')}
function btn(label,act,data,cls,dis){return `<button class="btn ${cls||''}" data-act="${act}"${attrs(data)}${dis?' disabled':''}>${label}</button>`}
function chips(options,cur,act,data){return options.map(([v,l])=>`<button class="chip${String(cur)===String(v)?' on':''}" data-act="${act}" data-v="${esc(v)}"${attrs(data)}>${esc(l)}</button>`).join(' ')}
const dv=(key,def)=>UI.draft[key]??def;
function dIn(key,ph,o={}){return `<input data-d="${key}" data-k="${key}" value="${esc(dv(key,o.v??''))}" placeholder="${esc(ph||'')}"${o.type?` type="${o.type}"`:''}${o.im?` inputmode="${o.im}"`:''} style="${o.w?`width:${o.w}px`:''}${o.grow?'flex:1;min-width:0':''}">`}
function dSel(key,options,def,o={}){const cur=dv(key,def);return `<select data-d="${key}" data-k="${key}" style="${o.w?`width:${o.w}px`:''}">${options.map(([v,l])=>`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`).join('')}</select>`}
function bIn(on,val,data,o={}){const k=on+'-'+Object.values(data||{}).join('-');return `<input data-on="${on}" data-k="${k}"${attrs(data)} value="${esc(val??'')}" placeholder="${esc(o.ph||'')}"${o.type?` type="${o.type}"`:''}${o.im?` inputmode="${o.im}"`:''} class="${o.cls||''}" style="${o.w?`width:${o.w}px`:''}${o.grow?'flex:1;min-width:0':''}${o.full?'width:100%':''}">`}
function bArea(on,val,data,ph){const k=on+'-'+Object.values(data||{}).join('-');return `<textarea data-on="${on}" data-k="${k}"${attrs(data)} placeholder="${esc(ph||'')}">${esc(val??'')}</textarea>`}
function bSel(on,options,cur,data,o={}){const k=on+'-'+Object.values(data||{}).join('-');return `<select data-on="${on}" data-k="${k}"${attrs(data)} style="${o.w?`width:${o.w}px`:''}">${options.map(([v,l])=>`<option value="${esc(v)}"${String(v)===String(cur)?' selected':''}>${esc(l)}</option>`).join('')}</select>`}
const pairs=a=>a.map(v=>[v,v]);
function exOptions(cur){
  const parts={}; for(const [id,e] of Object.entries(S.exercises)) (parts[e.part||'기타']=parts[e.part||'기타']||[]).push([id,e.name]);
  return Object.entries(parts).map(([p,list])=>`<optgroup label="${esc(p)}">${list.map(([id,n])=>`<option value="${id}"${id===cur?' selected':''}>${esc(n)}</option>`).join('')}</optgroup>`).join('');
}
/* 위: 뒤로, 제목. 아래: 다음 화면으로 가는 큰 버튼 하나(오른쪽). 처음 화면 둘(오늘, 회원)에만 아래 탭 */
function topBar(title,sub,right,o={}){
  return `<div class="top">${o.noBack?'':btn('‹ 뒤로','back',null,'ghost')}<div class="grow"><h1>${title}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="row" style="flex-wrap:nowrap">${right||''}</div></div>`;
}
function actBar(left,right){return `<div class="actbar">${left||''}<span class="sp"></span>${right||''}</div>`}
function tabBar(cur){return `<div class="tabbar">${[['today','오늘'],['members','회원']].map(([v,l])=>`<button class="${cur===v?'on':''}" data-act="tab" data-v="${v}">${l}</button>`).join('')}</div>`}
const EXAMPLE=t=>`<span class="ex-ex">${t||'예시'}</span>`;
function lab(arr,v){const f=arr.find(a=>a[0]===v);return f?f[1]:'—'}
const curBlock=m=>m.blocks[m.blocks.length-1];
const openCautions=m=>m.cautions.filter(c=>c.status==='open');
const checks=m=>m.notes.filter(n=>n.kind==='check'&&!n.done&&!n.due); // due가 있는 것은 그 수업의 '오늘 메모'
const statusLabel={planned:'예정',in_progress:'진행 중',completed:'끝남',plan_only:'했는지 모르는 칸',cancelled:'취소',no_show:'안 옴'};
function exHistory(m,exId,beforeDate,n){
  const out=[]; for(const s of prevDone(m,beforeDate)){const x=s.exercises.find(e=>e.exId===exId&&e.status==='done'&&hasAct(e)); if(x) out.push({s,x}); if(out.length>=n) break}
  return out;
}
function blockText(b){if(!b)return '아직 안 정함';return `${b.dir}${b.focus?' · '+esc(b.focus):''}${b.start?' · '+md(b.start)+'부터':''}`}
function condLine(c){if(!c)return '';return COND_ITEMS.map(([k,l])=>`${l} ${lab(k==='pain'?PAIN3:COND3,c[k])}`).join(' · ')}
function basisTag(s,x){
  if(!x.basis) return '';
  const t=x.edited?'고침':x.basis.tag; const cls={'목표':'t-목표','규칙':'t-규칙','무게 찾기':'t-무게','고침':'t-고침'}[t]||'';
  return `<button class="tag ${cls}" style="border:0;cursor:pointer" data-act="basis" data-sid="${s.id}" data-uid="${x.uid}" title="근거 보기">${t}${x.basis.date&&!x.edited?' '+md(x.basis.date):''} !</button>`;
}
const fwr=(w,r,exId)=>`${w!=null?fw(w,exId):'—'} × ${r??'—'}`;
function setNo(x,i){const st=x.sets[i];if(st.kind==='warmup')return '워밍업';let n=0;for(let j=0;j<=i;j++)if(x.sets[j].kind!=='warmup')n++;return String(n)}
const lastSession=m=>completed(m.id).slice(-1)[0];
const isEdit=(x,i)=>UI.edit&&UI.edit.uid===x.uid&&+UI.edit.i===i;

/* 세트 고치는 칸: 세트를 눌렀을 때만 열린다 */
function editorHTML(s,x,i){
  const st=x.sets[i]; const live=isLive(s); const e=EX(x.exId); const d={sid:s.id,uid:x.uid,i};
  const w=live?(st.aw??st.pw):st.pw, r=live?(st.ar??st.pr):st.pr;
  const range=live&&!st.done&&st.pr!=null&&!isNum(st.pr);
  const field=(f,val,unit,label)=>`<div class="row" style="gap:4px;flex-wrap:nowrap"><span class="small muted" style="width:32px">${label}</span>${btn('−','estep',{...d,f,dir:-1},'step')}<input class="val num" inputmode="decimal" data-on="ev" data-k="ev-${x.uid}-${i}-${f}"${attrs({...d,f})} value="${esc(val??'')}" placeholder="${f==='w'?'무게':'횟수'}">${btn('+','estep',{...d,f,dir:1},'step')}<span class="tiny muted">${unit}</span></div>`;
  const later=x.sets.some((t,j)=>j>i&&sameGroup(t,st)&&!(live&&t.done));
  return `<div class="editor"><div class="row" style="margin-bottom:8px"><b>${setNo(x,i)==='워밍업'?'워밍업 세트':setNo(x,i)+'세트'}</b>${live?`<span class="tiny muted">계획 ${esc(fwr(st.pw,st.pr,x.exId))}</span>`:''}${range?`<span class="tag warn">계획 횟수가 범위(${esc(st.pr)})라 한 횟수를 넣어요</span>`:''}<span class="sp"></span>${btn('닫기','closeEdit',null,'small')}</div>
    ${adjCls(st)?`<div class="row small" style="margin:-2px 0 8px"><button class="tag t-${st.adj.by} adjbtn" data-act="adj" data-sid="${s.id}" data-uid="${x.uid}" data-i="${i}">${ADJ_NAME[st.adj.by]} 때문에 바뀐 숫자 · 원래 ${esc(fwr(st.adj.from.w,st.adj.from.r,x.exId))} !</button><span class="tiny muted">고치면 고친 숫자가 남아요</span></div>`:''}
    <div class="row" style="gap:20px">${field('w',w,(e.unit||'')+(e.side?' 한쪽':''),'무게')}${field('r',r,S.settings.roles[x.role]?.rounds?'라운드':'회','횟수')}</div>
    <div class="row" style="margin-top:8px">${later?btn('아래 세트에도','below',d,'small'):''}${btn('세트 종류: '+KINDS[st.kind],'modal',{type:'kind',...d},'small')}${live?btn(st.pain?'통증 있음 ✓':'이 세트에서 통증','pain',d,'small'+(st.pain?' danger':'')):''}<span class="sp"></span>${btn('이 세트 빼기','delSet',d,'small danger')}</div></div>`;
}

/* ---------- 오늘 (첫 화면) ---------- */
const V={};
function sessionRow(s,o={}){
  const m=M(s.memberId); const l=prevDone(m,s.date)[0]; const cn=openCautions(m).length, ck=checks(m).length;
  const st=s.status==='in_progress'?'<span class="tag good">진행 중</span>':s.status==='completed'?'<span class="tag">끝남</span>':s.status!=='planned'?`<span class="tag">${statusLabel[s.status]}</span>`:'';
  return `<div class="li click srow" data-act="openSession" data-sid="${s.id}">
    <div class="num" style="width:${o.date?110:70}px">${o.date?`<b>${mdw(s.date)}</b><div class="tiny muted">${esc(s.time||'시간 미정')}</div>`:(s.time?`<b>${esc(s.time)}</b>`:'<span class="faint">시간 미정</span>')}</div>
    <div style="flex:1;min-width:0"><div style="font-size:17px"><b>${esc(m.code)}</b> · ${esc(splitName(s))}</div>
      <div class="small muted">${s.goal?'오늘 목표: '+esc(s.goal):'목표 없음'} · ${l?`마지막 수업 <b>${daysBetween(l.date,s.date)}일 전</b> (${md(l.date)} ${esc(splitName(l))})`:'첫 수업'}</div>
      ${todayMemos(m,s).map(n=>`<div class="small" style="color:var(--accent)">오늘 메모: ${esc(n.text)}</div>`).join('')}</div>
    ${cn?`<span class="tag warn">주의 ${cn}</span>`:''}${ck?`<span class="tag">확인 ${ck}</span>`:''}${st}
    ${s.status==='planned'?`<button class="btn ghost more" data-act="modal" data-type="sessMenu" data-sid="${s.id}" aria-label="수업 메뉴">…</button>`:'<span style="width:44px"></span>'}</div>`;
}
V.today=()=>{
  const d=todayIso(); const dt=pd(d);
  const list=S.sessions.filter(s=>s.date===d&&s.status!=='plan_only').sort(byDate);
  const up=S.sessions.filter(s=>s.date>d&&s.status==='planned').sort(byDate).slice(0,5);
  const nav=`<span class="tiny muted">시연용 날짜</span>${btn('‹','shiftDay',{dir:-1},'small')}${btn('›','shiftDay',{dir:1},'small')}`;
  return topBar(`${dt.getMonth()+1}월 ${dt.getDate()}일 (${DOW[dt.getDay()]})`,`오늘 수업 ${list.length}`,nav,{noBack:true})+
   `<div class="scroll" data-sk="main"><div class="card"><div class="list">${list.map(s=>sessionRow(s)).join('')||'<div class="empty">오늘 잡힌 수업이 없어요.</div>'}</div></div>
    ${up.length?`<div class="small muted" style="margin:16px 4px 6px;font-weight:600">다가오는 수업</div><div class="card"><div class="list">${up.map(s=>sessionRow(s,{date:1})).join('')}</div></div>`:''}
    <div class="tiny faint" style="margin:12px 4px">시간은 예시예요. 다른 회원의 예시 기록은 시연 날짜와 맞지 않을 수 있어요.</div></div>`+tabBar('today');
};

/* ---------- 회원 목록 ---------- */
V.members=()=>{
  const rows=S.members.map(m=>{const u=upcoming(m.id);const l=lastSession(m);return `<div class="li click" data-act="go" data-to="member" data-mid="${m.id}">
      <div style="flex:1;min-width:0"><b>${esc(m.code)}</b> <span class="muted small">${m.goals[0]?esc(m.goals[0].text):''}</span>
      <div class="tiny muted">다음 PT ${u?mdw(u.date)+' '+esc(splitName(u)):'없음'} · 지난 수업 ${l?md(l.date)+' '+esc(splitName(l)):'없음'} · 기록 ${completed(m.id).length}회</div></div>${openCautions(m).length?`<span class="tag warn">주의 ${openCautions(m).length}</span>`:''}<span class="faint">›</span></div>`}).join('');
  return topBar('회원',`${S.members.length}명 · 가상 회원 예시 기록으로 채운 프로토타입`,btn('기록 찾기','go',{to:'search'})+btn('설정','go',{to:'settings'})+btn('+ 회원','newMember'),{noBack:true})+
   `<div class="scroll" data-sk="main"><div class="card"><div class="list">${rows}</div></div>
    <div class="card" style="margin-top:12px"><h2>이 프로토타입</h2>
      <ul class="small" style="margin:0 0 8px;padding-left:18px">
        <li>회원과 기록은 모두 지어낸 예시예요. 실제 사람 기록이 아니에요.</li>
        <li>역할, 여유 횟수, 쉬는 시간, 기구 눈금은 ${EXAMPLE('예시')}나 논문 기준 임시값(D59)이에요.</li>
        <li>입력한 것은 이 브라우저에만 저장돼요.</li></ul>
      ${UI.confirmReset?`<div class="row"><span class="small">입력한 것을 모두 지우고 처음 상태로 되돌릴까요?</span>${btn('되돌리기','reset',null,'danger')}${btn('아니요','confirmReset',{v:0})}</div>`:btn('처음 상태로 되돌리기','confirmReset',{v:1},'small')}</div></div>`+tabBar('members');
};

/* ---------- 회원 한눈에 ---------- */
function cautionCard(m,n){
  const rows=openCautions(m).map(c=>`<div class="li"><span class="tag warn">${esc(c.part)}</span><div style="flex:1">${esc(c.text)}<div class="tiny muted">${c.since?md(c.since)+'부터':''}</div></div>${btn('닫기','closeCaution',{mid:m.id,id:c.id},'small ghost')}</div>`).join('')||'<div class="empty">열린 주의사항이 없어요.</div>';
  return `<div class="card"><h2>${n?`<span class="n">${n}</span>`:''}주의사항</h2><div class="list">${rows}</div>
    <div class="row" style="margin-top:6px;flex-wrap:nowrap">${dSel('cPart-'+m.id,pairs(['어깨','무릎','허리','목','손목','발목','고관절','기타']),'어깨',{w:90})}${dIn('cText-'+m.id,'짧게 (예: 오른쪽 무릎 굽힐 때 불편)',{grow:1})}${btn('넣기','addCaution',{mid:m.id},'small')}</div></div>`;
}
function checkCard(m,n){
  const rows=checks(m).map(c=>`<div class="li"><input type="checkbox" data-act="noteDone" data-mid="${m.id}" data-id="${c.id}" aria-label="확인함"><div style="flex:1">${esc(c.text)}<div class="tiny muted">${c.created?md(c.created)+'에 남김':''}</div></div></div>`).join('')||'<div class="empty">없어요.</div>';
  return `<div class="card"><h2>${n?`<span class="n">${n}</span>`:''}다음에 확인할 것</h2><div class="list">${rows}</div>
    <div class="row" style="margin-top:6px;flex-wrap:nowrap">${dIn('nCheck-'+m.id,'예: 핵스쿼트 무릎 각도 다시 보기',{grow:1})}${btn('넣기','addNote',{mid:m.id,kind:'check'},'small')}</div></div>`;
}
function notesCard(m,kinds,title,ro){
  const list=m.notes.filter(n=>kinds.includes(n.kind));
  const rows=list.map(n=>`<div class="li"><span class="tag">${NOTE_KINDS[n.kind]}</span><div style="flex:1" class="small">${esc(n.text)}</div>${ro?'':btn('지우기','delNote',{mid:m.id,id:n.id},'small ghost')}</div>`).join('')||'<div class="empty">없어요.</div>';
  return `<div class="card"><h2>${title}</h2><div class="list">${rows}</div>${ro?'':`<div class="row" style="margin-top:6px;flex-wrap:nowrap">${dSel('nKind-'+m.id,kinds.map(k=>[k,NOTE_KINDS[k]]),kinds[0],{w:110})}${dIn('nText-'+m.id,'메모',{grow:1})}${btn('넣기','addNote',{mid:m.id},'small')}</div>`}</div>`;
}
function goalCard(m){
  const g=m.goals.filter(g=>!g.end); const b=curBlock(m);
  return `<div class="card"><h2>목표와 훈련 방향</h2>
    ${g.map(x=>`<div class="small">· ${esc(x.text)} <span class="tiny muted">${x.start?md(x.start)+'부터':''}</span></div>`).join('')||'<div class="empty">목표가 없어요. 회원 정보에서 넣어요.</div>'}
    <hr class="sep"><div class="row"><span>훈련 방향: <b>${blockText(b)}</b></span><span class="sp"></span>${btn('바꾸기','modal',{type:'block',mid:m.id},'small')}</div>
    ${m.blocks.length>1?`<div class="tiny muted">지난 방향: ${m.blocks.slice(0,-1).reverse().map(blockText).join(' / ')}</div>`:''}</div>`;
}
V.member=r=>{
  const m=M(r.mid); const u=upcoming(m.id); const done=completed(m.id); const recent=done.slice(-3).reverse();
  let next;
  if(u){
    const ip=u.status==='in_progress';
    next=`<div class="row"><div style="flex:1"><div style="font-size:20px;font-weight:600">${mdw(u.date)} ${esc(u.time||'')}</div><div class="muted">${esc(splitName(u))}${u.goal?' · 오늘 목표: '+esc(u.goal):''}</div></div>${ip?'<span class="tag good">진행 중</span>':''}
      ${ip?btn('이어서 하기','openSession',{sid:u.id},'primary'):btn('수업 준비','openSession',{sid:u.id},'primary')+`<button class="btn ghost more" data-act="modal" data-type="sessMenu" data-sid="${u.id}" aria-label="수업 메뉴">…</button>`}</div>`;
  } else next=`<div class="row"><span class="muted">잡힌 수업이 없어요.</span><span class="sp"></span>${btn('다음 PT 잡기','modal',{type:'schedule',mid:m.id},'primary')}</div>`;
  const rec=recent.map(s=>`<div class="li click" data-act="go" data-to="detail" data-sid="${s.id}"><div style="width:76px" class="num">${mdw(s.date)}</div><div style="flex:1;min-width:0"><b>${esc(splitName(s))}</b> <span class="tiny muted">${s.exercises.filter(x=>x.status==='done').map(x=>EX(x.exId).name).join(', ')}</span>${s.memo?`<div class="tiny muted">메모: ${esc(s.memo)}</div>`:''}</div><span class="faint">›</span></div>`).join('')||'<div class="empty">아직 수업 기록이 없어요.</div>';
  return topBar(esc(m.code),'회원 한눈에',
      btn('추이','go',{to:'trend',mid:m.id})+btn('수업 기록','go',{to:'history',mid:m.id})+btn('루틴 틀','go',{to:'templates',mid:m.id})+btn('회원 정보','go',{to:'memberEdit',mid:m.id}))+
    `<div class="scroll" data-sk="main"><div class="card" style="margin-bottom:12px"><h2>다음 PT</h2>${next}</div><div class="grid2"><div class="col">
      ${cautionCard(m)}${checkCard(m)}</div>
      <div class="col">${goalCard(m)}<div class="card"><h2>최근 수업 3회</h2><div class="list">${rec}</div>${done.length>3?btn(`수업 기록 ${done.length}회 모두 보기`,'go',{to:'history',mid:m.id},'ghost small'):''}</div>
      ${notesCard(m,['general','lifestyle','diet','self_train','personality'],'메모')}</div></div></div>`;
};

/* ---------- 회원 정보 ---------- */
V.memberEdit=r=>{
  const m=M(r.mid); const mv=m.move||{};
  const goals=m.goals.map(g=>`<div class="li"><div style="flex:1">${esc(g.text)} <span class="tiny muted">${g.start?md(g.start)+'부터':''}${g.end?' · '+md(g.end)+' 끝냄':''}</span></div>${g.end?'':btn('끝냄','endGoal',{mid:m.id,id:g.id},'small ghost')}</div>`).join('')||'<div class="empty">목표가 없어요.</div>';
  const body=m.body.slice().reverse().map(b=>`<tr><td class="num">${md(b.date)}</td><td class="num">${b.height??''}</td><td class="num">${b.weight??''}</td><td class="num">${b.muscle??''}</td></tr>`).join('');
  return topBar(esc(m.code)+' 회원 정보','비운 칸은 아직 모름으로 둬요')+
   `<div class="scroll" data-sk="main"><div class="grid2"><div class="col">
     <div class="card"><h2>이름</h2><div class="row">${bIn('mCode',m.code,{mid:m.id},{w:200})}</div></div>
     <div class="card"><h2>목표</h2><div class="list">${goals}</div><div class="row" style="margin-top:6px;flex-wrap:nowrap">${dIn('gText-'+m.id,'예: 3~4개월 안으로 10kg 감량',{grow:1})}${dIn('gStart-'+m.id,'',{type:'date',w:150})}${btn('+ 목표','addGoal',{mid:m.id},'small')}</div><div class="tiny muted" style="margin-top:4px">목표는 덮어쓰지 않고 날짜와 함께 쌓여요(D24).</div></div>
     ${cautionCard(m)}
     ${goalCard(m)}</div>
    <div class="col">
     <div class="card"><h2>몸 기록</h2><table><tr><th>날짜</th><th>키</th><th>체중</th><th>골격근량</th></tr>${body||'<tr><td colspan="4" class="empty">아직 없어요.</td></tr>'}</table>
       <div class="row" style="margin-top:6px;flex-wrap:nowrap">${dIn('bDate-'+m.id,'',{type:'date',w:140})}${dIn('bH-'+m.id,'키',{w:60,im:'decimal'})}${dIn('bW-'+m.id,'체중',{w:60,im:'decimal'})}${dIn('bM-'+m.id,'골격근',{w:66,im:'decimal'})}${btn('넣기','addBody',{mid:m.id},'small')}</div></div>
     <div class="card"><h2>몸 쓰는 감각 5항목</h2><div class="tiny muted" style="margin-bottom:6px">1 낮음 ~ 5 높음.</div>
       ${MOVE_ITEMS.map(([k,l])=>`<div class="row" style="margin-bottom:6px"><span style="width:120px">${l}</span>${chips([[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5']],mv[k],'move',{mid:m.id,item:k})}</div>`).join('')}
       <div class="row"><span style="width:120px">힘 쓰는 부위</span>${bIn('mForce',mv.force,{mid:m.id},{grow:1,ph:'예: 하체는 앞쪽 허벅지로 먼저 씀'})}</div></div>
     ${notesCard(m,['lifestyle','diet','self_train','personality','general'],'생활·식단·개인 운동 메모')}</div></div></div>`+
   actBar('',btn('루틴 틀 ›','go',{to:'templates',mid:m.id},'primary'));
};

/* ---------- 루틴 틀 ---------- */
V.templates=r=>{
  const m=M(r.mid); let tid=UI.cur['tpl-'+m.id]; if(!tplOf(m,tid)) tid=m.templates[0]?.id; const t=tplOf(m,tid);
  const tabs=m.templates.map(x=>`<button class="chip${x.id===tid?' on':''}" data-act="pickTpl" data-mid="${m.id}" data-tid="${x.id}">${esc(x.name)}</button>`).join(' ');
  let body='<div class="empty">분할이 없어요. 오른쪽 위 \'+ 분할\'로 만들어요.</div>';
  if(t){
    const rows=t.items.map((it,i)=>`<tr><td class="num">${i+1}</td><td><select data-on="tplEx" data-k="te-${t.id}-${i}" data-mid="${m.id}" data-tid="${t.id}" data-i="${i}">${exOptions(it.exId)}</select></td>
      <td>${bSel('tplRole',pairs(ROLES),it.role,{mid:m.id,tid:t.id,i})}</td><td>${bSel('tplStruct',pairs(STRUCTS),it.structure,{mid:m.id,tid:t.id,i})}</td>
      <td style="white-space:nowrap">${btn('↑','tplMove',{mid:m.id,tid:t.id,i,dir:-1},'small',i===0)}${btn('↓','tplMove',{mid:m.id,tid:t.id,i,dir:1},'small',i===t.items.length-1)}${btn('✕','tplDel',{mid:m.id,tid:t.id,i},'small ghost')}</td></tr>`).join('');
    body=`<div class="row" style="margin-bottom:8px"><span>분할 이름</span>${bIn('tplName',t.name,{mid:m.id,tid:t.id},{w:180})}</div>
      <table><tr><th>#</th><th>종목</th><th>역할</th><th>세트 구성</th><th></th></tr>${rows}</table>
      <div class="row" style="margin-top:8px"><select data-d="tplAdd-${t.id}" data-k="tplAdd-${t.id}">${exOptions(dv('tplAdd-'+t.id,'hacksq'))}</select>${dSel('tplAddRole-'+t.id,pairs(ROLES),'보조',{w:120})}${btn('+ 종목','tplAdd',{mid:m.id,tid:t.id},'small')}
      <span class="tiny muted">기구가 사전에 없으면 설정 › 종목 사전에서 만들어요.</span></div>
      <hr class="sep"><div class="small"><b>바뀐 날</b> <span class="tiny muted">틀을 고치면 그날부터 새 판으로 쓰고, 지난 수업은 그때 판을 가리켜요.</span></div>
      ${t.versions.slice().reverse().map(v=>`<div class="tiny muted">· ${v.date?md(v.date):'처음'} ${esc(v.note)}</div>`).join('')}`;
  }
  return topBar(esc(m.code)+' 루틴 틀','줄마다 종목, 역할, 세트 구성만 정해요. 숫자는 수업 준비에서 채워요.',btn('+ 분할','tplNew',{mid:m.id}))+
    `<div class="scroll" data-sk="main"><div class="row" style="margin-bottom:10px">${tabs}</div><div class="card">${body}</div>
     <div class="tiny muted" style="margin-top:8px">역할 6종의 횟수·여유 횟수·쉬는 시간 기준은 설정에서 고칠 수 있어요(논문 기준 임시값, D59).</div></div>`;
};

/* ---------- 수업 준비 (v3: 브리핑 + 예정 루틴 한 장) ---------- */
const adjCls=st=>st&&st.adj&&(st.adj.by==='cond'||st.adj.by==='live')?'a-'+st.adj.by:'';
const ADJ_NAME={cond:'컨디션',live:'수업 중'};
function legendHTML(){return `<div class="legend"><span><i style="background:var(--cond)"></i>컨디션 때문에 바뀐 숫자</span><span><i style="background:var(--live)"></i>앞 세트 결과로 바뀐 숫자</span><span>숫자를 누르면 까닭이 보여요</span></div>`}
function setChip(s,x,i){
  const st=x.sets[i]; const k=st.kind==='working'?'':`<span class="k">${KINDS[st.kind]}</span>`; const a=adjCls(st);
  return `<button class="setchip${isEdit(x,i)?' sel':''}${a?' '+a:''}" data-act="${a&&s.status!=='planned'?'adj':'edit'}" data-sid="${s.id}" data-uid="${x.uid}" data-i="${i}">${k}${esc(fwr(st.pw,st.pr,x.exId))}</button>`;
}
function roChip(s,x,i){const st=x.sets[i];const a=adjCls(st);return `<button class="setchip ro${a?' '+a:''}"${a?` data-act="adj" data-sid="${s.id}" data-uid="${x.uid}" data-i="${i}" style="cursor:pointer"`:''}>${st.kind==='working'?'':`<span class="k">${KINDS[st.kind]}</span>`}${esc(fwr(st.pw,st.pr,x.exId))}</button>`}
function prepStrip(s,m){
  const prev=prevDone(m,s.date); const last=prev[0]; const lastCond=prev.find(p=>p.cond); const lastSameS=prev.find(p=>p.templateId===s.templateId);
  const gap=last?daysBetween(last.date,s.date):null; const gapSame=lastSameS?daysBetween(lastSameS.date,s.date):null;
  const skipped=msessions(m.id).filter(p=>p.status==='plan_only'&&p.templateId===s.templateId&&p.date<s.date&&(!lastSameS||p.date>lastSameS.date));
  const lastChecks=last?last.cautionChecks||{}:{};
  const none='<div class="small faint">남긴 것 없음</div>';
  const memo=todayMemos(m,s), ck=checks(m).filter(n=>n.due!==s.id);
  const a=`<div class="card"><h2>통증·주의사항 · 물어볼 것</h2>${openCautions(m).map(c=>`<div class="small"><span class="tag warn">${esc(c.part)}</span> ${esc(c.text)}${lastChecks[c.id]?` <span class="tiny muted">지난번 ${lab(CHECK4,lastChecks[c.id])}</span>`:''}</div>`).join('')}
    ${ck.map(c=>`<div class="small">· ${esc(c.text)} <span class="tiny muted">${c.created?md(c.created):''}</span></div>`).join('')}${!openCautions(m).length&&!ck.length?none:''}
    ${memo.length?`<div class="note-box" style="margin-top:4px"><b class="tiny">오늘 메모</b> ${memo.map(n=>esc(n.text)).join(' / ')}</div>`:''}</div>`;
  const b=`<div class="card"><h2>목표 · 훈련 방향</h2>${s.goal?`<div class="small">오늘 목표 <b>${esc(s.goal)}</b></div>`:''}${m.goals.filter(g=>!g.end).map(g=>`<div class="small">· ${esc(g.text)}</div>`).join('')||(s.goal?'':none)}<div class="tiny muted">방향: ${blockText(curBlock(m))}</div></div>`;
  const c=`<div class="card"><h2>지난 수업</h2>${last?`<div class="small"><b>${gap}일 전</b> ${mdw(last.date)} ${esc(splitName(last))}${lastSameS&&lastSameS.id!==last.id?` · 지난 ${esc(splitName(s))} <b>${gapSame}일 전</b>`:''}</div>
    ${skipped.map(p=>`<div class="tiny muted">${md(p.date)} ${esc(splitName(p))} 칸은 계획만 있어 건너뜀</div>`).join('')}
    <div class="tiny muted">${lastCond?`${md(lastCond.date)} 컨디션: ${condLine(lastCond.cond)}`:'지난 컨디션 남긴 것 없음'}</div>
    ${[...new Set([...prev.slice(0,2),lastSameS].filter(Boolean))].filter(p=>p.memo).map(p=>`<div class="tiny">${md(p.date)} ${esc(splitName(p))} 메모: ${esc(p.memo)}</div>`).join('')}
    ${m.notes.filter(n=>['self_train','diet','lifestyle'].includes(n.kind)).map(n=>`<div class="tiny"><span class="tag">${NOTE_KINDS[n.kind]}</span> ${esc(n.text)}</div>`).join('')}`:'<div class="small">첫 수업이에요.</div>'}</div>`;
  return `${gap!=null&&gap>=14?`<div class="banner" style="margin-bottom:8px">${gap}일 만이에요. 무게를 낮출지는 트레이너가 정해요.</div>`:''}<div class="strip">${a}${b}${c}</div>`;
}
V.prep=r=>{
  const s=SES(r.sid), m=M(s.memberId); const ro=s.status!=='planned'; let n=0;
  const rows=s.exercises.map(x=>{
    if(x.status==='removed') return `<div class="plan-ex off"><span class="pe-n"></span><div><span class="st-removed">${esc(EX(x.exId).name)}</span> <span class="tiny muted">뺌 (${esc(x.reason||'이유 없음')})</span></div><span class="sp"></span>${ro?'':btn('되살리기','restoreEx',{sid:s.id,uid:x.uid},'small')}</div>`;
    if(x.status==='swapped'){const to=s.exercises.find(e=>e.uid===x.replacedBy);return `<div class="plan-ex off"><span class="pe-n"></span><div><span class="st-swapped">${esc(EX(x.exId).name)}</span> <span class="tiny muted">→ ${to?esc(EX(to.exId).name):''} (${x.scope==='template'?'루틴 틀에도':'오늘만'}${x.reason?', '+esc(x.reason):''})</span></div></div>`;}
    n++; const ed=UI.edit&&UI.edit.uid===x.uid&&x.sets[+UI.edit.i];
    const h=exHistory(m,x.exId,s.date,4); const sm=h.find(o=>o.s.templateId===s.templateId)||h[0]; const memo=m.exMemos[x.exId];
    const key='br-'+x.uid; const open=UI.open[key];
    const lastTxt=sm?`<span class="tiny muted">${md(sm.s.date)}${sm.s.templateId!==s.templateId?' '+esc(splitName(sm.s)):''}</span> ${esc(fsets(sm.x.sets,x.exId,'a'))}`:'<span class="faint">기록 없음</span>';
    return `<div class="plan-ex"><div class="prep-row"><span class="pe-n">${n}</span><div><b>${esc(EX(x.exId).name)}</b><div class="tiny muted">${x.role}${x.structure!=='스트레이트'?' · '+x.structure:''}${(x.setting||memo?.setting)?' · '+esc(x.setting||memo.setting):''}</div></div>
      <button class="btn ghost small" style="text-align:left;white-space:normal;color:var(--ink)" data-act="toggle" data-t="${key}" title="지난 기록 펼치기"><span class="small">${lastTxt}</span> <span class="faint">${open?'▴':'▾'}</span></button>
      <div>${basisTag(s,x)}</div><div class="pe-sets">${x.sets.map((st,i)=>ro?roChip(s,x,i):setChip(s,x,i)).join('')||'<span class="faint small">세트 없음</span>'}${ro?'':btn('+','addSet',{sid:s.id,uid:x.uid},'small ghost')}</div>
      ${ro?'':`<button class="btn ghost more" data-act="modal" data-type="exMenu" data-sid="${s.id}" data-uid="${x.uid}" aria-label="종목 메뉴">…</button>`}</div>
      ${open?`<div class="prep-hist">${h.slice().reverse().map(o=>`<div>${mdw(o.s.date)} ${esc(splitName(o.s))} · <b>${esc(fsets(o.x.sets,x.exId,'a'))}</b>${o.x.setting?` <span class="tiny muted">세팅 ${esc(o.x.setting)}</span>`:''}${o.x.raw?`<div class="dimline">수첩: ${esc(o.x.raw)}</div>`:''}</div>`).join('')||'기록 없음'}${memo&&memo.memo?`<div class="tiny muted">종목 메모 ${memo.date?md(memo.date):''}: ${esc(memo.memo)}</div>`:''}</div>`:''}
      ${ed&&!ro?editorHTML(s,x,+UI.edit.i):''}</div>`}).join('');
  const pm=planMinutes(s);
  return topBar(esc(m.code)+' 수업 준비',`${mdw(s.date)} ${esc(s.time||'')} · ${esc(splitName(s))}${ro?' · 수업이 시작돼 고칠 수 없어요':''}`,ro?'':btn('+ 종목','modal',{type:'addEx',sid:s.id},'small'))+
   `<div class="scroll" data-sk="main">${prepStrip(s,m)}
    <div class="small muted" style="margin:0 2px 8px">오늘 계획은 <b>다음 목표 → 지난 같은 분할 실제값 → 규칙</b> 순서로 미리 채웠어요. 기본 숫자는 컨디션이 모두 <b>'보통'</b>일 때 기준이에요. 가운데 지난 기록을 누르면 최근 4회가 펼쳐지고, 세트를 누르면 고쳐요. 꼬리표를 누르면 숫자 근거가 보여요.</div>
    <div class="card" style="padding:4px 12px">${rows}</div>${ro?`<div style="margin-top:8px">${legendHTML()}</div>`:''}</div>`+
   actBar(`<span class="small">계획 약 <b class="${pm>CLASS_MIN-SPARE_MIN?'a-cond':''}">${pm}분</b> / 수업 ${CLASS_MIN}분 <span class="tiny muted">(세트 ${SET_MIN}분 + 계획 쉬는 시간, 종목 옮기기 ${SWITCH_MIN}분, 시작 ${START_MIN}분·마무리 ${WRAP_MIN}분, 예시)</span></span>`,ro?btn('수업 화면으로','openSession',{sid:s.id},'primary'):btn('수업 시작 ›','go',{to:'live',sid:s.id},'primary'));
};
V.briefing=V.prep; V.plan=V.prep;
