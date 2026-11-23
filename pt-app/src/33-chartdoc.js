/* ---------- 디자인 B '진료기록부' 화면 구성 (2026-11-17, D85) ----------
   이현아님: "색깔만 바뀐다고 진료기록부 같아 보이는 건 아니다. 화면 구성이 진료기록부 같아야지."
   회원 화면 = 회원 진료기록부(인적 사항 칸 · 특이사항 · 인체도 · 경과기록 표),
   마무리 = PT 경과기록지(S 주관 · O 실시 · A 평가 · P 계획, 서명),
   회원에게 보여 주기 = PT 결과 안내서(결과표 · 인체도 · 발행 칸).
   숫자는 모두 같은 기록에서 가져오고, 버튼(data-act)은 디자인 A와 같은 것을 쓴다. */
const chartNo=m=>'PT-'+String(S.members.indexOf(m)+1).padStart(4,'0');
function docHead(title,m,right){return `<div class="f-title"><span class="f-tt">${title}</span><span class="sp"></span>${right||''}<span class="f-no">차트 No. ${chartNo(m)}</span></div>`}
function idTable(cells,cols){/* cells: [라벨, 값, 칸 수?] */let h='',n=0,row='';
  for(const c of cells){const span=c[2]||1;row+=`<th>${c[0]}</th><td${span>1?` colspan="${span*2-1}"`:''}>${c[1]}</td>`;n+=span;if(n>=cols){h+=`<tr>${row}</tr>`;row='';n=0}}
  if(row)h+=`<tr>${row}</tr>`;return `<table class="f-id">${h}</table>`}
function fsec(label,body,cls){return `<div class="f-sec ${cls||''}"><div class="f-lb"><span>${label}</span></div><div class="f-bd">${body}</div></div>`}
const trainerName=()=>(S.profile&&S.profile.name)||'';
const signLine=(what,date)=>`<div class="f-sign"><span>${what}</span><span class="f-date">작성일 ${date}</span><span>담당 트레이너</span><i>${esc(trainerName())}</i><span class="faint">(서명)</span></div>`;
function topLine(x){const t=topSet({...x,sets:x.sets.filter(st=>st.done||st.aw!=null)});return t?ftop(t,x.exId):''}
function cmpTop(a,b){if(!a||!b)return null;if(isNum(a.w)&&isNum(b.w)&&a.w!==b.w)return a.w>b.w?1:-1;const ar=+a.r||0,br=+b.r||0;return ar===br?0:ar>br?1:-1}
const arrow=c=>c==null?'<span class="faint">—</span>':c>0?'<b class="up">▲ 오름</b>':c<0?'<b class="down">▼ 내림</b>':'<span class="muted">= 같음</span>';

