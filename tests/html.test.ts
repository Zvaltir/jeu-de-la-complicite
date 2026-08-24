import { describe, expect, it } from 'vitest'
import { escapeHtml } from '../src/lib/html'

describe('échappement HTML des labels', () => {
  it('neutralise balises, attributs, esperluette et guillemets', () => {
    const malicious = `<img src=x onerror="globalThis.compromised=true"> & 'référence'`
    const escaped = escapeHtml(malicious)
    expect(escaped).toBe('&lt;img src=x onerror=&quot;globalThis.compromised=true&quot;&gt; &amp; &#39;référence&#39;')
    expect(escaped).not.toContain('<img')
  })
})
