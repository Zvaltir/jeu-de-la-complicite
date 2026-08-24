import './style.css'
import rawCorpus from './data/words.json'
import { getEligibleEntries, validateCorpus } from './lib/corpus'
import { DrawEngine } from './lib/draw'
import { detachInstallButton, registerServiceWorker, setupInstallButton } from './lib/pwa'
import { createDefaultSettings, getLaunchProblem } from './lib/settings'
import { THEMES } from './lib/themes'
import type { Corpus, DrawBatch, GameSettings, NotorietyLevel, ThemeId } from './lib/types'

const appNode = document.querySelector<HTMLElement>('#app')
if (!appNode) throw new Error('Élément #app introuvable')
const app: HTMLElement = appNode

let corpus: Corpus
let settings = createDefaultSettings()
let game: DrawEngine | null = null

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => {
    const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }
    return entities[character] ?? character
  })
}

function levelOptions(selected: NotorietyLevel): string {
  return [1, 2, 3, 4, 5]
    .map((level) => `<option value="${level}"${level === selected ? ' selected' : ''}>Niveau ${level}</option>`)
    .join('')
}

function batchOptions(selected: number): string {
  return Array.from({ length: 10 }, (_, index) => index + 1)
    .map((count) => `<option value="${count}"${count === selected ? ' selected' : ''}>${count}</option>`)
    .join('')
}

function currentEligibleEntries() {
  return getEligibleEntries(corpus, settings)
}

function updateConfigurationStatus(): void {
  const count = currentEligibleEntries().length
  const countElement = document.querySelector<HTMLElement>('#availability-count')
  const problemElement = document.querySelector<HTMLElement>('#configuration-problem')
  const launchButton = document.querySelector<HTMLButtonElement>('#launch-game')
  if (!countElement || !problemElement || !launchButton) return
  countElement.textContent = `${count} mot${count > 1 ? 's' : ''} disponible${count > 1 ? 's' : ''}`
  const problem = getLaunchProblem(settings, count)
  problemElement.textContent = problem ?? ''
  problemElement.hidden = problem === null
  launchButton.disabled = problem !== null
  launchButton.setAttribute('aria-describedby', problem ? 'configuration-problem' : 'availability-count')
}

function syncThemeCheckboxes(): void {
  document.querySelectorAll<HTMLInputElement>('input[name="themes"]').forEach((checkbox) => {
    checkbox.checked = settings.selectedThemes.includes(checkbox.value as ThemeId)
  })
}

