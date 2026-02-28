<template>
  <div class="chat-page">
    <van-nav-bar :title="chatTitle" left-arrow @click-left="$router.back()" />
    <div class="chat-body" ref="chatBody">
      <div v-for="msg in messages" :key="msg.id" class="chat-msg" :class="{ self: msg.senderId === myUserId }">
        <div v-if="msg.senderId !== myUserId" class="msg-avatar">{{ chatTitle?.[0] || '?' }}</div>
        <div class="msg-bubble">{{ msg.content }}</div>
      </div>
      <van-empty v-if="!messages.length && !loading" description="发送一条消息开始对话" image="search" />
    </div>
    <div class="chat-input-bar">
      <van-field v-model="inputMsg" placeholder="输入消息..." @keyup.enter="handleSend">
        <template #button>
          <van-button size="small" type="primary" :loading="sending" @click="handleSend">发送</van-button>
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { getMessages, sendMessage, markRead, getConversations } from '@/api/chat'

const route = useRoute()
const userStore = useUserStore()
const conversationId = route.params.id as string
const myUserId = ref('')
const chatTitle = ref('对话')
const inputMsg = ref('')
const messages = ref<any[]>([])
const chatBody = ref<HTMLElement>()
const loading = ref(true)
const sending = ref(false)

async function loadMessages() {
  loading.value = true
  try {
    messages.value = (await getMessages(conversationId)) as any[]
    await markRead(conversationId)
    await nextTick()
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
  } catch { /* conversation may not exist yet */ }
  finally { loading.value = false }
}

async function loadConvInfo() {
  try {
    const convs = (await getConversations()) as any[]
    const conv = convs.find((c: any) => c.id === conversationId)
    if (conv) chatTitle.value = conv.otherName
  } catch { /* ignore */ }
}

async function handleSend() {
  if (!inputMsg.value.trim() || sending.value) return
  sending.value = true
  try {
    const msg = await sendMessage(conversationId, inputMsg.value)
    messages.value.push(msg)
    inputMsg.value = ''
    await nextTick()
    if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '发送失败')
  } finally { sending.value = false }
}

onMounted(async () => {
  myUserId.value = userStore.userInfo?.id || ''
  await loadConvInfo()
  await loadMessages()
})
</script>

<style scoped>
.chat-page { display: flex; flex-direction: column; height: 100vh; }
.chat-body { flex: 1; overflow-y: auto; padding: 12px 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 12px; }
.chat-msg { display: flex; gap: 8px; max-width: 80%; }
.chat-msg.self { align-self: flex-end; flex-direction: row-reverse; }
.msg-avatar { width: 36px; height: 36px; border-radius: 50%; background: #E8F0FE; color: #3B82F6; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; flex-shrink: 0; }
.msg-bubble { padding: 10px 14px; border-radius: 12px; background: #fff; font-size: 14px; line-height: 1.5; }
.chat-msg.self .msg-bubble { background: #E8F8F0; border-top-right-radius: 4px; }
.chat-msg:not(.self) .msg-bubble { border-top-left-radius: 4px; }
.chat-input-bar { border-top: 1px solid #ebedf0; background: #fff; }
</style>
