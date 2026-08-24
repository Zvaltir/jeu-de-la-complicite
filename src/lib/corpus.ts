import { THEME_IDS } from './themes'
import type { Corpus, CorpusEntry, DrawFilters, NotorietyLevel, ThemeId } from './types'

export class CorpusValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CorpusValidationError'
  }
}

export function normalizeLabel(label: string): string {
  return label.trim().normalize('NFKC').toLocaleLowerCase('und').replace(/\s+/gu, ' ')
}

function fail(path: string, message: string): never {
  throw new CorpusValidationError(`${path} : ${message}`)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseEntry(value: unknown, index: number): CorpusEntry {
  const path = `entries[${index}]`
  if (!isRecord(value)) fail(path, 'doit être un objet')
  const { id, label, notorietyLevel, themes, enabled } = value
  if (typeof id !== 'string' || id.trim() === '') fail(`${path}.id`, 'doit être une chaîne non vide')
  if (typeof label !== 'string' || label.trim() === '') fail(`${path}.label`, 'doit être une chaîne non vide')
  if (!Number.isInteger(notorietyLevel) || Number(notorietyLevel) < 1 || Number(notorietyLevel) > 5) {
    fail(`${path}.notorietyLevel`, 'doit être un entier compris entre 1 et 5')
  }
  if (!Array.isArray(themes) || themes.length === 0) fail(`${path}.themes`, 'doit être un tableau non vide')
  const parsedThemes: ThemeId[] = themes.map((theme, themeIndex) => {
    if (typeof theme !== 'string' || !THEME_IDS.has(theme as ThemeId)) {
      fail(`${path}.themes[${themeIndex}]`, `thème inconnu « ${String(theme)} »`)
    }
    return theme as ThemeId
  })
  if (new Set(parsedThemes).size !== parsedThemes.length) fail(`${path}.themes`, 'ne doit pas contenir de doublon')
  if (typeof enabled !== 'boolean') fail(`${path}.enabled`, 'doit être un booléen')
  return {
    id: id.trim(),
    label,
    notorietyLevel: notorietyLevel as NotorietyLevel,
    themes: parsedThemes,
    enabled,
  }
}

export function validateCorpus(value: unknown): Corpus {
  if (!isRecord(value)) fail('corpus', 'doit être un objet')
  if (value.schemaVersion !== 1) fail('schemaVersion', 'doit valoir 1')
  if (!Array.isArray(value.entries)) fail('entries', 'doit être un tableau')
  const entries = value.entries.map(parseEntry)
  const ids = new Set<string>()
  const labels = new Set<string>()
  for (const entry of entries) {
    if (ids.has(entry.id)) fail('entries', `ID dupliqué « ${entry.id} »`)
    ids.add(entry.id)
    const normalizedLabel = normalizeLabel(entry.label)
    if (labels.has(normalizedLabel)) fail('entries', `label dupliqué « ${entry.label} »`)
    labels.add(normalizedLabel)
  }
  return { schemaVersion: 1, entries }
}

export function getEligibleEntries(corpus: Corpus, filters: DrawFilters): CorpusEntry[] {
  const selectedThemes = new Set(filters.selectedThemes)
  const seenIds = new Set<string>()
  return corpus.entries.filter((entry) => {
    if (!entry.enabled || seenIds.has(entry.id)) return false
    if (entry.notorietyLevel < filters.minLevel || entry.notorietyLevel > filters.maxLevel) return false
    if (!entry.themes.some((theme) => selectedThemes.has(theme))) return false
    seenIds.add(entry.id)
    return true
  })
}

export function countEligibleEntries(corpus: Corpus, filters: DrawFilters): number {
  return getEligibleEntries(corpus, filters).length
}
