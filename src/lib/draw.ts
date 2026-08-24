import type { CorpusEntry, DrawBatch, GameSettings, ThemeId } from './types'

export type RandomSource = () => number

function randomIndex(length: number, rng: RandomSource): number {
  if (length <= 0) throw new Error('Impossible de tirer dans une liste vide')
  const value = rng()
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Le RNG doit retourner un nombre compris entre 0 inclus et 1 exclu')
  return Math.floor(value * length)
}

export function shuffle<T>(values: readonly T[], rng: RandomSource): T[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomIndex(index + 1, rng)
    ;[result[index], result[target]] = [result[target] as T, result[index] as T]
  }
  return result
}

export function createSeededRng(seed: number): RandomSource {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function matchingThemes(entry: CorpusEntry, selectedThemes: ReadonlySet<ThemeId>): ThemeId[] {
  return entry.themes.filter((theme) => selectedThemes.has(theme))
}

export function assignEntriesToThemes(entries: readonly CorpusEntry[], selectedThemes: readonly ThemeId[], rng: RandomSource): Map<ThemeId, CorpusEntry[]> {
  const selected = new Set(selectedThemes)
  const buckets = new Map<ThemeId, CorpusEntry[]>(selectedThemes.map((theme) => [theme, []]))
  const shared: CorpusEntry[] = []
  for (const entry of entries) {
    const matches = matchingThemes(entry, selected)
    if (matches.length === 1) buckets.get(matches[0] as ThemeId)?.push(entry)
    else if (matches.length > 1) shared.push(entry)
  }
  for (const entry of shuffle(shared, rng)) {
    const matches = matchingThemes(entry, selected)
    const smallestSize = Math.min(...matches.map((theme) => buckets.get(theme)?.length ?? 0))
    const candidates = matches.filter((theme) => (buckets.get(theme)?.length ?? 0) === smallestSize)
    const assignedTheme = candidates[randomIndex(candidates.length, rng)] as ThemeId
    buckets.get(assignedTheme)?.push(entry)
  }
  return buckets
}

function removeRandomEntry(entries: CorpusEntry[], excludedIds: ReadonlySet<string>, rng: RandomSource): CorpusEntry | null {
  const candidates = entries.filter((entry) => !excludedIds.has(entry.id))
  if (candidates.length === 0) return null
  const chosen = candidates[randomIndex(candidates.length, rng)] as CorpusEntry
  entries.splice(entries.findIndex((entry) => entry.id === chosen.id), 1)
  return chosen
}

export class DrawEngine {
  private remainingIds = new Set<string>()
  private uniformQueue: CorpusEntry[] = []
  private buckets = new Map<string, CorpusEntry[]>()
  private cycleNumber = 0

  constructor(private readonly entries: readonly CorpusEntry[], private readonly settings: Readonly<GameSettings>, private readonly rng: RandomSource = Math.random) {
    if (entries.length < settings.batchSize) throw new Error('Le pool admissible est trop petit pour cette manche')
    if (settings.batchSize < 1 || settings.batchSize > 10) throw new Error('La taille de manche doit être comprise entre 1 et 10')
    this.startCycle()
  }

  get currentCycle(): number { return this.cycleNumber }

  private startCycle(): void {
    this.cycleNumber += 1
    this.remainingIds = new Set(this.entries.map((entry) => entry.id))
    this.uniformQueue = []
    this.buckets = new Map()
    if (!this.settings.balanceThemes && !this.settings.balanceDifficulties) {
      this.uniformQueue = shuffle(this.entries, this.rng)
      return
    }
    if (this.settings.balanceThemes) {
      const themeBuckets = assignEntriesToThemes(this.entries, this.settings.selectedThemes, this.rng)
      for (const [theme, themeEntries] of themeBuckets) {
        if (this.settings.balanceDifficulties) {
          for (const entry of themeEntries) {
            const key = `${theme}|${entry.notorietyLevel}`
            const cell = this.buckets.get(key) ?? []
            cell.push(entry)
            this.buckets.set(key, cell)
          }
        } else this.buckets.set(theme, [...themeEntries])
      }
      return
    }
    for (const entry of this.entries) {
      const key = String(entry.notorietyLevel)
      const bucket = this.buckets.get(key) ?? []
      bucket.push(entry)
      this.buckets.set(key, bucket)
    }
  }

  private drawOne(excludedIds: ReadonlySet<string>): CorpusEntry | null {
    if (!this.settings.balanceThemes && !this.settings.balanceDifficulties) {
      const index = this.uniformQueue.findIndex((entry) => !excludedIds.has(entry.id))
      if (index < 0) return null
      const [entry] = this.uniformQueue.splice(index, 1)
      if (!entry) return null
      this.remainingIds.delete(entry.id)
      return entry
    }
    const availableBuckets = [...this.buckets.entries()].filter(([, entries]) => entries.some((entry) => !excludedIds.has(entry.id)))
    if (availableBuckets.length === 0) return null
    const [, chosenBucket] = availableBuckets[randomIndex(availableBuckets.length, this.rng)] as [string, CorpusEntry[]]
    const entry = removeRandomEntry(chosenBucket, excludedIds, this.rng)
    if (entry) this.remainingIds.delete(entry.id)
    return entry
  }

  drawBatch(): DrawBatch {
    const entries: CorpusEntry[] = []
    const batchIds = new Set<string>()
    let recycled = false
    while (entries.length < this.settings.batchSize) {
      if (this.remainingIds.size === 0) {
        this.startCycle()
        recycled = true
      }
      const entry = this.drawOne(batchIds)
      if (!entry) {
        if (this.remainingIds.size > 0) throw new Error('Impossible de compléter la manche sans doublon')
        continue
      }
      entries.push(entry)
      batchIds.add(entry.id)
    }
    return { entries, recycled }
  }
}
