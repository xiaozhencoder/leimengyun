<template>
  <div class="chat-page">
    <van-nav-bar :title="chatTitle" left-arrow @click-left="$router.back()" />
    <div v-if="patientRecentBs.length" class="bs-quick-bar">
      <span class="bs-quick-label">最近血糖</span>
      <div class="bs-quick-values">
        <span
          v-for="(item, i) in patientRecentBs"
          :key="i"
          class="bs-quick-item"
          :style="{ color: getBsColor(item.value) }"
        >
          {{ item.label }} {{ item.value }}
        </span>
      </div>
    </div>
    <div class="chat-body" ref="chatBody">
      <template v-for="(msg, idx) in messages" :key="msg.id">
        <div v-if="showTimeDivider(idx)" class="time-divider">{{ formatTimeDivider(msg.createdAt) }}</div>
        <div class="chat-msg" :class="{ self: msg.senderId === myUserId, pending: msg._pending }">
          <div v-if="msg.senderId !== myUserId" class="msg-avatar">{{ chatTitle?.[0] || '?' }}</div>
          <div class="msg-content">
            <div class="msg-bubble" v-if="msg.contentType === 'IMAGE'">
              <img :src="msg.content" class="msg-img" alt="图片" @click="previewImage(msg.content)" />
            </div>
            <div class="msg-bubble" v-else-if="msg.contentType === 'BLOOD_SUGAR_CARD'">
              <div class="bs-card" v-if="parseBsCard(msg.content)">
                <span class="bs-card-label">血糖分享</span>
                <span class="bs-card-value" :style="{ color: getBsColor(parseBsCard(msg.content)!.value) }">
                  {{ parseBsCard(msg.content)!.value }} mmol/L
                </span>
                <span class="bs-card-time">{{ parseBsCard(msg.content)!.time }}</span>
              </div>
              <span v-else>{{ msg.content }}</span>
            </div>
            <div class="msg-bubble" v-else>{{ msg.content }}</div>
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
      <van-field v-model="inputMsg" placeholder="输入消息..." @keyup.enter="handleSend">
        <template #left-icon>
          <van-uploader
            :after-read="onImageSelect"
            accept="image/*"
            :max-size="5 * 1024 * 1024"
            :show-upload="false"
            result-type="dataUrl"
          >
            <van-icon name="photograph" size="22" class="input-icon" />
          </van-uploader>
        </template>
        <template #button>
          <van-button size="small" type="primary" :disabled="!inputMsg.trim()" @click="handleSend">发送</van-button>
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onDeactivated, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast, showImagePreview } from 'vant'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { getMessages, sendMessage, markRead, getConversations } from '@/api/chat'
import { getPatientHealthData } from '@/api/patients'
import { useNewMessage } from '@/api/socket'
import { MEASURE_TIME_LABELS } from '@leimengyun/shared'

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
const patientUserId = ref<string | null>(null)
const patientRecentBs = ref<{ label: string; value: number }[]>([])

function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function formatTimeDivider(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return `今天 ${formatMsgTime(dateStr)}`
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return `昨天 ${formatMsgTime(dateStr)}`
  return `${d.getMonth() + 1}月${d.getDate()}日 ${formatMsgTime(dateStr)}`
}

