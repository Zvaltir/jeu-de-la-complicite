import { afterEach, describe, expect, it, vi } from 'vitest'
import { detectInstallEnvironment, InstallPromptController, registerServiceWorker } from '../src/lib/pwa'

class CountingEventTarget extends EventTarget {
  readonly listenerCounts = new Map<string, number>()

  override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
    this.listenerCounts.set(type, (this.listenerCounts.get(type) ?? 0) + 1)
    super.addEventListener(type, callback, options)
  }
}

class FakeButton extends EventTarget {
  hidden = true
  readonly attributes = new Map<string, string>()

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }
}

class FakeHelp {
  hidden = true
  textContent: string | null = null
  readonly focus = vi.fn()
}

class FakeInstallPromptEvent extends Event {
  readonly prompt = vi.fn(async () => undefined)
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>

  constructor(outcome: 'accepted' | 'dismissed' = 'dismissed') {
    super('beforeinstallprompt', { cancelable: true })
    this.userChoice = Promise.resolve({ outcome })
  }
}

const browserEnvironment = { standalone: false, ios: false }

describe('InstallPromptController', () => {
  it('affiche le contrôle sans prompt et ouvre l’aide générique', async () => {
    const controller = new InstallPromptController(new CountingEventTarget(), browserEnvironment)
    const button = new FakeButton()
    const help = new FakeHelp()
    controller.bindButton(button, help)

    expect(button.hidden).toBe(false)
    button.dispatchEvent(new Event('click'))
    await vi.waitFor(() => expect(help.focus).toHaveBeenCalledOnce())
    expect(help.hidden).toBe(false)
    expect(help.textContent).toContain('menu de votre navigateur')
    expect(help.textContent).toContain('« Installer l’application »')
    expect(button.attributes.get('aria-expanded')).toBe('true')
  })

  it('affiche l’aide Safari adaptée sur iPhone et iPad', async () => {
    const controller = new InstallPromptController(new CountingEventTarget(), { standalone: false, ios: true })
    const button = new FakeButton()
    const help = new FakeHelp()
    controller.bindButton(button, help)

    button.dispatchEvent(new Event('click'))
    await vi.waitFor(() => expect(help.focus).toHaveBeenCalledOnce())
    expect(help.textContent).toContain('Dans Safari')
    expect(help.textContent).toContain('Partager')
    expect(help.textContent).toContain('« Ajouter à l’écran d’accueil »')
  })

  it('utilise le prompt natif réel lorsqu’il est disponible', async () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target, browserEnvironment)
    const button = new FakeButton()
    const help = new FakeHelp()
    controller.bindButton(button, help)
    const promptEvent = new FakeInstallPromptEvent()

    target.dispatchEvent(promptEvent)
    button.dispatchEvent(new Event('click'))
    await vi.waitFor(() => expect(promptEvent.prompt).toHaveBeenCalledOnce())
    expect(promptEvent.defaultPrevented).toBe(true)
    expect(help.hidden).toBe(true)
    expect(button.hidden).toBe(false)
  })

  it('masque la proposition quand le prompt natif est accepté', async () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target, browserEnvironment)
    const button = new FakeButton()
    const help = new FakeHelp()
    controller.bindButton(button, help)
    const promptEvent = new FakeInstallPromptEvent('accepted')

    target.dispatchEvent(promptEvent)
    button.dispatchEvent(new Event('click'))
    await vi.waitFor(() => expect(button.hidden).toBe(true))
    expect(promptEvent.prompt).toHaveBeenCalledOnce()
    expect(help.hidden).toBe(true)
  })

  it('remplace l’aide ouverte par un prompt natif reçu ensuite', async () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target, browserEnvironment)
    const button = new FakeButton()
    const help = new FakeHelp()
    controller.bindButton(button, help)
    button.dispatchEvent(new Event('click'))
    await vi.waitFor(() => expect(help.hidden).toBe(false))

    const promptEvent = new FakeInstallPromptEvent()
    target.dispatchEvent(promptEvent)
    expect(help.hidden).toBe(true)
    button.dispatchEvent(new Event('click'))
    await vi.waitFor(() => expect(promptEvent.prompt).toHaveBeenCalledOnce())
  })

  it('masque et purge l’installation après appinstalled', async () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target, browserEnvironment)
    const button = new FakeButton()
    const help = new FakeHelp()
    controller.bindButton(button, help)
    const promptEvent = new FakeInstallPromptEvent()
    target.dispatchEvent(promptEvent)

    target.dispatchEvent(new Event('appinstalled'))
    expect(button.hidden).toBe(true)
    expect(help.hidden).toBe(true)
    button.dispatchEvent(new Event('click'))
    await Promise.resolve()
    expect(promptEvent.prompt).not.toHaveBeenCalled()
  })

  it('masque le contrôle lorsque l’application est déjà standalone', () => {
    const controller = new InstallPromptController(new CountingEventTarget(), { standalone: true, ios: false })
    const button = new FakeButton()
    const help = new FakeHelp()
    controller.bindButton(button, help)
    expect(button.hidden).toBe(true)
    expect(help.hidden).toBe(true)
  })

  it('n’installe les listeners globaux qu’une fois pour tous les écrans', () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target, browserEnvironment)
    for (let cycle = 0; cycle < 5; cycle += 1) {
      controller.bindButton(new FakeButton(), new FakeHelp())
      controller.detachButton()
    }
    expect(target.listenerCounts.get('beforeinstallprompt')).toBe(1)
    expect(target.listenerCounts.get('appinstalled')).toBe(1)
  })

  it('conserve un prompt reçu sans bouton et le propose au bouton courant', async () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target, browserEnvironment)
    const staleButton = new FakeButton()
    controller.bindButton(staleButton, new FakeHelp())
    controller.detachButton()

    const promptEvent = new FakeInstallPromptEvent()
    target.dispatchEvent(promptEvent)
    expect(staleButton.hidden).toBe(true)
    expect(promptEvent.defaultPrevented).toBe(true)

    const currentButton = new FakeButton()
    const currentHelp = new FakeHelp()
    controller.bindButton(currentButton, currentHelp)
    expect(currentButton.hidden).toBe(false)
    currentButton.dispatchEvent(new Event('click'))
    await vi.waitFor(() => expect(promptEvent.prompt).toHaveBeenCalledOnce())
    expect(currentHelp.hidden).toBe(true)
  })

  it('ignore un faux prompt et conserve l’aide manuelle', async () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target, browserEnvironment)
    const button = new FakeButton()
    const help = new FakeHelp()
    controller.bindButton(button, help)
    target.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true }))

    button.dispatchEvent(new Event('click'))
    await vi.waitFor(() => expect(help.hidden).toBe(false))
    expect(button.hidden).toBe(false)
  })
})

