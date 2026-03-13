<template>
  <div class="home-page">
    <div class="home-header-bar">
      <span class="header-title">雷檬云</span>
      <van-icon name="add-o" size="24" class="header-add" @click="$router.push('/bind-doctor')" />
    </div>
    <div class="home-greeting">
      <p class="greeting-text">{{ greetingText }}，{{ userStore.nickname }}</p>
      <p class="greeting-meta" v-if="userStore.profile">
        {{ greetingMetaText }}
      </p>
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

    <div class="card overview-card">
      <div class="card-title-row">
        <span>今日概览</span>
        <span class="card-date">{{ todayDateLabel }}</span>
      </div>
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value" :style="{ color: summary.average > 0 ? '#1AAD6E' : '#969799' }">
            {{ summary.average || '--' }}
          </span>
          <span class="stat-label">平均血糖(mmol/L)</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ summary.count }}</span>
          <span class="stat-label">今日记录</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" :style="{ color: summary.inRangeRate >= 70 ? '#1AAD6E' : '#FFB020' }">
            {{ summary.count > 0 ? summary.inRangeRate + '%' : '--' }}
          </span>
          <span class="stat-label">达标率</span>
        </div>
      </div>
    </div>

    <div class="card chart-card">
      <div class="card-title-row">
        <span>今日血糖曲线</span>
        <span class="card-more link" @click="$router.push('/records')">查看全部 ›</span>
      </div>
      <BloodSugarChart :data="todayBloodSugars" mode="today" show-normal-range height="200px" />
    </div>

    <div class="card records-card">
      <div class="card-title-row">
        <span>最近记录</span>
        <span class="card-more link" @click="$router.push('/records')">更多 ›</span>
      </div>
      <template v-if="recentMixedRecords.length">
        <div
          v-for="item in recentMixedRecords"
          :key="item.id"
          class="record-item"
          @click="$router.push('/records')"
        >
          <div class="record-icon" :class="recordIconClass(item.type)">{{ recordIcon(item.type) }}</div>
          <div class="record-content">
            <div class="record-title">{{ item.title }}</div>
            <div class="record-meta">{{ item.meta }}</div>
          </div>
          <div v-if="item.type === 'BS' && item.value != null" class="record-value" :style="{ color: getBsColor(item.value!, item.measureTime) }">
            {{ item.value }}
          </div>
        </div>
      </template>
      <van-empty v-else description="暂无记录，点击上方按钮开始记录" image="default" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import {
  getTodaySummary,
  getBloodSugars,
  getDiets,
  getMedications,
  getLocalDayRange,
  toLocalDateString,
} from '@/api/health'
import BloodSugarChart from '@/components/BloodSugarChart.vue'
import {
  MEASURE_TIME_LABELS,
  MEAL_TYPE_LABELS,
  DIABETES_TYPE_LABELS,
  TREATMENT_PLAN_LABELS,
  isFastingMeasureTime,
} from '@leimengyun/shared'

interface RecentRecordItem {
  id: string
  type: 'BS' | 'DIET' | 'MED'
  title: string
  meta: string
  recordedAt: string
  value?: number
  measureTime?: string
}

const userStore = useUserStore()

const summary = ref({ count: 0, average: 0, inRangeRate: 0, max: 0, min: 0 })
const recentMixedRecords = ref<RecentRecordItem[]>([])
interface BsPoint { recordedAt: string; value: number }
const todayBloodSugars = ref<BsPoint[]>([])

