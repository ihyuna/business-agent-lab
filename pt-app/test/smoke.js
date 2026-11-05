const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const dir=path.resolve(__dirname,'..');
const body=fs.readFileSync(dir+'/index.html','utf8');
fs.writeFileSync(__dirname+'/page.html','<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
(async()=>{
  const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
  const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|net::/.test(m.text()))errs.push('console '+m.text())});
  await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  await p.goto('file://'+__dirname+'/page.html');
  const shot=async n=>{await p.screenshot({path:__dirname+'/'+n+'.png'})};
  await shot('s0-today');
  // 장면을 차례로 대신 하며 각 장면 끝 상태를 확인
  for(let k=0;k<5;k++){
    const r=await p.evaluate(k=>{const {G,SCENES,gotoScene}=__pt;if(k!==G.scene)gotoScene(k);const sc=SCENES[k];const res=[];
      for(let i=G.step;i<sc.steps.length;i++){let at='';try{at=sc.steps[i].at()}catch(e){at='ERR '+e.message}
        const found=at?!!document.querySelector('#app '+at.split(',')[0]):null;
        res.push({i,at,found});document.querySelector('#guide [data-g="auto"]')?.click();}
      return {scene:G.scene,step:G.step,len:sc.steps.length,route:__pt.UI.route.name,res}},k);
    console.log('scene',k+1,JSON.stringify({step:r.step,len:r.len,route:r.route}));
    for(const x of r.res) if(!x.found) console.log('   step',x.i+1,'target not found:',x.at);
    await shot('s'+(k+1)+'-end');
  }
  const st=await p.evaluate(()=>{const S=__pt.S;const ss=S.sessions.filter(s=>s.memberId==='m3'&&s.date>='2026-10-07').sort((a,b)=>a.date<b.date?-1:1);
    return ss.map(s=>s.date+' '+s.templateId+' '+s.status+' | '+s.exercises.map(x=>x.exId+':'+x.status+(x.reason?'('+x.reason+')':'')+' '+x.sets.map(t=>(t.kind==='warmup'?'W':'')+(t.done?t.aw+'x'+t.ar:'['+t.pw+'x'+t.pr+']')).join(',')).join(' ; '))});
  console.log(st.join('\n'));
  console.log('tpl',await p.evaluate(()=>JSON.stringify(__pt.S.members.find(m=>m.id==='m3').templates.map(t=>t.name+': '+t.items.map(i=>i.exId).join(',')+' v'+t.versions.length))));
  console.log('ERRORS',errs.length?errs:'none');
  await b.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
