import { categorize } from '@/lib/categorize'

describe('categorize', () => {
  it('returns conflict for war-related headlines', () => {
    expect(categorize('Airstrikes kill 12 in Gaza as fighting intensifies')).toBe('conflict')
  })
  it('returns politics for election headlines', () => {
    expect(categorize('Modi projected to win third term in India election')).toBe('politics')
  })
  it('returns economy for financial headlines', () => {
    expect(categorize('ECB signals rate cut as eurozone growth stalls')).toBe('economy')
  })
  it('returns climate for environment headlines', () => {
    expect(categorize('Record drought hits East Africa for third year')).toBe('climate')
  })
  it('returns disaster for emergency headlines', () => {
    expect(categorize('Earthquake kills 34 in southern Turkey')).toBe('disaster')
  })
  it('returns diplomacy for international talks', () => {
    expect(categorize('US-China trade talks resume in Geneva')).toBe('diplomacy')
  })
  it('defaults to society', () => {
    expect(categorize('City bans tourist apartments in historic district')).toBe('society')
  })
})
