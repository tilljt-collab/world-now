'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import type { Story, Category } from '@/lib/types'
import { CATEGORY_COLORS } from '@/lib/types'
import { type Preset, storyMatchesPreset } from '@/lib/presets'
import { CENTROIDS } from '@/lib/centroids'

interface MapContainerProps {
  stories: Story[]
  activeCategories: Set<Category>
  preset: Preset
  keyword: string
  onFlyTo: (fn: (lat: number, lng: number, zoom?: number) => void) => void
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function safeUrl(url: string): string {
  return url.startsWith('https://') ? url : '#'
}

function kwMatches(s: Story, kw: string): boolean {
  return s.headline.toLowerCase().includes(kw) || s.summary.toLowerCase().includes(kw)
}

// Country-level aggregate orbs — one per country, sized by story count
function buildCountryGeoJSON(stories: Story[], activeCategories: Set<Category>, preset: Preset, keyword: string) {
  const kw = keyword.trim().toLowerCase()
  const hasKw = kw.length > 0
  const byCountry = new Map<string, Story[]>()
  for (const s of stories) {
    if (!activeCategories.has(s.category)) continue
    const list = byCountry.get(s.countryCode) ?? []
    list.push(s)
    byCountry.set(s.countryCode, list)
  }

  const features = []
  for (const [code, group] of byCountry) {
    const centroid = CENTROIDS[code]
    if (!centroid) continue

    // Dominant category by count
    const catCount = new Map<string, number>()
    for (const s of group) catCount.set(s.category, (catCount.get(s.category) ?? 0) + 1)
    const dominant = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0][0] as Category

    const count = group.length
    const radius = Math.min(8 + Math.sqrt(count) * 7, 42)
    const isFiltered = preset.id !== 'everything'
    const matchCount = isFiltered ? group.filter(s => storyMatchesPreset(preset, s.category, s.countryCode)).length : count
    const hasMatch = matchCount > 0
    const kwMatchCount = hasKw ? group.filter(s => kwMatches(s, kw)).length : count
    const kwHasMatch = kwMatchCount > 0
    const displayRadius = isFiltered ? (hasMatch ? radius * 1.2 : radius * 0.5) : radius
    const topHeadlines = group
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3)
      .map(s => s.headline)

    features.push({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [centroid.lng, centroid.lat] as [number, number] },
      properties: {
        color: CATEGORY_COLORS[dominant] ?? '#888888',
        radius: hasKw ? (kwHasMatch ? displayRadius * 1.3 : displayRadius * 0.5) : displayRadius,
        dotOpacity: hasKw ? (kwHasMatch ? 0.95 : 0.1) : (isFiltered ? (hasMatch ? 0.9 : 0.2) : 0.85),
        strokeOpacity: hasKw ? (kwHasMatch ? 0.8 : 0.05) : (isFiltered ? (hasMatch ? 0.7 : 0.1) : 0.55),
        count,
        label: String(count),
        headlines: JSON.stringify(topHeadlines),
        countryCode: code,
      },
    })
  }

  return { type: 'FeatureCollection' as const, features }
}