function renderConfiguration(): void {
  app.className = 'app-shell'
  app.innerHTML = `
    <div class="configuration-layout">
      <header class="hero">
        <p class="eyebrow">À vous de jouer</p>
        <h1>Jeu de la <span>complicité</span></h1>
        <p class="intro">Réglez la pioche, posez le téléphone au centre et faites deviner les mêmes références.</p>
        <button class="install-button" id="install-app" type="button" hidden>Installer l’application</button>
      </header>

      <form class="configuration-card" id="configuration-form">
        <fieldset>
          <legend><span class="step">1</span> Difficulté</legend>
          <p class="field-help">De très connu à plus pointu.</p>
          <div class="level-range">
            <label>Minimum<select id="min-level" name="minLevel">${levelOptions(settings.minLevel)}</select></label>
            <span aria-hidden="true">→</span>
            <label>Maximum<select id="max-level" name="maxLevel">${levelOptions(settings.maxLevel)}</select></label>
          </div>
          <label class="check-row">
            <input id="balance-difficulties" type="checkbox" ${settings.balanceDifficulties ? 'checked' : ''}>
            <span><strong>Égaliser les chances entre les difficultés</strong><small>Chaque niveau disponible a la même chance d’être choisi.</small></span>
          </label>
        </fieldset>

        <fieldset>
          <legend><span class="step">2</span> Thèmes</legend>
          <div class="theme-actions">
            <button type="button" id="select-all-themes">Tout sélectionner</button>
            <button type="button" id="clear-all-themes">Tout désélectionner</button>
          </div>
          <div class="theme-grid">
            ${THEMES.map((theme) => `
              <label class="theme-option">
                <input type="checkbox" name="themes" value="${theme.id}" ${settings.selectedThemes.includes(theme.id) ? 'checked' : ''}>
                <span>${escapeHtml(theme.label)}</span>
              </label>`).join('')}
          </div>
          <label class="check-row">
            <input id="balance-themes" type="checkbox" ${settings.balanceThemes ? 'checked' : ''}>
            <span><strong>Égaliser les chances entre les catégories</strong><small>Chaque thème disponible a la même chance d’être choisi.</small></span>
          </label>
        </fieldset>

        <fieldset>
          <legend><span class="step">3</span> Mots par manche</legend>
          <label class="batch-select">Nombre de mots affichés<select id="batch-size" name="batchSize">${batchOptions(settings.batchSize)}</select></label>
        </fieldset>

        <div class="launch-panel">
          <p class="availability" id="availability-count" aria-live="polite"></p>
          <p class="problem" id="configuration-problem" role="alert" hidden></p>
          <button class="primary-button" id="launch-game" type="submit">Lancer la partie <span aria-hidden="true">→</span></button>
        </div>
      </form>
    </div>`

  const form = document.querySelector<HTMLFormElement>('#configuration-form')
  const minLevel = document.querySelector<HTMLSelectElement>('#min-level')
  const maxLevel = document.querySelector<HTMLSelectElement>('#max-level')
  const batchSize = document.querySelector<HTMLSelectElement>('#batch-size')
  const balanceThemes = document.querySelector<HTMLInputElement>('#balance-themes')
  const balanceDifficulties = document.querySelector<HTMLInputElement>('#balance-difficulties')
  const installButton = document.querySelector<HTMLButtonElement>('#install-app')
  if (!form || !minLevel || !maxLevel || !batchSize || !balanceThemes || !balanceDifficulties || !installButton) throw new Error('Configuration incomplète')
  setupInstallButton(installButton)

  minLevel.addEventListener('change', () => {
    settings.minLevel = Number(minLevel.value) as NotorietyLevel
    if (settings.minLevel > settings.maxLevel) {
      settings.maxLevel = settings.minLevel
      maxLevel.value = String(settings.maxLevel)
    }
    updateConfigurationStatus()
  })
  maxLevel.addEventListener('change', () => {
    settings.maxLevel = Number(maxLevel.value) as NotorietyLevel
    if (settings.maxLevel < settings.minLevel) {
      settings.minLevel = settings.maxLevel
      minLevel.value = String(settings.minLevel)
    }
    updateConfigurationStatus()
  })
  batchSize.addEventListener('change', () => {
    settings.batchSize = Number(batchSize.value)
    updateConfigurationStatus()
  })
  balanceThemes.addEventListener('change', () => {
    settings.balanceThemes = balanceThemes.checked
    updateConfigurationStatus()
  })
  balanceDifficulties.addEventListener('change', () => {
    settings.balanceDifficulties = balanceDifficulties.checked
    updateConfigurationStatus()
  })
  document.querySelectorAll<HTMLInputElement>('input[name="themes"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      settings.selectedThemes = [...document.querySelectorAll<HTMLInputElement>('input[name="themes"]:checked')]
        .map((input) => input.value as ThemeId)
      updateConfigurationStatus()
    })
  })
  document.querySelector('#select-all-themes')?.addEventListener('click', () => {
    settings.selectedThemes = THEMES.map((theme) => theme.id)
    syncThemeCheckboxes()
    updateConfigurationStatus()
  })
  document.querySelector('#clear-all-themes')?.addEventListener('click', () => {
    settings.selectedThemes = []
    syncThemeCheckboxes()
    updateConfigurationStatus()
  })
  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const eligibleEntries = currentEligibleEntries()
    if (getLaunchProblem(settings, eligibleEntries.length)) return
    const frozenSettings: GameSettings = { ...settings, selectedThemes: [...settings.selectedThemes] }
    game = new DrawEngine(eligibleEntries, frozenSettings)
    renderGame(game.drawBatch())
  })
  updateConfigurationStatus()
}

function renderGame(batch: DrawBatch): void {
  detachInstallButton()
  app.className = 'game-shell'
  app.innerHTML = `
    <section class="game" aria-labelledby="game-title">
      <header class="game-header">
        <div><p class="eyebrow">Jeu de la complicité</p><h1 id="game-title">À faire deviner</h1></div>
        <p class="batch-count">${settings.batchSize} mot${settings.batchSize > 1 ? 's' : ''}</p>
      </header>
      <p class="cycle-notice" aria-live="polite" ${batch.recycled ? '' : 'hidden'}>La pioche recommence avec un nouveau cycle.</p>
      <div class="word-grid">
        ${batch.entries.map((entry, index) => `
          <article class="word-card">
            <span aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
            <p>${escapeHtml(entry.label)}</p>
          </article>`).join('')}
      </div>
      <div class="game-actions">
        <button class="secondary-button" id="end-game" type="button">Fin de partie</button>
        <button class="primary-button" id="next-words" type="button">Mot suivant <span aria-hidden="true">→</span></button>
      </div>
    </section>`
  document.querySelector('#next-words')?.addEventListener('click', () => { if (game) renderGame(game.drawBatch()) })
  document.querySelector('#end-game')?.addEventListener('click', () => {
    game = null
    renderConfiguration()
    app.focus()
  })
  document.querySelector<HTMLButtonElement>('#next-words')?.focus()
}

function renderCorpusError(error: unknown): void {
  detachInstallButton()
  app.className = 'error-shell'
  app.innerHTML = `
    <section class="error-card" role="alert">
      <p class="eyebrow">Impossible de démarrer</p>
      <h1>La pioche n’est pas disponible.</h1>
      <p>Le corpus embarqué est invalide. Réessayez après une mise à jour de l’application.</p>
      <details><summary>Détail technique</summary><p>${escapeHtml(error instanceof Error ? error.message : 'Erreur inconnue')}</p></details>
    </section>`
}

try {
  corpus = validateCorpus(rawCorpus)
  renderConfiguration()
  registerServiceWorker()
} catch (error) {
  renderCorpusError(error)
}
