<template>
  <div class="records-page page-with-tabbar">
    <van-nav-bar title="健康记录" />

    <van-tabs v-model:active="activeTab" sticky swipeable @change="onTabChange">
      <van-tab title="全部" name="all" />
      <van-tab title="血糖" name="bloodSugar" />
      <van-tab title="饮食" name="diet" />
      <van-tab title="用药" name="medication" />
    </van-tabs>

    <div class="records-list">
      <van-empty v-if="records.length === 0" description="暂无记录" />

      <template v-for="group in groupedRecords" :key="group.date">
        <div class="date-header">{{ group.date }}</div>
        <van-cell
          v-for="record in group.items"
          :key="record.id"
          :title="record.title"
          :value="record.value"
          :label="record.time"
          :icon="record.icon"
        />
      </template>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TabBar from '@/components/TabBar.vue'
import { getBloodSugars, getDiets, getMedications } from '@/api/health'

const activeTab = ref('all')

interface RecordItem {
  id: string
  type: string
  title: string
  value: string
  time: string
  date: string
  icon: string
}

const records = ref<RecordItem[]>([])

const groupedRecords = computed(() => {
  const groups: { date: string; items: RecordItem[] }[] = []
  const map = new Map<string, RecordItem[]>()

  for (const r of records.value) {
    const list = map.get(r.date) || []
    list.push(r)
    map.set(r.date, list)
  }

  for (const [date, items] of map) {
    groups.push({ date, items })
  }
  return groups
})

async function loadRecords() {
  records.value = []
  try {
    if (activeTab.value === 'all' || activeTab.value === 'bloodSugar') {
      const res = await getBloodSugars({ limit: 20 })
      const items = (res.data.items || []).map((r: { id: string; value: number; measureTime: string; recordedAt: string }) => ({
        id: r.id,
        type: 'bloodSugar',
        title: `血糖 ${r.value} mmol/L`,
        value: r.measureTime,
        time: new Date(r.recordedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(r.recordedAt).toLocaleDateString('zh-CN'),
        icon: '🩸',
      }))
      records.value.push(...items)
    }
    if (activeTab.value === 'all' || activeTab.value === 'diet') {
      const res = await getDiets({ limit: 20 })
      const items = (res.data.items || []).map((r: { id: string; mealType: string; totalCarbs: number; recordedAt: string }) => ({
        id: r.id,
        type: 'diet',
        title: `饮食 ${r.mealType}`,
        value: `${r.totalCarbs}g碳水`,
        time: new Date(r.recordedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(r.recordedAt).toLocaleDateString('zh-CN'),
        icon: '🍚',
      }))
      records.value.push(...items)
    }
    if (activeTab.value === 'all' || activeTab.value === 'medication') {
      const res = await getMedications({ limit: 20 })
      const items = (res.data.items || []).map((r: { id: string; medName: string; dosage: number; dosageUnit: string; recordedAt: string }) => ({
        id: r.id,
        type: 'medication',
        title: `用药 ${r.medName}`,
        value: `${r.dosage}${r.dosageUnit}`,
        time: new Date(r.recordedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(r.recordedAt).toLocaleDateString('zh-CN'),
        icon: '💊',
      }))
      records.value.push(...items)
    }
  } catch {
    /* use empty records */
  }
}

function onTabChange() {
  loadRecords()
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.records-page {
  min-height: 100vh;
  background: var(--bg);
}

.date-header {
  padding: 12px 16px 4px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.records-list {
  padding-bottom: 16px;
}
</style>
