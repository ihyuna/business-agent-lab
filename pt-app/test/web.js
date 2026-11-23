// 웹앱(web/index.html) 확인. node test/web.js  → 결과를 출력하고 test/ 에 w*.png 를 남긴다.
// 처음 시작 → 수첩 기록 → 다음 PT 잡기 → 수업 → 마무리 → 새로고침 유지 → 백업/지우기/불러오기 → 빈 노트
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const root=process.argv[2]||path.resolve(__dirname,'../web'), out=process.argv[3]||__dirname;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const srv=http.createServer((q,r)=>{let f=decodeURIComponent(q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';const p=path.join(root,f);if(!fs.existsSync(p)){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r)}).listen(8765);
(async()=>{
  const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1080,height:810},deviceScaleFactor:1,acceptDownloads:true});const p=await ctx.newPage();
  const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|net::/.test(m.text()))errs.push('console '+m.text())});
  await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());
  const U='http://localhost:8765/index.html';
  await p.goto(U);await p.waitForTimeout(400);
  const shot=n=>p.screenshot({path:out+'/'+n+'.png'});
  const ev=(f,a)=>p.evaluate(f,a);
  const log=(...a)=>console.log(...a);
  await shot('w0-landing');
  log('landing route',await ev(()=>__pt.UI.route.name),'stored',await ev(()=>!!localStorage.getItem('jimnote-v1')));
  await p.click('[data-act="startWith"][data-v="notebook"]');await p.waitForTimeout(300);
  log('after start',await ev(()=>({route:__pt.UI.route.name,today:__pt.S.today,members:__pt.S.members.map(m=>m.code).join(','),sessions:__pt.S.sessions.length,example:__pt.S.sessions.filter(s=>s.example).length,pastPlanned:__pt.S.sessions.filter(s=>s.status==='planned'&&s.date<__pt.S.today).length,completed:__pt.S.sessions.filter(s=>s.status==='completed').length,kb:Math.round(localStorage.getItem('jimnote-v1').length*2/1024)})));
  await shot('w1-today');
  // 다음 PT 잡기 (이00_3, 오늘 지금 시각)
  await ev(()=>{const m=__pt.S.members.find(m=>m.code==='이00_3');__pt.ACT.go({to:'member',mid:m.id})});await p.waitForTimeout(200);await shot('w2-member');
  await ev(()=>{const m=__pt.S.members.find(m=>m.code==='이00_3');__pt.ACT.modal({type:'schedule',mid:m.id})});await p.waitForTimeout(200);
  const now=new Date();const hh=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  await p.fill('[data-k="sc-t"]',hh).catch(async()=>{await p.fill('input[type=time]',hh)});
  await p.fill('input[type=date]',await ev(()=>__pt.S.today));
  await shot('w3-schedule');
  await p.click('[data-act="saveSchedule"]');await p.waitForTimeout(300);
  const sid=await ev(()=>{const m=__pt.S.members.find(m=>m.code==='이00_3');const s=__pt.S.sessions.find(s=>s.memberId===m.id&&s.status==='planned');return s&&s.id});
  log('scheduled',await ev(sid=>{const s=__pt.S.sessions.find(x=>x.id===sid);return s&&(s.date+' '+s.time+' '+s.templateId+' ex '+s.exercises.length)},sid));
  await ev(()=>__pt.ACT.home());await p.waitForTimeout(200);await shot('w4-today-planned');
  await ev(sid=>__pt.ACT.openSession({sid}),sid);await p.waitForTimeout(200);await shot('w5-prep');
  await ev(sid=>{__pt.ACT.go({to:'live',sid})},sid);await p.waitForTimeout(200);await shot('w6-start');
  await ev(sid=>__pt.ACT.startSession({sid}),sid);await p.waitForTimeout(200);
  // 첫 종목 두 세트 '그대로'
  for(let k=0;k<2;k++){const ok=await p.$('#app [data-act="same"]');if(ok){await ok.click();await p.waitForTimeout(150)}}
  log('live',await ev(sid=>{const s=__pt.S.sessions.find(x=>x.id===sid);return {status:s.status,startedAt:s.startedAt,clock:s.clock,done:s.exercises.flatMap(x=>x.sets.filter(t=>t.done).map(t=>t.doneMin+'/'+t.restMin))}},sid),'timebar',await p.textContent('#app .timebar').catch(()=>'-'));
  await shot('w7-live');
  await ev(sid=>__pt.ACT.go({to:'summary',sid}),sid);await p.waitForTimeout(200);await shot('w8-summary');
  const fin=await p.$('#app [data-act="finish"]');if(fin){await fin.click();await p.waitForTimeout(300)}
  log('finished',await ev(sid=>__pt.S.sessions.find(x=>x.id===sid).status,sid));
  // 새로고침
  await p.reload();await p.waitForTimeout(500);
  log('after reload',await ev(sid=>({route:__pt.UI.route.name,status:__pt.S.sessions.find(x=>x.id===sid)?.status,n:__pt.S.sessions.length}),sid));
  // 설정 · 백업
  await ev(()=>__pt.ACT.go({to:'settings'}));await p.waitForTimeout(200);await shot('w9-settings');
  const [dl]=await Promise.all([p.waitForEvent('download'),p.click('[data-act="exportData"]')]);const bf=out+'/backup.json';await dl.saveAs(bf);
  const n0=await ev(()=>__pt.S.sessions.length);
  log('backup',dl.suggestedFilename(),Math.round(fs.statSync(bf).size/1024)+'KB');
  await p.click('[data-act="confirmReset"]');await p.click('[data-act="reset"]');await p.waitForTimeout(300);
  log('wiped',await ev(()=>({route:__pt.UI.route.name,stored:!!localStorage.getItem('jimnote-v1'),members:__pt.S.members.length})));
  await p.reload();await p.waitForTimeout(400);log('wiped+reload route',await ev(()=>__pt.UI.route.name));
  await p.setInputFiles('#app input[type=file]',bf);await p.waitForTimeout(500);
  log('imported',await ev(()=>({route:__pt.UI.route.name,n:__pt.S.sessions.length,members:__pt.S.members.length})),'expected',n0);
  // 빈 노트
  await ev(()=>{localStorage.clear()});await p.reload();await p.waitForTimeout(300);
  await p.click('[data-act="startWith"][data-v="empty"]');await p.waitForTimeout(300);await shot('w10-empty-today');
  await ev(()=>__pt.ACT.tab({v:'members'}));await p.waitForTimeout(200);await shot('w11-empty-members');
  await ev(()=>__pt.ACT.newMember());await p.waitForTimeout(200);await shot('w12-newmember');
  log('empty',await ev(()=>({route:__pt.UI.route.name,members:__pt.S.members.length,sessions:__pt.S.sessions.length})));
  // 세로
  await p.setViewportSize({width:810,height:1080});await ev(()=>__pt.ACT.home());await p.waitForTimeout(300);await shot('w13-portrait');
  log('sw',await ev(async()=>{const r=await navigator.serviceWorker.getRegistration();return !!r}));
  log('ERRORS',errs.length?errs:'none');
  await b.close();srv.close();
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
