import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import {
  MAPBOX_TOKEN,
  CATEGORY_MAP,
  getRoute,
  formatDistance,
  formatDuration,
} from '../lib'

// ─────────────────────────────────────────────────────────────────────────────
// MapCanvas
//
// Renders the Mapbox map, places numbered pins for the active day's stops,
// draws route lines between them, and animates through the day on play.
// Hovering a pin triggers onHoverPlace(place, stop). Clicking sets active.
// ─────────────────────────────────────────────────────────────────────────────

export default function MapCanvas({
  trip,
  activeDay,
  activePlaceId,
  onActivePlaceChange,
  onHoverPlace,
  playing,
  playStep,
  onPlayStepChange,
  onPlayEnd,
  editorMode,
  onMapClick,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef({})
  const [mapReady, setMapReady] = useState(false)
  const [routeCache, setRouteCache] = useState({})

  const dayData = trip.days.find((d) => d.day === activeDay) || trip.days[0]
  const stops = dayData?.stops || []

  // ─── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    if (!MAPBOX_TOKEN) return

    mapboxgl.accessToken = MAPBOX_TOKEN

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: trip.mapCenter || [78.9, 20.5],
      zoom: trip.mapZoom || 9,
      pitch: 30,
      bearing: -8,
      attributionControl: false,
    })

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      // Add route source/layer
      map.addSource('day-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      // Soft halo line
      map.addLayer({
        id: 'day-route-halo',
        type: 'line',
        source: 'day-route',
        paint: {
          'line-color': trip.accentColor || '#E8583A',
          'line-width': 8,
          'line-opacity': 0.15,
          'line-blur': 3,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })

      map.addLayer({
        id: 'day-route-line',
        type: 'line',
        source: 'day-route',
        paint: {
          'line-color': trip.accentColor || '#E8583A',
          'line-width': 2.5,
          'line-dasharray': [
            'match',
            ['get', 'mode'],
            'flight', ['literal', [2, 2]],
            ['literal', [1, 0]],
          ],
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })

      mapRef.current = map
      setMapReady(true)
    })

    // Editor: click to add place
    map.on('click', (e) => {
      if (editorModeRef.current) {
        onMapClickRef.current?.([e.lngLat.lng, e.lngLat.lat])
      }
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep editor refs fresh without re-init
  const editorModeRef = useRef(editorMode)
  const onMapClickRef = useRef(onMapClick)
  useEffect(() => {
    editorModeRef.current = editorMode
    onMapClickRef.current = onMapClick
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = editorMode ? 'crosshair' : ''
    }
  }, [editorMode, onMapClick])

  // ─── Update accent color when trip changes ────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    map.setPaintProperty('day-route-halo', 'line-color', trip.accentColor || '#E8583A')
    map.setPaintProperty('day-route-line', 'line-color', trip.accentColor || '#E8583A')
  }, [trip.accentColor, mapReady])

  // ─── Render pins for the active day ───────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current

    // Remove old markers
    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    // Build marker for each stop (numbered)
    stops.forEach((stop, idx) => {
      const place = trip.places.find((p) => p.id === stop.placeId)
      if (!place) return

      const el = document.createElement('div')
      const catClass = `cat-${place.category}`
      el.className = `pin ${catClass} ${activePlaceId === place.id ? 'is-active' : ''}`
      el.textContent = String(idx + 1)

      el.addEventListener('mouseenter', () => {
        onHoverPlace?.(place, stop, idx)
      })
      el.addEventListener('mouseleave', () => {
        onHoverPlace?.(null, null, -1)
      })
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onActivePlaceChange?.(place.id)
      })

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(place.coords)
        .addTo(map)
      markersRef.current[`${idx}-${place.id}`] = marker
    })

    // Also add ghost markers for stay places that aren't in today's stops
    // (so you can see "home base" even on days you don't explicitly visit)
    trip.places
      .filter((p) => p.category === 'stay')
      .forEach((place) => {
        const alreadyInDay = stops.some((s) => s.placeId === place.id)
        if (alreadyInDay) return
        const el = document.createElement('div')
        el.className = 'pin pin-ghost cat-stay'
        el.title = place.name + ' (stay)'
        el.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 5l5-4 5 4v6H1z"/></svg>'
        el.addEventListener('mouseenter', () => onHoverPlace?.(place, null, -1))
        el.addEventListener('mouseleave', () => onHoverPlace?.(null, null, -1))
        el.addEventListener('click', (e) => {
          e.stopPropagation()
          onActivePlaceChange?.(place.id)
        })
        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat(place.coords)
          .addTo(map)
        markersRef.current[`ghost-${place.id}`] = marker
      })
  }, [stops, trip.places, activePlaceId, mapReady, onHoverPlace, onActivePlaceChange])

  // ─── Fetch + draw routes for the active day ───────────────────────────────
  useEffect(() => {
    if (!mapReady || stops.length < 2) {
      const map = mapRef.current
      if (map?.getSource('day-route')) {
        map.getSource('day-route').setData({ type: 'FeatureCollection', features: [] })
      }
      return
    }

    let cancelled = false
    ;(async () => {
      const features = []
      for (let i = 0; i < stops.length - 1; i++) {
        const from = trip.places.find((p) => p.id === stops[i].placeId)
        const to = trip.places.find((p) => p.id === stops[i + 1].placeId)
        if (!from || !to) continue
        const key = `${from.id}-${to.id}`
        let route = routeCache[key]
        if (!route) {
          const mode =
            to.travelMode ||
            (from.category === 'transport' && to.category === 'transport' ? 'flight' : 'driving')
          route = await getRoute(from.coords, to.coords, mode)
          if (!route) continue
          setRouteCache((c) => ({ ...c, [key]: route }))
        }
        features.push({
          type: 'Feature',
          properties: { mode: to.travelMode || 'driving', segIdx: i },
          geometry: route.geometry,
        })
      }
      if (cancelled) return
      mapRef.current?.getSource('day-route')?.setData({
        type: 'FeatureCollection',
        features,
      })

      // Fit bounds on day change (only when not actively playing)
      if (!playing && stops.length) {
        const coords = stops
          .map((s) => trip.places.find((p) => p.id === s.placeId)?.coords)
          .filter(Boolean)
        if (coords.length > 1) {
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new mapboxgl.LngLatBounds(coords[0], coords[0])
          )
          mapRef.current?.fitBounds(bounds, { padding: 100, duration: 900 })
        } else if (coords.length === 1) {
          mapRef.current?.flyTo({ center: coords[0], zoom: 13, duration: 900 })
        }
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, trip.id, mapReady])

  // ─── Play mode: fly through stops step by step ────────────────────────────
  const stopsRef = useRef(stops)
  useEffect(() => {
    stopsRef.current = stops
  }, [stops])

  const flyToStop = useCallback((idx) => {
    const map = mapRef.current
    if (!map) return
    const stop = stopsRef.current[idx]
    if (!stop) return
    const place = trip.places.find((p) => p.id === stop.placeId)
    if (!place) return
    onActivePlaceChange?.(place.id)
    map.flyTo({
      center: place.coords,
      zoom: 13.5,
      pitch: 45,
      bearing: (idx * 30) % 360,
      speed: 0.8,
      curve: 1.4,
      essential: true,
    })
  }, [trip.places, onActivePlaceChange])

  useEffect(() => {
    if (!playing || !mapReady) return
    if (playStep >= stops.length) {
      onPlayEnd?.()
      return
    }
    flyToStop(playStep)
    const t = setTimeout(() => {
      onPlayStepChange?.(playStep + 1)
    }, 3600)
    return () => clearTimeout(t)
  }, [playing, playStep, mapReady, stops.length, flyToStop, onPlayStepChange, onPlayEnd])

  // ─── When a place is selected from outside (hover on numbered list) ──────
  useEffect(() => {
    if (!mapReady || !activePlaceId) return
    const place = trip.places.find((p) => p.id === activePlaceId)
    if (!place) return
    mapRef.current?.flyTo({ center: place.coords, zoom: 13, duration: 900 })
  }, [activePlaceId, mapReady, trip.places])

  // ─── No token? Show a helpful placeholder. ────────────────────────────────
  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8 bg-base-700 border border-ink/10 rounded-md">
        <div className="max-w-md text-center">
          <div className="editorial-kicker mb-4">Mapbox token missing</div>
          <p className="font-display display-tight text-3xl mb-4">
            Almost there.
          </p>
          <p className="text-ink-muted text-sm leading-relaxed mb-4">
            Create a free Mapbox account, grab a public token, and add it to{' '}
            <span className="mono-num bg-base-500 px-1.5 py-0.5 rounded">.env.local</span>:
          </p>
          <pre className="mono-num text-xs bg-base-900 p-3 rounded border border-ink/10 text-left">
            VITE_MAPBOX_TOKEN=pk.xxxx
          </pre>
          <p className="text-ink-dim text-xs mt-4">Restart dev server after adding.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-md overflow-hidden"
      style={{ background: '#0E0B08' }}
    />
  )
}
