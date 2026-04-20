// ─────────────────────────────────────────────────────────────────────────────
// Trip store: loads default trip JSONs, merges with localStorage overrides.
// Handles schema migrations forward.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useSyncExternalStore } from 'react'
import sriLankaSurf from './trips/sri-lanka-surf.json'
import ladakhWinter from './trips/ladakh-winter.json'

const DEFAULT_TRIPS = [sriLankaSurf, ladakhWinter]
const STORAGE_KEY = 'tv:trips:v2'
const ACTIVE_KEY = 'tv:active-trip:v2'

// ─── Migration ──────────────────────────────────────────────────────────────
// Ensures any trip loaded from localStorage has all the new fields we expect.
function migrate(trip) {
  const t = { ...trip }

  // Add origin if missing
  if (!t.origin) t.origin = ''

  // Add info.insurance / info.medical if missing
  t.info = t.info || {}
  if (!t.info.insurance) t.info.insurance = { title: 'Travel Insurance', notes: '', cost: 0, url: '' }
  if (!t.info.medical) t.info.medical = { title: 'Medical / Vaccinations', notes: '', cost: 0, url: '' }
  // Ensure all info items have a url field
  Object.keys(t.info).forEach((k) => {
    if (t.info[k] && t.info[k].url === undefined) t.info[k].url = ''
  })
  // Exchange rate prominence
  if (t.info.exchange && t.info.exchange.rate === undefined) {
    t.info.exchange.rate = ''
  }

  // Convert old flights array to new transport array (with type: 'flight')
  if (Array.isArray(t.flights) && !t.transport) {
    t.transport = t.flights.map((f, i) => ({
      id: f.id || `t${i + 1}`,
      type: 'flight',
      from: f.from || '',
      to: f.to || '',
      date: f.date || '',
      time: f.time || '',
      provider: f.airline || '',
      cost: f.cost || 0,
      notes: f.notes || '',
    }))
    delete t.flights
  }
  if (!t.transport) t.transport = []

  // Ensure places have address
  t.places = (t.places || []).map((p) => ({ ...p, address: p.address || '' }))

  // Ensure every day has miscExpenses
  t.days = (t.days || []).map((d) => ({ ...d, miscExpenses: d.miscExpenses || [] }))

  // Convert flat packing array to grouped if needed
  if (Array.isArray(t.packing) && t.packing.length > 0 && t.packing[0].text !== undefined) {
    t.packing = [{ id: 'bag-default', title: 'Bag', items: t.packing }]
  }
  if (!Array.isArray(t.packing)) t.packing = []

  return t
}

// ─── State ──────────────────────────────────────────────────────────────────
let state = loadInitialState()
const listeners = new Set()

function loadInitialState() {
  let activeId = null
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('trip')
    const fromStorage = localStorage.getItem(ACTIVE_KEY)
    activeId = fromUrl || fromStorage
  } catch {}
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (stored && Array.isArray(stored) && stored.length > 0) {
      const merged = [...stored]
      DEFAULT_TRIPS.forEach((def) => {
        if (!merged.some((t) => t.id === def.id)) merged.unshift(clone(def))
      })
      const trips = merged.map(migrate)
      return { trips, activeId: trips.find((t) => t.id === activeId) ? activeId : trips[0]?.id }
    }
  } catch {}
  const trips = DEFAULT_TRIPS.map(clone)
  return { trips, activeId: trips.find((t) => t.id === activeId) ? activeId : trips[0]?.id }
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

// ─── Public hooks ───────────────────────────────────────────────────────────
function getSnapshot() { return state }

export function useTrips() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return s.trips
}

export function useActiveTripId() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return s.activeId
}

export function setActiveTripId(id) {
  state = { ...state, activeId: id }
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
  state = { ...state, trips: [...state.trips, migrate(trip)] }
  emit()
  setActiveTripId(trip.id)
}

export function deleteTrip(tripId) {
  state = { ...state, trips: state.trips.filter((t) => t.id !== tripId) }
  if (state.trips.length === 0) state.trips = DEFAULT_TRIPS.map(clone)
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
    days: t.days.map((d) => ({ ...d, stops: d.stops.filter((s) => s.placeId !== placeId) })),
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
    days: t.days.map((d) => (d.day === dayNum ? { ...d, stops: d.stops.filter((_, i) => i !== stopIndex) } : d)),
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
    days: t.days.map((d) =>
      d.day === dayNum ? { ...d, stops: d.stops.map((s, i) => (i === stopIndex ? { ...s, ...patch } : s)) } : d
    ),
  }))
}

