const CACHE='cashual-v1.0.9';
const ASSETS=['./','index.html','styles.css?v=1.0.9','app.js?v=1.0.9','enhancements.js?v=1.0.9','features.js?v=1.0.9','ui-polish.js?v=1.0.9','navigation-data.js?v=1.0.9','finish-polish.js?v=1.0.9','expenses-polish.js?v=1.0.9','interaction-polish.js?v=1.0.9','allocator.js?v=1.0.9','transaction-updates.js?v=1.0.9','theme-custom.js?v=1.0.9','category-maker.js?v=1.0.9','settings-editor.js?v=1.0.9','manifest.webmanifest?v=1.0.9','cashual-mark.svg?v=1.0.9','cashual-icon-180.png?v=1.0.9','cashual-icon-192.png?v=1.0.9','cashual-icon-512.png?v=1.0.9'];
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
