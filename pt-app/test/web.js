// 웹앱(web/index.html) 확인. node test/web.js  → 결과를 출력하고 test/ 에 w*.png 를 남긴다.
// 1) 이 기기 계정: 소개 → 가입 → 처음 설정(수첩 예시) → 수업 하나 → 새로고침 유지 → 로그아웃 → 다른 트레이너 가입(빈 노트, 따로 보이는지) → 처음 계정 다시 로그인
// 2) 클라우드 계정: 가짜 Supabase 로 가입·저장·다른 기기 로그인·계정 분리 확인
const {chromium}=require('playwright');const http=require('http');const fs=require('fs');const path=require('path');
const root=process.argv[2]||path.resolve(__dirname,'../web'), out=process.argv[3]||__dirname;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
const srv=http.createServer((q,r)=>{let f=decodeURIComponent(q.url.split('?')[0]);if(f.endsWith('/'))f+='index.html';const p=path.join(root,f);if(!fs.existsSync(p)){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':types[path.extname(p)]||'application/octet-stream'});fs.createReadStream(p).pipe(r)}).listen(8765);
const U='http://localhost:8765/index.html';
let fails=0;const ok=(c,msg)=>{console.log((c?'  ok   ':'  FAIL ')+msg);if(!c)fails++};
async function page(ctx,errs){const p=await ctx.newPage();p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|net::|404/.test(m.text()))errs.push('console '+m.text())});await p.route(/fonts\.(googleapis|gstatic)/,r=>r.abort());return p}
const st=p=>p.evaluate(()=>({route:__pt.UI.route.name,members:__pt.S.members.length,sessions:__pt.S.sessions.length,name:__pt.S.profile&&__pt.S.profile.name,fresh:!!__pt.S._fresh}));
async function signup(p,name,email,pw){if(await p.$('[data-act="goAuth"][data-v="signup"]'))await p.click('[data-act="goAuth"][data-v="signup"]');else await p.click('[data-act="authTab"][data-v="signup"]');await p.fill('[data-d="au-name"]',name);await p.fill('[data-d="au-email"]',email);await p.fill('[data-d="au-pw"]',pw);await p.click('[data-act="doAuth"]');await p.waitForTimeout(400)}
async function login(p,email,pw){if(await p.$('[data-act="goAuth"][data-v="login"]'))await p.click('[data-act="goAuth"][data-v="login"]');else await p.click('[data-act="authTab"][data-v="login"]');await p.fill('[data-d="au-email"]',email);await p.fill('[data-d="au-pw"]',pw);await p.click('[data-act="doAuth"]');await p.waitForTimeout(400)}
async function onboard(p,start,shotPrefix){if(shotPrefix)await p.screenshot({path:out+'/'+shotPrefix+'-ob1.png'});await p.click('[data-act="obNext"]');await p.waitForTimeout(150);if(shotPrefix)await p.screenshot({path:out+'/'+shotPrefix+'-ob2.png'});
  await p.click(`[data-act="obStart"][data-v="${start}"]`);await p.waitForTimeout(250);if(shotPrefix)await p.screenshot({path:out+'/'+shotPrefix+'-ob3.png'});await p.click('[data-act="obNext"]');await p.waitForTimeout(150);if(shotPrefix)await p.screenshot({path:out+'/'+shotPrefix+'-ob4.png'});await p.click('[data-act="obFinish"]');await p.waitForTimeout(250)}
async function logout(p){await p.evaluate(()=>__pt.ACT.logout());await p.waitForTimeout(400)}

