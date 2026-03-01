<template>
  <div class="tab-layout">
    <div class="tab-content">
      <router-view />
    </div>
    <van-tabbar v-model="active" route :placeholder="true">
      <van-tabbar-item :to="{ name: 'Home' }" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item :to="{ name: 'Records' }" icon="notes-o">记录</van-tabbar-item>
      <van-tabbar-item :to="{ name: 'Messages' }" icon="chat-o" :badge="chatStore.totalUnreadCount || ''">消息</van-tabbar-item>
      <van-tabbar-item :to="{ name: 'Profile' }" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useNewMessage, useConversationUpdate } from '@/api/socket'

const active = ref(0)
const chatStore = useChatStore()

onMounted(() => {
  chatStore.refreshUnreadCount()
})

useNewMessage(() => chatStore.refreshUnreadCount())
useConversationUpdate(() => chatStore.refreshUnreadCount())
</script>

<style scoped>
.tab-layout {
  min-height: 100vh;
  background: #f7f8fa;
}
.tab-content {
  padding-bottom: 50px;
}
:deep(.van-tabbar) {
  --van-tabbar-item-active-color: #1AAD6E;
}
</style>
