interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface InstallEventTarget {
  addEventListener(type: 'beforeinstallprompt' | 'appinstalled', listener: EventListener): void
}

interface InstallButton {
  hidden: boolean | string
  addEventListener(type: 'click', listener: EventListener): void
}

function isUsableInstallPrompt(event: Event): event is BeforeInstallPromptEvent {
  const candidate = event as Partial<BeforeInstallPromptEvent>
  return typeof candidate.prompt === 'function' && typeof candidate.userChoice?.then === 'function'
}

export class InstallPromptController {
  private promptEvent: BeforeInstallPromptEvent | null = null
  private currentButton: InstallButton | null = null
  private readonly boundButtons = new WeakSet<object>()

  constructor(eventTarget: InstallEventTarget) {
    eventTarget.addEventListener('beforeinstallprompt', (event) => {
      if (!isUsableInstallPrompt(event)) return
      event.preventDefault()
      this.promptEvent = event
      this.syncButton()
    })
    eventTarget.addEventListener('appinstalled', () => {
      this.promptEvent = null
      this.syncButton()
    })
  }

  bindButton(button: InstallButton): void {
    this.currentButton = button
    if (!this.boundButtons.has(button)) {
      this.boundButtons.add(button)
      button.addEventListener('click', () => {
        if (this.currentButton !== button) return
        void this.consumePrompt().catch(() => undefined)
      })
    }
    this.syncButton()
  }

  detachButton(): void {
    if (this.currentButton) this.currentButton.hidden = true
    this.currentButton = null
  }

  private syncButton(): void {
    if (this.currentButton) this.currentButton.hidden = this.promptEvent === null
  }

  private async consumePrompt(): Promise<void> {
    const promptEvent = this.promptEvent
    if (!promptEvent) return
    this.promptEvent = null
    this.syncButton()
    await promptEvent.prompt()
    await promptEvent.userChoice
  }
}

let installPromptController: InstallPromptController | null = null

function getInstallPromptController(): InstallPromptController {
  installPromptController ??= new InstallPromptController(window)
  return installPromptController
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL('sw.js', document.baseURI)
    void navigator.serviceWorker
      .register(serviceWorkerUrl, { scope: './' })
      .then((registration) => registration.update())
      .catch(() => {
        // Le jeu web reste utilisable si le navigateur refuse les service workers ou si le réseau est indisponible.
      })
  }, { once: true })
}

export function setupInstallButton(button: HTMLButtonElement): void {
  getInstallPromptController().bindButton(button)
}

export function detachInstallButton(): void {
  installPromptController?.detachButton()
}
