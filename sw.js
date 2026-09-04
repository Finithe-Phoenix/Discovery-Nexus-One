const CACHE='nexus-one-v2-overlay-20260904';
const ASSETS=['./v2.css','./v2.js','./manifest.webmanifest','./nexus-icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{await Promise.all((await caches.keys()).filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const client of clients){try{await client.navigate(client.url)}catch{}}})())});
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 if(e.request.mode==='navigate'){
  e.respondWith((async()=>{try{const res=await fetch(e.request,{cache:'no-store'});let html=await res.text();if(!html.includes('data-nexus-v2')){html=html.replace('</head>','<link data-nexus-v2 rel="stylesheet" href="./v2.css?v=2.0.0"></head>').replace('</body>','<script data-nexus-v2 src="./v2.js?v=2.0.0"></script></body>')}return new Response(html,{status:res.status,statusText:res.statusText,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-cache'}})}catch{return caches.match('./index.html')}})());return;
 }
 e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request).then(res=>{if(res&&res.status===200){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return res})));
});
