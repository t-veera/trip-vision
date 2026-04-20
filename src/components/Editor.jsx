import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  addPlace, updatePlace, deletePlace, updateTrip, addTrip,
  insertStop, removeStop, moveStop, updateStop,
  addTransport, updateTransport, removeTransport,
  addPackingGroup, updatePackingGroup, removePackingGroup,
  addPackingItem, updatePackingItem, removePackingItem,
  makeEmptyTrip,
} from '../store'
import {
  CATEGORIES, TIME_SLOTS, TRANSPORT_TYPES, uid, download,
} from '../lib'

// ─────────────────────────────────────────────────────────────────────────────
// Editor drawer. Tabs: Places / Days / Packing / Transport / Meta.
// Has a prominent X button at top-right to close (fixes #5).
// ─────────────────────────────────────────────────────────────────────────────

export default function Editor({ trip, pendingMapClick, onClearMapClick, onClose }) {
  const [tab, setTab] = useState('places')

  const handleExport = () => download(`${trip.id}.json`, JSON.stringify(trip, null, 2))

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        addTrip(parsed)
      } catch (err) {
        alert('Not valid trip JSON: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 right-0 bottom-0 w-full md:w-[520px] bg-base-800 border-l border-ink/10 z-40 overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header with big close button */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-ink/10">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: trip.accentColor }} />
            <div className="editorial-kicker">Editor</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close editor"
            className="w-9 h-9 rounded-full flex items-center justify-center border border-ink/15 hover:bg-ink/5 hover:border-ink/30 transition text-ink-muted hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 py-2 border-b border-ink/10 flex items-center gap-1 overflow-x-auto">
          {['places', 'days', 'packing', 'transport', 'meta'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs mono-num uppercase tracking-[0.15em] px-3 py-1.5 rounded-full transition whitespace-nowrap ${
                tab === t ? 'bg-ink/10 text-ink' : 'text-ink-dim hover:text-ink-muted'
              }`}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <button onClick={handleExport} className="text-xs mono-num uppercase tracking-[0.15em] px-2.5 py-1 text-ink-dim hover:text-ink transition">
              Export
            </button>
            <label className="text-xs mono-num uppercase tracking-[0.15em] px-2.5 py-1 text-ink-dim hover:text-ink transition cursor-pointer">
              Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'places' && <PlacesTab trip={trip} pendingMapClick={pendingMapClick} onClearMapClick={onClearMapClick} />}
          {tab === 'days' && <DaysTab trip={trip} />}
          {tab === 'packing' && <PackingTab trip={trip} />}
          {tab === 'transport' && <TransportTab trip={trip} />}
          {tab === 'meta' && <MetaTab trip={trip} />}
        </div>
      </motion.aside>
    </AnimatePresence>
  )
}

// ─── Places tab ─────────────────────────────────────────────────────────────
function PlacesTab({ trip, pendingMapClick, onClearMapClick }) {
  const [showNew, setShowNew] = useState(false)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="editorial-kicker mb-1">Places · {trip.places.length}</div>
          <div className="text-xs text-ink-dim">
            {pendingMapClick
              ? 'Map click captured — fill the form below'
              : 'Tap the map to drop a pin, or click the button →'}
          </div>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="btn-pill"
          style={{ background: 'var(--accent)', color: '#0E0B08', borderColor: 'transparent' }}
        >
          <span>+</span><span>New place</span>
        </button>
      </div>

      {(showNew || pendingMapClick) && (
        <PlaceForm
          initialCoords={pendingMapClick || trip.mapCenter || [0, 0]}
          onSave={(place) => {
            addPlace(trip.id, place)
            setShowNew(false); onClearMapClick?.()
          }}
          onCancel={() => { setShowNew(false); onClearMapClick?.() }}
        />
      )}

      <div className="space-y-1.5">
        {trip.places.map((p) => <PlaceRow key={p.id} place={p} tripId={trip.id} />)}
      </div>
    </div>
  )
}

function PlaceRow({ place, tripId }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className={`soft-panel-alt ${expanded ? 'p-3' : 'p-2.5'} cursor-pointer`}>
      <div className="flex items-center gap-2" onClick={() => setExpanded((v) => !v)}>
        <span className={`pin cat-${place.category}`} style={{ width: 18, height: 18, fontSize: 9, borderWidth: 1.5 }}>
          {place.category[0].toUpperCase()}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-ink truncate">{place.name}</div>
          <div className="mono-num text-[10px] text-ink-dim">
            {place.coords[1].toFixed(3)}, {place.coords[0].toFixed(3)}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Delete "${place.name}"?`)) deletePlace(tripId, place.id)
          }}
          className="text-ink-dim hover:text-ink"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3h8M5 3V2a1 1 0 011-1h0a1 1 0 011 1v1M3 3l.5 8a1 1 0 001 1h3a1 1 0 001-1L9 3" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="mt-2 pt-2 border-t border-ink/5 space-y-2">
          <Input label="Name" value={place.name} onChange={(v) => updatePlace(tripId, place.id, { name: v })} />
          <Select label="Category" value={place.category} onChange={(v) => updatePlace(tripId, place.id, { category: v })} options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />

          {/* Coord editing + Google Maps URL parse */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              <Input label="Longitude" type="number" value={place.coords?.[0] ?? 0} onChange={(v) => updatePlace(tripId, place.id, { coords: [Number(v), place.coords?.[1] ?? 0] })} />
              <Input label="Latitude" type="number" value={place.coords?.[1] ?? 0} onChange={(v) => updatePlace(tripId, place.id, { coords: [place.coords?.[0] ?? 0, Number(v)] })} />
            </div>
            <PasteMapsUrl onCoords={(lng, lat) => updatePlace(tripId, place.id, { coords: [lng, lat] })} />
          </div>

          <Input label="Address" value={place.address || ''} onChange={(v) => updatePlace(tripId, place.id, { address: v })} placeholder="Street, city" />
          <Input label="Image URL" value={place.image || ''} onChange={(v) => updatePlace(tripId, place.id, { image: v })} placeholder="https://..." />
          <Input label="Price (INR)" type="number" value={place.priceINR || 0} onChange={(v) => updatePlace(tripId, place.id, { priceINR: Number(v) })} />
          <Input label="Price unit" value={place.priceUnit || ''} onChange={(v) => updatePlace(tripId, place.id, { priceUnit: v })} placeholder="per night" />
          <Input label="Contact" value={place.contact || ''} onChange={(v) => updatePlace(tripId, place.id, { contact: v })} placeholder="+94 ..." />
          <Textarea label="Notes" value={place.notes || ''} onChange={(v) => updatePlace(tripId, place.id, { notes: v })} />
        </div>
      )}
    </div>
  )
}

