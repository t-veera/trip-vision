import { useState } from 'react'
import {
  useTrips, setActiveTripId, addTrip, deleteTrip, resetTrip, makeEmptyTrip,
} from '../store'
import { buildShareUrl, copyToClipboard } from '../lib'

// ─────────────────────────────────────────────────────────────────────────────
// Top nav. Trip switcher, share, editor toggle.
// ─────────────────────────────────────────────────────────────────────────────

export default function Chrome({ trip, editorMode, onEditorToggle }) {
  const trips = useTrips()
  const [tripMenuOpen, setTripMenuOpen] = useState(false)
  const [shareNote, setShareNote] = useState('')

  const handleNewTrip = () => {
    const name = prompt('New trip name?', 'Untitled trip')
    if (!name) return
    addTrip(makeEmptyTrip(name))
    setTripMenuOpen(false)
  }

  const handleDelete = () => {
    if (!confirm(`Delete "${trip.name}"?`)) return
    deleteTrip(trip.id)
    setTripMenuOpen(false)
  }

  const handleReset = () => {
    if (!confirm(`Reset "${trip.name}" to its original state? All edits lost.`)) return
    resetTrip(trip.id)
    setTripMenuOpen(false)
  }

  const handleShare = async () => {
    const url = buildShareUrl(trip.id)
    if (!url) return
    const ok = await copyToClipboard(url)
    setShareNote(ok ? 'Link copied!' : url)
    setTimeout(() => setShareNote(''), 2200)
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result)
        if (!parsed.id || !parsed.name) {
          alert('Invalid trip JSON — must have at least an id and name.')
          return
        }
        // If ID already exists, append a suffix so we don't overwrite
        if (trips.some((t) => t.id === parsed.id)) {
          parsed.id = `${parsed.id}-${Date.now().toString(36)}`
        }
        addTrip(parsed)
        setTripMenuOpen(false)
      } catch (err) {
        alert('Not valid JSON: ' + err.message)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(trip, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${trip.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    setTripMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-30 backdrop-blur-md bg-base-800/80 border-b border-ink/10">
      <div className="px-8 lg:px-16 max-w-[1600px] mx-auto h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: trip.accentColor }} />
          <span className="mono-num text-xs uppercase tracking-[0.25em] text-ink">Trip Vision</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setTripMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-sm text-ink-muted hover:text-ink transition"
          >
            <span className="font-display text-base">{trip.name}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d={tripMenuOpen ? 'M2.5 6L5 3.5L7.5 6' : 'M2.5 4L5 6.5L7.5 4'} />
            </svg>
          </button>

          {tripMenuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setTripMenuOpen(false)} />
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[260px] bg-base-700 border border-ink/15 rounded-md shadow-2xl z-40 overflow-hidden">
                <div className="px-3 py-2 mono-num text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                  Your trips
                </div>
                {trips.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setActiveTripId(t.id); setTripMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-ink/5 transition text-left"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.accentColor || '#E8583A' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-ink truncate">{t.name}</div>
                      <div className="mono-num text-[10px] text-ink-dim">
                        {t.days?.length || 0} days · {t.places?.length || 0} places
                      </div>
                    </div>
                    {t.id === trip.id && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink">
                        <path d="M2 6l3 3 5-6" />
                      </svg>
                    )}
                  </button>
                ))}
                <div className="border-t border-ink/10">
                  <button onClick={handleNewTrip} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ink/5 transition text-sm text-ink-muted hover:text-ink">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 2v8M2 6h8" />
                    </svg>
                    New trip
                  </button>
                  <label className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ink/5 transition text-sm text-ink-muted hover:text-ink cursor-pointer">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 2v6M3 5l3-3 3 3M2 10h8" />
                    </svg>
                    Import trip JSON
                    <input type="file" accept=".json,application/json" onChange={handleImport} className="hidden" />
                  </label>
                  <button onClick={handleExport} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ink/5 transition text-sm text-ink-muted hover:text-ink">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 8V2M3 5l3 3 3-3M2 10h8" />
                    </svg>
                    Export this trip
                  </button>
                  <button onClick={handleReset} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ink/5 transition text-sm text-ink-muted hover:text-ink">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 6a4 4 0 118 0M10 2v4H6" />
                    </svg>
                    Reset this trip
                  </button>
                  <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-ink/5 transition text-sm text-ink-muted hover:text-ink">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 3h8M5 3V2a1 1 0 011-1h0a1 1 0 011 1v1M3 3l.5 8a1 1 0 001 1h3a1 1 0 001-1L9 3" />
                    </svg>
                    Delete trip
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-2 text-xs mono-num tracking-wide text-ink-dim hover:text-ink transition"
            title="Copy shareable link"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="3" cy="6" r="1.5" />
              <circle cx="9" cy="3" r="1.5" />
              <circle cx="9" cy="9" r="1.5" />
              <path d="M4.3 5.3L7.7 3.7M4.3 6.7L7.7 8.3" />
            </svg>
            <span className="uppercase tracking-[0.2em]">{shareNote || 'Share'}</span>
          </button>

          {/* Editor toggle */}
          <button
            onClick={onEditorToggle}
            className={`flex items-center gap-2 text-xs mono-num tracking-wide transition ${editorMode ? 'text-ink' : 'text-ink-dim hover:text-ink'}`}
          >
            <span className={`w-7 h-4 rounded-full relative transition ${editorMode ? 'bg-ink/20' : 'bg-ink/5'}`}>
              <span
                className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                style={{
                  left: editorMode ? '14px' : '2px',
                  background: editorMode ? trip.accentColor : 'rgba(244,239,230,0.4)',
                }}
              />
            </span>
            <span className="uppercase tracking-[0.2em]">Edit</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
