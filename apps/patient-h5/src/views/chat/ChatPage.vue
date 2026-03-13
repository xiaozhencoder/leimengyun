<template>
  <div class="chat-page">
    <van-nav-bar :title="chatTitle" left-arrow @click-left="$router.back()" />
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
                  <div :class="['bs-card-value', 'bs-' + getBsLevelClass(parseBsCard(msg.content)?.value || 0)]">
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
      <van-empty v-if="!messages.length && !loading" description="发送一条消息开始对话" image="search" />
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
          <div class="input-actions">
            <van-uploader
              :after-read="onImageSelect"
              accept="image/*"
              :max-size="5 * 1024 * 1024"
              :show-upload="false"
              result-type="dataUrl"
            >
              <van-icon name="photograph" size="22" class="input-icon" />
            </van-uploader>
            <van-icon name="bar-chart-o" size="22" class="input-icon" @click="openBsShare" />
          </div>
        </template>
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

    <!-- Blood Sugar Share Sheet -->
    <van-popup v-model:show="showBsSheet" position="bottom" round style="max-height: 60vh; overflow-y: auto;">
      <div class="bs-sheet-header">
        <span class="bs-sheet-title">分享血糖记录</span>
        <van-icon name="cross" class="bs-sheet-close" @click="showBsSheet = false" />
      </div>
      <van-loading v-if="bsLoading" class="bs-loading" />
      <van-empty v-else-if="!recentBs.length" description="暂无血糖记录" image="search" />
      <div v-else class="bs-list">
        <div
          v-for="bs in recentBs"
          :key="bs.id"
          class="bs-item"
          @click="shareBsCard(bs)"
        >
          <div class="bs-item-left">
            <span class="bs-item-label">{{ bs.measureTimeLabel }}</span>
            <span class="bs-item-time">{{ bs.timeStr }}</span>
          </div>
          <div class="bs-item-right">
            <span :class="['bs-val', 'bs-' + bs.levelClass]">{{ bs.value }}</span>
            <span class="bs-unit">mmol/L</span>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onActivated, onDeactivated, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast, showImagePreview } from 'vant'
import { useUserStore } from '@/stores/user'
import { useChatStore } from '@/stores/chat'
import { getMessages, sendMessage, markRead, getConversations, uploadImage } from '@/api/chat'
import { getBloodSugars } from '@/api/health'
import { useNewMessage, useConversationUpdate } from '@/api/socket'
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
const showBsSheet = ref(false)
const bsLoading = ref(false)
const recentBs = ref<any[]>([])

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

function formatBsCardAsText(content: string): string {
  const parsed = parseBsCard(content)
  return parsed ? `${parsed.value} mmol/L ${parsed.time}` : String(content)
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

async function onImageSelect(file: any) {
  const f = Array.isArray(file) ? file[0] : file
  if (!f?.file) return
  const dataUrl = f.content || (await readFileAsDataURL(f.file))
  if (!dataUrl) return
  const tempId = `temp-img-${Date.now()}`
  const tempMsg = {
    id: tempId,
    senderId: myUserId.value,
    contentType: 'IMAGE',
    content: dataUrl,
    isRead: false,
    createdAt: new Date().toISOString(),
    _pending: true,
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
  } catch {
    /* ignore */
  } finally {
    loading.value = false
  }
}

async function loadConvInfo() {
  try {
    const convs = (await getConversations()) as unknown as any[]
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

function getBsLevelClass(value: number): string {
  if (value < 3.9) return 'low'
  if (value <= 7.8) return 'normal'
  if (value <= 11.1) return 'high'
  return 'danger'
}

async function openBsShare() {
  showBsSheet.value = true
  if (recentBs.value.length) return
  bsLoading.value = true
  try {
    const records = (await getBloodSugars(7)) as unknown as any[]
    recentBs.value = records.slice(0, 10).map((r: any) => {
      const d = new Date(r.recordedAt)
      return {
        id: r.id,
        value: r.value,
        measureTime: r.measureTime,
        measureTimeLabel: MEASURE_TIME_LABELS[r.measureTime] || r.measureTime,
        recordedAt: r.recordedAt,
        timeStr: `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`,
        levelClass: getBsLevelClass(r.value),
      }
    })
  } catch {
    /* ignore */
  } finally {
    bsLoading.value = false
  }
}

async function shareBsCard(bs: any) {
  showBsSheet.value = false
  const cardContent = JSON.stringify({
    value: bs.value,
    measureTime: bs.measureTime,
    time: bs.measureTimeLabel + ' ' + bs.timeStr,
    recordedAt: bs.recordedAt,
  })
  const tempId = `temp-bs-${Date.now()}`
  const tempMsg = {
    id: tempId,
    senderId: myUserId.value,
    contentType: 'BLOOD_SUGAR_CARD',
    content: cardContent,
    isRead: false,
    createdAt: new Date().toISOString(),
    _pending: true,
  }
  messages.value.push(tempMsg)
  await scrollToBottom()
  try {
    const realMsg = await sendMessage(conversationId, cardContent, 'BLOOD_SUGAR_CARD')
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
.chat-input-bar {
  border-top: 1px solid #ebedf0;
  background: #fff;
}
.input-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.input-icon {
  padding: 0 4px;
  color: #646566;
}
.msg-img {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  display: block;
  cursor: pointer;
}
.bs-card-bubble {
  background: linear-gradient(135deg, #e8f8f0, #fff);
  border: 1px solid #d0ead9;
  min-width: 160px;
}
.bs-card-label {
  font-size: 12px;
  color: #1aad6e;
  font-weight: 500;
  margin-bottom: 6px;
}
.bs-card-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.bs-card-time {
  font-size: 11px;
  color: #969799;
  margin-bottom: 2px;
}
.bs-card-value {
  font-size: 24px;
  font-weight: 700;
}
.bs-card-unit {
  font-size: 12px;
  font-weight: 400;
}
.bs-low { color: #3b82f6; }
.bs-normal { color: #1aad6e; }
.bs-high { color: #ffb020; }
.bs-danger { color: #ff4d4f; }
.bs-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #ebedf0;
}
.bs-sheet-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}
.bs-sheet-close {
  font-size: 18px;
  color: #969799;
  cursor: pointer;
}
.bs-loading {
  display: flex;
  justify-content: center;
  padding: 32px;
}
.bs-list {
  padding: 8px 0;
}
.bs-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebedf0;
  cursor: pointer;
}
.bs-item:last-child { border-bottom: none; }
.bs-item:active { background: #f7f8fa; }
.bs-item-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bs-item-label {
  font-size: 14px;
  font-weight: 500;
  color: #323233;
}
.bs-item-time {
  font-size: 12px;
  color: #969799;
}
.bs-item-right {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.bs-val {
  font-size: 22px;
  font-weight: 700;
}
.bs-unit {
  font-size: 12px;
  color: #969799;
}
</style>