// Paste a Google Maps URL → extract lng/lat. Handles:
//   https://www.google.com/maps/place/.../@12.345,-67.890,15z
//   https://maps.app.goo.gl/... (can't fully resolve client-side, instructs user)
//   Plain "12.345, -67.890"
function PasteMapsUrl({ onCoords }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState('')

  const parse = () => {
    const text = val.trim()
    if (!text) return
    setErr('')
    // Pattern 1: @lat,lng
    const at = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (at) { onCoords(Number(at[2]), Number(at[1])); setVal(''); return }
    // Pattern 2: !3dLAT!4dLNG
    const bang = text.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
    if (bang) { onCoords(Number(bang[2]), Number(bang[1])); setVal(''); return }
    // Pattern 3: query=lat,lng
    const q = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (q) { onCoords(Number(q[2]), Number(q[1])); setVal(''); return }
    // Pattern 4: plain "lat, lng"
    const plain = text.match(/^(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)$/)
    if (plain) { onCoords(Number(plain[2]), Number(plain[1])); setVal(''); return }
    setErr("Couldn't read coords. On Google Maps, right-click the pin → click the lat,lng at the top to copy.")
  }

  return (
    <div className="space-y-1">
      <div className="flex items-stretch gap-1.5">
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && parse()}
          placeholder="Paste Google Maps URL or lat,lng"
          className="flex-1 bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-xs text-ink-muted outline-none placeholder:text-ink-dim focus:border-ink/30"
        />
        <button onClick={parse} className="btn-pill text-[10px]">Parse</button>
      </div>
      {err && <div className="text-[10px] text-ink-dim italic">{err}</div>}
    </div>
  )
}

