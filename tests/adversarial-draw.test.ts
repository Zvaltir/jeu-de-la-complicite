import { describe, expect, it } from 'vitest'
import rawCorpus from '../src/data/words.json'
import { getEligibleEntries, validateCorpus } from '../src/lib/corpus'
import { assignEntriesToThemes, createSeededRng, DrawEngine, type RandomSource } from '../src/lib/draw'
import { THEMES } from '../src/lib/themes'
import type { CorpusEntry, GameSettings, NotorietyLevel, ThemeId } from '../src/lib/types'

const corpus = validateCorpus(rawCorpus)
const themeIds = THEMES.map(({ id }) => id)

function entry(id: string, level: NotorietyLevel, themes: ThemeId[]): CorpusEntry {
  return { id, label: id, notorietyLevel: level, themes, enabled: true }
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

function assertConsecutiveCycles(
  entries: readonly CorpusEntry[],
  gameSettings: GameSettings,
  rng: RandomSource,
  cycleCount = 2,
): void {
  const game = new DrawEngine(entries, gameSettings, rng)
  const ids: string[] = []
  let recycledBatches = 0
  while (ids.length < entries.length * cycleCount) {
    const batch = game.drawBatch()
    if (batch.recycled) recycledBatches += 1
    expect(batch.entries).toHaveLength(gameSettings.batchSize)
    expect(new Set(batch.entries.map(({ id }) => id)).size).toBe(gameSettings.batchSize)
    ids.push(...batch.entries.map(({ id }) => id))
  }
  for (let cycle = 0; cycle < cycleCount; cycle += 1) {
    const cycleIds = ids.slice(cycle * entries.length, (cycle + 1) * entries.length)
    expect(cycleIds).toHaveLength(entries.length)
    expect(new Set(cycleIds).size).toBe(entries.length)
  }
  expect(recycledBatches).toBeGreaterThanOrEqual(cycleCount - 1)
}

describe('QA adversariale D0', () => {
  it.each([1, 2, 3, 5, 7, 10])('conserve les invariants sur deux cycles complets par lots de %i', (batchSize) => {
    assertConsecutiveCycles(corpus.entries, settings({ batchSize }), createSeededRng(20_000 + batchSize))
  }, 20_000)

  it('supporte les RNG valides pathologiques sans doublon ni blocage', () => {
    const sample = corpus.entries.slice(0, 37)
    const repeatedValues = [0, 1 - Number.EPSILON, 0.5]
    let index = 0
    const repeatedRng = () => repeatedValues[(index += 1) % repeatedValues.length] as number
    for (const rng of [() => 0, () => 1 - Number.EPSILON, repeatedRng]) {
      assertConsecutiveCycles(sample, settings({ batchSize: 7 }), rng, 3)
    }
  })

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -0.01, 1])('rejette le RNG invalide %s', (value) => {
    expect(() => new DrawEngine(corpus.entries.slice(0, 3), settings(), () => value)).toThrow(/RNG/u)
  })
})

describe('QA adversariale D1', () => {
  it('résiste à deux thèmes fortement chevauchants et très déséquilibrés', () => {
    const overlapping = [
      ...Array.from({ length: 20 }, (_, index) => entry(`film-${index}`, 2, ['films'])),
      ...Array.from({ length: 2 }, (_, index) => entry(`series-${index}`, 2, ['series'])),
      ...Array.from({ length: 40 }, (_, index) => entry(`shared-${index}`, 3, ['films', 'series'])),
    ]
    const assignment = assignEntriesToThemes(overlapping, ['films', 'series'], createSeededRng(31))
    const assignedIds = [...assignment.values()].flat().map(({ id }) => id)
    expect(assignedIds).toHaveLength(overlapping.length)
    expect(new Set(assignedIds).size).toBe(overlapping.length)
    assertConsecutiveCycles(
      overlapping,
      settings({ selectedThemes: ['films', 'series'], batchSize: 7, balanceThemes: true }),
      createSeededRng(32),
      3,
    )
  })

  it('reconstruit les paniers au nouveau cycle avec un ou quinze thèmes', () => {
    for (const selectedThemes of [['films'] as ThemeId[], themeIds]) {
      const pool = getEligibleEntries(corpus, settings({ selectedThemes }))
      let calls = 0
      const seeded = createSeededRng(selectedThemes.length + 40)
      const countingRng = () => { calls += 1; return seeded() }
      const game = new DrawEngine(pool, settings({ selectedThemes, balanceThemes: true }), countingRng)
      const callsAfterConstruction = calls
      for (let index = 0; index <= pool.length; index += 1) game.drawBatch()
      expect(game.currentCycle).toBe(2)
      expect(calls).toBeGreaterThan(callsAfterConstruction + pool.length)
    }
  }, 20_000)
})

