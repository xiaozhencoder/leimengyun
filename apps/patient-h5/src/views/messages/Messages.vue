<template>
  <div class="messages-page page-with-tabbar">
    <van-nav-bar title="消息" />

    <div class="message-list">
      <van-empty v-if="conversations.length === 0" description="暂无对话" image="search" />

      <van-cell
        v-for="conv in conversations"
        :key="conv.id"
        :title="conv.otherUser.name"
        :label="conv.lastMessage || '暂无消息'"
        :value="formatTime(conv.lastMessageAt)"
        is-link
        @click="$router.push(`/chat/${conv.id}`)"
      >
        <template #icon>
          <div class="avatar">
            {{ conv.otherUser.name?.charAt(0) || '医' }}
          </div>
        </template>
        <template #right-icon>
          <van-badge v-if="conv.unreadCount > 0" :content="conv.unreadCount" />
        </template>
      </van-cell>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TabBar from '@/components/TabBar.vue'
import { getConversations } from '@/api/chat'
import type { ConversationItem } from '@leimengyun/shared'

const conversations = ref<ConversationItem[]>([])

function formatTime(time?: string) {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

onMounted(() => {
  getConversations()
    .then((res) => {
      conversations.value = res.data || []
    })
    .catch(() => {
      /* use empty list */
    })
})
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: var(--bg);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  margin-right: 12px;
}
</style>
