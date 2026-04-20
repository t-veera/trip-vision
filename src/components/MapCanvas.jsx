import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import {
  CATEGORY_MAP,
  getRoute,
} from '../lib'

// ─────────────────────────────────────────────────────────────────────────────
// MapCanvas
//
// MapLibre GL + Carto dark raster tiles. No auth, no token, no CC.
// Renders the active day's stops as numbered pins, draws routed lines between
// them via OSRM. "Play" mode flies through stops cinematically.
// ─────────────────────────────────────────────────────────────────────────────

// Custom map style — uses Carto's Voyager basemap (light, subtle, free, no auth).
const MAP_STYLE = {
  version: 8,
  sources: {
    'carto-voyager': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/attributions">Carto</a>',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#F4EFE6' },
    },
    {
      id: 'carto-voyager-layer',
      type: 'raster',
      source: 'carto-voyager',
    },
  ],
}

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

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: trip.mapCenter || [78.9, 20.5],
      zoom: trip.mapZoom || 9,
      pitch: 0, // raster tiles look weird pitched
      bearing: 0,
      attributionControl: false,
    })

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    map.on('load', () => {
      map.addSource('day-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })

      map.addLayer({
        id: 'day-route-halo',
        type: 'line',
        source: 'day-route',
        paint: {
          'line-color': trip.accentColor || '#E8583A',
          'line-width': 10,
          'line-opacity': 0.18,
          'line-blur': 4,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      })

      map.addLayer({
        id: 'day-route-line',
        type: 'line',
        source: 'day-route',
        paint: {
          'line-color': trip.accentColor || '#E8583A',
          'line-width': 3,
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

  const editorModeRef = useRef(editorMode)
  const onMapClickRef = useRef(onMapClick)
  useEffect(() => {
    editorModeRef.current = editorMode
    onMapClickRef.current = onMapClick
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = editorMode ? 'crosshair' : ''
    }
  }, [editorMode, onMapClick])

  // Accent color update
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current
    map.setPaintProperty('day-route-halo', 'line-color', trip.accentColor || '#E8583A')
    map.setPaintProperty('day-route-line', 'line-color', trip.accentColor || '#E8583A')
  }, [trip.accentColor, mapReady])

  // ─── Markers ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current

    Object.values(markersRef.current).forEach((m) => m.remove())
    markersRef.current = {}

    stops.forEach((stop, idx) => {
      const place = trip.places.find((p) => p.id === stop.placeId)
      if (!place) return

      const el = document.createElement('div')
      el.className = `pin cat-${place.category} ${activePlaceId === place.id ? 'is-active' : ''}`
      el.textContent = String(idx + 1)

      el.addEventListener('mouseenter', () => onHoverPlace?.(place, stop, idx))
      el.addEventListener('mouseleave', () => onHoverPlace?.(null, null, -1))
      el.addEventListener('click', (e) => {
        e.stopPropagation()
        onActivePlaceChange?.(place.id)
      })

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat(place.coords)
        .addTo(map)
      markersRef.current[`${idx}-${place.id}`] = marker
    })

    // Ghost markers for stays not in this day
    trip.places
      .filter((p) => p.category === 'stay')
      .forEach((place) => {
        if (stops.some((s) => s.placeId === place.id)) return
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
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat(place.coords)
          .addTo(map)
        markersRef.current[`ghost-${place.id}`] = marker
      })
  }, [stops, trip.places, activePlaceId, mapReady, onHoverPlace, onActivePlaceChange])

  // ─── Routes ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current

    if (stops.length < 2) {
      map.getSource('day-route')?.setData({ type: 'FeatureCollection', features: [] })
      // Still fit bounds on single stop
      if (stops.length === 1) {
        const c = trip.places.find((p) => p.id === stops[0].placeId)?.coords
        if (c) map.flyTo({ center: c, zoom: 13, duration: 900 })
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

      if (!playing && stops.length) {
        const coords = stops
          .map((s) => trip.places.find((p) => p.id === s.placeId)?.coords)
          .filter(Boolean)
        if (coords.length > 1) {
          const bounds = coords.reduce(
            (b, c) => b.extend(c),
            new maplibregl.LngLatBounds(coords[0], coords[0])
          )
          mapRef.current?.fitBounds(bounds, { padding: 100, duration: 900 })
        }
      }
    })()

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDay, trip.id, mapReady])

  // ─── Play mode ────────────────────────────────────────────────────────────
  const stopsRef = useRef(stops)
  useEffect(() => { stopsRef.current = stops }, [stops])

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
    const t = setTimeout(() => onPlayStepChange?.(playStep + 1), 3600)
    return () => clearTimeout(t)
  }, [playing, playStep, mapReady, stops.length, flyToStop, onPlayStepChange, onPlayEnd])

  // External selection → fly to
  useEffect(() => {
    if (!mapReady || !activePlaceId) return
    const place = trip.places.find((p) => p.id === activePlaceId)
    if (!place) return
    mapRef.current?.flyTo({ center: place.coords, zoom: 13, duration: 900 })
  }, [activePlaceId, mapReady, trip.places])

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-md overflow-hidden"
      style={{ background: '#F4EFE6' }}
    />
  )
}