function PlaceForm({ initialCoords, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: '', category: 'chill', coords: initialCoords || [0, 0],
    address: '', image: '', priceINR: 0, priceUnit: '', contact: '', notes: '',
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="soft-panel-alt p-4 space-y-2.5 border-l-2" style={{ borderLeftColor: 'var(--accent)' }}>
      <div className="flex items-center justify-between mb-1">
        <div className="editorial-kicker">New place</div>
        <button onClick={onCancel} className="text-ink-dim hover:text-ink" aria-label="Cancel">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3l8 8M11 3l-8 8" />
          </svg>
        </button>
      </div>
      <Input label="Name" value={form.name} onChange={(v) => set('name', v)} />
      <Select label="Category" value={form.category} onChange={(v) => set('category', v)} options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))} />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Longitude" type="number" value={form.coords[0]} onChange={(v) => set('coords', [Number(v), form.coords[1]])} />
        <Input label="Latitude" type="number" value={form.coords[1]} onChange={(v) => set('coords', [form.coords[0], Number(v)])} />
      </div>
      <PasteMapsUrl onCoords={(lng, lat) => set('coords', [lng, lat])} />
      <Input label="Address" value={form.address} onChange={(v) => set('address', v)} placeholder="Street, city" />
      <Input label="Image URL" value={form.image} onChange={(v) => set('image', v)} placeholder="https://unsplash.com/..." />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Price (INR)" type="number" value={form.priceINR} onChange={(v) => set('priceINR', Number(v))} />
        <Input label="Price unit" value={form.priceUnit} onChange={(v) => set('priceUnit', v)} placeholder="per night" />
      </div>
      <Input label="Contact" value={form.contact} onChange={(v) => set('contact', v)} placeholder="+94 ..." />
      <Textarea label="Notes" value={form.notes} onChange={(v) => set('notes', v)} />
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => {
            if (!form.name) return alert('Name required')
            onSave({ ...form, id: uid('place') })
          }}
          className="btn-pill"
          style={{ background: 'var(--accent)', color: '#0E0B08', borderColor: 'transparent' }}
        >
          Save place
        </button>
        <button onClick={onCancel} className="btn-pill">Cancel</button>
      </div>
    </div>
  )
}

// ─── Days tab ───────────────────────────────────────────────────────────────
function DaysTab({ trip }) {
  return (
    <div className="p-5 space-y-4">
      <div>
        <div className="editorial-kicker mb-1">Days</div>
        <div className="text-xs text-ink-dim">Manage stops, times, and misc expenses per day.</div>
      </div>
      {trip.days.map((day) => <DayRow key={day.day} day={day} trip={trip} />)}
    </div>
  )
}

