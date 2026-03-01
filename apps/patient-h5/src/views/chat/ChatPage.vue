<template>
  <div class="chat-page">
    <van-nav-bar :title="chatTitle" left-arrow @click-left="$router.back()" />
    <div class="chat-body" ref="chatBody">
      <template v-for="(msg, idx) in messages" :key="msg.id">
        <div v-if="showTimeDivider(idx)" class="time-divider">{{ formatTimeDivider(msg.createdAt) }}</div>
        <div class="chat-msg" :class="{ self: msg.senderId === myUserId, pending: msg._pending }">
          <div v-if="msg.senderId !== myUserId" class="msg-avatar">{{ chatTitle?.[0] || '?' }}</div>
          <div class="msg-content">
            <div class="msg-bubble">{{ msg.content }}</div>
            <div class="msg-meta">
              <span class="msg-time">{{ formatMsgTime(msg.createdAt) }}</span>
              <van-loading v-if="msg._pending" size="12px" class="msg-sending" />
            </div>
          </div>
        </div>
      </template>
      <van-empty v-if="!messages.length && !loading" description="发送一条消息开始对话" image="search" />
    </div>
    <div class="chat-input-bar">
      <van-field
        v-model="inputMsg"
        placeholder="输入消息..."
        @keyup.enter="handleSend"
      >
        <template #button>
          <van-button
            size="small"
            type="primary"
            :disabled="!inputMsg.trim()"
            @click="handleSend"
          >
            发送
          </van-button>
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onDeactivated, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { getMessages, sendMessage, markRead, getConversations } from '@/api/chat'
import { useNewMessage } from '@/api/socket'

const route = useRoute()
const userStore = useUserStore()
const chatStore = useChatStore()
const conversationId = route.params.id as string
const myUserId = ref('')
const chatTitle = ref('对话')
const inputMsg = ref('')
const messages = ref<any[]>([])
const chatBody = ref<HTMLElement>()
const loading = ref(true)

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatTimeDivider(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  if (isToday) return `今天 ${formatMsgTime(dateStr)}`
  if (isYesterday) return `昨天 ${formatMsgTime(dateStr)}`
  return `${d.getMonth() + 1}月${d.getDate()}日 ${formatMsgTime(dateStr)}`
}

function showTimeDivider(idx: number) {
  if (idx === 0) return true
  const prev = new Date(messages.value[idx - 1].createdAt).getTime()
  const curr = new Date(messages.value[idx].createdAt).getTime()
  return curr - prev > 5 * 60 * 1000
}

async function scrollToBottom() {
  await nextTick()
  if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
}

async function loadMessages() {
  loading.value = true
  try {
    messages.value = (await getMessages(conversationId)) as any[]
    await markRead(conversationId)
    await scrollToBottom()
  } catch {
    /* ignore */
  } finally {
    loading.value = false
  }
}

async function loadConvInfo() {
  try {
    const convs = (await getConversations()) as any[]
    const conv = convs.find((c: any) => c.id === conversationId)
    if (conv) chatTitle.value = conv.otherName
  } catch {
    /* ignore */
  }
}

async function handleSend() {
  const text = inputMsg.value.trim()
  if (!text) return

  const tempId = `temp-${Date.now()}`
  const tempMsg = {
    id: tempId,
    senderId: myUserId.value,
    contentType: 'TEXT',
    content: text,
    isRead: false,
    createdAt: new Date().toISOString(),
    _pending: true,
  }
  messages.value.push(tempMsg)
  inputMsg.value = ''
  await scrollToBottom()

  try {
    const realMsg = await sendMessage(conversationId, text)
    const idx = messages.value.findIndex((m) => m.id === tempId)
    if (idx >= 0) messages.value[idx] = { ...realMsg, _pending: false }
  } catch (err: any) {
    const idx = messages.value.findIndex((m) => m.id === tempId)
    if (idx >= 0) messages.value.splice(idx, 1)
    showFailToast(err.response?.data?.message || '发送失败')
  }
}

useNewMessage((msg: any) => {
  if (msg.conversationId === conversationId) {
    const exists = messages.value.some((m) => m.id === msg.id)
    if (!exists) {
      messages.value.push(msg)
      scrollToBottom()
      markRead(conversationId)
    }
  }
})

onMounted(async () => {
  myUserId.value = userStore.userInfo?.id || ''
  await loadConvInfo()
  await loadMessages()
})

onActivated(() => {
  loadMessages()
})

onDeactivated(() => {
  chatStore.refreshUnreadCount()
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.time-divider {
  text-align: center;
  font-size: 11px;
  color: #969799;
  padding: 6px 0;
}
.chat-msg {
  display: flex;
  gap: 8px;
  max-width: 80%;
}
.chat-msg.self {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.chat-msg.pending {
  opacity: 0.7;
}
.msg-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e8f0fe;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 15px;
  flex-shrink: 0;
}
.msg-content {
  display: flex;
  flex-direction: column;
}
.msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  background: #fff;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.chat-msg.self .msg-bubble {
  background: #e8f8f0;
  border-top-right-radius: 4px;
}
.chat-msg:not(.self) .msg-bubble {
  border-top-left-radius: 4px;
}
.msg-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 0 4px;
}
.msg-time {
  font-size: 10px;
  color: #c8c9cc;
}
.chat-msg.self .msg-meta {
  justify-content: flex-end;
}
.msg-sending {
  display: inline-flex;
}
.chat-input-bar {
  border-top: 1px solid #ebedf0;
  background: #fff;
}
</style>
