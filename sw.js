const VERSION='1.3.10';
const CACHE=`cashual-v${VERSION}`;
const ROOT=new URL('./',self.location.href).href;
const INDEX=new URL('index.html',self.location.href).href;
const ASSETS=['./','index.html','sweldo.html?v=1.3.10','styles.css?v=1.3.10','app.js?v=1.3.10','enhancements.js?v=1.3.10','features.js?v=1.3.10','ui-polish.js?v=1.3.10','navigation-data.js?v=1.3.10','finish-polish.js?v=1.3.10','expenses-polish.js?v=1.3.10','interaction-polish.js?v=1.3.10','allocator.js?v=1.3.10','transaction-updates.js?v=1.3.10','theme-custom.js?v=1.3.10','category-maker.js?v=1.3.10','settings-editor.js?v=1.3.10','wallet-polish.js?v=1.3.10','manifest.webmanifest?v=1.3.10','cashual-mark.svg','cashual-mark.svg?v=1.3.10','cashual-icon-180.png?v=1.3.10','cashual-icon-192.png?v=1.3.10','cashual-icon-512.png?v=1.3.10'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('cashual-v')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
async function appNavigation(request){
  const cache=await caches.open(CACHE),cached=await cache.match(INDEX)||await cache.match(ROOT);
  const network=fetch(request,{cache:'no-store'}).then(response=>{if(response.ok)cache.put(INDEX,response.clone());return response});
  if(cached){network.catch(()=>{});return cached}
  try{return await network}catch{return new Response('<!doctype html><meta name="viewport" content="width=device-width"><title>Cashual offline</title><style>body{font:16px system-ui;padding:32px;background:#171b16;color:#eef2e9}button{padding:12px 16px}</style><h1>Cashual is offline</h1><p>Reconnect once to finish installing the offline app files.</p><button onclick="location.reload()">Try again</button>',{headers:{'Content-Type':'text/html;charset=utf-8'}})}
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(event.request.mode==='navigate'){
    if(url.pathname.endsWith('/sweldo.html'))event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)));
    else event.respondWith(appNavigation(event.request));
    return;
  }
  if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/version.json')){event.respondWith(fetch(event.request,{cache:'no-store'}));return}
  event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;try{const response=await fetch(event.request);if(response.ok)cache.put(event.request,response.clone());return response}catch{return Response.error()}}));
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
