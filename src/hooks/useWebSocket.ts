import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WSMessage } from '../types'
import { auth } from '../services/auth'

export type UseWebSocketOptions = {
  onMessage?: (msg: WSMessage) => void
  reconnect?: boolean
  maxRetries?: number
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { onMessage, reconnect = true, maxRetries = 10 } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const retriesRef = useRef(0)
  const closedByUserRef = useRef(false)

  const url = useMemo(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const token = auth.getToken()
    const q = token ? `?token=${encodeURIComponent(token)}` : ''
    return `${protocol}//${window.location.host}/ws${q}`
  }, [])

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null
      wsRef.current.onclose = null
      wsRef.current.onmessage = null
      wsRef.current.onerror = null
      try { wsRef.current.close() } catch {}
      wsRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    // Не подключаемся без токена
    if (!auth.getToken()) {
      setIsConnected(false)
      return
    }
    cleanup()
    closedByUserRef.current = false
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      retriesRef.current = 0
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        setLastMessage(data)
        onMessage?.(data)
      } catch (e) {
        // игнорируем не-JSON
      }
    }

    ws.onerror = () => {
      // ошибки обрабатываются закрытием
    }

    ws.onclose = () => {
      setIsConnected(false)
      if (!closedByUserRef.current && reconnect) {
        const attempt = retriesRef.current
        if (attempt < maxRetries) {
          const timeout = Math.min(15000, 500 * Math.pow(2, attempt))
          retriesRef.current += 1
          setTimeout(() => connect(), timeout)
        }
      }
    }
  }, [cleanup, maxRetries, onMessage, reconnect, url])

  const disconnect = useCallback(() => {
    closedByUserRef.current = true
    cleanup()
    setIsConnected(false)
  }, [cleanup])

  const sendJson = useCallback((payload: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
      return true
    }
    return false
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { isConnected, lastMessage, sendJson, reconnect: connect, disconnect, url }
}
