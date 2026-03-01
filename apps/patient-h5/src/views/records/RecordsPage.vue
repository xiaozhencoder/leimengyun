<template>
  <div class="records-page">
    <van-nav-bar title="健康记录" />
    <van-tabs v-model:active="activeTab" @change="loadRecords">
      <van-tab title="血糖" />
      <van-tab title="饮食" />
      <van-tab title="用药" />
    </van-tabs>
    <van-pull-refresh v-model="refreshing" @refresh="loadRecords">
      <!-- 血糖 tab: 7/30天趋势图 -->
      <template v-if="activeTab === 0">
        <van-cell-group inset style="margin-top: 12px">
          <div class="trend-header">
            <span class="trend-title">血糖趋势</span>
            <van-button
              size="small"
              :type="trendDays === 7 ? 'primary' : 'default'"
              @click="trendDays = 7"
            >
              7天
            </van-button>
            <van-button
              size="small"
              :type="trendDays === 30 ? 'primary' : 'default'"
              @click="trendDays = 30"
            >
              30天
            </van-button>
          </div>
          <BloodSugarChart
            :data="trendChartData"
            mode="trend"
            :show-normal-range="true"
            height="180px"
          />
        </van-cell-group>
      </template>

      <template v-if="records.length">
        <van-cell-group
          inset
          v-for="group in dateGroups"
          :key="group.date"
          :title="group.dateLabel"
          class="date-group"
        >
          <van-cell v-for="r in group.items" :key="r.id" :title="r.title" :label="r.time">
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
import { ref, computed, onMounted, watch } from 'vue'
import { getBloodSugars, getDiets, getMedications } from '@/api/health'
import { MEASURE_TIME_LABELS, MEAL_TYPE_LABELS } from '@leimengyun/shared'
import BloodSugarChart from '@/components/BloodSugarChart.vue'

const activeTab = ref(0)
const refreshing = ref(false)
const records = ref<any[]>([])
const rawBloodSugars = ref<any[]>([])
const trendDays = ref<7 | 30>(7)

const trendChartData = computed(() => {
  const byDate: Record<string, number[]> = {}
  for (const r of rawBloodSugars.value) {
    const d = (r.recordedAt as string).slice(0, 10)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(r.value)
  }
  return Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length
      return {
        recordedAt: date + 'T12:00:00',
        value: Math.round(avg * 10) / 10,
      }
    })
})

const dateGroups = computed(() => {
  const groups: Record<string, { date: string; dateLabel: string; items: any[] }> = {}
  for (const r of records.value) {
    const date = r.dateKey || ''
    if (!date) continue
    if (!groups[date]) {
      const d = new Date(date)
      groups[date] = {
        date,
        dateLabel: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
        items: [],
      }
    }
    groups[date].items.push(r)
  }
  return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date))
})

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
      rawBloodSugars.value = (await getBloodSugars(trendDays.value)) as any[]
      records.value = data.map((r) => ({
        id: r.id,
        dateKey: r.recordedAt.slice(0, 10),
        title: (MEASURE_TIME_LABELS[r.measureTime] || r.measureTime) + '血糖',
        time: formatTimeOnly(r.recordedAt),
        value: r.value.toString(),
        color: getBsColor(r.value),
      }))
    } else if (activeTab.value === 1) {
      const data = (await getDiets(30)) as any[]
      rawBloodSugars.value = []
      records.value = data.map((r) => ({
        id: r.id,
        dateKey: r.recordedAt.slice(0, 10),
        title: (MEAL_TYPE_LABELS[r.mealType] || r.mealType) + ' · 碳水 ' + r.totalCarbs + 'g',
        time: formatTimeOnly(r.recordedAt),
        value: '',
        color: '',
      }))
    } else {
      const data = (await getMedications(30)) as any[]
      rawBloodSugars.value = []
      records.value = data.map((r) => ({
        id: r.id,
        dateKey: r.recordedAt.slice(0, 10),
        title: r.medName + ' · ' + r.dosage + r.dosageUnit,
        time: formatTimeOnly(r.recordedAt),
        value: '',
        color: '',
      }))
    }
  } catch {
    records.value = []
    rawBloodSugars.value = []
  } finally {
    refreshing.value = false
  }
}

function formatTimeOnly(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

watch(trendDays, () => {
  if (activeTab.value === 0) {
    getBloodSugars(trendDays.value).then((data) => {
      rawBloodSugars.value = (data as any[]) || []
    })
  }
})

onMounted(loadRecords)
</script>

<style scoped>
.trend-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}
.trend-title {
  font-size: 14px;
  font-weight: 600;
  margin-right: auto;
}
.date-group {
  margin-top: 12px;
}
</style>
