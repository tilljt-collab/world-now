import { geolocate } from '@/lib/geolocate'

const makeArticle = (title: string, description = '') => ({
  title, description, url: 'https://example.com', source: { name: 'Test' },
  publishedAt: new Date().toISOString(), content: '',
})

describe('geolocate', () => {
  it('returns coords for a clearly UK article', () => {
    const result = geolocate(makeArticle('UK Parliament votes on new bill'))
    expect(result).not.toBeNull()
    expect(result!.countryCode).toBe('GB')
    expect(result!.lat).toBeCloseTo(55.4, 0)
  })

  it('returns coords for a US article', () => {
    const result = geolocate(makeArticle('US Senate passes foreign aid bill'))
    expect(result!.countryCode).toBe('US')
  })

  it('returns null for an unlocatable article', () => {
    const result = geolocate(makeArticle('Scientists discover new protein structure'))
    expect(result).toBeNull()
  })

  it('searches description if title has no match', () => {
    const result = geolocate(makeArticle('Breaking news today', 'Floods hit Bangladesh villages'))
    expect(result!.countryCode).toBe('BD')
  })
})
