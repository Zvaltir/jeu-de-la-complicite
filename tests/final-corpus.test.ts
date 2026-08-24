import { describe, expect, it } from 'vitest'
import rawCorpus from '../src/data/words.json'
import { countEligibleEntries, getEligibleEntries, normalizeLabel, validateCorpus } from '../src/lib/corpus'
import { assignEntriesToThemes, createSeededRng, DrawEngine } from '../src/lib/draw'
import { getLaunchProblem } from '../src/lib/settings'
import { THEMES } from '../src/lib/themes'
import type { CorpusEntry, GameSettings, NotorietyLevel, ThemeId } from '../src/lib/types'

const corpus = validateCorpus(rawCorpus)
const themeIds = THEMES.map(({ id }) => id)

const expectedByLevel: Record<NotorietyLevel, number> = {
  1: 256,
  2: 1264,
  3: 2641,
  4: 1031,
  5: 727,
}

const expectedByTheme: Record<ThemeId, number> = {
  films: 909,
  series: 340,
  dessins_animes: 266,
  mangas_anime: 377,
  litterature: 466,
  bd_comics: 265,
  personnages_fiction: 693,
  musique: 603,
  jeux_video: 504,
  internet_web: 243,
  sport: 487,
  personnalites_contemporaines: 902,
  personnalites_historiques: 405,
  histoire: 763,
  politique_societe: 438,
}

const expectedMatrix: Record<ThemeId, readonly number[]> = {
  films: [58, 151, 583, 58, 59],
  series: [11, 92, 120, 60, 57],
  dessins_animes: [22, 52, 85, 57, 50],
  mangas_anime: [5, 27, 218, 70, 57],
  litterature: [28, 134, 197, 50, 57],
  bd_comics: [10, 50, 81, 59, 65],
  personnages_fiction: [50, 209, 192, 183, 59],
  musique: [12, 134, 326, 64, 67],
  jeux_video: [6, 50, 219, 171, 58],
  internet_web: [11, 58, 50, 61, 63],
  sport: [27, 113, 242, 52, 53],
  personnalites_contemporaines: [23, 223, 506, 93, 57],
  personnalites_historiques: [22, 100, 164, 58, 61],
  histoire: [41, 208, 344, 101, 69],
  politique_societe: [50, 112, 71, 142, 63],
}

function settings(overrides: Partial<GameSettings> = {}): GameSettings {
  return {
    minLevel: 1,
    maxLevel: 5,
    selectedThemes: [...themeIds],
    batchSize: 1,
    balanceThemes: false,
    balanceDifficulties: false,
    ...overrides,
  }
}

function eligible(overrides: Partial<GameSettings> = {}): CorpusEntry[] {
  return getEligibleEntries(corpus, settings(overrides))
}

describe('corpus final V1.1', () => {
  it('correspond aux totaux et distributions du rapport fourni', () => {
    expect(corpus.schemaVersion).toBe(1)
    expect(corpus.entries).toHaveLength(5919)
    expect(corpus.entries.filter(({ enabled }) => enabled)).toHaveLength(5919)
    expect(new Set(corpus.entries.map(({ id }) => id)).size).toBe(5919)
    expect(new Set(corpus.entries.map(({ label }) => normalizeLabel(label))).size).toBe(5919)
    expect(new Set(corpus.entries.map((entry) => Object.keys(entry).sort().join(',')))).toEqual(
      new Set(['enabled,id,label,notorietyLevel,themes']),
    )

    for (const level of [1, 2, 3, 4, 5] as const) {
      expect(corpus.entries.filter((entry) => entry.notorietyLevel === level)).toHaveLength(expectedByLevel[level])
    }
    for (const theme of themeIds) {
      expect(corpus.entries.filter((entry) => entry.themes.includes(theme))).toHaveLength(expectedByTheme[theme])
    }

    const themeMultiplicity = new Map<number, number>()
    for (const entry of corpus.entries) {
      themeMultiplicity.set(entry.themes.length, (themeMultiplicity.get(entry.themes.length) ?? 0) + 1)
    }
    expect(Object.fromEntries(themeMultiplicity)).toEqual({ 1: 4304, 2: 1492, 3: 119, 4: 4 })
  })

  it('reproduit la matrice thème × difficulté et ses cellules rares', () => {
    const cells: Array<{ theme: ThemeId; level: NotorietyLevel; count: number }> = []
    for (const theme of themeIds) {
      for (const level of [1, 2, 3, 4, 5] as const) {
        const count = corpus.entries.filter(
          (entry) => entry.enabled && entry.notorietyLevel === level && entry.themes.includes(theme),
        ).length
        cells.push({ theme, level, count })
        expect(count).toBe(expectedMatrix[theme][level - 1])
      }
    }
    expect(cells.every(({ count }) => count > 0)).toBe(true)
    expect(cells.filter(({ count }) => count < 50)).toHaveLength(13)
    expect(cells.reduce((minimum, cell) => (cell.count < minimum.count ? cell : minimum))).toEqual({
      theme: 'mangas_anime',
      level: 1,
      count: 5,
    })
  })
})

