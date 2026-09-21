const CACHE='cashual-v19';
const ASSETS=['./','index.html','styles.css?v=19','app.js','enhancements.js?v=19','manifest.webmanifest','cashuallogo.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).catch(()=>event.request.mode==='navigate'?caches.match('index.html'):Response.error())));
});
