import type { Category } from './types'

const RULES: Array<[RegExp, Category]> = [
  // disaster before conflict so "earthquake kills" → disaster, not conflict
  [/\b(earthquake|tsunami|eruption|volcano|landslide|hurricane|typhoon|cyclone|famine|humanitarian crisis|epidemic|pandemic|outbreak|evacuate|evacuation|rescue|collapsed building|disaster zone)\b/i, 'disaster'],
  [/\b(war|warfare|killed|kills|airstrike|airstrikes|bombing|troops|military|missile|attack|combat|fighting|gunfire|shelling|ceasefire|insurgent|rebel|terrorist|hostage|weapon|armed|soldier|battalion|siege|offensive|frontline|sniper|drone strike|explosion|bomb|blast|artillery|navy|air force|fleet)\b/i, 'conflict'],
  [/\b(election|vote|voting|poll|parliament|president|prime minister|congress|senate|minister|government|party|coalition|referendum|legislation|law|bill|democracy|political|politician|campaign|cabinet|resign|impeach|coup)\b/i, 'politics'],
  // diplomacy before economy so "trade talks" → diplomacy, not economy
  [/\b(talks|summit|treaty|agreement|sanctions|diplomacy|diplomatic|nato|united nations|g7|g20|asean|european union|foreign minister|ambassador|relations|alliance|bilateral|multilateral|ceasefire deal)\b/i, 'diplomacy'],
  [/\b(economy|economic|inflation|gdp|growth|recession|rate cut|interest rate|bank|stock|market|trade|tariff|exports|imports|currency|deficit|debt|budget|fiscal|imf|world bank|investment|supply chain|unemployment|jobs|wages)\b/i, 'economy'],
  [/\b(climate|temperature|drought|flood|wildfire|fire|sea level|carbon|emissions|greenhouse|deforestation|glacier|heatwave|snow|storm|rainfall|monsoon|el ni[oó])\b/i, 'climate'],
]

export function categorize(headline: string): Category {
  for (const [pattern, category] of RULES) {
    if (pattern.test(headline)) return category
  }
  return 'society'
}
