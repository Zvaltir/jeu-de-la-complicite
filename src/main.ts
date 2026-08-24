import './style.css'
import corpus from './data/words.json'
import { THEMES } from './lib/themes'

const app = document.querySelector<HTMLElement>('#app')

if (!app) {
  throw new Error('Élément #app introuvable')
}

app.innerHTML = `
  <section class="bootstrap" aria-labelledby="title">
    <p class="eyebrow">Phase 0</p>
    <h1 id="title">Jeu de la complicité</h1>
    <p>Le socle technique est prêt pour la première mission Codex.</p>
    <dl>
      <div><dt>Entrées factices</dt><dd>${corpus.entries.length}</dd></div>
      <div><dt>Thèmes canoniques</dt><dd>${THEMES.length}</dd></div>
    </dl>
  </section>
`
