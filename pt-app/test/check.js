const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.route(/fonts/,r=>r.abort());await p.goto('file://'+__dirname+'/page.html');
const auto=()=>p.evaluate(()=>document.querySelector('#guide [data-g="auto"]').click());
const info=()=>p.evaluate(()=>{const {G,S,UI}=__pt;const s=S.sessions.find(s=>s.memberId==='m3'&&s.date==='2026-10-07');
 return {sc:G.scene+1,st:G.step+1,route:UI.route.name,clock:s.clock,cond:document.querySelectorAll('#app .a-cond').length,live:document.querySelectorAll('#app .a-live').length,drop:[...document.querySelectorAll('#app .tag.bad')].map(e=>e.textContent),tight:!!document.querySelector('.timebar.tight'),bar:document.querySelector('.timebar')?.innerText.replace(/\s+/g,' '),act:document.querySelector('.actbar')?.innerText.replace(/\s+/g,' ').slice(0,80),ask:document.querySelector('.askbar')?.innerText.replace(/\s+/g,' ')}});
const shot=n=>p.screenshot({path:__dirname+'/c-'+n+'.png'});
await p.evaluate(()=>__pt.gotoScene(0));
for(let k=0;k<60;k++){const i=await info();console.log(JSON.stringify(i));
  const tag=i.sc+'-'+i.st; if(['2-2','3-4','4-2','4-3','5-4','5-7','5-10','5-13','5-14','6-1','6-2','7-5','7-11'].includes(tag)) await shot(tag);
  if(i.sc===7&&i.st>=12) break;
  const has=await p.evaluate(()=>!!document.querySelector('#guide [data-g="auto"]'));
  if(has) await auto(); else await p.evaluate(()=>document.querySelector('#guide [data-g="next"]').click());
  await p.waitForTimeout(50);}
console.log('ERR',errs);await b.close()})();
