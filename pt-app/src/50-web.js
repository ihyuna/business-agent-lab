/* ---------- 웹앱 (web/index.html 에만 들어간다) ----------
   시연판(app.html)과 다른 점:
   - 첫 화면은 소개(랜딩) → 로그인/가입 → 처음 설정(온보딩) → 앱.
   - 계정마다 기록이 따로다. 내 계정으로 들어가면 내 기록만, 다른 트레이너는 자기 기록만 본다.
     · web/config.js 에 Supabase 주소와 공개 키가 있으면 클라우드 계정(어느 기기에서든 로그인).
       기록은 notebooks 표(계정당 한 줄, 행 단위 보안으로 본인만 읽고 씀)에 통째로 저장하고, 기기에도 사본을 둔다.
     · 없으면 이 기기 안에서만 계정을 나눈다(비밀번호는 해시로만 저장).
   - 오늘 날짜와 수업 중 시계가 실제 시각이다. 시나리오 안내·도구 줄·예시 취소는 없다.
   - 수첩 기록 숫자는 바꾸지 않는다. 지난 날짜의 시연용 예정 수업은 넣지 않는다. */
const G={open:false,scene:0,step:0,busy:false,lastAt:''};
const SCENES=[];
function guideClick(){}
const APP_VER='웹앱 1.1';
const realToday=()=>iso(new Date());
const CFG=(typeof window!=='undefined'&&window.JIMNOTE_CONFIG)||{};
const CLOUD=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);
const AUTH={mode:CLOUD?'cloud':'local',user:null,sb:null,offline:false,sync:'saved',syncAt:null,err:''};
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v);return true}catch(e){return false}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const dataKey=uid=>'jimnote-data:'+uid;

function emptyState(){return {v:3,today:realToday(),exercises:clone(EXERCISES),members:[],sessions:[],settings:{restTimer:false,basis:'same',roles:clone(ROLE_DEFAULTS),exampleCx:false},profile:{}}}
function webLoad(){const s=emptyState();s._fresh=true;return s}
function notebookState(){
  const keep=S; const st=buildSeed(); st.today=realToday(); seedOthers(st.today);
  st.sessions=st.sessions.filter(s=>!(s.status==='planned'&&s.date<st.today));
  st.profile=keep&&keep.profile?keep.profile:{};
  return st;
}
function resetUI(route){clearTimeout(askT);Object.assign(UI,{ask:null,stack:[],route:{name:route||'today'},modal:null,draft:{},cur:{},open:{},search:'',timer:null,confirmReset:false,scrolls:{},edit:null,flags:{}})}
function storedKB(){return Math.round(JSON.stringify(S).length*2/1024)}
function fileName(){return `jimnote-backup-${realToday()}.json`}

/* ---------- 저장: 기기 사본은 바로, 클라우드는 1.5초 모아서 ---------- */
let pushT=null;
function webSave(){
  if(!S||S._fresh||!AUTH.user) return;
  LS.set(dataKey(AUTH.user.id),JSON.stringify(S));
  if(AUTH.mode==='cloud'){AUTH.sync='pending';LS.set(dataKey(AUTH.user.id)+'-dirty','1');clearTimeout(pushT);pushT=setTimeout(pushCloud,1500)}
}
async function pushCloud(){
  if(AUTH.mode!=='cloud'||!AUTH.user||!AUTH.sb||!S||S._fresh) return;
  if(!navigator.onLine){AUTH.sync='offline';syncBadge();return}
  AUTH.sync='saving';syncBadge();
  const at=new Date().toISOString();
  const {error}=await AUTH.sb.from('notebooks').upsert({user_id:AUTH.user.id,data:S,updated_at:at});
  if(error){AUTH.sync='error';AUTH.err=error.message;syncBadge();return}
  AUTH.sync='saved';AUTH.syncAt=at;LS.del(dataKey(AUTH.user.id)+'-dirty');syncBadge();
}
function syncBadge(){const el=document.querySelector('#app .sync-state');if(el)el.outerHTML=syncHTML()}
function syncHTML(){
  if(AUTH.mode!=='cloud') return `<span class="sync-state tiny muted">이 기기에 저장</span>`;
  const t={saved:'클라우드에 저장됨',pending:'저장 대기',saving:'저장 중…',offline:'인터넷 없음 · 연결되면 저장',error:'저장 못 함 · 다시 시도해요'}[AUTH.sync]||'';
  return `<span class="sync-state tiny ${AUTH.sync==='error'?'bad':'muted'}">${t}</span>`;
}
window.addEventListener('online',()=>{if(AUTH.mode==='cloud'&&LS.get(dataKey(AUTH.user?.id)+'-dirty'))pushCloud()});

