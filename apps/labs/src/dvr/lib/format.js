// Date / clip formatting helpers — ported 1:1 from the original DVR_frontend.html.

const UTC_DT = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }

export function friendlyTripLabel(t) {
  return `${t.driverName || 'Trip'} · ${t.assetId || ''}`.trim()
}

export function fmtUtcDateTime(iso) {
  return iso ? new Date(iso).toLocaleString('en-GB', UTC_DT) : ''
}

// Capitalizes just the first letter — for display-only free-text values like
// "type"/"videoFormat" (e.g. "timelapse" -> "Timelapse"), not IDs or dates.
export function capFirst(s) {
  const str = String(s ?? '')
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str
}

// FIX 4 helpers ------------------------------------------------------------
export function fmtClip(iso) {
  if (!iso) return '—'
  return String(iso)
    .replace('T', ' ')
    .replace(/\.\d+/, '')
    .replace(/(\+.*|Z)$/, '')
}

export function computeClipEnd(startIso, durMin) {
  if (!startIso) return '—'
  const start = new Date(startIso)
  if (isNaN(start.getTime())) return fmtClip(startIso) // unparseable — show raw rather than throw
  const end = new Date(start.getTime() + durMin * 60000)
  if (isNaN(end.getTime())) return fmtClip(startIso)
  return end.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')
}

// Editable clip-start/clip-end helpers ------------------------------------
// Clip strings from the two helpers above are naive "YYYY-MM-DD HH:MM:SS"
// wall-clock values (source data is always UTC, so no timezone math is
// needed — we just treat them as plain local strings consistently on both
// sides of any diff/add so the offset cancels out).
function pad(n) {
  return String(n).padStart(2, '0')
}

function fmtLocal(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

// 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DDTHH:MM:SS' (for <input type="datetime-local">)
export function clipToInputValue(clipStr) {
  if (!clipStr || clipStr === '—') return ''
  return clipStr.replace(' ', 'T')
}

// Reverse of clipToInputValue — input's onChange value back to our clip format.
export function inputValueToClip(val) {
  if (!val) return ''
  return val.length === 16 ? val.replace('T', ' ') + ':00' : val.replace('T', ' ')
}

export function addMinutesToClip(clipStr, minutes) {
  const d = new Date(clipToInputValue(clipStr))
  if (isNaN(d.getTime())) return clipStr
  d.setTime(d.getTime() + minutes * 60000)
  return fmtLocal(d)
}

export function diffMinutesClip(startStr, endStr) {
  const s = new Date(clipToInputValue(startStr))
  const e = new Date(clipToInputValue(endStr))
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0
  return (e.getTime() - s.getTime()) / 60000
}

// Category → Material Symbol name (shared by chips, dropdown rows, icons).
export const CATEGORY_ICON = {
  Drivers: 'person',
  Assets: 'local_shipping',
  Trips: 'route',
  'Event Types': 'warning',
  DateRange: 'calendar_month',
}

// Label shown on a chip for a collectedItems entry — shared by the live
// filter pills (SearchPill) and the read-only chips echoed on a sent message.
export function chipLabel(e) {
  if (e.option === 'Drivers') return e.selectedItem.driverName || e.selectedItem.driverId
  if (e.option === 'DateRange') return e.selectedItem.label
  if (e.option === 'Trips') return e.selectedItem.label || friendlyTripLabel({ driverName: 'Trip', assetId: '' })
  return e.selectedItem.assetId || e.selectedItem.event_type || ''
}
