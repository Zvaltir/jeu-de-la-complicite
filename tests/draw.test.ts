import { describe, expect, it } from 'vitest'
import { DrawEngine, assignEntriesToThemes, createSeededRng } from '../src/lib/draw'
import type { CorpusEntry, GameSettings, NotorietyLevel, ThemeId } from '../src/lib/types'

function entry(id: string, level: NotorietyLevel, themes: ThemeId[]): CorpusEntry {
  return { id, label: id, notorietyLevel: level, themes, enabled: true }
}

const baseSettings: GameSettings = {
  minLevel: 1,
  maxLevel: 5,
  selectedThemes: ['films', 'series'],
  batchSize: 1,
  balanceThemes: false,
  balanceDifficulties: false,
}

const entries = [
  entry('a', 1, ['films']), entry('b', 2, ['series']), entry('c', 3, ['films', 'series']),
  entry('d', 4, ['films']), entry('e', 5, ['series']),
]

describe('tirage commun', () => {
  it('produit des lots complets sans doublon et sans répétition avant épuisement', () => {
    const game = new DrawEngine(entries, { ...baseSettings, batchSize: 3 }, createSeededRng(12))
    const first = game.drawBatch()
    const second = game.drawBatch()
    expect(first.entries).toHaveLength(3)
    expect(new Set(first.entries.map(({ id }) => id))).toHaveLength(3)
    expect(second.entries).toHaveLength(3)
    expect(second.recycled).toBe(true)
    expect(new Set(second.entries.map(({ id }) => id))).toHaveLength(3)
    const consumedBeforeBoundary = new Set([...first.entries, second.entries[0]].map(({ id }) => id))
    expect(consumedBeforeBoundary).toHaveLength(4)
  })

  it('consomme le reliquat avant le nouveau cycle et signale seulement le recyclage', () => {
    const game = new DrawEngine(entries.slice(0, 4), { ...baseSettings, batchSize: 3 }, () => 0)
    const first = game.drawBatch()
    const second = game.drawBatch()
    expect(first.recycled).toBe(false)
    expect(second.recycled).toBe(true)
    expect(first.entries.map(({ id }) => id)).not.toContain(second.entries[0]?.id)
    expect(new Set([...first.entries, second.entries[0]].map((entry) => entry?.id))).toHaveLength(4)
    expect(new Set(second.entries.map(({ id }) => id))).toHaveLength(3)
  })

  it('refuse un RNG hors contrat', () => {
    expect(() => new DrawEngine(entries, baseSettings, () => 1)).toThrow(/RNG/u)
  })
})

describe('D0 — uniforme entre IDs', () => {
  it('mélange Fisher–Yates et garde chaque ID une fois par cycle', () => {
    const game = new DrawEngine(entries, baseSettings, createSeededRng(1))
    const ids = entries.map(() => game.drawBatch().entries[0]?.id)
    expect(new Set(ids)).toHaveLength(entries.length)
  })
})

describe('D1 — catégories', () => {
  it('affecte chaque entrée multi-thèmes à exactement un panier', () => {
    const buckets = assignEntriesToThemes(entries, ['films', 'series'], createSeededRng(2))
    const assignedIds = [...buckets.values()].flat().map(({ id }) => id)
    expect(assignedIds).toHaveLength(entries.length)
    expect(new Set(assignedIds)).toHaveLength(entries.length)
  })

  it('choisit une catégorie non vide avant une entrée et reconstruit au cycle suivant', () => {
    const game = new DrawEngine(entries, { ...baseSettings, balanceThemes: true }, createSeededRng(8))
    const firstCycle = entries.map(() => game.drawBatch().entries[0]?.id)
    expect(new Set(firstCycle)).toHaveLength(entries.length)
    game.drawBatch()
    expect(game.currentCycle).toBe(2)
  })

  it('donne le même ticket à une petite catégorie qu’à une grande', () => {
    const unbalanced = [
      entry('film-a', 1, ['films']),
      entry('film-b', 2, ['films']),
      entry('film-c', 3, ['films']),
      entry('series-only', 1, ['series']),
    ]
    const game = new DrawEngine(unbalanced, { ...baseSettings, balanceThemes: true }, () => 0.75)
    expect(game.drawBatch().entries[0]?.id).toBe('series-only')
  })
})

describe('D2 — difficultés', () => {
  it('choisit un niveau disponible avant une entrée', () => {
    const unbalanced = [entry('level-1-a', 1, ['films']), entry('level-1-b', 1, ['films']), entry('level-5', 5, ['films'])]
    const game = new DrawEngine(unbalanced, { ...baseSettings, balanceDifficulties: true }, () => 0.75)
    expect(game.drawBatch().entries[0]?.notorietyLevel).toBe(5)
  })
})

describe('D3 — cellules catégorie × difficulté', () => {
  it('ignore les cellules vides sans boucle ni répétition', () => {
    const sparse = [entry('only-a', 1, ['films']), entry('only-b', 5, ['series'])]
    const game = new DrawEngine(sparse, { ...baseSettings, batchSize: 2, balanceThemes: true, balanceDifficulties: true }, createSeededRng(5))
    expect(new Set(game.drawBatch().entries.map(({ id }) => id))).toHaveLength(2)
  })

  it('reste approximativement uniforme sur une matrice complète avec un RNG seedé', () => {
    const matrix = [entry('f1', 1, ['films']), entry('f2', 2, ['films']), entry('s1', 1, ['series']), entry('s2', 2, ['series'])]
    const counts = new Map<string, number>()
    const rng = createSeededRng(2026)
    for (let cycle = 0; cycle < 800; cycle += 1) {
      const game = new DrawEngine(matrix, { ...baseSettings, maxLevel: 2, balanceThemes: true, balanceDifficulties: true }, rng)
      const picked = game.drawBatch().entries[0]
      if (picked) counts.set(picked.id, (counts.get(picked.id) ?? 0) + 1)
    }
    for (const count of counts.values()) expect(count).toBeGreaterThan(150)
    expect(counts.size).toBe(4)
  })
})
