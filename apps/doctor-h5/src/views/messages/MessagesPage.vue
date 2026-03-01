<template>
  <div class="messages-page">
    <van-nav-bar title="消息" />
    <van-pull-refresh v-model="refreshing" @refresh="loadConversations">
      <van-cell-group v-if="conversations.length">
        <van-cell
          v-for="conv in conversations"
          :key="conv.id"
          :title="conv.otherName"
          :label="conv.lastMessage || '暂无消息'"
          is-link
          @click="$router.push('/chat/' + conv.id)"
        >
          <template #icon>
            <van-badge
              v-if="conv.unreadCount"
              :content="conv.unreadCount"
              :max="99"
              class="msg-avatar-badge"
            >
              <div class="msg-avatar">{{ conv.otherName?.[0] || '?' }}</div>
            </van-badge>
            <div v-else class="msg-avatar">{{ conv.otherName?.[0] || '?' }}</div>
          </template>
          <template #value>
            <span class="msg-time">{{ formatTime(conv.lastMessageAt) }}</span>
          </template>
        </van-cell>
      </van-cell-group>
      <van-empty v-else description="暂无消息，患者绑定后即可开始对话" image="search" />
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue'
import { getConversations } from '@/api/chat'
import { useChatStore } from '@/stores/chat'
import { useConversationUpdate, useNewMessage } from '@/api/socket'

const conversations = ref<any[]>([])
const chatStore = useChatStore()
const refreshing = ref(false)

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

async function loadConversations() {
  refreshing.value = true
  try {
    const list = (await getConversations()) as any[]
    conversations.value = list
    chatStore.setTotalFromConversations(list)
  } catch {
    conversations.value = []
    chatStore.setTotalFromConversations([])
  } finally {
    refreshing.value = false
  }
}

useNewMessage(() => loadConversations())
useConversationUpdate(() => loadConversations())

onMounted(loadConversations)
onActivated(loadConversations)
</script>

<style scoped>
.msg-avatar { width: 40px; height: 40px; border-radius: 50%; background: #E8F8F0; color: #1AAD6E; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; margin-right: 12px; }
.msg-avatar-badge { margin-right: 12px; }
.msg-avatar-badge :deep(.van-badge__wrapper) { display: block; }
.msg-time { font-size: 11px; color: #c8c9cc; flex-shrink: 0; }
</style>
