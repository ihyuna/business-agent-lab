/* ---------- 디자인 B: 나머지 화면도 회원 진료기록부처럼 (2026-11-17 이현아님 요청, D94) ----------
   "회원별 화면 디자인 나쁘지 않은데 맞춰서 다른 페이지들도 고쳐줘".
   종이 서식 틀(제목 + 차트 No. + 이중 줄) 안에 넣고, 카드 제목은 왼쪽 라벨 칸(fsec)처럼 보이게 한다.
   읽기만 하는 화면(회원 명부, 수업 기록 대장, 수업 기록지)은 표로 다시 짠다. 버튼(data-act)은 디자인 A와 같다. */
const DOC_TITLES={members:'회원 명부',history:'수업 기록 대장',detail:'수업 기록지',search:'기록 조회',prep:'오늘 수업 계획',briefing:'오늘 수업 계획',plan:'오늘 수업 계획',
  live:'수업 기록지',start:'수업 기록지',templates:'루틴 틀 대장',memberEdit:'회원 정보 카드',settings:'설정'};
function docMember(r){try{if(r.mid)return M(r.mid);if(r.sid){const s=SES(r.sid);return s&&M(s.memberId)}}catch(e){}return null}
/* 화면 html에서 첫 '.scroll' 칸을 찾아 서식 틀로 감싼다 */
function docify(html,r){
  const i=html.indexOf('<div class="scroll');if(i<0)return html;
  const open=html.indexOf('>',i)+1;let depth=1,k=open;const re=/<div\b|<\/div>/g;re.lastIndex=open;let mm;
  while((mm=re.exec(html))){depth+=mm[0]==='</div>'?-1:1;if(!depth){k=mm.index;break}}
  if(depth)return html;
  const tag=html.slice(i,open).replace('class="scroll','class="scroll chartdoc gdoc r-'+r.name);
  const m=docMember(r);let title=DOC_TITLES[r.name];
  if((r.name==='live'||r.name==='start')&&r.sid){const s=SES(r.sid);if(s&&s.status==='planned')title='수업 전 확인'}
  const head=m?docHead(title,m):`<div class="f-title"><span class="f-tt">${title}</span><span class="sp"></span><span class="f-no">${todayIso()}</span></div>`;
  return html.slice(0,i)+tag+`<div class="f-paper">${head}`+html.slice(open,k)+'</div>'+html.slice(k)}

/* 회원 명부 */
function membersDoc(){
  const t=todayIso();
  const rows=S.members.map(m=>{const u=upcoming(m.id);const l=lastSession(m);const oc=openCautions(m).length;const g=m.goals.find(x=>!x.end);
    return `<tr class="click" data-act="go" data-to="member" data-mid="${m.id}"><td class="num nowrap">${chartNo(m)}</td><td><b>${esc(m.code)}</b></td>
      <td class="small">${g?esc(g.text):'<span class="faint">—</span>'}</td><td class="nowrap">${u?`${mdw(u.date)} ${pill(splitName(u))}`:'<span class="faint">없음</span>'}</td>
      <td class="nowrap">${l?`${md(l.date)} <span class="muted small">(${daysBetween(l.date,t)}일 전)</span>`:'<span class="faint">없음</span>'}</td><td class="num c">${completed(m.id).length}회</td>
      <td class="c">${oc?`<b class="bad">${oc}</b>`:'<span class="faint">0</span>'}</td></tr>`}).join('');
  return `<div class="f-cap">Ⅰ. 회원 ${S.members.length}명 <span class="muted" style="font-weight:500">줄을 누르면 회원 기록부가 열려요</span></div>
    <table class="f-prog"><tr><th style="width:84px">차트 No.</th><th style="width:76px">회원</th><th>목표</th><th style="width:130px">다음 PT</th><th style="width:130px">지난 수업</th><th style="width:56px">누적</th><th style="width:44px">주의</th></tr>${rows}</table>
    ${WEBAPP?'':`<div class="f-cap">Ⅱ. 이 프로토타입</div>
    ${fsec('알림',`<ul class="small" style="margin:0 0 8px;padding-left:18px">
        <li>회원 기록은 트레이너 수첩의 실제 숫자이고, 이름은 성+00 코드로 바꿨어요(D61).</li>
        <li>역할, 여유 횟수, 쉬는 시간, 기구 눈금은 수첩에 없어서 ${EXAMPLE('예시')}나 논문 기준 임시값(D59)이에요.</li>
        <li>입력한 것은 이 브라우저에만 저장돼요.</li></ul>
      ${UI.confirmReset?`<div class="row"><span class="small">입력한 것을 모두 지우고 처음 상태로 되돌릴까요?</span>${btn('되돌리기','reset',null,'danger')}${btn('아니요','confirmReset',{v:0})}</div>`:btn('처음 상태로 되돌리기','confirmReset',{v:1},'small')}`)}`}`}

