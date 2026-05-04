import type { Importance } from './types'

const CRITICAL = /\b(kills|killed|dead|deaths|crisis|emergency|ceasefire|collapse|attack|war|famine|coup|nuclear|missile|earthquake|flood|evacuate)\b/i
const MAJOR    = /\b(protests|election|sanctions|summit|agreement|deal|parliament|recession|strike|arrest)\b/i

const HIGH_AUTHORITY = new Set(['Reuters', 'BBC News', 'AP', 'AFP', 'Al Jazeera', 'The Guardian', 'FT', 'Financial Times', 'New York Times', 'Washington Post', 'Bloomberg', 'CNN'])
const MID_AUTHORITY  = new Set(['DW', 'France 24', 'The Times', 'Wall Street Journal', 'Politico', 'Yonhap', 'TASS', 'Xinhua'])

export function scoreImportance(article: {
  title: string
  source: { name: string }
  publishedAt: string
}): Importance {
  let score = 0

  // Source authority (0–2)
  if (HIGH_AUTHORITY.has(article.source.name)) score += 2
  else if (MID_AUTHORITY.has(article.source.name)) score += 1

  // Keyword severity (0–2)
  if (CRITICAL.test(article.title)) score += 2
  else if (MAJOR.test(article.title)) score += 1

  // Recency (0–1): full point if < 2 hours old
  const ageMs = Date.now() - new Date(article.publishedAt).getTime()
  if (ageMs < 2 * 3600_000) score += 1

  return Math.max(1, Math.min(5, score)) as Importance
}