function DayRow({ day, trip }) {
  const [expanded, setExpanded] = useState(day.day === 1)
  return (
    <div className="soft-panel-alt p-3">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded((v) => !v)}>
        <div>
          <div className="text-sm text-ink">Day {day.day} — {day.title}</div>
          <div className="mono-num text-[10px] text-ink-dim">
            {day.date} · {day.stops.length} stops · {day.miscExpenses?.length || 0} misc
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-dim">
          <path d={expanded ? 'M3 7l3-3 3 3' : 'M3 5l3 3 3-3'} />
        </svg>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-ink/5 space-y-3">
          <Input label="Title" value={day.title} onChange={(v) => {
            updateTrip(trip.id, (t) => ({ days: t.days.map((d) => (d.day === day.day ? { ...d, title: v } : d)) }))
          }} />

          {/* Stops */}
          <div>
            <div className="editorial-kicker mb-2">Stops</div>
            <div className="space-y-1.5">
              {day.stops.map((stop, idx) => {
                const place = trip.places.find((p) => p.id === stop.placeId)
                return (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-ink/[0.03] rounded">
                    <span className="mono-num text-xs text-ink-dim w-5">{idx + 1}.</span>
                    <select
                      value={stop.placeId}
                      onChange={(e) => updateStop(trip.id, day.day, idx, { placeId: e.target.value })}
                      className="flex-1 bg-transparent text-sm text-ink focus:outline-none"
                    >
                      {trip.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select
                      value={stop.time}
                      onChange={(e) => updateStop(trip.id, day.day, idx, { time: e.target.value })}
                      className="bg-transparent mono-num text-[11px] text-ink-muted focus:outline-none"
                    >
                      {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="flex items-center gap-0.5">
                      <button disabled={idx === 0} onClick={() => moveStop(trip.id, day.day, idx, idx - 1)} className="text-ink-dim hover:text-ink disabled:opacity-30 p-0.5">↑</button>
                      <button disabled={idx === day.stops.length - 1} onClick={() => moveStop(trip.id, day.day, idx, idx + 1)} className="text-ink-dim hover:text-ink disabled:opacity-30 p-0.5">↓</button>
                      <button onClick={() => removeStop(trip.id, day.day, idx)} className="text-ink-dim hover:text-ink p-0.5">×</button>
                    </div>
                  </div>
                )
              })}
              <button
                onClick={() => {
                  if (trip.places[0]) insertStop(trip.id, day.day, { placeId: trip.places[0].id, time: 'morning', experience: '', visionTags: [] })
                }}
                className="text-xs mono-num uppercase tracking-[0.15em] text-ink-dim hover:text-ink"
              >
                + add stop
              </button>
            </div>
          </div>

          {/* Misc expenses */}
          <div>
            <div className="editorial-kicker mb-2">Misc expenses</div>
            <div className="space-y-1.5">
              {(day.miscExpenses || []).map((exp) => (
                <div key={exp.id} className="flex items-center gap-2 p-2 bg-ink/[0.03] rounded">
                  <input
                    value={exp.label}
                    onChange={(e) => {
                      updateTrip(trip.id, (t) => ({
                        days: t.days.map((d) =>
                          d.day === day.day
                            ? { ...d, miscExpenses: d.miscExpenses.map((m) => (m.id === exp.id ? { ...m, label: e.target.value } : m)) }
                            : d
                        ),
                      }))
                    }}
                    className="flex-1 bg-transparent text-sm text-ink-muted outline-none"
                    placeholder="street food…"
                  />
                  <input
                    type="number"
                    value={exp.cost}
                    onChange={(e) => {
                      updateTrip(trip.id, (t) => ({
                        days: t.days.map((d) =>
                          d.day === day.day
                            ? { ...d, miscExpenses: d.miscExpenses.map((m) => (m.id === exp.id ? { ...m, cost: Number(e.target.value) } : m)) }
                            : d
                        ),
                      }))
                    }}
                    className="w-20 bg-base-900 border border-ink/10 rounded px-1.5 py-0.5 mono-num text-xs text-ink outline-none text-right"
                  />
                  <button
                    onClick={() => {
                      updateTrip(trip.id, (t) => ({
                        days: t.days.map((d) =>
                          d.day === day.day ? { ...d, miscExpenses: d.miscExpenses.filter((m) => m.id !== exp.id) } : d
                        ),
                      }))
                    }}
                    className="text-ink-dim hover:text-ink"
                  >×</button>
                </div>
              ))}
              <button
                onClick={() => {
                  updateTrip(trip.id, (t) => ({
                    days: t.days.map((d) =>
                      d.day === day.day ? { ...d, miscExpenses: [...(d.miscExpenses || []), { id: uid('m'), label: '', cost: 0 }] } : d
                    ),
                  }))
                }}
                className="text-xs mono-num uppercase tracking-[0.15em] text-ink-dim hover:text-ink"
              >
                + add misc expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Packing tab ────────────────────────────────────────────────────────────
function PackingTab({ trip }) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="editorial-kicker mb-1">Packing</div>
          <div className="text-xs text-ink-dim">One group per bag. Edit group titles freely.</div>
        </div>
        <button
          onClick={() => {
            const name = prompt('Bag name?', 'Backpack')
            if (name) addPackingGroup(trip.id, { id: uid('bag'), title: name, items: [] })
          }}
          className="btn-pill"
        ><span>+</span><span>Bag</span></button>
      </div>

      {trip.packing?.map((g) => (
        <div key={g.id} className="soft-panel-alt p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={g.title}
              onChange={(e) => updatePackingGroup(trip.id, g.id, { title: e.target.value })}
              className="flex-1 bg-transparent font-display text-lg text-ink outline-none"
            />
            <button
              onClick={() => { if (confirm(`Remove "${g.title}" bag?`)) removePackingGroup(trip.id, g.id) }}
              className="text-ink-dim hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h10M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1M4 3l.5 9a1 1 0 001 1h3a1 1 0 001-1L10 3" />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            {(g.items || []).map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <button
                  onClick={() => updatePackingItem(trip.id, g.id, item.id, { checked: !item.checked })}
                  className="w-4 h-4 rounded border border-ink/20 flex-shrink-0 flex items-center justify-center"
                  style={item.checked ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
                >
                  {item.checked && <svg width="10" height="10" viewBox="0 0 10 10" stroke="#0E0B08" strokeWidth="2" fill="none"><path d="M2 5l2 2 4-4" /></svg>}
                </button>
                <input
                  value={item.text}
                  onChange={(e) => updatePackingItem(trip.id, g.id, item.id, { text: e.target.value })}
                  className="flex-1 bg-transparent text-sm text-ink-muted outline-none"
                />
                <button onClick={() => removePackingItem(trip.id, g.id, item.id)} className="text-ink-dim hover:text-ink">×</button>
              </div>
            ))}
            <button
              onClick={() => addPackingItem(trip.id, g.id, { id: uid('p'), text: '', checked: false })}
              className="text-xs mono-num uppercase tracking-[0.15em] text-ink-dim hover:text-ink"
            >
              + add item
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Transport tab ──────────────────────────────────────────────────────────
function TransportTab({ trip }) {
  const add = (type) => addTransport(trip.id, {
    id: uid('t'), type, from: '', to: '', date: '', time: '', provider: '', cost: 0, notes: '',
  })

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="editorial-kicker mb-1">Transport</div>
          <div className="text-xs text-ink-dim">Flights, trains, cabs, buses, ferries.</div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {TRANSPORT_TYPES.map((t) => (
            <button key={t.id} onClick={() => add(t.id)} className="btn-pill text-[10px]">
              <span>+</span><span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {trip.transport?.map((f) => (
        <div key={f.id} className="soft-panel-alt p-3 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={f.type}
              onChange={(e) => updateTransport(trip.id, f.id, { type: e.target.value })}
              className="bg-base-900 border border-ink/10 rounded px-2 py-1 text-xs text-ink outline-none"
            >
              {TRANSPORT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <button
              onClick={() => removeTransport(trip.id, f.id)}
              className="ml-auto text-ink-dim hover:text-ink"
            >×</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="From" value={f.from} onChange={(v) => updateTransport(trip.id, f.id, { from: v })} />
            <Input label="To" value={f.to} onChange={(v) => updateTransport(trip.id, f.id, { to: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Date" type="date" value={f.date} onChange={(v) => updateTransport(trip.id, f.id, { date: v })} />
            <Input label="Time" type="time" value={f.time} onChange={(v) => updateTransport(trip.id, f.id, { time: v })} />
          </div>
          <Input label="Provider" value={f.provider || ''} onChange={(v) => updateTransport(trip.id, f.id, { provider: v })} placeholder="IndiGo / IRCTC / PickMe" />
          <Input label="Cost (INR)" type="number" value={f.cost} onChange={(v) => updateTransport(trip.id, f.id, { cost: Number(v) })} />
          <Textarea label="Notes" value={f.notes || ''} onChange={(v) => updateTransport(trip.id, f.id, { notes: v })} />
        </div>
      ))}
    </div>
  )
}

// ─── Meta tab ───────────────────────────────────────────────────────────────
function MetaTab({ trip }) {
  const set = (patch) => updateTrip(trip.id, patch)
  return (
    <div className="p-5 space-y-3">
      <div className="editorial-kicker mb-1">Meta</div>
      <Input label="Name" value={trip.name} onChange={(v) => set({ name: v })} />
      <Input label="Origin (where you're flying from)" value={trip.origin || ''} onChange={(v) => set({ origin: v })} placeholder="Hyderabad, India" />
      <Textarea label="Vision" value={trip.vision || ''} onChange={(v) => set({ vision: v })} />
      <div className="grid grid-cols-2 gap-2">
        <Input label="Start date" type="date" value={trip.startDate} onChange={(v) => set({ startDate: v })} />
        <Input label="End date" type="date" value={trip.endDate} onChange={(v) => set({ endDate: v })} />
      </div>
      <Input label="Accent color" type="color" value={trip.accentColor} onChange={(v) => set({ accentColor: v })} />
      <Input label="Hero image URL" value={trip.heroImage || ''} onChange={(v) => set({ heroImage: v })} />
    </div>
  )
}

// ─── Form primitives ────────────────────────────────────────────────────────
function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <label className="block">
      <span className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim block mb-1">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-ink/30"
      />
    </label>
  )
}
function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-ink/30"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}
function Textarea({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim block mb-1">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-ink/30 resize-none"
      />
    </label>
  )
}
