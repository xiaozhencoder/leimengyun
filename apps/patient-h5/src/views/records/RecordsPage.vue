<template>
  <div class="records-page">
    <van-nav-bar title="健康记录" />
    <van-tabs v-model:active="activeTab" @change="loadRecords">
      <van-tab title="血糖" />
      <van-tab title="饮食" />
      <van-tab title="用药" />
    </van-tabs>
    <van-pull-refresh v-model="refreshing" @refresh="loadRecords">
      <template v-if="records.length">
        <van-cell-group inset style="margin-top: 12px">
          <van-cell v-for="r in records" :key="r.id" :title="r.title" :label="r.time">
            <template #value>
              <span v-if="r.value" :style="{ color: r.color, fontWeight: 700 }">{{ r.value }}</span>
            </template>
          </van-cell>
        </van-cell-group>
      </template>
      <van-empty v-else description="暂无记录" />
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getBloodSugars, getDiets, getMedications } from '@/api/health'
import { MEASURE_TIME_LABELS, MEAL_TYPE_LABELS } from '@leimengyun/shared'

const activeTab = ref(0)
const refreshing = ref(false)
const records = ref<any[]>([])

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  const mm = (d.getMonth() + 1).toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  const hh = d.getHours().toString().padStart(2, '0')
  const mi = d.getMinutes().toString().padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

function getBsColor(v: number) {
  if (v < 3.9) return '#3B82F6'
  if (v <= 7.8) return '#1AAD6E'
  if (v <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

async function loadRecords() {
  refreshing.value = true
  try {
    if (activeTab.value === 0) {
      const data = (await getBloodSugars(30)) as any[]
      records.value = data.map((r) => ({
        id: r.id,
        title: (MEASURE_TIME_LABELS[r.measureTime] || r.measureTime) + '血糖',
        time: formatDateTime(r.recordedAt),
        value: r.value.toString(),
        color: getBsColor(r.value),
      }))
    } else if (activeTab.value === 1) {
      const data = (await getDiets(30)) as any[]
      records.value = data.map((r) => ({
        id: r.id,
        title: (MEAL_TYPE_LABELS[r.mealType] || r.mealType) + ' · 碳水 ' + r.totalCarbs + 'g',
        time: formatDateTime(r.recordedAt),
        value: '',
        color: '',
      }))
    } else {
      const data = (await getMedications(30)) as any[]
      records.value = data.map((r) => ({
        id: r.id,
        title: r.medName + ' · ' + r.dosage + r.dosageUnit,
        time: formatDateTime(r.recordedAt),
        value: '',
        color: '',
      }))
    }
  } catch {
    records.value = []
  } finally {
    refreshing.value = false
  }
}

onMounted(loadRecords)
</script>