const todayDateLabel = computed(() => {
  const d = new Date()
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const greetingText = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const diabetesLabel = computed(() =>
  userStore.profile ? DIABETES_TYPE_LABELS[userStore.profile.diabetesType] || '' : '',
)
const treatmentLabel = computed(() =>
  userStore.profile ? TREATMENT_PLAN_LABELS[userStore.profile.treatmentPlan] || '' : '',
)
const managedDays = computed(() => {
  const createdAt = userStore.profile?.createdAt
  if (!createdAt) return null
  const start = new Date(createdAt)
  const now = new Date()
  start.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
})
const greetingMetaText = computed(() => {
  if (!userStore.profile) return ''
  const d = diabetesLabel.value
  if (managedDays.value != null && managedDays.value >= 0) {
    return `${d} · 已管理 ${managedDays.value}天`
  }
  return `${d} · ${treatmentLabel.value}`
})

function getMeasureTimeLabel(key: string) {
  return MEASURE_TIME_LABELS[key] || key
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const SEP = '・'

function getDateLabel(dateStr: string): string {
  const dateKey = toLocalDateString(dateStr)
  const now = new Date()
  const today =
    now.getFullYear() +
    '-' +
    String(now.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(now.getDate()).padStart(2, '0')
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr =
    yesterday.getFullYear() +
    '-' +
    String(yesterday.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(yesterday.getDate()).padStart(2, '0')
  if (dateKey === today) return ''
  if (dateKey === yesterdayStr) return '昨天' + SEP
  const [, m, day] = dateKey.split('-').map(Number)
  return m + '月' + day + '日' + SEP
}

function formatRecordMeta(dateStr: string, extra?: string): string {
  const time = formatTime(dateStr)
  const dateLabel = getDateLabel(dateStr)
  if (extra) return dateLabel + time + SEP + extra
  return dateLabel + time
}

function recordIcon(type: 'BS' | 'DIET' | 'MED') {
  return type === 'BS' ? '🩸' : type === 'DIET' ? '🍱' : '💊'
}
function recordIconClass(type: 'BS' | 'DIET' | 'MED') {
  return type === 'BS' ? 'record-icon-bs' : type === 'DIET' ? 'record-icon-diet' : 'record-icon-med'
}
function getBsColor(value: number, measureTime?: string) {
  if (value < 3.9) return '#3B82F6'
  const fasting = measureTime ? isFastingMeasureTime(measureTime) : false
  if (fasting) {
    if (value <= 6.1) return '#1AAD6E'
    if (value <= 7.0) return '#FFB020'
    return '#FF4D4F'
  }
  if (value <= 7.8) return '#1AAD6E'
  if (value <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

onMounted(async () => {
  try {
    const { start, end } = getLocalDayRange()
    const [s, bsToday, bsList, dietList, medList] = await Promise.all([
      getTodaySummary({ start, end }),
      getBloodSugars(7, { start, end }),
      getBloodSugars(7),
      getDiets(7),
      getMedications(7),
    ])
    summary.value = s as any
    const bs = (bsList as unknown as any[]) || []
    todayBloodSugars.value = ((bsToday as unknown as any[]) || []).map((r) => ({ recordedAt: r.recordedAt, value: r.value }))

    const INJECTION_SITE_LABELS: Record<string, string> = {
      ABDOMEN: '腹部',
      THIGH: '大腿',
      ARM: '手臂',
      BUTTOCK: '臀部',
    }
    const mixed: RecentRecordItem[] = []
    for (const r of bs) {
      mixed.push({
        id: r.id,
        type: 'BS',
        title: (MEASURE_TIME_LABELS[r.measureTime] || r.measureTime) + '血糖',
        meta: formatRecordMeta(r.recordedAt),
        recordedAt: r.recordedAt,
        value: r.value,
        measureTime: r.measureTime,
      })
    }
    for (const r of (dietList as unknown as any[]) || []) {
      const meal = MEAL_TYPE_LABELS[r.mealType] || r.mealType
      const items = r.foodItems
      let foodStr = ''
      if (Array.isArray(items) && items.length) {
        foodStr = items.map((f: any) => f.name || '').filter(Boolean).join(' + ')
      }
      const titleSep = ' ' + SEP + ' '
      const title = foodStr ? meal + titleSep + foodStr : meal + titleSep + '碳水 ' + r.totalCarbs + 'g'
      const meta = formatRecordMeta(r.recordedAt, '碳水 ' + r.totalCarbs + 'g')
      mixed.push({
        id: r.id,
        type: 'DIET',
        title,
        meta,
        recordedAt: r.recordedAt,
      })
    }
    const titleSep = ' ' + SEP + ' '
    for (const r of (medList as unknown as any[]) || []) {
      const meta = r.injectionSite
        ? formatRecordMeta(r.recordedAt, INJECTION_SITE_LABELS[r.injectionSite] || r.injectionSite)
        : formatRecordMeta(r.recordedAt)
      mixed.push({
        id: 'med-' + r.id,
        type: 'MED',
        title: r.medName + titleSep + r.dosage + r.dosageUnit,
        meta,
        recordedAt: r.recordedAt,
      })
    }
    mixed.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    recentMixedRecords.value = mixed.slice(0, 10)
  } catch {
    // API not ready yet, show empty state
  }
})
</script>

<style scoped>
.home-header-bar {
  background: #1aad6e;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.header-title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
}
.header-add {
  position: absolute;
  right: 16px;
  color: #fff;
  padding: 4px;
}
.home-greeting {
  background: #1aad6e;
  padding: 16px;
  color: #fff;
}
.greeting-text {
  font-size: 14px;
  opacity: 0.9;
}
.greeting-meta {
  font-size: 13px;
  opacity: 0.75;
  margin-top: 2px;
}
.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin: 0 16px 12px;
}
.overview-card {
  margin-top: 12px;
}
.chart-card,
.records-card {
  margin-top: 12px;
}
.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 12px;
}
.card-date {
  font-size: 12px;
  color: #969799;
  font-weight: 500;
}
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.action-icon {
  font-size: 28px;
  display: block;
}
.action-label {
  font-size: 12px;
  color: #646566;
  margin-top: 4px;
  display: block;
}
.stats-grid {
  display: flex;
  padding: 12px 0;
}
.stat-item {
  flex: 1;
  text-align: center;
}
.stat-item + .stat-item {
  border-left: 1px solid #ebedf0;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  display: block;
}
.stat-label {
  font-size: 11px;
  color: #969799;
  margin-top: 2px;
  display: block;
}
.card-more {
  font-size: 12px;
  color: #969799;
}
.card-more.link {
  color: #1aad6e;
  cursor: pointer;
}
.records-card .record-item:last-of-type {
  border-bottom: none;
}
.record-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid #ebedf0;
  cursor: pointer;
}
.record-item:last-of-type {
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
.record-icon-bs { background: #FFF0F0; }
.record-icon-diet { background: #FFF8E6; }
.record-icon-med { background: #E8F8F0; }
.record-content { flex: 1; min-width: 0; }
.record-title { font-size: 14px; font-weight: 500; color: #323233; }
.record-meta { font-size: 12px; color: #969799; margin-top: 2px; }
.record-value { font-size: 18px; font-weight: 700; flex-shrink: 0; margin-left: 8px; }
</style>