describe('filtres réels et lancement', () => {
  it('couvre les intervalles, thèmes dense et rare, OU et cellule manga N2', () => {
    expect(eligible()).toHaveLength(5919)
    expect(eligible({ minLevel: 1, maxLevel: 1 })).toHaveLength(256)
    expect(eligible({ minLevel: 5, maxLevel: 5 })).toHaveLength(727)
    expect(eligible({ minLevel: 2, maxLevel: 4 })).toHaveLength(4936)
    expect(eligible({ selectedThemes: ['films'] })).toHaveLength(909)
    expect(eligible({ selectedThemes: ['internet_web'] })).toHaveLength(243)
    expect(eligible({ selectedThemes: ['films', 'series'] })).toHaveLength(1247)
    expect(eligible({ minLevel: 2, maxLevel: 2, selectedThemes: ['mangas_anime'] })).toHaveLength(27)
  })

  it('exerce trois cellules proches du minimum et les tailles de manche 1, 3, 5 et 10', () => {
    const rareCases: Array<[ThemeId, number, number]> = [
      ['mangas_anime', 1, 5],
      ['jeux_video', 1, 6],
      ['bd_comics', 1, 10],
    ]
    for (const [theme, level, expectedCount] of rareCases) {
      const pool = eligible({ minLevel: level as NotorietyLevel, maxLevel: level as NotorietyLevel, selectedThemes: [theme] })
      expect(pool).toHaveLength(expectedCount)
      const game = new DrawEngine(
        pool,
        settings({
          minLevel: level as NotorietyLevel,
          maxLevel: level as NotorietyLevel,
          selectedThemes: [theme],
          batchSize: expectedCount,
        }),
        createSeededRng(expectedCount),
      )
      expect(new Set(game.drawBatch().entries.map(({ id }) => id)).size).toBe(expectedCount)
    }
    for (const batchSize of [1, 3, 5, 10]) {
      expect(new DrawEngine(eligible(), settings({ batchSize }), createSeededRng(batchSize)).drawBatch().entries).toHaveLength(batchSize)
    }
  })

  it('bloque un lot trop grand et garde le compteur indépendant des égalisations', () => {
    const filters = settings({ minLevel: 1, maxLevel: 1, selectedThemes: ['mangas_anime'], batchSize: 10 })
    const count = countEligibleEntries(corpus, filters)
    expect(count).toBe(5)
    expect(getLaunchProblem(filters, count)).toMatch(/Seulement 5 mots/u)
    const balancedFilters: GameSettings = { ...filters, balanceThemes: true, balanceDifficulties: true }
    expect(countEligibleEntries(corpus, balancedFilters)).toBe(count)
  })
})

