import { useCallback, useMemo, useRef, useState } from 'react'
import TopBar from './components/TopBar.jsx'
import Landing from './components/Landing.jsx'
import MessagesArea from './components/MessagesArea.jsx'
import ChatInputBar from './components/ChatInputBar.jsx'
import CanvasPanel from './components/CanvasPanel.jsx'
import { useWebSocket } from './hooks/useWebSocket.js'
import { friendlyTripLabel, chipLabel } from './lib/format.js'

const EMPTY_FLEET = { drivers: [], asset_ids: [], trip_ids: [], events: [], fleet_id: null }

export default function App() {
  const [fleetData, setFleetData] = useState(EMPTY_FLEET)
  const [messages, setMessages] = useState([])
  const [typing, setTyping] = useState(false)
  const [view, setView] = useState('landing') // 'landing' | 'chat'
  const [collectedItems, setCollectedItems] = useState([])
  const [currentTrips, setCurrentTrips] = useState([])
  const [summary, setSummary] = useState('')
  const [graphPaused, setGraphPaused] = useState(false)
  const [threadId, setThreadId] = useState(() => 't_' + Date.now())
  const [highlight, setHighlight] = useState({ tripId: null, n: 0 })
  const [chatSeed, setChatSeed] = useState({ text: '', n: 0 })

  // Cross-event bookkeeping that must survive renders without triggering them.
  const idRef = useRef(0)
  const currentConfirmParamsRef = useRef(null)
  const lastDvrRequestDetailsRef = useRef(null)

  // Synchronous mirror of collectedItems. The original kept chips in a plain
  // mutable array, so flows like "stage a trip then immediately send" (the
  // single-result auto path) read the update within the same event. React
  // state is async, so we mirror it here and read the ref in send paths.
  const collectedRef = useRef([])
  const commitCollected = useCallback((next) => {
    collectedRef.current = next
    setCollectedItems(next)
  }, [])

  const nextId = () => 'm' + ++idRef.current

  // ── message log helpers ──────────────────────────────────────────────
  const addMsg = useCallback((msg) => setMessages((m) => [...m, { id: nextId(), ...msg }]), [])
  const removeMsg = useCallback((id) => setMessages((m) => m.filter((x) => x.id !== id)), [])
  const appendUser = useCallback((text, chips) => addMsg({ kind: 'user', text, chips }), [addMsg])
  const appendBot = useCallback((text) => addMsg({ kind: 'bot', text }), [addMsg])

  // ── incoming server messages (ported from handleServerMessage) ───────
  // A fresh closure each render — useWebSocket keeps the latest in a ref.
  function handleServerMessage(msg) {
    setTyping(false)

    if (msg.type === 'load_complete') return

    if (msg.type === 'error') {
      appendBot('Error: ' + (msg.message || 'Something went wrong.'))
      return
    }

    if (msg.type === 'interrupt') {
      const p = msg.payload
      if (p.message === 'please provide timestamp') {
        addMsg({ kind: 'ts-interrupt' })
        return
      }
      if (p.message === 'show_results') {
        setGraphPaused(true)
        // Chips and the trips table must reflect whatever this interrupt's
        // filters/trips are, every time — not just on the very first
        // show_results of a turn. A chained turn (e.g. answer an
        // ask-timestamp prompt, then get a follow-up show_results with fresh
        // trips) sends p.first: false for that later interrupt even though
        // it's the current, authoritative dataset; gating the state updates
        // behind p.first left both the chip row and the trips table stuck on
        // whatever was shown before the chained interrupt. p.first still
        // controls whether to re-announce the intro chat messages, so we
        // don't spam "Results are shown in the panel" on every interrupt.
        if (p.filters) applyBackendFilterChips(p.filters)
        renderTripResults(p.trips, p.summary, p.first)
        return
      }
      if (p.message === 'confirm_dvr') {
        currentConfirmParamsRef.current = p.params
        addMsg({ kind: 'confirm-dvr', payload: p })
        return
      }
      return
    }

    if (msg.type === 'chat_response') {
      if (msg.more === false) setGraphPaused(false)
      const r = msg.response
      if (r.uploadRequestId) renderSuccess(r.uploadRequestId, r.dvr_summary)
      else if (r.chat_response) appendBot(r.chat_response)
      return
    }
  }

  // Refs so the reconnect handler (passed into useWebSocket below, before
  // `send` exists as a binding) always sees the latest fleet data/thread/send
  // without creating a circular dependency on `send` itself.
  const fleetDataRef = useRef(fleetData)
  fleetDataRef.current = fleetData
  const threadIdRef = useRef(threadId)
  threadIdRef.current = threadId
  const sendRef = useRef(null)

  const handleReconnect = useCallback(() => {
    if (!fleetDataRef.current.fleet_id) return // nothing loaded yet this session
    sendRef.current?.({ type: 'load_data', fleet_data: fleetDataRef.current, thread_id: threadIdRef.current })
  }, [])

  const { send, connected } = useWebSocket(handleServerMessage, handleReconnect)
  sendRef.current = send

  // ── fleet loader ──────────────────────────────────────────────────────
  const loadFleet = useCallback(
    async (fid) => {
      const res = await fetch(`/${fid}/load-data`)
      if (!res.ok) throw new Error('Bad response')
      const d = await res.json()
      const next = {
        drivers: d.drivers || [],
        asset_ids: d.asset_ids || [],
        trip_ids: d.trip_ids || [],
        events: d.events || [],
        fleet_id: fid,
      }
      setFleetData(next)
      send({ type: 'load_data', fleet_data: { ...next, fleet_id: fid }, thread_id: threadId })
    },
    [send, threadId],
  )

  // ── backend-driven filter chips ───────────────────────────────────────
  function applyBackendFilterChips(filters) {
    const items = []
    if (filters.driver)
      items.push({ option: 'Drivers', selectedItem: { driverId: filters.driver.driverId, driverName: filters.driver.driverName } })
    // filters.asset comes back from the backend as [] (not null/undefined)
    // when there's no asset filter — and [] is truthy in JS, so a naive
    // `if (filters.asset)` stages a bogus Assets chip with assetId set to an
    // *array* instead of a string. That malformed value then flows into every
    // later resume_graph/autocomplete_result on this thread and eventually
    // gets checkpointed as chosen_asset_id = [[]] on the backend — which
    // fails AgentState's pydantic validation on every future graph.invoke()
    // for that thread, silently breaking the whole conversation (including
    // right after a DVR submit, since that's just the next invoke to run).
    const assetVal = Array.isArray(filters.asset) ? filters.asset[0] : filters.asset
    if (assetVal) items.push({ option: 'Assets', selectedItem: { assetId: assetVal } })
    if (filters.events && filters.events.length)
      filters.events.forEach((ev) => items.push({ option: 'Event Types', selectedItem: { event_type: ev } }))
    // Guard against invalid/epoch timestamps so a bogus "1 January 1970" chip never renders.
    if (filters.date_range && filters.date_range.start && filters.date_range.end) {
      const s = new Date(filters.date_range.start)
      const e = new Date(filters.date_range.end)
      const validYear = (d) => !isNaN(d.getTime()) && d.getFullYear() > 1971
      if (validYear(s) && validYear(e)) {
        const fmt = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
        items.push({
          option: 'DateRange',
          selectedItem: { label: `${fmt(s)} – ${fmt(e)}`, start: filters.date_range.start, end: filters.date_range.end },
        })
      }
    }
    commitCollected(items)
    // The chips shown on the message that triggered this response were
    // snapshotted at send-time — before the backend had a chance to parse
    // filters out of the free-text query (e.g. "from 24th June - 28th June").
    // Retroactively replace that message's chips with what was actually
    // extracted, so it doesn't keep showing a stale/previous filter that
    // doesn't match what the user just typed.
    const newChips = buildMsgChips(items)
    setMessages((m) => {
      for (let i = m.length - 1; i >= 0; i--) {
        if (m[i].kind === 'user') {
          const updated = [...m]
          updated[i] = { ...updated[i], chips: newChips }
          return updated
        }
      }
      return m
    })
  }

  // ── trip results + success ────────────────────────────────────────────
  // announce: whether to also post the intro chat messages ("Results are
  // shown in the panel...") — true for a turn's first show_results, false
  // for a later show_results in the same turn (e.g. after a chained
  // ask-timestamp prompt), so re-renders don't spam duplicate chat messages
  // while still always updating what's actually shown in the panel.
  function renderTripResults(trips, sum, announce = true) {
    setCurrentTrips(trips)
    setSummary(sum || '')
    if (!announce) return
    appendBot((sum ? sum + ' ' : '') + 'Results are shown in the panel.')
    if (trips.length > 0) {
      appendBot('Would you like to raise a footage request for any of these trips?')
      addMsg({ kind: 'action-chips' })
    }
  }

  function renderSuccess(id, sum) {
    const details = lastDvrRequestDetailsRef.current
    // The backend's request IDs sometimes carry a leftover "DEMO" marker
    // from the test environment — never surface that to the user.
    const cleanId = typeof id === 'string' ? id.replace(/demo/gi, '').replace(/--+/g, '-').replace(/^[-_]+|[-_]+$/g, '') : id
    addMsg({ kind: 'success', id2: cleanId, details, summary: sum })
    lastDvrRequestDetailsRef.current = null
    currentConfirmParamsRef.current = null
    clearSelectedTrip()
  }

  // ── outbound query helpers ────────────────────────────────────────────
  function buildTagCtx(items) {
    return items
      .map((e) => {
        if (e.option === 'Drivers') return `[Driver: ${e.selectedItem.driverName || e.selectedItem.driverId}]`
        if (e.option === 'Assets') return `[Asset: ${e.selectedItem.assetId}]`
        if (e.option === 'Trips') return `[Trip: ${e.selectedItem.tripId}]`
        if (e.option === 'Event Types') return `[Event: ${e.selectedItem.event_type}]`
        // A staged DateRange chip has to reach the backend as a tag too — it
        // was previously filtered out here entirely, so a user could pick a
        // visible date-range chip, hit send, and have the backend receive no
        // date info at all (then re-prompt for the range it was just given).
        // ISO timestamps, not the display label, since that's what the
        // backend's tag parser expects.
        if (e.option === 'DateRange') return `[DateRange: ${e.selectedItem.start} to ${e.selectedItem.end}]`
        return ''
      })
      .filter(Boolean)
      .join(' ')
  }

  // Read-only chip descriptors echoed on the sent message — same look as the
  // live filter chips in the input, minus the remove button, since a sent
  // query's filters can't be edited after the fact.
  function buildMsgChips(items) {
    return items.map((e) => ({ option: e.option, label: String(chipLabel(e)) }))
  }

  function buildActiveFilters() {
    const items = collectedRef.current
    const driverEntry = items.find((e) => e.option === 'Drivers')
    const assetEntry = items.find((e) => e.option === 'Assets')
    const eventEntries = items.filter((e) => e.option === 'Event Types')
    const dateEntry = items.find((e) => e.option === 'DateRange')
    return {
      driver: driverEntry ? { driverId: driverEntry.selectedItem.driverId, driverName: driverEntry.selectedItem.driverName } : null,
      asset: assetEntry ? assetEntry.selectedItem.assetId : null,
      events: eventEntries.length ? eventEntries.map((e) => e.selectedItem.event_type) : null,
      date_range: dateEntry ? { start: dateEntry.selectedItem.start, end: dateEntry.selectedItem.end } : null,
    }
  }

  function dispatch(pt) {
    const items = collectedRef.current
    if (items.length > 0) {
      const fp = { query: pt, fleet_id: fleetData.fleet_id, query_type: 'directed' }
      items.forEach((e) => {
        if (e.option === 'Drivers') fp.selectedItem = e.selectedItem
        else if (e.option === 'Assets') fp.selectedItem = { assetId: e.selectedItem.assetId }
        else if (e.option === 'Trips') fp.selectedItem = { tripId: e.selectedItem.tripId }
        else if (e.option === 'Event Types') fp.selectedItem = { event_type: e.selectedItem.event_type }
        if (e.option !== 'DateRange') fp.option = e.option
      })
      send({ type: 'autocomplete_result', ...fp, thread_id: threadId })
    } else {
      send({ type: 'only_query', query: pt, thread_id: threadId, fleet_id: fleetData.fleet_id })
    }
  }

  // ── send handlers passed to the search pills ─────────────────────────
  function landingSend(text) {
    const tc = buildTagCtx(collectedRef.current)
    const fq = (tc ? tc + ' ' : '') + text.trim()
    if (!fq.trim()) return false
    setView('chat')
    appendUser(text.trim(), buildMsgChips(collectedRef.current))
    setTyping(true)
    dispatch(fq)
    return true
  }

  function chatSend(text) {
    const t = text.trim()
    if (!t) return false
    const tc = buildTagCtx(collectedRef.current)
    const fq = (tc ? tc + ' ' : '') + t
    const chips = buildMsgChips(collectedRef.current)
    if (graphPaused) {
      appendUser(t, chips)
      setTyping(true)
      const tripEntry = collectedRef.current.find((e) => e.option === 'Trips')
      send({
        type: 'resume_graph',
        thread_id: threadId,
        resume_value: { text: fq, tripId: tripEntry ? tripEntry.selectedItem.tripId : null, activeFilters: buildActiveFilters() },
      })
    } else {
      appendUser(t, chips)
      setTyping(true)
      dispatch(fq)
    }
    return true
  }

  // ── chip / trip selection ─────────────────────────────────────────────
  const onStage = useCallback((entry) => commitCollected([...collectedRef.current, entry]), [commitCollected])
  const onRemoveChip = useCallback(
    (idx) => commitCollected(collectedRef.current.filter((_, i) => i !== idx)),
    [commitCollected],
  )

  const onHighlightTripChip = useCallback((idx) => {
    const entry = collectedRef.current[idx]
    if (!entry || entry.option !== 'Trips') return
    setHighlight((h) => ({ tripId: entry.selectedItem.tripId, n: h.n + 1 }))
  }, [])

  function setTripChip(trip) {
    commitCollected([
      ...collectedRef.current.filter((e) => e.option !== 'Trips'),
      { option: 'Trips', selectedItem: { tripId: trip.tripId, label: friendlyTripLabel(trip) } },
    ])
    setHighlight((h) => ({ tripId: trip.tripId, n: h.n + 1 }))
  }

  function clearSelectedTrip() {
    commitCollected(collectedRef.current.filter((e) => e.option !== 'Trips'))
  }

  // ── DVR request flows ─────────────────────────────────────────────────
  function sendDvrRequestForTrip(trip, type) {
    const label = type === 'clip' ? 'DVR clip' : 'timelapse'
    const s = trip.startTimeUTC
      ? new Date(trip.startTimeUTC).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
      : ''
    chatSend(`Request a ${label} from ${s}`)
  }

  function onStartDvr(type) {
    setMessages((m) => m.filter((x) => x.kind !== 'trip-type-prompt'))
    const tripEntry = collectedRef.current.find((e) => e.option === 'Trips')
    const selectedTrip = tripEntry ? currentTrips.find((t) => t.tripId === tripEntry.selectedItem.tripId) : null
    if (selectedTrip) {
      sendDvrRequestForTrip(selectedTrip, type)
    } else if (currentTrips.length === 1) {
      setTripChip(currentTrips[0])
      sendDvrRequestForTrip(currentTrips[0], type)
    } else {
      const label = type === 'clip' ? 'DVR clip' : 'timelapse'
      setChatSeed((s) => ({ text: `Request a ${label} — `, n: s.n + 1 }))
    }
  }

  function onUseTrip(idx) {
    const trip = currentTrips[idx]
    if (!trip) return
    setTripChip(trip)
    setMessages((m) => [
      ...m.filter((x) => x.kind !== 'trip-type-prompt'),
      { id: nextId(), kind: 'bot', text: `Selected ${trip.assetId} · ${trip.driverName || ''} — what would you like to request?` },
      { id: nextId(), kind: 'trip-type-prompt' },
    ])
  }

  // ── interrupt handlers ────────────────────────────────────────────────
  function onSubmitTimestamp(start, end, msgId) {
    const startIso = new Date(start).toISOString()
    const endIso = new Date(end).toISOString()
    const fmt = (v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const label = `${fmt(start)} – ${fmt(end)}`
    commitCollected([...collectedRef.current, { option: 'DateRange', selectedItem: { label, start: startIso, end: endIso } }])
    send({ type: 'resume_graph', thread_id: threadId, resume_value: { start_time: startIso, end_time: endIso } })
    removeMsg(msgId)
    setTyping(true)
  }

  function onConfirmDvr(confirmed, vals, msgId) {
    const resume_value = { confirmed }
    if (confirmed) {
      resume_value.videoFormat = vals.videoFormat
      resume_value.videoResolution = vals.videoResolution
      resume_value.durationMinutes = vals.durationMinutes
      const details = {
        ...(currentConfirmParamsRef.current || {}),
        videoFormat: vals.videoFormat,
        videoResolution: vals.videoResolution,
        durationMinutes: vals.durationMinutes,
        clipStart: vals.clipStart ?? currentConfirmParamsRef.current?.clipStart ?? null,
        clipEnd: vals.clipEnd ?? null,
      }
      delete details.tripId
      // Show the driver's name alongside their ID, resolved from the same
      // trip match used for the clip-time bounds — not a separate lookup
      // that could point at a different trip.
      const matched = matchTrip(currentConfirmParamsRef.current)
      if (matched?.driverName && details.driverId) {
        details.driverId = `${matched.driverName} (${details.driverId})`
      }
      lastDvrRequestDetailsRef.current = details
    }
    send({ type: 'resume_graph', thread_id: threadId, resume_value })
    removeMsg(msgId)
    if (confirmed) setTyping(true)
  }

  // ── new thread ────────────────────────────────────────────────────────
  function newThread() {
    commitCollected([])
    setGraphPaused(false)
    setCurrentTrips([])
    currentConfirmParamsRef.current = null
    lastDvrRequestDetailsRef.current = null
    setMessages([])
    setSummary('')
    setHighlight({ tripId: null, n: 0 })
    setThreadId('t_' + Date.now())
    setView('landing')
  }

  // ── derived ───────────────────────────────────────────────────────────
  const selectedTripId = useMemo(() => {
    const e = collectedItems.find((x) => x.option === 'Trips')
    return e ? e.selectedItem.tripId : null
  }, [collectedItems])

  const selectedTrip = useMemo(
    () => (selectedTripId != null ? currentTrips.find((t) => t.tripId === selectedTripId) : null),
    [selectedTripId, currentTrips],
  )

  const commonPill = {
    fleetData,
    currentTrips,
    collectedItems,
    onStage,
    onRemoveChip,
    onHighlightTripChip,
    sendWs: send,
    threadId,
  }

  // Matches a confirm_dvr/success payload back to a trip row we already have
  // client-side. The interrupt's tripId doesn't always line up exactly with
  // an entry in currentTrips (it can come back from the backend in a
  // different form, or currentTrips has since been replaced by a later
  // search), so this tries progressively looser matches: exact tripId ->
  // whichever trip is currently "selected" -> same asset+driver as the
  // request (closest to the request's own clipStart if there's more than one
  // candidate). Once matched, this is the single source of truth for both
  // the clip-time bounds AND the driver's display name — no separate lookup
  // that could disagree with it.
  function matchTrip(params) {
    const { tripId, assetId, driverId, clipStart } = params || {}

    let trip = currentTrips.find((t) => String(t.tripId) === String(tripId))

    if (!trip && selectedTrip && (!tripId || String(selectedTrip.tripId) === String(tripId))) {
      trip = selectedTrip
    }

    if (!trip && assetId) {
      const candidates = currentTrips.filter(
        (t) => t.assetId === assetId && (!driverId || t.driverId === driverId || t.driverName === driverId),
      )
      if (candidates.length === 1) {
        trip = candidates[0]
      } else if (candidates.length > 1) {
        const target = clipStart ? new Date(clipStart).getTime() : NaN
        trip = isNaN(target)
          ? candidates[0]
          : candidates.reduce((best, t) => {
              const bestDiff = Math.abs(new Date(best.startTimeUTC).getTime() - target)
              const tDiff = Math.abs(new Date(t.startTimeUTC).getTime() - target)
              return tDiff < bestDiff ? t : best
            })
      }
    }

    return trip || null
  }

  function getTripBounds(params) {
    const trip = matchTrip(params)
    if (!trip) return null
    return { start: trip.startTimeUTC || null, end: trip.lastPinged || null, driverName: trip.driverName || null }
  }

  const msgHandlers = { onStartDvr, onSubmitTimestamp, onConfirmDvr, onDismiss: removeMsg, getTripBounds }
  const tripTypeMsg = messages.find((m) => m.kind === 'trip-type-prompt')

  return (
    <div className="shell">
      <TopBar connected={connected} onLoadFleet={loadFleet} onNewThread={newThread} />
      <div className="main">
        <div className="chat-panel">
          {/* Mutually exclusive: the landing screen and the chat screen can
              never be mounted at the same time. */}
          {view === 'landing' ? (
            <Landing key={threadId} pillProps={{ ...commonPill, onSend: landingSend }} />
          ) : (
            <>
              <MessagesArea active messages={messages} typing={typing} handlers={msgHandlers} />
              <ChatInputBar
                key={threadId}
                active
                selectedTrip={selectedTrip}
                onClearSelectedTrip={clearSelectedTrip}
                pillProps={{ ...commonPill, onSend: chatSend, seed: chatSeed }}
              />
            </>
          )}
        </div>
        <CanvasPanel
          trips={currentTrips}
          summary={summary}
          selectedTripId={selectedTripId}
          scrollTripId={highlight.tripId}
          scrollNonce={highlight.n}
          onUseTrip={onUseTrip}
          tripTypePrompt={tripTypeMsg ? { onSelect: onStartDvr, onClose: () => removeMsg(tripTypeMsg.id) } : null}
        />
      </div>
    </div>
  )
}
