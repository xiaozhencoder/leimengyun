<template>
  <div class="records-page">
    <van-nav-bar title="健康记录" />
    <van-tabs v-model:active="activeTab">
      <van-tab title="全部" />
      <van-tab title="血糖" />
      <van-tab title="饮食" />
      <van-tab title="用药" />
    </van-tabs>
    <van-cell-group inset style="margin-top: 12px;">
      <van-cell v-for="r in records" :key="r.id" :title="r.title" :label="r.time">
        <template #value>
          <span v-if="r.value" :style="{ color: r.color, fontWeight: 700 }">{{ r.value }}</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref(0)
const records = ref([
  { id: 1, title: '午餐后血糖', time: '今天 12:30', value: '8.5', color: '#FFB020' },
  { id: 2, title: '午餐 · 米饭+青菜', time: '今天 12:00 · 碳水 65g', value: '', color: '' },
  { id: 3, title: '诺和锐 · 8U', time: '今天 11:55', value: '', color: '' },
  { id: 4, title: '午餐前血糖', time: '今天 11:50', value: '5.8', color: '#1AAD6E' },
  { id: 5, title: '空腹血糖', time: '今天 07:00', value: '5.2', color: '#1AAD6E' },
  { id: 6, title: '睡前血糖', time: '昨天 22:00', value: '6.8', color: '#1AAD6E' },
])
</script>
