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
const NAV_IC={today:`<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>`,
 members:`<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.2 4.3 1.9 5 5.4"/></svg>`,
 search:`<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>`,
 settings:`<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/></svg>`};
function tabBar(cur){return `<nav class="tabbar sidenav" aria-label="메뉴"><div class="logo">P</div>${[['today','오늘','tab'],['members','회원','tab']].map(([v,l,a])=>`<button class="${cur===v?'on':''}" data-act="${a}" data-v="${v}">${NAV_IC[v]}${l}</button>`).join('')}
  <button data-act="go" data-to="search">${NAV_IC.search}기록 찾기</button><span class="sp"></span><button data-act="go" data-to="settings">${NAV_IC.settings}설정</button></nav>`}
/* 파스텔 꼬리표: 같은 글자는 늘 같은 색 */
function hueOf(t){let h=0;for(const c of String(t||''))h=(h*31+c.charCodeAt(0))>>>0;return 'c'+(h%6+1)}
const pill=(t,cls)=>`<span class="pill ${cls||hueOf(t)}">${esc(t)}</span>`;
const memberHue=m=>'c'+(S.members.indexOf(m)%6+1);
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
function miniCal(d){
  const x=pd(d); const y=x.getFullYear(), mo=x.getMonth(); const first=new Date(y,mo,1); const start=new Date(y,mo,1-first.getDay());
  const has=new Set(S.sessions.filter(s=>s.status!=='plan_only').map(s=>s.date));
  let rows='';for(let w=0;w<6;w++){rows+='<tr>';for(let k=0;k<7;k++){const c=new Date(start);c.setDate(start.getDate()+w*7+k);const ci=iso(c);
    rows+=`<td><button class="${c.getMonth()!==mo?'other ':''}${k===0?'sun ':''}${has.has(ci)?'has ':''}${ci===d?'today':''}" data-act="setDay" data-v="${ci}" aria-label="${md(ci)}">${c.getDate()}</button></td>`}rows+='</tr>'}
  return `<div class="mcal"><div class="hd">${y}. ${mo+1}</div><table><tr>${DOW.map(w=>`<th>${w}</th>`).join('')}</tr>${rows}</table></div>`;
}
function tlBlock(s,top,h){
  const m=M(s.memberId); const l=prevDone(m,s.date)[0]; const cn=openCautions(m).length;
  const st=s.status==='in_progress'?pill('진행 중','green'):s.status==='completed'?pill('끝남','gray'):s.status!=='planned'?pill(statusLabel[s.status],'gray'):'';
  const [hh,mm]=(s.time||'0:0').split(':').map(Number); const end=`${String(hh+1).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  if(s.status==='cancelled'||s.status==='no_show'){const c=changes().filter(c=>c.sid===s.id&&c.kind===s.status).slice(-1)[0];
    return `<div class="blk cx" style="top:${top}px;height:${h}px"><div style="flex:1;min-width:0"><div class="bt">${esc(s.time)}-${end} ${s.status==='cancelled'?pill('취소','red'):pill('안 옴','orange')}${s.example?' '+EXAMPLE('예시'):''}${c&&c.reason?' <span class="muted">'+esc(c.reason)+'</span>':''}</div>
      <div><span class="bn">${esc(m.code)}</span> <span class="bs">· ${esc(splitName(s))}</span></div><div class="bd">계획은 다음 같은 분할로 넘어가요</div></div>${btn('되돌리기','markSession',{sid:s.id,v:'planned'},'small')}</div>`}
  return `<div class="blk srow ${memberHue(m)}" style="top:${top}px;height:${h}px" data-act="openSession" data-sid="${s.id}">
    <div style="flex:1;min-width:0"><div class="bt">${esc(s.time)}-${end} ${EXAMPLE('예시')}</div>
      <div><span class="bn">${esc(m.code)}</span> <span class="bs">· ${esc(splitName(s))}</span> ${cn?pill('주의 '+cn,'red'):''} ${st}</div>
      <div class="bd">${s.goal?'오늘 목표: '+esc(s.goal)+' · ':''}${l?`마지막 수업 <b>${daysBetween(l.date,s.date)}일 전</b> (${md(l.date)} ${esc(splitName(l))})`:'첫 수업'}</div>
      ${todayMemos(m,s).map(n=>`<div class="bd" style="color:var(--accent)">오늘 메모: ${esc(n.text)}</div>`).join('')}</div>
    ${s.status==='planned'?`<button class="btn ghost more" data-act="modal" data-type="sessMenu" data-sid="${s.id}" aria-label="수업 메뉴">…</button>`:''}</div>`;
}
V.today=()=>{
  const d=todayIso(); const dt=pd(d);
  const list=S.sessions.filter(s=>s.date===d&&s.status!=='plan_only').sort(byDate);
  const timed=list.filter(s=>/^\d{1,2}:\d{2}$/.test(s.time||'')), untimed=list.filter(s=>!timed.includes(s));
  const hs=timed.map(s=>Number(s.time.split(':')[0])); const h0=hs.length?Math.max(6,Math.min(...hs)-1):9, h1=hs.length?Math.min(23,Math.max(...hs)+2):18;
  const HH=78; let grid='';for(let h=h0;h<=h1;h++) grid+=`<div class="hr" style="top:${(h-h0)*HH}px"><span>${String(h).padStart(2,'0')}:00</span></div>`;
  const blocks=timed.map(s=>{const [hh,mm]=s.time.split(':').map(Number);return tlBlock(s,(hh-h0+mm/60)*HH+3,HH-6)}).join('');
  const up=S.sessions.filter(s=>s.date>d&&s.status==='planned').sort(byDate).slice(0,5);
  const tab=UI.cur.recentTab||'all';
  const evDone=S.sessions.filter(s=>s.date<=d&&s.status==='completed').map(s=>({k:'done',date:s.date,s}));
  const evCx=changes().filter(c=>c.kind!=='moved'&&SES(c.sid)&&SES(c.sid).status===c.kind).map(c=>({k:c.kind,date:c.date,s:SES(c.sid),c}));
  const evMv=changes().filter(c=>c.kind==='moved'&&SES(c.sid)).map(c=>({k:'moved',date:c.at,s:SES(c.sid),c}));
  const in30=e=>daysBetween(e.date,d)>=0&&daysBetween(e.date,d)<30;
  const n30={done:evDone.filter(in30).length,cx:evCx.filter(e=>e.k==='cancelled'&&in30(e)).length,ns:evCx.filter(e=>e.k==='no_show'&&in30(e)).length};
  const rate=n30.done+n30.cx+n30.ns?Math.round((n30.cx+n30.ns)/(n30.done+n30.cx+n30.ns)*100):0;
  const pool=tab==='done'?evDone:tab==='cx'?evCx:tab==='moved'?evMv:[...evDone,...evCx,...evMv];
  const rec=pool.sort((a,b)=>a.date<b.date?1:a.date>b.date?-1:(a.k==='done')-(b.k==='done')).slice(0,30);
  const pillOf=e=>e.k==='done'?pill('완료','green'):e.k==='cancelled'?pill('취소','red'):e.k==='no_show'?pill('안 옴','orange'):pill('옮김','blue');
  const sub=e=>e.k==='moved'?`${md(e.c.from)}${e.c.fromTime?' '+esc(e.c.fromTime):''} → ${md(e.s.date)}${e.s.time?' '+esc(e.s.time):''}`:e.c&&e.c.reason?esc(e.c.reason):esc(splitName(e.s));
  let lastD='';const recHTML=rec.map(e=>{const m=M(e.s.memberId);const hd=e.date!==lastD?`<div class="dhd">${mdw(e.date)}</div>`:'';lastD=e.date;const ago=daysBetween(e.date,d);
    return hd+`<div class="ri${e.k!=='done'?' alt':''}" data-act="${e.k==='done'?'go':'go'}" data-to="${e.k==='done'?'detail':'member'}" data-sid="${e.s.id}" data-mid="${m.id}">${pillOf(e)}<b>${esc(m.code)}</b>${e.s.example?EXAMPLE('예시'):''}<span class="muted">${sub(e)}</span><span class="ago">${ago>0?ago+'일 전':ago===0?'오늘':-ago+'일 뒤'}</span></div>`}).join('')
    ||`<div class="empty">${tab==='cx'?"취소·안 옴이 아직 없어요. 수업 '…'에서 취소나 안 옴을 누르면 여기에 쌓여요. 예시는 설정에서 다시 켤 수 있어요.":tab==='moved'?"옮긴 수업이 아직 없어요. 수업 '…' → 옮기기를 하면 여기에 남아요.":'기록이 없어요.'}</div>`;
  const tabs=[['all','전체'],['done','완료'],['cx','취소·안 옴',evCx.length],['moved','옮김',evMv.length]].map(([v,l,n])=>`<button class="chip${tab===v?' on':''}" data-act="recentTab" data-v="${v}">${l}${n?` <b>${n}</b>`:''}</button>`).join('');
  const stat=`<div class="rstat"><div><span>완료</span><b>${n30.done}</b></div><div><span>취소</span><b class="r">${n30.cx}</b></div><div><span>안 옴</span><b class="o">${n30.ns}</b></div><div><span>못 한 %</span><b>${rate}%</b></div></div>`;
  const legend=S.members.map(m=>{const nc=msessions(m.id).filter(x=>x.status==='cancelled'||x.status==='no_show').length;return `<div><i class="${memberHue(m)}" style="background:currentColor"></i>${esc(m.code)}${nc?` <span class="pill red" style="margin-left:4px">못 함 ${nc}</span>`:''}</div>`}).join('');
  const nav=`<span class="tiny muted">시연용 날짜</span>${btn('‹','shiftDay',{dir:-1},'small')}${btn('›','shiftDay',{dir:1},'small')}`;
  return topBar(`플래너 <span class="muted" style="font-weight:500;font-size:14px;margin-left:6px">${dt.getFullYear()}년 ${dt.getMonth()+1}월 ${dt.getDate()}일 ${DOW[dt.getDay()]}요일</span>`,`오늘 수업 ${list.length}`,nav,{noBack:true})+
   `<div class="planner" style="flex:1;min-height:0">
     <div class="pl-left">${miniCal(d)}
       <div class="pl-sec">회원 ${S.members.length}</div><div class="legend2">${legend}</div>
       ${up.length?`<div class="pl-sec">다가오는 수업</div>${up.map(s=>`<div class="li click srow small" data-act="openSession" data-sid="${s.id}" style="padding:6px 0"><div style="flex:1"><b>${md(s.date)}</b> ${esc(M(s.memberId).code)} <span class="muted">${esc(splitName(s))}</span></div><button class="btn ghost more" data-act="modal" data-type="sessMenu" data-sid="${s.id}" aria-label="수업 메뉴">…</button></div>`).join('')}`:''}
       <div class="tiny faint" style="margin-top:12px">시간은 예시예요. 다른 회원 기록은 수첩 날짜 그대로예요.</div></div>
     <div class="pl-mid" data-sk="main"><div class="pl-colhd">PT 수업 <span class="n">${list.length}</span></div>
       ${untimed.length?`<div class="untimed">${untimed.map(s=>`<div class="li click srow" data-act="openSession" data-sid="${s.id}"><span class="pill gray">시간 미정</span><b>${esc(M(s.memberId).code)}</b> ${esc(splitName(s))}<span class="sp"></span>${s.status==='planned'?`<button class="btn ghost more" data-act="modal" data-type="sessMenu" data-sid="${s.id}" aria-label="수업 메뉴">…</button>`:''}</div>`).join('')}</div>`:''}
       <div class="tl" style="height:${(h1-h0)*HH+10}px">${grid}${blocks}</div>
       ${list.length?'':'<div class="empty" style="padding:14px">오늘 잡힌 수업이 없어요.</div>'}</div>
     <div class="pl-right"><div style="font-weight:700;font-size:13px">최근 기록 <span class="tiny muted" style="font-weight:500">최근 30일</span></div>${stat}<div class="row" style="gap:4px;margin:8px 0 2px">${tabs}</div><div class="recent">${recHTML}</div></div>
   </div>`+tabBar('today');
};

/* ---------- 회원 목록 ---------- */
V.members=()=>{
  const rows=S.members.map(m=>{const u=upcoming(m.id);const l=lastSession(m);return `<div class="li click" data-act="go" data-to="member" data-mid="${m.id}">
      <div style="flex:1;min-width:0"><b>${esc(m.code)}</b> <span class="muted small">${m.goals[0]?esc(m.goals[0].text):''}</span>
      <div class="tiny muted">다음 PT ${u?mdw(u.date)+' '+esc(splitName(u)):'없음'} · 지난 수업 ${l?md(l.date)+' '+esc(splitName(l)):'없음'} · 기록 ${completed(m.id).length}회</div></div>${openCautions(m).length?`<span class="tag warn">주의 ${openCautions(m).length}</span>`:''}<span class="faint">›</span></div>`}).join('');
  return topBar('회원',`${S.members.length}명 · 트레이너 수첩 기록으로 채운 프로토타입`,btn('기록 찾기','go',{to:'search'})+btn('설정','go',{to:'settings'})+btn('+ 회원','newMember'),{noBack:true})+
   `<div class="scroll" data-sk="main"><div class="card"><div class="list">${rows}</div></div>
    <div class="card" style="margin-top:12px"><h2>이 프로토타입</h2>
      <ul class="small" style="margin:0 0 8px;padding-left:18px">
        <li>회원 기록은 트레이너 수첩의 실제 숫자이고, 이름은 성+00 코드로 바꿨어요(D61).</li>
        <li>역할, 여유 횟수, 쉬는 시간, 기구 눈금은 수첩에 없어서 ${EXAMPLE('예시')}나 논문 기준 임시값(D59)이에요.</li>
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
/* 월별 수업 횟수 막대 (한 계열, 마지막 달만 강조, 막대마다 툴팁) */
function monthBars(m,W,H){
  const done=completed(m.id); if(!done.length) return '<div class="empty">수업 기록이 없어요.</div>';
  const by={};for(const s of done){const k=s.date.slice(0,7);by[k]=(by[k]||0)+1}
  const a=done[0].date.slice(0,7), b=done[done.length-1].date.slice(0,7); const ks=[];let [y,mo]=a.split('-').map(Number);
  while(true){const k=`${y}-${String(mo).padStart(2,'0')}`;ks.push(k);if(k===b||ks.length>24)break;mo++;if(mo>12){mo=1;y++}}
  const padL=24,padR=4,padT=16,padB=20; const max=Math.max(...ks.map(k=>by[k]||0)); const ymax=Math.max(4,Math.ceil(max/4)*4);
  const bw=(W-padL-padR)/ks.length; const Y=v=>padT+(1-v/ymax)*(H-padT-padB);
  let g='';for(let v=0;v<=ymax;v+=ymax/4) g+=`<line class="axis" x1="${padL}" x2="${W-padR}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${padL-5}" y="${Y(v)+4}" text-anchor="end">${v}</text>`;
  const bars=ks.map((k,i)=>{const v=by[k]||0;const gap=Math.max(2,bw*.2);const x=padL+i*bw+gap;const w=Math.max(4,bw-2*gap);const h=Y(0)-Y(v);
    const r=Math.min(4,w/2,h);const last=i===ks.length-1;
    const path=v?`M${x},${Y(0)} V${Y(v)+r} Q${x},${Y(v)} ${x+r},${Y(v)} H${x+w-r} Q${x+w},${Y(v)} ${x+w},${Y(v)+r} V${Y(0)} Z`:'';
    return `<g class="hov"><rect x="${padL+i*bw}" y="${padT}" width="${bw}" height="${H-padT-padB}" fill="transparent"/>${v?`<path class="bar${last?' last':''}" d="${path}"/>`:''}${(last||v===max)&&v?`<text class="lbl" x="${x+w/2}" y="${Y(v)-4}" text-anchor="middle">${v}</text>`:''}<text x="${x+w/2}" y="${H-5}" text-anchor="middle">${Number(k.slice(5))}</text><title>${k.slice(0,4)}년 ${Number(k.slice(5))}월 · 수업 ${v}회</title></g>`}).join('');
  return `<svg class="chart" width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="월별 수업 횟수">${g}${bars}</svg>`;
}
function mainTrend(m,W,H){
  const cnt={};for(const s of completed(m.id))for(const x of s.exercises)if(x.status==='done'&&x.role==='메인'&&topSet(x))cnt[x.exId]=(cnt[x.exId]||0)+1;
  const ex=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0]; if(!ex) return {ex:null,svg:'<div class="empty">메인 종목 무게 기록이 없어요.</div>'};
  const ser=trendSeries(m,ex).slice(-10); const pts=ser.map(o=>({date:o.s.date,v:o.t.w,label:`${md(o.s.date)} ${ftop(o.t,ex)}`}));
  return {ex,svg:chartSVG(pts,W,H,p=>fw(p.v,ex),null,{fewX:1}).replace(/data-act="trendPt"/g,'').replace(`<svg class="chart" width="${W}" height="${H}"`,`<svg class="chart" width="100%" viewBox="0 0 ${W} ${H}"`)};
}
function cautionSec(m){
  const rows=openCautions(m).map(c=>`<div class="li">${pill(c.part,'red')}<div style="flex:1">${esc(c.text)}<div class="tiny muted">${c.since?md(c.since)+'부터':''}</div></div>${btn('닫기','closeCaution',{mid:m.id,id:c.id},'small ghost')}</div>`).join('')||'<div class="empty">열린 주의사항이 없어요.</div>';
  return `<div><h3>주의사항</h3>${rows}<div class="row" style="margin-top:6px">${dSel('cPart-'+m.id,pairs(['어깨','무릎','허리','목','손목','발목','고관절','기타']),'어깨',{w:80})}${dIn('cText-'+m.id,'짧게 적기',{grow:1})}${btn('넣기','addCaution',{mid:m.id},'small')}</div></div>`;
}
function checkSec(m){
  const rows=checks(m).map(c=>`<div class="li"><input type="checkbox" data-act="noteDone" data-mid="${m.id}" data-id="${c.id}" aria-label="확인함"><div style="flex:1">${esc(c.text)}<div class="tiny muted">${c.created?md(c.created)+'에 남김':''}</div></div></div>`).join('')||'<div class="empty">없어요.</div>';
  return `<div><h3>다음에 확인할 것</h3>${rows}<div class="row" style="margin-top:6px">${dIn('nCheck-'+m.id,'예: 핵스쿼트 무릎 각도',{grow:1})}${btn('넣기','addNote',{mid:m.id,kind:'check'},'small')}</div></div>`;
}
function goalSec(m){
  const g=m.goals.filter(g=>!g.end); const b=curBlock(m);
  return `<div><h3>목표 · 훈련 방향</h3>${g.map(x=>`<div class="small">· ${esc(x.text)}</div>`).join('')||'<div class="empty">목표가 없어요.</div>'}
    <div class="row" style="margin-top:6px"><span class="small">방향 <b>${blockText(b)}</b></span>${btn('바꾸기','modal',{type:'block',mid:m.id},'small')}</div></div>`;
}
const IC_MEMO=`<svg viewBox="0 0 24 24" class="ic"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4v-1h6v1M8.5 10h7M8.5 14h7"/></svg>`;
const IC_PEN=`<svg viewBox="0 0 24 24" class="ic"><path d="M4 20l1-4L16 5l3 3L8 19z"/></svg>`;
const IC_EX=`<svg viewBox="0 0 24 24" class="ic"><path d="M3 10v4M6 8v8M18 8v8M21 10v4M6 12h12"/></svg>`;
/* 내원이력처럼 펼친 수업 카드: 종목을 누르면 다음 PT에 복사 */
function visitCard(m,s,u){
  const t=todayIso(); const ago=daysBetween(s.date,t); const can=u&&u.id!==s.id;
  const exs=s.exercises.map(x=>{const off=x.status==='removed'||x.status==='swapped';const which=s.status==='completed'?'a':'p';const txt=fsets(x.sets,x.exId,which);
    const inner=`${IC_EX}<span class="en">${esc(EX(x.exId).name)}</span>${x.role==='메인'?'<span class="pill blue">메인</span>':''}<span class="es num">${off?(x.status==='removed'?'뺌':'바꿈'):esc(txt||'숫자 없음')}</span>`;
    return off?`<div class="vex off" title="${esc(x.raw||'')}">${inner}</div>`:`<button class="vex" data-act="copyEx" data-sid="${s.id}" data-uid="${x.uid}" title="${esc((x.raw?'수첩: '+x.raw+'\n':'')+(can?'눌러서 '+md(u.date)+' 수업에 복사':''))}">${inner}</button>`}).join('');
  const notes=[s.memo?`<div class="vl">${IC_MEMO}<div>${esc(s.memo)}</div></div>`:'',...s.exercises.filter(x=>x.note||x.setting).slice(0,4).map(x=>`<div class="vl">${IC_PEN}<div><b>${esc(EX(x.exId).name)}</b> ${esc([x.setting,x.note].filter(Boolean).join(' · '))}</div></div>`)].join('');
  return `<div class="visit"><div class="vh"><span class="vd">${s.date} <span class="vago">(${ago>0?ago+'일 전':ago===0?'오늘':-ago+'일 뒤'})</span></span>${s.status==='completed'?'<span class="vok">✓</span>':''}<span class="sp"></span>${btn('자세히','go',{to:s.status==='planned'||s.status==='in_progress'?'prep':'detail',sid:s.id},'ghost small')}</div>
    <div class="row" style="gap:5px;margin:6px 0 8px"><span class="pill gray" style="border:1px solid var(--line);background:var(--panel)">${esc(splitName(s))}</span>${s.status==='completed'?pill(s.seeded?'수첩 기록':'앱 기록','blue'):pill(statusLabel[s.status],'gray')}</div>
    ${notes}
    <div class="vsec"><span>종목 ${s.exercises.length}</span><span class="sp"></span>${can&&s.status==='completed'?`<button class="lnk" data-act="copyAll" data-sid="${s.id}">전체 복사</button>`:''}</div>
    ${exs||'<div class="empty">종목이 없어요.</div>'}
    ${can&&s.status==='completed'?`<div class="tiny faint" style="margin-top:6px">종목을 누르면 ${md(u.date)} 수업 계획에 그 숫자 그대로 들어가요.</div>`:''}</div>`;
}
V.member=r=>{
  const m=M(r.mid); const u=upcoming(m.id); const done=completed(m.id); const t=todayIso(); const last=done[done.length-1];
  const d30=done.filter(s=>daysBetween(s.date,t)>=0&&daysBetween(s.date,t)<30).length;
  const cn=openCautions(m).length;
  const pbar=`<div class="pbar"><span class="nm">${esc(m.code)}</span>${pill('회원','blue')}${cn?pill('주의 '+cn,'red'):''}${m.goals.filter(g=>!g.end).length?pill('목표 있음','green'):''}
    <div class="vit"><span>누적 <b>${done.length}</b>회</span><span>최근 30일 <b>${d30}</b>회</span>${(()=>{const c=msessions(m.id).filter(x=>x.status==='cancelled').length,n=msessions(m.id).filter(x=>x.status==='no_show').length;return `<span>취소 <b style="color:${c?'var(--bad)':'inherit'}">${c}</b> · 안 옴 <b style="color:${n?'var(--warn)':'inherit'}">${n}</b></span>`})()}<span>첫 기록 <b>${done[0]?md(done[0].date):'—'}</b></span><span>마지막 <b>${last?md(last.date):'—'}</b>${last?` (${daysBetween(last.date,t)}일 전)`:''}</span><span>다음 PT <b>${u?mdw(u.date):'없음'}</b>${u?' '+esc(splitName(u)):''}</span></div></div>`;
  const all=msessions(m.id).filter(s=>s.status!=='plan_only'||true).slice().sort((a,b)=>byDate(b,a));
  const open=UI.cur['hx-'+m.id]===undefined?(done[done.length-1]||{}).id:UI.cur['hx-'+m.id];
  const hist=all.map(s=>{const isNext=u&&s.id===u.id;const n=s.exercises.filter(x=>x.status==='done').length;
    const st=s.status==='completed'?'':s.status==='plan_only'?pill('계획만','gray'):pill(statusLabel[s.status],s.status==='planned'||s.status==='in_progress'?'blue':s.status==='cancelled'?'red':s.status==='no_show'?'orange':'gray')+(s.example?' '+EXAMPLE('예시'):'');
    const head=`<button class="hi${isNext?' next':''}${open===s.id?' open':''}" data-act="histOpen" data-mid="${m.id}" data-sid="${s.id}" aria-expanded="${open===s.id}"><div class="row" style="gap:6px"><span class="d">${mdw(s.date)}</span>${pill(splitName(s))}${st}<span class="sp"></span><span class="chev">${open===s.id?'⌃':'⌄'}</span></div>
      ${open===s.id?'':`<div class="x">${s.exercises.filter(x=>x.status==='done'||s.status!=='completed').slice(0,4).map(x=>EX(x.exId).name).join(', ')}${n>4?' 외':''}</div>`}</button>`;
    return head+(open===s.id?visitCard(m,s,u):'')}).join('')||'<div class="empty" style="padding:12px">기록이 없어요.</div>';
  let next;
  if(u){const ip=u.status==='in_progress';
    next=`<div class="row"><div style="flex:1"><div style="font-size:16px;font-weight:700">${mdw(u.date)} ${esc(u.time||'')}</div><div class="muted small">${esc(splitName(u))}${u.goal?' · 오늘 목표: '+esc(u.goal):''}</div></div>${ip?pill('진행 중','green'):''}
      ${ip?btn('이어서 하기','openSession',{sid:u.id},'primary'):btn('수업 준비','openSession',{sid:u.id},'primary')+`<button class="btn ghost more" data-act="modal" data-type="sessMenu" data-sid="${u.id}" aria-label="수업 메뉴">…</button>`}</div>`;
  } else next=`<div class="row"><span class="muted">잡힌 수업이 없어요.</span><span class="sp"></span>${btn('다음 PT 잡기','modal',{type:'schedule',mid:m.id},'primary')}</div>`;
  const recent=done.slice(-5).reverse();
  const mainOf=s=>{const x=s.exercises.find(e=>e.status==='done'&&e.role==='메인')||s.exercises.find(e=>e.status==='done');const tt=x&&topSet(x);return x?`${esc(EX(x.exId).name)}${tt?` <b class="num">${ftop(tt,x.exId)}</b>`:''}`:'—'};
  const rec=recent.map(s=>`<tr class="click" data-act="go" data-to="detail" data-sid="${s.id}"><td class="num">${mdw(s.date)}</td><td>${pill(splitName(s))}</td><td>${mainOf(s)}</td><td class="memo" title="${esc(s.memo||'')}">${esc(s.memo||'')}</td></tr>`).join('');
  const mt=mainTrend(m,262,130);
  const notes=m.notes.filter(n=>['general','lifestyle','diet','self_train','personality'].includes(n.kind));
  return topBar(esc(m.code),'회원 한눈에',
      btn('추이','go',{to:'trend',mid:m.id})+btn('수업 기록','go',{to:'history',mid:m.id})+btn('루틴 틀','go',{to:'templates',mid:m.id})+btn('회원 정보','go',{to:'memberEdit',mid:m.id}))+pbar+
    `<div class="chartlay">
      <div class="cl-left"><div class="pl-colhd">수업 이력 <span class="n">${all.length}</span></div><div class="hist">${hist}</div></div>
      <div class="cl-mid" data-sk="main">
        <div class="box"><div class="bh">다음 PT</div><div class="bb">${next}</div></div>
        <div class="box"><div class="sec3">${cautionSec(m)}${checkSec(m)}${goalSec(m)}</div></div>
        <div class="box"><div class="bh">최근 수업 ${recent.length}회<span class="sp"></span>${done.length>5?btn(`전체 ${done.length}회`,'go',{to:'history',mid:m.id},'ghost small'):''}</div>
          ${rec?`<table class="dtable" style="table-layout:fixed"><colgroup><col style="width:84px"><col style="width:120px"><col style="width:210px"><col></colgroup><tr><th>날짜</th><th>분할</th><th>메인 종목 최고</th><th>메모</th></tr>${rec}</table>`:'<div class="empty" style="padding:10px 12px">아직 수업 기록이 없어요.</div>'}</div>
      </div>
      <div class="cl-right">
        <h3>월별 수업 횟수</h3>${monthBars(m,262,130)}
        <h3>메인 종목 최고 무게 ${mt.ex?`<span class="tiny muted" style="font-weight:500">${esc(EX(mt.ex).name)}</span>`:''}</h3>${mt.svg}
        <h3>메모</h3>${notes.map(n=>`<div class="li small" style="align-items:flex-start">${pill(NOTE_KINDS[n.kind],'gray')}<div style="flex:1">${esc(n.text)}</div>${btn('지우기','delNote',{mid:m.id,id:n.id},'small ghost')}</div>`).join('')||'<div class="empty">없어요.</div>'}
        <div class="row" style="margin-top:6px;flex-wrap:nowrap">${dSel('nKind-'+m.id,['general','lifestyle','diet','self_train','personality'].map(k=>[k,NOTE_KINDS[k]]),'general',{w:84})}${dIn('nText-'+m.id,'메모',{grow:1})}${btn('넣기','addNote',{mid:m.id},'small')}</div>
      </div></div>`;
};

/* ---------- 회원 정보 ---------- */
V.memberEdit=r=>{
  const m=M(r.mid); const mv=m.move||{};
  const goals=m.goals.map(g=>`<div class="li"><div style="flex:1">${esc(g.text)} <span class="tiny muted">${g.start?md(g.start)+'부터':''}${g.end?' · '+md(g.end)+' 끝냄':''}</span></div>${g.end?'':btn('끝냄','endGoal',{mid:m.id,id:g.id},'small ghost')}</div>`).join('')||'<div class="empty">목표가 없어요.</div>';
  const body=m.body.slice().reverse().map(b=>`<tr><td class="num">${md(b.date)}</td><td class="num">${b.height??''}</td><td class="num">${b.weight??''}</td><td class="num">${b.muscle??''}</td></tr>`).join('');
  return topBar(esc(m.code)+' 회원 정보','비운 칸은 아직 모름으로 둬요')+
   `<div class="scroll" data-sk="main"><div class="grid2"><div class="col">
     <div class="card"><h2>이름</h2><div class="row">${bIn('mCode',m.code,{mid:m.id},{w:200})}<span class="tiny muted">폴더 밖에서는 성+00 코드로 써요(D61)</span></div></div>
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
