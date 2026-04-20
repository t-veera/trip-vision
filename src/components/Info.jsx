import { useState } from 'react'
import { updateTrip, addTransport, updateTransport, removeTransport } from '../store'
import {
  formatMoney, formatDate, DEFAULT_RATES, TRANSPORT_TYPES, uid,
} from '../lib'

// ─────────────────────────────────────────────────────────────────────────────
// Logistics — visa, e-SIM, network, exchange, insurance, medical, + custom.
// Each card has its own Edit toggle for focused editing.
// Transport table supports flights / trains / cabs / buses / ferries.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_INFO_CARDS = [
  { key: 'visa', icon: VisaIcon, defaultTitle: 'Visa' },
  { key: 'esim', icon: SimIcon, defaultTitle: 'E-SIM' },
  { key: 'network', icon: SignalIcon, defaultTitle: 'Mobile Network' },
  { key: 'exchange', icon: ExchangeIcon, isExchange: true, defaultTitle: 'Exchange Rate' },
  { key: 'insurance', icon: InsuranceIcon, defaultTitle: 'Travel Insurance' },
  { key: 'medical', icon: MedicalIcon, defaultTitle: 'Medical / Vaccinations' },
]

export default function Info({ trip }) {
  const rates = trip.rates || DEFAULT_RATES

  const updateInfo = (key, patch) => {
    updateTrip(trip.id, (t) => ({
      info: { ...t.info, [key]: { ...(t.info?.[key] || {}), ...patch } },
    }))
  }

  const removeInfo = (key) => {
    if (!confirm(`Remove "${trip.info?.[key]?.title || key}" card?`)) return
    updateTrip(trip.id, (t) => {
      const next = { ...t.info }
      delete next[key]
      return { info: next }
    })
  }

  const addCustomCard = () => {
    const title = prompt('Card title?', 'Power adapter')
    if (!title) return
    const key = 'custom-' + Date.now().toString(36)
    updateTrip(trip.id, (t) => ({
      info: { ...t.info, [key]: { title, notes: '', cost: 0, url: '' } },
    }))
  }

  // Assemble cards: defaults (always shown if present), then any custom keys
  const allKeys = Object.keys(trip.info || {})
  const defaultKeys = DEFAULT_INFO_CARDS.map((c) => c.key)
  const customKeys = allKeys.filter((k) => !defaultKeys.includes(k))

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="Before you're there"
        title="Logistics."
        blurb="Visa, connectivity, money, safety. Click Edit on any card to change details, or + Add card for anything extra (power adapter, lounge access, etc.)."
        right={
          <button onClick={addCustomCard} className="btn-pill">
            <span>+</span><span>Add card</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
        {DEFAULT_INFO_CARDS.map(({ key, icon, isExchange, defaultTitle }) => {
          const item = trip.info?.[key] || { title: defaultTitle, notes: '', cost: 0, url: '' }
          return (
            <InfoCard
              key={key} infoKey={key} item={item} Icon={icon} isExchange={isExchange}
              trip={trip} rates={rates} onUpdate={(patch) => updateInfo(key, patch)}
              removable={false}
            />
          )
        })}
        {customKeys.map((key) => {
          const item = trip.info[key]
          return (
            <InfoCard
              key={key} infoKey={key} item={item} Icon={CustomIcon}
              trip={trip} rates={rates}
              onUpdate={(patch) => updateInfo(key, patch)}
              onRemove={() => removeInfo(key)}
              removable={true}
            />
          )
        })}
      </div>

      <TransportTable trip={trip} />
    </section>
  )
}

