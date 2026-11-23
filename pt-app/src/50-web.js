/* ---------- 웹앱 (web/index.html 에만 들어간다) ----------
   시연판(app.html)과 다른 점:
   - 오늘 날짜와 수업 중 시계가 실제 시각이다.
   - 시나리오 안내와 위쪽 도구 줄이 없다. 화면은 아이패드 9세대(1080×810) 기준 그대로 창에 맞춘다.
   - 처음 열면 '수첩 기록으로 시작' 또는 '빈 노트로 시작'을 고른다. 로그인은 없다(서버가 없다).
   - 기록은 이 기기 브라우저(localStorage 'jimnote-v1')에만 남는다. 설정에서 백업 파일로 내보내고 불러온다.
   - 예시 취소·안 옴은 넣지 않는다. 지난 날짜의 예정 수업(시연용으로 잡아 둔 것)은 수첩 기록이 아니라서 뺀다. */
const G={open:false,scene:0,step:0,busy:false,lastAt:''};
const SCENES=[];
function guideClick(){}
const APP_VER='웹앱 1.0';
const realToday=()=>iso(new Date());
function emptyState(){return {v:3,today:realToday(),exercises:clone(EXERCISES),members:[],sessions:[],settings:{restTimer:false,basis:'same',roles:clone(ROLE_DEFAULTS),exampleCx:false}}}
function webLoad(){
  try{const t=localStorage.getItem(KEY);if(t){const s=JSON.parse(t);if(s&&s.v===3)return s}}catch(e){}
  const s=emptyState(); s._fresh=true; return s;
}
function notebookState(){
  const st=buildSeed(); st.today=realToday(); seedOthers(st.today);
  st.sessions=st.sessions.filter(s=>!(s.status==='planned'&&s.date<st.today));
  return st;
}
function resetUI(){clearTimeout(askT);Object.assign(UI,{ask:null,stack:[],route:{name:'today'},modal:null,draft:{},cur:{},open:{},search:'',timer:null,confirmReset:false,scrolls:{},edit:null,flags:{}})}
function webWipe(){try{localStorage.removeItem(KEY)}catch(e){}S=emptyState();S._fresh=true;resetUI();UI.route={name:'landing'}}
function storedKB(){try{return Math.round((localStorage.getItem(KEY)||'').length*2/1024)}catch(e){return 0}}
function fileName(){return `jimnote-backup-${realToday()}.json`}

ACT.startWith=d=>{S=d.v==='notebook'?notebookState():emptyState();delete S._fresh;ensurePackages();resetUI();save();render({noSave:true});toast(d.v==='notebook'?`수첩 기록으로 시작했어요 · 회원 ${S.members.length}명`:'빈 노트로 시작했어요. 회원 탭에서 + 회원을 눌러요')};
ACT.enterWeb=()=>{resetUI();render({noSave:true})};
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
    try{const cur=localStorage.getItem(KEY);if(cur)localStorage.setItem(KEY+'-before-import',cur)}catch(e){}
    S=st;delete S._fresh;S.today=realToday();ensurePackages();resetUI();save();render({noSave:true});
    toast(`백업을 불러왔어요 · 회원 ${S.members.length}명, 수업 ${S.sessions.length}개`);
  };
  rd.readAsText(f);
};
ACT.undoImport=()=>{try{const t=localStorage.getItem(KEY+'-before-import');if(!t)return;S=JSON.parse(t);localStorage.removeItem(KEY+'-before-import');S.today=realToday();resetUI();save();UI.route={name:'settings'};render({noSave:true});toast('불러오기 전으로 되돌렸어요')}catch(e){toast('되돌리지 못했어요')}};

