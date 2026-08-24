import { describe, expect, it, vi } from 'vitest'
import { InstallPromptController } from '../src/lib/pwa'

class CountingEventTarget extends EventTarget {
  readonly listenerCounts = new Map<string, number>()

  override addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void {
    this.listenerCounts.set(type, (this.listenerCounts.get(type) ?? 0) + 1)
    super.addEventListener(type, callback, options)
  }
}

class FakeButton extends EventTarget {
  hidden = true
}

class FakeInstallPromptEvent extends Event {
  readonly prompt = vi.fn(async () => undefined)
  readonly userChoice = Promise.resolve({ outcome: 'dismissed' as const })

  constructor() {
    super('beforeinstallprompt', { cancelable: true })
  }
}

describe('InstallPromptController', () => {
  it('n’installe les listeners globaux qu’une fois pour tous les écrans', () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target)
    for (let cycle = 0; cycle < 5; cycle += 1) {
      controller.bindButton(new FakeButton())
      controller.detachButton()
    }
    expect(target.listenerCounts.get('beforeinstallprompt')).toBe(1)
    expect(target.listenerCounts.get('appinstalled')).toBe(1)
  })

  it('conserve un prompt reçu sans bouton et le propose au bouton courant', async () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target)
    const staleButton = new FakeButton()
    controller.bindButton(staleButton)
    controller.detachButton()

    const promptEvent = new FakeInstallPromptEvent()
    target.dispatchEvent(promptEvent)
    expect(staleButton.hidden).toBe(true)
    expect(promptEvent.defaultPrevented).toBe(true)

    const currentButton = new FakeButton()
    controller.bindButton(currentButton)
    expect(currentButton.hidden).toBe(false)
    currentButton.dispatchEvent(new Event('click'))
    await promptEvent.userChoice
    await vi.waitFor(() => expect(promptEvent.prompt).toHaveBeenCalledOnce())
    expect(currentButton.hidden).toBe(true)
  })

  it('ignore un événement sans prompt réellement utilisable', () => {
    const target = new CountingEventTarget()
    const controller = new InstallPromptController(target)
    const button = new FakeButton()
    controller.bindButton(button)
    target.dispatchEvent(new Event('beforeinstallprompt', { cancelable: true }))
    expect(button.hidden).toBe(true)
  })
})
