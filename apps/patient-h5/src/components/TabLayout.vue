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
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useNewMessage, useConversationUpdate } from '@/api/socket'

const route = useRoute()
const chatStore = useChatStore()
const active = ref(0)

const TAB_MAP: Record<string, number> = { Home: 0, Records: 1, Messages: 2, Profile: 3 }
watch(() => route.name, (name) => { active.value = TAB_MAP[name as string] ?? 0 }, { immediate: true })

onMounted(() => { chatStore.refreshUnreadCount() })
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
