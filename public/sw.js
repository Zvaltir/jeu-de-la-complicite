const CACHE_PREFIX = 'complicite-shell-'
const CACHE_VERSION = 'v1'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`

function scopedUrl(path = './') { return new URL(path, self.registration.scope).href }

async function shellUrls() {
  const homeUrl = scopedUrl()
  const response = await fetch(homeUrl, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Impossible de précacher l’application (${response.status})`)
  const html = await response.clone().text()
  const discoveredAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], homeUrl).href)
    .filter((url) => new URL(url).origin === self.location.origin)
  return [...new Set([homeUrl, scopedUrl('manifest.json'), scopedUrl('icons/icon-192.png'), scopedUrl('icons/icon-512.png'), ...discoveredAssets])]
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(await shellUrls())
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys()
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return
  event.respondWith((async () => {
    const cached = await caches.match(request)
    if (cached) return cached
    try {
      const response = await fetch(request)
      if (response.ok) {
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, response.clone())
      }
      return response
    } catch (error) {
      if (request.mode === 'navigate') {
        const fallback = await caches.match(scopedUrl())
        if (fallback) return fallback
      }
      throw error
    }
  })())
})
