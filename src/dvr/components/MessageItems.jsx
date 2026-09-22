import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { MIcon } from './common.jsx'
import {
  fmtClip,
  computeClipEnd,
  clipToInputValue,
  inputValueToClip,
  addMinutesToClip,
  diffMinutesClip,
  CATEGORY_ICON,
  capFirst,
  dateToInputValue,
} from '../lib/format.js'

// ── plain chat turns ────────────────────────────────────────────────────
export function UserMessage({ text, chips }) {
  return (
    <div className="msg user">
      <div className="msg-avatar">U</div>
      <div className="msg-body">
        <div className="msg-role">You</div>
        {chips && chips.length > 0 && (
          <div className="msg-chips">
            {chips.map((c, i) => (
              <span className="selected-tag selected-tag-static" key={i}>
                <MIcon name={CATEGORY_ICON[c.option] || 'category'} size={13} /> {c.label}
              </span>
            ))}
          </div>
        )}
        {text && <div className="msg-text">{text}</div>}
      </div>
    </div>
  )
}

export function BotMessage({ text }) {
  return (
    <div className="msg assistant">
      <div className="msg-avatar">
        <MIcon name="smart_display" />
      </div>
      <div className="msg-body">
        <div className="msg-role">DVR assistant</div>
        <div className="gen-response">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="msg assistant">
      <div className="msg-avatar">
        <MIcon name="smart_display" />
      </div>
      <div className="msg-body">
        <div className="msg-role">DVR assistant</div>
        <div className="typing">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  )
}

// ── clip / timelapse chips ──────────────────────────────────────────────
// `disabled` means the footage is past its retention window, so neither
// request can succeed. Offering nothing beats offering a dead button: the
// chips are replaced by the reason rather than shown greyed out beside it.
export function ActionChips({ large, onStartDvr, disabled, reason }) {
  if (disabled) {
    return (
      <div className="action-chips-note">
        <MIcon name="info" size={15} /> {reason || 'DVR footage has expired.'}
      </div>
    )
  }
  return (
    <div className={`action-chips${large ? ' action-chips-lg' : ''}`}>
      <button className="action-chip" onClick={() => onStartDvr('clip')}>
        <MIcon name="videocam" /> Request a DVR clip
      </button>
      <button className="action-chip" onClick={() => onStartDvr('timelapse')}>
        <MIcon name="timelapse" /> Request a timelapse
      </button>
    </div>
  )
}

// Popup version of the "which format?" prompt — sized and positioned to sit
// entirely inside the selected trip row's own slot (see CanvasPanel), with an
// explicit close affordance. Laid out as a single horizontal line — title
// then the two options — so it never grows taller than the row it covers.
export function TripTypePopup({ onSelect, onClose }) {
  return (
    <div className="trip-type-popup">
      <button className="trip-type-popup-close" onClick={onClose} aria-label="Close">
        <MIcon name="close" size={16} />
      </button>
      <div className="trip-type-popup-title">What would you like to request?</div>
      <div className="action-chips action-chips-compact">
        <button className="action-chip" onClick={() => onSelect('clip')}>
          <MIcon name="videocam" size={14} /> Request a DVR clip
        </button>
        <button className="action-chip" onClick={() => onSelect('timelapse')}>
          <MIcon name="timelapse" size={14} /> Request a timelapse
        </button>
      </div>
    </div>
  )
}

// ── date-range interrupt ────────────────────────────────────────────────
// Typing both ends by hand is the slow path for the common "last N days"
// question, so these fill the two fields instead: To = now, From = now minus
// the preset. The fields stay editable afterwards — a preset is a starting
// point, not a mode.
const RANGE_PRESETS = [
  { label: '3 days', days: 3 },
  { label: '6 days', days: 6 },
  { label: '9 days', days: 9 },
  { label: '12 days', days: 12 },
  { label: '15 days', days: 15 },
  { label: '1 month', months: 1 },
]