describe('moteur sur le corpus final', () => {
  it.each([1, 3, 5, 10])('D0 parcourt un cycle complet et franchit correctement la frontière par lots de %i', (batchSize) => {
    const pool = eligible()
    const game = new DrawEngine(pool, settings({ batchSize }), createSeededRng(5919 + batchSize))
    const beforeBoundary: CorpusEntry[] = []
    let recycledBeforeBoundary = false
    const completeBatches = Math.floor(pool.length / batchSize)
    for (let batchIndex = 0; batchIndex < completeBatches; batchIndex += 1) {
      const batch = game.drawBatch()
      recycledBeforeBoundary ||= batch.recycled
      beforeBoundary.push(...batch.entries)
    }
    expect(recycledBeforeBoundary).toBe(false)
    expect(new Set(beforeBoundary.map(({ id }) => id)).size).toBe(beforeBoundary.length)

    const unseenCount = pool.length - beforeBoundary.length
    const boundary = game.drawBatch()
    expect(boundary.recycled).toBe(true)
    expect(new Set(boundary.entries.map(({ id }) => id)).size).toBe(batchSize)
    const seen = new Set(beforeBoundary.map(({ id }) => id))
    expect(boundary.entries.slice(0, unseenCount).every(({ id }) => !seen.has(id))).toBe(true)
    boundary.entries.slice(0, unseenCount).forEach(({ id }) => seen.add(id))
    expect(seen.size).toBe(pool.length)
  }, 20_000)

  it('D1 affecte chaque ID à un seul panier et équilibre un long début de cycle', () => {
    const pool = eligible()
    const seed = 1501
    const assignment = assignEntriesToThemes(pool, themeIds, createSeededRng(seed))
    const assignedThemeById = new Map<string, ThemeId>()
    for (const [theme, entries] of assignment) {
      for (const entry of entries) {
        expect(assignedThemeById.has(entry.id)).toBe(false)
        assignedThemeById.set(entry.id, theme)
      }
    }
    expect(assignedThemeById.size).toBe(pool.length)

    const game = new DrawEngine(pool, settings({ balanceThemes: true }), createSeededRng(seed))
    const counts = new Map<ThemeId, number>(themeIds.map((theme) => [theme, 0]))
    for (let index = 0; index < 1200; index += 1) {
      const drawn = game.drawBatch().entries[0]
      const assignedTheme = drawn ? assignedThemeById.get(drawn.id) : undefined
      if (!assignedTheme) throw new Error('Entrée tirée sans panier exclusif')
      counts.set(assignedTheme, (counts.get(assignedTheme) ?? 0) + 1)
    }
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(50)
      expect(count).toBeLessThan(110)
    }
  })

  it('D2 choisit d’abord la difficulté et équilibre les cinq niveaux disponibles', () => {
    const game = new DrawEngine(eligible(), settings({ balanceDifficulties: true }), createSeededRng(2502))
    const counts = new Map<NotorietyLevel, number>([1, 2, 3, 4, 5].map((level) => [level as NotorietyLevel, 0]))
    for (let index = 0; index < 1000; index += 1) {
      const drawn = game.drawBatch().entries[0]
      if (!drawn) throw new Error('Tirage de difficulté vide')
      counts.set(drawn.notorietyLevel, (counts.get(drawn.notorietyLevel) ?? 0) + 1)
    }
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(160)
      expect(count).toBeLessThan(240)
    }
  })

  it('D3 équilibre les cellules denses et garde une seule cellule par ID multi-thèmes', () => {
    const selectedThemes: ThemeId[] = ['films', 'internet_web', 'politique_societe']
    const pool = eligible({ minLevel: 3, maxLevel: 5, selectedThemes })
    const seed = 3503
    const assignment = assignEntriesToThemes(pool, selectedThemes, createSeededRng(seed))
    const assignedCellById = new Map<string, string>()
    for (const [theme, entries] of assignment) {
      for (const entry of entries) {
        expect(assignedCellById.has(entry.id)).toBe(false)
        assignedCellById.set(entry.id, `${theme}|${entry.notorietyLevel}`)
      }
    }
    expect(assignedCellById.size).toBe(pool.length)
    expect(new Set(assignedCellById.values()).size).toBe(9)

    const game = new DrawEngine(
      pool,
      settings({ minLevel: 3, maxLevel: 5, selectedThemes, balanceThemes: true, balanceDifficulties: true }),
      createSeededRng(seed),
    )
    const counts = new Map<string, number>()
    for (let index = 0; index < 270; index += 1) {
      const drawn = game.drawBatch().entries[0]
      const cell = drawn ? assignedCellById.get(drawn.id) : undefined
      if (!cell) throw new Error('Entrée tirée sans cellule exclusive')
      counts.set(cell, (counts.get(cell) ?? 0) + 1)
    }
    expect(counts.size).toBe(9)
    for (const count of counts.values()) {
      expect(count).toBeGreaterThan(14)
      expect(count).toBeLessThan(46)
    }
  })

  it('D3 joue puis recycle intégralement la cellule réelle la plus rare', () => {
    const pool = eligible({ minLevel: 1, maxLevel: 1, selectedThemes: ['mangas_anime'] })
    const rareSettings = settings({
      minLevel: 1,
      maxLevel: 1,
      selectedThemes: ['mangas_anime'],
      batchSize: 5,
      balanceThemes: true,
      balanceDifficulties: true,
    })
    const game = new DrawEngine(pool, rareSettings, createSeededRng(4504))
    const first = game.drawBatch()
    const second = game.drawBatch()
    expect(first.recycled).toBe(false)
    expect(second.recycled).toBe(true)
    expect(new Set(first.entries.map(({ id }) => id)).size).toBe(5)
    expect(new Set(second.entries.map(({ id }) => id)).size).toBe(5)
  })
})
