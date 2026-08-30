const CACHE = 'study-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192-v2.png', './icon-512-v2.png', './icon-maskable-192-v2.png', './icon-maskable-512-v2.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // Firebase/폰트는 네트워크로
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_REMINDER') {
    self.registration.showNotification('STUDY PRISON ⛓️', {
      body: '점호 시간! 오늘 공부 증거 아직 제출 안 했어요 📸',
      icon: 'icon-192-v2.png', badge: 'icon-192-v2.png', tag: 'study-reminder'
    });
  }
});
self.addEventListener('periodicsync', e => {
  if (e.tag === 'study-reminder') {
    e.waitUntil((async () => {
      const now = new Date();
      if (now.getHours() !== 23) return;
      const d = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const c = await caches.open(CACHE);
      const done = await c.match('__proof_done_' + d);
      if (!done) {
        await self.registration.showNotification('STUDY PRISON ⛓️', {
          body: '점호 시간! 오늘 공부 증거 아직 제출 안 했어요 📸',
          icon: 'icon-192-v2.png', badge: 'icon-192-v2.png', tag: 'study-reminder'
        });
      }
    })());
  }
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(cs => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return clients.openWindow('./');
  }));
});
