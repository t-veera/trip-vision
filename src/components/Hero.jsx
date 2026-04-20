import { motion } from 'motion/react'
import { formatDate, tripDurationDays } from '../lib'
import { updateTrip } from '../store'

// ─────────────────────────────────────────────────────────────────────────────
// Hero — editorial title block above the map. Shows origin → destination.
// ─────────────────────────────────────────────────────────────────────────────

export default function Hero({ trip }) {
  const duration = tripDurationDays(trip)

  return (
    <header className="relative px-8 lg:px-16 pt-14 pb-10 max-w-[1600px] mx-auto">
      <div className="grid grid-cols-12 gap-6 lg:gap-10">
        <div className="col-span-12 lg:col-span-8 relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="editorial-kicker mb-5">
              {trip.origin ? (
                <>
                  <input
                    value={trip.origin}
                    onChange={(e) => updateTrip(trip.id, { origin: e.target.value })}
                    className="inline-input font-mono text-inherit w-auto"
                    style={{ width: `${Math.max(trip.origin.length + 2, 10)}ch` }}
                  />
                  {' → '}
                </>
              ) : null}
              {trip.name.split(':')[0]} · {formatDate(trip.startDate)} → {formatDate(trip.endDate)} · {duration} days
            </div>
            <h1
              className="font-display display-tight text-ink"
              style={{
                fontSize: 'clamp(3rem, 8vw, 7rem)',
                fontVariationSettings: '"opsz" 144, "SOFT" 50, "WONK" 1',
              }}
            >
              <input
                value={trip.name}
                onChange={(e) => updateTrip(trip.id, { name: e.target.value })}
                className="inline-input w-full bg-transparent"
                style={{ fontSize: 'inherit', lineHeight: 'inherit', letterSpacing: 'inherit' }}
              />
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 max-w-2xl relative"
          >
            <div
              className="absolute -left-4 top-0 font-display text-6xl leading-none select-none pointer-events-none"
              style={{ color: trip.accentColor }}
            >
              &ldquo;
            </div>
            <textarea
              value={trip.vision}
              onChange={(e) => updateTrip(trip.id, { vision: e.target.value })}
              rows={4}
              className="w-full bg-transparent border-none outline-none resize-none font-display italic text-2xl md:text-3xl text-ink-muted leading-snug pl-4 focus:text-ink transition-colors"
              placeholder="What do you want this trip to feel like?"
              style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30' }}
            />
            {trip.vision && (
              <div
                className="font-display text-6xl leading-none select-none pointer-events-none inline-block align-bottom -mt-6 -ml-1"
                style={{ color: trip.accentColor }}
              >
                &rdquo;
              </div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="col-span-12 lg:col-span-4 relative"
        >
          <div className="relative aspect-[3/4] lg:aspect-auto lg:h-full min-h-[320px] overflow-hidden rounded-md bg-base-700">
            {trip.heroImage && (
              <img
                src={trip.heroImage}
                alt={trip.name}
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            )}
            <div
              className="absolute inset-0 mix-blend-overlay"
              style={{ background: `linear-gradient(180deg, transparent 40%, ${trip.accentColor}40 100%)` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-base-900/40 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-ink">
              <div>
                <div className="mono-num text-[10px] uppercase tracking-[0.25em] opacity-80">
                  {trip.origin ? 'From / To' : 'Location'}
                </div>
                <div className="mono-num text-sm mt-0.5">
                  {trip.origin ? `${trip.origin.split(',')[0]} → ${trip.name.split(':')[0]}` : trip.mapCenter?.map((n) => n.toFixed(2)).join(', ')}
                </div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: trip.accentColor }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#0E0B08" strokeWidth="1.5">
                  <path d="M7 13s-5-4.5-5-8a5 5 0 0110 0c0 3.5-5 8-5 8z" />
                  <circle cx="7" cy="5" r="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="rule mt-16" />
    </header>
  )
}
