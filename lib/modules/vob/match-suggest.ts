import type { Company } from './types'

export interface SuggestedMatch {
  company: Company
  score: number
  relevance: 'high' | 'medium' | 'low'
  matchedTerms: string[]
}

/**
 * Normalisiert deutschen Text: Kleinbuchstaben + Umlaut-Expansion.
 * "Tischlerarbeiten" → "tischlerarbeiten", "Böden" → "boden" (via ö→oe etc.)
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

/**
 * Prüft ob ein Begriff als ganzes Wort im Text vorkommt (Wortgrenzen-Matching).
 * Verhindert falsche Treffer wie "Maler" in "Metallarbeiten".
 */
function wordMatch(text: string, term: string): boolean {
  const t = normalize(text)
  const k = normalize(term)
  // Wortgrenze: kein Buchstabe/Ziffer direkt davor oder danach
  const pattern = new RegExp(`(?<![a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`, 'i')
  return pattern.test(t) || t.includes(k)
}

/**
 * Berechnet den Relevanz-Level basierend auf dem Score.
 */
function scoreToRelevance(score: number): 'high' | 'medium' | 'low' {
  if (score >= 6) return 'high'
  if (score >= 3) return 'medium'
  return 'low'
}

/**
 * Gibt ALLE Unternehmen zurück, die zu einer Ausschreibung passen (Score ≥ 2).
 * Mehrere Unternehmen können gleichzeitig relevant sein (z.B. Rohbau + Gerüst).
 *
 * Scoring-Modell:
 * - Gewerk exakt in Kategorie gefunden:  +5
 * - Keyword exakt in Kategorie gefunden: +3
 * - Gewerk exakt im Titel gefunden:      +2
 * - Keyword exakt im Titel gefunden:     +1
 */
export function suggestCompanies(
  category: string | null,
  title: string,
  companies: Company[],
): SuggestedMatch[] {
  const results: SuggestedMatch[] = []

  for (const company of companies) {
    let score = 0
    const matchedTerms: string[] = []

    for (const trade of company.trades) {
      const inCategory = category ? wordMatch(category, trade) : false
      const inTitle = wordMatch(title, trade)
      if (inCategory) {
        score += 5
        matchedTerms.push(trade)
      } else if (inTitle) {
        score += 2
        matchedTerms.push(trade)
      }
    }

    for (const kw of company.keywords) {
      const inCategory = category ? wordMatch(category, kw) : false
      const inTitle = wordMatch(title, kw)
      if (inCategory) {
        score += 3
        if (!matchedTerms.includes(kw)) matchedTerms.push(kw)
      } else if (inTitle) {
        score += 1
        if (!matchedTerms.includes(kw)) matchedTerms.push(kw)
      }
    }

    if (score >= 2) {
      results.push({
        company,
        score,
        relevance: scoreToRelevance(score),
        matchedTerms,
      })
    }
  }

  // Absteigend nach Score sortieren
  return results.sort((a, b) => b.score - a.score)
}

/**
 * Gibt das BESTE passende Unternehmen zurück (Abwärtskompatibilität).
 */
export function suggestCompany(
  category: string | null,
  title: string,
  companies: Company[],
): SuggestedMatch | null {
  const matches = suggestCompanies(category, title, companies)
  return matches[0] ?? null
}
