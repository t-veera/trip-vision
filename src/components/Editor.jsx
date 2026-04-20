import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CATEGORIES, CATEGORY_MAP, TIME_SLOTS, uid, download } from '../lib'
import {
  addPlace,
  updatePlace,
  deletePlace,
  insertStop,
  removeStop,
  moveStop,
  updateStop,
  updateTrip,
} from '../store'

// ─────────────────────────────────────────────────────────────────────────────
// Editor — the authoring layer. Shown when editorMode is on.
//
// Left: list of all places in the trip, filterable by category, with
//       add / edit / delete.
// Right: day composer — pick a day, re-arrange stops, add new stops from
//        the place pool, edit per-stop experience/time/vision.
//
// Also provides Export JSON for backups and Import JSON for restoring.
// ─────────────────────────────────────────────────────────────────────────────

export default function Editor({
  trip,
  activeDay,
  onActiveDayChange,
  pendingCoords,
  onPendingCoordsConsumed,
}) {
  const [tab, setTab] = useState('places')
  const [editingPlace, setEditingPlace] = useState(null)
  const [filter, setFilter] = useState('all')

  // When user clicks the map in editor mode, pendingCoords are set.
  // Open the new-place form pre-filled.
  useEffect(() => {
    if (pendingCoords && !editingPlace) {
      setEditingPlace({
        id: uid('place'),
        name: '',
        category: 'cafe',
        coords: pendingCoords,
        image: '',
        notes: '',
        priceINR: 0,
        priceUnit: '',
        contact: '',
      })
      onPendingCoordsConsumed()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCoords])

  const savePlace = (place, isNew) => {
    if (isNew) addPlace(trip.id, place)
    else updatePlace(trip.id, place.id, place)
    setEditingPlace(null)
  }

  const exportJSON = () => {
    download(`${trip.id}.json`, JSON.stringify(trip, null, 2))
  }

  const importJSON = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        updateTrip(trip.id, data)
      } catch (err) {
        alert('Invalid JSON')
      }
    }
    reader.readAsText(file)
  }

  const filteredPlaces =
    filter === 'all' ? trip.places : trip.places.filter((p) => p.category === filter)

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-base-800 border-l border-ink/10 z-40 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-ink/10 flex items-center justify-between">
        <div>
          <div className="editorial-kicker mb-0.5">Editor</div>
          <div className="mono-num text-xs text-ink-muted">click the map to drop a new pin</div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={exportJSON} className="btn-pill" title="Export trip to JSON">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 1v6m-2-2l2 2 2-2M1 8h8" />
            </svg>
            Export
          </button>
          <label className="btn-pill cursor-pointer">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 7V1m-2 2l2-2 2 2M1 8h8" />
            </svg>
            Import
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => e.target.files[0] && importJSON(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-3 flex gap-4 border-b border-ink/10">
        <TabBtn label="Places" active={tab === 'places'} onClick={() => setTab('places')} />
        <TabBtn label="Day composer" active={tab === 'days'} onClick={() => setTab('days')} />
        <TabBtn label="Meta" active={tab === 'meta'} onClick={() => setTab('meta')} />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'places' && (
          <PlacesTab
            trip={trip}
            filter={filter}
            setFilter={setFilter}
            filteredPlaces={filteredPlaces}
            onEdit={setEditingPlace}
            onNew={() =>
              setEditingPlace({
                id: uid('place'),
                name: '',
                category: 'cafe',
                coords: trip.mapCenter,
                image: '',
                notes: '',
                priceINR: 0,
                priceUnit: '',
                contact: '',
              })
            }
            onDelete={(id) => deletePlace(trip.id, id)}
          />
        )}

        {tab === 'days' && (
          <DaysTab
            trip={trip}
            activeDay={activeDay}
            onActiveDayChange={onActiveDayChange}
          />
        )}

        {tab === 'meta' && <MetaTab trip={trip} />}
      </div>

      {/* Place edit modal */}
      <AnimatePresence>
        {editingPlace && (
          <PlaceForm
            place={editingPlace}
            isNew={!trip.places.find((p) => p.id === editingPlace.id)}
            onSave={savePlace}
            onCancel={() => setEditingPlace(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function TabBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2.5 text-xs tracking-wide transition relative ${
        active ? 'text-ink' : 'text-ink-dim hover:text-ink-muted'
      }`}
    >
      {label}
      {active && (
        <motion.div
          layoutId="tab-underline"
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </button>
  )
}

// ─── Places tab ─────────────────────────────────────────────────────────────
function PlacesTab({ trip, filter, setFilter, filteredPlaces, onEdit, onNew, onDelete }) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-ink-muted">
          {trip.places.length} place{trip.places.length !== 1 ? 's' : ''}
        </div>
        <button onClick={onNew} className="btn-accent" style={{ background: trip.accentColor }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 1v8M1 5h8" />
          </svg>
          New place
        </button>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`text-[10px] mono-num uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border transition ${
            filter === 'all'
              ? 'text-ink border-ink/30 bg-ink/5'
              : 'text-ink-dim border-ink/10 hover:text-ink-muted'
          }`}
        >
          all
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`cat-${c.id} text-[10px] mono-num uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border transition ${
              filter === c.id
                ? 'text-ink border-ink/30 bg-ink/5'
                : 'text-ink-dim border-ink/10 hover:text-ink-muted'
            }`}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
              style={{ background: 'var(--cat)' }}
            />
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        {filteredPlaces.map((p) => (
          <div
            key={p.id}
            className={`cat-${p.category} group flex items-center gap-3 p-3 rounded border border-ink/5 hover:border-ink/15 hover:bg-ink/[0.02] transition cursor-pointer`}
            onClick={() => onEdit(p)}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: 'var(--cat)' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-ink truncate">{p.name || '(untitled)'}</div>
              <div className="mono-num text-[10px] uppercase tracking-[0.15em] text-ink-dim">
                {CATEGORY_MAP[p.category]?.label}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Delete "${p.name}"?`)) onDelete(p.id)
              }}
              className="text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h10M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1M4 3l.5 9a1 1 0 001 1h3a1 1 0 001-1L10 3" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Days tab ───────────────────────────────────────────────────────────────
