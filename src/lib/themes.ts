import type { ThemeId } from './types'

export const THEMES: ReadonlyArray<{ id: ThemeId; label: string }> = [
  { id: 'films', label: 'Films' },
  { id: 'series', label: 'Séries télévisées' },
  { id: 'dessins_animes', label: 'Dessins animés' },
  { id: 'mangas_anime', label: 'Mangas & anime' },
  { id: 'litterature', label: 'Littérature' },
  { id: 'bd_comics', label: 'BD & comics' },
  { id: 'personnages_fiction', label: 'Personnages de fiction' },
  { id: 'musique', label: 'Musique' },
  { id: 'jeux_video', label: 'Jeux vidéo' },
  { id: 'internet_web', label: 'Internet & culture web' },
  { id: 'sport', label: 'Sport' },
  { id: 'personnalites_contemporaines', label: 'Personnalités contemporaines' },
  { id: 'personnalites_historiques', label: 'Personnalités historiques' },
  { id: 'histoire', label: 'Histoire' },
  { id: 'politique_societe', label: 'Politique & société' },
] as const

export const THEME_IDS = new Set<ThemeId>(THEMES.map((theme) => theme.id))
