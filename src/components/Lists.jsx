import { useState, useMemo } from 'react'
import {
  updateTrip, addPackingGroup, updatePackingGroup, removePackingGroup,
  addPackingItem, updatePackingItem, removePackingItem, updatePlace,
} from '../store'
import { CATEGORIES, CATEGORY_MAP, mapsLink, telLink, uid } from '../lib'
import { SectionHeader } from './Info'

// ─────────────────────────────────────────────────────────────────────────────
// Lists: Packing (grouped by bag) · Checklist · Contacts (clickable)
// ─────────────────────────────────────────────────────────────────────────────

export function Packing({ trip }) {
  const handleAddGroup = () => {
    const name = prompt('New bag name?', 'Backpack')
    if (!name) return
    addPackingGroup(trip.id, { id: uid('bag'), title: name, items: [] })
  }

  return (
    <section className="py-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="Pre-flight"
        title="Packing."
        blurb="Group by bag. Suitcase, backpack, fanny pack — or whatever you call yours."
        right={
          <button onClick={handleAddGroup} className="btn-pill">
            <span>+</span>
            <span>Add bag</span>
          </button>
        }
      />

      {trip.packing?.length === 0 && (
        <div className="soft-panel-alt p-10 text-center">
          <div className="text-ink-muted text-sm italic">No bags yet. Click "Add bag" to make one.</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trip.packing?.map((group) => (
          <PackingGroup key={group.id} group={group} tripId={trip.id} />
        ))}
      </div>
    </section>
  )
}

function PackingGroup({ group, tripId }) {
  const [newItem, setNewItem] = useState('')
  const checked = (group.items || []).filter((i) => i.checked).length
  const total = (group.items || []).length

  const handleAdd = () => {
    if (!newItem.trim()) return
    addPackingItem(tripId, group.id, { id: uid('p'), text: newItem.trim(), checked: false })
    setNewItem('')
  }

  return (
    <div className="soft-panel-alt p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4 group">
        <input
          value={group.title}
          onChange={(e) => updatePackingGroup(tripId, group.id, { title: e.target.value })}
          className="inline-input font-display display-tight text-xl text-ink bg-transparent focus:bg-ink/5 rounded px-1 -ml-1 flex-1"
        />
        <div className="flex items-center gap-2">
          <span className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim">
            {checked}/{total}
          </span>
          <button
            onClick={() => {
              if (confirm(`Remove "${group.title}" bag and all its items?`)) removePackingGroup(tripId, group.id)
            }}
            className="text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition"
            aria-label="Remove group"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 3h8M5 3V2a1 1 0 011-1h0a1 1 0 011 1v1M3 3l.5 8a1 1 0 001 1h3a1 1 0 001-1L9 3" />
            </svg>
          </button>
        </div>
      </div>

      <ul className="space-y-1 mb-3">
        {(group.items || []).map((item) => (
          <li key={item.id} className="group flex items-center gap-2 py-1">
            <button
              onClick={() => updatePackingItem(tripId, group.id, item.id, { checked: !item.checked })}
              className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition ${
                item.checked ? 'bg-accent border-accent' : 'border-ink/20 hover:border-ink/40'
              }`}
              style={item.checked ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
            >
              {item.checked && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#0E0B08" strokeWidth="2">
                  <path d="M2 5l2 2 4-4" />
                </svg>
              )}
            </button>
            <input
              value={item.text}
              onChange={(e) => updatePackingItem(tripId, group.id, item.id, { text: e.target.value })}
              className={`inline-input flex-1 text-sm ${item.checked ? 'text-ink-dim line-through' : 'text-ink-muted'}`}
            />
            <button
              onClick={() => removePackingItem(tripId, group.id, item.id)}
              className="text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition flex-shrink-0"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 2l6 6M8 2l-6 6" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 pt-3 border-t border-ink/5">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add item…"
          className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-dim"
        />
        <button onClick={handleAdd} className="text-ink-dim hover:text-ink" aria-label="Add">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 2v10M2 7h10" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Checklist ──────────────────────────────────────────────────────────────
export function Checklist({ trip }) {
  const [newItem, setNewItem] = useState('')

  const updateChecklist = (list) => updateTrip(trip.id, { checklist: list })
  const toggle = (id) => updateChecklist(trip.checklist.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
  const updateItem = (id, text) => updateChecklist(trip.checklist.map((i) => (i.id === id ? { ...i, text } : i)))
  const remove = (id) => updateChecklist(trip.checklist.filter((i) => i.id !== id))
  const add = () => {
    if (!newItem.trim()) return
    updateChecklist([...(trip.checklist || []), { id: uid('c'), text: newItem.trim(), checked: false }])
    setNewItem('')
  }

  const done = (trip.checklist || []).filter((i) => i.checked).length
  const total = (trip.checklist || []).length

  return (
    <section className="py-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="One-time tasks"
        title="Pre-trip checklist."
        blurb="Book it, apply for it, download it. The stuff you do once before you go."
        right={
          <div className="mono-num text-sm text-ink-dim">
            {done}/{total} done
          </div>
        }
      />
      <div className="soft-panel-alt p-6 max-w-3xl">
        <ul className="space-y-0.5">
          {(trip.checklist || []).map((item) => (
            <li key={item.id} className="group flex items-center gap-3 py-2.5 border-b border-ink/5 last:border-0">
              <button
                onClick={() => toggle(item.id)}
                className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition ${
                  item.checked ? '' : 'border-ink/20 hover:border-ink/40'
                }`}
                style={item.checked ? { background: 'var(--accent)', borderColor: 'var(--accent)' } : {}}
              >
                {item.checked && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#0E0B08" strokeWidth="2">
                    <path d="M2 6l3 3 5-6" />
                  </svg>
                )}
              </button>
              <input
                value={item.text}
                onChange={(e) => updateItem(item.id, e.target.value)}
                className={`inline-input flex-1 text-base ${item.checked ? 'text-ink-dim line-through' : 'text-ink'}`}
              />
              <button
                onClick={() => remove(item.id)}
                className="text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition flex-shrink-0"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 3l6 6M9 3l-6 6" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-ink/10">
          <input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder="Add a task…"
            className="flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-dim"
          />
          <button onClick={add} className="btn-pill">
            <span>+</span><span>Add</span>
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Contacts ───────────────────────────────────────────────────────────────
// Addresses open Google Maps, phone numbers open the dialer.
export function Contacts({ trip }) {
  const [filter, setFilter] = useState('all')

  const contactPlaces = useMemo(() => {
    return (trip.places || []).filter((p) => p.contact || p.address)
  }, [trip.places])

  const filtered = filter === 'all' ? contactPlaces : contactPlaces.filter((p) => p.category === filter)
  const cats = ['all', ...new Set(contactPlaces.map((p) => p.category))]

  return (
    <section className="py-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="Contacts & addresses"
        title="Who to call."
        blurb="Click any address to open in Google Maps. Tap any number to call straight from your phone. Edit inline to fix anything."
      />

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {cats.map((c) => {
          const cat = CATEGORY_MAP[c]
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`cat-${c !== 'all' ? c : ''} text-xs mono-num uppercase tracking-[0.15em] px-3 py-1.5 rounded-full border transition ${
                filter === c
                  ? 'text-ink border-ink/30 bg-ink/5'
                  : 'text-ink-dim border-ink/10 hover:text-ink-muted hover:border-ink/20'
              }`}
            >
              {c === 'all' ? 'All' : cat?.label || c}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 && (
          <div className="col-span-full soft-panel-alt p-10 text-center">
            <div className="text-ink-muted text-sm italic">
              No contacts yet. Edit a place card to add its address and phone, and it'll show up here.
            </div>
          </div>
        )}
        {filtered.map((place) => (
          <ContactCard key={place.id} place={place} tripId={trip.id} />
        ))}
      </div>
    </section>
  )
}

function ContactCard({ place, tripId }) {
  const [editing, setEditing] = useState(false)
  const cat = CATEGORY_MAP[place.category]

  const setField = (field, value) => updatePlace(tripId, place.id, { [field]: value })

  return (
    <div className={`soft-panel-alt p-5 group cat-${place.category}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] mono-num uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5"
            style={{ color: 'var(--cat)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cat)' }} />
            {cat?.label}
          </div>
          {editing ? (
            <input
              value={place.name}
              onChange={(e) => setField('name', e.target.value)}
              className="inline-input font-display text-xl text-ink w-full"
            />
          ) : (
            <h3 className="font-display text-xl text-ink display-tight leading-tight">
              {place.name}
            </h3>
          )}
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-1 rounded-full border border-ink/10 text-ink-dim hover:text-ink hover:border-ink/30 transition flex-shrink-0 ml-2"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {/* Address */}
      {editing ? (
        <div className="mb-3">
          <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-1">Address</div>
          <textarea
            value={place.address || ''}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="Street, city, country"
            rows={2}
            className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink-muted focus:outline-none focus:border-ink/30 resize-none"
          />
        </div>
      ) : place.address ? (
        <a
          href={mapsLink(place)}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-2 mb-3 text-ink-muted hover:text-ink transition group/a"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 flex-shrink-0">
            <path d="M7 13s-5-4.5-5-8a5 5 0 0110 0c0 3.5-5 8-5 8z" />
            <circle cx="7" cy="5" r="1.5" />
          </svg>
          <span className="text-sm leading-snug underline decoration-dotted decoration-ink-dim group-hover/a:decoration-ink">
            {place.address}
          </span>
        </a>
      ) : null}

      {/* Phone */}
      {editing ? (
        <div className="mb-3">
          <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-1">Phone</div>
          <input
            value={place.contact || ''}
            onChange={(e) => setField('contact', e.target.value)}
            placeholder="+94 77 ..."
            className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 mono-num text-sm text-ink focus:outline-none focus:border-ink/30"
          />
        </div>
      ) : place.contact ? (
        <a
          href={telLink(place.contact)}
          className="flex items-center gap-2 text-ink-muted hover:text-ink transition group/p"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0">
            <path d="M2 3.5a1 1 0 011-1h1.5l1 2.5-1 1a6 6 0 003.5 3.5l1-1 2.5 1v1.5a1 1 0 01-1 1A9 9 0 012 3.5z" />
          </svg>
          <span className="mono-num text-sm underline decoration-dotted decoration-ink-dim group-hover/p:decoration-ink">
            {place.contact}
          </span>
        </a>
      ) : null}
    </div>
  )
}
