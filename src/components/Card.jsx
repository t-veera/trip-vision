import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CATEGORY_MAP,
  formatMoney,
  formatDistance,
  formatDuration,
  formatDate,
  getRoute,
} from '../lib'

// ─────────────────────────────────────────────────────────────────────────────
// Card — shown when hovering a pin or a numbered item, or when a place is
// actively selected. Displays image, vision tags, price, notes, and travel
// time/distance from the trip's primary "stay" place.
// ─────────────────────────────────────────────────────────────────────────────

export default function Card({ place, stop, dayIndex, trip, compact = false }) {
  const [travelInfo, setTravelInfo] = useState(null)

  // Find the primary stay for the active day (first stay in trip)
  const primaryStay = trip.places.find((p) => p.category === 'stay')

  useEffect(() => {
    if (!place || !primaryStay || place.id === primaryStay.id) {
      setTravelInfo(null)
      return
    }
    let cancelled = false
    getRoute(primaryStay.coords, place.coords, 'driving').then((route) => {
      if (cancelled || !route) return
      setTravelInfo({
        distance: route.distanceMeters,
        duration: route.durationSeconds,
      })
    })
    return () => {
      cancelled = true
    }
  }, [place?.id, primaryStay?.id])

  if (!place) return null

  const cat = CATEGORY_MAP[place.category]
  const dayData = trip.days[dayIndex] || {}

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={place.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`soft-panel-alt overflow-hidden backdrop-blur ${compact ? 'text-xs' : ''}`}
      >
        {/* Image */}
        {place.image && (
          <div className="relative aspect-[16/10] overflow-hidden bg-base-900">
            <img
              src={place.image}
              alt={place.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-base-900/90 via-transparent to-transparent" />
            <div className="absolute top-3 left-3">
              <span
                className={`cat-${place.category} inline-flex items-center gap-1.5 text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-1 rounded-full backdrop-blur`}
                style={{ background: 'rgba(14,11,8,0.6)', color: 'var(--cat)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--cat)' }}
                />
                {cat?.label}
              </span>
            </div>
            {stop && dayData.day && (
              <div className="absolute top-3 right-3 text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-1 rounded-full backdrop-blur bg-base-900/60 text-ink">
                Day {dayData.day} · {stop.time}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`${compact ? 'p-3' : 'p-4'}`}>
          <h3 className={`font-display display-tight ${compact ? 'text-xl' : 'text-2xl'} text-ink mb-1`}>
            {place.name}
          </h3>
          {dayData.date && stop && (
            <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-3">
              {formatDate(dayData.date)} · {stop.time}
            </div>
          )}

          {stop?.experience && (
            <p className="font-display italic text-ink-muted text-[15px] leading-snug mb-3">
              “{stop.experience}”
            </p>
          )}

          {place.notes && (
            <p className="text-ink-muted text-sm leading-relaxed mb-3">{place.notes}</p>
          )}

          {/* Vision tags */}
          {stop?.visionTags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {stop.visionTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-ink/15 text-ink-muted"
                  style={{ borderColor: 'var(--accent-soft, rgba(244,239,230,0.15))' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Data row */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink/10">
            <DataRow
              label="Price"
              value={
                place.priceINR > 0
                  ? `${formatMoney(place.priceINR, trip.currency, trip.rates)}${place.priceUnit ? ' ' + place.priceUnit : ''}`
                  : 'free'
              }
            />
            {travelInfo ? (
              <DataRow
                label="From stay"
                value={`${formatDistance(travelInfo.distance)} · ${formatDuration(travelInfo.duration)}`}
              />
            ) : place.id === primaryStay?.id ? (
              <DataRow label="Home base" value="this is stay" />
            ) : (
              <DataRow label="From stay" value="—" />
            )}
          </div>

          {place.contact && (
            <div className="mt-3 pt-3 border-t border-ink/10">
              <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-1">
                Contact
              </div>
              <div className="text-ink text-sm">{place.contact}</div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function DataRow({ label, value }) {
  return (
    <div>
      <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-0.5">
        {label}
      </div>
      <div className="mono-num text-sm text-ink">{value}</div>
    </div>
  )
}
