/* Cache ONLY this project's public demo shell. No real transactions or cross-site caches. */
'use strict';
const SCOPE = new URL(self.registration.scope);
const PREFIX = 'nexus-enterprise-' + SCOPE.pathname;
const CACHE = PREFIX + '-v8.0.0';
const SHELL = new URL('./index.html', SCOPE).href;
const ASSETS = ['./', './index.html', './enterprise.css?v=3.0.0', './premium.css?v=8.0.0', './demo-store.js?v=5.0.0', './enterprise.js?v=8.0.0', './experience.css?v=5.0.0', './experience.js?v=6.0.0', './decision.css?v=7.0.0', './decision-core.js?v=6.0.0', './decision.js?v=8.0.0', './manifest.webmanifest', './nexus-icon.svg', './icon-192.png', './icon-512.png'];
const ALLOWED = new Set(ASSETS.map(p => new URL(p, SCOPE).href));
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  url.hash = '';
  const navigation = req.mode === 'navigate' && url.origin === SCOPE.origin &&
    (url.pathname === SCOPE.pathname || url.pathname === new URL(SHELL).pathname);
  if (!navigation && !ALLOWED.has(url.href)) return;
  const key = navigation ? SHELL : url.href;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(req);
      if (response.ok) await cache.put(key, response.clone());
      return response;
    } catch (error) {
      return (await cache.match(key)) || Response.error();
    }
  })());
});