// Individual story dots — shown when zoomed in (minzoom handled via layer + per-feature filter)
function buildGeoJSON(stories: Story[], activeCategories: Set<Category>, preset: Preset, keyword: string) {
  const DOT_RADII: Record<number, number> = { 1: 4, 2: 7, 3: 10, 4: 13, 5: 16 }
  const kw = keyword.trim().toLowerCase()
  const hasKw = kw.length > 0

  return {
    type: 'FeatureCollection' as const,
    features: stories
      .filter(s => activeCategories.has(s.category))
      .map(s => {
        const matched = storyMatchesPreset(preset, s.category, s.countryCode)
        const kwMatch = !hasKw || kwMatches(s, kw)
        const radius = DOT_RADII[s.importance] ?? 7
        const isFiltered = preset.id !== 'everything'
        const baseRadius = isFiltered ? (matched ? radius * 1.6 : radius * 0.6) : radius
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] as [number, number] },
          properties: {
            color: CATEGORY_COLORS[s.category] ?? '#888888',
            radius: hasKw ? (kwMatch ? baseRadius * 1.4 : baseRadius * 0.5) : baseRadius,
            dotOpacity: hasKw ? (kwMatch ? 1 : 0.08) : (isFiltered ? (matched ? 1 : 0.2) : 1),
            strokeOpacity: hasKw ? (kwMatch ? 0.8 : 0.04) : (isFiltered ? (matched ? 0.7 : 0.1) : 0.55),
            minZoom: s.minZoom,
            category: s.category,
            headline: s.headline,
            summary: s.summary,
            source: s.source,
            ago: s.ago,
            url: s.url,
          },
        }
      }),
  }
}

