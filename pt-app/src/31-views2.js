/* ---------- 수업: 맨 위 '시작' 한 장 (v3) ---------- */
function startSheet(s,m){
  if(!s.cond) s.cond={sleep:'normal',fatigue:'normal',soreness:'normal',pain:'none',painWhere:''};
  const last=prevDone(m,s.date).find(p=>p.cond);
  const cond=COND_ITEMS.map(([k,l])=>`<div class="row" style="margin-bottom:8px"><span style="width:64px">${l}</span>${chips(k==='pain'?PAIN3:COND3,s.cond[k],'cond',{sid:s.id,item:k})}<span class="tiny muted">${last?`지난번 ${lab(k==='pain'?PAIN3:COND3,last.cond[k])}`:'지난번 남긴 것 없음'}</span></div>`).join('');
  const pain=s.cond.pain!=='none'?`<div class="row" style="flex-wrap:nowrap">${bIn('painWhere',s.cond.painWhere,{sid:s.id},{grow:1,ph:'어디가 어떻게 (예: 왼쪽 어깨 들 때)'})}${btn('주의사항에 추가','painToCaution',{sid:s.id},'small')}</div><div class="tiny muted">통증은 숫자를 바꾸지 않아요. 트레이너가 정해요.</div>`:'';
  const cs=openCautions(m).map(c=>`<div class="row" style="margin-bottom:6px"><span style="flex:1;min-width:0"><span class="tag warn">${esc(c.part)}</span> ${esc(c.text)}</span>${chips(CHECK4,s.cautionChecks[c.id],'ccheck',{sid:s.id,id:c.id})}</div>`).join('');
  const memo=todayMemos(m,s);
  const bad=condBadNames(s.cond); let nAdj=0;
  const exRows=liveEx(s).map(x=>{nAdj+=x.sets.filter(st=>adjCls(st)).length;return `<div class="draft-row"><span style="width:150px"><b class="small">${esc(EX(x.exId).name)}</b><div class="tiny muted">${x.role}</div></span><div class="pe-sets" style="flex:1">${x.sets.map((st,i)=>roChip(s,x,i)).join('')||'<span class="faint small">세트 없음</span>'}</div></div>`}).join('');
  return topBar(esc(m.code)+' 수업 시작',`${mdw(s.date)} ${esc(s.time||'')} · ${esc(splitName(s))} · 대화가 끝난 뒤 다른 것만 눌러요`)+
   `<div class="scroll" data-sk="main"><div class="grid2"><div class="col">
     <div class="card"><h2>컨디션 <span class="tiny muted">모두 '평소'로 골라져 있어요</span></h2>${cond}${pain}
       <div class="tiny muted" style="margin-top:4px">수업 준비의 숫자는 모두 '보통'일 때 기준이에요. 수면·피로·근육통에서 '나쁨'을 누르면 메인·보조 종목 숫자를 여유 1개 더 남게 바꾸고 <b class="a-cond">주황색</b>으로 보여 줘요. 숫자를 누르면 까닭이 보여요.</div></div>
     <div class="card"><h2>주의사항 확인</h2>${cs||'<div class="empty">열린 주의사항이 없어요.</div>'}${cs?btn('모두 지난번과 같음','checkSame',{sid:s.id},'small'):''}</div>
     ${memo.length?`<div class="card"><h2>오늘 메모</h2>${memo.map(n=>`<div class="small">${esc(n.text)}</div>`).join('')}<div class="tiny muted">메모를 보고 앱이 숫자를 바꾸지는 않아요.</div></div>`:''}</div>
    <div class="col"><div class="card"><h2>오늘 목표</h2>${bIn('sGoal',s.goal,{sid:s.id},{full:1,ph:'예: 핵스쿼트 60kg 도전'})}</div>
     <div class="card"><h2>오늘 숫자 ${bad.length?`<span class="tag t-cond">${esc(bad.join('·'))} 나쁨 → ${nAdj}세트 바뀜</span>`:'<span class="tiny muted">컨디션 보통 기준 그대로</span>'}</h2>${exRows}<div style="margin-top:8px">${legendHTML()}</div></div></div></div></div>`+
   actBar(btn('‹ 숫자 정하기','go',{to:'prep',sid:s.id}),btn('시작','startSession',{sid:s.id},'primary'));
}

