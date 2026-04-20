import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  CATEGORY_MAP,
  formatMoney,
  formatDistance,
  formatDuration,
  formatDate,
  getRoute,
  mapsLink,
  telLink,
} from '../lib'
import { updatePlace, updateStop } from '../store'

// ─────────────────────────────────────────────────────────────────────────────
// Card — hover/active card for a place. Now with an "Edit" button that
// flips the whole card into inline-edit mode for price, experience, contact.
// Address + phone are clickable links.
// ─────────────────────────────────────────────────────────────────────────────

export default function Card({ place, stop, dayIndex, trip, compact = false, allowEdit = true }) {
  const [travelInfo, setTravelInfo] = useState(null)
  const [editing, setEditing] = useState(false)

  const primaryStay = trip.places.find((p) => p.category === 'stay')
  const dayData = trip.days[dayIndex] || {}
  const stopIndex = stop && dayData.stops ? dayData.stops.indexOf(stop) : -1

  useEffect(() => {
    setEditing(false)
    if (!place || !primaryStay || place.id === primaryStay.id) {
      setTravelInfo(null)
      return
    }
    // Immediate haversine fallback so we show SOMETHING right away
    const fastDist = fastHaversineKm(primaryStay.coords, place.coords) * 1000
    setTravelInfo({ distance: fastDist, duration: (fastDist / 1000 / 40) * 3600, synthesized: true })

    let cancelled = false
    getRoute(primaryStay.coords, place.coords, 'driving').then((route) => {
      if (cancelled || !route) return
      setTravelInfo({ distance: route.distanceMeters, duration: route.durationSeconds })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [place?.id, primaryStay?.id, place?.coords?.[0], place?.coords?.[1]])

  if (!place) return null
  const cat = CATEGORY_MAP[place.category]

  const handlePlaceField = (field, value) => updatePlace(trip.id, place.id, { [field]: value })
  const handleStopField = (field, value) => {
    if (stopIndex >= 0 && dayData.day) updateStop(trip.id, dayData.day, stopIndex, { [field]: value })
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={place.id + (editing ? '-edit' : '')}
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
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-base-900/90 via-transparent to-transparent" />
            <div className="absolute top-3 left-3">
              <span
                className={`cat-${place.category} inline-flex items-center gap-1.5 text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-1 rounded-full backdrop-blur`}
                style={{ background: 'rgba(14,11,8,0.6)', color: 'var(--cat)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cat)' }} />
                {cat?.label}
              </span>
            </div>
            {stop && dayData.day && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <div className="text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-1 rounded-full backdrop-blur bg-base-900/60 text-ink">
                  Day {dayData.day} · {stop.time}
                </div>
              </div>
            )}
            {allowEdit && (
              <button
                onClick={() => setEditing((v) => !v)}
                className="absolute bottom-3 right-3 text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-1 rounded-full bg-base-900/80 text-ink border border-ink/10 hover:bg-base-700 transition backdrop-blur"
              >
                {editing ? 'Done' : 'Edit'}
              </button>
            )}
          </div>
        )}

        <div className={`${compact ? 'p-3' : 'p-4'}`}>
          {/* Name */}
          {editing ? (
            <input
              value={place.name}
              onChange={(e) => handlePlaceField('name', e.target.value)}
              className="inline-input font-display display-tight text-2xl text-ink w-full mb-1"
            />
          ) : (
            <h3 className={`font-display display-tight ${compact ? 'text-xl' : 'text-2xl'} text-ink mb-1`}>
              {place.name}
            </h3>
          )}

          {dayData.date && stop && (
            <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-3">
              {formatDate(dayData.date)} · {stop.time}
            </div>
          )}

          {/* Experience */}
          {editing && stopIndex >= 0 ? (
            <textarea
              value={stop?.experience || ''}
              onChange={(e) => handleStopField('experience', e.target.value)}
              rows={2}
              placeholder="What's the experience?"
              className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 font-display italic text-[15px] text-ink-muted mb-3 focus:outline-none focus:border-ink/30 resize-none"
            />
          ) : stop?.experience ? (
            <p className="font-display italic text-ink-muted text-[15px] leading-snug mb-3">
              &ldquo;{stop.experience}&rdquo;
            </p>
          ) : null}

          {/* Notes */}
          {editing ? (
            <textarea
              value={place.notes || ''}
              onChange={(e) => handlePlaceField('notes', e.target.value)}
              rows={2}
              placeholder="Notes about this spot"
              className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1.5 text-sm text-ink-muted mb-3 focus:outline-none focus:border-ink/30 resize-none"
            />
          ) : place.notes ? (
            <p className="text-ink-muted text-sm leading-relaxed mb-3">{place.notes}</p>
          ) : null}

          {/* Vision tags */}
          {!editing && stop?.visionTags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {stop.visionTags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] mono-num uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-ink/15 text-ink-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Data row */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-ink/10">
            <div>
              <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-0.5">
                Price
              </div>
              {editing ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={place.priceINR || 0}
                    onChange={(e) => handlePlaceField('priceINR', Number(e.target.value))}
                    className="inline-input mono-num text-sm text-ink w-20 bg-base-900 border border-ink/10 rounded px-1"
                  />
                  <input
                    value={place.priceUnit || ''}
                    onChange={(e) => handlePlaceField('priceUnit', e.target.value)}
                    placeholder="unit"
                    className="inline-input text-xs text-ink-muted w-20 bg-base-900 border border-ink/10 rounded px-1"
                  />
                </div>
              ) : (
                <div className="mono-num text-sm text-ink">
                  {place.priceINR > 0
                    ? `${formatMoney(place.priceINR, trip.currency, trip.rates)}${place.priceUnit ? ' ' + place.priceUnit : ''}`
                    : 'free'}
                </div>
              )}
            </div>
            <div>
              <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-0.5">
                {place.id === primaryStay?.id ? 'Home base' : 'From stay'}
              </div>
              <div className="mono-num text-sm text-ink">
                {place.id === primaryStay?.id
                  ? 'this is stay'
                  : travelInfo
                    ? `${formatDistance(travelInfo.distance)} · ${formatDuration(travelInfo.duration)}`
                    : '—'}
              </div>
            </div>
          </div>

          {/* Address + Contact as clickable links */}
          {(place.address || place.contact) && !editing && (
            <div className="mt-3 pt-3 border-t border-ink/10 space-y-2">
              {place.address && (
                <a
                  href={mapsLink(place)}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-2 hover:text-ink transition text-ink-muted"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="mt-0.5 flex-shrink-0">
                    <path d="M6 11s-4-3.5-4-6.5a4 4 0 118 0c0 3-4 6.5-4 6.5z" />
                    <circle cx="6" cy="4.5" r="1.2" />
                  </svg>
                  <span className="text-xs leading-snug underline decoration-dotted decoration-ink-dim group-hover:decoration-ink">
                    {place.address}
                  </span>
                </a>
              )}
              {place.contact && (
                <a
                  href={telLink(place.contact)}
                  className="group flex items-center gap-2 hover:text-ink transition text-ink-muted"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0">
                    <path d="M2 3.5a1 1 0 011-1h1.5l1 2.5-1 1a6 6 0 003.5 3.5l1-1 2.5 1v1.5a1 1 0 01-1 1A9 9 0 012 3.5z" />
                  </svg>
                  <span className="mono-num text-xs underline decoration-dotted decoration-ink-dim group-hover:decoration-ink">
                    {place.contact}
                  </span>
                </a>
              )}
            </div>
          )}

          {/* Address + Contact editable */}
          {editing && (
            <div className="mt-3 pt-3 border-t border-ink/10 space-y-2">
              <div>
                <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-1">Address</div>
                <input
                  value={place.address || ''}
                  onChange={(e) => handlePlaceField('address', e.target.value)}
                  placeholder="Street, City"
                  className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1 text-xs text-ink focus:outline-none"
                />
              </div>
              <div>
                <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-1">Phone</div>
                <input
                  value={place.contact || ''}
                  onChange={(e) => handlePlaceField('contact', e.target.value)}
                  placeholder="+94 77 ..."
                  className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1 mono-num text-xs text-ink focus:outline-none"
                />
              </div>
              <div>
                <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim mb-1">Image URL</div>
                <input
                  value={place.image || ''}
                  onChange={(e) => handlePlaceField('image', e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-base-900 border border-ink/10 rounded px-2 py-1 text-xs text-ink focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Quick haversine for instant distance display
function fastHaversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
