<template>
  <van-tabbar v-model="active" active-color="#3B82F6" inactive-color="#969799" route>
    <van-tabbar-item to="/patients" icon="friends">患者</van-tabbar-item>
    <van-tabbar-item to="/messages" icon="chat" :badge="unreadCount || undefined">消息</van-tabbar-item>
    <van-tabbar-item to="/profile" icon="contact">我的</van-tabbar-item>
  </van-tabbar>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Tabbar as VanTabbar, TabbarItem as VanTabbarItem } from 'vant'

const active = ref(0)
const unreadCount = ref(3)
</script>
