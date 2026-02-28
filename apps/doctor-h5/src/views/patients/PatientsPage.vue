<template>
  <div class="patients-page">
    <van-nav-bar title="我的患者" />
    <van-search v-model="search" placeholder="搜索患者姓名" />
    <van-cell-group inset>
      <div class="stats-grid">
        <div class="stat-item"><span class="stat-value" style="color:#3B82F6;">28</span><span class="stat-label">管理患者</span></div>
        <div class="stat-item"><span class="stat-value" style="color:#FFB020;">5</span><span class="stat-label">今日异常</span></div>
        <div class="stat-item"><span class="stat-value" style="color:#FF4D4F;">2</span><span class="stat-label">待处理</span></div>
      </div>
    </van-cell-group>
    <van-cell-group inset title="全部患者" style="margin-top:12px;">
      <van-cell v-for="p in patients" :key="p.id" :title="p.name" :label="p.info" is-link @click="$router.push('/patient/' + p.id)">
        <template #value>
          <span :style="{ color: p.color, fontWeight: 700 }">{{ p.avgBs }}</span>
        </template>
      </van-cell>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const search = ref('')
const patients = ref([
  { id: '1', name: '糖友小明', info: '1型 · CSII · 5次记录', avgBs: '6.2', color: '#1AAD6E' },
  { id: '2', name: '王大明', info: '1型 · CSII · 高血糖', avgBs: '15.2', color: '#FF4D4F' },
  { id: '3', name: '陈大伟', info: '2型 · 口服药 · 3次记录', avgBs: '7.0', color: '#1AAD6E' },
  { id: '4', name: '林小美', info: '妊娠期 · MDI · 4次记录', avgBs: '7.8', color: '#FFB020' },
  { id: '5', name: '刘强', info: '2型 · 生活方式 · 2次记录', avgBs: '5.9', color: '#1AAD6E' },
])
</script>

<style scoped>
.stats-grid { display: flex; padding: 12px 0; }
.stat-item { flex: 1; text-align: center; }
.stat-item + .stat-item { border-left: 1px solid #ebedf0; }
.stat-value { font-size: 22px; font-weight: 700; display: block; }
.stat-label { font-size: 11px; color: #969799; display: block; margin-top: 2px; }
</style>
