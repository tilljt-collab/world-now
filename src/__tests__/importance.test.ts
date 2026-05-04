import { scoreImportance } from '@/lib/importance'

const article = (title: string, source: string, publishedAt: string) => ({
  title, source: { name: source }, publishedAt,
  description: '', url: '', content: '',
})

const now = new Date().toISOString()
const old = new Date(Date.now() - 23 * 3600_000).toISOString()

describe('scoreImportance', () => {
  it('gives 5 for major source + critical keywords + recent', () => {
    const score = scoreImportance(article('War kills hundreds as ceasefire collapses', 'Reuters', now))
    expect(score).toBe(5)
  })
  it('gives lower score for older articles', () => {
    const recent = scoreImportance(article('Protest in capital city', 'AP', now))
    const older  = scoreImportance(article('Protest in capital city', 'AP', old))
    expect(recent).toBeGreaterThanOrEqual(older)
  })
  it('never returns below 1 or above 5', () => {
    const score = scoreImportance(article('Cake competition held in village', 'Local Blog', old))
    expect(score).toBeGreaterThanOrEqual(1)
    expect(score).toBeLessThanOrEqual(5)
  })
})
