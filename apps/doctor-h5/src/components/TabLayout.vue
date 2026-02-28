<template>
  <div class="tab-layout">
    <div class="tab-content">
      <router-view />
    </div>
    <van-tabbar v-model="active" route :placeholder="true">
      <van-tabbar-item to="/" icon="friends-o">患者</van-tabbar-item>
      <van-tabbar-item to="/messages" icon="chat-o" :badge="unreadCount || ''">消息</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const active = ref(0)
const unreadCount = ref(2)
</script>

<style scoped>
.tab-layout { min-height: 100vh; background: #f7f8fa; }
.tab-content { padding-bottom: 50px; }
:deep(.van-tabbar) { --van-tabbar-item-active-color: #3B82F6; }
</style>
