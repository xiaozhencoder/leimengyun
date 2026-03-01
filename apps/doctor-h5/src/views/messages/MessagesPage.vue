<template>
  <div class="messages-page">
    <van-nav-bar title="消息" />
    <van-pull-refresh v-model="refreshing" @refresh="loadConversations">
      <van-cell-group v-if="conversations.length">
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="msg-item"
          @click="$router.push('/chat/' + conv.id)"
        >
          <div class="msg-avatar-wrap">
            <van-badge v-if="conv.unreadCount" :content="conv.unreadCount" :max="99" :offset="[2, 2]">
              <div class="msg-avatar">{{ conv.otherName?.[0] || '?' }}</div>
            </van-badge>
            <div v-else class="msg-avatar">{{ conv.otherName?.[0] || '?' }}</div>
          </div>
          <div class="msg-body">
            <div class="msg-name">{{ conv.otherName }}</div>
            <div class="msg-preview">{{ conv.lastMessage || '暂无消息' }}</div>
          </div>
          <span class="msg-time">{{ formatTime(conv.lastMessageAt) }}</span>
        </div>
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
.msg-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
  cursor: pointer;
}
.msg-avatar-wrap {
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
}
.msg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f8f0;
  color: #1aad6e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}
.msg-avatar-wrap :deep(.van-badge__wrapper) {
  display: block;
}
.msg-body { flex: 1; min-width: 0; }
.msg-name { font-size: 15px; font-weight: 500; color: #323233; }
.msg-preview { font-size: 13px; color: #969799; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-time { font-size: 11px; color: #c8c9cc; flex-shrink: 0; margin-left: 8px; align-self: flex-start; margin-top: 2px; }
</style>
