import { describe, expect, it } from 'vitest'
import { CorpusValidationError, getEligibleEntries, normalizeLabel, validateCorpus } from '../src/lib/corpus'
import type { Corpus, CorpusEntry, ThemeId } from '../src/lib/types'

function entry(overrides: Partial<CorpusEntry> = {}): CorpusEntry {
  return { id: 'entry.one', label: 'Entrée une', notorietyLevel: 3, themes: ['films'], enabled: true, ...overrides }
}

function raw(entries: unknown[] = [entry()]): unknown { return { schemaVersion: 1, entries } }

describe('validateCorpus', () => {
  it('accepte schemaVersion 1 et normalise le contrôle de labels', () => {
    expect(validateCorpus(raw()).entries).toHaveLength(1)
    expect(normalizeLabel('  École\t DU   Crime  ')).toBe('école du crime')
  })

  it.each([
    ['schemaVersion incorrect', { schemaVersion: 2, entries: [] }],
    ['entries absent', { schemaVersion: 1 }],
    ['ID vide', raw([entry({ id: ' ' })])],
    ['label vide', raw([entry({ label: ' ' })])],
    ['niveau 0', raw([entry({ notorietyLevel: 0 as never })])],
    ['niveau 6', raw([entry({ notorietyLevel: 6 as never })])],
    ['niveau décimal', raw([entry({ notorietyLevel: 2.5 as never })])],
    ['niveau texte', raw([{ ...entry(), notorietyLevel: '3' }])],
    ['thèmes vides', raw([entry({ themes: [] })])],
    ['thème inconnu', raw([entry({ themes: ['inconnu' as ThemeId] })])],
    ['enabled non booléen', raw([{ ...entry(), enabled: 'oui' }])],
  ])('refuse %s', (_label, value) => {
    expect(() => validateCorpus(value)).toThrow(CorpusValidationError)
  })

  it('refuse les ID et labels normalisés dupliqués', () => {
    expect(() => validateCorpus(raw([entry(), entry({ label: 'Autre' })]))).toThrow(/ID dupliqué/u)
    expect(() => validateCorpus(raw([entry(), entry({ id: 'entry.two', label: '  ENTRÉE   UNE ' })]))).toThrow(/label dupliqué/u)
  })
})

describe('getEligibleEntries', () => {
  const corpus: Corpus = {
    schemaVersion: 1,
    entries: [
      entry({ id: 'one', notorietyLevel: 1, themes: ['films'] }),
      entry({ id: 'two', notorietyLevel: 3, themes: ['films', 'series', 'personnages_fiction'] }),
      entry({ id: 'three', notorietyLevel: 5, themes: ['series'] }),
      entry({ id: 'disabled', notorietyLevel: 3, themes: ['films'], enabled: false }),
    ],
  }

  it('combine les thèmes en OU et les difficultés en ET', () => {
    expect(getEligibleEntries(corpus, { minLevel: 1, maxLevel: 5, selectedThemes: ['films'] }).map(({ id }) => id)).toEqual(['one', 'two'])
    expect(getEligibleEntries(corpus, { minLevel: 2, maxLevel: 4, selectedThemes: ['films', 'series'] }).map(({ id }) => id)).toEqual(['two'])
    expect(getEligibleEntries(corpus, { minLevel: 3, maxLevel: 3, selectedThemes: ['series'] }).map(({ id }) => id)).toEqual(['two'])
  })

  it('exclut disabled et ne duplique pas une entrée multi-thèmes', () => {
    const result = getEligibleEntries(corpus, { minLevel: 1, maxLevel: 5, selectedThemes: ['films', 'series', 'personnages_fiction'] })
    expect(result.map(({ id }) => id)).toEqual(['one', 'two', 'three'])
  })
})
