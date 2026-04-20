// ─────────────────────────────────────────────────────────────────────────────
// Trip store: loads default trip JSONs, merges with localStorage overrides,
// exposes simple mutation API. Deliberately tiny — no Redux, no Zustand.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useSyncExternalStore } from 'react'
import sriLankaSurf from './trips/sri-lanka-surf.json'

const DEFAULT_TRIPS = [sriLankaSurf]
const STORAGE_KEY = 'tv:trips:v1'
const ACTIVE_KEY = 'tv:active-trip:v1'

// ─── State ──────────────────────────────────────────────────────────────────
let state = loadInitialState()
const listeners = new Set()

function loadInitialState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (stored && Array.isArray(stored) && stored.length > 0) {
      // Ensure default trip is present (migration)
      const hasDefault = stored.some((t) => t.id === sriLankaSurf.id)
      if (!hasDefault) stored.unshift(sriLankaSurf)
      return { trips: stored }
    }
  } catch {}
  return { trips: DEFAULT_TRIPS.map(clone) }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.trips))
  } catch {}
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function emit() {
  persist()
  listeners.forEach((l) => l())
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

// ─── Public store hook ──────────────────────────────────────────────────────
export function useTrips() {
  return useSyncExternalStore(
    subscribe,
    () => state.trips,
    () => state.trips
  )
}

export function useActiveTripId() {
  const trips = useTrips()
  const fromStorage = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_KEY) : null
  const fromUrl = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('trip') : null
  const preferred = fromUrl || fromStorage || trips[0]?.id
  return trips.find((t) => t.id === preferred) ? preferred : trips[0]?.id
}

export function setActiveTripId(id) {
  try {
    localStorage.setItem(ACTIVE_KEY, id)
    const url = new URL(window.location)
    url.searchParams.set('trip', id)
    window.history.replaceState({}, '', url)
  } catch {}
  emit()
}

export function useActiveTrip() {
  const trips = useTrips()
  const id = useActiveTripId()
  return trips.find((t) => t.id === id) || trips[0]
}

// ─── Mutations ──────────────────────────────────────────────────────────────
export function updateTrip(tripId, updater) {
  state = {
    ...state,
    trips: state.trips.map((t) => {
      if (t.id !== tripId) return t
      const next = typeof updater === 'function' ? updater(clone(t)) : updater
      return { ...t, ...next }
    }),
  }
  emit()
}

export function addTrip(trip) {
  state = { ...state, trips: [...state.trips, trip] }
  emit()
  setActiveTripId(trip.id)
}

export function deleteTrip(tripId) {
  state = { ...state, trips: state.trips.filter((t) => t.id !== tripId) }
  if (state.trips.length === 0) state.trips = [clone(sriLankaSurf)]
  emit()
  setActiveTripId(state.trips[0].id)
}

export function resetTrip(tripId) {
  const def = DEFAULT_TRIPS.find((t) => t.id === tripId)
  if (!def) return
  updateTrip(tripId, () => clone(def))
}

// ─── Place mutations ────────────────────────────────────────────────────────
export function addPlace(tripId, place) {
  updateTrip(tripId, (t) => ({ places: [...(t.places || []), place] }))
}

export function updatePlace(tripId, placeId, patch) {
  updateTrip(tripId, (t) => ({
    places: t.places.map((p) => (p.id === placeId ? { ...p, ...patch } : p)),
  }))
}

export function deletePlace(tripId, placeId) {
  updateTrip(tripId, (t) => ({
    places: t.places.filter((p) => p.id !== placeId),
    days: t.days.map((d) => ({
      ...d,
      stops: d.stops.filter((s) => s.placeId !== placeId),
    })),
  }))
}

// ─── Day / stop mutations ───────────────────────────────────────────────────
export function insertStop(tripId, dayNum, stop, atIndex) {
  updateTrip(tripId, (t) => ({
    days: t.days.map((d) => {
      if (d.day !== dayNum) return d
      const stops = [...d.stops]
      if (atIndex === undefined || atIndex > stops.length) stops.push(stop)
      else stops.splice(atIndex, 0, stop)
      return { ...d, stops }
    }),
  }))
}

export function removeStop(tripId, dayNum, stopIndex) {
  updateTrip(tripId, (t) => ({
    days: t.days.map((d) => {
      if (d.day !== dayNum) return d
      const stops = d.stops.filter((_, i) => i !== stopIndex)
      return { ...d, stops }
    }),
  }))
}

export function moveStop(tripId, dayNum, fromIndex, toIndex) {
  updateTrip(tripId, (t) => ({
    days: t.days.map((d) => {
      if (d.day !== dayNum) return d
      const stops = [...d.stops]
      const [moved] = stops.splice(fromIndex, 1)
      stops.splice(toIndex, 0, moved)
      return { ...d, stops }
    }),
  }))
}

export function updateStop(tripId, dayNum, stopIndex, patch) {
  updateTrip(tripId, (t) => ({
    days: t.days.map((d) => {
      if (d.day !== dayNum) return d
      const stops = d.stops.map((s, i) => (i === stopIndex ? { ...s, ...patch } : s))
      return { ...d, stops }
    }),
  }))
}

// ─── Utilities ──────────────────────────────────────────────────────────────
export function makeEmptyTrip(name = 'New trip') {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
  return {
    id,
    name,
    vision: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    currency: 'INR',
    accentColor: '#E8583A',
    heroImage: '',
    mapCenter: [78.9, 20.5],
    mapZoom: 4,
    info: {
      visa: { title: 'Visa', notes: '', cost: 0 },
      esim: { title: 'E-SIM', notes: '', cost: 0 },
      network: { title: 'Mobile Network', notes: '', cost: 0 },
      exchange: { title: 'Exchange Rate', notes: '', cost: 0 },
    },
    flights: [],
    places: [],
    days: [{ day: 1, date: new Date().toISOString().slice(0, 10), title: 'Day 1', stops: [] }],
    packing: [],
    checklist: [],
  }
}

// Keep URL query param in sync with active trip on mount
export function useUrlSync() {
  const trips = useTrips()
  const activeId = useActiveTripId()
  useEffect(() => {
    if (!activeId) return
    const url = new URL(window.location)
    if (url.searchParams.get('trip') !== activeId) {
      url.searchParams.set('trip', activeId)
      window.history.replaceState({}, '', url)
    }
  }, [activeId, trips.length])
}
