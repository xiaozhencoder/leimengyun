<template>
  <div class="chat-page">
    <van-nav-bar :title="chatTitle" left-arrow class="chat-header" @click-left="$router.back()">
      <template #right>
        <span v-if="patientUserId" class="header-archive" @click.stop="goToPatientDetail">档案</span>
      </template>
    </van-nav-bar>
    <div v-if="latestBs" class="bs-quick-bar">
      <span class="bs-quick-text">
        最近血糖: <strong :class="'bs-' + latestBs.statusClass">{{ latestBs.value }}</strong> mmol/L ({{ latestBs.label }} {{ latestBs.time }})
      </span>
      <span :class="['bs-status-tag', 'tag-' + latestBs.statusClass]">{{ latestBs.statusLabel }}</span>
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
            <div class="msg-bubble bs-card-bubble" v-else-if="msg.contentType === 'BLOOD_SUGAR_CARD'">
              <div class="bs-card-label">📊 血糖记录分享</div>
              <div class="bs-card-body">
                <div>
                  <div class="bs-card-time">{{ parseBsCard(msg.content)?.time || '' }}</div>
                  <div :class="['bs-card-value', 'bs-color-' + getBsLevelClass(parseBsCard(msg.content)?.value || 0, parseBsCard(msg.content)?.measureTime)]">
                    {{ parseBsCard(msg.content)?.value }}
                    <span class="bs-card-unit">mmol/L</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="msg-bubble" v-else>{{ msg.content }}</div>
            <div class="msg-meta">
              <span class="msg-time">{{ formatMsgTime(msg.createdAt) }}</span>
              <van-loading v-if="msg._pending" size="12px" class="msg-sending" />
              <span v-else-if="msg.senderId === myUserId && msg.isRead" class="msg-status msg-status--read">已读</span>
              <span v-else-if="msg.senderId === myUserId" class="msg-status msg-status--sent">已发送</span>
            </div>
          </div>
        </div>
      </template>
      <van-empty v-if="!messages.length && !loading" description="发送一条消息开始对话" image="default" />
    </div>
    <div class="chat-input-bar">
      <van-field
        v-model="inputMsg"
        placeholder="输入消息..."
        maxlength="500"
        show-word-limit
        @keyup.enter="handleSend"
      >
        <template #left-icon>
          <van-uploader
            :after-read="onImageSelect"
            accept="image/*"
            :max-size="10 * 1024 * 1024"
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
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showImagePreview } from 'vant'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { getMessages, sendMessage, markRead, getConversations, uploadImage } from '@/api/chat'
import { getPatientHealthData } from '@/api/patients'
import { useNewMessage, useConversationUpdate } from '@/api/socket'
import { MEASURE_TIME_LABELS, isFastingMeasureTime } from '@leimengyun/shared'

const route = useRoute()
const router = useRouter()
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
const latestBs = ref<{
  label: string
  value: number
  time: string
  statusClass: string
  statusLabel: string
} | null>(null)

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


function getBsStatus(value: number): { class: string; label: string } {
  if (value < 3.9) return { class: 'low', label: '偏低' }
  if (value <= 7.8) return { class: 'normal', label: '正常' }
  if (value <= 11.1) return { class: 'high', label: '偏高' }
  return { class: 'danger', label: '高' }
}

