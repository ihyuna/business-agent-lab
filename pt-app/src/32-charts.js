/* ---------- 변화 그래프와 근육 지도 (2026-11-04 이현아님 요청, D76) ---------- */
/* 종목 → 근육 짝은 일반적인 운동 지식으로 정한 예시값이다. 수첩 기록이 아니다. 1 = 주로 쓰는 근육, 0.5 = 같이 쓰는 근육. 트레이너 확인 필요 */
const MUSCLES={quads:'대퇴사두',hams:'햄스트링',glutes:'둔근',adductor:'내전근',calves:'종아리',chest:'가슴',lats:'광배',traps:'등 위·승모',lowback:'허리',frontdelt:'어깨 앞',sidedelt:'어깨 옆',reardelt:'어깨 뒤',biceps:'이두',triceps:'삼두',abs:'복근'};
const MG=(spec)=>Object.fromEntries(spec.split(' ').map(t=>{const [k,v]=t.split(':');return [k,v?+v:1]}));
const MUSCLE_MAP=(()=>{const o={};const put=(ids,spec)=>{for(const id of ids.split(' '))o[id]=MG(spec)};
  put('inner','adductor');put('outer hipabd trabd monster','glutes');put('inout','adductor glutes');put('calf','calves');
  put('scurl lycurl curlunk legcurl','hams');
  put('hacksq hackpress olhack goblet','quads glutes:0.5');put('legpress','quads glutes:0.5 adductor:0.5');put('lunge smithsplit','quads glutes');put('legext','quads');
  put('dbsdl rdl stiffdl','hams glutes:0.5 lowback:0.5');put('deadlift','glutes hams:0.5 lowback quads:0.5 traps:0.5');put('backext','lowback glutes:0.5');
  put('incdb nitro bbinc panadec smithpu atlinc pushup incunk cablechest smithinc dbchest incbench superinc kneepu nautchest bench incmach dbinckg atominc','chest frontdelt:0.5 triceps:0.5');
  put('pecdeck','chest');put('dips','chest triceps');
  put('sdbsp dbsp ohp panasp dbstsp panapress pendersp arnold gym80sp seatohp seatbbsp','frontdelt sidedelt:0.5 triceps:0.5');
  put('machlat dblat onearmlat','sidedelt');put('frontraise','frontdelt');put('yraise','sidedelt:0.5 traps');put('traise','reardelt traps:0.5');
  put('rearfly revpec cabrev','reardelt traps:0.5');put('extrot','reardelt');put('dbupright upright','sidedelt traps');
  put('pushdown lyingtri','triceps');put('bicurl hammer','biceps');
  put('cybrow bbrow truet multirow megat lowrow trowunk trrow highrow cstbar dyrow primerow karrow','lats traps biceps:0.5 reardelt:0.5');
  put('shrug','traps');put('panalat latpd seoullat panasibl asspull panacirc onearmcable','lats biceps:0.5');put('pullover armpd','lats');
  put('crunch smithplank serratus','abs');
  return o})();
/* 세트 수: 워밍업 빼고 숫자가 있는 세트. 숫자 없이 글로만 남은 종목은 1세트로 센다 */
function exSetCount(x){if(x.status!=='done')return 0;const n=x.sets.filter(st=>st.kind!=='warmup'&&(st.done||st.aw!=null||st.ar!=null)).length;return n||1}
function muscleLoad(sessions){const load={},by={},none=new Set();
  for(const s of sessions) for(const x of s.exercises){const n=exSetCount(x);if(!n)continue;const mm=MUSCLE_MAP[x.exId];
    if(!mm){none.add(EX(x.exId).name);continue}
    for(const [k,w] of Object.entries(mm)){load[k]=(load[k]||0)+n*w;(by[k]=by[k]||{})[EX(x.exId).name]=((by[k]||{})[EX(x.exId).name]||0)+n}}
  return {load,by,none:[...none]}}