/* 1. 회원 진료기록부 */
function memberDoc(o){
  const {m,u,done,last,d30,all,t,next,mt,notes}=o;
  const cx=msessions(m.id).filter(x=>x.status==='cancelled'&&x.date<=t).length, ns=msessions(m.id).filter(x=>x.status==='no_show'&&x.date<=t).length;
  const goals=m.goals.filter(g=>!g.end).map(g=>esc(g.text)).join(' / ')||'<span class="faint">없음</span>';
  const id=idTable([['회원',`<b class="f-name">${esc(m.code)}</b>`],['첫 기록',done[0]?done[0].date:'—'],['마지막 수업',last?`${last.date} <span class="muted">(${daysBetween(last.date,t)}일 전)</span>`:'—'],['다음 PT',u?`${mdw(u.date)} ${esc(splitName(u))}`:'<span class="faint">없음</span>'],
    ['누적',`${done.length}회`],['최근 30일',`${d30}회`],['회차',`${usedCount(m)} / ${pkgTotal(m)}${(m.packages||[]).some(p=>p.example)?' '+EXAMPLE('예시'):''}`],['취소 · 안 옴',`<span${cx?' class="bad"':''}>${cx}</span> · ${ns}`],
    ['목표',goals,3],['훈련 방향',blockText(curBlock(m))]],4);
  const prog=all.slice(0,14).map(s=>{const open=UI.cur['hx-'+m.id]===s.id;const ok=s.status==='completed';
    const items=ok?s.exercises.filter(x=>x.status==='done').map(x=>`${esc(EX(x.exId).name)}${topLine(x)?` <span class="num">${esc(topLine(x))}</span>`:''}`).join(', '):`<span class="muted">${statusLabel[s.status]}${s.example?' (예시)':''}</span>`;
    const memo=[s.memo,...s.exercises.filter(x=>x.note).slice(0,2).map(x=>EX(x.exId).name+': '+x.note)].filter(Boolean).map(esc).join(' / ');
    return `<tr class="click${open?' on':''}" data-act="histOpen" data-mid="${m.id}" data-sid="${s.id}"><td class="num nowrap">${s.date}</td><td>${pill(splitName(s))}</td><td class="small">${items||'—'}</td><td class="small muted">${memo||''}</td><td class="c">${ok?'<span class="f-chk">✓</span>':s.status==='cancelled'||s.status==='no_show'?'<span class="bad">✕</span>':'○'}</td></tr>`+
      (open?`<tr class="f-open"><td colspan="5">${visitCard(m,s,u)}</td></tr>`:'')}).join('')||'<tr><td colspan="5" class="empty">기록이 없어요.</td></tr>';
  const rg=UI.cur['mus-'+m.id]||'last';const ss=rg==='last'?(last?[last]:[]):done.filter(s=>daysBetween(s.date,t)>=0&&daysBetween(s.date,t)<30);
  return `<div class="scroll chartdoc" data-sk="main"><div class="f-paper">
    ${docHead('PT 회원 기록부',m,btn('+ 수업 추가','modal',{type:'addPkg',mid:m.id},'small'))}
    <div class="f-cap">Ⅰ. 인적 사항</div>${id}
    <div class="f-cap">Ⅱ. 특이사항 · 확인 · 목표</div>
    <div class="f-row3">${fsec('특이사항<br><small>(주의)</small>',cautionSec(m),'warnsec')}${fsec('다음 확인',checkSec(m))}${fsec('목표<br><small>방향</small>',goalSec(m))}</div>
    <div class="f-cap">Ⅲ. 신체 · 기록 소견</div>
    ${fsec('지난 PT<br><small>한눈에</small>',last?`<div class="small muted" style="margin-bottom:6px">${mdw(last.date)} · ${esc(splitName(last))} ${btn('수업 상세','go',{to:'detail',sid:last.id},'ghost small')}</div>${lastPtBrief(m,last,u)}`:'<div class="empty">없어요.</div>','lpsec')}
    ${fsec('무게 변화<br><small>추이 · 반복 구간별</small>',roleTrend(m,860,250),'rtsec')}
    ${fsec('인체도',`<div class="row" style="margin-bottom:4px">${chips([['last','지난 PT'],['d30','최근 30일']],rg,'musRange',{mid:m.id})}</div>${muscleBlock(ss,380,rg==='last'?'지난 PT':'최근 30일')}`)}
    ${fsec('기댓값<br><small>소견</small>',devHistory(m,6))}
    <div class="f-cap">Ⅳ. 다음 PT 계획</div>${fsec('다음 PT',next)}
    <div class="f-cap">Ⅴ. 경과 기록 <span class="muted" style="font-weight:500">최근 ${Math.min(all.length,14)}회 · 줄을 누르면 펼쳐져요</span><span class="sp"></span>${btn('전체 수업 기록','go',{to:'history',mid:m.id},'small ghost')}</div>
    <table class="f-prog"><tr><th style="width:92px">일자</th><th style="width:76px">분할</th><th>실시 내용 (종목 · 최고 세트)</th><th style="width:200px">소견 · 메모</th><th style="width:40px">확인</th></tr>${prog}</table>
    ${fsec('월별<br><small>수업 횟수</small>',monthHBars(m),'mhsec')}
    <div class="f-cap">Ⅵ. 생활 · 식단 · 개인 운동 메모</div>
    ${fsec('메모',`${notes.map(n=>`<div class="li small">${pill(NOTE_KINDS[n.kind],'gray')}<div style="flex:1">${esc(n.text)}</div>${btn('지우기','delNote',{mid:m.id,id:n.id},'small ghost')}</div>`).join('')||'<div class="empty">없어요.</div>'}<div class="row" style="margin-top:6px;flex-wrap:nowrap">${dSel('nKind-'+m.id,['general','lifestyle','diet','self_train','personality'].map(k=>[k,NOTE_KINDS[k]]),'general',{w:84})}${dIn('nText-'+m.id,'메모',{grow:1})}${btn('넣기','addNote',{mid:m.id},'small')}</div>`)}
    ${signLine('위 기록은 트레이너 수첩과 수업 기록을 옮긴 것이에요.',todayIso())}
  </div></div>`;
}

