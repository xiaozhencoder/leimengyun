import client from './client'

export function getConversations() {
  return client.get('/chat/conversations')
}

export function getMessages(conversationId: string) {
  return client.get(`/chat/conversations/${conversationId}/messages`)
}

export function sendMessage(
  conversationId: string,
  content: string,
  contentType: 'TEXT' | 'IMAGE' | 'BLOOD_SUGAR_CARD' = 'TEXT'
) {
  return client.post('/chat/messages', { conversationId, content, contentType })
}

export function markRead(conversationId: string) {
  return client.put(`/chat/conversations/${conversationId}/read`)
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await client.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as any
  return res.url as string
}
