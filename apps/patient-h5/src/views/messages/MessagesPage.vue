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
  { id: '1', name: '李医生', initial: '李', lastMessage: '您最近的血糖控制得不错！', time: '10:30', unread: 3, bgColor: '#E8F0FE', textColor: '#3B82F6' },
  { id: '2', name: '王营养师', initial: '王', lastMessage: '建议碳水控制在50g以内', time: '昨天', unread: 0, bgColor: '#FFF0F5', textColor: '#E91E8C' },
])
</script>

<style scoped>
.msg-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 16px; margin-right: 12px;
}
.msg-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.msg-time { font-size: 11px; color: #c8c9cc; }
</style>