/* 2. PT 경과기록지 (마무리) */
function summaryDoc(o){
  const {s,m,done,ch,longs,prs,cands,candRows,tplQ}=o;
  const n=sessNo(s);
  const id=idTable([['회원',`<b class="f-name">${esc(m.code)}</b>`],['수업일',`${s.date} ${esc(s.time||'')}`],['분할',esc(splitName(s))],['회차',n?`${n} / ${pkgTotal(m)}`:'—']],4);
  const c=s.cond||{};
  const condT=`<table class="f-cond"><tr><th></th>${['좋음/없음','평소/약간','나쁨/뚜렷'].map(h=>`<th>${h}</th>`).join('')}</tr>${COND_ITEMS.map(([k,l])=>{const opts=k==='pain'?PAIN3:COND3;return `<tr><th>${l}</th>${opts.map(([v])=>`<td class="c">${c[k]===v?'<span class="f-chk">✓</span>':'<span class="f-box"></span>'}</td>`).join('')}</tr>`}).join('')}</table>${c.painWhere?`<div class="small">통증 부위: ${esc(c.painWhere)}</div>`:''}${s.memo?`<div class="small" style="margin-top:4px">회원 말 · 메모: ${esc(s.memo)}</div>`:''}`;
  const res=done.map(x=>{const ls=lastSame(m,s,x.exId);const a=topSet({...x,sets:x.sets.filter(st=>st.done)});const b=ls&&topSet(ls.y);
    return `<tr class="click" data-act="backToEx" data-sid="${s.id}" data-uid="${x.uid}"><td><b>${esc(EX(x.exId).name)}</b></td><td class="small">${x.role}</td><td class="small">${esc(fsets(x.sets.filter(st=>st.done),x.exId,'a'))}</td><td class="small">${ls?`${md(ls.p.date)} · ${esc(fsets(ls.y.sets,x.exId,'a'))}`:'<span class="faint">처음</span>'}</td><td class="c small">${arrow(cmpTop(a,b))}</td></tr>`}).join('')||'<tr><td colspan="5" class="empty">기록한 세트가 없어요.</td></tr>';
  const li=a=>a.map(t=>`<div class="small">· ${esc(t)}</div>`).join('');
  return `<div class="scroll chartdoc" data-sk="main"><div class="f-paper">
    ${docHead('PT 경과기록지',m,'<span class="muted small">줄을 누르면 고칠 수 있어요</span>')}
    ${id}
    <div class="f-soap">
      ${fsec('수업 전<br><small>컨디션</small>',`<div class="f-sub">수업 전 컨디션 · 회원 말</div>${condT}`)}
      ${fsec('오늘<br><small>한 것</small>',`<div class="f-sub">오늘 한 세트 (워밍업 포함) · 지난 같은 분할과 비교</div><table class="f-res"><tr><th>종목</th><th style="width:70px">역할</th><th>오늘</th><th>지난 같은 분할</th><th style="width:74px">최고 세트</th></tr>${res}</table>`)}
      ${fsec('돌아<br>보기',`<div class="f-two"><div><div class="f-sub">계획과 달라진 곳 ${ch.length+longs.length}</div>${li(ch)}${longs.map(t=>`<div class="small" style="color:var(--warn)">· ${esc(t)}</div>`).join('')||(ch.length?'':'<div class="empty">계획대로 했어요.</div>')}</div><div><div class="f-sub">넘은 개인 기록 ${prs.length}</div>${li(prs)||'<div class="empty">없어요.</div>'}</div></div><div class="f-sub" style="margin-top:10px">기댓값과 비교 (이 회원 추정 1RM 기준)</div>${devBlock(m,s)}<div class="tiny muted" style="margin-top:6px">앱은 오르내린 까닭을 판단하지 않아요. 까닭은 트레이너가 적어요.</div>`)}
      ${fsec('다음<br><small>계획</small>',`<div class="f-sub">주의사항으로 올릴 것 (올릴지는 트레이너가 정해요)</div>${cands.length?`<div class="list">${candRows}</div>`:'<div class="empty">없어요.</div>'}${tplQ?`<div style="margin-top:8px">${tplQ}</div>`:''}<div class="small muted" style="margin-top:6px">다음 숫자와 날짜는 아래 '다음 PT 계획'에서 정해요.</div>`)}
    </div>
    ${signLine('기록 확인',s.date)}
  </div></div>`;
}

