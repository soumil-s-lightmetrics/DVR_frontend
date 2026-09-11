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

  // Resolved at build time in next.config.mjs: local Flask (ws://localhost:8080)
  // under `next dev`, the Railway backend in a production build, or
  // NEXT_PUBLIC_WS_URL if set. There's no same-origin fallback because Next
  // rewrites can't proxy WebSockets and Amplify can't serve them.
  const getWsUrl = () => process.env.DVR_WS_URL

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
