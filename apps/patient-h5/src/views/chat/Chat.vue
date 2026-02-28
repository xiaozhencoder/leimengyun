<template>
  <div class="chat-page">
    <van-nav-bar :title="doctorName" left-arrow @click-left="$router.back()" />

    <div class="message-area" ref="messageArea">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-row"
        :class="{ mine: msg.senderId === currentUserId }"
      >
        <div class="bubble" :class="{ mine: msg.senderId === currentUserId }">
          {{ msg.content }}
        </div>
        <div class="msg-time">
          {{ formatTime(msg.createdAt) }}
        </div>
      </div>

      <van-empty v-if="messages.length === 0" description="暂无消息，开始聊天吧" />
    </div>

    <div class="input-bar">
      <van-field
        v-model="inputText"
        placeholder="输入消息..."
        class="input-field"
        @keyup.enter="handleSend"
      />
      <van-button type="primary" size="small" :disabled="!inputText.trim()" @click="handleSend">
        发送
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { showToast } from 'vant'
import { getMessages, sendMessage } from '@/api/chat'
import { useUserStore } from '@/stores/user'
import type { ChatMessage } from '@leimengyun/shared'

const route = useRoute()
const userStore = useUserStore()
const conversationId = route.params.id as string
const currentUserId = userStore.userInfo?.id || ''

const doctorName = ref('医生')
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const messageArea = ref<HTMLElement>()

function formatTime(time: string) {
  const d = new Date(time)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function scrollToBottom() {
  nextTick(() => {
    if (messageArea.value) {
      messageArea.value.scrollTop = messageArea.value.scrollHeight
    }
  })
}

function handleSend() {
  const text = inputText.value.trim()
  if (!text) return

  sendMessage({
    conversationId,
    contentType: 'TEXT' as never,
    content: text,
  })
    .then((res) => {
      messages.value.push(res.data)
      inputText.value = ''
      scrollToBottom()
    })
    .catch(() => {
      showToast('发送失败')
    })
}

onMounted(() => {
  getMessages(conversationId)
    .then((res) => {
      messages.value = res.data.items || res.data || []
      scrollToBottom()
    })
    .catch(() => {
      /* empty */
    })
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #ededed;
}

.message-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-row {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.message-row.mine {
  align-items: flex-end;
}

.bubble {
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.5;
  background: #fff;
  color: var(--text);
  word-break: break-word;
}

.bubble.mine {
  background: var(--primary);
  color: #fff;
}

.msg-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.input-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid var(--border);
  gap: 8px;
}

.input-field {
  flex: 1;
}
</style>