// ─── Misc expenses ──────────────────────────────────────────────────────────
export function addMiscExpense(tripId, dayNum, expense) {
  updateTrip(tripId, (t) => ({
    days: t.days.map((d) =>
      d.day === dayNum ? { ...d, miscExpenses: [...(d.miscExpenses || []), expense] } : d
    ),
  }))
}
export function updateMiscExpense(tripId, dayNum, expenseId, patch) {
  updateTrip(tripId, (t) => ({
    days: t.days.map((d) =>
      d.day === dayNum
        ? { ...d, miscExpenses: d.miscExpenses.map((e) => (e.id === expenseId ? { ...e, ...patch } : e)) }
        : d
    ),
  }))
}
export function removeMiscExpense(tripId, dayNum, expenseId) {
  updateTrip(tripId, (t) => ({
    days: t.days.map((d) =>
      d.day === dayNum ? { ...d, miscExpenses: d.miscExpenses.filter((e) => e.id !== expenseId) } : d
    ),
  }))
}

// ─── Transport ──────────────────────────────────────────────────────────────
export function addTransport(tripId, entry) {
  updateTrip(tripId, (t) => ({ transport: [...(t.transport || []), entry] }))
}
export function updateTransport(tripId, id, patch) {
  updateTrip(tripId, (t) => ({
    transport: t.transport.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  }))
}
export function removeTransport(tripId, id) {
  updateTrip(tripId, (t) => ({ transport: t.transport.filter((x) => x.id !== id) }))
}

// ─── Packing groups ─────────────────────────────────────────────────────────
export function addPackingGroup(tripId, group) {
  updateTrip(tripId, (t) => ({ packing: [...(t.packing || []), group] }))
}
export function updatePackingGroup(tripId, groupId, patch) {
  updateTrip(tripId, (t) => ({
    packing: t.packing.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
  }))
}
export function removePackingGroup(tripId, groupId) {
  updateTrip(tripId, (t) => ({ packing: t.packing.filter((g) => g.id !== groupId) }))
}
export function addPackingItem(tripId, groupId, item) {
  updateTrip(tripId, (t) => ({
    packing: t.packing.map((g) =>
      g.id === groupId ? { ...g, items: [...(g.items || []), item] } : g
    ),
  }))
}
export function updatePackingItem(tripId, groupId, itemId, patch) {
  updateTrip(tripId, (t) => ({
    packing: t.packing.map((g) =>
      g.id === groupId
        ? { ...g, items: g.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
        : g
    ),
  }))
}
export function removePackingItem(tripId, groupId, itemId) {
  updateTrip(tripId, (t) => ({
    packing: t.packing.map((g) =>
      g.id === groupId ? { ...g, items: g.items.filter((it) => it.id !== itemId) } : g
    ),
  }))
}

// ─── Utilities ──────────────────────────────────────────────────────────────
export function makeEmptyTrip(name = 'New trip') {
  const id =
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  return {
    id, name, origin: '',
    vision: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    currency: 'INR',
    accentColor: '#E8583A',
    heroImage: '',
    mapCenter: [78.9, 20.5],
    mapZoom: 4,
    info: {
      visa: { title: 'Visa', notes: '', cost: 0, url: '' },
      esim: { title: 'E-SIM', notes: '', cost: 0, url: '' },
      network: { title: 'Mobile Network', notes: '', cost: 0, url: '' },
      exchange: { title: 'Exchange Rate', rate: '', notes: '', cost: 0, url: '' },
      insurance: { title: 'Travel Insurance', notes: '', cost: 0, url: '' },
      medical: { title: 'Medical / Vaccinations', notes: '', cost: 0, url: '' },
    },
    transport: [],
    places: [],
    days: [{ day: 1, date: new Date().toISOString().slice(0, 10), title: 'Day 1', stops: [], miscExpenses: [] }],
    packing: [{ id: 'bag-1', title: 'Suitcase', items: [] }],
    checklist: [],
  }
}

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
