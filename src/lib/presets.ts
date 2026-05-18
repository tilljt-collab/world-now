import type { Category } from './types'

export type PresetId = 'everything' | 'military' | 'middle-east' | 'politics' | 'economy' | 'climate'

export interface Preset {
  id: PresetId
  label: string
  emoji: string
  tagline: string
  categories?: Category[]
  countries?: string[]
}

const MIDDLE_EAST_CODES = ['IL','PS','LB','SY','IQ','IR','JO','SA','YE','AE','QA','KW','BH','OM','EG','TR']

export const PRESETS: Preset[] = [
  {
    id: 'everything',
    label: 'Everything',
    emoji: '🌍',
    tagline: 'All world news, unfiltered',
  },
  {
    id: 'military',
    label: 'Conflicts & Military',
    emoji: '⚔️',
    tagline: 'Wars, strikes, military operations',
    categories: ['conflict', 'disaster'],
  },
  {
    id: 'middle-east',
    label: 'Middle East',
    emoji: '🗺️',
    tagline: 'Gaza, Lebanon, Iran, Yemen & more',
    countries: MIDDLE_EAST_CODES,
  },
  {
    id: 'politics',
    label: 'Politics & Power',
    emoji: '🏛️',
    tagline: 'Elections, summits, world leaders',
    categories: ['politics', 'diplomacy'],
  },
  {
    id: 'economy',
    label: 'Economy & Markets',
    emoji: '📈',
    tagline: 'Trade, finance, sanctions',
    categories: ['economy'],
  },
  {
    id: 'climate',
    label: 'Climate & Disasters',
    emoji: '🌡️',
    tagline: 'Natural disasters, climate events',
    categories: ['climate', 'disaster'],
  },
]

export function storyMatchesPreset(preset: Preset, category: Category, countryCode: string): boolean {
  if (preset.id === 'everything') return true
  if (preset.categories?.includes(category)) return true
  if (preset.countries?.includes(countryCode.toUpperCase())) return true
  return false
}
