interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    const serviceWorkerUrl = new URL('sw.js', document.baseURI)
    void navigator.serviceWorker.register(serviceWorkerUrl, { scope: './' }).catch(() => {
      // Le jeu web reste utilisable si le navigateur refuse les service workers.
    })
  })
}

export function setupInstallButton(button: HTMLButtonElement): void {
  let installPrompt: BeforeInstallPromptEvent | null = null
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    installPrompt = event as BeforeInstallPromptEvent
    button.hidden = false
  })
  button.addEventListener('click', async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    await installPrompt.userChoice
    installPrompt = null
    button.hidden = true
  })
  window.addEventListener('appinstalled', () => {
    installPrompt = null
    button.hidden = true
  })
}
