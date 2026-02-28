export enum MessageContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  BLOOD_SUGAR_CARD = 'BLOOD_SUGAR_CARD',
}

export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export interface SendMessageDto {
  conversationId: string
  contentType: MessageContentType
  content: string
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  contentType: MessageContentType
  content: string
  isRead: boolean
  createdAt: string
}

export interface ConversationItem {
  id: string
  otherUser: {
    id: string
    name: string
    avatar?: string
    role: string
  }
  lastMessage?: string
  lastMessageAt?: string
  unreadCount: number
}