describe('QA adversariale D2', () => {
  it.each([
    [1, 5],
    [2, 4],
    [3, 3],
  ] as const)('préserve les cycles pour la plage %i–%i', (minLevel, maxLevel) => {
    const pool = getEligibleEntries(corpus, settings({ minLevel, maxLevel }))
    assertConsecutiveCycles(
      pool,
      settings({ minLevel, maxLevel, batchSize: 7, balanceDifficulties: true }),
      createSeededRng(minLevel * 100 + maxLevel),
    )
  }, 20_000)

  it('continue quand un petit niveau s’épuise longtemps avant les autres', () => {
    const unbalanced = [
      entry('rare', 1, ['films']),
      ...Array.from({ length: 29 }, (_, index) => entry(`common-${index}`, 5, ['films'])),
    ]
    assertConsecutiveCycles(
      unbalanced,
      settings({ selectedThemes: ['films'], batchSize: 10, balanceDifficulties: true }),
      createSeededRng(51),
      3,
    )
  })
})

describe('QA adversariale D3', () => {
  it('termine plusieurs cycles sur des matrices complète puis clairsemée', () => {
    const complete = [
      entry('f1', 1, ['films']), entry('f2', 2, ['films']), entry('f3', 3, ['films']),
      entry('s1', 1, ['series']), entry('s2', 2, ['series']), entry('s3', 3, ['series']),
      entry('shared', 2, ['films', 'series']),
    ]
    const sparse = [
      entry('only-f1', 1, ['films']), entry('only-f5', 5, ['films']),
      entry('only-s3', 3, ['series']), entry('shared-fs', 4, ['films', 'series']),
    ]
    for (const [entries, batchSize] of [[complete, 5], [sparse, 3]] as const) {
      assertConsecutiveCycles(
        entries,
        settings({ selectedThemes: ['films', 'series'], batchSize, balanceThemes: true, balanceDifficulties: true }),
        createSeededRng(entries.length + 60),
        4,
      )
    }
  })

  it.each([
    ['mangas_anime', 1, 5],
    ['jeux_video', 1, 6],
    ['bd_comics', 1, 10],
  ] as const)('franchit les cycles de la cellule réelle %s N%i (%i entrées)', (theme, level, expectedCount) => {
    const pool = getEligibleEntries(corpus, settings({ selectedThemes: [theme], minLevel: level, maxLevel: level }))
    expect(pool).toHaveLength(expectedCount)
    assertConsecutiveCycles(
      pool,
      settings({
        selectedThemes: [theme],
        minLevel: level,
        maxLevel: level,
        batchSize: expectedCount,
        balanceThemes: true,
        balanceDifficulties: true,
      }),
      createSeededRng(expectedCount + 70),
      4,
    )
  })
})

describe('exhaustivité déterministe des filtres', () => {
  it('couvre chaque thème seul et les quinze intervalles continus', () => {
    for (const theme of themeIds) {
      for (let minLevel = 1; minLevel <= 5; minLevel += 1) {
        for (let maxLevel = minLevel; maxLevel <= 5; maxLevel += 1) {
          const filters = settings({
            minLevel: minLevel as NotorietyLevel,
            maxLevel: maxLevel as NotorietyLevel,
            selectedThemes: [theme],
          })
          const pool = getEligibleEntries(corpus, filters)
          const expectedIds = corpus.entries
            .filter((candidate) => candidate.enabled
              && candidate.notorietyLevel >= minLevel
              && candidate.notorietyLevel <= maxLevel
              && candidate.themes.includes(theme))
            .map(({ id }) => id)
          expect(pool.map(({ id }) => id)).toEqual(expectedIds)
          const batchSize = Math.min(10, pool.length)
          for (const [balanceThemes, balanceDifficulties] of [[false, false], [true, false], [false, true], [true, true]]) {
            const batch = new DrawEngine(
              pool,
              { ...filters, batchSize, balanceThemes, balanceDifficulties },
              createSeededRng(minLevel * 1000 + maxLevel * 100 + themeIds.indexOf(theme)),
            ).drawBatch()
            expect(batch.entries).toHaveLength(batchSize)
            expect(new Set(batch.entries.map(({ id }) => id)).size).toBe(batchSize)
          }
        }
      }
    }
  }, 20_000)

  it('couvre des sous-ensembles seedés et toutes les tailles de lot 1 à 10', () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const selectedThemes = themeIds.filter((_, index) => (index * 7 + seed * 3) % 5 < 2)
      const minLevel = ((seed - 1) % 5 + 1) as NotorietyLevel
      const maxLevel = Math.min(5, minLevel + seed % (6 - minLevel)) as NotorietyLevel
      const filters = settings({ selectedThemes, minLevel, maxLevel })
      const pool = getEligibleEntries(corpus, filters)
      for (let batchSize = 1; batchSize <= 10 && batchSize <= pool.length; batchSize += 1) {
        for (const [balanceThemes, balanceDifficulties] of [[false, false], [true, false], [false, true], [true, true]]) {
          const batch = new DrawEngine(
            pool,
            { ...filters, batchSize, balanceThemes, balanceDifficulties },
            createSeededRng(seed * 100 + batchSize),
          ).drawBatch()
          expect(batch.entries).toHaveLength(batchSize)
          expect(new Set(batch.entries.map(({ id }) => id)).size).toBe(batchSize)
        }
      }
    }
  }, 20_000)
})
