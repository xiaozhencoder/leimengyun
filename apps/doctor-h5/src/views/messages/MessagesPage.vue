<template>
  <div class="messages-page">
    <van-nav-bar title="消息" />
    <van-cell-group>
      <van-cell v-for="msg in conversations" :key="msg.id" :title="msg.name" :label="msg.lastMessage"
        is-link @click="$router.push('/chat/' + msg.id)">
        <template #icon>
          <div class="msg-avatar" :style="{ background: msg.bgColor, color: msg.textColor }">{{ msg.initial }}</div>
        </template>
        <template #value>
          <div class="msg-right">
            <span class="msg-time">{{ msg.time }}</span>
            <van-badge v-if="msg.unread" :content="msg.unread" />
          </div>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const conversations = ref([
  { id: '1', name: '糖友小明', initial: '明', lastMessage: '谢谢李医生！', time: '10:32', unread: 2, bgColor: '#E8F8F0', textColor: '#1AAD6E' },
  { id: '2', name: '王大明', initial: '王', lastMessage: '[血糖记录] 15.2 mmol/L', time: '09:15', unread: 1, bgColor: '#FFF0F0', textColor: '#FF4D4F' },
  { id: '3', name: '陈大伟', initial: '陈', lastMessage: '最近换了二甲双胍缓释片', time: '昨天', unread: 0, bgColor: '#FFF8E6', textColor: '#B8860B' },
])
</script>

<style scoped>
.msg-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; margin-right: 12px; }
.msg-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.msg-time { font-size: 11px; color: #c8c9cc; }
</style>
