const CACHE='cashual-v1.1.2';
const ASSETS=['./','index.html','styles.css?v=1.1.2','app.js?v=1.1.2','enhancements.js?v=1.1.2','features.js?v=1.1.2','ui-polish.js?v=1.1.2','navigation-data.js?v=1.1.2','finish-polish.js?v=1.1.2','expenses-polish.js?v=1.1.2','interaction-polish.js?v=1.1.2','allocator.js?v=1.1.2','transaction-updates.js?v=1.1.2','theme-custom.js?v=1.1.2','category-maker.js?v=1.1.2','settings-editor.js?v=1.1.2','wallet-polish.js?v=1.1.2','manifest.webmanifest?v=1.1.2','cashual-mark.svg?v=1.1.2','cashual-icon-180.png?v=1.1.2','cashual-icon-192.png?v=1.1.2','cashual-icon-512.png?v=1.1.2'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cashual-v')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).catch(()=>event.request.mode==='navigate'?caches.match('index.html'):Response.error())));
});
self.addEventListener('message',event=>{if(event.data?.type==='CASHUAL_SKIP_WAITING')self.skipWaiting()});
self.addEventListener('sync',event=>{
  if(event.tag!=='cashual-refresh')return;
  event.waitUntil(new Promise((resolve,reject)=>{
    const request=indexedDB.open('cashual-local-v1',1);
    request.onerror=()=>reject(request.error);
    request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('kv'))db.createObjectStore('kv');if(!db.objectStoreNames.contains('syncQueue'))db.createObjectStore('syncQueue',{autoIncrement:true})};
    request.onsuccess=()=>{const db=request.result,tx=db.transaction('syncQueue','readwrite');tx.objectStore('syncQueue').clear();tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)};
  }).then(()=>self.clients.matchAll({type:'window',includeUncontrolled:true})).then(clients=>Promise.all(clients.map(client=>client.postMessage({type:'CASHUAL_REFRESH'})))));
});
