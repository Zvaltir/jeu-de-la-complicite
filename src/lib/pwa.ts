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
  setAttribute(name: string, value: string): void
}

interface InstallHelp {
  hidden: boolean | string
  textContent: string | null
  focus(): void
}

interface InstallEnvironment {
  standalone: boolean
  ios: boolean
}

interface DisplayModeTarget {
  matchMedia?(query: string): { matches: boolean }
}

interface NavigatorInstallHints {
  standalone?: boolean
  userAgent?: string
  platform?: string
  maxTouchPoints?: number
}

const IOS_INSTALL_HELP = 'Dans Safari : touchez Partager, puis « Ajouter à l’écran d’accueil ».'
const GENERIC_INSTALL_HELP = 'Ouvrez le menu de votre navigateur puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil » si cette option est proposée.'

function isUsableInstallPrompt(event: Event): event is BeforeInstallPromptEvent {
  const candidate = event as Partial<BeforeInstallPromptEvent>
  return typeof candidate.prompt === 'function' && typeof candidate.userChoice?.then === 'function'
}

export function detectInstallEnvironment(
  displayModeTarget: DisplayModeTarget,
  navigatorHints: NavigatorInstallHints,
): InstallEnvironment {
  const standalone = displayModeTarget.matchMedia?.('(display-mode: standalone)').matches === true
    || navigatorHints.standalone === true
  const userAgent = navigatorHints.userAgent ?? ''
  const ios = /iPad|iPhone|iPod/u.test(userAgent)
    || (navigatorHints.platform === 'MacIntel' && (navigatorHints.maxTouchPoints ?? 0) > 1)
  return { standalone, ios }
}

export class InstallPromptController {
  private promptEvent: BeforeInstallPromptEvent | null = null
  private currentButton: InstallButton | null = null
  private currentHelp: InstallHelp | null = null
  private readonly boundButtons = new WeakSet<object>()
  private installed: boolean
  private readonly ios: boolean

  constructor(
    eventTarget: InstallEventTarget,
    environment: InstallEnvironment = detectInstallEnvironment(window, navigator as Navigator & NavigatorInstallHints),
  ) {
    this.installed = environment.standalone
    this.ios = environment.ios
    eventTarget.addEventListener('beforeinstallprompt', (event) => {
      if (this.installed || !isUsableInstallPrompt(event)) return
      event.preventDefault()
      this.promptEvent = event
      this.hideManualHelp()
      this.syncButton()
    })
    eventTarget.addEventListener('appinstalled', () => {
      this.promptEvent = null
      this.installed = true
      this.syncButton()
    })
  }

  bindButton(button: InstallButton, help: InstallHelp): void {
    this.currentButton = button
    this.currentHelp = help
    this.hideManualHelp()
    if (!this.boundButtons.has(button)) {
      this.boundButtons.add(button)
      button.addEventListener('click', () => {
        if (this.currentButton !== button) return
        void this.handleInstallRequest().catch(() => undefined)
      })
    }
    this.syncButton()
  }

  detachButton(): void {
    if (this.currentButton) this.currentButton.hidden = true
    this.hideManualHelp()
    this.currentButton = null
    this.currentHelp = null
  }

  private syncButton(): void {
    if (!this.currentButton) return
    this.currentButton.hidden = this.installed
    if (this.installed) this.hideManualHelp()
  }

  private hideManualHelp(): void {
    if (this.currentHelp) this.currentHelp.hidden = true
    if (this.currentButton) this.currentButton.setAttribute('aria-expanded', 'false')
  }

  private showManualHelp(): void {
    if (!this.currentButton || !this.currentHelp || this.installed) return
    this.currentHelp.textContent = this.ios ? IOS_INSTALL_HELP : GENERIC_INSTALL_HELP
    this.currentHelp.hidden = false
    this.currentButton.setAttribute('aria-expanded', 'true')
    this.currentHelp.focus()
  }

  private async handleInstallRequest(): Promise<void> {
    const promptEvent = this.promptEvent
    if (!promptEvent) {
      this.showManualHelp()
      return
    }
    this.promptEvent = null
    this.hideManualHelp()
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    if (choice.outcome === 'accepted') this.installed = true
    this.syncButton()
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

export function setupInstallButton(button: HTMLButtonElement, help: HTMLElement): void {
  getInstallPromptController().bindButton(button, help)
}

export function detachInstallButton(): void {
  installPromptController?.detachButton()
}
