import { useState, useEffect } from 'react'
import { useActiveTrip, useUrlSync } from './store'
import Chrome from './components/Chrome'
import Hero from './components/Hero'
import Stage from './components/Stage'
import Info from './components/Info'
import { Packing, Checklist, Contacts } from './components/Lists'
import Editor from './components/Editor'

// ─────────────────────────────────────────────────────────────────────────────
// App
//
// Top-level page shell. The only state that lives up here is UI state that
// needs to be shared between Stage/Map/Sidebar/Editor:
//   - activeDay
//   - activePlaceId (the selected pin)
//   - playing + playStep (cinematic fly-through)
//   - editorMode (shows right-side editor panel)
//   - pendingCoords (set by map click in editor mode)
//
// Trip data lives in the store (see src/store.js).
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  useUrlSync()
  const trip = useActiveTrip()

  const [activeDay, setActiveDay] = useState(1)
  const [activePlaceId, setActivePlaceId] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [playStep, setPlayStep] = useState(0)
  const [editorMode, setEditorMode] = useState(false)
  const [pendingCoords, setPendingCoords] = useState(null)

  // Sync accent color to CSS variable whenever trip changes
  useEffect(() => {
    if (!trip) return
    document.documentElement.style.setProperty('--accent', trip.accentColor || '#E8583A')
    document.documentElement.style.setProperty(
      '--accent-soft',
      hexToRgba(trip.accentColor || '#E8583A', 0.12)
    )
  }, [trip?.accentColor])

  // Reset activeDay when trip changes
  useEffect(() => {
    setActiveDay(1)
    setActivePlaceId(null)
    setPlaying(false)
    setPlayStep(0)
  }, [trip?.id])

  if (!trip) {
    return (
      <div className="h-full flex items-center justify-center text-ink-muted">
        Loading…
      </div>
    )
  }

  const handlePlayToggle = () => {
    if (playing) {
      setPlaying(false)
    } else {
      setPlayStep(0)
      setPlaying(true)
    }
  }

  const handlePlayEnd = () => {
    setPlaying(false)
    setPlayStep(0)
  }

  return (
    <div className="min-h-screen">
      <Chrome
        trip={trip}
        editorMode={editorMode}
        onEditorToggle={() => setEditorMode((v) => !v)}
      />

      <main className={editorMode ? 'pr-[480px]' : ''}>
        <Hero trip={trip} />

        <Stage
          trip={trip}
          activeDay={activeDay}
          onActiveDayChange={setActiveDay}
          activePlaceId={activePlaceId}
          onActivePlaceChange={setActivePlaceId}
          playing={playing}
          onPlayToggle={handlePlayToggle}
          playStep={playStep}
          onPlayStepChange={setPlayStep}
          onPlayEnd={handlePlayEnd}
          editorMode={editorMode}
          onMapClick={(coords) => setPendingCoords(coords)}
        />

        <div className="rule" />

        <Info trip={trip} editorMode={editorMode} />

        <div className="rule" />

        <Packing trip={trip} />

        <div className="rule" />

        <Checklist trip={trip} />

        <div className="rule" />

        <Contacts trip={trip} />

        {/* Footer */}
        <footer className="px-8 lg:px-16 py-16 max-w-[1600px] mx-auto">
          <div className="rule mb-10" />
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div
                className="w-2 h-2 rounded-full inline-block mr-2 align-middle"
                style={{ background: trip.accentColor }}
              />
              <span className="mono-num text-xs uppercase tracking-[0.25em] text-ink-muted">
                Trip Vision · daydream louder
              </span>
            </div>
            <div className="mono-num text-xs text-ink-dim">
              {trip.days?.length} days · {trip.places?.length} places · made with love + mapbox
            </div>
          </div>
        </footer>
      </main>

      {editorMode && (
        <Editor
          trip={trip}
          activeDay={activeDay}
          onActiveDayChange={setActiveDay}
          pendingCoords={pendingCoords}
          onPendingCoordsConsumed={() => setPendingCoords(null)}
        />
      )}
    </div>
  )
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
