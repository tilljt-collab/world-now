import { CENTROIDS } from './centroids'

interface NewsArticle {
  title: string
  description: string
  url: string
  source: { name: string }
  publishedAt: string
  content: string
}

interface GeoResult {
  lat: number
  lng: number
  countryCode: string
}

// Maps common country name variants → ISO code
const COUNTRY_KEYWORDS: Array<[RegExp, string]> = [
  [/\buk\b|united kingdom|britain|british|england|scotland|wales/i, 'GB'],
  [/\bus\b|united states|american|washington d\.?c\.?/i, 'US'],
  [/\bchina\b|chinese|beijing|shanghai/i, 'CN'],
  [/\brussia\b|russian|moscow|kremlin/i, 'RU'],
  [/\bukraine\b|ukrainian|kyiv|kharkiv/i, 'UA'],
  [/\bisrael\b|israeli|tel aviv/i, 'IL'],
  [/\bgaza\b|hamas|rafah|west bank/i, 'IL'],
  [/\biran\b|iranian|tehran/i, 'IR'],
  [/\bpalestine\b|palestinian/i, 'IL'],
  [/\bsyria\b|syrian|damascus|aleppo/i, 'SY'],
  [/\bturkey\b|turkish|istanbul|ankara/i, 'TR'],
  [/\bgermany\b|german|berlin/i, 'DE'],
  [/\bfrance\b|french|paris/i, 'FR'],
  [/\bindia\b|indian|delhi|mumbai|modi/i, 'IN'],
  [/\bpakistan\b|pakistani|islamabad|karachi/i, 'PK'],
  [/\bbrazil\b|brazilian|brasilia|sao paulo/i, 'BR'],
  [/\bnigeria\b|nigerian|lagos|abuja/i, 'NG'],
  [/\bafghanistan\b|afghan|kabul|taliban/i, 'AF'],
  [/\beiraq\b|iraqi|baghdad/i, 'IQ'],
  [/\bsudan\b|sudanese|khartoum/i, 'SD'],
  [/\bsouth africa\b|pretoria|johannesburg/i, 'ZA'],
  [/\bmexico\b|mexican/i, 'MX'],
  [/\bargentina\b|buenos aires/i, 'AR'],
  [/\bcolombia\b|bogota/i, 'CO'],
  [/\bvenezuela\b|caracas/i, 'VE'],
  [/\bbangladesh\b|dhaka/i, 'BD'],
  [/\bindonesia\b|jakarta/i, 'ID'],
  [/\bphilippines\b|manila/i, 'PH'],
  [/\bjapan\b|japanese|tokyo/i, 'JP'],
  [/\bsouth korea\b|korean|seoul/i, 'KR'],
  [/\bnorth korea\b|pyongyang/i, 'KP'],
  [/\btaiwan\b|taipei/i, 'TW'],
  [/\bcanada\b|canadian|ottawa|toronto/i, 'CA'],
  [/\baustralia\b|australian|sydney|canberra/i, 'AU'],
  [/\bethiopia\b|addis ababa/i, 'ET'],
  [/\bkenya\b|nairobi/i, 'KE'],
  [/\begypt\b|egyptian|cairo/i, 'EG'],
  [/\bsaudi arabia\b|riyadh/i, 'SA'],
  [/\bspain\b|spanish|madrid/i, 'ES'],
  [/\bitaly\b|italian|rome/i, 'IT'],
  [/\bpoland\b|warsaw/i, 'PL'],
  [/\bgreece\b|athens/i, 'GR'],
  [/\bsweden\b|stockholm/i, 'SE'],
  [/\bnetherlands\b|amsterdam/i, 'NL'],
  [/\blebanon\b|beirut|hezbollah/i, 'LB'],
  [/\btbilisi\b/i, 'GE'],
  [/\bniger\b/i, 'NE'],
  [/\bmali\b/i, 'ML'],
  [/\bchile\b/i, 'CL'],
  [/\bperu\b/i, 'PE'],
  [/\bvietnam\b|hanoi/i, 'VN'],
  [/\bthailand\b|bangkok/i, 'TH'],
  [/\bmalaysia\b|kuala lumpur/i, 'MY'],
  [/\bnorway\b|oslo/i, 'NO'],
  [/\bfinland\b|helsinki/i, 'FI'],
  [/\bbelgium\b|brussels/i, 'BE'],
  [/\baustria\b|vienna/i, 'AT'],
  [/\bhungary\b|budapest/i, 'HU'],
  [/\bromania\b|bucharest/i, 'RO'],
  [/\bkazakhstan\b|astana|almaty/i, 'KZ'],
  [/\bserbia\b|belgrade/i, 'RS'],
  [/\bportuguese\b|portugal\b|lisbon/i, 'PT'],
  [/\bnew zealand\b|wellington/i, 'NZ'],
  [/\bsingapore\b/i, 'SG'],
  [/\buae\b|dubai|abu dhabi/i, 'AE'],
  [/\bhaiti\b|port-au-prince/i, 'HT'],
  [/\bhonduras\b/i, 'HN'],
  [/\bdr congo\b|democratic republic.*congo|drc\b|goma/i, 'CD'],
  [/\bcongo\b/i, 'CG'],
  [/\bLibya\b|tripoli/i, 'LY'],
  [/\bmorocco\b|rabat/i, 'MA'],
  [/\btunisia\b|tunis/i, 'TN'],
  [/\balgeria\b|algiers/i, 'DZ'],
  [/\bcambodia\b|phnom penh/i, 'KH'],
  [/\bnepal\b|kathmandu/i, 'NP'],
  [/\bsri lanka\b|colombo/i, 'LK'],
  [/\byemen\b|sanaa/i, 'YE'],
  [/\boman\b|muscat/i, 'OM'],
  [/\bkuwait\b/i, 'KW'],
  [/\bjordan\b|amman/i, 'JO'],
  [/\bqatar\b|doha/i, 'QA'],
  [/\bmadagascar\b/i, 'MG'],
  [/\bsenegal\b|dakar/i, 'SN'],
  [/\bcameroon\b|yaounde/i, 'CM'],
  [/\bghana\b|accra/i, 'GH'],
  [/\bcote d.ivoire\b|ivory coast/i, 'CI'],
]

