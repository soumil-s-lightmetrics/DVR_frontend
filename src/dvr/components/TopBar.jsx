import { useEffect, useState } from 'react'
import ClientIdInput from './ClientIdInput.jsx'

// Last-used IDs are restored on mount — users work against the same account
// for long stretches, and retyping both on every refresh is pure friction.
const LS_FLEET = 'dvr.fleetId'
const LS_CLIENT = 'dvr.clientId'

// localStorage throws in some privacy modes, so every access is guarded.
function readStored(key) {
  try {
    const v = localStorage.getItem(key)
    return typeof v === 'string' ? v : ''
  } catch {
    return ''
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* non-fatal — the field just won't prefill next time */
  }
}

// Top bar: fleet + client loader, connection status, new-chat button.
export default function TopBar({ connected, onLoadFleet, onNewThread, onIdsChanged }) {
  // Both of these are always plain strings. Never reassign either to a fleet
  // or account object — that is what produced the `/[object Object]/load-data`
  // 400s, and a second field doubles the chances of repeating it.
  const [fleetId, setFleetId] = useState('')
  const [clientId, setClientId] = useState('')
  const [loadState, setLoadState] = useState('idle') // idle | loading | loaded | error
  const [errorMsg, setErrorMsg] = useState('')

  // Read localStorage after mount rather than in a useState initializer: this
  // app is client-only, but keeping the first render deterministic avoids any
  // hydration surprise if that ever changes.
  useEffect(() => {
    setFleetId(readStored(LS_FLEET))
    setClientId(readStored(LS_CLIENT))
  }, [])

  const trimmedFleet = fleetId.trim()
  const trimmedClient = clientId.trim()
  const canLoad = Boolean(trimmedFleet) && Boolean(trimmedClient) && loadState !== 'loading'

  const loadLabel =
    loadState === 'loading' ? 'Loading…' : loadState === 'loaded' ? 'Loaded' : loadState === 'error' ? 'Error' : 'Load fleet'

  // Takes no arguments on purpose. It reads the two inputs from state, so no
  // caller can inject a stray value (a click's SyntheticEvent, a fleet object)
  // into the URL. Wrap it in an arrow at every call site.
  async function handleLoad() {
    if (!trimmedFleet || !trimmedClient) return
    setLoadState('loading')
    setErrorMsg('')
    try {
      await onLoadFleet(trimmedFleet, trimmedClient)
      writeStored(LS_FLEET, trimmedFleet)
      writeStored(LS_CLIENT, trimmedClient)
      setLoadState('loaded')
      setTimeout(() => setLoadState('idle'), 2000)
    } catch (e) {
      console.error('Fleet load error:', e)
      setErrorMsg(e?.message || 'Fleet load failed')
      setLoadState('error')
      setTimeout(() => setLoadState('idle'), 4000)
    }
  }

  const onFieldKeyDown = (e) => {
    if (e.key === 'Enter' && canLoad) handleLoad()
  }

  // Editing either ID starts a fresh chat (see resetForIdChange in App) and
  // drops any stale error, which referred to the previous pair of values.
  const editId = (setter) => (v) => {
    setter(v)
    setErrorMsg('')
    setLoadState('idle')
    onIdsChanged?.()
  }

  return (
    <header className="topbar">
      <img src="/images/logo.jpg" alt="Logo" style={{ height: 32, borderRadius: 6 }} />
      <span className="topbar-title">Video Request</span>
      <span className="beta">BETA</span>
      <div className="topbar-right">
        {errorMsg && (
          <span className="fleet-error" title={errorMsg}>
            {errorMsg}
          </span>
        )}
        <input
          className="fleet-input"
          placeholder="Fleet ID…"
          value={fleetId}
          onChange={(e) => editId(setFleetId)(e.target.value)}
          onKeyDown={onFieldKeyDown}
        />
        <ClientIdInput
          value={clientId}
          onChange={editId(setClientId)}
          onEnter={() => {
            if (canLoad) handleLoad()
          }}
        />
        <button className="tb-btn tb-btn-p" onClick={() => handleLoad()} disabled={!canLoad}>
          {loadLabel}
        </button>
        <div className="status-pill">
          <div className={`status-dot${connected ? ' live' : ''}`} />
          <span>{connected ? 'Connected' : 'Reconnecting…'}</span>
        </div>
        <button className="tb-btn tb-btn-g" onClick={onNewThread}>
          + New chat
        </button>
      </div>
    </header>
  )
}
