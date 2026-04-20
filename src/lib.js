// ─────────────────────────────────────────────────────────────────────────────
// Shared utilities: OSRM directions, currency formatting, localStorage, dates,
// Google Maps / tel: link builders.
// ─────────────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'stay', label: 'Stay', hint: 'hotels, hostels, surf schools' },
  { id: 'cafe', label: 'Cafes', hint: 'coffee, breakfast, work spots' },
  { id: 'restaurant', label: 'Restaurants', hint: 'meals, dinners' },
  { id: 'chill', label: 'Chill zones', hint: 'beaches, viewpoints, parks' },
  { id: 'special', label: 'Special zones', hint: 'classes, experiences' },
  { id: 'rental', label: 'Rental', hint: 'scooty, bicycle' },
  { id: 'transport', label: 'Transport', hint: 'airports, stations, cabs' },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]))

export const TIME_SLOTS = ['morning', 'afternoon', 'evening']

export const TRANSPORT_TYPES = [
  { id: 'flight', label: 'Flight', icon: '✈' },
  { id: 'train', label: 'Train', icon: '⟨⟩' },
  { id: 'cab', label: 'Cab', icon: '⌁' },
  { id: 'bus', label: 'Bus', icon: '⊟' },
  { id: 'ferry', label: 'Ferry', icon: '⌇' },
]

// ─── Currency ───────────────────────────────────────────────────────────────
// Rates are INR → target. Editable from the UI (stored with the trip).
export const DEFAULT_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  LKR: 3.55,
  GBP: 0.0094,
  AED: 0.044,
  THB: 0.39,
  JPY: 1.8,
}

export const CURRENCY_SYMBOLS = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  LKR: 'Rs',
  GBP: '£',
  AED: 'AED',
  THB: '฿',
  JPY: '¥',
}

export function convertFromINR(amountInINR, targetCurrency, rates = DEFAULT_RATES) {
  const rate = rates[targetCurrency] ?? 1
  return amountInINR * rate
}

export function formatMoney(amountInINR, currency = 'INR', rates = DEFAULT_RATES) {
  const value = convertFromINR(amountInINR, currency, rates)
  const symbol = CURRENCY_SYMBOLS[currency] || currency
  const rounded =
    value >= 100
      ? Math.round(value).toLocaleString('en-IN')
      : value.toFixed(2)
  return `${symbol}${currency === 'AED' ? ' ' : ''}${rounded}`
}

// ─── Dates ──────────────────────────────────────────────────────────────────
export function formatDate(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function dayOfWeek(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { weekday: 'short' })
  } catch {
    return ''
  }
}

export function tripDurationDays(trip) {
  if (!trip?.startDate || !trip?.endDate) return trip?.days?.length || 0
  const start = new Date(trip.startDate)
  const end = new Date(trip.endDate)
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1)
}

// ─── Routing (OSRM public demo server) ──────────────────────────────────────
// No API key needed. For heavy use, self-host OSRM or swap to OpenRouteService.
// Returns { geometry, distanceMeters, durationSeconds }

const routeCache = {
  _get(key) {
    try {
      return JSON.parse(localStorage.getItem(`tv:route:${key}`) || 'null')
    } catch {
      return null
    }
  },
  _set(key, val) {
    try {
      localStorage.setItem(`tv:route:${key}`, JSON.stringify(val))
    } catch {}
  },
}

function cacheKey(profile, from, to) {
  return `${profile}|${from.join(',')}|${to.join(',')}`
}

export async function getRoute(from, to, profile = 'driving') {
  if (!from || !to) return null

  // Flights use great-circle arcs, trains fall back to driving.
  if (profile === 'flight') {
    return {
      geometry: greatCircle(from, to),
      distanceMeters: haversine(from, to) * 1000,
      durationSeconds: (haversine(from, to) / 700) * 3600,
      synthesized: true,
    }
  }
  if (profile === 'train' || profile === 'bus' || profile === 'cab') {
    profile = 'driving'
  }

  const key = cacheKey(profile, from, to)
  const cached = routeCache._get(key)
  if (cached) return cached

  try {
    // OSRM public demo
    const url = `https://router.project-osrm.org/route/v1/${profile}/${from.join(',')};${to.join(',')}?geometries=geojson&overview=full`
    const res = await fetch(url)
    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) throw new Error('no route')

    const result = {
      geometry: route.geometry,
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      synthesized: false,
    }
    routeCache._set(key, result)
    return result
  } catch (err) {
    console.warn('OSRM routing failed, falling back to straight line:', err)
    return {
      geometry: { type: 'LineString', coordinates: [from, to] },
      distanceMeters: haversine(from, to) * 1000,
      durationSeconds: (haversine(from, to) / 50) * 3600,
      synthesized: true,
    }
  }
}

function haversine([lng1, lat1], [lng2, lat2]) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function greatCircle(from, to, steps = 48) {
  const coords = []
  for (let i = 0; i <= steps; i++) {
    const f = i / steps
    const [lng1, lat1] = from.map((v) => (v * Math.PI) / 180)
    const [lng2, lat2] = to.map((v) => (v * Math.PI) / 180)
    const d =
      2 *
      Math.asin(
        Math.sqrt(
          Math.sin((lat2 - lat1) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
        )
      )
    if (d === 0) {
      coords.push(from)
      continue
    }
    const A = Math.sin((1 - f) * d) / Math.sin(d)
    const B = Math.sin(f * d) / Math.sin(d)
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2)
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2)
    const z = A * Math.sin(lat1) + B * Math.sin(lat2)
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
    const lng = Math.atan2(y, x)
    coords.push([(lng * 180) / Math.PI, (lat * 180) / Math.PI])
  }
  return { type: 'LineString', coordinates: coords }
}

export function formatDistance(meters) {
  if (!meters && meters !== 0) return '—'
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '—'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

// ─── Link builders ──────────────────────────────────────────────────────────
// Google Maps link: prefers address + name, falls back to coords
export function mapsLink(place) {
  if (!place) return '#'
  if (place.address) {
    const query = encodeURIComponent(`${place.name}, ${place.address}`)
    return `https://www.google.com/maps/search/?api=1&query=${query}`
  }
  if (place.coords) {
    return `https://www.google.com/maps/search/?api=1&query=${place.coords[1]},${place.coords[0]}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`
}

export function telLink(phone) {
  if (!phone) return ''
  // Keep + at start if present, strip spaces/dashes/parens
  const clean = phone.replace(/[\s\-()]/g, '')
  return `tel:${clean}`
}

// ─── Share builder ──────────────────────────────────────────────────────────
export function buildShareUrl(tripId) {
  try {
    const url = new URL(window.location.href)
    url.searchParams.set('trip', tripId)
    // Remove editor hash/state
    url.hash = ''
    return url.toString()
  } catch {
    return ''
  }
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// ─── Misc ───────────────────────────────────────────────────────────────────
export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function download(filename, content) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
