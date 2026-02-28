<template>
  <div class="home-page">
    <div class="home-header">
      <div class="greeting">
        <p class="greeting-text">早上好，糖友小明</p>
        <p class="greeting-meta">1型糖尿病 · 已管理 328 天</p>
      </div>
    </div>

    <div class="quick-actions">
      <div class="action-item" @click="$router.push('/record/blood-sugar')">
        <span class="action-icon">🩸</span>
        <span class="action-label">记录血糖</span>
      </div>
      <div class="action-item" @click="$router.push('/record/diet')">
        <span class="action-icon">🍱</span>
        <span class="action-label">记录饮食</span>
      </div>
      <div class="action-item" @click="$router.push('/record/medication')">
        <span class="action-icon">💊</span>
        <span class="action-label">记录用药</span>
      </div>
    </div>

    <van-cell-group inset title="今日概览" style="margin-top: 12px;">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value" style="color: #1AAD6E;">6.2</span>
          <span class="stat-label">平均血糖(mmol/L)</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">5</span>
          <span class="stat-label">今日记录</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" style="color: #1AAD6E;">80%</span>
          <span class="stat-label">达标率</span>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group inset title="最近记录" style="margin-top: 12px;">
      <van-cell v-for="item in recentRecords" :key="item.id" :title="item.title" :label="item.time" is-link>
        <template #value>
          <span v-if="item.value" :style="{ color: item.color, fontWeight: 700, fontSize: '16px' }">{{ item.value }}</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const recentRecords = ref([
  { id: 1, title: '午餐后血糖', time: '12:30', value: '8.5', color: '#FFB020' },
  { id: 2, title: '午餐 · 米饭+青菜+鸡胸肉', time: '12:00 · 碳水 65g', value: '', color: '' },
  { id: 3, title: '诺和锐 · 8U · 腹部', time: '11:55', value: '', color: '' },
  { id: 4, title: '午餐前血糖', time: '11:50', value: '5.8', color: '#1AAD6E' },
  { id: 5, title: '空腹血糖', time: '07:00', value: '5.2', color: '#1AAD6E' },
])
</script>

<style scoped>
.home-header {
  background: #1AAD6E;
  padding: 16px;
  color: #fff;
}
.greeting-text { font-size: 15px; }
.greeting-meta { font-size: 12px; opacity: 0.8; margin-top: 2px; }
.quick-actions {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  margin-top: -8px;
}
.action-item {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.action-icon { font-size: 28px; display: block; }
.action-label { font-size: 12px; color: #646566; margin-top: 4px; display: block; }
.stats-grid { display: flex; padding: 12px 0; }
.stat-item { flex: 1; text-align: center; }
.stat-item + .stat-item { border-left: 1px solid #ebedf0; }
.stat-value { font-size: 22px; font-weight: 700; display: block; }
.stat-label { font-size: 11px; color: #969799; margin-top: 2px; display: block; }
</style>