(async()=>{
  const b=await chromium.launch();
  console.log('== 이 기기 계정');
  {const errs=[];const ctx=await b.newContext({viewport:{width:1080,height:810},acceptDownloads:true});const p=await page(ctx,errs);
   await p.goto(U);await p.waitForTimeout(400);await p.screenshot({path:out+'/w0-landing.png'});
   ok((await st(p)).route==='landing','첫 화면은 소개');
   await p.click('[data-act="goAuth"][data-v="signup"]');await p.screenshot({path:out+'/w1-signup.png'});await p.click('[data-act="goLanding"]');
   await signup(p,'윤 트레이너','a@test.kr','short');ok(/8자/.test(await p.textContent('#app .au-msg').catch(()=>'')),'짧은 비밀번호 막음');
   await p.fill('[data-d="au-pw"]','password-a');await p.click('[data-act="doAuth"]');await p.waitForTimeout(400);
   ok((await st(p)).route==='onboard','가입 뒤 처음 설정');
   await onboard(p,'notebook','w2');
   let s=await st(p);ok(s.route==='today'&&s.members===6&&s.name==='윤 트레이너','수첩 예시로 시작: '+JSON.stringify(s));await p.screenshot({path:out+'/w3-today.png'});
   // 다음 PT 잡고 수업 한 세트
   const sid=await p.evaluate(()=>{const m=__pt.S.members.find(m=>m.code==='이00_3');__pt.ACT.modal({type:'schedule',mid:m.id});return m.id});
   await p.fill('input[type=date]',await p.evaluate(()=>__pt.S.today));await p.fill('input[type=time]','18:00');await p.click('[data-act="saveSchedule"]');await p.waitForTimeout(200);
   const ses=await p.evaluate(()=>__pt.S.sessions.find(s=>s.status==='planned').id);
   await p.evaluate(sid=>{__pt.ACT.startSession({sid})},ses);await p.waitForTimeout(200);await p.click('#app [data-act="same"]');await p.waitForTimeout(150);await p.screenshot({path:out+'/w4-live.png'});
   ok(await p.evaluate(sid=>__pt.S.sessions.find(s=>s.id===sid).exercises.some(x=>x.sets.some(t=>t.done)),ses),'세트 기록');
   await p.reload();await p.waitForTimeout(600);s=await st(p);ok(s.route==='today'&&s.members===6,'새로고침해도 로그인·기록 유지');
   await p.evaluate(()=>__pt.ACT.go({to:'settings'}));await p.waitForTimeout(200);await p.screenshot({path:out+'/w5-settings.png'});
   await logout(p);ok((await st(p)).route==='landing'&&(await st(p)).members===0,'로그아웃하면 소개 화면, 기록 안 보임');
   await signup(p,'김 트레이너','b@test.kr','password-b');
   await onboard(p,'empty');s=await st(p);ok(s.members===0&&s.name==='김 트레이너','두 번째 트레이너는 빈 노트: '+JSON.stringify(s));
   await p.evaluate(()=>__pt.ACT.newMember());await p.waitForTimeout(200);
   await logout(p);await signup(p,'x','a@test.kr','password-zz');ok(/이미 있는/.test(await p.textContent('#app .au-msg').catch(()=>'')),'같은 이메일 가입 막음');
   await login(p,'a@test.kr','wrong-pass');ok(/맞지 않아요/.test(await p.textContent('#app .au-msg').catch(()=>'')),'틀린 비밀번호 막음');
   await p.fill('[data-d="au-pw"]','password-a');await p.click('[data-act="doAuth"]');await p.waitForTimeout(400);
   s=await st(p);ok(s.members===6&&s.name==='윤 트레이너'&&s.route==='today','처음 계정 다시 로그인하면 내 기록: '+JSON.stringify(s));
   const [dl]=await Promise.all([p.waitForEvent('download'),p.evaluate(()=>__pt.ACT.exportData())]);ok(/jimnote-backup/.test(dl.suggestedFilename()),'백업 내려받기');
   await p.setViewportSize({width:810,height:1080});await logout(p);await p.waitForTimeout(300);await p.screenshot({path:out+'/w6-landing-port.png'});
   ok(errs.length===0,'오류 없음 '+errs.join(' | '));await ctx.close()}

  console.log('== 클라우드 계정 (가짜 Supabase)');
  {const errs=[];const DB={users:{},rows:{}};
   const fake=`(()=>{const DB=window.__DB;let cur=JSON.parse(localStorage.getItem('fake-sess')||'null');
     const auth={async getSession(){return {data:{session:cur?{user:cur}:null}}},onAuthStateChange(){},
       async signUp({email,password}){if(DB.users[email])return {data:{},error:{message:'User already registered'}};const u={id:'uuid-'+Object.keys(DB.users).length,email};DB.users[email]={u,password};cur=u;localStorage.setItem('fake-sess',JSON.stringify(u));return {data:{user:u,session:{user:u}},error:null}},
       async signInWithPassword({email,password}){const r=DB.users[email];if(!r||r.password!==password)return {data:{},error:{message:'Invalid login credentials'}};cur=r.u;localStorage.setItem('fake-sess',JSON.stringify(cur));return {data:{user:cur},error:null}},
       async signOut(){cur=null;localStorage.removeItem('fake-sess');return {}}};
     const from=t=>({upsert:async row=>{if(!cur||row.user_id!==cur.id)return {error:{message:'RLS'}};DB.rows[row.user_id]=JSON.parse(JSON.stringify(row));window.__pushes=(window.__pushes||0)+1;return {error:null}},
       select(){const q={eq(k,v){q.v=v;return q},async maybeSingle(){if(!cur||q.v!==cur.id)return {data:null,error:null};return {data:DB.rows[q.v]||null,error:null}}};return q}});
     window.supabase={createClient:()=>({auth,from})};})();`;
   const mk=async()=>{const ctx=await b.newContext({viewport:{width:1080,height:810}});await ctx.route(/config\.js$/,r=>r.fulfill({contentType:'text/javascript',body:"window.JIMNOTE_CONFIG={supabaseUrl:'https://x.supabase.co',supabaseAnonKey:'anon'};"}));
     await ctx.exposeBinding('__dbGet',()=>DB);return ctx};
   const open=async ctx=>{const p=await page(ctx,errs);await p.addInitScript(()=>{});await p.goto(U);await p.evaluate(()=>{});return p};
   // 기기 1
   const c1=await mk();const p1=await page(c1,errs);await p1.addInitScript(`window.__DB=${JSON.stringify(DB)};`);
   await p1.route(/supabase-js/,r=>r.fulfill({contentType:'text/javascript',body:fake}));
   await p1.goto(U);await p1.waitForTimeout(500);
   await signup(p1,'윤 트레이너','a@test.kr','password-a');await onboard(p1,'notebook');await p1.waitForTimeout(2000);
   const db1=await p1.evaluate(()=>window.__DB);ok(Object.keys(db1.rows).length===1&&db1.rows['uuid-0'].data.members.length===6,'클라우드에 내 기록 저장');
   await p1.evaluate(()=>__pt.ACT.go({to:'settings'}));await p1.waitForTimeout(200);await p1.screenshot({path:out+'/w7-cloud-settings.png'});
   // 기기 2 (같은 DB, 다른 브라우저)
   const c2=await mk();const p2=await page(c2,errs);await p2.addInitScript(`window.__DB=${JSON.stringify(db1)};`);await p2.route(/supabase-js/,r=>r.fulfill({contentType:'text/javascript',body:fake}));
   await p2.goto(U);await p2.waitForTimeout(500);await login(p2,'a@test.kr','password-a');await p2.waitForTimeout(300);
   let s=await st(p2);ok(s.members===6&&s.route==='today'&&s.name==='윤 트레이너','다른 기기에서 로그인하면 내 기록: '+JSON.stringify(s));
   await logout(p2);await signup(p2,'김 트레이너','b@test.kr','password-b');s=await st(p2);ok(s.route==='onboard'&&s.members===0,'다른 트레이너는 빈 상태로 시작');
   await onboard(p2,'empty');await p2.waitForTimeout(2000);const db2=await p2.evaluate(()=>window.__DB);
   ok(db2.rows['uuid-1']&&db2.rows['uuid-1'].data.members.length===0&&db2.rows['uuid-0'].data.members.length===6,'계정마다 따로 저장');
   ok(errs.length===0,'오류 없음 '+errs.join(' | '));await c1.close();await c2.close()}
  await b.close();srv.close();console.log(fails?`FAILED ${fails}`:'ALL OK');process.exit(fails?1:0);
})().catch(e=>{console.error('FAIL',e);process.exit(1)});