/* 3. PT 결과 안내서 (회원에게 보여 주기): 메모·주의사항·트레이너 판단은 넣지 않는다 */
function showDoc(o){
  const {s,m,done,chart,pick}=o;const n=sessNo(s);
  const id=idTable([['회원님',`<b class="f-name">${esc(m.code)}</b>`],['수업일',s.date],['운동',esc(splitName(s))],['회차',n?`${n}회째`:'—']],4);
  const rows=done.map(x=>{const a=topSet({...x,sets:x.sets.filter(st=>st.done)});const ls=lastSame(m,s,x.exId);const b=ls&&topSet(ls.y);const p=prFor(m,s,{...x,sets:x.sets.filter(st=>st.done)});
    const sets=x.sets.filter(st=>st.done&&st.kind!=='warmup').length;
    return `<tr><td><b>${esc(EX(x.exId).name)}</b></td><td class="num big">${a?esc(ftop(a,x.exId)):'—'}</td><td class="c">${sets}세트</td><td class="small">${b?`${esc(ftop(b,x.exId))} <span class="faint">${md(ls.p.date)}</span>`:'<span class="faint">처음</span>'}</td><td class="c">${arrow(cmpTop(a,b))}</td><td class="c">${p&&!p.first?'<span class="f-stamp">최고 기록</span>':''}</td></tr>`}).join('')||'<tr><td colspan="6" class="empty">기록한 운동이 없어요.</td></tr>';
  return `<div class="scroll chartdoc show" data-sk="main"><div class="f-paper">
    ${docHead('PT 운동 결과 안내서',m)}
    ${id}
    <div class="f-cap">Ⅰ. 오늘의 결과 <span class="muted" style="font-weight:500">종목마다 가장 무거운 세트</span></div>
    <table class="f-res big"><tr><th>운동</th><th>오늘 결과</th><th style="width:70px">세트</th><th>지난번</th><th style="width:86px">변화</th><th style="width:90px">비고</th></tr>${rows}</table>
    <div class="f-row2">
      ${fsec('오늘 쓴<br>근육',muscleBlock([s],220,'오늘'))}
      ${fsec('무게<br>흐름',`<div class="row" style="margin-bottom:6px">${pick}</div>${chart}`)}
    </div>
    <div class="f-issue"><span>${esc(m.code)} 회원님, 오늘 수고했어요.</span><span class="sp"></span><span>날짜 ${s.date}</span><span>담당 트레이너</span><i>${esc(trainerName())}</i><span class="faint">(서명)</span></div>
  </div></div>`;
}