function DaysTab({ trip, activeDay, onActiveDayChange }) {
  const [addingStop, setAddingStop] = useState(false)
  const day = trip.days.find((d) => d.day === activeDay) || trip.days[0]

  const addStop = (placeId) => {
    insertStop(trip.id, day.day, {
      placeId,
      time: 'morning',
      experience: '',
      visionTags: [],
    })
    setAddingStop(false)
  }

  const addDay = () => {
    const lastDay = trip.days[trip.days.length - 1]
    const nextDate = new Date(lastDay?.date || new Date())
    nextDate.setDate(nextDate.getDate() + 1)
    updateTrip(trip.id, (t) => ({
      days: [
        ...t.days,
        {
          day: t.days.length + 1,
          date: nextDate.toISOString().slice(0, 10),
          title: `Day ${t.days.length + 1}`,
          stops: [],
        },
      ],
    }))
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <select
          value={activeDay}
          onChange={(e) => onActiveDayChange(Number(e.target.value))}
          className="flex-1 mr-2 bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-ink/30"
        >
          {trip.days.map((d) => (
            <option key={d.day} value={d.day}>
              Day {d.day} — {d.title}
            </option>
          ))}
        </select>
        <button onClick={addDay} className="btn-pill">+ Day</button>
      </div>

      {/* Day title + date */}
      <div className="soft-panel p-3 mb-4 space-y-2">
        <input
          value={day.title}
          onChange={(e) =>
            updateTrip(trip.id, (t) => ({
              days: t.days.map((d) => (d.day === day.day ? { ...d, title: e.target.value } : d)),
            }))
          }
          placeholder="Day title"
          className="inline-input font-display text-lg text-ink"
        />
        <input
          type="date"
          value={day.date}
          onChange={(e) =>
            updateTrip(trip.id, (t) => ({
              days: t.days.map((d) => (d.day === day.day ? { ...d, date: e.target.value } : d)),
            }))
          }
          className="inline-input mono-num text-xs text-ink-muted"
        />
      </div>

      {/* Stops */}
      <div className="mb-3 flex items-center justify-between">
        <div className="editorial-kicker">Stops</div>
        <button
          onClick={() => setAddingStop((s) => !s)}
          className="btn-pill"
        >
          {addingStop ? 'Cancel' : '+ Add stop'}
        </button>
      </div>

      {addingStop && (
        <div className="soft-panel p-3 mb-3 max-h-64 overflow-y-auto">
          <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-2">
            Pick from places
          </div>
          {trip.places.map((p) => (
            <button
              key={p.id}
              onClick={() => addStop(p.id)}
              className={`cat-${p.category} flex items-center gap-2 w-full p-2 rounded hover:bg-ink/5 text-left transition`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cat)' }} />
              <span className="text-sm text-ink flex-1 truncate">{p.name}</span>
              <span className="mono-num text-[10px] uppercase text-ink-dim">
                {CATEGORY_MAP[p.category]?.label}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {day.stops.map((stop, idx) => {
          const place = trip.places.find((p) => p.id === stop.placeId)
          if (!place) return null
          return (
            <div key={idx} className={`cat-${place.category} soft-panel p-3`}>
              <div className="flex items-start gap-2 mb-2">
                <div
                  className={`pin cat-${place.category}`}
                  style={{ width: 18, height: 18, fontSize: 10, borderWidth: 1 }}
                >
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink truncate">{place.name}</div>
                  <div className="mono-num text-[10px] uppercase tracking-[0.15em] text-ink-dim">
                    {CATEGORY_MAP[place.category]?.label}
                  </div>
                </div>
                <div className="flex gap-0.5">
                  <button
                    onClick={() => idx > 0 && moveStop(trip.id, day.day, idx, idx - 1)}
                    disabled={idx === 0}
                    className="text-ink-dim hover:text-ink p-1 disabled:opacity-30"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 7V2m-2 2l2-2 2 2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => idx < day.stops.length - 1 && moveStop(trip.id, day.day, idx, idx + 1)}
                    disabled={idx === day.stops.length - 1}
                    className="text-ink-dim hover:text-ink p-1 disabled:opacity-30"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 3v5m-2-2l2 2 2-2" />
                    </svg>
                  </button>
                  <button
                    onClick={() => removeStop(trip.id, day.day, idx)}
                    className="text-ink-dim hover:text-ink p-1"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3l6 6M9 3l-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <select
                  value={stop.time}
                  onChange={(e) => updateStop(trip.id, day.day, idx, { time: e.target.value })}
                  className="bg-base-900 border border-ink/10 rounded px-2 py-1 text-xs text-ink focus:outline-none"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  value={(stop.visionTags || []).join(', ')}
                  onChange={(e) =>
                    updateStop(trip.id, day.day, idx, {
                      visionTags: e.target.value
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="vision tags (comma)"
                  className="bg-base-900 border border-ink/10 rounded px-2 py-1 text-xs text-ink placeholder:text-ink-dim focus:outline-none"
                />
              </div>
              <input
                value={stop.experience}
                onChange={(e) => updateStop(trip.id, day.day, idx, { experience: e.target.value })}
                placeholder="what's the experience?"
                className="mt-2 w-full bg-base-900 border border-ink/10 rounded px-2 py-1 text-xs text-ink-muted placeholder:text-ink-dim focus:outline-none italic"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Meta tab ───────────────────────────────────────────────────────────────
function MetaTab({ trip }) {
  const set = (patch) => updateTrip(trip.id, patch)

  return (
    <div className="p-5 space-y-4">
      <Field label="Trip name">
        <input
          value={trip.name}
          onChange={(e) => set({ name: e.target.value })}
          className="inline-input font-display text-xl text-ink"
        />
      </Field>
      <Field label="Vision">
        <textarea
          value={trip.vision}
          onChange={(e) => set({ vision: e.target.value })}
          rows={4}
          className="w-full bg-base-900 border border-ink/10 rounded px-3 py-2 text-sm text-ink resize-none focus:outline-none focus:border-ink/30 leading-relaxed"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start date">
          <input
            type="date"
            value={trip.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none"
          />
        </Field>
        <Field label="End date">
          <input
            type="date"
            value={trip.endDate}
            onChange={(e) => set({ endDate: e.target.value })}
            className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none"
          />
        </Field>
      </div>
      <Field label="Accent color">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={trip.accentColor}
            onChange={(e) => set({ accentColor: e.target.value })}
            className="w-10 h-10 rounded border border-ink/10 bg-transparent cursor-pointer"
          />
          <input
            value={trip.accentColor}
            onChange={(e) => set({ accentColor: e.target.value })}
            className="flex-1 bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm mono-num text-ink focus:outline-none"
          />
        </div>
      </Field>
      <Field label="Hero image URL">
        <input
          value={trip.heroImage || ''}
          onChange={(e) => set({ heroImage: e.target.value })}
          placeholder="https://…"
          className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none"
        />
      </Field>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <div className="editorial-kicker mb-1.5">{label}</div>
      {children}
    </div>
  )
}

// ─── Place form (modal) ─────────────────────────────────────────────────────
function PlaceForm({ place, isNew, onSave, onCancel }) {
  const [draft, setDraft] = useState(place)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-base-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-base-800 border border-ink/15 rounded-md w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-5 border-b border-ink/10 flex items-center justify-between">
          <div>
            <div className="editorial-kicker mb-0.5">{isNew ? 'New place' : 'Edit place'}</div>
            <h2 className="font-display text-2xl text-ink display-tight">
              {draft.name || 'Untitled'}
            </h2>
          </div>
          <button onClick={onCancel} className="text-ink-dim hover:text-ink">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoFocus
              className="w-full bg-base-900 border border-ink/10 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-ink/30"
            />
          </Field>
          <Field label="Category">
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setDraft({ ...draft, category: c.id })}
                  className={`cat-${c.id} text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-2 rounded border transition ${
                    draft.category === c.id
                      ? 'text-ink border-ink/30 bg-ink/5'
                      : 'text-ink-dim border-ink/10 hover:text-ink-muted'
                  }`}
                >
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                    style={{ background: 'var(--cat)' }}
                  />
                  {c.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Longitude">
              <input
                type="number"
                step="any"
                value={draft.coords[0]}
                onChange={(e) =>
                  setDraft({ ...draft, coords: [Number(e.target.value), draft.coords[1]] })
                }
                className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm mono-num text-ink focus:outline-none"
              />
            </Field>
            <Field label="Latitude">
              <input
                type="number"
                step="any"
                value={draft.coords[1]}
                onChange={(e) =>
                  setDraft({ ...draft, coords: [draft.coords[0], Number(e.target.value)] })
                }
                className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm mono-num text-ink focus:outline-none"
              />
            </Field>
          </div>
          <Field label="Image URL">
            <input
              value={draft.image || ''}
              onChange={(e) => setDraft({ ...draft, image: e.target.value })}
              placeholder="https://… (Unsplash, your own host, etc.)"
              className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none"
            />
          </Field>
          <Field label="Notes">
            <textarea
              value={draft.notes || ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              rows={3}
              className="w-full bg-base-900 border border-ink/10 rounded px-3 py-2 text-sm text-ink resize-none focus:outline-none"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (INR)">
              <input
                type="number"
                value={draft.priceINR || 0}
                onChange={(e) => setDraft({ ...draft, priceINR: Number(e.target.value) })}
                className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm mono-num text-ink focus:outline-none"
              />
            </Field>
            <Field label="Price unit">
              <input
                value={draft.priceUnit || ''}
                onChange={(e) => setDraft({ ...draft, priceUnit: e.target.value })}
                placeholder="per night, per session…"
                className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none"
              />
            </Field>
          </div>
          <Field label="Contact">
            <input
              value={draft.contact || ''}
              onChange={(e) => setDraft({ ...draft, contact: e.target.value })}
              placeholder="phone, email, etc."
              className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none"
            />
          </Field>
          <Field label="Travel mode (to this place)">
            <select
              value={draft.travelMode || 'driving'}
              onChange={(e) => setDraft({ ...draft, travelMode: e.target.value })}
              className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none"
            >
              <option value="driving">driving</option>
              <option value="walking">walking</option>
              <option value="cycling">cycling</option>
              <option value="train">train</option>
              <option value="flight">flight (great-circle arc)</option>
            </select>
          </Field>
        </div>

        <div className="p-5 border-t border-ink/10 flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-pill">Cancel</button>
          <button
            onClick={() => onSave(draft, isNew)}
            className="btn-accent"
            disabled={!draft.name.trim()}
          >
            {isNew ? 'Add place' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
