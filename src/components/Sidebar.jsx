import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import {
  CATEGORY_MAP, formatMoney, formatDate, dayOfWeek,
  CURRENCY_SYMBOLS, DEFAULT_RATES, uid,
} from '../lib'
import {
  updateTrip, addMiscExpense, updateMiscExpense, removeMiscExpense,
} from '../store'

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
//   - Day picker + prev/next + Play
//   - Stop timeline (hover to highlight on map)
//   - Misc expenses (street food, postcards, etc.)
//   - Budget panel (day/trip scope, currency)
// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({
  trip, activeDay, onActiveDayChange,
  activePlaceId, onActivePlaceChange, onHoverPlace,
  playing, onPlayToggle,
}) {
  const [budgetScope, setBudgetScope] = useState('day')
  const [showMiscInput, setShowMiscInput] = useState(false)
  const [miscLabel, setMiscLabel] = useState('')
  const [miscCost, setMiscCost] = useState('')

  const dayData = trip.days.find((d) => d.day === activeDay) || trip.days[0]
  const rates = trip.rates || DEFAULT_RATES

  // Day total (stops + misc)
  const dayTotal = useMemo(() => {
    if (!dayData) return 0
    const stopsSum = dayData.stops.reduce((sum, stop) => {
      const p = trip.places.find((pp) => pp.id === stop.placeId)
      return sum + (p?.priceINR || 0)
    }, 0)
    const miscSum = (dayData.miscExpenses || []).reduce((s, m) => s + (m.cost || 0), 0)
    return stopsSum + miscSum
  }, [dayData, trip.places])

  // Full trip total (places + misc + info + transport)
  const tripTotal = useMemo(() => {
    const placeSum = trip.days.reduce((sum, d) => {
      return sum + d.stops.reduce((s, stop) => {
        const p = trip.places.find((pp) => pp.id === stop.placeId)
        return s + (p?.priceINR || 0)
      }, 0)
    }, 0)
    const miscSum = trip.days.reduce((s, d) =>
      s + (d.miscExpenses || []).reduce((ss, m) => ss + (m.cost || 0), 0), 0)
    const infoSum = Object.values(trip.info || {}).reduce((s, i) => s + (i.cost || 0), 0)
    const transportSum = (trip.transport || []).reduce((s, f) => s + (f.cost || 0), 0)
    return placeSum + miscSum + infoSum + transportSum
  }, [trip])

  const categoryBreakdown = useMemo(() => {
    const m = {}
    trip.days.forEach((d) =>
      d.stops.forEach((stop) => {
        const p = trip.places.find((pp) => pp.id === stop.placeId)
        if (!p) return
        m[p.category] = (m[p.category] || 0) + (p.priceINR || 0)
      })
    )
    if (trip.transport?.length) {
      m.transport = (m.transport || 0) + trip.transport.reduce((s, f) => s + (f.cost || 0), 0)
    }
    const miscTotal = trip.days.reduce((s, d) =>
      s + (d.miscExpenses || []).reduce((ss, m) => ss + (m.cost || 0), 0), 0)
    if (miscTotal > 0) m.misc = miscTotal
    return Object.entries(m).sort((a, b) => b[1] - a[1])
  }, [trip])

  const prevDay = () => onActiveDayChange(Math.max(1, activeDay - 1))
  const nextDay = () => onActiveDayChange(Math.min(trip.days.length, activeDay + 1))

  const handleAddMisc = () => {
    if (!miscLabel.trim()) return
    addMiscExpense(trip.id, activeDay, {
      id: uid('m'),
      label: miscLabel.trim(),
      cost: Number(miscCost) || 0,
    })
    setMiscLabel(''); setMiscCost(''); setShowMiscInput(false)
  }

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
          <button onClick={onPlayToggle} className="btn-accent" style={{ background: trip.accentColor }}>
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

      {/* Stops + misc expenses */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        <div className="editorial-kicker mb-2 px-1">
          Sequence · {dayData?.stops?.length || 0}
        </div>
        <ol className="relative mb-4 space-y-0.5">
          {/* Vertical line through the pins */}
          <div className="absolute left-[15px] top-4 bottom-4 w-px pointer-events-none" style={{ background: 'rgba(244,239,230,0.1)' }} />
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
                className={`relative flex items-start gap-3 pr-2 py-2.5 pl-0 cursor-pointer transition-colors rounded ${
                  isActive ? 'bg-ink/5' : 'hover:bg-ink/[0.03]'
                }`}
              >
                {/* Pin takes its own flex column - guaranteed to never overlap text */}
                <div className="flex-shrink-0 w-8 flex items-start justify-center pt-1">
                  <div
                    className={`pin cat-${place.category} ${isActive ? 'is-active' : ''}`}
                    style={{ width: 22, height: 22, minWidth: 22, fontSize: 10, borderWidth: 1.5 }}
                  >
                    {idx + 1}
                  </div>
                </div>
                {/* Text content */}
                <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-2 items-start">
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
                    <div className="mono-num text-[11px] text-ink-muted whitespace-nowrap pt-0.5">
                      {formatMoney(place.priceINR, trip.currency, rates)}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>

        {/* Misc expenses */}
        <div className="px-1">
          <div className="flex items-center justify-between mb-2">
            <div className="editorial-kicker">
              Misc · {dayData?.miscExpenses?.length || 0}
            </div>
            <button
              onClick={() => setShowMiscInput((v) => !v)}
              className="text-[10px] mono-num uppercase tracking-[0.15em] text-ink-dim hover:text-ink"
            >
              {showMiscInput ? 'cancel' : '+ add'}
            </button>
          </div>

          {showMiscInput && (
            <div className="flex items-center gap-1.5 mb-2 p-2 soft-panel-alt">
              <input
                value={miscLabel}
                onChange={(e) => setMiscLabel(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMisc()}
                placeholder="street food, cap, postcard…"
                className="flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-ink-dim"
              />
              <input
                type="number"
                value={miscCost}
                onChange={(e) => setMiscCost(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMisc()}
                placeholder="₹"
                className="w-16 bg-base-900 border border-ink/10 rounded px-1.5 py-0.5 mono-num text-xs text-ink outline-none text-right"
              />
              <button onClick={handleAddMisc} className="text-ink-dim hover:text-ink">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2 6l3 3 5-6" />
                </svg>
              </button>
            </div>
          )}

          <ul className="space-y-0.5">
            {dayData?.miscExpenses?.map((exp) => (
              <li key={exp.id} className="group grid grid-cols-[1fr_auto_auto] gap-2 items-center py-1 text-xs">
                <input
                  value={exp.label}
                  onChange={(e) => updateMiscExpense(trip.id, activeDay, exp.id, { label: e.target.value })}
                  className="inline-input text-ink-muted truncate"
                />
                <input
                  type="number"
                  value={exp.cost}
                  onChange={(e) => updateMiscExpense(trip.id, activeDay, exp.id, { cost: Number(e.target.value) })}
                  className="inline-input mono-num text-ink text-right w-16"
                />
                <button
                  onClick={() => removeMiscExpense(trip.id, activeDay, exp.id)}
                  className="text-ink-dim hover:text-ink opacity-0 group-hover:opacity-100 transition"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2 2l6 6M8 2l-6 6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
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
          <select
            value={trip.currency}
            onChange={(e) => updateTrip(trip.id, { currency: e.target.value })}
            className="bg-base-900 border border-ink/10 rounded text-[11px] mono-num px-2 py-1 text-ink focus:outline-none focus:border-ink/30"
          >
            {Object.keys(CURRENCY_SYMBOLS).map((c) => (
              <option key={c} value={c}>{c} {CURRENCY_SYMBOLS[c]}</option>
            ))}
          </select>
        </div>

        {/* FIX #3: flex-col layout for label + big number so they stack not overlap */}
        <div className="mb-3">
          <div className="editorial-kicker mb-1">
            {budgetScope === 'day' ? 'Day total' : 'Trip total'}
          </div>
          <div className="font-display display-tight text-3xl text-ink mono-num leading-none">
            {formatMoney(budgetScope === 'day' ? dayTotal : tripTotal, trip.currency, rates)}
          </div>
        </div>

        {budgetScope === 'trip' && (
          <div className="space-y-1.5">
            {categoryBreakdown.map(([catId, amount]) => {
              const cat = CATEGORY_MAP[catId]
              const label = cat?.label || (catId === 'misc' ? 'Misc' : catId)
              const pct = tripTotal > 0 ? (amount / tripTotal) * 100 : 0
              const color = catId === 'misc' ? 'var(--accent)' : 'var(--cat)'
              return (
                <div key={catId} className={catId === 'misc' ? '' : `cat-${catId}`}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      {label}
                    </span>
                    <span className="mono-num text-ink">{formatMoney(amount, trip.currency, rates)}</span>
                  </div>
                  <div className="h-0.5 bg-ink/5 rounded-full mt-1 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
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