function formatTimeOnly(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function goToPatientDetail() {
  if (patientUserId.value) {
    router.push('/patient/' + patientUserId.value)
  }
}

function parseBsCard(content: string): { value: number; time: string; measureTime?: string } | null {
  try {
    const o = JSON.parse(content)
    if (o && typeof o.value === 'number') return { value: o.value, time: o.time || '', measureTime: o.measureTime }
  } catch { /* ignore */ }
  return null
}
function getBsLevelClass(value: number, measureTime?: string): string {
  if (value < 3.9) return 'low'
  const fasting = measureTime ? isFastingMeasureTime(measureTime) : false
  if (fasting) {
    if (value <= 6.1) return 'normal'
    if (value <= 7.0) return 'high'
    return 'danger'
  }
  if (value <= 7.8) return 'normal'
  if (value <= 11.1) return 'high'
  return 'danger'
}

function previewImage(url: string) {
  showImagePreview({
    images: [url],
    closeable: true,
  })
}

async function onImageSelect(file: any) {
  const f = Array.isArray(file) ? file[0] : file
  if (!f?.file) return
  const dataUrl = f.content || (await readFileAsDataURL(f.file))
  if (!dataUrl) return
  const tempId = `temp-img-${Date.now()}`
  const tempMsg = {
    id: tempId, senderId: myUserId.value, contentType: 'IMAGE' as const,
    content: dataUrl, isRead: false, createdAt: new Date().toISOString(), _pending: true,
  }
  messages.value.push(tempMsg)
  await scrollToBottom()
  try {
    const imageUrl = await uploadImage(f.file)
    const realMsg = await sendMessage(conversationId, imageUrl, 'IMAGE')
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
    messages.value = (await getMessages(conversationId)) as unknown as any[]
    await markRead(conversationId)
    await scrollToBottom()
  } catch { /* ignore */ }
  finally { loading.value = false }
}

async function loadConvInfo() {
  latestBs.value = null
  patientUserId.value = null
  try {
    const convs = (await getConversations()) as unknown as any[]
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
    const res = (await getPatientHealthData(patientId, 7)) as any
    const list = res.bloodSugars || []
    const latest = list[0]
    if (latest) {
      const label = (MEASURE_TIME_LABELS as Record<string, string>)[latest.measureTime] || latest.measureTime || ''
      const status = getBsStatus(latest.value)
      latestBs.value = {
        label,
        value: latest.value,
        time: formatTimeOnly(latest.recordedAt),
        statusClass: status.class,
        statusLabel: status.label,
      }
    } else {
      latestBs.value = null
    }
  } catch {
    latestBs.value = null
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

useConversationUpdate((data: any) => {
  if (data.conversationId === conversationId && data.messagesRead) {
    messages.value.forEach((m) => {
      if (m.senderId === myUserId.value && !m.isRead) {
        m.isRead = true
      }
    })
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

.chat-header {
  background: #3b82f6 !important;
}
.chat-header :deep(.van-nav-bar__title),
.chat-header :deep(.van-icon),
.chat-header :deep(.van-nav-bar__text) {
  color: #fff !important;
}
.header-archive {
  font-size: 14px;
  color: #fff;
  cursor: pointer;
}

.bs-quick-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #fff;
  font-size: 12px;
  color: #969799;
  border-bottom: 1px solid #ebedf0;
}
.bs-quick-text strong { font-size: 14px; font-weight: 600; }
.bs-quick-text .bs-low { color: #3b82f6; }
.bs-quick-text .bs-normal { color: #1aad6e; }
.bs-quick-text .bs-high { color: #b8860b; }
.bs-quick-text .bs-danger { color: #ff4d4f; }
.bs-status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 0;
}
.bs-status-tag.tag-low { background: #ebf5ff; color: #3b82f6; }
.bs-status-tag.tag-normal { background: #e8f8f0; color: #1aad6e; }
.bs-status-tag.tag-high { background: #fff8e6; color: #b8860b; }
.bs-status-tag.tag-danger { background: #fff0f0; color: #ff4d4f; }
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
.msg-status {
  font-size: 10px;
  margin-left: 4px;
}
.msg-status--read {
  color: #1aad6e;
}
.msg-status--sent {
  color: #c8c9cc;
}
.chat-input-bar { border-top: 1px solid #ebedf0; background: #fff; }
.input-icon { padding: 0 4px; color: #646566; }
.msg-img { max-width: 200px; max-height: 200px; border-radius: 8px; display: block; cursor: pointer; }
.bs-card-bubble {
  background: linear-gradient(135deg, #e8f8f0, #fff);
  border: 1px solid #d0ead9;
  min-width: 160px;
}
.bs-card-label { font-size: 12px; color: #1aad6e; font-weight: 500; margin-bottom: 6px; }
.bs-card-body { display: flex; justify-content: space-between; align-items: center; }
.bs-card-time { font-size: 11px; color: #969799; margin-bottom: 2px; }
.bs-card-value { font-size: 24px; font-weight: 700; }
.bs-card-unit { font-size: 12px; font-weight: 400; }
.bs-color-low { color: #3b82f6; }
.bs-color-normal { color: #1aad6e; }
.bs-color-high { color: #ffb020; }
.bs-color-danger { color: #ff4d4f; }
</style>