/* 사람 그림: 그림 영역(15-body.js) → 우리 근육 값. 어깨 옆은 앞·뒤 어깨에 반씩, 승모는 등 위에도 반 */
const REGION={CHEST:{chest:1},OBLIQUES:{abs:1},ABS:{abs:1},BICEPS:{biceps:1},TRICEPS:{triceps:1},FRONT_DELTOIDS:{frontdelt:1,sidedelt:.5},BACK_DELTOIDS:{reardelt:1,sidedelt:.5},
  ABDUCTORS:{adductor:1},QUADRICEPS:{quads:1},CALVES:{calves:1},LEFT_SOLEUS:{calves:1},RIGHT_SOLEUS:{calves:1},TRAPEZIUS:{traps:1},UPPER_BACK:{lats:1,traps:.5},
  LOWER_BACK:{lowback:1},GLUTEAL:{glutes:1},ABDUCTOR:{glutes:1},HAMSTRING:{hams:1}};
function muscleMapSVG(ml,W){
  const rv=r=>{const m=REGION[r];if(!m)return 0;let v=0;for(const [k,w] of Object.entries(m))v+=(ml.load[k]||0)*w;return v};
  const all=[...BODY_FRONT,...BODY_BACK].map(([r])=>rv(r));const max=Math.max(0,...all);
  const lvl=v=>!v||!max?0:Math.min(4,Math.ceil(v/max*4));
  const tip=r=>{const m=REGION[r];if(!m)return '';return Object.keys(m).map(k=>`${MUSCLES[k]} ${ml.load[k]?Math.round(ml.load[k]*10)/10+'세트':'안 씀'}${ml.by[k]?' ('+Object.entries(ml.by[k]).map(([n,c])=>`${n} ${c}`).join(', ')+')':''}`).join(' / ')};
  const draw=(data,ox)=>`<g transform="translate(${ox},0)">${data.map(([r,ps])=>{const l=REGION[r]?lvl(rv(r)):-1;const t=tip(r);
    return ps.map(pt=>`<polygon points="${pt}" class="${l<0?'mb':'mu'}" style="fill:var(${l<0?'--musbase':'--mus'+l})">${t?`<title>${esc(t)}</title>`:''}</polygon>`).join('')}).join('')}</g>`;
  const H=Math.round(W*212/210);
  return `<svg class="musmap" viewBox="0 0 210 212" width="${W}" height="${H}" role="img" aria-label="근육별로 쓴 세트 수">${draw(BODY_FRONT,0)}${draw(BODY_BACK,110)}
    <text x="50" y="210" text-anchor="middle" class="ml">앞</text><text x="160" y="210" text-anchor="middle" class="ml">뒤</text></svg>`}
function muscleBlock(sessions,W,label){const ml=muscleLoad(sessions);const top=Object.entries(ml.load).sort((a,b)=>b[1]-a[1]);
  const max=top.length?top[0][1]:0;
  if(!top.length)return `<div class="empty">${label||'기록'}에 근육으로 셀 종목이 없어요.</div>`;
  return `${muscleMapSVG(ml,W)}
   <div class="muslegend"><span>적게</span>${[1,2,3,4].map(l=>`<i style="background:var(--mus${l})"></i>`).join('')}<span>많이</span><span class="sp"></span><span>최대 ${Math.round(max*10)/10}세트</span></div>
   <div class="mustop">${top.slice(0,5).map(([k,v])=>`<span>${esc(MUSCLES[k])} <b class="num">${Math.round(v*10)/10}</b></span>`).join('')}</div>
   <div class="tiny faint">세트 수로 칠했어요(같이 쓰는 근육은 0.5세트). 기구와 근육의 짝은 일반 운동 지식으로 정한 예시라 트레이너 확인이 필요해요.${ml.none.length?` 근육을 정하지 않은 종목: ${esc(ml.none.join(', '))}`:''}</div>`}

