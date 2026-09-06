/* Cache ONLY this project's public demo shell. No real transactions or cross-site caches. */
'use strict';
const PREFIX = 'nexus-enterprise-' + new URL(self.registration.scope).pathname;
const CACHE = PREFIX + '-v3.0.0';
const ASSETS = ['./', './index.html', './enterprise.css?v=3.0.0', './demo-store.js?v=3.0.0', './enterprise.js?v=3.0.0', './manifest.webmanifest', './nexus-icon.svg', './icon-192.png', './icon-512.png'];
const ALLOWED = new Set(ASSETS.map(p => new URL(p, self.registration.scope).href));
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !ALLOWED.has(req.url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(req);
      if (response.ok) await cache.put(req, response.clone());
      return response;
    } catch (error) {
      const hit = await cache.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
