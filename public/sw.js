const CACHE_PREFIX = 'last-alibi-';
const CACHE = `${CACHE_PREFIX}shell-v2`;
const CORE = ['/', '/index.html', '/manifest.json', '/last-alibi-mark.png', '/favicon.ico'];

function isCacheable(response) {
  return response.ok && (response.type === 'basic' || response.type === 'default');
}

async function cacheResponse(cache, request, response) {
  if (isCacheable(response)) await cache.put(request, response.clone());
  return response;
}

async function precacheShell() {
  const cache = await caches.open(CACHE);
  await cache.addAll(CORE);
  const response = await fetch('/index.html');
  const html = await response.text();
  const shellPaths = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((path) => path.startsWith('/') && !CORE.includes(path));

  const shellResponses = await Promise.all(shellPaths.map(async (path) => {
    try {
      const shellResponse = await fetch(path);
      await cacheResponse(cache, path, shellResponse);
      return path.endsWith('.js') ? shellResponse : null;
    } catch {
      return null;
    }
  }));

  // Expo emits audio, image, and font URLs inside the generated bundle rather
  // than as tags in index.html. Cache those URLs so a completed installation
  // is actually ready to play offline, including sound and icon fonts.
  const bundledAssetPaths = new Set();
  for (const shellResponse of shellResponses) {
    if (!shellResponse) continue;
    const bundle = await shellResponse.text();
    for (const match of bundle.matchAll(/\/assets\/[A-Za-z0-9_@%./-]+/g)) {
      bundledAssetPaths.add(match[0]);
    }
  }
  await Promise.allSettled([...bundledAssetPaths].map((path) => cache.add(path)));
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const url = new URL(request.url);
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const cache = await caches.open(CACHE);
        await cache.put('/index.html', response.clone());
        await cache.put('/', response.clone());
      }
    }
    return response;
  } catch {
    return (await caches.match('/index.html')) ?? new Response('The Last Alibi is offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function assetResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const cache = await caches.open(CACHE);
    return await cacheResponse(cache, request, await fetch(request));
  } catch {
    return Response.error();
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(event.request.mode === 'navigate'
    ? navigationResponse(event.request)
    : assetResponse(event.request));
});
