const CACHE_PREFIX = 'complicite-shell-'
const CACHE_VERSION = 'v1'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`

function scopedUrl(path = './') { return new URL(path, self.registration.scope).href }

function urlsFromHtml(html, homeUrl) {
  return [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => new URL(match[1], homeUrl).href)
    .filter((url) => new URL(url).origin === self.location.origin)
}

function isMutableShellAsset(url) {
  return [scopedUrl('manifest.json'), scopedUrl('icons/icon-192.png'), scopedUrl('icons/icon-512.png')].includes(url)
}

function isViteAsset(url) { return url.startsWith(scopedUrl('assets/')) }

function assetExtension(url) {
  const path = new URL(url).pathname
  return path.slice(path.lastIndexOf('.'))
}

async function openCacheSafely() {
  try { return await caches.open(CACHE_NAME) } catch { return null }
}

async function matchCacheSafely(request) {
  try { return await caches.match(request) } catch { return undefined }
}

async function putCacheSafely(cache, request, response) {
  if (!cache) return
  try { await cache.put(request, response) } catch { /* Le réseau reste prioritaire si CacheStorage échoue. */ }
}

async function shellUrls() {
  const homeUrl = scopedUrl()
  const response = await fetch(homeUrl, { cache: 'no-cache' })
  if (!response.ok) throw new Error(`Impossible de précacher l’application (${response.status})`)
  const html = await response.clone().text()
  const discoveredAssets = urlsFromHtml(html, homeUrl)
  return [...new Set([homeUrl, scopedUrl('manifest.json'), scopedUrl('icons/icon-192.png'), scopedUrl('icons/icon-512.png'), ...discoveredAssets])]
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await openCacheSafely()
    if (cache) {
      const urls = await shellUrls()
      await cache.addAll(urls)
      await cleanupStaleShellAssets(cache, urls)
    }
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys()
      await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)))
    } catch { /* Un cache indisponible ne doit pas bloquer le jeu en ligne. */ }
    await self.clients.claim()
  })())
})

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`Navigation indisponible (${response.status})`)
    await putCacheSafely(await openCacheSafely(), scopedUrl(), response.clone())
    return response
  } catch (error) {
    const fallback = await matchCacheSafely(scopedUrl())
    if (fallback) return fallback
    throw error
  }
}

async function cleanupStaleShellAssets(cache, currentUrls) {
  try {
    const currentAssets = new Set(currentUrls.filter(isViteAsset))
    const requests = await cache.keys()
    await Promise.all(requests
      .filter(({ url }) => isViteAsset(url) && !currentAssets.has(url))
      .map((request) => cache.delete(request)))
  } catch { /* Le nettoyage ne doit jamais invalider une installation précachée. */ }
}

async function cleanupStaleViteAssets(cache, currentAssetUrl) {
  if (!cache || !isViteAsset(currentAssetUrl)) return
  try {
    const htmlResponse = await cache.match(scopedUrl())
    if (!htmlResponse) return
    const currentAssets = new Set(urlsFromHtml(await htmlResponse.text(), scopedUrl()).filter(isViteAsset))
    if (!currentAssets.has(currentAssetUrl)) return
    const extension = assetExtension(currentAssetUrl)
    const requests = await cache.keys()
    await Promise.all(requests
      .filter(({ url }) => isViteAsset(url) && assetExtension(url) === extension && !currentAssets.has(url))
      .map((request) => cache.delete(request)))
  } catch { /* Le nettoyage ne doit jamais compromettre la réponse courante. */ }
}

async function cacheFirstAsset(request) {
  const cached = await matchCacheSafely(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) {
    const cache = await openCacheSafely()
    await putCacheSafely(cache, request, response.clone())
    await cleanupStaleViteAssets(cache, request.url)
  }
  return response
}

async function networkFirstMutableAsset(request) {
  try {
    const response = await fetch(request, { cache: 'no-cache' })
    if (!response.ok) throw new Error(`Ressource indisponible (${response.status})`)
    await putCacheSafely(await openCacheSafely(), request, response.clone())
    return response
  } catch (error) {
    const fallback = await matchCacheSafely(request)
    if (fallback) return fallback
    throw error
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return
  if (request.mode === 'navigate') event.respondWith(networkFirstNavigation(request))
  else if (isMutableShellAsset(url.href)) event.respondWith(networkFirstMutableAsset(request))
  else event.respondWith(cacheFirstAsset(request))
})
