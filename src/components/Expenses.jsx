import { useMemo } from 'react'
import { formatMoney, formatDate, DEFAULT_RATES, CATEGORY_MAP, TRANSPORT_TYPES } from '../lib'
import { SectionHeader } from './Info'

// ─────────────────────────────────────────────────────────────────────────────
// Expenses — full breakdown:
//   Pre-trip (visa, e-sim, insurance, medical, exchange, network)
//   Transport (each flight/train/cab with its cost)
//   Per day (each stop + each misc expense)
//   Grand total
// ─────────────────────────────────────────────────────────────────────────────

export default function Expenses({ trip }) {
  const rates = trip.rates || DEFAULT_RATES
  const fm = (n) => formatMoney(n, trip.currency, rates)

  const { preTrip, preTripTotal, transportTotal, daysRollup, grand } = useMemo(() => {
    const preTrip = Object.entries(trip.info || {})
      .map(([key, v]) => ({ key, ...v }))
      .filter((v) => (v.cost || 0) > 0)
    const preTripTotal = preTrip.reduce((s, i) => s + (i.cost || 0), 0)
    const transportTotal = (trip.transport || []).reduce((s, f) => s + (f.cost || 0), 0)

    const daysRollup = (trip.days || []).map((d) => {
      const stops = d.stops
        .map((s) => {
          const p = trip.places.find((pp) => pp.id === s.placeId)
          return p ? { name: p.name, category: p.category, cost: p.priceINR || 0, kind: 'stop' } : null
        })
        .filter(Boolean)
      const misc = (d.miscExpenses || []).map((m) => ({ name: m.label, cost: m.cost || 0, kind: 'misc' }))
      const total = [...stops, ...misc].reduce((s, r) => s + (r.cost || 0), 0)
      return { ...d, rows: [...stops, ...misc], subtotal: total }
    })

    const daysSum = daysRollup.reduce((s, d) => s + d.subtotal, 0)
    const grand = preTripTotal + transportTotal + daysSum

    return { preTrip, preTripTotal, transportTotal, daysRollup, grand }
  }, [trip])

  return (
    <section className="py-20 px-8 lg:px-16 max-w-[1600px] mx-auto">
      <SectionHeader
        kicker="The whole picture"
        title="Expenses."
        blurb="Everything in one table. Pre-trip (visa, e-SIM, insurance). Transport (every flight, train, cab). Every day's stops and street snacks."
        right={
          <div className="text-right">
            <div className="editorial-kicker mb-1">Grand total</div>
            <div className="font-display display-tight text-4xl text-ink mono-num">{fm(grand)}</div>
          </div>
        }
      />

      <div className="soft-panel-alt overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim border-b border-ink/10">
                <th className="py-4 px-5 font-medium w-1/3">Section</th>
                <th className="py-4 px-5 font-medium">Item</th>
                <th className="py-4 px-5 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* ── Pre-trip ─────────────────────────────────────────── */}
              {preTrip.length > 0 && (
                <>
                  <tr className="bg-ink/[0.02]">
                    <td colSpan="3" className="py-3 px-5">
                      <div className="editorial-kicker">Pre-trip · Day 0</div>
                    </td>
                  </tr>
                  {preTrip.map((item) => (
                    <tr key={item.key} className="border-b border-ink/5">
                      <td className="py-2.5 px-5 text-ink-dim">{TYPE_LABELS[item.key] || item.key}</td>
                      <td className="py-2.5 px-5 text-ink-muted">{item.title}</td>
                      <td className="py-2.5 px-5 text-right mono-num text-ink">{fm(item.cost)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-ink/10">
                    <td className="py-2.5 px-5"></td>
                    <td className="py-2.5 px-5 mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                      Subtotal
                    </td>
                    <td className="py-2.5 px-5 text-right mono-num text-ink font-medium">
                      {fm(preTripTotal)}
                    </td>
                  </tr>
                </>
              )}

              {/* ── Transport ────────────────────────────────────────── */}
              {trip.transport?.length > 0 && (
                <>
                  <tr className="bg-ink/[0.02]">
                    <td colSpan="3" className="py-3 px-5">
                      <div className="editorial-kicker">Transport</div>
                    </td>
                  </tr>
                  {trip.transport.map((f) => {
                    const type = TRANSPORT_TYPES.find((t) => t.id === f.type) || TRANSPORT_TYPES[0]
                    return (
                      <tr key={f.id} className="border-b border-ink/5">
                        <td className="py-2.5 px-5 text-ink-dim">
                          <span className="mr-2">{type.icon}</span>
                          {type.label}
                        </td>
                        <td className="py-2.5 px-5 text-ink-muted">
                          {f.from} → {f.to}
                          {f.provider && <span className="text-ink-dim"> · {f.provider}</span>}
                          {f.date && <span className="mono-num text-[11px] text-ink-dim"> · {formatDate(f.date)}</span>}
                        </td>
                        <td className="py-2.5 px-5 text-right mono-num text-ink">{fm(f.cost || 0)}</td>
                      </tr>
                    )
                  })}
                  <tr className="border-b border-ink/10">
                    <td className="py-2.5 px-5"></td>
                    <td className="py-2.5 px-5 mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                      Subtotal
                    </td>
                    <td className="py-2.5 px-5 text-right mono-num text-ink font-medium">
                      {fm(transportTotal)}
                    </td>
                  </tr>
                </>
              )}

              {/* ── Per day ──────────────────────────────────────────── */}
              {daysRollup.map((d) => (
                d.rows.length > 0 && (
                  <FragmentRows key={d.day}>
                    <tr className="bg-ink/[0.02]">
                      <td colSpan="3" className="py-3 px-5">
                        <div className="editorial-kicker">
                          Day {d.day} — {d.title} {d.date && <span className="text-ink-dim">· {formatDate(d.date)}</span>}
                        </div>
                      </td>
                    </tr>
                    {d.rows.map((row, i) => (
                      <tr key={i} className="border-b border-ink/5">
                        <td className="py-2.5 px-5 text-ink-dim">
                          {row.kind === 'misc' ? 'Misc' : CATEGORY_MAP[row.category]?.label || row.category}
                        </td>
                        <td className="py-2.5 px-5 text-ink-muted">{row.name}</td>
                        <td className="py-2.5 px-5 text-right mono-num text-ink">
                          {row.cost > 0 ? fm(row.cost) : <span className="text-ink-dim italic">free</span>}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-b border-ink/10">
                      <td className="py-2.5 px-5"></td>
                      <td className="py-2.5 px-5 mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                        Day {d.day} subtotal
                      </td>
                      <td className="py-2.5 px-5 text-right mono-num text-ink font-medium">
                        {fm(d.subtotal)}
                      </td>
                    </tr>
                  </FragmentRows>
                )
              ))}

              {/* ── Grand total ──────────────────────────────────────── */}
              <tr className="bg-ink/5">
                <td className="py-5 px-5">
                  <div className="editorial-kicker" style={{ color: 'var(--accent)' }}>Grand total</div>
                </td>
                <td className="py-5 px-5 font-display italic text-ink-muted">
                  Everything, all in.
                </td>
                <td className="py-5 px-5 text-right font-display display-tight text-3xl text-ink mono-num">
                  {fm(grand)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

// React does not allow multiple tr siblings without a wrapper; Fragment works fine,
// but we wrap for readability.
function FragmentRows({ children }) { return <>{children}</> }

const TYPE_LABELS = {
  visa: 'Visa',
  esim: 'E-SIM',
  network: 'Network',
  exchange: 'Exchange',
  insurance: 'Insurance',
  medical: 'Medical',
}
