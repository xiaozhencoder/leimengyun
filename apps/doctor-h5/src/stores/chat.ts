import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getConversations } from '@/api/chat'

export const useChatStore = defineStore('chat', () => {
  const totalUnreadCount = ref(0)

  async function refreshUnreadCount() {
    try {
      const conversations = (await getConversations()) as unknown as { unreadCount?: number }[]
      totalUnreadCount.value = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    } catch {
      totalUnreadCount.value = 0
    }
  }

  function setTotalFromConversations(conversations: { unreadCount?: number }[]) {
    totalUnreadCount.value = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
  }

  return { totalUnreadCount, refreshUnreadCount, setTotalFromConversations }
})
