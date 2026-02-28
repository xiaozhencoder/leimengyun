<template>
  <div class="chat-page">
    <van-nav-bar title="糖友小明" left-arrow @click-left="$router.back()" />
    <div class="chat-body" ref="chatBody">
      <div v-for="msg in messages" :key="msg.id" class="chat-msg" :class="{ self: msg.isSelf }">
        <div v-if="!msg.isSelf" class="msg-avatar" style="background:#E8F8F0;color:#1AAD6E;">明</div>
        <div class="msg-bubble">{{ msg.content }}</div>
      </div>
    </div>
    <div class="chat-input-bar">
      <van-field v-model="inputMsg" placeholder="输入消息..." @keyup.enter="sendMsg">
        <template #button>
          <van-button size="small" type="primary" @click="sendMsg">发送</van-button>
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const inputMsg = ref('')
const chatBody = ref<HTMLElement>()
const messages = ref([
  { id: 1, content: '李医生，午餐后血糖有点高', isSelf: false },
  { id: 2, content: '午餐碳水65g偏多了，建议控制在45-50g', isSelf: true },
  { id: 3, content: '好的，谢谢医生！', isSelf: false },
])

async function sendMsg() {
  if (!inputMsg.value.trim()) return
  messages.value.push({ id: Date.now(), content: inputMsg.value, isSelf: true })
  inputMsg.value = ''
  await nextTick()
  if (chatBody.value) chatBody.value.scrollTop = chatBody.value.scrollHeight
  setTimeout(() => {
    messages.value.push({ id: Date.now() + 1, content: '好的，收到医生的建议！', isSelf: false })
  }, 1000)
}
</script>

<style scoped>
.chat-page { display: flex; flex-direction: column; height: 100vh; }
.chat-body { flex: 1; overflow-y: auto; padding: 12px 16px; background: #f5f5f5; display: flex; flex-direction: column; gap: 12px; }
.chat-msg { display: flex; gap: 8px; max-width: 80%; }
.chat-msg.self { align-self: flex-end; flex-direction: row-reverse; }
.msg-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; flex-shrink: 0; }
.msg-bubble { padding: 10px 14px; border-radius: 12px; background: #fff; font-size: 14px; line-height: 1.5; }
.chat-msg.self .msg-bubble { background: #E8F0FE; border-top-right-radius: 4px; }
.chat-msg:not(.self) .msg-bubble { border-top-left-radius: 4px; }
.chat-input-bar { border-top: 1px solid #ebedf0; background: #fff; }
</style>
