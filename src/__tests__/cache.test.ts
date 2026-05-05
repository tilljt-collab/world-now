import { Cache } from '@/lib/cache'

describe('Cache', () => {
  it('stores and retrieves a value', () => {
    const cache = new Cache<string>(1000)
    cache.set('k', 'hello')
    expect(cache.get('k')).toBe('hello')
  })

  it('returns null after TTL expires', async () => {
    const cache = new Cache<string>(10) // 10ms TTL
    cache.set('k', 'hello')
    await new Promise(r => setTimeout(r, 20))
    expect(cache.get('k')).toBeNull()
  })

  it('returns null for missing keys', () => {
    const cache = new Cache<string>(1000)
    expect(cache.get('missing')).toBeNull()
  })
})