/* 지난번과 비교: 종목마다 오늘(그 수업) 최고 세트 vs 그 종목을 한 바로 전 수업 최고 세트 */
function prevTop(m,s,exId){for(const p of prevDone(m,s.date)){if(p.id===s.id)continue;const x=p.exercises.find(e=>e.exId===exId&&e.status==='done');const t=x&&topSet(x);if(t)return {p,t}}return null}
function deltaRows(m,s){
  const rows=[];
  for(const x of s.exercises){if(x.status!=='done')continue;const t=topSet(x);if(!t)continue;const pv=prevTop(m,s,x.exId);
    if(!pv){rows.push({x,t,first:true,pct:0});continue}
    const a=pv.t;let pct,lab,kind;
    if(isNum(a.w)&&isNum(t.w)&&a.w!==t.w){pct=a.w?(t.w-a.w)/a.w*100:0;lab=`${fw(a.w,x.exId)} → ${fw(t.w,x.exId)}`;kind='w'}
    else if(isNum(a.r)&&isNum(t.r)&&a.r!==t.r){pct=a.r?(t.r-a.r)/a.r*100:0;lab=`${a.r}회 → ${t.r}회${isNum(t.w)?` (${fw(t.w,x.exId)})`:''}`;kind='r'}
    else{pct=0;lab=`${ftop(t,x.exId)} 그대로`;kind='='}
    rows.push({x,t,pv,pct,lab,kind})}
  return rows}
function deltaChart(m,s,o={}){
  const rows=deltaRows(m,s);if(!rows.length)return `<div class="empty">숫자가 있는 종목이 없어서 비교할 수 없어요.</div>`;
  const cap=Math.max(10,...rows.map(r=>Math.abs(r.pct)));const up=rows.filter(r=>r.pct>0).length,dn=rows.filter(r=>r.pct<0).length,eq=rows.filter(r=>!r.first&&r.pct===0).length;
  const line=r=>{const w=Math.round(Math.abs(r.pct)/cap*50);const cls=r.pct>0?'up':r.pct<0?'dn':'eq';
    return `<div class="dl"><span class="dn-name" title="${esc(EX(r.x.exId).name)}">${esc(EX(r.x.exId).name)}</span>
      <span class="dbar">${r.first?'<span class="dfirst">처음</span>':`<i class="${cls}" style="${r.pct>=0?`left:50%;width:${Math.max(w,r.pct?2:0)}%`:`right:50%;width:${w}%`}"></i>${r.pct===0?'<b class="deq"></b>':''}`}</span>
      <span class="dv ${cls}">${r.first?'새':`${r.pct>0?'+':''}${Math.round(r.pct)}%`}</span>
      <span class="dlab">${r.first?`이 종목 첫 기록 · ${esc(ftop(r.t,r.x.exId))}`:`${esc(r.lab)} <span class="faint">· ${md(r.pv.p.date)}</span>`}</span></div>`};
  return `<div class="dsum"><span class="up">오름 <b>${up}</b></span><span class="dn">내림 <b>${dn}</b></span><span>같음 <b>${eq}</b></span></div>
    <div class="dchart">${rows.map(line).join('')}</div>
    <div class="tiny faint" style="margin-top:4px">종목마다 최고 세트를 그 종목을 한 바로 전 수업과 비교해요. 무게가 같으면 횟수로 비교해요. 수첩 숫자 그대로이고, 오르고 내린 까닭은 판단하지 않아요.</div>`}

/* ---------- 회원별 무게 변화 추이 (D86, D87) ----------
   종목 하나를 골라 그날 가장 무거운 본세트(워밍업 세트 제외)를 찍는다.
   선 색(범례) = 그 세트 횟수 구간: 저반복 1~5 · 중반복 6~12 · 고반복 13 이상 (논문 기준 임시값, 설정 전).
   점 = 그날 그 종목의 역할 글자(워밍업·메인·보조, 역할마다 모양도 다름), 점 위 = 횟수. 순서 숫자는 넣지 않는다(D89).
   세트 수는 표에서 평균으로만. 기록 숫자는 그대로 쓰고 새로 만들지 않는다. */
