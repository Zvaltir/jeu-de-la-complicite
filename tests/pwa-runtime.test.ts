import { describe, expect, it, vi } from 'vitest'
import serviceWorkerSource from '../public/sw.js?raw'

interface RequestLike {
  method: string
  mode: string
  url: string
}

type FetchListener = (event: {
  request: RequestLike
  respondWith(response: Promise<Response> | Response): void
}) => void

function createFetchListener(cacheStorage: object, fetchImplementation: (request: unknown, init?: unknown) => Promise<Response>): FetchListener {
  const listeners = new Map<string, (event: unknown) => void>()
  const workerSelf = {
    registration: { scope: 'https://example.test/jeu/' },
    location: { origin: 'https://example.test' },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
  }
  const evaluate = new Function('self', 'caches', 'fetch', 'URL', serviceWorkerSource)
  evaluate(workerSelf, cacheStorage, fetchImplementation, URL)
  const listener = listeners.get('fetch')
  if (!listener) throw new Error('Listener fetch du service worker absent')
  return listener as FetchListener
}

function dispatchFetch(listener: FetchListener, request: RequestLike): Promise<Response> {
  let responsePromise: Promise<Response> | null = null
  listener({ request, respondWith: (response) => { responsePromise = Promise.resolve(response) } })
  if (!responsePromise) throw new Error('Le service worker n’a pas pris en charge la requête')
  return responsePromise
}

function request(path: string, mode = 'cors'): RequestLike {
  return { method: 'GET', mode, url: `https://example.test/jeu/${path}` }
}

describe('service worker en exécution', () => {
  it('sert le réseau même si CacheStorage est indisponible', async () => {
    const cacheError = new Error('Cache indisponible')
    const cacheStorage = {
      open: vi.fn(async () => { throw cacheError }),
      match: vi.fn(async () => { throw cacheError }),
      keys: vi.fn(async () => { throw cacheError }),
      delete: vi.fn(async () => { throw cacheError }),
    }
    const fetchImplementation = vi.fn(async () => new Response('réseau', { status: 200 }))
    const listener = createFetchListener(cacheStorage, fetchImplementation)

    const navigation = await dispatchFetch(listener, request('', 'navigate'))
    const asset = await dispatchFetch(listener, request('assets/index-current.js'))
    expect(await navigation.text()).toBe('réseau')
    expect(await asset.text()).toBe('réseau')
    expect(fetchImplementation).toHaveBeenCalledTimes(2)
  })

  it('actualise le manifeste en ligne au lieu de servir son ancienne copie', async () => {
    const put = vi.fn(async () => undefined)
    const cacheStorage = {
      open: vi.fn(async () => ({ put })),
      match: vi.fn(async () => new Response('{"description":"ancienne"}', { status: 200 })),
    }
    const fetchImplementation = vi.fn(async () => new Response('{"description":"courante"}', { status: 200 }))
    const listener = createFetchListener(cacheStorage, fetchImplementation)

    const response = await dispatchFetch(listener, request('manifest.json'))
    expect(await response.json()).toEqual({ description: 'courante' })
    expect(fetchImplementation).toHaveBeenCalledOnce()
    expect(put).toHaveBeenCalledOnce()
  })

  it('supprime l’ancien bundle seulement après avoir mis en cache son remplaçant', async () => {
    const oldScript = request('assets/index-old.js')
    const newScript = request('assets/index-new.js')
    const oldStyle = request('assets/index-old.css')
    const put = vi.fn(async () => undefined)
    const remove = vi.fn(async () => true)
    const cache = {
      put,
      match: vi.fn(async (cacheRequest: string) => cacheRequest === 'https://example.test/jeu/'
        ? new Response('<script src="./assets/index-new.js"></script><link href="./assets/index-new.css">')
        : undefined),
      keys: vi.fn(async () => [oldScript, newScript, oldStyle]),
      delete: remove,
    }
    const cacheStorage = {
      open: vi.fn(async () => cache),
      match: vi.fn(async () => undefined),
    }
    const fetchImplementation = vi.fn(async () => new Response('nouveau bundle', { status: 200 }))
    const listener = createFetchListener(cacheStorage, fetchImplementation)

    const response = await dispatchFetch(listener, newScript)
    expect(await response.text()).toBe('nouveau bundle')
    expect(put).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledOnce()
    expect(remove).toHaveBeenCalledWith(oldScript)
    expect(remove).not.toHaveBeenCalledWith(oldStyle)
  })
})
