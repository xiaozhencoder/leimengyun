<template>
  <div class="messages-page">
    <van-nav-bar title="消息" class="messages-header" />
    <van-pull-refresh v-model="refreshing" @refresh="loadConversations">
      <van-cell-group v-if="conversations.length">
        <div
          v-for="(conv, idx) in conversations"
          :key="conv.id"
          class="msg-item"
          @click="$router.push('/chat/' + conv.id)"
        >
          <div class="msg-avatar-wrap">
            <van-badge v-if="conv.unreadCount" :content="conv.unreadCount" :max="99" :offset="[2, 2]">
              <div class="msg-avatar" :class="'avatar-color-' + (idx % 3)">{{ conv.otherName?.[0] || '?' }}</div>
            </van-badge>
            <div v-else class="msg-avatar" :class="'avatar-color-' + (idx % 3)">{{ conv.otherName?.[0] || '?' }}</div>
          </div>
          <div class="msg-body">
            <div class="msg-name-row">
              <span class="msg-name">{{ conv.otherName }}</span>
              <span v-if="conv.otherTag" :class="['msg-tag', tagColorClass(conv.otherTag)]">{{ conv.otherTag }}</span>
            </div>
            <div class="msg-preview">{{ formatPreview(conv) }}</div>
          </div>
          <span class="msg-time">{{ formatTime(conv.lastMessageAt) }}</span>
        </div>
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
import { useChatStore } from '@/stores/chat'
import { useConversationUpdate, useNewMessage } from '@/api/socket'

const conversations = ref<any[]>([])
const chatStore = useChatStore()
const refreshing = ref(false)

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

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
  return WEEKDAYS[d.getDay()]
}

function formatPreview(conv: { lastMessage?: string; lastMessageType?: string }) {
  const type = conv.lastMessageType || 'TEXT'
  if (type === 'IMAGE') return '[图片]'
  if (type === 'BLOOD_SUGAR_CARD') return '[血糖记录]'
  return conv.lastMessage || '暂无消息'
}

function tagColorClass(tag: string) {
  if (tag?.includes('营养') || tag === '营养师') return 'tag-blue'
  return 'tag-green'
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
.messages-header {
  background: #1aad6e !important;
}
.messages-header :deep(.van-nav-bar__title),
.messages-header :deep(.van-icon) {
  color: #fff !important;
}

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
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}
.msg-avatar.avatar-color-0 {
  background: #e8f0fe;
  color: #3b82f6;
}
.msg-avatar.avatar-color-1 {
  background: #fff0f5;
  color: #e91e8c;
}
.msg-avatar.avatar-color-2 {
  background: #fff8e6;
  color: #b8860b;
}
.msg-avatar-wrap :deep(.van-badge__wrapper) {
  display: block;
}
.msg-body { flex: 1; min-width: 0; }
.msg-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.msg-name { font-size: 15px; font-weight: 500; color: #323233; }
.msg-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}
.msg-tag.tag-green {
  background: #e8f8f0;
  color: #1aad6e;
}
.msg-tag.tag-blue {
  background: #ebf5ff;
  color: #3b82f6;
}
.msg-preview { font-size: 13px; color: #969799; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.msg-time { font-size: 11px; color: #c8c9cc; flex-shrink: 0; margin-left: 8px; align-self: flex-start; margin-top: 2px; }
</style>
