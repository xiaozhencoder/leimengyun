import { io, Socket } from 'socket.io-client'
import { ref, onUnmounted } from 'vue'

let socket: Socket | null = null

export function connectSocket(token: string) {
  if (socket?.connected) return socket

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('[WS] 已连接', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[WS] 已断开:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('[WS] 连接失败:', err.message)
  })

  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function useSocketEvent(event: string, handler: (data: any) => void) {
  const s = getSocket()
  if (s) {
    s.on(event, handler)
    onUnmounted(() => {
      s.off(event, handler)
    })
  }
}

export function useNewMessage(handler: (message: any) => void) {
  useSocketEvent('newMessage', handler)
}

export function useConversationUpdate(handler: (data: any) => void) {
  useSocketEvent('conversationUpdate', handler)
}
