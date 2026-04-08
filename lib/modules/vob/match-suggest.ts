import type { Company } from './types'

export interface SuggestedMatch {
  company: Company
  score: number
}

export function suggestCompany(
  category: string | null,
  title: string,
  companies: Company[],
): SuggestedMatch | null {
  const cat = category?.toLowerCase() ?? ''
  const t = title.toLowerCase()

  let best: SuggestedMatch | null = null

  for (const company of companies) {
    let score = 0

    for (const kw of company.keywords) {
      const k = kw.toLowerCase()
      if (cat && cat.includes(k)) score += 3
      if (t.includes(k)) score += 1
    }

    for (const trade of company.trades) {
      const tr = trade.toLowerCase()
      if (cat && cat.includes(tr)) score += 2
      if (t.includes(tr)) score += 1
    }

    if (score >= 2 && (!best || score > best.score)) {
      best = { company, score }
    }
  }

  return best
}
