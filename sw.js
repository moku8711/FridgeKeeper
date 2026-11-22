// 오프라인 실행용 캐시. index.html 수정 후엔 VERSION 숫자를 올려야 폰에 새 버전이 반영됨
const VERSION = 'fridge-keeper-v4';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('fridge-keeper-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// 네트워크 우선 → 실패하면 캐시 (인터넷 없어도 실행, 있으면 항상 최신)
// cache:'no-cache' = GitHub Pages의 10분 브라우저 캐시를 건너뛰고 항상 서버에 새 버전 확인
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const sameOrigin = new URL(e.request.url).origin === self.location.origin;
  e.respondWith(
    fetch(sameOrigin ? e.request.url : e.request, sameOrigin ? { cache: 'no-cache', credentials: 'same-origin' } : undefined)
      .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
