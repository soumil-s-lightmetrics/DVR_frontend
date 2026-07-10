import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MIcon } from './common.jsx'
import { fmtUtcDateTime } from '../lib/format.js'
import { TripTypePopup } from './MessageItems.jsx'

function TripRow({ trip, index, selected, scrollTarget, onUseTrip, anchorRef }) {
  const [evtOpen, setEvtOpen] = useState(false)
  const rowRef = useRef(null)

  useEffect(() => {
    if (scrollTarget && rowRef.current) rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [scrollTarget])

  const startFmt = trip.startTimeUTC ? fmtUtcDateTime(trip.startTimeUTC) : '—'
  const pingedFmt = trip.lastPinged ? fmtUtcDateTime(trip.lastPinged) : '—'
  const pingedColor = trip.lastPingedLabel === 'Ongoing' ? 'var(--green)' : 'var(--text-tri)'
  const statusClass =
    trip.dvr_status === 'available' ? 'badge-available' : trip.dvr_status === 'expiring' ? 'badge-expiring' : 'badge-expired'
  const statusLabel =
    trip.dvr_status === 'available' ? 'Available' : trip.dvr_status === 'expiring' ? 'Expiring' : 'Expired'
  const isExpired = trip.dvr_status === 'expired'
  const evtCount = trip.totalEvents || 0

  return (
    <div
      className={`tt-row${isExpired ? ' expired-row' : ''}${selected ? ' tt-row-selected' : ''}`}
      ref={(el) => {
        rowRef.current = el
        if (anchorRef) anchorRef.current = el
      }}
    >
      <div className="tt-col col-asset">
        <div className="tt-asset">{trip.assetId}</div>
      </div>
      <div className="tt-col col-driver tt-cell">{trip.driverName}</div>
      <div className="tt-col col-start tt-cell">{startFmt}</div>
      <div className="tt-col col-pinged tt-cell">
        <span className="pinged-dot" style={{ background: pingedColor }}></span>
        {pingedFmt}
        <br />
        <span style={{ fontSize: 10, color: 'var(--text-tri)' }}>{trip.lastPingedLabel}</span>
      </div>
      <div className="tt-col col-events">
        {evtCount > 0 ? (
          <>
            <span className="evt-toggle" onClick={() => setEvtOpen((o) => !o)}>
              {evtCount} events {evtOpen ? '▾' : '▸'}
            </span>
            <div className={`evt-list${evtOpen ? ' open' : ''}`}>
              {(trip.events || []).map((e, i) => (
                <span className="evt-badge" key={i}>
                  {e.type} ({e.count})
                </span>
              ))}
            </div>
          </>
        ) : (
          <span style={{ fontSize: 11, color: 'var(--text-tri)' }}>None</span>
        )}
      </div>
      <div className="tt-col col-dvr">
        <span className={`badge ${statusClass}`}>{statusLabel}</span>
        {trip.dvr_until ? (
          <div style={{ fontSize: 10, color: 'var(--text-tri)', marginTop: 2 }}>{trip.dvr_until}</div>
        ) : null}
      </div>
      <div className="tt-col col-action">
        {isExpired ? (
          <button className="req-btn" disabled>
            No DVR
          </button>
        ) : (
          <button className={`req-btn${selected ? ' req-btn-selected' : ''}`} onClick={() => onUseTrip(index)}>
            {selected ? (
              <>
                <MIcon name="check" size={13} /> Selected
              </>
            ) : (
              'Use trip'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// Right-hand results canvas: header + trip table (or empty state).
export default function CanvasPanel({ trips, summary, selectedTripId, scrollTripId, scrollNonce, onUseTrip, tripTypePrompt }) {
  const hasTrips = trips.length > 0
  const showPopup = !!tripTypePrompt

  const panelRef = useRef(null)
  const tableRef = useRef(null)
  const selectedRowRef = useRef(null)
  const [popupPos, setPopupPos] = useState(null)

  // Anchor the popup above the selected trip's row, re-measuring whenever the
  // table scrolls or the window resizes so it tracks the row.
  useLayoutEffect(() => {
    if (!showPopup) {
      setPopupPos(null)
      return
    }
    function recompute() {
      const row = selectedRowRef.current
      const panel = panelRef.current
      if (!row || !panel) return
      const rowRect = row.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()
      // Cover the row's exact slot (same top/left/width) rather than float
      // above it — the popup's own translucency is what lets the trip show
      // through underneath.
      setPopupPos({
        top: rowRect.top - panelRect.top,
        left: rowRect.left - panelRect.left,
        width: rowRect.width,
        height: rowRect.height,
      })
    }
    recompute()
    const table = tableRef.current
    table?.addEventListener('scroll', recompute)
    window.addEventListener('resize', recompute)

    // Selecting a trip also kicks off a *smooth* scrollIntoView on the row
    // (see TripRow) via a separate effect that fires after this one, and not
    // every browser emits a 'scroll' event per animation frame of that
    // programmatic scroll. Poll for ~500ms so the popup locks onto the row's
    // final resting position instead of an in-between one.
    const start = performance.now()
    let rafId
    function tick(now) {
      recompute()
      if (now - start < 500) rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      table?.removeEventListener('scroll', recompute)
      window.removeEventListener('resize', recompute)
      cancelAnimationFrame(rafId)
    }
  }, [showPopup, selectedTripId, trips])

  return (
    <div className="canvas-panel" ref={panelRef}>
      {showPopup && popupPos && (
        <div
          className="trip-type-popup-anchor"
          style={{ top: popupPos.top, left: popupPos.left, width: popupPos.width, height: popupPos.height }}
        >
          <TripTypePopup onSelect={tripTypePrompt.onSelect} onClose={tripTypePrompt.onClose} />
        </div>
      )}
      {hasTrips && (
        <div className="canvas-header">
          <span className="canvas-header-title">{summary}</span>
          <span className="canvas-count">
            {trips.length} trip{trips.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {!hasTrips && (
        <div className="canvas-empty">
          <div className="canvas-empty-icon">
            <MIcon name="videocam" size={40} />
          </div>
          <div>No trips found</div>
          <div style={{ fontSize: 11 }}>Search to see matching trips here</div>
        </div>
      )}
      {hasTrips && (
        <div className="trip-table" ref={tableRef}>
          <div className="tt-head">
            <span className="tt-col col-asset">Asset / trip</span>
            <span className="tt-col col-driver">Driver</span>
            <span className="tt-col col-start">Start time</span>
            <span className="tt-col col-pinged">Last pinged</span>
            <span className="tt-col col-events">Safety events</span>
            <span className="tt-col col-dvr">DVR until</span>
            <span className="tt-col col-action">Action</span>
          </div>
          <div>
            {trips.map((t, i) => {
              const isSelected = selectedTripId != null && t.tripId === selectedTripId
              return (
                <TripRow
                  key={t.tripId || i}
                  trip={t}
                  index={i}
                  selected={isSelected}
                  scrollTarget={scrollTripId != null && t.tripId === scrollTripId ? scrollNonce : null}
                  onUseTrip={onUseTrip}
                  anchorRef={isSelected ? selectedRowRef : null}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
