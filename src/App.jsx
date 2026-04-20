import { useEffect, useState } from 'react'
import Chrome from './components/Chrome'
import Hero from './components/Hero'
import Stage from './components/Stage'
import Info from './components/Info'
import Expenses from './components/Expenses'
import { Packing, Checklist, Contacts } from './components/Lists'
import Editor from './components/Editor'
import { useActiveTrip, useUrlSync } from './store'

// ─────────────────────────────────────────────────────────────────────────────
// Top-level composition. Sections in order:
//   Chrome · Hero · Stage (map+sidebar) · Info · Expenses · Packing · Checklist · Contacts
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  useUrlSync()
  const trip = useActiveTrip()
  const [editorMode, setEditorMode] = useState(false)
  const [pendingMapClick, setPendingMapClick] = useState(null)
  const [activeDay, setActiveDay] = useState(1)
  const [activePlaceId, setActivePlaceId] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [playStep, setPlayStep] = useState(0)

  // Accent color → CSS variables
  useEffect(() => {
    if (!trip) return
    const root = document.documentElement
    root.style.setProperty('--accent', trip.accentColor || '#E8583A')
    root.style.setProperty('--accent-soft', `${trip.accentColor || '#E8583A'}26`)
  }, [trip?.accentColor])

  // Reset state when switching trips
  useEffect(() => {
    setActiveDay(1)
    setActivePlaceId(null)
    setPlaying(false)
    setPlayStep(0)
  }, [trip?.id])

  const handlePlayToggle = () => {
    if (playing) { setPlaying(false) }
    else { setPlayStep(0); setPlaying(true) }
  }
  const handlePlayEnd = () => { setPlaying(false); setPlayStep(0) }

  if (!trip) return <div className="h-screen flex items-center justify-center text-ink-dim">Loading…</div>

  return (
    <div className="min-h-screen">
      <Chrome
        trip={trip}
        editorMode={editorMode}
        onEditorToggle={() => setEditorMode((v) => !v)}
      />

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
        onMapClick={(coords) => { setPendingMapClick(coords); if (!editorMode) setEditorMode(true) }}
      />

      <div className="rule" />
      <Info trip={trip} />
      <div className="rule" />
      <Expenses trip={trip} />
      <div className="rule" />
      <Packing trip={trip} />
      <div className="rule" />
      <Checklist trip={trip} />
      <div className="rule" />
      <Contacts trip={trip} />

      <footer className="px-4 md:px-8 lg:px-16 py-10 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 pt-8 border-t border-ink/10">
          <div>
            <div className="mono-num text-[10px] uppercase tracking-[0.25em] text-ink-dim">
              Trip Vision
            </div>
            <div className="font-display italic text-ink-muted mt-1">
              A daydreaming board for {trip.name}.
            </div>
          </div>
          <div className="mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim text-right">
            Map: MapLibre + Carto<br />
            Routing: OSRM<br />
            No token required.
          </div>
        </div>
      </footer>

      {editorMode && (
        <Editor
          trip={trip}
          pendingMapClick={pendingMapClick}
          onClearMapClick={() => setPendingMapClick(null)}
          onClose={() => { setEditorMode(false); setPendingMapClick(null) }}
        />
      )}
    </div>
  )
}
