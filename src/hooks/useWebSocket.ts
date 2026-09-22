import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'

export function useWebSocket(onEvent?: (event: string, payload: any) => void) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!user) {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return
    }

    const token = localStorage.getItem('@gasbid:token')
    if (!token) return

    const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3333'
    const wsUrl = baseUrl.replace('http', 'ws') + `/ws?token=${token}`
    
    function connect() {
      if (wsRef.current?.readyState === WebSocket.OPEN) return

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[WS] Connected')
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.event === 'ORDER_UPDATED' || data.event === 'ORDER_CREATED') {
            console.log(`[WS] ${data.event}:`, data.payload)
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            queryClient.invalidateQueries({ queryKey: ['opportunities'] })
            queryClient.invalidateQueries({ queryKey: ['supplier-metrics'] })
            if (data.payload.orderId) {
              queryClient.invalidateQueries({ queryKey: ['order', data.payload.orderId] })
            }
            if (data.payload.buyerRequestId) {
              queryClient.invalidateQueries({ queryKey: ['buyer-request', data.payload.buyerRequestId] })
              queryClient.invalidateQueries({ queryKey: ['opportunity', data.payload.buyerRequestId] })
            }
          }
          if (data.event === 'PROPOSAL_RECEIVED' || data.event === 'COUNTER_OFFER_RECEIVED' || data.event === 'PROPOSAL_REJECTED') {
            console.log(`[WS] ${data.event}:`, data.payload)
            queryClient.invalidateQueries({ queryKey: ['buyer-requests'] })
            queryClient.invalidateQueries({ queryKey: ['my-proposals'] })
            queryClient.invalidateQueries({ queryKey: ['opportunities'] })
            queryClient.invalidateQueries({ queryKey: ['supplier-metrics'] })
            if (data.payload.buyerRequestId) {
              queryClient.invalidateQueries({ queryKey: ['buyer-request', data.payload.buyerRequestId] })
              queryClient.invalidateQueries({ queryKey: ['opportunity', data.payload.buyerRequestId] })
            }
          }
          if (data.event) {
            onEvent?.(data.event, data.payload)
          }
        } catch (err) {
          console.error('[WS] Error parsing message', err)
        }
      }

      ws.onclose = () => {
        console.log('[WS] Disconnected, retrying in 3s...')
        wsRef.current = null
        setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (wsRef.current) {
        wsRef.current.onclose = null // Prevent reconnect on unmount
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [user, queryClient])
}