describe('détection du mode installé', () => {
  it('reconnaît display-mode standalone', () => {
    expect(detectInstallEnvironment(
      { matchMedia: (query) => ({ matches: query === '(display-mode: standalone)' }) },
      { userAgent: 'Navigateur de test' },
    ).standalone).toBe(true)
  })

  it('reconnaît navigator.standalone et les indices iPadOS', () => {
    expect(detectInstallEnvironment(
      { matchMedia: () => ({ matches: false }) },
      { standalone: true, userAgent: 'Mozilla/5.0 Macintosh', platform: 'MacIntel', maxTouchPoints: 5 },
    )).toEqual({ standalone: true, ios: true })
  })
})

describe('registerServiceWorker', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('force une vérification du worker courant sans bloquer l’application', async () => {
    const update = vi.fn(async () => undefined)
    const register = vi.fn(async () => ({ update }))
    const fakeWindow = new EventTarget()
    vi.stubGlobal('window', fakeWindow)
    vi.stubGlobal('document', { baseURI: 'https://example.test/jeu/' })
    vi.stubGlobal('navigator', { serviceWorker: { register } })

    registerServiceWorker()
    fakeWindow.dispatchEvent(new Event('load'))
    await vi.waitFor(() => expect(update).toHaveBeenCalledOnce())
    expect(register).toHaveBeenCalledWith(new URL('https://example.test/jeu/sw.js'), { scope: './' })
  })
})