/* ---------- 계정 ---------- */
async function sha(text){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
const localAccounts=()=>{try{return JSON.parse(LS.get('jimnote-accounts')||'{}')}catch(e){return {}}};
const normEmail=e=>String(e||'').trim().toLowerCase();
function loadSupabase(){
  return new Promise((ok,no)=>{if(window.supabase)return ok();const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';s.onload=()=>ok();s.onerror=()=>no(new Error('load'));document.head.appendChild(s)});
}
async function authInit(){
  if(AUTH.mode==='local'){const id=LS.get('jimnote-session');const acc=Object.values(localAccounts()).find(a=>a.id===id);if(acc)AUTH.user={id:acc.id,email:acc.email};return}
  try{await loadSupabase();AUTH.sb=window.supabase.createClient(CFG.supabaseUrl,CFG.supabaseAnonKey,{auth:{persistSession:true,storageKey:'jimnote-auth'}});
    AUTH.sb.auth.onAuthStateChange((ev)=>{if(ev==='PASSWORD_RECOVERY'){UI.route={name:'auth'};UI.cur.authTab='newpw';render({noSave:true})}});
    const {data}=await AUTH.sb.auth.getSession();const u=data&&data.session&&data.session.user;if(u)AUTH.user={id:u.id,email:u.email};
  }catch(e){ // 인터넷이 없어 로그인 서비스를 못 불러오면, 이 기기에서 마지막으로 쓴 계정 사본으로 연다
    AUTH.offline=true;const last=LS.get('jimnote-last-user');if(last){try{AUTH.user=JSON.parse(last)}catch(e){}}
  }
}
async function loadUserData(){
  const id=AUTH.user.id; let local=null;try{local=JSON.parse(LS.get(dataKey(id))||'null')}catch(e){}
  if(AUTH.mode==='cloud'&&AUTH.sb&&!AUTH.offline){
    const dirty=!!LS.get(dataKey(id)+'-dirty');
    const {data,error}=await AUTH.sb.from('notebooks').select('data,updated_at').eq('user_id',id).maybeSingle();
    if(!error){
      if(data&&data.data&&!dirty){AUTH.syncAt=data.updated_at;LS.set(dataKey(id),JSON.stringify(data.data));return data.data}
      if(dirty&&local){setTimeout(pushCloud,300);return local}
      if(data&&data.data) return data.data;
      return local; // 클라우드에 아직 없음 (새 계정)
    }
    AUTH.sync='error';AUTH.err=error.message;
  }
  return local;
}
async function enterAccount(){
  LS.set('jimnote-last-user',JSON.stringify(AUTH.user)); const nm=UI.draft.obName;
  const st=await loadUserData();
  if(st&&st.v===3){S=st;delete S._fresh;S.today=realToday();S.profile=S.profile||{};ensurePackages();resetUI(S.profile.onboarded?'today':'onboard')}
  else{S=emptyState();S._fresh=true;resetUI('onboard');UI.cur.ob=0;if(nm)UI.draft.obName=nm}
  render({noSave:true});
}
async function signUp(email,pw,name){
  email=normEmail(email);
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return '이메일을 확인해 주세요';
  if(String(pw).length<8) return '비밀번호는 8자 이상으로 해 주세요';
  if(AUTH.mode==='local'){
    const A=localAccounts(); if(A[email]) return '이미 있는 이메일이에요. 로그인해 주세요';
    const salt=uid('salt'); A[email]={id:uid('u'),email,salt,hash:await sha(salt+pw),created:new Date().toISOString()};
    LS.set('jimnote-accounts',JSON.stringify(A)); LS.set('jimnote-session',A[email].id); AUTH.user={id:A[email].id,email};
    UI.draft.obName=name||''; return null;
  }
  if(!AUTH.sb) return '인터넷에 연결된 뒤 다시 해 주세요';
  const {data,error}=await AUTH.sb.auth.signUp({email,password:pw,options:{data:{name:name||''},emailRedirectTo:location.origin+location.pathname}});
  if(error) return authErr(error);
  if(!data.session) return 'CHECK_MAIL';
  AUTH.user={id:data.user.id,email:data.user.email}; UI.draft.obName=name||''; return null;
}
async function signIn(email,pw){
  email=normEmail(email);
  if(AUTH.mode==='local'){
    const a=localAccounts()[email]; if(!a||a.hash!==await sha(a.salt+pw)) return '이메일이나 비밀번호가 맞지 않아요';
    LS.set('jimnote-session',a.id); AUTH.user={id:a.id,email}; return null;
  }
  if(!AUTH.sb) return '인터넷에 연결된 뒤 다시 해 주세요';
  const {data,error}=await AUTH.sb.auth.signInWithPassword({email,password:pw});
  if(error) return authErr(error);
  AUTH.user={id:data.user.id,email:data.user.email}; return null;
}
function authErr(e){const m=String(e.message||e);
  if(/Invalid login/i.test(m)) return '이메일이나 비밀번호가 맞지 않아요';
  if(/not confirmed/i.test(m)) return '메일함의 확인 링크를 먼저 눌러 주세요';
  if(/already registered|already exists/i.test(m)) return '이미 있는 이메일이에요. 로그인해 주세요';
  if(/rate limit/i.test(m)) return '잠깐 뒤에 다시 해 주세요';
  return '잘 안 됐어요: '+m}
async function signOut(){
  clearTimeout(pushT); if(AUTH.mode==='cloud'&&AUTH.user&&LS.get(dataKey(AUTH.user.id)+'-dirty')) await pushCloud();
  if(AUTH.mode==='local') LS.del('jimnote-session'); else if(AUTH.sb) await AUTH.sb.auth.signOut();
  LS.del('jimnote-last-user'); AUTH.user=null; S=emptyState(); S._fresh=true; resetUI('landing'); render({noSave:true});
}

/* ---------- 누르기 ---------- */
const dval=k=>{const el=document.querySelector(`#app [data-d="${k}"]`);return el?el.value:(UI.draft[k]||'')};
ACT.goLanding=()=>{resetUI('landing');render({noSave:true})};
ACT.goAuth=d=>{UI.route={name:'auth'};UI.cur.authTab=d.v||'login';UI.cur.authMsg='';render({noSave:true})};
ACT.authTab=d=>{UI.cur.authTab=d.v;UI.cur.authMsg='';render({noSave:true})};
ACT.doAuth=async d=>{
  if(UI.cur.authBusy) return; const email=dval('au-email'),pw=dval('au-pw'),name=dval('au-name');
  UI.cur.authBusy=true; UI.cur.authMsg=''; render({noSave:true}); let r;
  try{r=d.v==='signup'?await signUp(email,pw,name):await signIn(email,pw)}catch(e){r='잘 안 됐어요. 잠깐 뒤에 다시 해 주세요'}
  UI.cur.authBusy=false;
  if(r==='CHECK_MAIL'){UI.cur.authMsg=`ok:${normEmail(email)}로 확인 메일을 보냈어요. 메일의 링크를 누른 뒤 여기서 로그인해 주세요.`;UI.cur.authTab='login';render({noSave:true});return}
  if(r){UI.cur.authMsg=r;render({noSave:true});return}
  delete UI.draft['au-pw']; await enterAccount();
};
ACT.forgotPw=async()=>{
  if(AUTH.mode==='local'){UI.cur.authMsg='이 기기 계정은 비밀번호를 찾을 수 없어요. 새 계정을 만들어 주세요.';render({noSave:true});return}
  const email=normEmail(dval('au-email'));if(!email){UI.cur.authMsg='이메일을 먼저 적어 주세요';render({noSave:true});return}
  const {error}=await AUTH.sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  UI.cur.authMsg=error?authErr(error):`ok:${email}로 비밀번호 바꾸는 링크를 보냈어요.`;render({noSave:true});
};
ACT.setNewPw=async()=>{const pw=dval('au-pw');if(pw.length<8){UI.cur.authMsg='비밀번호는 8자 이상으로 해 주세요';render({noSave:true});return}
  const {data,error}=await AUTH.sb.auth.updateUser({password:pw});if(error){UI.cur.authMsg=authErr(error);render({noSave:true});return}
  AUTH.user={id:data.user.id,email:data.user.email};await enterAccount();toast('비밀번호를 바꿨어요')};
ACT.logout=()=>{signOut()};
ACT.obNext=()=>{
  const st=UI.cur.ob||0;
  if(st===0){const n=dval('ob-name').trim();if(!n){UI.cur.obMsg='이름을 적어 주세요';render({noSave:true});return}UI.draft.obName=n;UI.draft.obGym=dval('ob-gym').trim();UI.cur.obMsg=''}
  UI.cur.ob=st+1;render({noSave:true});
};
ACT.obBack=()=>{UI.cur.ob=Math.max(0,(UI.cur.ob||0)-1);render({noSave:true})};
ACT.obStart=d=>{
  const prof={name:UI.draft.obName||'',gym:UI.draft.obGym||'',onboarded:false,since:realToday()};
  if(d.v==='notebook') S=notebookState();
  else if(d.v==='device'){try{S=JSON.parse(LS.get('jimnote-v1'))}catch(e){S=emptyState()}}
  else if(d.v!=='keep'||S._fresh) S=emptyState();
  delete S._fresh; S.profile=Object.assign({},S.profile||{},prof); S.today=realToday(); ensurePackages(); save();
  UI.cur.obStart=d.v; UI.cur.ob=2; render({noSave:true});
};
ACT.obFinish=()=>{S.profile.onboarded=true;save();const v=UI.cur.obStart;resetUI(v==='empty'?'members':'today');render({noSave:true});
  toast(v==='empty'?`${S.profile.name} 트레이너님, 반가워요. + 회원으로 첫 회원을 넣어 보세요`:`${S.profile.name} 트레이너님, 반가워요`)};
ACT.replayOnboard=()=>{UI.route={name:'onboard'};UI.cur.ob=2;UI.cur.obStart='keep';UI.draft.obName=S.profile.name;render({noSave:true})};
ACT.exportData=()=>{
  S.settings.lastBackup=new Date().toISOString(); save();
  const blob=new Blob([JSON.stringify({app:'jimnote',ver:APP_VER,exported:S.settings.lastBackup,data:S},null,1)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=fileName();document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
  toast('백업 파일을 내려받았어요');
};
ON.importFile=(v,d,el)=>{
  const f=el.files&&el.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=()=>{
    let o=null;try{o=JSON.parse(rd.result)}catch(e){}
    const st=o&&o.app==='jimnote'?o.data:o;
    if(!st||st.v!==3||!Array.isArray(st.members)||!Array.isArray(st.sessions)||!st.exercises){toast('짐노트 백업 파일이 아니에요');return}
    if(!S._fresh) LS.set(dataKey(AUTH.user.id)+'-before-import',JSON.stringify(S));
    const prof=S.profile;S=st;delete S._fresh;S.today=realToday();S.profile=Object.assign({},st.profile||{},prof&&prof.name?prof:{});
    ensurePackages();save();
    if(UI.route.name==='onboard'){UI.cur.obStart='import';UI.cur.ob=2;render({noSave:true})}else{resetUI('today');render({noSave:true})}
    toast(`백업을 불러왔어요 · 회원 ${S.members.length}명, 수업 ${S.sessions.length}개`);
  };
  rd.readAsText(f);
};
ACT.undoImport=()=>{const k=dataKey(AUTH.user.id)+'-before-import';try{const t=LS.get(k);if(!t)return;S=JSON.parse(t);LS.del(k);S.today=realToday();save();resetUI('settings');render({noSave:true});toast('불러오기 전으로 되돌렸어요')}catch(e){toast('되돌리지 못했어요')}};
ACT.saveProfile=()=>{S.profile.name=dval('pf-name').trim()||S.profile.name;S.profile.gym=dval('pf-gym').trim();save();toast('저장했어요')};
ACT.syncNow=()=>{pushCloud()};
function webWipe(){const p=S.profile;S=emptyState();S.profile=Object.assign({},p,{onboarded:false});LS.del(dataKey(AUTH.user.id)+'-before-import');save();resetUI('onboard');UI.cur.ob=1;UI.draft.obName=p.name||'';UI.draft.obGym=p.gym||''}

function webSettingsCards(){
  const before=!!(AUTH.user&&LS.get(dataKey(AUTH.user.id)+'-before-import'));
  const lb=S.settings.lastBackup; const P=S.profile||{};
  return `<div class="card"><h2>내 계정</h2>
     <div class="small" style="margin-bottom:8px"><b>${esc(AUTH.user?AUTH.user.email:'')}</b> · ${AUTH.mode==='cloud'?'클라우드 계정 (어느 기기에서든 로그인)':'이 기기 계정'} ${syncHTML()}</div>
     <div class="row" style="flex-wrap:nowrap"><input class="ci" data-d="pf-name" value="${esc(P.name||'')}" placeholder="이름" style="width:140px"><input class="ci" data-d="pf-gym" value="${esc(P.gym||'')}" placeholder="센터 이름 (선택)" style="flex:1">${btn('저장','saveProfile',null,'small')}</div>
     <div class="row" style="margin-top:8px">${AUTH.mode==='cloud'&&AUTH.sync!=='saved'?btn('지금 저장','syncNow',null,'small'):''}${btn('처음 안내 다시 보기','replayOnboard',null,'small ghost')}${btn('로그아웃','logout',null,'small')}</div></div>
   <div class="card"><h2>화면 디자인</h2><div class="row">${chips([['chart','기록부 (B)'],['emr','지금 디자인 (A)']],UI.look,'setLook')}</div></div>
   <div class="card"><h2>기록 보관</h2>
     <div class="small" style="margin-bottom:6px">${AUTH.mode==='cloud'?'기록은 내 계정에만 저장돼요. 다른 트레이너는 볼 수 없어요.':'기록은 <b>이 기기의 이 브라우저</b>에만, 이 계정 몫으로 따로 저장돼요.'} (지금 ${storedKB()}KB)</div>
     <div class="row">${btn('백업 파일 내려받기','exportData',null,'small primary')}<label class="btn small">백업 파일 불러오기<input type="file" accept="application/json,.json" data-on="importFile" style="display:none"></label>${before?btn('불러오기 전으로','undoImport',null,'small ghost'):''}</div>
     <div class="tiny muted" style="margin-top:6px">마지막 백업: ${lb?esc(lb.slice(0,10)):'아직 없음'}.${AUTH.mode==='cloud'?'':' 브라우저 기록을 지우거나 기기를 바꾸면 기록이 사라지니, 가끔 백업 파일을 받아 두세요.'}</div></div>
   <div class="card"><h2>내 기록 모두 지우기</h2>${UI.confirmReset?`<div class="row"><span class="small">이 계정의 회원과 수업 기록을 모두 지울까요? 되돌릴 수 없어요.</span>${btn('지우기','reset',null,'danger')}${btn('아니요','confirmReset',{v:0})}</div>`:btn('모두 지우고 처음 설정으로','confirmReset',{v:1},'small')}</div>
   <div class="card"><h2>앱 정보</h2><div class="tiny muted">짐노트 ${APP_VER} · 아이패드 9세대 화면 기준 · 한 번 연 뒤에는 인터넷 없이도 열려요</div></div>`;
}

/* ---------- 화면: 소개 ---------- */
const LP_FEATS=[
  ['지난 수업이 한눈에','회원을 누르면 지난 같은 분할의 무게·횟수, 주의사항, 오늘 확인할 것이 한 장에 모여요. 수첩을 넘기지 않아도 돼요.'],
  ['오늘 숫자는 근거와 함께','지난 실제값으로 세트·무게·횟수를 미리 채우고, 왜 그 숫자인지 한 줄로 보여 줘요. 고르는 건 트레이너가 해요.'],
  ['수업 중에는 한 번 누르기','세트마다 \'그대로\' 한 번. 계획과 많이 다르면 남은 세트를 다시 맞춰 주고, 남은 시간도 알려 줘요.'],
  ['마무리가 다음 수업 준비','오늘 바뀐 것과 다음 같은 분할 수업의 초안이 바로 만들어져요. 회원에게 보여 줄 안내서도 같이요.']];
V.landing=()=>{
  const mock=`<div class="lp-mock" aria-hidden="true"><div class="lp-mh"><i></i><i></i><i></i><span>PT 경과기록지</span><em>화면 예시</em></div>
    <div class="lp-mrow h"><span>종목</span><span>지난번</span><span>오늘</span></div>
    <div class="lp-mrow"><span>핵스쿼트 · 메인</span><span>60 × 10</span><span class="up">62.5 × 8 ▲</span></div>
    <div class="lp-mrow"><span>시티드 레그컬 · 보조</span><span>50 × 12</span><span>50 × 12</span></div>
    <div class="lp-mrow"><span>레그 익스텐션 · 마무리</span><span>30 × 15</span><span class="cx">빼기 · 시간</span></div>
    <div class="lp-mfoot">근거: 지난 같은 분할 실제값 · 컨디션 보통</div></div>`;
  return `<div class="lp scroll" data-sk="lp">
    <header class="lp-top"><div class="lp-brand">${kbIcon(30)}<b>짐노트</b></div><span class="sp"></span>
      <button class="lp-link" data-act="goAuth" data-v="login">로그인</button><button class="lp-cta sm" data-act="goAuth" data-v="signup">무료로 시작하기</button></header>
    <section class="lp-hero"><div class="lp-ht">
      <div class="lp-eye">PT 트레이너 전용 회원 기록</div>
      <h1>지난 수업 기록이<br>다음 수업의 근거가 되게</h1>
      <p>수첩에 적던 무게·횟수·메모를 그대로 옮기고, 다음 수업 숫자를 근거와 함께 정하세요. 판단은 트레이너가, 기억과 계산은 짐노트가 해요.</p>
      <div class="lp-btns"><button class="lp-cta" data-act="goAuth" data-v="signup">무료로 시작하기</button><button class="lp-ghost" data-act="goAuth" data-v="login">이미 계정이 있어요</button></div>
    </div>${mock}</section>
    <section class="lp-feats">${LP_FEATS.map(([t,d],i)=>`<div class="lp-f"><span class="lp-n">${i+1}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}</section>
    <section class="lp-flow"><h2>수업 하나의 흐름</h2><div class="lp-steps">${[['오늘','오늘 수업과 회원별 확인할 것'],['수업 준비','지난 기록 → 오늘 숫자'],['수업','컨디션 · 세트 기록 · 다시 맞추기'],['마무리','바뀐 것 · 다음 PT 초안']].map(([a,b],i)=>`<div class="lp-st"><b>${a}</b><span>${b}</span></div>${i<3?'<i>›</i>':''}`).join('')}</div></section>
    <section class="lp-trust"><div><b>내 기록은 내 계정에만</b><span>트레이너마다 자기 계정으로 들어가고, 다른 트레이너의 회원 기록은 볼 수 없어요.</span></div>
      <div><b>아이패드에 맞춘 화면</b><span>아이패드 사파리에서 '홈 화면에 추가'하면 앱처럼 열려요. 한 번 연 뒤에는 인터넷이 없어도 돼요.</span></div>
      <div><b>언제든 백업</b><span>설정에서 내 기록 전체를 파일로 내려받을 수 있어요.</span></div></section>
    <footer class="lp-foot">짐노트 ${APP_VER} · 26-2 프로젝트학기제</footer></div>`;
};

/* ---------- 화면: 로그인 · 가입 ---------- */
V.auth=()=>{
  const tab=UI.cur.authTab||'login'; const msg=UI.cur.authMsg||''; const busy=UI.cur.authBusy;
  const m=msg?`<div class="au-msg${msg.startsWith('ok:')?' ok':''}" role="alert">${esc(msg.replace(/^ok:/,''))}</div>`:'';
  const inp=(k,label,type,ph,ac)=>`<label class="lg-f"><span>${label}</span><input data-d="${k}" type="${type}" placeholder="${ph}" autocomplete="${ac}" value="${type==='password'?'':esc(UI.draft[k]||'')}"></label>`;
  if(tab==='newpw') return `<div class="lg"><div class="lg-col"><div class="lg-logo">${kbIcon(40)}<span>짐노트</span></div><div class="lg-sub">새 비밀번호를 정해 주세요</div>${inp('au-pw','새 비밀번호','password','8자 이상','new-password')}${m}<button class="lg-b lg-go" data-act="setNewPw">비밀번호 바꾸기</button></div></div>`;
  return `<div class="lg"><button class="au-back" data-act="goLanding">‹ 짐노트 소개</button><div class="lg-col">
    <div class="lg-logo">${kbIcon(40)}<span>짐노트</span></div>
    <div class="lg-sub">${AUTH.mode==='cloud'?'어느 기기에서든 내 계정으로 들어가요':'이 기기 안에서 트레이너마다 계정을 나눠요'}</div>
    <div class="au-tabs"><button class="${tab==='login'?'on':''}" data-act="authTab" data-v="login">로그인</button><button class="${tab==='signup'?'on':''}" data-act="authTab" data-v="signup">계정 만들기</button></div>
    ${tab==='signup'?inp('au-name','이름','text','홍길동','name'):''}
    ${inp('au-email','이메일','email','trainer@example.com','email')}
    ${inp('au-pw','비밀번호','password',tab==='signup'?'8자 이상':'비밀번호',tab==='signup'?'new-password':'current-password')}
    ${m}
    <button class="lg-b lg-go" data-act="doAuth" data-v="${tab}"${busy?' disabled':''}>${busy?'잠깐만요…':tab==='signup'?'계정 만들기':'로그인'}</button>
    ${tab==='login'&&AUTH.mode==='cloud'?`<button class="linkbtn lg-guest" data-act="forgotPw">비밀번호를 잊었어요</button>`:''}
    <div class="lg-note">${AUTH.mode==='cloud'?'회원 기록은 이 계정에만 저장되고, 다른 트레이너는 볼 수 없어요.':'서버 없이 이 기기에만 저장돼요. 다른 기기에서는 이 계정으로 들어갈 수 없어요.'}${AUTH.offline?'<br><b>지금 인터넷이 없어 로그인할 수 없어요.</b>':''}</div>
  </div></div>`;
};
ACT.authKey=()=>{};

/* ---------- 화면: 처음 설정 (온보딩) ---------- */
const OB_TOUR=[
  ['오늘','첫 화면은 오늘 수업 표예요. 수업 블록을 누르면 그 회원의 수업 준비로 가요. 회원 탭에서 회원을 넣고, 회원 기록부에서 \'다음 PT 잡기\'로 수업을 잡아요.'],
  ['수업 준비','지난 같은 분할의 실제값으로 오늘 세트·무게·횟수를 채워 둬요. 숫자 옆 근거를 보고, 바꿀 숫자만 눌러서 고쳐요.'],
  ['수업','시작할 때 컨디션을 고르고, 세트를 끝낼 때마다 \'그대로\'를 눌러요. 다르게 했으면 그 자리에서 숫자를 고쳐요. 색 칠한 숫자는 앱이 바꾼 것이고, 누르면 까닭이 나와요.'],
  ['마무리','오늘 바뀐 것을 확인하고 다음 PT 계획을 정하면 저장돼요. 다음 수업 준비가 미리 채워져요.']];
V.onboard=()=>{
  const st=UI.cur.ob||0; const name=UI.draft.obName||'';
  const dots=`<div class="ob-dots">${[0,1,2,3].map(i=>`<i class="${i===st?'on':i<st?'done':''}"></i>`).join('')}</div>`;
  let body='';
  if(st===0) body=`<h2>반가워요! 어떻게 불러 드릴까요?</h2><p class="ob-p">회원에게 보여 주는 안내서와 마무리 서명 줄에 들어가요.</p>
    <label class="lg-f"><span>트레이너 이름</span><input data-d="ob-name" value="${esc(name||S.profile.name||'')}" placeholder="예: 윤 트레이너"></label>
    <label class="lg-f"><span>센터 이름 (선택)</span><input data-d="ob-gym" value="${esc(UI.draft.obGym||S.profile.gym||'')}" placeholder="예: ○○ 피트니스"></label>
    ${UI.cur.obMsg?`<div class="au-msg">${esc(UI.cur.obMsg)}</div>`:''}
    <div class="ob-nav"><span></span><button class="lg-b lg-go ob-next" data-act="obNext">다음</button></div>`;
  else if(st===1){const dev=!!LS.get('jimnote-v1');
    body=`<h2>기록을 어떻게 시작할까요?</h2><p class="ob-p">나중에 설정에서 백업 파일로 언제든 옮길 수 있어요.</p>
    <div class="ob-opts">
      <button class="ob-opt" data-act="obStart" data-v="empty"><b>빈 노트로 시작</b><span>회원을 한 명씩 넣어요. 처음 쓰는 트레이너는 이걸 골라요.</span></button>
      <button class="ob-opt" data-act="obStart" data-v="notebook"><b>예시 기록으로 둘러보기</b><span>실제 트레이너 수첩 기록(회원 6명, 이름은 성+00 코드)이 들어 있어요. 앱을 먼저 눌러 보고 싶을 때 좋아요.</span></button>
      <label class="ob-opt"><b>백업 파일 불러오기</b><span>짐노트에서 내려받은 백업 파일(.json)로 시작해요.</span><input type="file" accept="application/json,.json" data-on="importFile" style="display:none"></label>
      ${dev?`<button class="ob-opt" data-act="obStart" data-v="device"><b>이 기기에 있던 기록 가져오기</b><span>로그인 전 버전(웹앱 1.0)에서 이 기기에 쓰던 기록을 이 계정으로 옮겨요.</span></button>`:''}
    </div><div class="ob-nav"><button class="lg-b lg-out ob-prev" data-act="obBack">이전</button><span></span></div>`}
  else if(st===2) body=`<h2>짐노트는 이렇게 써요</h2><p class="ob-p">수업 하나가 네 화면으로 흘러가요. 판단은 트레이너가 하고, 앱은 기억하고 계산해요.</p>
    <div class="ob-tour">${OB_TOUR.map(([t,d],i)=>`<div class="ob-card"><span class="lp-n">${i+1}</span><b>${t}</b><p>${d}</p></div>`).join('')}</div>
    <div class="ob-nav"><span></span><button class="lg-b lg-go ob-next" data-act="obNext">다음</button></div>`;
  else body=`<h2>아이패드에서 앱처럼 쓰기</h2>
    <ol class="ob-steps"><li>사파리에서 이 페이지를 연 채로 위쪽 <b>공유</b> 버튼(□↑)을 눌러요.</li><li><b>홈 화면에 추가</b>를 누르고 '추가'를 눌러요.</li><li>홈 화면의 짐노트 아이콘으로 열면 주소창 없이 꽉 찬 화면으로 열려요.</li></ol>
    <p class="ob-p">${AUTH.mode==='cloud'?'기록은 내 계정에 저장돼서, 다른 기기에서도 같은 이메일로 로그인하면 이어서 쓸 수 있어요.':'이 버전은 기록을 이 기기에만 저장해요. 기기를 바꿀 땐 설정 → 백업 파일을 옮겨 주세요.'}</p>
    <div class="ob-nav"><span></span><button class="lg-b lg-go ob-next" data-act="obFinish">짐노트 시작하기</button></div>`;
  return `<div class="ob"><div class="ob-top"><div class="lp-brand">${kbIcon(26)}<b>짐노트</b></div>${dots}<span class="tiny muted">${esc(AUTH.user?AUTH.user.email:'')}</span></div><div class="ob-body">${body}</div></div>`;
};

/* ---------- 시작 ---------- */
function webBoot(){
  document.body.classList.add('full','web');
  let day=realToday(); S.today=day;
  UI.route={name:'landing'};
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){try{navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}}
  authInit().then(()=>{if(AUTH.user)return enterAccount();if(/type=recovery/.test(location.hash))return;render({noSave:true})}).catch(e=>{console.error(e);render({noSave:true})});
  const roll=()=>{const t=realToday();if(t!==day){day=t;S.today=t;if(!S._fresh)save();if(!UI.modal&&!UI.edit)render()}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)roll();else if(AUTH.mode==='cloud'&&AUTH.user&&LS.get(dataKey(AUTH.user.id)+'-dirty')){clearTimeout(pushT);pushCloud()}});
  setInterval(()=>{roll();const a=document.activeElement;if(UI.route.name==='live'&&!UI.modal&&!UI.edit&&!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)))render()},30000);
  document.getElementById('app').addEventListener('keydown',ev=>{if(ev.key==='Enter'&&ev.target.matches&&ev.target.matches('[data-d^="au-"]')){const b=document.querySelector('#app [data-act="doAuth"],#app [data-act="setNewPw"]');if(b)b.click()}});
}
