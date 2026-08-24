import { THEMES } from './themes'
import type { GameSettings } from './types'

export function createDefaultSettings(): GameSettings {
  return {
    minLevel: 1,
    maxLevel: 5,
    selectedThemes: THEMES.map((theme) => theme.id),
    batchSize: 1,
    balanceThemes: false,
    balanceDifficulties: false,
  }
}

export function getLaunchProblem(settings: GameSettings, eligibleCount: number): string | null {
  if (settings.selectedThemes.length === 0) return 'Sélectionnez au moins un thème pour lancer une partie.'
  if (eligibleCount < settings.batchSize) {
    return `Seulement ${eligibleCount} mot${eligibleCount > 1 ? 's sont' : ' est'} disponible${eligibleCount > 1 ? 's' : ''}. Élargissez les critères ou réduisez la manche.`
  }
  return null
}