/* ---------- 수업 진행: 남은 시간 띠 + 지금 종목 카드 하나 + 다음 종목 한 줄 ---------- */
function rirIndex(x){if(x.role!=='메인')return -1;let k=-1;x.sets.forEach((st,i)=>{if(st.kind!=='warmup')k=i});return k}
function curEx(s){
  const lives=liveEx(s); let x=lives.find(e=>e.uid===UI.cur[s.id]);
  if(!x) x=lives.find(e=>!e.sets.length||e.sets.some(st=>!st.done))||lives[0];
  if(x) UI.cur[s.id]=x.uid; return x;
}
function numBtn(s,x,i,f,label,cls){return `<button class="numbtn ${cls||''}" data-act="edit" data-sid="${s.id}" data-uid="${x.uid}" data-i="${i}" data-f="${f}">${label}</button>`}
/* v4.2 (2026-11-05): 숫자는 세트 줄 안에서 바로 고친다. 칸을 누르면 그 자리에서 입력, 다른 곳을 누르면 저장 */
function numIn(s,x,i,f,val,unit,cls){return `<span class="numwrap"><input class="numin ${cls||''}" inputmode="${f==='w'?'decimal':'text'}" data-on="ev" data-k="ev-${x.uid}-${i}-${f}" data-sid="${s.id}" data-uid="${x.uid}" data-i="${i}" data-f="${f}" value="${esc(val??'')}" placeholder="${f==='w'?'무게':'횟수'}" aria-label="${f==='w'?'무게':'횟수'}"><span class="unit">${unit}</span></span>`}
function adjTag(s,x,i){const st=x.sets[i];if(!adjCls(st))return '';return `<button class="tag t-${st.adj.by} adjbtn" data-act="adj" data-sid="${s.id}" data-uid="${x.uid}" data-i="${i}" title="바뀐 까닭">${ADJ_NAME[st.adj.by]} · 원래 ${esc(fwr(st.adj.from.w,st.adj.from.r,x.exId))} !</button>`}
function timeBar(s){
  const T=timeState(s);
  return `<div class="timebar${T.tight?' tight':''}" role="status"><span>지금 <b>${clockText(s,T.now)}</b></span><span>끝까지 남은 <b>${Math.max(0,Math.round(T.left))}분</b></span><span>남은 종목 예상 <b>${Math.round(T.proj)}분</b> + 마무리 ${WRAP_MIN}분</span>${T.tight?'<span><b>빠듯해요</b> · 뺄 수 있는 종목에 표시가 붙어요</span>':''}<span class="sp"></span><button class="btn small" data-act="plusFive" data-sid="${s.id}" title="시연용: 쉬는 시간을 5분 더 쓴 것으로 시계를 옮겨요">시연 시계 +5분</button></div>`;
}
V.live=r=>{
  const s=SES(r.sid), m=M(s.memberId);
  if(s.status==='planned') return startSheet(s,m);
  const lives=liveEx(s); const x=curEx(s);
  let main='<div class="card"><div class="empty">종목이 없어요. 위 진행 버튼에서 종목을 넣어요.</div></div>';
  let nextLine='';
  if(x){
    const e=EX(x.exId); const h=exHistory(m,x.exId,s.date,4); const ls=h.find(o=>o.s.templateId===s.templateId)||h[0]; const memo=m.exMemos[x.exId];
    const ri=rirIndex(x);
    const rows=x.sets.map((st,i)=>{
      const w=st.done?st.aw:st.pw, rp=st.done?st.ar:st.pr; const a=st.done?'':adjCls(st);
      const aw=a&&st.adj.from.w!==st.pw?a:'', ar=a&&String(st.adj.from.r)!==String(st.pr)?a:'';
      const changed=st.done&&(st.aw!==st.pw||String(st.ar)!==String(st.pr));
      const longRest=st.restMin!=null&&st.restMin>2*((x.rest||60)/60);
      const info=st.done?[changed?`계획 ${esc(fwr(st.pw,st.pr,x.exId))}`:'계획대로',st.restMin!=null?`<span${longRest?' style="color:var(--warn);font-weight:600"':''}>쉼 ${restText(st.restMin)}</span>`:''].filter(Boolean).join(' · '):'';
      return `<div class="set-row${st.done?' done':''}${isEdit(x,i)?' sel':''}"><div class="small"><b>${setNo(x,i)}</b>${st.added?' <span class="tiny muted">추가</span>':''}</div>
        <div>${numIn(s,x,i,'w',w,(e.unit||'')+(e.side?' 한쪽':''),(st.done?'':'plan ')+aw)}</div>
        <div><span class="tiny muted">×</span> ${numIn(s,x,i,'r',rp,S.settings.roles[x.role]?.rounds?'라운드':'회',(st.done?'':'plan ')+ar)}</div>
        <div class="tiny muted">${info}${st.pain?' · <span style="color:var(--bad)">통증</span>':''} ${adjTag(s,x,i)}</div>
        <div style="text-align:right;white-space:nowrap">${st.done?btn(st.src==='confirmed'?'✓ 그대로':'✓ 고침','undoSet',{sid:s.id,uid:x.uid,i},'small'):btn('그대로','same',{sid:s.id,uid:x.uid,i},'primary',st.pw==null&&st.pr==null)}<button class="btn ghost small setmore" data-act="edit" data-sid="${s.id}" data-uid="${x.uid}" data-i="${i}" aria-label="세트 더보기" title="아래 세트에도 · 세트 종류 · 통증 · 빼기">⋯</button></div></div>
        ${isEdit(x,i)?editorHTML(s,x,i,{noFields:1}):''}
        ${i===ri?`<div class="row small" style="padding:6px 0 4px 8px"><span class="muted">여유 횟수 (선택)</span>${chips([[0,'0'],[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5+']],st.rir,'rir',{sid:s.id,uid:x.uid,i})}</div>`:''}`}).join('');
    const nxt=lives[lives.indexOf(x)+1]; const allDone=x.sets.length&&x.sets.every(st=>st.done);
    const drop=canDrop(s,x);
    main=`<div class="card excard"><div class="row"><b style="font-size:21px">${esc(e.name)}</b><span class="tag">${x.role}</span>${x.structure!=='스트레이트'?`<span class="tag">${x.structure}</span>`:''}${basisTag(s,x)}${drop?`<span class="tag bad">뺄 수 있음</span>`:''}
        <span class="sp"></span><button class="btn ghost more" data-act="modal" data-type="exMenu" data-sid="${s.id}" data-uid="${x.uid}" aria-label="종목 메뉴">…</button></div>
      <div class="row small" style="margin:6px 0 2px"><span class="muted">지난번</span><span>${ls?`${md(ls.s.date)} <b>${esc(fsets(ls.x.sets,x.exId,'a'))}</b>`:'기록 없음'}</span>${x.setting?`<span class="muted" style="margin-left:8px">세팅</span><span>${esc(x.setting)}</span>`:''}</div>
      ${memo&&memo.memo?`<div class="note-box" style="margin:4px 0">종목 메모 (${memo.date?md(memo.date):''}): ${esc(memo.memo)}</div>`:''}
      <div class="sets">${rows||'<div class="empty">세트가 없어요.</div>'}</div>
      <div class="row" style="margin-top:8px">${btn('+ 세트','addSet',{sid:s.id,uid:x.uid},'small')}<span class="sp"></span>${btn(UI.open['exx-'+x.uid]?'세팅·종목 메모 접기 ▴':'세팅·종목 메모 ▾','toggle',{t:'exx-'+x.uid},'small ghost')}</div>
      ${UI.open['exx-'+x.uid]?`<div class="row small" style="margin-top:6px"><span class="muted">세팅</span>${bIn('exSetting',x.setting,{sid:s.id,uid:x.uid},{w:190,ph:'예: 발판:1, 밴드o'})}${bIn('exNote',x.note,{sid:s.id,uid:x.uid},{grow:1,ph:'종목 메모 (다음 수업 준비에 다시 떠요)'})}</div>`:''}
      ${x.sets.some(st=>adjCls(st))?`<div style="margin-top:8px">${legendHTML()}</div>`:''}</div>`;
    nextLine=nxt?`<div class="next${allDone?' ready':''}" data-act="pickEx" data-sid="${s.id}" data-uid="${nxt.uid}"><span class="muted">다음</span> <b>${esc(EX(nxt.exId).name)}</b> <span class="small muted">${esc(fsets(nxt.sets,nxt.exId,'p'))}</span>${canDrop(s,nxt)?' <span class="tag bad">뺄 수 있음</span>':''}<span class="sp"></span>${allDone?'<span class="btn primary">다음 종목: '+esc(EX(nxt.exId).name)+' ›</span>':'<span class="faint">›</span>'}</div>`
      :`<div class="next"><span class="muted">마지막 종목이에요.</span>${allDone?' <span class="small">다 했으면 위의 \'마무리\'를 눌러요.</span>':''}</div>`;
  }
  const idx=x?lives.indexOf(x)+1:0;
  const obs=OBS.map(([k,l])=>{const o=(s.observations||[]).find(v=>v.kind===k);return `<span class="row" style="gap:4px;margin-right:10px"><span class="small">${l}</span><button class="chip${o&&o.dir==='up'?' on':''}" data-act="obs" data-sid="${s.id}" data-item="${k}" data-v="up">좋아짐</button><button class="chip${o&&o.dir==='down'?' on':''}" data-act="obs" data-sid="${s.id}" data-item="${k}" data-v="down">나빠짐</button></span>`}).join('');
  const timer=S.settings.restTimer&&UI.timer?`<div class="timer">쉬는 시간 <span id="timer-text">${timerText()}</span><span class="sp"></span>${btn('끄기','timerOff',null,'small')}</div>`:'';
  const bad=condBadNames(s.cond);
  return topBar(`${esc(m.code)} · ${esc(splitName(s))}`,(s.goal?'목표 '+esc(s.goal):'수업 중')+(bad.length?` · 컨디션 ${esc(bad.join('·'))} 나쁨`:''),btn(`${idx}/${lives.length} 종목 ▾`,'modal',{type:'exList',sid:s.id})+btn('마무리','go',{to:'summary',sid:s.id},'primary'),{noBack:true})+timeBar(s)+timer+
   `<div class="scroll" data-sk="main">${main}${nextLine}
     <div class="card" style="margin-top:12px"><h2>수업 메모 <span class="tiny muted">이 수업에만 남아요</span></h2>${bArea('sMemo',s.memo,{sid:s.id},'예: 쉬는 시간이 너무 필요하다.')}
       <div style="margin-top:6px">${btn(UI.open['obs']?'관찰 접기':'튀는 날만 관찰 남기기 ▾','toggle',{t:'obs'},'small ghost')}</div>${UI.open['obs']?`<div class="row" style="margin-top:6px">${obs}</div>`:''}</div></div>`+swHTML();
};
/* ---------- 스톱워치 (아이폰 스톱워치처럼: 시작/중단 · 랩/재설정) ---------- */
const SW={on:false,t0:0,acc:0,lapAcc:0,laps:[],fold:false};
const swNow=()=>SW.acc+(SW.on?Date.now()-SW.t0:0);
function swFmt(ms){const cs=Math.floor(ms/10)%100,sec=Math.floor(ms/1000)%60,min=Math.floor(ms/60000);return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${String(cs).padStart(2,'0')}`}
function swHTML(){
  const t=swNow(), cur=t-SW.lapAcc, n=SW.laps.length, started=t>0;
  const left=SW.on?`<button class="swb lap" data-act="swLap">랩</button>`:`<button class="swb lap" data-act="swReset"${started?'':' disabled'}>재설정</button>`;
  const right=SW.on?`<button class="swb stop" data-act="swStop">중단</button>`:`<button class="swb go" data-act="swStart">시작</button>`;
  let min=-1,max=-1; if(n>=2){min=SW.laps.indexOf(Math.min(...SW.laps));max=SW.laps.indexOf(Math.max(...SW.laps))}
  const rows=(started?`<div class="swl"><span>랩 ${n+1}</span><span id="sw-cur">${swFmt(cur)}</span></div>`:'')+
    SW.laps.map((v,i)=>[v,i]).reverse().map(([v,i])=>`<div class="swl${i===min?' fast':i===max?' slow':''}"><span>랩 ${i+1}</span><span>${swFmt(v)}</span></div>`).join('');
  return `<div class="sw"><div class="sw-l"><span class="sw-lbl">스톱워치</span><span id="sw-time" class="sw-time">${swFmt(t)}</span><div class="sw-btns">${left}${right}</div></div>
    <div class="sw-r"><div class="sw-rh"><span>랩</span><span class="muted">${n?n+'개':''}</span></div><div class="sw-laps" data-sk="laps">${rows||'<div class="swl empty"><span>시작을 누르면 시간이 가고, 랩을 누르면 여기 쌓여요.</span></div>'}</div></div></div>`;
}
function swTick(){if(SW.on){const a=document.getElementById('sw-time'),b=document.getElementById('sw-cur');const t=swNow();if(a)a.textContent=swFmt(t);if(b)b.textContent=swFmt(t-SW.lapAcc)}requestAnimationFrame(swTick)}
requestAnimationFrame(swTick);
V.start=V.live;
function timerText(){if(!UI.timer)return '';const left=Math.max(0,Math.round((UI.timer.end-Date.now())/1000));return left?`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')} · ${esc(UI.timer.name)}`:`끝 · ${esc(UI.timer.name)}`}

/* ---------- 마무리 (v3: 다음 같은 분할 초안) ---------- */
function topDone(x){return topSet({...x,sets:x.sets.filter(st=>st.done)})}
V.summary=r=>{
  const s=SES(r.sid), m=M(s.memberId); const nx=ensureNext(s);
  const done=s.exercises.filter(x=>x.status==='done'&&x.sets.some(st=>st.done));
  const none=s.exercises.filter(x=>x.status==='planned'&&!x.sets.some(st=>st.done));
  const res=done.map(x=>{const ls=lastSame(m,s,x.exId);return `<tr class="click" data-act="backToEx" data-sid="${s.id}" data-uid="${x.uid}"><td><b>${esc(EX(x.exId).name)}</b><div class="tiny muted">${x.role}</div></td><td class="small">${esc(fsets(x.sets.filter(st=>st.done),x.exId,'a'))}</td><td class="small">${ls?`${md(ls.p.date)} · ${esc(fsets(ls.y.sets,x.exId,'a'))}`:'<span class="faint">처음</span>'}</td></tr>`}).join('');
  const ch=sessionChanges({...s,exercises:s.exercises.filter(x=>x.status!=='planned')}).concat(none.map(x=>`${EX(x.exId).name} 기록 안 함 (다음 숫자 채우기에 안 써요)`));
  const nAdj={cond:0,live:0}; for(const x of done) for(const st of x.sets) if(st.done&&st.adj&&nAdj[st.adj.by]!=null) nAdj[st.adj.by]++;
  if(nAdj.cond) ch.push(`컨디션 때문에 바꾼 숫자로 한 세트 ${nAdj.cond}개`); if(nAdj.live) ch.push(`앞 세트 결과로 바꾼 숫자로 한 세트 ${nAdj.live}개`);
  const longs=[]; for(const x of done) x.sets.forEach((st,i)=>{if(st.restMin!=null&&st.restMin>2*((x.rest||60)/60)) longs.push(`${EX(x.exId).name} ${setNo(x,i)}세트 앞 쉼 약 ${restText(st.restMin)} (계획 ${restText((x.rest||60)/60)})`)});
  const prs=done.map(x=>{const p=prFor(m,s,{...x,sets:x.sets.filter(st=>st.done)});if(!p)return null;const n=EX(x.exId).name;
    return p.first?`${n} 처음 기록 ${ftop(p.today,x.exId)}`:`${n} 지난 최고 ${ftop(p.best,x.exId)} (${md(p.bestDate)}) → 오늘 ${ftop(p.today,x.exId)}`}).filter(Boolean);
  const draft=done.map(x=>{const t=nx.targets[x.exId]||{};const top=topDone(x);const d={sid:s.id,ex:x.exId};const hit=reachedTop(x);
    const raised=t.raised&&(t.w!=null||t.r!=null);
    return `<div class="draft-row" style="display:grid;grid-template-columns:118px 150px minmax(0,1fr);gap:8px"><span><b class="small">${esc(EX(x.exId).name)}</b><div class="tiny muted">${x.role}</div></span>
      <span class="small">오늘 ${top?esc(ftop(top,x.exId)):'—'}${hit?'<br><span class="tag good" title="모든 본세트가 계획 횟수 위 끝 이상">목표 넘음</span>':''}</span>
      <span class="row" style="justify-content:flex-end;flex-wrap:nowrap">${raised?`<span class="small">다음</span>${bIn('nt',t.w,{...d,f:'w'},{w:64,im:'decimal',ph:'무게'})}<span class="small">×</span>${bIn('nt',t.r,{...d,f:'r'},{w:52,ph:'횟수'})}${btn('그대로','keepNext',d,'small ghost')}`
        :`<span class="tiny muted">다음엔 오늘 숫자로</span>${top&&isNum(top.w)?btn(`올리기 +${EX(x.exId).inc||2.5}`,'raiseNext',d,'small'+(hit?' primary':'')):''}`}</span></div>`}).join('');
  const back=s.exercises.filter(x=>x.status==='removed'&&SOFT_REASONS.includes(x.reason)).map(x=>`<div class="tiny muted">${esc(EX(x.exId).name)}: 오늘 뺌(${esc(x.reason)}) → 루틴 틀에 그대로 있어 다음에 다시 들어가요</div>`).join('');
  const free=done.map(x=>{const t=nx.targets[x.exId]||{};return `<div class="row" style="margin-bottom:6px;flex-wrap:nowrap"><span style="width:140px" class="small">${esc(EX(x.exId).name)}</span>${bIn('nt',t.text,{sid:s.id,ex:x.exId,f:'text'},{grow:1,ph:'예: 3세트 모두 12회'})}</div>`}).join('');
  const cands=[];
  for(const x of s.exercises) x.sets.forEach((st,i)=>{if(st.pain) cands.push(`${EX(x.exId).name} ${setNo(x,i)}세트에서 통증`)});
  if(s.cond&&s.cond.pain&&s.cond.pain!=='none') cands.push(`수업 전 통증 ${lab(PAIN3,s.cond.pain)}${s.cond.painWhere?': '+s.cond.painWhere:''}`);
  for(const x of s.exercises) if(x.note) cands.push(`${EX(x.exId).name}: ${x.note}`);
  if(s.memo) cands.push(s.memo);
  const promoted=s.promoted||[];
  const candRows=cands.map(c=>`<div class="li"><span style="flex:1" class="small">${esc(c)}</span>${promoted.includes(c)?'<span class="tag good">올림</span>':btn('주의사항으로','promote',{sid:s.id,text:c},'small')}</div>`).join('');
  const differs=differsFromTemplate(s);
  const tplQ=s.tplAnswer?`<div class="card"><h2>루틴 틀</h2><div class="small">${s.tplAnswer==='yes'?'루틴 틀을 오늘 종목·순서로 고쳤어요. 바뀐 날이 남았어요.':'루틴 틀은 그대로 둬요.'}</div></div>`
    :differs?`<div class="card ask"><h2>루틴 틀도 고칠까요?</h2><div class="small" style="margin-bottom:6px">오늘 종목이나 순서가 ${esc(splitName(s))} 루틴 틀과 달라요. 고치면 다음 ${esc(splitName(s))}부터 오늘 것으로 채워요.</div><div class="row">${btn('예, 오늘 것으로','tplAnswer',{sid:s.id,v:'yes'},'small')}${btn('아니요','tplAnswer',{sid:s.id,v:'no'},'small')}</div></div>`:'';
  const np=nx.np; const part=UI.route.name;
  /* v4.3 (2026-11-05): 마무리를 셋으로 나눈다. 마무리 = 트레이너 기록 확인, show = 회원에게 보여 주는 화면, nextplan = 다음 PT 계획 */
  if(part==='nextplan') return topBar(esc(m.code)+' 다음 PT 계획',`${mdw(s.date)} ${esc(splitName(s))} 결과로 다음 수업 숫자와 날짜를 정해요`,'',{noBack:true})+
   `<div class="scroll" data-sk="main"><div class="grid2"><div class="col">
     <div class="card"><h2><span class="n">1</span>다음 ${esc(splitName(s))} 숫자 <span class="tiny muted">올릴 종목만 눌러요</span></h2>${draft||'<div class="empty">기록한 종목이 없어요.</div>'}${back}
       <div class="tiny muted" style="margin-top:6px">'목표 넘음'은 표시만 해요. 올릴지는 트레이너가 정하고, 누르면 기구 눈금 한 칸 올린 숫자가 다음 목표가 돼요. 숫자는 고칠 수 있어요.</div>
       <div style="margin-top:4px">${btn(UI.open['freeT']?'글 접기':'다음 목표를 글로 남기기 ▾','toggle',{t:'freeT'},'small ghost')}</div>${UI.open['freeT']?free:''}</div></div>
    <div class="col">
     <div class="card"><h2><span class="n">2</span>다음 PT 날짜</h2><div class="row" style="margin-bottom:6px">${chips([['1','잡기'],['0','나중에']],np.on?'1':'0','npOn',{sid:s.id})}</div>
       ${np.on?`<div class="row">${bIn('np',np.date,{sid:s.id,f:'date'},{type:'date',w:160})}${bIn('np',np.time,{sid:s.id,f:'time'},{type:'time',w:120})}${bSel('np',m.templates.map(t=>[t.id,t.name]),np.tid,{sid:s.id,f:'tid'},{w:120})}</div><div class="tiny muted" style="margin-top:4px">분할은 순서대로 다음 것을 골라 뒀어요. 끝내면 그 분할의 숫자를 미리 채워요.</div>`:''}</div>
     ${checkCard(m,3)}</div></div></div>`+
   actBar(btn('‹ 마무리로','go',{to:'summary',sid:s.id}),'<span class="tiny muted" style="margin-right:8px">아무것도 안 눌러도 수업 기록은 저장돼요.</span>'+btn('끝내기','finish',{sid:s.id},'primary'));
  return topBar(esc(m.code)+' 마무리',`${mdw(s.date)} · ${esc(splitName(s))} · 회원이 간 뒤 1분 · 오늘 기록 확인`,'',{noBack:true})+
   `<div class="scroll" data-sk="main"><div class="grid2"><div class="col">
     <div class="card"><h2><span class="n">1</span>오늘 결과 <span class="tiny muted">줄을 누르면 고칠 수 있어요</span></h2><table><tr><th>종목</th><th>오늘</th><th>지난 같은 분할</th></tr>${res||'<tr><td colspan="3" class="empty">기록한 세트가 없어요.</td></tr>'}</table></div>
     ${tplQ}</div>
    <div class="col">
     ${foldCard('sum2-'+s.id,'<span class="n">2</span>계획과 달라진 곳',ch.length+longs.length,ch.map(c=>`<div class="small">· ${esc(c)}</div>`).join('')+longs.map(c=>`<div class="small" style="color:var(--warn)">· ${esc(c)}</div>`).join('')||'<div class="empty">계획대로 했어요.</div>')}
     ${foldCard('sum3-'+s.id,'<span class="n">3</span>넘은 개인 기록',prs.length,prs.map(p=>`<div class="small">· ${esc(p)}</div>`).join('')||'<div class="empty">없어요.</div>')}
     ${cands.length?foldCard('sum7-'+s.id,'<span class="n">4</span>주의사항으로 올릴 것 <span class="tiny muted">올릴지는 트레이너가 정해요</span>',cands.length,`<div class="list">${candRows}</div>`):''}
    </div></div></div>`+
   actBar(btn('‹ 수업으로','go',{to:'live',sid:s.id}),'<span class="tiny muted" style="margin-right:8px">회원이 아직 있으면 결과를 보여 주고, 간 뒤에 다음 PT를 정해요.</span>'+btn('회원에게 보여 주기','go',{to:'show',sid:s.id})+btn('다음 PT 계획 ›','go',{to:'nextplan',sid:s.id},'primary'));
};
V.nextplan=V.summary;

/* 회원에게 보여 주는 화면: 쉬운 말, 큰 숫자, 메모·주의사항·트레이너 판단은 안 보인다 */
V.show=r=>{
  const s=SES(r.sid), m=M(s.memberId);
  const done=s.exercises.filter(x=>x.status==='done'&&x.sets.some(st=>st.done));
  const today=done.map(x=>{const t=topDone(x);const n=x.sets.filter(st=>st.done&&st.kind!=='warmup').length;return `<div class="show-ex"><b>${esc(EX(x.exId).name)}</b><span class="num">${t?esc(ftop(t,x.exId)):'—'}</span><span class="tiny muted">${n}세트</span></div>`}).join('');
  const prs=done.map(x=>{const p=prFor(m,s,{...x,sets:x.sets.filter(st=>st.done)});if(!p||p.first)return null;return `<div class="show-pr">🎉 <b>${esc(EX(x.exId).name)}</b> 최고 기록 ${esc(ftop(p.best,x.exId))} → <b>${esc(ftop(p.today,x.exId))}</b></div>`}).filter(Boolean).join('');
  const main=done.find(x=>x.role==='메인')||done[0];
  let ex=UI.cur['show-'+s.id]; if(!done.some(x=>x.exId===ex)) ex=main&&main.exId;
  let chart='<div class="empty">그릴 기록이 없어요.</div>';
  if(ex){const ser=trendSeries(m,ex).filter(o=>o.s.date<s.date&&o.s.id!==s.id);const x=done.find(y=>y.exId===ex);const t=topDone(x);
    const pts=ser.slice(-9).map(o=>({date:o.s.date,v:o.t.w,label:`${md(o.s.date)} ${ftop(o.t,ex)}`})); if(t&&isNum(t.w)) pts.push({date:s.date,v:t.w,label:`오늘 ${ftop(t,ex)}`});
    const W=UI.orient==='land'?560:700; chart=pts.length&&pts.every(p=>isNum(p.v))?chartSVG(pts,W,220,p=>fw(p.v,ex),pts.length-1,{fewX:1}).replace(/data-act="trendPt"/g,'').replace(`<svg class="chart" width="${W}" height="220"`,`<svg class="chart" width="100%" viewBox="0 0 ${W} 220"`):'<div class="empty">무게 기록이 없는 종목이에요.</div>'}
  const pick=done.filter(x=>{const t=topDone(x);return t&&isNum(t.w)}).map(x=>`<button class="chip${x.exId===ex?' on':''}" data-act="pickShow" data-sid="${s.id}" data-v="${x.exId}">${esc(EX(x.exId).name)}</button>`).join(' ');
  return topBar(`${esc(m.code)} 회원님, 오늘 수고했어요`,`${mdw(s.date)} · ${esc(splitName(s))}`,'',{noBack:true})+
   `<div class="scroll show" data-sk="main"><div class="grid2"><div class="col">
     <div class="card"><h2>오늘 한 운동 <span class="tiny muted">가장 무거운 세트</span></h2>${today||'<div class="empty">기록한 운동이 없어요.</div>'}${prs?`<div style="margin-top:8px">${prs}</div>`:''}</div>
     <div class="card"><h2>지난번보다</h2>${deltaChart(m,s)}</div></div>
    <div class="col">
     <div class="card"><h2>무게 흐름</h2><div class="row" style="margin-bottom:6px">${pick}</div>${chart}</div>
     <div class="card"><h2>오늘 쓴 근육</h2>${muscleBlock([s],220,'오늘')}</div></div></div></div>`+
   actBar(btn('‹ 마무리로','go',{to:'summary',sid:s.id}),btn('다음 PT 계획 ›','go',{to:'nextplan',sid:s.id},'primary'));
};

/* ---------- 10단계 추이 ---------- */
function trendSeries(m,exId){return completed(m.id).map(s=>{const x=s.exercises.find(e=>e.exId===exId&&e.status==='done');const t=x&&topSet(x);return t?{s,x,t}:null}).filter(Boolean)}
function chartSVG(pts,W,Hh,fmt,sel,o={}){
  if(!pts.length) return '<div class="empty">그릴 기록이 없어요.</div>';
  const padL=44,padR=16,padT=14,padB=28; const xs=pts.map(p=>pd(p.date).getTime()); const x0=Math.min(...xs),x1=Math.max(...xs);
  const ymax=Math.max(...pts.map(p=>p.v))*1.15||1; const X=t=>x1===x0?padL+(W-padL-padR)/2:padL+(t-x0)/(x1-x0)*(W-padL-padR); const Y=v=>padT+(1-v/ymax)*(Hh-padT-padB);
  const step=ymax>100?50:ymax>40?10:ymax>15?5:1; let grid='';
  for(let v=0;v<=ymax;v+=step) grid+=`<line x1="${padL}" x2="${W-padR}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${padL-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`;
  const path=pts.map((p,i)=>`${i?'L':'M'}${X(xs[i]).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  const dots=pts.map((p,i)=>`<g data-act="trendPt" data-i="${i}" style="cursor:pointer"><circle cx="${X(xs[i])}" cy="${Y(p.v)}" r="14" fill="transparent"/><circle cx="${X(xs[i])}" cy="${Y(p.v)}" r="${sel===i?6:4.5}" fill="var(--accent)" stroke="var(--panel)" stroke-width="2"/><title>${esc(p.label)}</title></g>`).join('');
  const xl=pts.map((p,i)=>o.fewX&&i&&i<pts.length-1?'':`<text x="${X(xs[i])}" y="${Hh-8}" text-anchor="middle">${md(p.date)}</text>`).join('');
  const lastI=pts.length-1;
  return `<svg class="chart" width="${W}" height="${Hh}" role="img" aria-label="최고 무게 추이">${grid}<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2"/>${dots}${xl}<text x="${X(xs[lastI])}" y="${Y(pts[lastI].v)-12}" text-anchor="middle" style="fill:var(--ink);font-weight:600">${esc(fmt(pts[lastI]))}</text></svg>`;
}
V.trend=r=>{
  const m=M(r.mid); const cnt={};
  for(const s of completed(m.id)) for(const x of s.exercises) if(x.status==='done'&&topSet(x)) cnt[x.exId]=(cnt[x.exId]||0)+1;
  const main=new Set();for(const s of completed(m.id))for(const x of s.exercises)if(x.role==='메인')main.add(x.exId);
  const exs=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]||(main.has(b)-main.has(a))); let ex=UI.cur['trend-'+m.id]; if(!cnt[ex]) ex=exs[0];
  const ser=ex?trendSeries(m,ex):[]; const sel=UI.cur['trendPt-'+m.id];
  const pts=ser.map(o=>({date:o.s.date,v:o.t.w,label:`${md(o.s.date)} ${ftop(o.t,ex)}`}));
  const W=UI.orient==='land'?1000:730;
  const picked=sel!=null&&ser[sel]?ser[sel]:null;
  const rows=ser.slice().reverse().map(o=>`<tr><td class="num">${mdw(o.s.date)}</td><td>${esc(splitName(o.s))}</td><td class="small">${esc(fsets(o.x.sets,ex,'a'))}</td><td class="num">${ftop(o.t,ex)}</td></tr>`).join('');
  const body=m.body.slice().reverse().map(b=>`<tr><td class="num">${md(b.date)}</td><td class="num">${b.weight??''}</td><td class="num">${b.muscle??''}</td></tr>`).join('');
  const blocks=m.blocks.map(b=>`<span class="tag">${md(b.start)||'?'}부터 ${esc(b.dir)}${b.focus?' · '+esc(b.focus):''}</span>`).join(' ');
  return topBar(esc(m.code)+' 추이','데이터상 차이만 보여 주고 원인은 판단하지 않아요',btn('훈련 방향 바꾸기','modal',{type:'block',mid:m.id},'primary'))+
   `<div class="scroll" data-sk="main"><div class="card"><h2>종목별 최고 무게</h2>
     <div class="row" style="margin-bottom:8px">${exs.map(id=>`<button class="chip${id===ex?' on':''}" data-act="pickTrend" data-mid="${m.id}" data-v="${id}">${esc(EX(id).name)} <span class="tiny">${cnt[id]}</span></button>`).join(' ')||'<span class="empty">기록이 없어요.</span>'}</div>
     ${ex?`<div class="small muted">${esc(EX(ex).name)} · 수업마다 가장 무거운 본세트 (워밍업 제외). 점을 누르면 그날 숫자가 보여요.</div>${chartSVG(pts,W,230,p=>fw(p.v,ex),sel)}
     <div class="small" style="min-height:20px">${picked?`<b>${mdw(picked.s.date)}</b> ${esc(splitName(picked.s))} · ${esc(fsets(picked.x.sets,ex,'a'))}${picked.x.raw?` <span class="dimline">수첩: ${esc(picked.x.raw)}</span>`:''}`:''}</div>
     ${blocks?`<div class="small">훈련 방향: ${blocks}</div>`:''}
     <table style="margin-top:6px"><tr><th>날짜</th><th>분할</th><th>실제 세트</th><th>최고</th></tr>${rows}</table>`:''}</div>
    <div class="card" style="margin-top:12px"><h2>체중 <span class="tag good">4a</span></h2><table><tr><th>날짜</th><th>체중</th><th>골격근량</th></tr>${body||'<tr><td colspan="3" class="empty">체중 기록이 없어요. 수첩에도 없었어요.</td></tr>'}</table>
     <div class="row" style="margin-top:6px">${dIn('bDate-'+m.id,'',{type:'date',w:150})}${dIn('bW-'+m.id,'체중',{w:70,im:'decimal'})}${dIn('bM-'+m.id,'골격근',{w:70,im:'decimal'})}${btn('넣기','addBody',{mid:m.id},'small')}</div></div></div>`;
};

/* ---------- 11단계 수업 기록·상세 ---------- */
function weekKey(d){const x=pd(d);const k=(x.getDay()+6)%7;x.setDate(x.getDate()-k);return iso(x)}
V.history=r=>{
  const m=M(r.mid); const f=UI.cur['hist-'+m.id]||'all';
  const list=msessions(m.id).filter(s=>f==='all'||s.templateId===f).reverse();
  let html='',wk=null;
  const weekSum={}; for(const s of list){const k=weekKey(s.date);weekSum[k]=weekSum[k]||{n:0,v:0};if(s.status==='completed'){weekSum[k].n++;weekSum[k].v+=sessionVolume(s)}}
  for(const s of list){const k=weekKey(s.date); if(k!==wk){wk=k;html+=`<div class="small muted" style="padding:10px 4px 2px;font-weight:600">${md(k)} 주 · 수업 ${weekSum[k].n}회 · 볼륨 ${weekSum[k].v.toLocaleString()}</div>`}
    const v=sessionVolume(s);
    html+=`<div class="li click" data-act="go" data-to="detail" data-sid="${s.id}"><div style="width:80px" class="num">${mdw(s.date)}</div><div style="width:80px"><b>${esc(splitName(s))}</b></div><div style="flex:1;min-width:0" class="tiny muted">${s.exercises.filter(x=>x.status==='done'||s.status!=='completed').map(x=>EX(x.exId).name).join(', ')}</div>${s.status!=='completed'?`<span class="tag${s.status==='planned'||s.status==='in_progress'?' good':''}">${statusLabel[s.status]}</span>`:''}<span class="num small" style="width:90px;text-align:right">${v?'볼륨 '+v.toLocaleString():''}</span><span class="faint">›</span></div>`}
  return topBar(esc(m.code)+' 수업 기록','볼륨 = 무게 × 횟수 합 (워밍업 제외, 한쪽 무게는 두 배) · 단위가 섞여 있어 참고용',btn('찾기','go',{to:'search',mid:m.id}))+
   `<div class="scroll" data-sk="main"><div class="row" style="margin-bottom:6px">${[['all','전체'],...m.templates.map(t=>[t.id,t.name])].map(([v,l])=>`<button class="chip${f===v?' on':''}" data-act="pickHist" data-mid="${m.id}" data-v="${v}">${esc(l)}</button>`).join(' ')}</div><div class="card"><div class="list">${html||'<div class="empty">기록이 없어요.</div>'}</div></div></div>`;
};
V.detail=r=>{
  const s=SES(r.sid), m=M(s.memberId);
  const parts={}; for(const x of s.exercises){if(x.status!=='done')continue;const p=EX(x.exId).part||'기타';parts[p]=(parts[p]||0)+x.sets.filter(st=>st.kind!=='warmup'&&(st.done||(s.seeded&&(st.aw!=null||st.ar!=null)))).length}
  const rows=s.exercises.map((x,i)=>`<tr><td class="num">${i+1}</td><td><b class="${x.status==='removed'?'st-removed':x.status==='swapped'?'st-swapped':''}">${esc(EX(x.exId).name)}</b><div class="tiny muted">${x.role}${x.status==='removed'?' · 뺌'+(x.reason?' ('+esc(x.reason)+')':''):x.status==='swapped'?' · 바꿈':''}${x.origin==='added'?' · 새로 넣음':x.origin==='swap'?' · 바꿔 넣음':''}</div></td>
     <td class="small">${esc(fsets(x.sets,x.exId,'p'))||'—'}</td><td class="small">${s.status==='plan_only'?'<span class="faint">했는지 모름</span>':esc(fsets(x.sets,x.exId,'a'))||'—'}${x.sets.some(st=>isNum(st.rir))?`<div class="tiny muted">여유 횟수 ${x.sets.filter(st=>isNum(st.rir)).map(st=>st.rir).join(', ')}</div>`:''}</td>
     <td class="small">${x.setting?'세팅 '+esc(x.setting)+'<br>':''}${x.note?esc(x.note)+'<br>':''}${x.raw?`<span class="dimline">수첩: ${esc(x.raw)}</span>`:''}</td></tr>`).join('');
  const nt=Object.entries(s.nextTargets||{}).map(([k,t])=>`${EX(k).name} ${t.w!=null?fw(t.w,k):''}${t.r!=null?' × '+t.r:''}${t.text?' '+t.text:''}`);
  return topBar(esc(m.code)+` ${mdw(s.date)} ${esc(splitName(s))}`,`${statusLabel[s.status]}${s.seeded?' · 수첩에서 옮긴 기록':''} · 수업 상세`,s.status==='planned'||s.status==='in_progress'?btn('수업으로','openSession',{sid:s.id},'primary'):'')+
   `<div class="scroll" data-sk="main">
    ${s.cond||s.goal||s.memo||nt.length?`<div class="card" style="margin-bottom:10px"><dl class="kv">${s.goal?`<dt>오늘 목표</dt><dd>${esc(s.goal)}</dd>`:''}${s.cond?`<dt>컨디션</dt><dd>${condLine(s.cond)}</dd>`:''}${s.memo?`<dt>수업 메모</dt><dd>${esc(s.memo)}</dd>`:''}${(s.observations||[]).length?`<dt>관찰</dt><dd>${s.observations.map(o=>lab(OBS,o.kind)+(o.dir==='up'?' 좋아짐':' 나빠짐')).join(', ')}</dd>`:''}${nt.length?`<dt>다음 목표</dt><dd>${esc(nt.join(' / '))}</dd>`:''}</dl></div>`:''}
    <div class="card"><table><tr><th>#</th><th>종목</th><th>계획</th><th>실제</th><th>메모 · 수첩 원문</th></tr>${rows}</table>
    ${s.status==='completed'?`<div class="sumviz" style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px"><div><div class="small" style="font-weight:700;margin-bottom:6px">지난번과 비교</div>${deltaChart(m,s)}</div><div><div class="small" style="font-weight:700;margin-bottom:6px">쓴 근육</div>${muscleBlock([s],190,'이 수업')}</div></div>`:''}
    ${Object.keys(parts).length?`<div class="tiny muted" style="margin-top:6px">부위별 본세트 수: ${Object.entries(parts).map(([p,n])=>`${p} ${n}`).join(', ')} · 볼륨 ${sessionVolume(s).toLocaleString()}</div>`:''}</div></div>`;
};

/* ---------- 12단계 기록 찾기 ---------- */
V.search=r=>{
  const q=UI.search.trim(); const words=q.toLowerCase().split(/\s+/).filter(Boolean); const res=[];
  const hit=t=>t&&words.every(w=>t.toLowerCase().includes(w));
  const mark=t=>{let h=esc(t);for(const w of words){h=h.replace(new RegExp(esc(w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),x=>`<mark>${x}</mark>`)}return h};
  if(words.length){
    for(const m of S.members){ if(r.mid&&m.id!==r.mid) continue;
      for(const s of msessions(m.id)){ if(s.status==='planned') continue;
        if(hit(s.memo)) res.push({m,s,what:'수업 메모',t:s.memo});
        for(const x of s.exercises){const n=EX(x.exId).name; const line=[n,x.raw,x.note,x.setting].filter(Boolean).join(' · '); if(hit(line)) res.push({m,s,what:n,t:x.raw||line+(hasAct(x)?' · '+fsets(x.sets,x.exId,'a'):'')})}}
      for(const n of m.notes) if(hit(n.text)) res.push({m,what:NOTE_KINDS[n.kind],t:n.text});
      for(const c of m.cautions) if(hit(c.part+' '+c.text)) res.push({m,what:'주의사항',t:c.part+' '+c.text});
      for(const [k,v] of Object.entries(m.exMemos)) if(hit(EX(k).name+' '+v.setting+' '+v.memo)) res.push({m,what:'종목 메모',t:`${EX(k).name} ${v.setting} ${v.memo}`});
    }
  }
  const rows=res.slice(0,80).map(o=>`<div class="li${o.s?' click':''}"${o.s?` data-act="go" data-to="detail" data-sid="${o.s.id}"`:''}><div style="width:120px" class="small"><b>${esc(o.m.code)}</b><div class="tiny muted">${o.s?mdw(o.s.date)+' '+esc(splitName(o.s)):''}</div></div><div style="flex:1;min-width:0"><div class="tiny muted">${esc(o.what)}</div><div class="small">${mark(o.t)}</div></div></div>`).join('');
  const m=r.mid?M(r.mid):null;
  return topBar((m?esc(m.code)+' ':'')+'기록 찾기','AI 기록 검색은 5단계부터예요. 지금은 낱말로만 찾아요.')+
   `<div class="scroll" data-sk="main"><div class="row" style="margin-bottom:10px;flex-wrap:nowrap"><input data-on="search" data-k="search" value="${esc(UI.search)}" placeholder="예: 무릎, 발판, 실패, 핵스쿼트" style="flex:1">${btn('찾기','doSearch',null,'primary')}</div>
    ${words.length?`<div class="small muted" style="margin-bottom:6px">${res.length}건${res.length>80?' (앞 80건만)':''} · 저장된 기록만 찾고, 날짜와 원문을 같이 보여 줘요.</div><div class="card"><div class="list">${rows||'<div class="empty">없어요.</div>'}</div></div>`:'<div class="empty">낱말을 넣고 찾기를 눌러요. 여러 낱말은 모두 들어간 기록만 보여 줘요.</div>'}</div>`;
};

/* ---------- 설정 ---------- */
V.settings=()=>{
  const R=S.settings.roles;
  const roleRows=ROLES.map(k=>{const v=R[k];const f=(n,w)=>bIn('roleVal',v[n],{role:k,f:n},{w:w||52,im:'numeric',cls:'num'});return `<tr><td>${k}</td><td>${f('rmin')}~${f('rmax')}</td><td>${f('target')}</td><td>${f('rir')}</td><td>${f('sets')}</td><td>${f('rest',60)}</td></tr>`}).join('');
  const exRows=Object.entries(S.exercises).map(([id,e])=>`<tr><td>${bIn('exName',e.name,{id},{w:190})}</td><td>${bSel('exPart',pairs(['하체','가슴','등','어깨','팔','복근','전신','기타']),e.part,{id},{w:80})}</td><td>${bSel('exUnit',[['','(없음)'],['kg','kg'],['lb','lb']],e.unit,{id},{w:80})}</td><td>${bIn('exInc',e.inc,{id},{w:56,im:'decimal',cls:'num'})}</td><td><input type="checkbox" data-act="exSide" data-id="${id}"${e.side?' checked':''} aria-label="한쪽 무게"></td></tr>`).join('');
  return topBar('설정','숫자 채우기 기준과 종목 사전')+
   `<div class="scroll" data-sk="main"><div class="grid2"><div class="col">
     <div class="card"><h2>쉬는 시간 타이머</h2><div class="row">${chips([['0','끔'],['1','켬']],S.settings.restTimer?'1':'0','setTimer')}</div><div class="tiny muted" style="margin-top:4px">켜면 세트를 끝낼 때 계획한 쉬는 시간으로 돌아요. 트레이너 답이 오기 전이라 기본은 꺼 둬요.</div></div>
     <div class="card"><h2>지난 실제값 기준</h2><div class="row">${chips([['same','같은 분할'],['recent','가장 최근']],S.settings.basis,'setBasis')}</div><div class="tiny muted" style="margin-top:4px">다음 목표가 없을 때 어느 수업의 실제값으로 채울지예요. 같은 분할에 없는 종목은 가장 최근으로 채워요. 바꾸면 앞으로 만드는 수업 준비부터 적용돼요.</div></div>
     <div class="card"><h2>역할별 기준 <span class="tag warn">논문 기준 임시값 (D59)</span></h2><table><tr><th>역할</th><th>횟수 범위</th><th>목표 횟수</th><th>여유 횟수</th><th>세트</th><th>쉬는 초</th></tr>${roleRows}</table><div class="tiny muted" style="margin-top:4px">트레이너 답(O02)이 오면 바꿀 값이에요. 유산소성 순환은 횟수 칸을 라운드로 써요.</div></div>
     <div class="card"><h2>예시 취소·안 옴 <span class="tag warn">예시</span></h2><div class="row">${chips([['1','보임'],['0','숨김']],S.settings.exampleCx===false?'0':'1','setExampleCx')}</div><div class="tiny muted" style="margin-top:4px">수첩에는 취소·안 옴 기록이 없어요. 화면을 보여 주려고 넣은 예시 ${EXAMPLE_CX.length}건이고, 운동 기록은 없어요. 실제 날짜를 알면 바꿔요.</div></div>
     <div class="card"><h2>처음 상태로</h2>${UI.confirmReset?`<div class="row"><span class="small">입력한 것을 모두 지울까요?</span>${btn('되돌리기','reset',null,'danger')}${btn('아니요','confirmReset',{v:0})}</div>`:btn('처음 상태로 되돌리기','confirmReset',{v:1},'small')}</div></div>
    <div class="card"><h2>종목 사전 <span class="tag warn">단위·눈금은 예시 (O36)</span></h2><div class="tiny muted" style="margin-bottom:4px">눈금은 +/− 한 칸과 계산한 무게를 내릴 때 써요. '한쪽'은 40/40kg처럼 한쪽 무게로 적는 기구예요.</div>
     <table><tr><th>이름</th><th>부위</th><th>단위</th><th>눈금</th><th>한쪽</th></tr>${exRows}</table>
     <div class="row" style="margin-top:8px;flex-wrap:nowrap">${dIn('newExName','새 종목 이름',{grow:1})}${dSel('newExPart',pairs(['하체','가슴','등','어깨','팔','복근','전신','기타']),'하체',{w:80})}${dSel('newExUnit',[['kg','kg'],['lb','lb'],['','(없음)']],'kg',{w:80})}${dIn('newExInc','눈금',{w:56,im:'decimal',v:'2.5'})}${btn('+ 종목','newEx',null,'small')}</div></div></div></div>`;
};

/* ---------- 창 ---------- */
const MOD={};
function exPicker(part,selected,act,skip=[]){
  const groups={}; for(const [id,e] of Object.entries(S.exercises)) if(!skip.includes(id)) (groups[e.part||'기타']=groups[e.part||'기타']||[]).push([id,e]);
  const order=Object.keys(groups).sort((a,b)=>(a===part?-1:b===part?1:0));
  return order.map(p=>`<div class="tiny muted" style="margin:6px 0 4px">${esc(p)}${p===part?' (같은 부위)':''}</div><div class="row">${groups[p].map(([id,e])=>`<button class="chip${id===selected?' on':''}" data-act="${act}" data-v="${id}">${esc(e.name)}</button>`).join(' ')}</div>`).join('');
}
MOD.schedule=o=>{
  const m=M(o.mid); const s=o.sid?SES(o.sid):null; const last=msessions(m.id).slice(-1)[0];
  const defDate=s?s.date:(last?addDays(last.date,7):iso(new Date()));
  return `<h3>${s?'수업 옮기기':'다음 PT 잡기'}</h3><div class="row" style="margin-bottom:10px">${dIn('sc-d','',{type:'date',v:defDate,w:160})}${dIn('sc-t','',{type:'time',v:s?s.time:'',w:120})}${s?`<span class="small muted">${esc(splitName(s))}</span>`:dSel('sc-s',m.templates.map(t=>[t.id,t.name]),last?nextTpl(m,last):m.templates[0]?.id,{w:130})}</div>
   <div class="tiny muted" style="margin-bottom:10px">${s?'옮기면 날짜만 바뀌고 계획은 그대로예요. 원래 날짜를 남길지는 트레이너에게 물어볼 것이에요.':'잡으면 그 분할의 루틴 틀로 예정 루틴을 미리 채워 둬요.'}</div>
   <div class="row" style="justify-content:flex-end">${btn('닫기','closeModal')}${btn(s?'옮기기':'잡기','saveSchedule',null,'primary')}</div>`;
};
MOD.basis=o=>{
  const s=SES(o.sid), x=s.exercises.find(e=>e.uid===o.uid); const B=x.basis||{lines:[],options:[]}; const ro=s.status!=='planned';
  const names={target:'다음 목표',same:'같은 분할 실제값',recent:'가장 최근 실제값',rule:'규칙'};
  return `<h3>${esc(EX(x.exId).name)} 숫자 근거</h3><div class="small" style="margin-bottom:6px">지금 기준: <b>${names[B.mode]||'—'}</b>${x.edited?' · 직접 고친 숫자가 있어요':''}</div>
   <ul class="small" style="padding-left:18px;margin:0 0 10px">${B.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>
   ${ro?'<div class="tiny muted">수업이 시작돼 기준을 바꿀 수 없어요.</div>':`<div class="small muted" style="margin-bottom:4px">다른 기준으로 채워 보기${x.edited?' (직접 고친 숫자는 덮어써요)':''}</div><div class="row">${B.options.map(k=>`<button class="chip${k===B.mode?' on':''}" data-act="rebasis" data-sid="${s.id}" data-uid="${x.uid}" data-v="${k}">${names[k]}</button>`).join(' ')}</div>`}
   <div class="row" style="justify-content:flex-end;margin-top:12px">${btn('닫기','closeModal')}</div>`;
};
MOD.kind=o=>{const s=SES(o.sid),x=s.exercises.find(e=>e.uid===o.uid),st=x.sets[+o.i];
  return `<h3>${+o.i+1}세트 종류</h3><div class="row">${chips(Object.entries(KINDS),st.kind,'setKindPick',{sid:s.id,uid:x.uid,i:o.i})}</div><div class="row" style="justify-content:space-between;margin-top:12px">${btn('이 세트 지우기','delSet',{sid:s.id,uid:x.uid,i:o.i},'small danger')}${btn('닫기','closeModal')}</div>`};
MOD.swap=o=>{const s=SES(o.sid),x=s.exercises.find(e=>e.uid===o.uid);const to=UI.modal.to;const scope=UI.modal.scope||'today';
  return `<h3>${esc(EX(x.exId).name)} 바꾸기</h3>${exPicker(EX(x.exId).part,to,'pickSwap',liveEx(s).map(e=>e.exId))}
   <div class="tiny muted" style="margin-top:12px">오늘만 바꾸면 루틴 틀은 그대로예요. 루틴 틀에도 바꾸면 다음 수업부터 새 종목으로 채워요.</div>
   <div class="row" style="justify-content:flex-end;margin-top:8px">${btn('닫기','closeModal')}${btn('루틴 틀에도 바꾸기','doSwap',{v:'template'},'',!to||to===x.exId)}${btn('오늘만 바꾸기','doSwap',{v:'today'},'primary',!to||to===x.exId)}</div>`};
MOD.adj=o=>{const s=SES(o.sid),x=s.exercises.find(e=>e.uid===o.uid),st=x.sets[+o.i];const A=st.adj||{lines:[]};const by=A.by;
  const title=by==='cond'?'컨디션 때문에 바뀐 숫자':by==='live'?'앞 세트 결과로 바뀐 숫자':'원래 숫자로 되돌린 세트';
  return `<h3>${esc(EX(x.exId).name)} ${setNo(x,+o.i)}${setNo(x,+o.i)==='워밍업'?'':'세트'} · ${title}</h3>
   ${A.from?`<div class="row" style="margin-bottom:8px"><span class="setchip ro">원래 ${esc(fwr(A.from.w,A.from.r,x.exId))}</span><span>→</span><span class="setchip ro ${by==='cond'||by==='live'?'a-'+by:''}">지금 ${esc(fwr(st.pw,st.pr,x.exId))}</span></div>`:''}
   <ul class="small" style="padding-left:18px;margin:0 0 10px">${A.lines.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>
   ${A.cond?`<div class="small muted">그 전에 컨디션으로 바뀐 까닭</div><ul class="small" style="padding-left:18px;margin:0 0 10px">${A.cond.map(l=>`<li>${esc(l)}</li>`).join('')}</ul>`:''}
   <div class="tiny muted">앱은 숫자를 제안만 해요. 다르게 하려면 그 숫자를 눌러 고쳐요.</div>
   <div class="row" style="justify-content:flex-end;margin-top:12px">${!st.done&&A.from&&(by==='cond'||by==='live')?btn('원래 숫자로','undoAdj',{sid:s.id,uid:x.uid,i:o.i}):''}${btn('닫기','closeModal')}</div>`};
MOD.remove=o=>{const s=SES(o.sid),x=s.exercises.find(e=>e.uid===o.uid);
  return `<h3>${esc(EX(x.exId).name)} 빼기</h3><div class="small muted" style="margin-bottom:6px">이유를 고르면 빠져요.</div><div class="row">${REMOVE_REASONS.map(r=>`<button class="chip" data-act="doRemove" data-v="${r}">${r}</button>`).join(' ')}</div><div class="row" style="justify-content:flex-end;margin-top:12px">${btn('닫기','closeModal')}</div>`};
MOD.addEx=o=>{const to=UI.modal.to;const s=o.sid&&SES(o.sid);
  return `<h3>종목 넣기</h3>${exPicker('',to,'pickSwap',s?liveEx(s).map(e=>e.exId):[])}<div class="row" style="margin-top:12px"><span class="small">역할</span>${dSel('addRole',pairs(ROLES),'보조',{w:130})}</div>
   <div class="row" style="justify-content:flex-end;margin-top:12px">${btn('닫기','closeModal')}${btn('넣기','doAddEx',null,'primary',!to)}</div>`};
MOD.block=o=>{const m=M(o.mid);const b=curBlock(m);const dir=UI.modal.dir||b?.dir||'발전';
  return `<h3>훈련 방향</h3><div class="row" style="margin-bottom:8px">${chips(pairs(DIRS),dir,'pickDir')}</div>
   <div class="row" style="margin-bottom:8px">${dIn('bl-f','집중이면 부위나 종목 (예: 하체)',{grow:1,v:b?.focus||''})}${dIn('bl-s','',{type:'date',w:150,v:iso(new Date())})}</div>
   <div class="tiny muted" style="margin-bottom:10px">방향은 기간으로 쌓여요. '다이어트면 볼륨 유지' 같은 규칙은 넣지 않아요(D19). 몇 주 단위로 잡을지는 아직 모름(O29).</div>
   <div class="row" style="justify-content:flex-end">${btn('닫기','closeModal')}${btn('저장','saveBlock',null,'primary')}</div>`};
MOD.addPkg=o=>{const m=M(o.mid);const k='pkn-'+m.id;const pick=UI.draft[k]||'';
  const list=(m.packages||[]).map(p=>`<div class="li small"><span class="num">${p.date?md(p.date):''}</span><b>${p.n}회</b>${p.example?EXAMPLE('예시 · 수첩에 등록 횟수가 없어 30회 단위로 넣음'):''}<span class="sp"></span>${btn('지우기','delPkg',{mid:m.id,id:p.id},'small ghost')}</div>`).join('');
  return `<h3>${esc(m.code)} 수업 추가 (연장)</h3>
   <div class="field"><label>추가할 횟수</label><div class="row">${['10','20','30'].map(v=>`<button class="chip${pick===v?' on':''}" data-act="draftSet" data-key="${k}" data-v="${v}">${v}회</button>`).join('')}${dIn('pk-'+m.id,'직접 (예: 12)',{w:110,im:'numeric'})}</div></div>
   <div class="field" style="margin-top:10px"><label>지금까지 등록 · 전체 ${pkgTotal(m)}회 · 받은 수업 ${usedCount(m)}회</label>${list||'<div class="empty">없어요.</div>'}</div>
   <div class="row" style="justify-content:flex-end;margin-top:12px">${btn('닫기','closeModal')}${btn('넣기','addPkg',{mid:m.id},'primary')}</div>`};
MOD.sessMenu=o=>{const s=SES(o.sid),m=M(s.memberId);
  return `<h3>${esc(m.code)} · ${mdw(s.date)} ${esc(splitName(s))}</h3><div class="col" style="gap:8px">
   <div class="field"><label>오늘 메모 (카톡에서 들은 말 등, 수업 준비와 수업 시작에 다시 떠요)</label><div class="row" style="flex-wrap:nowrap">${dIn('tm-'+s.id,'예: 2주 만이라 살살 해 주세요',{grow:1})}${btn('넣기','todayMemo',{sid:s.id},'small')}</div>
     ${todayMemos(m,s).map(n=>`<div class="tiny muted">· ${esc(n.text)}</div>`).join('')}</div>
   <div class="row">${btn('옮기기','modal',{type:'schedule',mid:m.id,sid:s.id})}${btn('회원 한눈에','go',{to:'member',mid:m.id})}</div>
   <div class="field" style="border-top:1px solid var(--line);padding-top:10px"><label>못 하게 됐을 때 · 사유를 고르고 누르면 오른쪽 '최근 기록'에 남아요</label>
     <div class="row">${CX_REASONS.map(r=>`<button class="chip${(UI.draft['cx-'+s.id]||'')===r?' on':''}" data-act="draftSet" data-key="cx-${s.id}" data-v="${r}">${r}</button>`).join('')}</div>
     <div class="row" style="margin-top:6px"><span class="small muted">회차에서</span>${[['0','차감 안 함'],['1','차감']].map(([v,l])=>`<button class="chip${(UI.draft['cxd-'+s.id]||'0')===v?' on':''}" data-act="draftSet" data-key="cxd-${s.id}" data-v="${v}">${l}</button>`).join('')}<span class="tiny muted">차감이면 회차에 1회 들어가요</span></div>
     <div class="row" style="margin-top:4px">${btn('취소','markSession',{sid:s.id,v:'cancelled'},'danger')}${btn('안 옴','markSession',{sid:s.id,v:'no_show'},'danger')}</div></div></div>
   <div class="row" style="justify-content:flex-end;margin-top:12px">${btn('닫기','closeModal')}</div>`};
MOD.exMenu=o=>{const s=SES(o.sid),x=s.exercises.find(e=>e.uid===o.uid);const d={sid:s.id,uid:x.uid};
  return `<h3>${esc(EX(x.exId).name)}</h3><div class="col" style="gap:8px">
   ${btn('바꾸기','modal',{type:'swap',...d})}${btn('빼기','removeNow',d)}${btn('순서 위로','moveEx',{...d,dir:-1})}${btn('순서 아래로','moveEx',{...d,dir:1})}${btn('역할 바꾸기 (지금 '+x.role+')','modal',{type:'role',...d})}${btn('숫자 근거 보기','basis',d)}</div>
   <div class="row" style="justify-content:flex-end;margin-top:12px">${btn('닫기','closeModal')}</div>`};
MOD.role=o=>{const s=SES(o.sid),x=s.exercises.find(e=>e.uid===o.uid);
  return `<h3>${esc(EX(x.exId).name)} 역할</h3><div class="row">${chips(pairs(ROLES),x.role,'pickRole',{sid:s.id,uid:x.uid})}</div><div class="tiny muted" style="margin-top:8px">${x.edited?'직접 고친 숫자는 그대로 두고 역할만 바꿔요.':'바꾸면 그 역할 기준으로 숫자를 다시 채워요.'}</div><div class="row" style="justify-content:flex-end;margin-top:12px">${btn('닫기','closeModal')}</div>`};
MOD.exList=o=>{const s=SES(o.sid);const cur=UI.cur[s.id];
  const rows=s.exercises.map((e,i)=>{const dn=e.sets.filter(st=>st.done).length;const off=e.status==='removed'||e.status==='swapped';
    return `<div class="li${off?'':' click'}${e.uid===cur?' cur':''}"${off?'':` data-act="pickEx" data-sid="${s.id}" data-uid="${e.uid}"`}><div style="flex:1"><span class="${e.status==='removed'?'st-removed':e.status==='swapped'?'st-swapped':dn&&dn>=e.sets.length?'st-done':''}">${esc(EX(e.exId).name)}</span> <span class="tiny muted">${e.status==='removed'?'뺌 · '+esc(e.reason||'이유 없음'):e.status==='swapped'?'바꿈':`${dn}/${e.sets.length}세트`}${e.origin==='swap'?' · 바꿔 넣음':e.origin==='added'?' · 새로 넣음':''}</span></div>${e.status==='removed'?btn('되살리기','restoreEx',{sid:s.id,uid:e.uid},'small ghost'):''}</div>`}).join('');
  return `<h3>오늘 종목</h3><div class="list">${rows}</div><div class="row" style="justify-content:space-between;margin-top:12px">${btn('+ 종목 넣기','modal',{type:'addEx',sid:s.id},'small')}${btn('닫기','closeModal')}</div>`};
