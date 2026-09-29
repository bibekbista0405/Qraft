const C="qraft-v4";
const BASE=new URL("./",self.registration.scope).href;
const SHELL=new URL("index.html",BASE).href;
self.addEventListener("install",event=>{
  event.waitUntil(caches.open(C).then(cache=>cache.addAll([SHELL])).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==C).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET"||new URL(request.url).origin!==location.origin)return;
  event.respondWith(
    fetch(request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(C).then(cache=>cache.put(request,copy)).catch(()=>{});
      }
      return response;
    }).catch(()=>caches.match(request).then(cached=>cached||caches.match(SHELL)))
  );
});
