import client from './client'

export function getConversations() {
  return client.get('/chat/conversations')
}

export function getMessages(conversationId: string, params?: { before?: string; limit?: number }) {
  return client.get(`/chat/conversations/${conversationId}/messages`, { params })
}

export function sendMessage(conversationId: string, content: string, contentType = 'TEXT') {
  return client.post(`/chat/conversations/${conversationId}/messages`, {
    content,
    contentType,
  })
}

export function createConversation(patientId: string) {
  return client.post('/chat/conversations', { targetUserId: patientId })
}