function getBsColor(v: number) {
  if (v < 3.9) return '#3B82F6'
  if (v <= 7.8) return '#1AAD6E'
  if (v <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

function parseBsCard(content: string): { value: number; time: string } | null {
  try {
    const o = JSON.parse(content)
    if (o && typeof o.value === 'number') return { value: o.value, time: o.time || '' }
  } catch { /* ignore */ }
  return null
}

function previewImage(url: string) {
  showImagePreview([url])
}

async function onImageSelect(file: { file: File; content?: string } | { file: File; content?: string }[]) {
  const f = Array.isArray(file) ? file[0] : file
  if (!f) return
  const dataUrl = (f as { content?: string }).content || (await readFileAsDataURL(f.file))
  if (!dataUrl) return
  const tempId = `temp-img-${Date.now()}`
  const tempMsg = {
    id: tempId, senderId: myUserId.value, contentType: 'IMAGE' as const,
    content: dataUrl, isRead: false, createdAt: new Date().toISOString(), _pending: true,
  }
  messages.value.push(tempMsg)
  await scrollToBottom()
  try {
    const realMsg = await sendMessage(conversationId, dataUrl, 'IMAGE')
    const idx = messages.value.findIndex((m) => m.id === tempId)
    if (idx >= 0) messages.value[idx] = { ...realMsg, _pending: false }
  } catch (err: any) {
    const idx = messages.value.findIndex((m) => m.id === tempId)
    if (idx >= 0) messages.value.splice(idx, 1)
    showFailToast(err.response?.data?.message || '发送失败')
  }
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
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
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function loadConvInfo() {
  try {
    const convs = (await getConversations()) as any[]
    const conv = convs.find((c: any) => c.id === conversationId)
    if (conv) {
      chatTitle.value = conv.otherName
      patientUserId.value = conv.otherUserId
      if (conv.otherRole === 'PATIENT') {
        loadPatientRecentBs(conv.otherUserId)
      }
    }
  } catch { /* ignore */ }
}

async function loadPatientRecentBs(patientId: string) {
  try {
    const res = (await getPatientHealthData(patientId, 1)) as any
    const list = (res.bloodSugars || []).slice(-5)
    patientRecentBs.value = list.map((r: any) => ({
      label: (MEASURE_TIME_LABELS as Record<string, string>)[r.measureTime] || r.measureTime || '',
      value: r.value,
    }))
  } catch {
    patientRecentBs.value = []
  }
}

async function handleSend() {
  const text = inputMsg.value.trim()
  if (!text) return

  const tempId = `temp-${Date.now()}`
  const tempMsg = {
    id: tempId, senderId: myUserId.value, contentType: 'TEXT',
    content: text, isRead: false, createdAt: new Date().toISOString(), _pending: true,
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
    if (!messages.value.some((m) => m.id === msg.id)) {
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
onActivated(() => loadMessages())
onDeactivated(() => chatStore.refreshUnreadCount())
</script>

<style scoped>
.chat-page { display: flex; flex-direction: column; height: 100vh; }
.bs-quick-bar { display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #E8F8F0; font-size: 12px; border-bottom: 1px solid #ebedf0; }
.bs-quick-label { color: #646566; font-weight: 600; }
.bs-quick-values { display: flex; flex-wrap: wrap; gap: 8px; }
.bs-quick-item { font-weight: 600; }
.chat-body { flex: 1; overflow-y: auto; padding: 12px 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 8px; }
.time-divider { text-align: center; font-size: 11px; color: #969799; padding: 6px 0; }
.chat-msg { display: flex; gap: 8px; max-width: 80%; }
.chat-msg.self { align-self: flex-end; flex-direction: row-reverse; }
.chat-msg.pending { opacity: 0.7; }
.msg-avatar { width: 36px; height: 36px; border-radius: 50%; background: #E8F8F0; color: #1AAD6E; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; flex-shrink: 0; }
.msg-content { display: flex; flex-direction: column; }
.msg-bubble { padding: 10px 14px; border-radius: 12px; background: #fff; font-size: 14px; line-height: 1.5; word-break: break-word; }
.chat-msg.self .msg-bubble { background: #E8F0FE; border-top-right-radius: 4px; }
.chat-msg:not(.self) .msg-bubble { border-top-left-radius: 4px; }
.msg-meta { display: flex; align-items: center; gap: 4px; margin-top: 2px; padding: 0 4px; }
.msg-time { font-size: 10px; color: #c8c9cc; }
.chat-msg.self .msg-meta { justify-content: flex-end; }
.msg-sending { display: inline-flex; }
.chat-input-bar { border-top: 1px solid #ebedf0; background: #fff; }
.input-icon { padding: 0 4px; color: #646566; }
.msg-img { max-width: 200px; max-height: 200px; border-radius: 8px; display: block; cursor: pointer; }
.bs-card { display: flex; flex-direction: column; gap: 4px; }
.bs-card-label { font-size: 12px; color: #969799; }
.bs-card-value { font-size: 18px; font-weight: 700; }
.bs-card-time { font-size: 11px; color: #c8c9cc; }
</style>
