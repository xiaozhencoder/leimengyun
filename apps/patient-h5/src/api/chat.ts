import client from './client'
import type { SendMessageDto } from '@leimengyun/shared'

export function getConversations() {
  return client.get('/chat/conversations')
}

export function getMessages(conversationId: string, params?: { before?: string; limit?: number }) {
  return client.get(`/chat/conversations/${conversationId}/messages`, { params })
}

export function sendMessage(data: SendMessageDto) {
  return client.post('/chat/messages', data)
}
