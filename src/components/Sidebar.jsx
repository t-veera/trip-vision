import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  CATEGORY_MAP,
  formatMoney,
  formatDate,
  dayOfWeek,
  CURRENCY_SYMBOLS,
  DEFAULT_RATES,
} from '../lib'
import { updateTrip } from '../store'

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
//
// Contains:
//   - Day picker (dropdown + prev/next)
//   - Play button (triggers the map cinematic)
//   - Vertical timeline of stops for that day (hover/click to highlight on map)
//   - Day budget table + per-trip total toggle
//   - Currency switcher
// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({
  trip,
  activeDay,
  onActiveDayChange,
  activePlaceId,
  onActivePlaceChange,
  onHoverPlace,
  playing,
  onPlayToggle,
  editorMode,
}) {
  const [budgetScope, setBudgetScope] = useState('day')

  const dayData = trip.days.find((d) => d.day === activeDay) || trip.days[0]
  const rates = trip.rates || DEFAULT_RATES

  // Day total
  const dayTotal = useMemo(() => {
    if (!dayData) return 0
    return dayData.stops.reduce((sum, stop) => {
      const p = trip.places.find((pp) => pp.id === stop.placeId)
      return sum + (p?.priceINR || 0)
    }, 0)
  }, [dayData, trip.places])

  // Full trip total (places + info + flights)
  const tripTotal = useMemo(() => {
    const placeSum = trip.days.reduce((sum, d) => {
      return (
        sum +
        d.stops.reduce((s, stop) => {
          const p = trip.places.find((pp) => pp.id === stop.placeId)
          return s + (p?.priceINR || 0)
        }, 0)
      )
    }, 0)
    const infoSum = Object.values(trip.info || {}).reduce((s, i) => s + (i.cost || 0), 0)
    const flightSum = (trip.flights || []).reduce((s, f) => s + (f.cost || 0), 0)
    return placeSum + infoSum + flightSum
  }, [trip])

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const m = {}
    trip.days.forEach((d) =>
      d.stops.forEach((stop) => {
        const p = trip.places.find((pp) => pp.id === stop.placeId)
        if (!p) return
        m[p.category] = (m[p.category] || 0) + (p.priceINR || 0)
      })
    )
    if (trip.flights?.length) {
      m.transport = (m.transport || 0) + trip.flights.reduce((s, f) => s + (f.cost || 0), 0)
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [trip])

  const prevDay = () => onActiveDayChange(Math.max(1, activeDay - 1))
  const nextDay = () => onActiveDayChange(Math.min(trip.days.length, activeDay + 1))

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Day selector header */}
      <div className="soft-panel p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="editorial-kicker">Day</div>
            <div className="mono-num text-xs text-ink-dim mt-1">
              {dayData && `${dayOfWeek(dayData.date)}, ${formatDate(dayData.date)}`}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <IconBtn onClick={prevDay} disabled={activeDay <= 1} label="prev">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7.5 2.5 L4 6 L7.5 9.5" />
              </svg>
            </IconBtn>
            <IconBtn onClick={nextDay} disabled={activeDay >= trip.days.length} label="next">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4.5 2.5 L8 6 L4.5 9.5" />
              </svg>
            </IconBtn>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <select
            value={activeDay}
            onChange={(e) => onActiveDayChange(Number(e.target.value))}
            className="flex-1 bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink focus:outline-none focus:border-ink/30"
          >
            {trip.days.map((d) => (
              <option key={d.day} value={d.day}>
                Day {d.day} — {d.title || formatDate(d.date)}
              </option>
            ))}
          </select>
          <button
            onClick={onPlayToggle}
            className="btn-accent"
            style={{ background: trip.accentColor || 'var(--accent)' }}
          >
            {playing ? (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect x="2" y="2" width="2" height="6" />
                  <rect x="6" y="2" width="2" height="6" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M2 1.5 L8.5 5 L2 8.5 Z" />
                </svg>
                Play day
              </>
            )}
          </button>
        </div>

        {dayData?.title && (
          <div className="font-display text-lg italic text-ink-muted leading-snug">
            {dayData.title}
          </div>
        )}
      </div>

      {/* Stops timeline */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        <div className="editorial-kicker mb-2 px-1">
          Sequence · {dayData?.stops?.length || 0}
        </div>
        <ol className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[13px] top-2 bottom-2 w-px"
            style={{ background: 'rgba(244,239,230,0.12)' }}
          />
          {dayData?.stops?.map((stop, idx) => {
            const place = trip.places.find((p) => p.id === stop.placeId)
            if (!place) return null
            const isActive = activePlaceId === place.id
            return (
              <li
                key={idx}
                onMouseEnter={() => onHoverPlace?.(place, stop, idx)}
                onMouseLeave={() => onHoverPlace?.(null, null, -1)}
                onClick={() => onActivePlaceChange?.(place.id)}
                className={`relative pl-9 pr-2 py-2.5 cursor-pointer transition-colors rounded group ${
                  isActive ? 'bg-ink/5' : 'hover:bg-ink/[0.03]'
                }`}
              >
                <div
                  className={`absolute left-[4px] top-3 pin cat-${place.category} ${isActive ? 'is-active' : ''}`}
                  style={{ width: 20, height: 20, fontSize: 10, borderWidth: 1.5 }}
                >
                  {idx + 1}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm text-ink truncate">{place.name}</div>
                    <div className="mono-num text-[10px] uppercase tracking-[0.15em] text-ink-dim mt-0.5">
                      {stop.time} · {CATEGORY_MAP[place.category]?.label}
                    </div>
                    {stop.experience && (
                      <div className="text-[11px] text-ink-muted mt-1 italic leading-snug line-clamp-2">
                        {stop.experience}
                      </div>
                    )}
                  </div>
                  {place.priceINR > 0 && (
                    <div className="mono-num text-[11px] text-ink-muted whitespace-nowrap">
                      {formatMoney(place.priceINR, trip.currency, rates)}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      {/* Budget footer */}
      <div className="soft-panel p-4 mt-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBudgetScope('day')}
              className={`text-[10px] mono-num uppercase tracking-[0.15em] transition ${
                budgetScope === 'day' ? 'text-ink' : 'text-ink-dim hover:text-ink-muted'
              }`}
            >
              Day
            </button>
            <span className="text-ink-dim">/</span>
            <button
              onClick={() => setBudgetScope('trip')}
              className={`text-[10px] mono-num uppercase tracking-[0.15em] transition ${
                budgetScope === 'trip' ? 'text-ink' : 'text-ink-dim hover:text-ink-muted'
              }`}
            >
              Whole trip
            </button>
          </div>
          <CurrencyPicker
            value={trip.currency}
            onChange={(c) => updateTrip(trip.id, { currency: c })}
          />
        </div>

        <div className="flex items-baseline justify-between mb-3">
          <div className="editorial-kicker">
            {budgetScope === 'day' ? 'Day total' : 'Trip total'}
          </div>
          <div className="font-display display-tight text-3xl text-ink mono-num">
            {formatMoney(budgetScope === 'day' ? dayTotal : tripTotal, trip.currency, rates)}
          </div>
        </div>

        {budgetScope === 'trip' && (
          <div className="space-y-1.5">
            {categoryBreakdown.map(([catId, amount]) => {
              const cat = CATEGORY_MAP[catId]
              const pct = tripTotal > 0 ? (amount / tripTotal) * 100 : 0
              return (
                <div key={catId} className={`cat-${catId}`}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cat)' }} />
                      {cat?.label || catId}
                    </span>
                    <span className="mono-num text-ink">
                      {formatMoney(amount, trip.currency, rates)}
                    </span>
                  </div>
                  <div className="h-0.5 bg-ink/5 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: 'var(--cat)' }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function IconBtn({ children, onClick, disabled, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="w-7 h-7 rounded flex items-center justify-center text-ink-muted hover:text-ink hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition"
    >
      {children}
    </button>
  )
}

function CurrencyPicker({ value, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-base-900 border border-ink/10 rounded text-[11px] mono-num px-2 py-1 text-ink focus:outline-none focus:border-ink/30"
    >
      {Object.keys(CURRENCY_SYMBOLS).map((c) => (
        <option key={c} value={c}>
          {c} {CURRENCY_SYMBOLS[c]}
        </option>
      ))}
    </select>
  )
}
