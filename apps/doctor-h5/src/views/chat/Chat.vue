<template>
  <div class="chat-page">
    <van-nav-bar :title="patientName" left-arrow @click-left="router.back()">
      <template #right>
        <span class="nav-link" @click="goDetail">档案</span>
      </template>
    </van-nav-bar>

    <!-- Patient Quick View -->
    <div class="quick-view">
      <div class="quick-info">
        最近血糖: <strong :class="'bs-' + latestBsLevel">{{ latestBs }}</strong> mmol/L ({{ latestBsTime }})
      </div>
      <van-tag :type="latestBsLevel === 'normal' ? 'success' : latestBsLevel === 'high' ? 'warning' : 'danger'" size="medium">
        {{ latestBsLabel }}
      </van-tag>
    </div>

    <!-- Messages -->
    <div class="chat-body" ref="chatBodyRef">
      <template v-for="(msg, index) in messages" :key="msg.id">
        <div v-if="shouldShowTime(index)" class="chat-time">{{ msg.displayTime }}</div>
        <div :class="['chat-msg', { self: msg.isSelf }]">
          <div v-if="!msg.isSelf" class="avatar-sm" :style="{ background: '#E8F8F0', color: '#1AAD6E' }">
            {{ patientName.charAt(0) }}
          </div>
          <div class="chat-bubble" v-if="msg.type === 'text'">{{ msg.content }}</div>
          <div class="chat-bubble" v-else-if="msg.type === 'bs-card'">
            <div class="bs-card">
              <div class="bs-card-title">📊 血糖记录</div>
              <div class="bs-card-row">
                <div>
                  <div class="bs-card-meta">{{ msg.bsMeta }}</div>
                  <div class="bs-card-value" :class="'bs-' + msg.bsLevel">
                    {{ msg.bsValue }} <span class="bs-card-unit">mmol/L</span>
                  </div>
                </div>
                <van-tag :type="msg.bsLevel === 'normal' ? 'success' : 'warning'" size="medium">{{ msg.bsLabel }}</van-tag>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Input Bar -->
    <div class="chat-input-bar">
      <van-icon name="photograph" size="24" color="#969799" />
      <input
        v-model="inputText"
        class="chat-input"
        placeholder="输入消息..."
        @keyup.enter="handleSend"
      />
      <van-button type="primary" size="small" round @click="handleSend">发送</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NavBar as VanNavBar,
  Tag as VanTag,
  Icon as VanIcon,
  Button as VanButton,
} from 'vant'

const router = useRouter()
const route = useRoute()
const chatBodyRef = ref<HTMLElement>()

const patientName = ref('糖友小明')
const latestBs = ref(8.5)
const latestBsLevel = ref('high')
const latestBsTime = ref('午餐后 12:30')
const latestBsLabel = ref('偏高')

const inputText = ref('')

interface ChatMsg {
  id: string
  type: 'text' | 'bs-card'
  content?: string
  isSelf: boolean
  displayTime: string
  bsValue?: number
  bsLevel?: string
  bsMeta?: string
  bsLabel?: string
}

const messages = ref<ChatMsg[]>([
  {
    id: '1',
    type: 'bs-card',
    isSelf: false,
    displayTime: '今天 10:20',
    bsValue: 8.5,
    bsLevel: 'high',
    bsMeta: '午餐后 · 12:30',
    bsLabel: '偏高',
  },
  {
    id: '2',
    type: 'text',
    content: '李医生，我今天午餐后血糖有点高，是不是午餐碳水吃多了？',
    isSelf: false,
    displayTime: '今天 10:20',
  },
  {
    id: '3',
    type: 'text',
    content: '看了你的记录，午餐碳水65g确实偏多了。建议控制在45-50g。另外注意进餐顺序，先吃蔬菜和蛋白质。',
    isSelf: true,
    displayTime: '今天 10:25',
  },
  {
    id: '4',
    type: 'text',
    content: '你最近几天空腹血糖都在5左右，控制得不错，继续保持！',
    isSelf: true,
    displayTime: '今天 10:26',
  },
  {
    id: '5',
    type: 'text',
    content: '如果餐后2小时血糖经常超过8，可以考虑餐前胰岛素加1-2个单位，但要注意监测，避免低血糖。',
    isSelf: true,
    displayTime: '今天 10:30',
  },
  {
    id: '6',
    type: 'text',
    content: '好的，谢谢李医生！我试试减少碳水摄入，明天午餐换成糙米饭。',
    isSelf: false,
    displayTime: '今天 10:32',
  },
])

function shouldShowTime(index: number) {
  if (index === 0) return true
  return messages.value[index].displayTime !== messages.value[index - 1].displayTime
}

async function handleSend() {
  if (!inputText.value.trim()) return
  const msg: ChatMsg = {
    id: `msg-${Date.now()}`,
    type: 'text',
    content: inputText.value,
    isSelf: true,
    displayTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
  }
  messages.value.push(msg)
  inputText.value = ''

  await nextTick()
  if (chatBodyRef.value) {
    chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  }

  setTimeout(async () => {
    messages.value.push({
      id: `msg-${Date.now()}`,
      type: 'text',
      content: '好的，收到医生的建议，谢谢！',
      isSelf: false,
      displayTime: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
    })
    await nextTick()
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
    }
  }, 1200)
}

function goDetail() {
  router.push(`/patients/${route.params.id}`)
}
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

:deep(.van-nav-bar) {
  background: var(--doctor-primary);
  flex-shrink: 0;
}

:deep(.van-nav-bar .van-nav-bar__title) {
  color: #fff;
}

:deep(.van-nav-bar .van-icon) {
  color: #fff !important;
}

.nav-link {
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}

:deep(.van-button--primary) {
  background-color: var(--doctor-primary);
  border-color: var(--doctor-primary);
}

.quick-view {
  background: #fff;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.quick-info {
  font-size: 12px;
  color: var(--text-3);
}

.quick-info strong {
  font-size: 14px;
}

.bs-normal {
  color: #1AAD6E;
}

.bs-high {
  color: #FFB020;
}

.bs-danger {
  color: #FF4D4F;
}

.bs-low {
  color: #3B82F6;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-time {
  text-align: center;
  font-size: 11px;
  color: var(--text-3);
  padding: 4px 0;
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

.avatar-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 15px;
  flex-shrink: 0;
}

.chat-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  background: #fff;
  border-top-left-radius: 4px;
}

.chat-msg.self .chat-bubble {
  background: var(--doctor-primary-light);
  color: var(--text-1);
  border-top-left-radius: 12px;
  border-top-right-radius: 4px;
}

.bs-card {
  background: linear-gradient(135deg, #E8F8F0, #fff);
  border: 1px solid #d0ead9;
  border-radius: 10px;
  padding: 12px;
}

.bs-card-title {
  font-size: 12px;
  color: #1AAD6E;
  font-weight: 500;
  margin-bottom: 6px;
}

.bs-card-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.bs-card-meta {
  font-size: 11px;
  color: var(--text-3);
}

.bs-card-value {
  font-size: 24px;
  font-weight: 700;
}

.bs-card-unit {
  font-size: 12px;
  font-weight: 400;
}

.chat-input-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #fff;
  border-top: 1px solid var(--border);
  gap: 8px;
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 0 14px;
  font-size: 14px;
  outline: none;
}

.chat-input:focus {
  border-color: var(--doctor-primary);
}
</style>
