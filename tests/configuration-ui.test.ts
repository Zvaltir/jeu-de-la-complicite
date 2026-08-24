import { describe, expect, it } from 'vitest'
import mainSource from '../src/main.ts?raw'

interface BuiltInFs {
  readFileSync(path: URL, encoding: 'utf8'): string
}

interface NodeProcess {
  getBuiltinModule(name: 'fs'): BuiltInFs
}

const nodeProcess = (globalThis as unknown as { process: NodeProcess }).process
const styleSource = nodeProcess.getBuiltinModule('fs').readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

describe('en-tête de Configuration', () => {
  it('supprime l’ancienne accroche sans remplacement', () => {
    expect(mainSource).not.toContain('Réglez la pioche')
    expect(mainSource).not.toContain('class="intro"')
    expect(styleSource).not.toContain('.intro')
  })

  it('conserve complicité dans un segment coloré non sécable', () => {
    expect(mainSource).toContain('<span class="title-line">Jeu de la</span> <span class="title-accent">complicité</span>')
    expect(styleSource).toContain('.hero h1 .title-accent { color: var(--coral); white-space: nowrap; }')
  })
})