function webSettingsCards(){
  let before=false;try{before=!!localStorage.getItem(KEY+'-before-import')}catch(e){}
  const lb=S.settings.lastBackup;
  return `<div class="card"><h2>화면 디자인</h2><div class="row">${chips([['chart','기록부 (B)'],['emr','지금 디자인 (A)']],UI.look,'setLook')}</div></div>
   <div class="card"><h2>기록 보관</h2>
     <div class="small" style="margin-bottom:6px">기록은 <b>이 기기의 이 브라우저</b>에만 저장돼요(지금 ${storedKB()}KB). 서버로 보내지 않아요.</div>
     <div class="row">${btn('백업 파일 내려받기','exportData',null,'small primary')}<label class="btn small">백업 파일 불러오기<input type="file" accept="application/json,.json" data-on="importFile" style="display:none"></label>${before?btn('불러오기 전으로','undoImport',null,'small ghost'):''}</div>
     <div class="tiny muted" style="margin-top:6px">마지막 백업: ${lb?esc(lb.slice(0,10)):'아직 없음'}. 브라우저 기록을 지우거나 기기를 바꾸면 기록이 사라지니, 가끔 백업 파일을 받아 두세요. 아이패드 사파리는 '홈 화면에 추가'해서 쓰면 기록이 더 오래 안전하게 남아요.</div></div>
   <div class="card"><h2>모두 지우기</h2>${UI.confirmReset?`<div class="row"><span class="small">이 기기의 짐노트 기록을 모두 지울까요? 되돌릴 수 없어요.</span>${btn('지우기','reset',null,'danger')}${btn('아니요','confirmReset',{v:0})}</div>`:btn('모두 지우고 처음 화면으로','confirmReset',{v:1},'small')}</div>
   <div class="card"><h2>앱 정보</h2><div class="tiny muted">짐노트 ${APP_VER} · 아이패드 9세대 화면 기준 · 인터넷 없이도 열려요(한 번 연 뒤)</div></div>`;
}

V.landing=()=>{
  const has=!S._fresh;
  return `<div class="lg"><div class="lg-col">
    <div class="lg-logo">${kbIcon(44)}<span>짐노트</span></div>
    <div class="lg-sub">PT 트레이너 전용 회원 기록</div>
    ${has?`<button class="lg-b lg-go" data-act="enterWeb">들어가기</button>`:
     `<button class="lg-b lg-go" data-act="startWith" data-v="notebook">트레이너 수첩 기록으로 시작</button>
      <div class="lg-note" style="margin:6px 0 14px">회원 6명의 실제 수첩 기록(이름은 성+00 코드)이 들어 있어요.</div>
      <button class="lg-b lg-out" data-act="startWith" data-v="empty"><span>빈 노트로 시작</span></button>`}
    <label class="lg-b lg-out" style="margin-top:10px"><span>백업 파일 불러오기</span><input type="file" accept="application/json,.json" data-on="importFile" style="display:none"></label>
    <div class="lg-note">로그인 없이 쓰는 웹앱이에요. 기록은 이 기기의 브라우저에만 저장되고 어디로도 보내지 않아요.<br>아이패드에서는 사파리 공유 버튼 → '홈 화면에 추가'로 앱처럼 쓸 수 있어요.</div>
  </div><div class="lg-foot">짐노트 ${APP_VER} · 아이패드 9세대 기준</div></div>`;
};

function webBoot(){
  document.body.classList.add('full','web');
  let day=realToday(); S.today=day;
  UI.route={name:S._fresh?'landing':'today'};
  try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){try{navigator.serviceWorker.register('sw.js').catch(()=>{})}catch(e){}}
  /* 자정을 넘기거나 다음 날 다시 열면 오늘 날짜로 */
  const roll=()=>{const t=realToday();if(t!==day){day=t;S.today=t;if(!S._fresh)save();if(!UI.modal&&!UI.edit)render()}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)roll()});
  /* 수업 중 화면의 시계·남은 시간은 30초마다 새로 그린다 (입력 중이면 건너뜀) */
  setInterval(()=>{roll();const a=document.activeElement;if(UI.route.name==='live'&&!UI.modal&&!UI.edit&&!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)))render()},30000);
}
