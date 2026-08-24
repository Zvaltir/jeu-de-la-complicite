export type NotorietyLevel = 1 | 2 | 3 | 4 | 5

export type ThemeId =
  | 'films'
  | 'series'
  | 'dessins_animes'
  | 'mangas_anime'
  | 'litterature'
  | 'bd_comics'
  | 'personnages_fiction'
  | 'musique'
  | 'jeux_video'
  | 'internet_web'
  | 'sport'
  | 'personnalites_contemporaines'
  | 'personnalites_historiques'
  | 'histoire'
  | 'politique_societe'

export interface CorpusEntry {
  id: string
  label: string
  notorietyLevel: NotorietyLevel
  themes: ThemeId[]
  enabled: boolean
}

export interface Corpus {
  schemaVersion: 1
  entries: CorpusEntry[]
}

export interface DrawFilters {
  minLevel: NotorietyLevel
  maxLevel: NotorietyLevel
  selectedThemes: ThemeId[]
}

export interface GameSettings extends DrawFilters {
  batchSize: number
  balanceThemes: boolean
  balanceDifficulties: boolean
}

export interface DrawBatch {
  entries: CorpusEntry[]
  recycled: boolean
}
