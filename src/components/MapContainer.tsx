'use client'
import { useEffect, useRef, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Story } from '@/lib/types'
import { CATEGORY_COLORS, DOT_RADII } from '@/lib/types'

interface MapContainerProps {
  stories: Story[]
  activeCategories: Set<string>
  onFlyTo: (fn: (lat: number, lng: number, zoom?: number) => void) => void
}

// Escape HTML entities to prevent XSS from external API data
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function safeUrl(url: string): string {
  return url.startsWith('https://') ? url : '#'
}

export default function MapContainer({ stories, activeCategories, onFlyTo }: MapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const markersRef   = useRef<maplibregl.Marker[]>([])
  const popupRef     = useRef<maplibregl.Popup | null>(null)

  const flyTo = useCallback((lat: number, lng: number, zoom = 5) => {
    mapRef.current?.flyTo({ center: [lng, lat], zoom, duration: 1200 })
  }, [])

  useEffect(() => { onFlyTo(flyTo) }, [flyTo, onFlyTo])

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#06090f' } }],
      } as maplibregl.StyleSpecification,
      center: [12, 22],
      zoom: 2,
      minZoom: 2,
      maxZoom: 13,
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')

    let alive = true
    map.on('load', () => {
      if (!alive) return
      map.addSource('countries', { type: 'geojson', data: '/world.geojson' })
      map.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: { 'fill-color': '#0f1e35', 'fill-opacity': 1 },
      })
      map.addLayer({
        id: 'countries-border',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': '#1e3050', 'line-width': 0.8 },
      })
      map.addLayer({
        id: 'countries-hover',
        type: 'fill',
        source: 'countries',
        paint: { 'fill-color': '#162844', 'fill-opacity': 0 },
      })

      map.on('mousemove', 'countries-fill', () => {
        map.setPaintProperty('countries-hover', 'fill-opacity', 1)
      })
      map.on('mouseleave', 'countries-fill', () => {
        map.setPaintProperty('countries-hover', 'fill-opacity', 0)
      })
    })

    mapRef.current = map
    return () => { alive = false; map.remove(); mapRef.current = null }
  }, [])

  // Re-render markers when stories or active categories change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach(m => m.remove())
    markersRef.current = []
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }

    const zoom = map.getZoom()
    const filtered = stories.filter(s => activeCategories.has(s.category))

    filtered.forEach(s => {
      const color = CATEGORY_COLORS[s.category] ?? '#888888'
      const rad   = DOT_RADII[s.importance]
      const tot   = rad * 2 + 28
      const speed = (1.5 + s.importance * 0.2).toFixed(1)

      const el = document.createElement('div')
      el.dataset.minZoom = String(s.minZoom)
      el.style.cssText = `position:relative;width:${tot}px;height:${tot}px;cursor:pointer;opacity:${zoom >= s.minZoom ? '1' : '0'};pointer-events:${zoom >= s.minZoom ? 'auto' : 'none'};`
      el.innerHTML = `
        <div style="position:absolute;border-radius:50%;border:2px solid ${color};top:50%;left:50%;animation:markerRing ${speed}s ease-out infinite;opacity:0;width:${rad*2}px;height:${rad*2}px;transform:translate(-50%,-50%);"></div>
        <div style="position:absolute;border-radius:50%;width:${rad*2}px;height:${rad*2}px;top:50%;left:50%;transform:translate(-50%,-50%);background:${color};border:2.5px solid rgba(255,255,255,0.55);"></div>`

      el.addEventListener('click', () => {
        if (popupRef.current) popupRef.current.remove()
        const popup = new maplibregl.Popup({ closeButton: true, maxWidth: '260px' })
          .setLngLat([s.lng, s.lat])
          .setHTML(`
            <div class="story-tooltip">
              <div class="tooltip-cat">${esc(s.category.toUpperCase())}</div>
              <div class="tooltip-h">${esc(s.headline)}</div>
              <div class="tooltip-sum">${esc(s.summary)}</div>
              <div class="tooltip-meta">${esc(s.source)} · ${esc(s.ago)} ago</div>
              <a class="tooltip-more" href="${safeUrl(s.url)}" target="_blank" rel="noopener noreferrer">Click for more →</a>
            </div>`)
          .addTo(map)
        popupRef.current = popup
      })

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([s.lng, s.lat])
        .addTo(map)

      markersRef.current.push(marker)
    })

    const onZoom = () => {
      const z = map.getZoom()
      markersRef.current.forEach(m => {
        const el = m.getElement()
        const minZ = Number(el.dataset.minZoom ?? 0)
        const show = z >= minZ
        el.style.opacity = show ? '1' : '0'
        el.style.pointerEvents = show ? 'auto' : 'none'
      })
    }

    map.on('zoom', onZoom)
    return () => { map.off('zoom', onZoom) }
  }, [stories, activeCategories])

  return <div ref={containerRef} className="absolute inset-0" />
}
