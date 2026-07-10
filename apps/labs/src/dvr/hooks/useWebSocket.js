import { useEffect, useRef, useState, useCallback } from 'react'

// Plain WebSocket connection with the original's queue + exponential-backoff
// reconnect. onMessage is kept in a ref so the socket callbacks always see the
// latest handler without needing to reconnect. onReconnect (optional) fires
// right after every open EXCEPT the first-ever one, so callers can re-seed
// server-side state (e.g. fleet data) that a fresh socket has no memory of.
export function useWebSocket(onMessage, onReconnect) {
  const wsRef = useRef(null)
  const readyRef = useRef(false)
  const queueRef = useRef([])
  const delayRef = useRef(1000)
  const handlerRef = useRef(onMessage)
  const reconnectRef = useRef(onReconnect)
  const hasConnectedOnceRef = useRef(false)
  const [connected, setConnected] = useState(false)

  handlerRef.current = onMessage
  reconnectRef.current = onReconnect

  const getWsUrl = () => {
    // In dev, NEXT_PUBLIC_WS_URL (see .env.local) points straight at the Flask
    // backend — Next can't proxy WebSockets through rewrites, so we connect
    // directly. In prod the var is unset, so we fall back to a same-origin URL
    // (Flask, or a reverse proxy, serves the app on the same host).
    if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    return `${proto}://${location.host}/chat`
  }

  const connect = useCallback(() => {
    const ws = new WebSocket(getWsUrl())
    wsRef.current = ws

    ws.onopen = () => {
      readyRef.current = true
      delayRef.current = 1000
      setConnected(true)

      // Server-side state (fleet data, etc.) is per-connection and gets wiped
      // on reconnect. Re-seed it before flushing anything that depends on it.
      if (hasConnectedOnceRef.current) {
        reconnectRef.current?.()
      }
      hasConnectedOnceRef.current = true

      queueRef.current.forEach((msg) => ws.send(JSON.stringify(msg)))
      queueRef.current = []
    }

    ws.onclose = () => {
      readyRef.current = false
      setConnected(false)
      setTimeout(connect, delayRef.current)
      delayRef.current = Math.min(delayRef.current * 2, 10000)
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
      ws.close()
    }

    ws.onmessage = (event) => {
      try {
        handlerRef.current?.(JSON.parse(event.data))
      } catch (e) {
        console.error('Failed to parse server message:', e)
      }
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      const ws = wsRef.current
      if (ws) {
        ws.onclose = null // don't trigger auto-reconnect on unmount
        ws.close()
      }
    }
  }, [connect])

  // Send helper — queues if the socket is not open yet.
  const send = useCallback((payload) => {
    if (wsRef.current && readyRef.current) {
      wsRef.current.send(JSON.stringify(payload))
    } else {
      queueRef.current.push(payload)
    }
  }, [])

  return { send, connected }
}