// ─── Single info card with Edit toggle ──────────────────────────────────────
function InfoCard({ item, Icon, isExchange, trip, rates, onUpdate, onRemove, removable }) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="soft-panel-alt p-6 flex flex-col min-h-[280px] group relative">
      <div className="flex items-start justify-between mb-4 gap-2">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
        >
          <Icon />
        </div>
        <div className="flex items-center gap-1.5">
          {item.url && !editing && (
            <a
              href={item.url} target="_blank" rel="noreferrer"
              className="mono-num text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border border-ink/15 text-ink-muted hover:text-ink hover:border-ink/30 transition flex items-center gap-1"
            >
              Open
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 1h4v4M7 1L3 5M1 3v4h4" />
              </svg>
            </a>
          )}
          <button
            onClick={() => setEditing((v) => !v)}
            className="mono-num text-[10px] uppercase tracking-[0.15em] px-2.5 py-1 rounded-full border border-ink/15 text-ink-muted hover:text-ink hover:border-ink/30 transition"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
          {removable && editing && (
            <button
              onClick={onRemove}
              className="text-ink-dim hover:text-ink transition"
              aria-label="Remove"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 3h10M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1M4 3l.5 9a1 1 0 001 1h3a1 1 0 001-1L10 3" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {editing ? (
        <input
          value={item.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="mono-num text-[11px] uppercase tracking-[0.18em] text-ink bg-base-900 border border-ink/10 rounded px-2 py-1 mb-1.5"
          style={{ color: 'var(--accent)' }}
        />
      ) : (
        <div className="editorial-kicker mb-1.5">{item.title}</div>
      )}

      {/* Exchange rate gets prominent display */}
      {isExchange && (
        <div className="mb-3">
          <input
            value={item.rate || ''}
            onChange={(e) => onUpdate({ rate: e.target.value })}
            placeholder="1 INR = ..."
            className="w-full bg-transparent font-display display-tight text-ink focus:outline-none placeholder:text-ink-dim mono-num"
            style={{ fontFamily: "'Geist Mono', monospace", fontSize: '1.5rem' }}
          />
        </div>
      )}

      {item.cost > 0 && !isExchange && !editing && (
        <div className="font-display display-tight text-3xl text-ink mono-num mb-3">
          {formatMoney(item.cost, trip.currency, rates)}
        </div>
      )}

      <textarea
        value={item.notes || ''}
        onChange={(e) => onUpdate({ notes: e.target.value })}
        placeholder={editing ? 'Add notes…' : 'No notes yet — click Edit to add'}
        readOnly={!editing}
        className={`flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed placeholder:text-ink-dim min-h-[80px] ${
          editing ? 'text-ink' : 'text-ink-muted cursor-default'
        }`}
      />

      {/* Only show URL + Cost fields when editing, to reduce clutter */}
      {editing && (
        <div className="mt-3 pt-3 border-t border-ink/5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim flex-shrink-0 w-14">URL</span>
            <input
              value={item.url || ''}
              onChange={(e) => onUpdate({ url: e.target.value })}
              placeholder="https://..."
              className="flex-1 bg-base-900 border border-ink/10 rounded px-2 py-1 text-xs text-ink-muted outline-none placeholder:text-ink-dim focus:text-ink focus:border-ink/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim flex-shrink-0 w-14">Cost (₹)</span>
            <input
              type="number"
              value={item.cost || 0}
              onChange={(e) => onUpdate({ cost: Number(e.target.value) })}
              className="flex-1 bg-base-900 border border-ink/10 rounded px-2 py-1 mono-num text-xs text-ink outline-none focus:border-ink/30"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Transport Table ────────────────────────────────────────────────────────
function TransportTable({ trip }) {
  const rates = trip.rates || DEFAULT_RATES

  const addEntry = (type = 'flight') => {
    addTransport(trip.id, {
      id: uid('t'), type, from: '', to: '', date: '', time: '',
      provider: '', cost: 0, notes: '',
    })
  }

  return (
    <div className="soft-panel-alt p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="editorial-kicker mb-1">Flights · Trains · Cabs · Ferries</div>
          <h3 className="font-display text-2xl text-ink display-tight">How you move.</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {TRANSPORT_TYPES.map((t) => (
            <button key={t.id} onClick={() => addEntry(t.id)} className="btn-pill">
              <span>+</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {trip.transport?.length === 0 ? (
        <div className="text-ink-dim text-sm italic py-8 text-center">
          No transport yet. Click a button above to add your first flight / train / cab.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim border-b border-ink/10">
                <th className="pb-3 pr-3 font-medium">Type</th>
                <th className="pb-3 pr-3 font-medium">Route</th>
                <th className="pb-3 pr-3 font-medium">Date</th>
                <th className="pb-3 pr-3 font-medium">Time</th>
                <th className="pb-3 pr-3 font-medium">Provider</th>
                <th className="pb-3 pr-3 font-medium">Notes</th>
                <th className="pb-3 pr-3 font-medium text-right">Cost</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {trip.transport?.map((f) => (
                <tr key={f.id} className="group border-b border-ink/5 hover:bg-ink/[0.02]">
                  <td className="py-3 pr-3">
                    <select
                      value={f.type || 'flight'}
                      onChange={(e) => updateTransport(trip.id, f.id, { type: e.target.value })}
                      className="bg-transparent mono-num text-xs text-ink-muted focus:outline-none"
                    >
                      {TRANSPORT_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        value={f.from}
                        placeholder="From"
                        onChange={(e) => updateTransport(trip.id, f.id, { from: e.target.value })}
                        className="inline-input mono-num text-ink w-20"
                      />
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-dim">
                        <path d="M2 6h8m0 0L7 3m3 3L7 9" />
                      </svg>
                      <input
                        value={f.to}
                        placeholder="To"
                        onChange={(e) => updateTransport(trip.id, f.id, { to: e.target.value })}
                        className="inline-input mono-num text-ink w-20"
                      />
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="date"
                      value={f.date}
                      onChange={(e) => updateTransport(trip.id, f.id, { date: e.target.value })}
                      className="inline-input mono-num text-xs text-ink-muted"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      type="time"
                      value={f.time}
                      onChange={(e) => updateTransport(trip.id, f.id, { time: e.target.value })}
                      className="inline-input mono-num text-xs text-ink-muted"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      value={f.provider || f.airline || ''}
                      placeholder="IndiGo / SriLankan / PickMe"
                      onChange={(e) => updateTransport(trip.id, f.id, { provider: e.target.value })}
                      className="inline-input text-ink-muted"
                    />
                  </td>
                  <td className="py-3 pr-3">
                    <input
                      value={f.notes || ''}
                      placeholder="…"
                      onChange={(e) => updateTransport(trip.id, f.id, { notes: e.target.value })}
                      className="inline-input text-ink-muted text-xs"
                    />
                  </td>
                  <td className="py-3 pr-3 text-right">
                    <input
                      type="number"
                      value={f.cost}
                      onChange={(e) => updateTransport(trip.id, f.id, { cost: Number(e.target.value) })}
                      className="inline-input mono-num text-ink text-right w-24"
                    />
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => removeTransport(trip.id, f.id)}
                      className="text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 3h10M5 3V2a1 1 0 011-1h2a1 1 0 011 1v1M4 3l.5 9a1 1 0 001 1h3a1 1 0 001-1L10 3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="6" className="pt-4 mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                  Subtotal
                </td>
                <td className="pt-4 text-right mono-num text-ink font-medium">
                  {formatMoney(
                    trip.transport.reduce((s, f) => s + (f.cost || 0), 0),
                    trip.currency, rates
                  )}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export function SectionHeader({ kicker, title, blurb, right }) {
  return (
    <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
      <div>
        <div className="editorial-kicker mb-3">{kicker}</div>
        <h2 className="font-display display-tight text-5xl md:text-6xl text-ink">{title}</h2>
        {blurb && <p className="text-ink-muted text-base mt-3 max-w-xl leading-relaxed">{blurb}</p>}
      </div>
      {right}
    </div>
  )
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function VisaIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="2.5" width="13" height="13" rx="1" />
      <circle cx="9" cy="7.5" r="1.8" />
      <path d="M5.5 13c0-1.6 1.6-2.6 3.5-2.6s3.5 1 3.5 2.6" />
    </svg>
  )
}
function SimIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4.5 2.5h5.5l3.5 3.5V15.5H4.5z" />
      <path d="M6.5 8h5M6.5 10.5h5M6.5 13h5" />
    </svg>
  )
}
function SignalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 14h2.5v2.5h-2.5zM7 10.5h2.5v6h-2.5zM11.5 7h2.5v9.5h-2.5z" />
    </svg>
  )
}
function ExchangeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 5.5h11m0 0L10 2m3.5 3.5L10 9M15.5 12.5h-11m0 0L8 16m-3.5-3.5L8 9" />
    </svg>
  )
}
function InsuranceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 2l6 2v5a7 7 0 01-6 7 7 7 0 01-6-7V4l6-2z" />
      <path d="M6.5 9l2 2 3-3.5" />
    </svg>
  )
}
function MedicalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2.5" y="4.5" width="13" height="10" rx="1" />
      <path d="M9 7v5M6.5 9.5h5" />
    </svg>
  )
}
function CustomIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="6" />
      <path d="M9 6v3l2 1.5" />
    </svg>
  )
}