export default function MapContainer({ stories, activeCategories, preset, keyword, onFlyTo }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const popupRef     = useRef<maplibregl.Popup | null>(null)
  const animRef      = useRef<number | null>(null)
  const [mapReady, setMapReady]   = useState(false)
  const [mapError, setMapError]   = useState<string | null>(null)

  const flyTo = useCallback((lat: number, lng: number, zoom = 5) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 })
  }, [])

  useEffect(() => { onFlyTo(flyTo) }, [flyTo, onFlyTo])

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const canvas = document.createElement('canvas')
    if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) {
      setMapError('WebGL is not supported in this browser')
      return
    }

    let map: maplibregl.Map
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [12, 22],
        zoom: 1.5,
        minZoom: 1,
        maxZoom: 13,
      })
    } catch (e: any) {
      setMapError(`Map init failed: ${e.message}`)
      return
    }

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    mapRef.current = map
    map.on('error', (e: any) => setMapError(`Map error: ${e.error?.message ?? 'unknown'}`))

    map.on('load', () => {
      // ── Country aggregate orbs source ───────────────────────────────────
      map.addSource('country-orbs', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // Pulse ring for country orbs
      map.addLayer({
        id: 'country-pulse',
        type: 'circle',
        source: 'country-orbs',
        maxzoom: 5.5,
        paint: {
          'circle-radius':         ['get', 'radius'] as any,
          'circle-color':          'transparent',
          'circle-stroke-width':   2,
          'circle-stroke-color':   ['get', 'color'] as any,
          'circle-stroke-opacity': 0,
        },
      })

      // Country fill circles
      map.addLayer({
        id: 'country-dots',
        type: 'circle',
        source: 'country-orbs',
        maxzoom: 5.5,
        paint: {
          'circle-radius':         ['get', 'radius'] as any,
          'circle-color':          ['get', 'color'] as any,
          'circle-opacity':        ['get', 'dotOpacity'] as any,
          'circle-stroke-width':   2.5,
          'circle-stroke-color':   'rgba(255,255,255,1)',
          'circle-stroke-opacity': ['get', 'strokeOpacity'] as any,
        },
      })

      // Story count label on country orbs
      map.addLayer({
        id: 'country-labels',
        type: 'symbol',
        source: 'country-orbs',
        maxzoom: 5.5,
        layout: {
          'text-field':  ['get', 'label'] as any,
          'text-size':   12,
          'text-font':   ['Noto Sans Bold', 'Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-anchor': 'center',
        },
        paint: {
          'text-color':      '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.4)',
          'text-halo-width': 1,
        },
      })

      // ── Individual story dots source ─────────────────────────────────────
      map.addSource('stories', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // Pulse ring for individual dots — only visible when zoomed in enough
      map.addLayer({
        id: 'story-pulse',
        type: 'circle',
        source: 'stories',
        minzoom: 4,
        filter: ['>=', ['zoom'], ['get', 'minZoom']] as any,
        paint: {
          'circle-radius':          ['get', 'radius'] as any,
          'circle-color':           'transparent',
          'circle-stroke-width':    2,
          'circle-stroke-color':    ['get', 'color'] as any,
          'circle-stroke-opacity':  0,
        },
      })

      // Individual story dots
      map.addLayer({
        id: 'story-dots',
        type: 'circle',
        source: 'stories',
        minzoom: 4,
        filter: ['>=', ['zoom'], ['get', 'minZoom']] as any,
        paint: {
          'circle-radius':         ['get', 'radius'] as any,
          'circle-color':          ['get', 'color'] as any,
          'circle-opacity':        ['get', 'dotOpacity'] as any,
          'circle-stroke-width':   2.5,
          'circle-stroke-color':   'rgba(255,255,255,1)',
          'circle-stroke-opacity': ['get', 'strokeOpacity'] as any,
        },
      })

      // ── Interactions ─────────────────────────────────────────────────────

      // Country orb click
      map.on('click', 'country-dots', (e: any) => {
        if (!e.features?.length) return
        const p      = e.features[0].properties as Record<string, string>
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number]
        let headlines: string[] = []
        try { headlines = JSON.parse(p.headlines) } catch { /* empty */ }
        const headlineHTML = headlines.map(h => `<div class="tooltip-sum">• ${esc(h)}</div>`).join('')
        if (popupRef.current) popupRef.current.remove()
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '280px' })
          .setLngLat(coords)
          .setHTML(`
            <div class="story-tooltip">
              <div class="tooltip-cat">${String(p.count)} STORIES</div>
              ${headlineHTML}
              <div class="tooltip-meta" style="margin-top:6px">Zoom in to explore</div>
            </div>`)
          .addTo(map)
      })

      // Individual story dot click
      map.on('click', 'story-dots', (e: any) => {
        if (!e.features?.length) return
        const p      = e.features[0].properties as Record<string, string>
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number]
        if (popupRef.current) popupRef.current.remove()
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
          .setLngLat(coords)
          .setHTML(`
            <div class="story-tooltip">
              <div class="tooltip-cat">${esc(p.category.toUpperCase())}</div>
              <div class="tooltip-h">${esc(p.headline)}</div>
              <div class="tooltip-sum">${esc(p.summary)}</div>
              <div class="tooltip-meta">${esc(p.source)} · ${esc(p.ago)} ago</div>
              <a class="tooltip-more" href="${safeUrl(p.url)}" target="_blank" rel="noopener noreferrer">Click for more →</a>
            </div>`)
          .addTo(map)
      })

      map.on('mouseenter', 'country-dots', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'country-dots', () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'story-dots',   () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'story-dots',   () => { map.getCanvas().style.cursor = '' })

      // Pulse animation for both layers
      const animate = () => {
        const t = (Date.now() % 1800) / 1800
        try {
          map.setPaintProperty('story-pulse',   'circle-stroke-opacity', 0.85 * (1 - t))
          map.setPaintProperty('story-pulse',   'circle-stroke-width',   2 + t * 10)
          map.setPaintProperty('country-pulse', 'circle-stroke-opacity', 0.7  * (1 - t))
          map.setPaintProperty('country-pulse', 'circle-stroke-width',   3 + t * 14)
        } catch { /* map may have been removed */ }
        animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)

      setMapReady(true)
    })

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Push new data whenever stories, active categories, preset, or keyword change
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    ;(map.getSource('stories') as maplibregl.GeoJSONSource | undefined)
      ?.setData(buildGeoJSON(stories, activeCategories, preset, keyword) as any)
    ;(map.getSource('country-orbs') as maplibregl.GeoJSONSource | undefined)
      ?.setData(buildCountryGeoJSON(stories, activeCategories, preset, keyword) as any)
  }, [stories, activeCategories, preset, keyword, mapReady])

  if (mapError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#8899bb]">
        <div className="text-[13px]">Map failed to load</div>
        <div className="text-[10px] text-[#445566] max-w-[300px] text-center">{mapError}</div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