/* 수업 기록 대장 */
function historyDoc(m,list,f){
  const weekSum={};for(const s of list){const k=weekKey(s.date);weekSum[k]=weekSum[k]||{n:0,v:0};if(s.status==='completed'){weekSum[k].n++;weekSum[k].v+=sessionVolume(s)}}
  let rows='',wk=null;
  for(const s of list){const k=weekKey(s.date);if(k!==wk){wk=k;rows+=`<tr class="f-wk"><td colspan="5">${md(k)} 주 · 수업 ${weekSum[k].n}회 · 볼륨 ${weekSum[k].v.toLocaleString()}</td></tr>`}
    const v=sessionVolume(s);const ok=s.status==='completed';
    rows+=`<tr class="click" data-act="go" data-to="detail" data-sid="${s.id}"><td class="num nowrap">${s.date}</td><td>${pill(splitName(s))}</td>
      <td class="small">${s.exercises.filter(x=>x.status==='done'||!ok).map(x=>esc(EX(x.exId).name)).join(', ')||'—'}</td>
      <td class="c">${ok?'<span class="f-chk">✓</span>':`<span class="tag${s.status==='planned'||s.status==='in_progress'?' good':''}">${statusLabel[s.status]}</span>`}</td><td class="num" style="text-align:right">${v?v.toLocaleString():''}</td></tr>`}
  return idTable([['회원',`<b class="f-name">${esc(m.code)}</b>`],['누적',`${completed(m.id).length}회`],['보기',`<div class="row" style="gap:4px">${[['all','전체'],...m.templates.map(t=>[t.id,t.name])].map(([v,l])=>`<button class="chip${f===v?' on':''}" data-act="pickHist" data-mid="${m.id}" data-v="${v}">${esc(l)}</button>`).join(' ')}</div>`,2]],4)+
    `<div class="f-cap">Ⅰ. 수업 기록 <span class="muted" style="font-weight:500">줄을 누르면 수업 기록지가 열려요 · 볼륨 = 무게 × 횟수 합(워밍업 제외, 한쪽 무게는 두 배), 단위가 섞여 있어 참고용</span></div>
    <table class="f-prog"><tr><th style="width:96px">일자</th><th style="width:84px">분할</th><th>실시 종목</th><th style="width:96px">확인</th><th style="width:80px">볼륨</th></tr>${rows||'<tr><td colspan="5" class="empty">기록이 없어요.</td></tr>'}</table>`}

/* 수업 기록지 (상세) */
function detailDoc(s,m,rows,nt,parts){
  const n=sessNo(s);
  const id=idTable([['회원',`<b class="f-name">${esc(m.code)}</b>`],['수업일',`${s.date} ${esc(s.time||'')}`],['분할',esc(splitName(s))],['상태',`${statusLabel[s.status]}${s.seeded?' <span class="muted small">수첩에서 옮김</span>':''}`],
    ['회차',n?`${n} / ${pkgTotal(m)}`:'—'],['오늘 목표',s.goal?esc(s.goal):'<span class="faint">—</span>',3]],4);
  const subj=[s.cond?`<div><span class="muted small">컨디션</span> ${condLine(s.cond)}</div>`:'',s.memo?`<div><span class="muted small">수업 메모</span> ${esc(s.memo)}</div>`:'',
    (s.observations||[]).length?`<div><span class="muted small">관찰</span> ${s.observations.map(o=>lab(OBS,o.kind)+(o.dir==='up'?' 좋아짐':' 나빠짐')).join(', ')}</div>`:''].join('');
  return `${id}
    <div class="f-cap">Ⅰ. 컨디션 · 메모</div>${fsec('메모',subj||'<span class="faint">남긴 것이 없어요.</span>')}
    <div class="f-cap">Ⅱ. 실시 내용</div>
    <table class="f-prog"><tr><th style="width:30px">#</th><th style="width:170px">종목</th><th style="width:130px">계획</th><th style="width:150px">실제</th><th>메모 · 수첩 원문</th></tr>${rows}</table>
    ${Object.keys(parts).length?`<div class="tiny muted" style="margin-top:4px">부위별 본세트 수: ${Object.entries(parts).map(([p,c])=>`${p} ${c}`).join(', ')} · 볼륨 ${sessionVolume(s).toLocaleString()}</div>`:''}
    ${s.status==='completed'?`<div class="f-cap">Ⅲ. 기록 소견</div><div class="f-row3 two">${fsec('지난번<br><small>비교</small>',deltaChart(m,s))}${fsec('쓴 근육',muscleBlock([s],260,'이 수업'))}</div>`:''}
    ${nt.length?`<div class="f-cap">Ⅳ. 다음 계획</div>${fsec('다음<br><small>목표</small>',esc(nt.join(' / ')))}`:''}
    ${signLine('위 기록은 트레이너 수첩과 수업 기록을 옮긴 것이에요.',s.date)}`}
