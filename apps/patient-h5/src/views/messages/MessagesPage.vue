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
            <div class="msg-avatar">{{ conv.otherName?.[0] || '?' }}</div>
          </template>
          <template #value>
            <div class="msg-right">
              <span class="msg-time">{{ formatTime(conv.lastMessageAt) }}</span>
              <van-badge v-if="conv.unreadCount" :content="conv.unreadCount" />
            </div>
          </template>
        </van-cell>
      </van-cell-group>
      <van-empty v-else description="暂无消息，绑定医生后即可开始对话" image="search">
        <van-button type="primary" size="small" @click="$router.push('/bind-doctor')">
          去绑定医生
        </van-button>
      </van-empty>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated } from 'vue'
import { getConversations } from '@/api/chat'
import { useConversationUpdate, useNewMessage } from '@/api/socket'

const conversations = ref<any[]>([])
const refreshing = ref(false)

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

async function loadConversations() {
  refreshing.value = true
  try {
    conversations.value = (await getConversations()) as any[]
  } catch {
    conversations.value = []
  } finally {
    refreshing.value = false
  }
}

useNewMessage(() => {
  loadConversations()
})

useConversationUpdate(() => {
  loadConversations()
})

onMounted(loadConversations)
onActivated(loadConversations)
</script>

<style scoped>
.msg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e8f0fe;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  margin-right: 12px;
}
.msg-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.msg-time {
  font-size: 11px;
  color: #c8c9cc;
}
</style>
