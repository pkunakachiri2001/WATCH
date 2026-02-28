import { useEffect, useRef, useCallback } from 'react'
import { useWatchStore } from '../store/watchStore'

export function useWebSocket() {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)
  const { hubUrl, setConnected, addNotification, setDeviceValue, toggleDevice } = useWatchStore()

  const send = useCallback((command) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command))
      return true
    }
    return false
  }, [])

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    useWatchStore.setState({ connectionStatus: 'connecting' })

    try {
      const ws = new WebSocket(hubUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        addNotification({ type: 'success', message: 'Connected to Rylo Hub' })
        // Send handshake
        ws.send(JSON.stringify({
          type: 'HANDSHAKE',
          device: 'RYLO_WATCH',
          version: '1.0.0',
          timestamp: Date.now()
        }))
      }

      ws.onclose = () => {
        setConnected(false)
        // Auto-reconnect every 3 seconds
        reconnectTimer.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        setConnected(false)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          handleIncoming(msg)
        } catch (e) {
          console.error('[Rylo] Bad message', e)
        }
      }
    } catch (err) {
      console.error('[Rylo] WebSocket connect error', err)
      reconnectTimer.current = setTimeout(connect, 3000)
    }
  }, [hubUrl])

  const handleIncoming = useCallback((msg) => {
    switch (msg.type) {
      case 'DEVICE_UPDATE':
        setDeviceValue(msg.device, msg.field, msg.value)
        break
      case 'ALERT':
        addNotification({ type: 'alert', message: msg.message })
        break
      case 'EMERGENCY_ACK':
        addNotification({ type: 'success', message: 'Emergency services notified' })
        break
      case 'PONG':
        break
      default:
        console.log('[Rylo] Incoming:', msg)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [])

  // Heartbeat
  useEffect(() => {
    const ping = setInterval(() => {
      send({ type: 'PING', timestamp: Date.now() })
    }, 10000)
    return () => clearInterval(ping)
  }, [send])

  return { send, reconnect: connect }
}
