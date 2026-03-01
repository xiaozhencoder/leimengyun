<template>
  <div class="records-page">
    <van-nav-bar title="健康记录" />
    <div class="filter-tabs">
      <span
        v-for="(tab, i) in filterTabs"
        :key="tab"
        :class="['filter-tab', { active: activeTab === i }]"
        @click="activeTab = i"
      >{{ tab }}</span>
    </div>
    <van-pull-refresh v-model="refreshing" @refresh="loadRecords">
      <div class="chart-card">
        <div class="chart-header">
          <span>血糖趋势</span>
          <div class="chart-toggle">
            <span
              :class="['filter-tab', { active: trendDays === 7 }]"
              @click="trendDays = 7; loadTrendData()"
            >7天</span>
            <span
              :class="['filter-tab', { active: trendDays === 30 }]"
              @click="trendDays = 30; loadTrendData()"
            >30天</span>
          </div>
        </div>
        <BloodSugarChart
          :data="trendChartData"
          mode="trend"
          :show-normal-range="true"
          height="180px"
        />
      </div>

      <template v-if="displayGroups.length">
        <template v-for="group in displayGroups" :key="group.date">
          <div class="date-group-header">{{ group.dateLabel }}</div>
          <div class="records-block">
            <div
              v-for="r in group.items"
              :key="r.id"
              class="record-item"
            >
              <div class="record-icon" :class="r.iconClass">{{ r.icon }}</div>
              <div class="record-content">
                <div class="record-title">{{ r.title }}</div>
                <div class="record-meta">{{ r.meta }}</div>
              </div>
              <div v-if="r.value != null" class="record-value" :style="{ color: r.color }">{{ r.value }}</div>
            </div>
          </div>
        </template>
      </template>
      <van-empty v-else description="暂无记录" />
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getBloodSugars, getDiets, getMedications, toLocalDateString } from '@/api/health'
import { MEASURE_TIME_LABELS, MEAL_TYPE_LABELS } from '@leimengyun/shared'
import BloodSugarChart from '@/components/BloodSugarChart.vue'

const filterTabs = ['全部', '血糖', '饮食', '用药']
const activeTab = ref(0)
const refreshing = ref(false)
const rawRecords = ref<{
  bs: any[]
  diet: any[]
  med: any[]
}>({ bs: [], diet: [], med: [] })
const rawBloodSugars = ref<any[]>([])
const trendDays = ref<7 | 30>(7)

const INJECTION_SITE_LABELS: Record<string, string> = {
  ABDOMEN: '腹部',
  THIGH: '大腿',
  ARM: '手臂',
  BUTTOCK: '臀部',
}

