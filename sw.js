const CACHE='cashual-v1.1.3';
const ASSETS=['./','index.html','styles.css?v=1.1.3','app.js?v=1.1.3','enhancements.js?v=1.1.3','features.js?v=1.1.3','ui-polish.js?v=1.1.3','navigation-data.js?v=1.1.3','finish-polish.js?v=1.1.3','expenses-polish.js?v=1.1.3','interaction-polish.js?v=1.1.3','allocator.js?v=1.1.3','transaction-updates.js?v=1.1.3','theme-custom.js?v=1.1.3','category-maker.js?v=1.1.3','settings-editor.js?v=1.1.3','wallet-polish.js?v=1.1.3','manifest.webmanifest?v=1.1.3','cashual-mark.svg?v=1.1.3','cashual-icon-180.png?v=1.1.3','cashual-icon-192.png?v=1.1.3','cashual-icon-512.png?v=1.1.3'];
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