const RT_BANDS=[['저반복','1~5회','var(--live)'],['중반복','6~12회','var(--accent)'],['고반복','13회 이상','var(--good)'],['횟수 없음','','var(--faint)']];
const RT_PER=[['1','1개월'],['3','3개월'],['6','6개월'],['all','전체']];
const RT_ROLEF=[['all','전체'],['워밍업','워밍업'],['메인','메인'],['보조','보조']];
const rtBand=r=>!r?'횟수 없음':r<=5?'저반복':r<=12?'중반복':'고반복';
const rtRole=r=>r==='워밍업'||r==='메인'||r==='보조'?r:'그 외';
function rtData(m){
  const by={};
  for(const s of completed(m.id)){const done=s.exercises.filter(e=>e.status==='done');
    done.forEach((x,i)=>{const t=topSet(x);if(!t)return;(by[x.exId]=by[x.exId]||[]).push({s,x,t,pos:i+1,of:done.length,b:rtBand(t.r),role:rtRole(x.role),sets:x.sets.filter(st=>st.kind!=='warmup').length})})}
  return by;
}
function rtMark(p,cx,cy,c){
  const lab=p.role==='그 외'?p.x.role.slice(0,2):p.role; const w=lab.length>2?40:32;
  if(p.role==='메인') return `<rect x="${cx-w/2}" y="${cy-9}" width="${w}" height="18" rx="9" fill="${c}" stroke="var(--panel)" stroke-width="2"/><text class="rt-pos" x="${cx}" y="${cy+3.8}" text-anchor="middle">${esc(lab)}</text>`;
  if(p.role==='워밍업') return `<rect x="${cx-w/2}" y="${cy-9}" width="${w}" height="18" rx="2" fill="var(--panel)" stroke="${c}" stroke-width="1.8" stroke-dasharray="3 2"/><text class="rt-pos hol" x="${cx}" y="${cy+3.8}" text-anchor="middle" style="fill:${c}">${esc(lab)}</text>`;
  return `<rect x="${cx-w/2}" y="${cy-9}" width="${w}" height="18" rx="9" fill="var(--panel)" stroke="${c}" stroke-width="2"/><text class="rt-pos hol" x="${cx}" y="${cy+3.8}" text-anchor="middle" style="fill:${c}">${esc(lab)}</text>`;
}
function roleTrend(m,W,H){
  const by=rtData(m);
  const exs=Object.keys(by).sort((a,b)=>by[b].length-by[a].length);
  if(!exs.length) return '<div class="empty">무게를 적은 기록이 없어요.</div>';
  let ex=UI.cur['rt-'+m.id]; if(!by[ex]) ex=exs[0];
  const per=UI.cur['rtp-'+m.id]||'all', rf=UI.cur['rtr-'+m.id]||'all'; const t=todayIso();
  const cut=per==='all'?null:(()=>{const d=pd(t);d.setMonth(d.getMonth()-Number(per));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();
  const inPer=by[ex].filter(p=>!cut||p.s.date>=cut);
  const pts=inPer.filter(p=>rf==='all'||p.role===rf);
  const rc=r=>inPer.filter(p=>p.role===r).length;
  const head=`<div class="rt-hd"><div class="row" style="gap:6px">${exs.slice(0,6).map(id=>`<button class="chip${id===ex?' on':''}" data-act="pickRt" data-mid="${m.id}" data-v="${id}">${esc(EX(id).name)} <span class="tiny">${by[id].length}</span></button>`).join(' ')}</div>
    <div class="row" style="gap:6px">${chips(RT_PER,per,'pickRtPer',{mid:m.id})}</div></div>
    <div class="rt-hd"><div class="row" style="gap:6px"><span class="tiny muted">역할</span>${RT_ROLEF.map(([v,l])=>`<button class="chip${rf===v?' on':''}" data-act="pickRtRole" data-mid="${m.id}" data-v="${v}">${l}${v==='all'?'':` <span class="tiny">${rc(v)}</span>`}</button>`).join(' ')}</div>
    <div class="rt-leg">${RT_BANDS.slice(0,3).map(([b,r,c])=>`<span><span class="rt-key" style="background:${c}"></span>${b} <span class="tiny muted">${r}</span></span>`).join('')}</div></div>`;
  if(!pts.length) return head+`<div class="empty">이 기간·역할에는 ${esc(EX(ex).name)} 기록이 없어요. 기간이나 역할을 넓혀 보세요.</div>`;
  const padL=40,padR=18,padT=24,padB=24;
  const xs=pts.map(p=>pd(p.s.date).getTime()),x0=Math.min(...xs),x1=Math.max(...xs);
  const ws=pts.map(p=>p.t.w),lo=Math.min(...ws),hi=Math.max(...ws),span=Math.max(hi-lo,hi*.2,4);
  const step=span>60?20:span>24?10:span>10?5:span>4?2:1;
  const y0=Math.max(0,Math.floor((lo-span*.15)/step)*step), y1=Math.ceil((hi+span*.2)/step)*step;
  const X=v=>x1===x0?padL+(W-padL-padR)/2:padL+10+(v-x0)/(x1-x0)*(W-padL-padR-20), Y=v=>padT+(1-(v-y0)/(y1-y0))*(H-padT-padB);
  let g='';for(let v=y0;v<=y1+1e-9;v+=step) g+=`<line class="axis" x1="${padL}" x2="${W-padR}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${padL-6}" y="${Y(v)+4}" text-anchor="end">${v}</text>`;
  const n=pts.length, every=Math.max(1,Math.ceil(n/(W/70)));
  const xl=pts.map((p,i)=>i%every&&i!==n-1?'':`<text x="${X(xs[i])}" y="${H-6}" text-anchor="middle">${md(p.s.date)}</text>`).join('');
  const col=b=>RT_BANDS.find(a=>a[0]===b)[2];
  const lines=RT_BANDS.map(([b,,c])=>{const q=pts.map((p,i)=>({p,i})).filter(o=>o.p.b===b);if(q.length<2)return '';
    return `<path d="${q.map((o,k)=>`${k?'L':'M'}${X(xs[o.i]).toFixed(1)},${Y(o.p.t.w).toFixed(1)}`).join(' ')}" fill="none" stroke="${c}" stroke-width="2"${b==='횟수 없음'?' stroke-dasharray="4 4"':''}/>`}).join('');
  const dots=pts.map((p,i)=>{const cx=X(xs[i]),cy=Y(p.t.w);
    return `<g class="rt-pt" data-act="go" data-to="detail" data-sid="${p.s.id}">${rtMark(p,cx,cy,col(p.b))}${p.t.r?`<text class="rt-r" x="${cx}" y="${cy-14}" text-anchor="middle">${p.t.r}회</text>`:''}<title>${mdw(p.s.date)} · ${p.b} · ${esc(p.x.role)} · ${esc(ftop(p.t,ex))} · ${p.sets}세트 (누르면 수업 상세)</title></g>`}).join('');
  const svg=`<svg class="chart rt" width="100%" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(EX(ex).name)} 반복 구간별 무게 변화">${g}${lines}${dots}${xl}</svg>`;
  const rows=RT_BANDS.map(([b,r,c])=>{const q=pts.filter(p=>p.b===b);
    if(!q.length) return b==='횟수 없음'?'':`<tr class="faint"><td><span class="rt-key" style="background:${c}"></span>${b} <span class="tiny">${r}</span></td><td colspan="4">이 기간 기록 없음</td></tr>`;
    const f=q[0],l=q[q.length-1];const avg=q.reduce((a,p)=>a+p.sets,0)/q.length;
    
    const rl={};q.forEach(p=>rl[p.x.role]=(rl[p.x.role]||0)+1);
    return `<tr><td><span class="rt-key" style="background:${c}"></span>${b} <span class="tiny muted">${r}</span></td><td class="num">${q.length}회</td><td class="num">${q.length>1?`${esc(fw(f.t.w,ex))} → <b>${esc(fw(l.t.w,ex))}</b>`:`<b>${esc(fw(l.t.w,ex))}</b>`}</td><td class="num">${(Math.round(avg*10)/10)}세트</td><td class="small">${Object.entries(rl).map(([k,v])=>`${esc(k)} ${v}`).join(' · ')}</td></tr>`}).join('');
  return head+svg+`<table class="rt-tb"><tr><th>반복 구간</th><th>기록</th><th>무게 (처음 → 최근)</th><th>평균 세트</th><th>역할</th></tr>${rows}</table>
    <div class="tiny muted" style="margin-top:4px">선 색 = 그 세트 횟수 구간(1~5 · 6~12 · 13 이상, 논문 기준 임시값) · 점 글자 = 그날 그 종목의 역할(메인 채움 · 보조 빈 칸 · 워밍업 점선 네모) · 점 위 = 횟수 · 점 = 그날 가장 무거운 본세트(워밍업 세트 빼고) · 점을 누르면 그날 수업 상세</div>`;
}
