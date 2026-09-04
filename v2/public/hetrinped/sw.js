// Service worker — HETRIN Ped
// Cache-first: apos o primeiro acesso, a ferramenta funciona offline.
// Ao publicar nova versao, incrementar CACHE_NAME para invalidar o cache antigo.
const CACHE_NAME = 'hetrinped-v1.2.0'
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then(cached => {
      // Cache-first para abrir instantaneo/offline; atualiza em segundo plano
      const network = fetch(e.request).then(res => {
        if (res.ok && new URL(e.request.url).origin === self.location.origin) {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone))
        }
        return res
      }).catch(() => cached)
      return cached || network
    })
  )
})
