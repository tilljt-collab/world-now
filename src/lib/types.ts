export type Category =
  | 'conflict'
  | 'politics'
  | 'economy'
  | 'climate'
  | 'disaster'
  | 'diplomacy'
  | 'society'

export type Importance = 1 | 2 | 3 | 4 | 5
export type MinZoom = 2 | 4 | 6 | 8

export interface Story {
  id: string              // NewsAPI article URL hash
  lat: number
  lng: number
  countryCode: string
  headline: string
  summary: string         // NewsAPI description field
  url: string             // Source article URL
  source: string          // e.g. "Reuters"
  publishedAt: string     // ISO string
  ago: string             // Human-readable: "4m", "2h", "1d"
  category: Category
  importance: Importance
  minZoom: MinZoom
}

export const CATEGORY_COLORS: Record<Category, string> = {
  conflict:  '#e74c3c',
  politics:  '#e67e22',
  economy:   '#f1c40f',
  climate:   '#2ecc71',
  disaster:  '#9b59b6',
  diplomacy: '#2980b9',
  society:   '#1abc9c',
}

export const CATEGORY_LABELS: Record<Category, string> = {
  conflict:  'Conflict / War',
  politics:  'Politics / Elections',
  economy:   'Economy / Finance',
  climate:   'Climate / Environment',
  disaster:  'Disaster / Emergency',
  diplomacy: 'Diplomacy / Global',
  society:   'Society / Culture',
}

export const DOT_RADII: Record<Importance, number> = { 1: 4, 2: 7, 3: 10, 4: 13, 5: 16 }
