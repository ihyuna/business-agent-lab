/* 짐노트 웹앱 서비스 워커: 한 번 연 뒤에는 인터넷 없이도 열리게 한다.
   늘 네트워크를 먼저 쓰고(새 버전이 바로 보이게), 안 되면 저장해 둔 파일을 쓴다. 기록 자체는 localStorage에 있다. */
const C='jimnote-web-v2';
const FILES=['./','./index.html','./config.js','./manifest.webmanifest','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  if(new URL(r.url).origin!==location.origin) return;
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp))}return res})
    .catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('./index.html'):undefined))));
});
