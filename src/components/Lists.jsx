import { useState } from 'react'
import { motion } from 'motion/react'
import { CATEGORIES, CATEGORY_MAP, uid } from '../lib'
import { updateTrip } from '../store'
import { SectionHeader } from './Info'

// ─────────────────────────────────────────────────────────────────────────────
// Three logistics sections — all editable, persisted through the store.
// ─────────────────────────────────────────────────────────────────────────────

export function Packing({ trip }) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (!newItem.trim()) return
    updateTrip(trip.id, (t) => ({
      packing: [...(t.packing || []), { id: uid('p'), text: newItem.trim(), checked: false }],
    }))
    setNewItem('')
  }

  const toggle = (id) => {
    updateTrip(trip.id, (t) => ({
      packing: t.packing.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    }))
  }

  const updateText = (id, text) => {
    updateTrip(trip.id, (t) => ({
      packing: t.packing.map((i) => (i.id === id ? { ...i, text } : i)),
    }))
  }

  const remove = (id) => {
    updateTrip(trip.id, (t) => ({
      packing: t.packing.filter((i) => i.id !== id),
    }))
  }

  const checked = trip.packing?.filter((i) => i.checked).length || 0
  const total = trip.packing?.length || 0

  return (
    <section className="py-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="Packing list"
        title="What goes in the bag."
        blurb="Editable. Check as you pack."
        right={
          <div className="mono-num text-sm text-ink-muted">
            <span className="text-ink">{checked}</span>
            <span className="text-ink-dim"> / {total} packed</span>
          </div>
        }
      />

      <div className="soft-panel-alt p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
          {trip.packing?.map((item) => (
            <label
              key={item.id}
              className={`group flex items-center gap-3 py-2 cursor-pointer border-b border-ink/5 ${
                item.checked ? 'opacity-50' : ''
              }`}
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggle(item.id)
                }}
                className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.checked
                    ? 'border-transparent'
                    : 'border-ink/25 hover:border-ink/50'
                }`}
                style={item.checked ? { background: 'var(--accent)' } : {}}
              >
                {item.checked && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#0E0B08" strokeWidth="2">
                    <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <input
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                className={`inline-input text-sm ${item.checked ? 'line-through text-ink-dim' : 'text-ink'}`}
              />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  remove(item.id)
                }}
                className="text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-ink/10">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add item…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-ink placeholder:text-ink-dim"
          />
          <button onClick={addItem} className="btn-pill">
            Add
          </button>
        </div>
      </div>
    </section>
  )
}

export function Checklist({ trip }) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (!newItem.trim()) return
    updateTrip(trip.id, (t) => ({
      checklist: [...(t.checklist || []), { id: uid('c'), text: newItem.trim(), checked: false }],
    }))
    setNewItem('')
  }

  const toggle = (id) => {
    updateTrip(trip.id, (t) => ({
      checklist: t.checklist.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    }))
  }

  const updateText = (id, text) => {
    updateTrip(trip.id, (t) => ({
      checklist: t.checklist.map((i) => (i.id === id ? { ...i, text } : i)),
    }))
  }

  const remove = (id) => {
    updateTrip(trip.id, (t) => ({
      checklist: t.checklist.filter((i) => i.id !== id),
    }))
  }

  const checked = trip.checklist?.filter((i) => i.checked).length || 0
  const total = trip.checklist?.length || 0
  const pct = total > 0 ? (checked / total) * 100 : 0

  return (
    <section className="py-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="Pre-trip checklist"
        title="Don't forget."
        blurb="Everything you need to sort before you go."
        right={
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex-1 h-1 bg-ink/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--accent)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <span className="mono-num text-xs text-ink-muted whitespace-nowrap">
              {checked}/{total}
            </span>
          </div>
        }
      />

      <div className="soft-panel-alt p-6">
        <div className="space-y-1">
          {trip.checklist?.map((item) => (
            <label
              key={item.id}
              className="group flex items-center gap-3 py-2.5 cursor-pointer border-b border-ink/5 last:border-0"
            >
              <button
                onClick={(e) => {
                  e.preventDefault()
                  toggle(item.id)
                }}
                className={`w-5 h-5 rounded-full border flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.checked ? 'border-transparent' : 'border-ink/25 hover:border-ink/50'
                }`}
                style={item.checked ? { background: 'var(--accent)' } : {}}
              >
                {item.checked && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#0E0B08" strokeWidth="2">
                    <path d="M2 5l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <input
                value={item.text}
                onChange={(e) => updateText(item.id, e.target.value)}
                className={`inline-input text-sm ${item.checked ? 'line-through text-ink-dim' : 'text-ink'}`}
              />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  remove(item.id)
                }}
                className="text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-ink/10">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add task…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-ink placeholder:text-ink-dim"
          />
          <button onClick={addItem} className="btn-pill">
            Add
          </button>
        </div>
      </div>
    </section>
  )
}

export function Contacts({ trip }) {
  const [filter, setFilter] = useState('all')

  const placesWithContact = trip.places.filter((p) => p.contact || p.notes)

  const filtered =
    filter === 'all' ? placesWithContact : placesWithContact.filter((p) => p.category === filter)

  // Only show filters for categories that have entries
  const activeCategories = [...new Set(placesWithContact.map((p) => p.category))]

  return (
    <section className="py-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="Directory"
        title="Contacts & addresses."
        blurb="Every place, every number, one page. Filter by kind."
      />

      <div className="flex items-center gap-1.5 mb-6 flex-wrap">
        <FilterPill label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
        {CATEGORIES.filter((c) => activeCategories.includes(c.id)).map((c) => (
          <FilterPill
            key={c.id}
            label={c.label}
            catId={c.id}
            active={filter === c.id}
            onClick={() => setFilter(c.id)}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((place) => (
          <div key={place.id} className={`cat-${place.category} soft-panel-alt p-5`}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: 'var(--cat)' }}
              />
              <span
                className="mono-num text-[10px] uppercase tracking-[0.2em]"
                style={{ color: 'var(--cat)' }}
              >
                {CATEGORY_MAP[place.category]?.label}
              </span>
            </div>
            <div className="font-display text-xl text-ink display-tight mb-2">{place.name}</div>
            {place.contact && (
              <div className="mono-num text-xs text-ink-muted mb-2">{place.contact}</div>
            )}
            {place.notes && (
              <p className="text-xs text-ink-dim leading-relaxed line-clamp-3">{place.notes}</p>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 text-center py-12 text-ink-dim italic">
            No entries. Add notes or contact info to places to see them here.
          </div>
        )}
      </div>
    </section>
  )
}

function FilterPill({ label, active, onClick, catId }) {
  return (
    <button
      onClick={onClick}
      className={`cat-${catId || ''} text-[11px] mono-num uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border transition ${
        active
          ? 'text-ink border-ink/30 bg-ink/5'
          : 'text-ink-muted border-ink/10 hover:border-ink/20 hover:text-ink'
      }`}
    >
      {catId && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
          style={{ background: 'var(--cat)' }}
        />
      )}
      {label}
    </button>
  )
}
