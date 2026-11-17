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
