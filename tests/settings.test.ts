import { describe, expect, it } from 'vitest'
import { createDefaultSettings, getLaunchProblem } from '../src/lib/settings'

describe('configuration', () => {
  it('applique les valeurs initiales normatives', () => {
    const settings = createDefaultSettings()
    expect(settings).toMatchObject({ minLevel: 1, maxLevel: 5, batchSize: 1, balanceThemes: false, balanceDifficulties: false })
    expect(settings.selectedThemes).toHaveLength(15)
  })

  it('bloque zéro thème et un pool insuffisant sans tenir compte des égalisations', () => {
    const settings = createDefaultSettings()
    expect(getLaunchProblem({ ...settings, selectedThemes: [] }, 20)).toMatch(/au moins un thème/u)
    expect(getLaunchProblem({ ...settings, batchSize: 10 }, 9)).toMatch(/Seulement 9 mots/u)
    expect(getLaunchProblem({ ...settings, balanceThemes: true, balanceDifficulties: true }, 20)).toBeNull()
  })
})