// Per-country spread radius in degrees (half-width of randomisation area).
// Larger countries get bigger spreads so multiple stories don't stack on one point.
const COUNTRY_SPREAD: Record<string, { lat: number; lng: number }> = {
  // Huge countries
  RU: { lat: 12, lng: 28 },
  CA: { lat: 10, lng: 24 },
  US: { lat: 10, lng: 22 },
  CN: { lat: 10, lng: 16 },
  BR: { lat: 12, lng: 14 },
  AU: { lat:  8, lng: 16 },
  // Large countries
  IN: { lat:  8, lng: 10 },
  SA: { lat:  5, lng:  7 },
  IR: { lat:  5, lng:  7 }, // Iran
  MX: { lat:  5, lng:  7 },
  DZ: { lat:  6, lng:  8 },
  SD: { lat:  6, lng:  5 },
  CD: { lat:  6, lng:  7 },
  KZ: { lat:  6, lng: 10 },
  // Medium countries
  UA: { lat:  3, lng:  7 },
  PK: { lat:  5, lng:  5 },
  NG: { lat:  4, lng:  4 },
  ET: { lat:  4, lng:  4 },
  IQ: { lat:  3, lng:  4 },
  AF: { lat:  3, lng:  4 },
  SY: { lat:  2, lng:  2 },
  YE: { lat:  3, lng:  3 },
  FR: { lat:  3, lng:  3 },
  DE: { lat:  2, lng:  2 },
  TR: { lat:  3, lng:  5 },
  JP: { lat:  4, lng:  2 },
  ID: { lat:  4, lng: 10 },
  // Smaller countries — default applies, but list key ones explicitly
  GB: { lat:  2, lng:  1 },
  ES: { lat:  2, lng:  3 },
  IT: { lat:  3, lng:  2 },
  PL: { lat:  2, lng:  2 },
  EG: { lat:  4, lng:  5 },
  ZA: { lat:  4, lng:  5 },
  KE: { lat:  3, lng:  3 },
  // Tiny/dense countries stay tight
  IL: { lat: 0.8, lng: 0.7 },
  LB: { lat: 0.4, lng: 0.4 },
  SG: { lat: 0.1, lng: 0.1 },
}

const DEFAULT_SPREAD = { lat: 1, lng: 1 }

export function geolocate(article: NewsArticle): GeoResult | null {
  const text = `${article.title} ${article.description}`
  for (const [pattern, code] of COUNTRY_KEYWORDS) {
    if (pattern.test(text)) {
      const centroid = CENTROIDS[code]
      if (!centroid) continue
      const spread = COUNTRY_SPREAD[code] ?? DEFAULT_SPREAD
      return {
        lat: Math.max(-90,  Math.min(90,  centroid.lat + (Math.random() - 0.5) * 2 * spread.lat)),
        lng: Math.max(-180, Math.min(180, centroid.lng + (Math.random() - 0.5) * 2 * spread.lng)),
        countryCode: code,
      }
    }
  }
  return null
}
