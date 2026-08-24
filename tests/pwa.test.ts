import { describe, expect, it } from 'vitest'
import manifest from '../public/manifest.json'
import serviceWorkerSource from '../public/sw.js?raw'

describe('PWA', () => {
  it('déclare un manifeste installable à chemins relatifs', () => {
    expect(manifest).toMatchObject({ name: 'Jeu de la complicité', start_url: './', scope: './', display: 'standalone' })
    expect(manifest.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: './icons/icon-192.png', sizes: '192x192' }),
      expect.objectContaining({ src: './icons/icon-512.png', sizes: '512x512' }),
    ]))
  })

  it('sert les navigations réseau-d’abord avec un fallback offline mis à jour', () => {
    expect(serviceWorkerSource).toContain("CACHE_VERSION = 'v1'")
    expect(serviceWorkerSource).toContain("self.addEventListener('install'")
    expect(serviceWorkerSource).toContain("self.addEventListener('activate'")
    expect(serviceWorkerSource).toContain("self.addEventListener('fetch'")
    expect(serviceWorkerSource).toContain('caches.delete')
    expect(serviceWorkerSource).toContain('async function networkFirstNavigation(request)')
    expect(serviceWorkerSource).toContain("fetch(request, { cache: 'no-cache' })")
    expect(serviceWorkerSource).toContain('if (!response.ok) throw new Error')
    expect(serviceWorkerSource).toContain('putCacheSafely(await openCacheSafely(), scopedUrl(), response.clone())')
    expect(serviceWorkerSource).toContain('event.respondWith(networkFirstNavigation(request))')
  })

  it('actualise les assets non hashés et nettoie prudemment les anciens bundles Vite', () => {
    expect(serviceWorkerSource).toContain('async function networkFirstMutableAsset(request)')
    expect(serviceWorkerSource).toContain('isMutableShellAsset(url.href)')
    expect(serviceWorkerSource).toContain('async function cleanupStaleViteAssets(cache, currentAssetUrl)')
    expect(serviceWorkerSource).toContain('async function cleanupStaleShellAssets(cache, currentUrls)')
    expect(serviceWorkerSource).toContain('await cleanupStaleShellAssets(cache, urls)')
    expect(serviceWorkerSource).toContain('assetExtension(url) === extension')
    expect(serviceWorkerSource).toContain('matchCacheSafely(request)')
  })
})
