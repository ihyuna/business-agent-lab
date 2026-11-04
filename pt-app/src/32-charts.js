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
/* 사람 그림: 앞·뒤. 원래 그린 단순 도형이다 */
const BODY_BASE=x=>`<g transform="translate(${x},0)" class="bbase"><circle cx="60" cy="18" r="11"/><rect x="54" y="27" width="12" height="10" rx="3"/><rect x="36" y="38" width="48" height="86" rx="16"/>
 <rect x="22" y="44" width="16" height="74" rx="8"/><rect x="82" y="44" width="16" height="74" rx="8"/><rect x="40" y="118" width="19" height="118" rx="9"/><rect x="61" y="118" width="19" height="118" rx="9"/></g>`;
const FRONT_PARTS=[['traps','M50 38 L60 34 L70 38 L66 44 L54 44 Z'],['frontdelt','','ell',33,52,8,8],['frontdelt','','ell',87,52,8,8],
 ['sidedelt','','ell',26,56,4.5,9],['sidedelt','','ell',94,56,4.5,9],['chest','','ell',49,61,11,9],['chest','','ell',71,61,11,9],
 ['biceps','','ell',30,78,6,12],['biceps','','ell',90,78,6,12],['abs','','rect',52,73,16,40,5],['abs','','ell',42,96,4,13],['abs','','ell',78,96,4,13],
 ['quads','','ell',49,158,9,27],['quads','','ell',71,158,9,27],['adductor','','ell',57,146,3.5,16],['adductor','','ell',63,146,3.5,16],
 ['calves','','ell',49,210,6,17],['calves','','ell',71,210,6,17]];
const BACK_PARTS=[['traps','M60 34 L78 46 L68 60 L60 84 L52 60 L42 46 Z'],['reardelt','','ell',33,52,8,8],['reardelt','','ell',87,52,8,8],
 ['lats','M44 60 L56 66 L57 98 L46 92 L40 74 Z'],['lats','M76 60 L64 66 L63 98 L74 92 L80 74 Z'],['lowback','','rect',53,96,14,24,5],
 ['triceps','','ell',30,80,6,13],['triceps','','ell',90,80,6,13],['glutes','','ell',50,132,10,11],['glutes','','ell',70,132,10,11],
 ['hams','','ell',50,166,9,24],['hams','','ell',70,166,9,24],['calves','','ell',50,208,7.5,18],['calves','','ell',70,208,7.5,18]];
function partSVG(p,ox,fill,title){const [k,d,t,a,b,c,e,r]=p;const ttl=`<title>${esc(title)}</title>`;
  if(t==='ell')return `<ellipse cx="${a+ox}" cy="${b}" rx="${c}" ry="${e}" style="fill:${fill}" data-m="${k}">${ttl}</ellipse>`;
  if(t==='rect')return `<rect x="${a+ox}" y="${b}" width="${c}" height="${e}" rx="${r||0}" style="fill:${fill}" data-m="${k}">${ttl}</rect>`;
  return `<path d="${d}" transform="translate(${ox},0)" style="fill:${fill}" data-m="${k}">${ttl}</path>`}
function muscleMapSVG(ml,W){
  const max=Math.max(0,...Object.values(ml.load));const lvl=v=>!v||!max?0:Math.min(4,Math.ceil(v/max*4));
  const fill=k=>{const l=lvl(ml.load[k]);return l?`var(--mus${l})`:'var(--mus0)'};
  const tip=k=>`${MUSCLES[k]} ${ml.load[k]?Math.round(ml.load[k]*10)/10+'세트':'안 씀'}${ml.by[k]?' · '+Object.entries(ml.by[k]).map(([n,c])=>`${n} ${c}`).join(', '):''}`;
  const draw=(parts,ox)=>parts.map(p=>partSVG(p,ox,fill(p[0]),tip(p[0]))).join('');
  const H=Math.round(W*244/250);
  return `<svg class="musmap" viewBox="0 0 250 244" width="${W}" height="${H}" role="img" aria-label="근육별로 쓴 세트 수">${BODY_BASE(0)}${BODY_BASE(130)}${draw(FRONT_PARTS,0)}${draw(BACK_PARTS,130)}
    <text x="60" y="243" text-anchor="middle" class="ml">앞</text><text x="190" y="243" text-anchor="middle" class="ml">뒤</text></svg>`}
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