const trendChartData = computed(() => {
  const byDate: Record<string, number[]> = {}
  for (const r of rawBloodSugars.value) {
    const d = toLocalDateString(r.recordedAt)
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

interface RecordItem {
  id: string
  dateKey: string
  title: string
  meta: string
  value?: string
  color?: string
  icon: string
  iconClass: string
  recordedAt: string
  type: 'BS' | 'DIET' | 'MED'
}

const flatRecords = computed((): RecordItem[] => {
  const items: RecordItem[] = []
  for (const r of rawRecords.value.bs) {
    items.push({
      id: r.id,
      dateKey: toLocalDateString(r.recordedAt),
      title: (MEASURE_TIME_LABELS[r.measureTime] || r.measureTime) + '血糖',
      meta: formatTimeOnly(r.recordedAt),
      value: String(r.value),
      color: getBsColor(r.value),
      icon: '\u{1FA78}',
      iconClass: 'record-icon-bs',
      recordedAt: r.recordedAt,
      type: 'BS',
    })
  }
  for (const r of rawRecords.value.diet) {
    const meal = MEAL_TYPE_LABELS[r.mealType] || r.mealType
    const foodStr = Array.isArray(r.foodItems) && r.foodItems.length
      ? r.foodItems.map((f: any) => f.name || '').filter(Boolean).join('+')
      : ''
    items.push({
      id: r.id,
      dateKey: toLocalDateString(r.recordedAt),
      title: foodStr ? meal + '・' + foodStr : meal + '・碳水 ' + r.totalCarbs + 'g',
      meta: formatTimeOnly(r.recordedAt) + '・碳水 ' + r.totalCarbs + 'g',
      icon: '\u{1F371}',
      iconClass: 'record-icon-diet',
      recordedAt: r.recordedAt,
      type: 'DIET',
    })
  }
  for (const r of rawRecords.value.med) {
    const meta = r.injectionSite
      ? formatTimeOnly(r.recordedAt) + '・' + (INJECTION_SITE_LABELS[r.injectionSite] || r.injectionSite)
      : formatTimeOnly(r.recordedAt)
    items.push({
      id: 'med-' + r.id,
      dateKey: toLocalDateString(r.recordedAt),
      title: r.medName + '・' + r.dosage + r.dosageUnit,
      meta,
      icon: '\u{1F48A}',
      iconClass: 'record-icon-med',
      recordedAt: r.recordedAt,
      type: 'MED',
    })
  }
  return items.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
})

const filteredRecords = computed(() => {
  const tab = activeTab.value
  if (tab === 0) return flatRecords.value
  const type = tab === 1 ? 'BS' : tab === 2 ? 'DIET' : 'MED'
  return flatRecords.value.filter((r) => r.type === type)
})

function getLocalToday(): string {
  const now = new Date()
  return (
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0')
  )
}

function getLocalYesterday(): string {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return (
    y.getFullYear() +
    '-' +
    String(y.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(y.getDate()).padStart(2, '0')
  )
}

const displayGroups = computed(() => {
  const groups: Record<string, { date: string; dateLabel: string; items: RecordItem[] }> = {}
  const today = getLocalToday()
  const yesterdayStr = getLocalYesterday()
  for (const r of filteredRecords.value) {
    const date = r.dateKey
    if (!groups[date]) {
      const [y, m, d] = date.split('-').map(Number)
      const dObj = new Date(y, m - 1, d)
      let dateLabel = ''
      if (date === today) {
        dateLabel = '今天・' + m + '月' + d + '日'
      } else if (date === yesterdayStr) {
        dateLabel = '昨天・' + m + '月' + d + '日'
      } else {
        const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        dateLabel = m + '月' + d + '日・' + weekdays[dObj.getDay()]
      }
      groups[date] = { date, dateLabel, items: [] }
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

function formatTimeOnly(dateStr: string) {
  const d = new Date(dateStr)
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0')
}

async function loadRecords() {
  refreshing.value = true
  try {
    const [bsData, dietData, medData] = await Promise.all([
      getBloodSugars(30) as Promise<any[]>,
      getDiets(30) as Promise<any[]>,
      getMedications(30) as Promise<any[]>,
    ])
    rawRecords.value = {
      bs: bsData || [],
      diet: dietData || [],
      med: medData || [],
    }
    await loadTrendData()
  } catch {
    rawRecords.value = { bs: [], diet: [], med: [] }
    rawBloodSugars.value = []
  } finally {
    refreshing.value = false
  }
}

async function loadTrendData() {
  try {
    const data = (await getBloodSugars(trendDays.value)) as any[]
    rawBloodSugars.value = data || []
  } catch {
    rawBloodSugars.value = []
  }
}

onMounted(loadRecords)
</script>

<style scoped>
.filter-tabs {
  display: flex;
  padding: 10px 16px;
  gap: 8px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}
.filter-tab {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  background: #f7f8fa;
  color: #646566;
  transition: all 0.2s;
}
.filter-tab.active {
  background: #1aad6e;
  color: #fff;
}
.chart-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 16px;
}
.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}
.chart-toggle {
  display: flex;
  gap: 4px;
}
.chart-toggle .filter-tab {
  font-size: 11px;
  padding: 3px 10px;
}
.date-group-header {
  padding: 12px 16px 6px;
  font-size: 13px;
  color: #969799;
  font-weight: 500;
  background: #f7f8fa;
}
.records-block {
  padding: 0 16px;
  background: #fff;
}
.record-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #ebedf0;
}
.record-item:last-child {
  border-bottom: none;
}
.record-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 10px;
  flex-shrink: 0;
}
.record-icon-bs { background: #fff0f0; }
.record-icon-diet { background: #fff8e6; }
.record-icon-med { background: #e8f8f0; }
.record-content { flex: 1; min-width: 0; }
.record-title { font-size: 14px; font-weight: 500; color: #323233; }
.record-meta { font-size: 12px; color: #969799; margin-top: 2px; }
.record-value { font-size: 18px; font-weight: 700; flex-shrink: 0; margin-left: 8px; }
</style>
