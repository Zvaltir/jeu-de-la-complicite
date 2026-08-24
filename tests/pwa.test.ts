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

  it('versionne, remplace et sert le cache hors ligne', () => {
    expect(serviceWorkerSource).toContain("CACHE_VERSION = 'v1'")
    expect(serviceWorkerSource).toContain("self.addEventListener('install'")
    expect(serviceWorkerSource).toContain("self.addEventListener('activate'")
    expect(serviceWorkerSource).toContain("self.addEventListener('fetch'")
    expect(serviceWorkerSource).toContain('caches.delete')
    expect(serviceWorkerSource).toContain("request.mode === 'navigate'")
  })
})
