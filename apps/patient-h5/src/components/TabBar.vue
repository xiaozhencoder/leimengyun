<template>
  <van-tabbar v-model="active" active-color="#1AAD6E" inactive-color="#999" @change="onChange">
    <van-tabbar-item name="home" icon="wap-home-o">首页</van-tabbar-item>
    <van-tabbar-item name="records" icon="records-o">记录</van-tabbar-item>
    <van-tabbar-item name="messages" icon="chat-o" :badge="unreadCount || undefined">消息</van-tabbar-item>
    <van-tabbar-item name="profile" icon="contact-o">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const unreadCount = ref(0)

const routeMap: Record<string, string> = {
  home: '/home',
  records: '/records',
  messages: '/messages',
  profile: '/profile',
}

const pathToTab: Record<string, string> = {
  '/home': 'home',
  '/records': 'records',
  '/messages': 'messages',
  '/profile': 'profile',
}

const active = ref(pathToTab[route.path] || 'home')

watch(
  () => route.path,
  (path) => {
    if (pathToTab[path]) {
      active.value = pathToTab[path]
    }
  },
)

function onChange(name: string | number) {
  const path = routeMap[name as string]
  if (path && route.path !== path) {
    router.push(path)
  }
}
</script>

<style scoped>
</style>
