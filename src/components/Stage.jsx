import { useState } from 'react'
import MapCanvas from './MapCanvas'
import Sidebar from './Sidebar'
import Card from './Card'
import { AnimatePresence } from 'motion/react'

// ─────────────────────────────────────────────────────────────────────────────
// Stage — the hero section below the title block.
// Left ~65% is the map, right ~35% is the sidebar (day timeline + budget).
// A hovered-place Card floats as an overlay on top of the map.
// ─────────────────────────────────────────────────────────────────────────────

export default function Stage({
  trip,
  activeDay,
  onActiveDayChange,
  activePlaceId,
  onActivePlaceChange,
  playing,
  onPlayToggle,
  playStep,
  onPlayStepChange,
  onPlayEnd,
  editorMode,
  onMapClick,
}) {
  const [hoverCtx, setHoverCtx] = useState(null) // { place, stop, dayIndex }

  const hoveredPlace = hoverCtx?.place
  const activeDayIndex = trip.days.findIndex((d) => d.day === activeDay)

  // When not hovering, show active place card if there is one
  const activePlace = trip.places.find((p) => p.id === activePlaceId)
  const activeStop = activePlace
    ? trip.days.find((d) => d.day === activeDay)?.stops.find((s) => s.placeId === activePlace.id)
    : null

  const cardPlace = hoveredPlace || activePlace
  const cardStop = hoveredPlace ? hoverCtx.stop : activeStop
  const cardDayIndex = hoveredPlace ? activeDayIndex : activeDayIndex

  return (
    <section className="px-8 lg:px-16 max-w-[1600px] mx-auto pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-[720px] max-h-[calc(100vh-8rem)]">
        {/* Map with floating card */}
        <div className="lg:col-span-8 relative">
          <MapCanvas
            trip={trip}
            activeDay={activeDay}
            activePlaceId={activePlaceId}
            onActivePlaceChange={onActivePlaceChange}
            onHoverPlace={(place, stop, idx) =>
              setHoverCtx(place ? { place, stop, dayIndex: activeDayIndex, idx } : null)
            }
            playing={playing}
            playStep={playStep}
            onPlayStepChange={onPlayStepChange}
            onPlayEnd={onPlayEnd}
            editorMode={editorMode}
            onMapClick={onMapClick}
          />

          {/* Floating card in top-left */}
          <div className="absolute top-4 left-4 w-[340px] pointer-events-none z-10">
            <AnimatePresence mode="wait">
              {cardPlace && (
                <div key={cardPlace.id} className="pointer-events-auto">
                  <Card
                    place={cardPlace}
                    stop={cardStop}
                    dayIndex={cardDayIndex}
                    trip={trip}
                    compact
                  />
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Legend in bottom-left */}
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 max-w-md z-10 pointer-events-none">
            <Legend />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <Sidebar
            trip={trip}
            activeDay={activeDay}
            onActiveDayChange={onActiveDayChange}
            activePlaceId={activePlaceId}
            onActivePlaceChange={onActivePlaceChange}
            onHoverPlace={(place, stop, idx) =>
              setHoverCtx(place ? { place, stop, dayIndex: activeDayIndex, idx } : null)
            }
            playing={playing}
            onPlayToggle={onPlayToggle}
            editorMode={editorMode}
          />
        </aside>
      </div>
    </section>
  )
}

function Legend() {
  const items = [
    ['stay', 'stay'],
    ['cafe', 'cafe'],
    ['restaurant', 'food'],
    ['chill', 'chill'],
    ['special', 'special'],
    ['rental', 'rental'],
    ['transport', 'transit'],
  ]
  return (
    <>
      {items.map(([cat, label]) => (
        <span
          key={cat}
          className={`cat-${cat} mono-num text-[10px] uppercase tracking-[0.2em] px-2 py-1 rounded-full flex items-center gap-1.5 backdrop-blur`}
          style={{ background: 'rgba(14,11,8,0.7)', color: 'var(--cat)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--cat)' }} />
          {label}
        </span>
      ))}
    </>
  )
}
