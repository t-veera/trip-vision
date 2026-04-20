import { updateTrip } from '../store'
import { formatMoney, formatDate, DEFAULT_RATES } from '../lib'

// ─────────────────────────────────────────────────────────────────────────────
// Info — logistics grid: visa, e-sim, mobile network, exchange rate, flights.
// Everything here is inline-editable. Click any text, edit, done.
// ─────────────────────────────────────────────────────────────────────────────

const INFO_KEYS = [
  { key: 'visa', icon: VisaIcon },
  { key: 'esim', icon: SimIcon },
  { key: 'network', icon: SignalIcon },
  { key: 'exchange', icon: ExchangeIcon },
]

export default function Info({ trip, editorMode }) {
  const rates = trip.rates || DEFAULT_RATES

  const updateInfo = (key, patch) => {
    updateTrip(trip.id, (t) => ({
      info: {
        ...t.info,
        [key]: { ...(t.info?.[key] || {}), ...patch },
      },
    }))
  }

  const updateFlight = (idx, patch) => {
    updateTrip(trip.id, (t) => ({
      flights: t.flights.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }))
  }

  const addFlight = () => {
    updateTrip(trip.id, (t) => ({
      flights: [
        ...(t.flights || []),
        { from: '', to: '', date: '', time: '', airline: '', cost: 0, notes: '' },
      ],
    }))
  }

  const removeFlight = (idx) => {
    updateTrip(trip.id, (t) => ({
      flights: t.flights.filter((_, i) => i !== idx),
    }))
  }

  return (
    <section className="py-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="Logistics"
        title="Before you're there."
        blurb="Visa, connectivity, money. The boring made beautiful."
      />

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
        {INFO_KEYS.map(({ key, icon: Icon }) => {
          const item = trip.info?.[key] || { title: key, notes: '', cost: 0 }
          return (
            <div key={key} className="soft-panel-alt p-5 flex flex-col min-h-[200px]">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  <Icon />
                </div>
                {item.cost > 0 && (
                  <div className="mono-num text-sm text-ink">
                    {formatMoney(item.cost, trip.currency, rates)}
                  </div>
                )}
              </div>
              <div className="editorial-kicker mb-1">{item.title}</div>
              <textarea
                value={item.notes}
                onChange={(e) => updateInfo(key, { notes: e.target.value })}
                placeholder="Add notes…"
                className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-ink-muted leading-relaxed placeholder:text-ink-dim focus:text-ink"
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-ink/5">
                <span className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                  Cost (INR)
                </span>
                <input
                  type="number"
                  value={item.cost}
                  onChange={(e) => updateInfo(key, { cost: Number(e.target.value) })}
                  className="mono-num text-xs text-ink bg-transparent border-none outline-none text-right w-24 focus:bg-ink/5 rounded px-1"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Flights table */}
      <div className="soft-panel-alt p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="editorial-kicker mb-1">Flights & transport in/out</div>
            <h3 className="font-display text-2xl text-ink display-tight">
              The bookends.
            </h3>
          </div>
          <button onClick={addFlight} className="btn-pill">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 1v8M1 5h8" />
            </svg>
            Add flight
          </button>
        </div>

        {trip.flights?.length === 0 ? (
          <div className="text-ink-dim text-sm italic py-8 text-center">
            No flights yet. Add one above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim border-b border-ink/10">
                  <th className="pb-3 pr-4 font-medium">Route</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Time</th>
                  <th className="pb-3 pr-4 font-medium">Airline / code</th>
                  <th className="pb-3 pr-4 font-medium">Notes</th>
                  <th className="pb-3 pr-4 font-medium text-right">Cost</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {trip.flights?.map((f, i) => (
                  <tr key={i} className="border-b border-ink/5 hover:bg-ink/[0.02]">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5">
                        <input
                          value={f.from}
                          placeholder="BLR"
                          onChange={(e) => updateFlight(i, { from: e.target.value.toUpperCase() })}
                          className="inline-input mono-num text-ink w-14"
                        />
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-dim">
                          <path d="M2 6h8m0 0L7 3m3 3L7 9" />
                        </svg>
                        <input
                          value={f.to}
                          placeholder="CMB"
                          onChange={(e) => updateFlight(i, { to: e.target.value.toUpperCase() })}
                          className="inline-input mono-num text-ink w-14"
                        />
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="date"
                        value={f.date}
                        onChange={(e) => updateFlight(i, { date: e.target.value })}
                        className="inline-input mono-num text-xs text-ink-muted"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="time"
                        value={f.time}
                        onChange={(e) => updateFlight(i, { time: e.target.value })}
                        className="inline-input mono-num text-xs text-ink-muted"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        value={f.airline}
                        placeholder="IndiGo 6E 1223"
                        onChange={(e) => updateFlight(i, { airline: e.target.value })}
                        className="inline-input text-ink-muted"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        value={f.notes || ''}
                        placeholder="…"
                        onChange={(e) => updateFlight(i, { notes: e.target.value })}
                        className="inline-input text-ink-muted text-xs"
                      />
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <input
                        type="number"
                        value={f.cost}
                        onChange={(e) => updateFlight(i, { cost: Number(e.target.value) })}
                        className="inline-input mono-num text-ink text-right w-24"
                      />
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => removeFlight(i)}
                        className="text-ink-dim hover:text-ink transition opacity-0 group-hover:opacity-100"
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
                  <td colSpan="5" className="pt-4 mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                    Subtotal
                  </td>
                  <td className="pt-4 text-right mono-num text-ink font-medium">
                    {formatMoney(
                      trip.flights.reduce((s, f) => s + (f.cost || 0), 0),
                      trip.currency,
                      rates
                    )}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export function SectionHeader({ kicker, title, blurb, right }) {
  return (
    <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
      <div>
        <div className="editorial-kicker mb-3">{kicker}</div>
        <h2 className="font-display display-tight text-5xl md:text-6xl text-ink">
          {title}
        </h2>
        {blurb && (
          <p className="text-ink-muted text-base mt-3 max-w-xl leading-relaxed">
            {blurb}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function VisaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="12" height="12" rx="1" />
      <circle cx="8" cy="6.5" r="1.5" />
      <path d="M5 11.5c0-1.5 1.5-2.5 3-2.5s3 1 3 2.5" />
    </svg>
  )
}
function SimIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 2h5l3 3v9H4z" />
      <path d="M6 7h4M6 9.5h4M6 12h4" />
    </svg>
  )
}
function SignalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 12h2v2H2zM6 9h2v5H6zM10 6h2v8h-2zM14 3h-.5" />
    </svg>
  )
}
function ExchangeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 5h10m0 0L9 2m3 3L9 8M14 11H4m0 0l3-3m-3 3l3 3" />
    </svg>
  )
}