export function TimestampInterrupt({ onSubmit, onCancel }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  // Only drives the highlight; any manual edit clears it.
  const [preset, setPreset] = useState(null)

  function applyPreset(p) {
    const to = new Date()
    const from = new Date(to)
    // setMonth handles short months itself: 31 March minus a month is 28 Feb
    // (or 29 in a leap year), never an invalid date.
    if (p.months) from.setMonth(from.getMonth() - p.months)
    else from.setDate(from.getDate() - p.days)
    setStart(dateToInputValue(from))
    setEnd(dateToInputValue(to))
    setPreset(p.label)
  }

  const editStart = (v) => {
    setStart(v)
    setPreset(null)
  }

  const editEnd = (v) => {
    setEnd(v)
    setPreset(null)
  }

  return (
    <div className="interrupt-wrap">
      <div className="interrupt-card">
        <div className="interrupt-card-head">
          <div className="ic-dot" style={{ background: 'var(--amber)' }}></div> Select date range
        </div>
        <div className="interrupt-card-body">
          <div className="ts-presets">
            <span className="ts-presets-label">Last</span>
            {RANGE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`ts-preset${preset === p.label ? ' ts-preset-on' : ''}`}
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="ts-grid">
            <div>
              <div className="ts-label">From</div>
              <input className="ts-input" type="datetime-local" value={start} onChange={(e) => editStart(e.target.value)} />
            </div>
            <div>
              <div className="ts-label">To</div>
              <input className="ts-input" type="datetime-local" value={end} onChange={(e) => editEnd(e.target.value)} />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-purple" onClick={() => start && end && onSubmit(start, end)}>
              Search trips
            </button>
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// A single editable clip-time box: shows the committed value as plain text;
// clicking anywhere on the box opens a popover with the date/time picker and
// an explicit "Set" button, so edits don't apply until confirmed there.
// onCommit may return { error, value } to reject the draft (e.g. clip end
// past the allowed limit) — in that case the popover shows the error inline
// and snaps the draft back to the clamped value instead of closing.
function ClipTimeBox({ label, hint, value, min, max, onCommit }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(clipToInputValue(value))
  const [error, setError] = useState('')
  const boxRef = useRef(null)

  useEffect(() => {
    setDraft(clipToInputValue(value))
  }, [value])

  useEffect(() => {
    if (!open) return
    function handleOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function openEditor() {
    setDraft(clipToInputValue(value))
    setError('')
    setOpen(true)
  }

  function commit() {
    const result = onCommit(inputValueToClip(draft))
    if (result && result.error) {
      setError(result.error)
      setDraft(clipToInputValue(result.value))
    } else {
      setError('')
      setOpen(false)
    }
  }

  return (
    <div className="clip-box clip-editable" ref={boxRef} onClick={openEditor}>
      <div className="ts-label">
        {label} {hint}
      </div>
      <div className="clip-val">{value}</div>
      {open && (
        <div className="clip-popover" onClick={(e) => e.stopPropagation()}>
          <input
            type="datetime-local"
            step="1"
            className="ts-input"
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          {error && <div className="clip-error">{error}</div>}
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-purple" onClick={commit}>
              Set
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── confirm-DVR interrupt ───────────────────────────────────────────────
// clipStart/clipEnd are edited directly on the clip-window boxes now, so
// they're dropped from the generic param dump to avoid showing them twice.
const HIDDEN_KEYS = ['tripId', 'clipStart', 'clipEnd']
const FRIENDLY_KEY = { driverId: 'Driver', assetId: 'Asset', type: 'Type' }

export function ConfirmDvrCard({ payload, onSubmit, onCancel, tripBounds }) {
  const { params, maxDurationMinutes: maxMin, videoFormatOptions, resolutionOptions } = payload
  const clipStartRaw = params.clipStart
  const clipEndRaw = params.clipEnd
  const isTimelapse = params.type === 'timelapse'
  const cardLabel = isTimelapse ? 'Confirm timelapse request' : 'Confirm DVR clip request'
  const defaultDurationMin = maxMin === 3 ? 0.5 : 15

  // Trip window the clip is allowed to fall within, if known.
  const tripStart = tripBounds?.start ? fmtClip(tripBounds.start) : null
  const tripEnd = tripBounds?.end ? fmtClip(tripBounds.end) : null
  const fmtTime = (clipStr) => clipStr?.match(/(\d{2}):(\d{2})/)?.[0] ?? clipStr
  const tripRangeLabel = tripStart && tripEnd ? `${fmtTime(tripStart)}–${fmtTime(tripEnd)}` : null

  const [format, setFormat] = useState(videoFormatOptions[0]?.value)
  const [resolution, setResolution] = useState(resolutionOptions[0])
  // The confirm_dvr interrupt's own clipStart/clipEnd are the backend's
  // authoritative, already-resolved window for THIS request — always trust
  // them for the initial display, never fall back to tripBounds (a
  // heuristic, client-side trip match that can legitimately point at the
  // wrong trip's startTimeUTC/lastPinged). tripStart/tripEnd above are still
  // used below to clamp/validate the user's own manual edits — that's a
  // separate, legitimate use of trip data from what populates the defaults.
  const [clipStart, setClipStart] = useState(() => fmtClip(clipStartRaw))
  const [clipEnd, setClipEnd] = useState(() =>
    clipEndRaw ? fmtClip(clipEndRaw) : computeClipEnd(clipStartRaw, defaultDurationMin),
  )

  // Show the driver's name alongside their ID — resolved from the same trip
  // match used for the clip-time bounds, not a separate lookup.
  const driverName = tripBounds?.driverName || null

  // Duration is an alternative way to set clip end — picking one just moves
  // end to start + duration; editing start/end directly (via ClipTimeBox)
  // works independently. For timelapse, presets longer than however much
  // trip is left from the current start are hidden (a 3-minute DVR clip
  // never runs into this, so no filtering needed there).
  const durationPresets = maxMin === 3 ? [0.5, 1, 2, 3] : [15, 30, 45, 60]
  const remainingTripMin = tripEnd ? diffMinutesClip(clipStart, tripEnd) : null
  const durationOptions =
    isTimelapse && remainingTripMin != null ? durationPresets.filter((d) => d <= remainingTripMin) : durationPresets
  const currentDuration = Math.round(diffMinutesClip(clipStart, clipEnd) * 100) / 100
  // If the current end came from a direct edit rather than a preset, show it
  // as its own option so the dropdown doesn't sit blank/mismatched.
  const durationSelectOptions = durationOptions.some((d) => Math.abs(d - currentDuration) < 0.01)
    ? durationOptions
    : [...durationOptions, currentDuration].sort((a, b) => a - b)

  function handleDurationChange(mins) {
    const d = parseFloat(mins)
    let newEnd = addMinutesToClip(clipStart, d)
    if (tripEnd && diffMinutesClip(newEnd, tripEnd) < 0) newEnd = tripEnd
    setClipEnd(newEnd)
  }

  const rows = Object.entries(params)
    .filter(([k]) => !HIDDEN_KEYS.includes(k))
    .map(([k, v]) => (
      <div className="dvr-param-row" key={k}>
        <span className="dvr-param-key">{FRIENDLY_KEY[k] || k}</span>
        <span className="dvr-param-val">
          {k === 'driverId' && driverName ? `${driverName} (${v})` : k === 'type' ? capFirst(v) : String(v)}
        </span>
      </div>
    ))

  // Committed on "Set" — clamped to the trip window (if known), then moving
  // the start also reclamps end if it now falls outside (start, start + maxMin].
  function commitStart(newStart) {
    if (!newStart) return {}
    let clamped = newStart
    let error = ''
    if (tripStart && diffMinutesClip(tripStart, clamped) < 0) {
      clamped = tripStart
      error = `Clip start must be within the trip's time range${tripRangeLabel ? ` (${tripRangeLabel})` : ''}.`
    } else if (tripEnd && diffMinutesClip(clamped, tripEnd) < 0) {
      clamped = tripEnd
      error = `Clip start must be within the trip's time range${tripRangeLabel ? ` (${tripRangeLabel})` : ''}.`
    }
    setClipStart(clamped)
    const dur = diffMinutesClip(clamped, clipEnd)
    if (dur <= 0 || dur > maxMin) {
      let newEnd = addMinutesToClip(clamped, Math.min(maxMin, defaultDurationMin))
      if (tripEnd && diffMinutesClip(newEnd, tripEnd) < 0) newEnd = tripEnd
      setClipEnd(newEnd)
    }
    return error ? { error, value: clamped } : {}
  }

  // Committed on "Set" — rejects (with an inline message) anything outside
  // (start, start + maxMin] or the trip's own window, snapping back to the
  // nearest valid time.
  function commitEnd(newEnd) {
    if (!newEnd) return {}
    let clamped = newEnd
    let error = ''
    const dur = diffMinutesClip(clipStart, clamped)
    if (dur <= 0) {
      clamped = addMinutesToClip(clipStart, Math.min(maxMin, defaultDurationMin))
      error = 'Clip end must be after clip start.'
    } else if (dur > maxMin) {
      clamped = addMinutesToClip(clipStart, maxMin)
      error = `Exceeds the ${maxMin}-minute limit — reset to start + ${maxMin}m.`
    }
    if (tripEnd && diffMinutesClip(clamped, tripEnd) < 0) {
      clamped = tripEnd
      error = error || `Clip end must be within the trip's time range${tripRangeLabel ? ` (${tripRangeLabel})` : ''}.`
    }
    setClipEnd(clamped)
    return error ? { error, value: clamped } : {}
  }

  function submit() {
    onSubmit({
      videoFormat: format,
      videoResolution: resolution,
      durationMinutes: diffMinutesClip(clipStart, clipEnd),
      clipStart,
      clipEnd,
    })
  }

  return (
    <div className="interrupt-wrap">
      <div className="interrupt-card">
        <div className="interrupt-card-head">
          <div className="ic-dot" style={{ background: 'var(--purple)' }}></div> {cardLabel}
        </div>
        <div className="interrupt-card-body">
          <div className="dvr-params">{rows}</div>
          <div className="clip-window">
            <ClipTimeBox
              label="Clip start"
              value={clipStart}
              min={tripStart ? clipToInputValue(tripStart) : undefined}
              max={tripEnd ? clipToInputValue(tripEnd) : undefined}
              onCommit={commitStart}
            />
            <ClipTimeBox
              label="Clip end"
              value={clipEnd}
              min={clipToInputValue(clipStart)}
              max={(() => {
                const durLimit = addMinutesToClip(clipStart, maxMin)
                // Whichever bound comes first — the duration cap or the trip's own end — wins.
                const tighter = tripEnd && diffMinutesClip(tripEnd, durLimit) > 0 ? tripEnd : durLimit
                return clipToInputValue(tighter)
              })()}
              onCommit={commitEnd}
            />
          </div>
          <div className="ts-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginTop: 10 }}>
            <div>
              <div className="ts-label">Video format</div>
              <select className="ts-input" value={format} onChange={(e) => setFormat(e.target.value)}>
                {videoFormatOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="ts-label">Duration (max {maxMin}m)</div>
              <select className="ts-input" value={currentDuration} onChange={(e) => handleDurationChange(e.target.value)}>
                {durationSelectOptions.map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="ts-label">Resolution</div>
              <select className="ts-input" value={resolution} onChange={(e) => setResolution(e.target.value)}>
                {resolutionOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <button className="btn btn-purple" onClick={submit}>
              Submit request
            </button>
            <button className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── success banner ──────────────────────────────────────────────────────
const LABEL_MAP = {
  driverId: 'Driver',
  assetId: 'Asset',
  type: 'Type',
  clipStart: 'Clip start',
  clipEnd: 'Clip end',
  videoFormat: 'Format',
  videoResolution: 'Resolution',
  durationMinutes: 'Duration (min)',
}
const DETAIL_ORDER = ['driverId', 'assetId', 'type', 'clipStart', 'clipEnd', 'videoFormat', 'videoResolution', 'durationMinutes']
const CAP_KEYS = ['type', 'videoFormat']

export function SuccessBanner({ id, details, summary }) {
  let detailBlock = null
  if (details) {
    detailBlock = (
      <div className="dvr-params">
        {DETAIL_ORDER.filter((k) => details[k] !== undefined && details[k] !== null).map((k) => (
          <div className="dvr-param-row" key={k}>
            <span className="dvr-param-key">{LABEL_MAP[k] || k}</span>
            <span className="dvr-param-val">{CAP_KEYS.includes(k) ? capFirst(details[k]) : String(details[k])}</span>
          </div>
        ))}
      </div>
    )
  } else if (summary) {
    detailBlock = (
      <div style={{ fontSize: 11, color: 'var(--text-tri)', marginTop: 6 }}>
        {capFirst(summary.type)} · {capFirst(summary.videoFormat)} · {summary.videoResolution}
      </div>
    )
  }
  return (
    <div className="result-banner">
      <div className="result-banner-label">
        <MIcon name="check_circle" size={13} /> DVR request raised successfully
      </div>
      <div className="result-banner-id">{id}</div>
      {detailBlock}
    </div>
  )
}
