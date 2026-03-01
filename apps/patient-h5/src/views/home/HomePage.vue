<template>
  <div class="home-page">
    <div class="home-header">
      <div class="greeting">
        <p class="greeting-text">{{ greetingText }}，{{ userStore.nickname }}</p>
        <p class="greeting-meta" v-if="userStore.profile">
          {{ diabetesLabel }} · {{ treatmentLabel }}
        </p>
      </div>
      <van-icon
        name="add-o"
        size="24"
        class="bind-doctor-btn"
        @click="$router.push('/bind-doctor')"
      />
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

    <van-cell-group inset title="今日血糖曲线" style="margin-top: 12px">
      <BloodSugarChart :data="todayBloodSugars" mode="today" show-normal-range height="200px" />
    </van-cell-group>

    <van-cell-group inset title="今日概览" style="margin-top: 12px">
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
    </van-cell-group>

    <van-cell-group inset title="最近记录" style="margin-top: 12px">
      <template v-if="recentMixedRecords.length">
        <van-cell
          v-for="item in recentMixedRecords"
          :key="item.id"
          :title="item.title"
          :label="formatTime(item.recordedAt)"
          is-link
          @click="$router.push('/records')"
        >
            <template #value>
            <span
              v-if="item.type === 'BS' && item.value != null"
              :style="{ color: getBsColor(item.value!), fontWeight: 700, fontSize: '16px' }"
            >
              {{ item.value }}
            </span>
          </template>
        </van-cell>
        <van-cell title="查看更多" is-link @click="$router.push('/records')" />
      </template>
      <van-empty v-else description="暂无记录，点击上方按钮开始记录" image="search" />
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getTodaySummary, getBloodSugars, getDiets, getMedications } from '@/api/health'
import BloodSugarChart from '@/components/BloodSugarChart.vue'
import {
  MEASURE_TIME_LABELS,
  MEAL_TYPE_LABELS,
  DIABETES_TYPE_LABELS,
  TREATMENT_PLAN_LABELS,
} from '@leimengyun/shared'

const userStore = useUserStore()

const summary = ref({ count: 0, average: 0, inRangeRate: 0, max: 0, min: 0 })
const recentMixedRecords = ref<Array<{
  id: string
  type: 'BS' | 'DIET' | 'MED'
  title: string
  recordedAt: string
  value?: number
}>>([])
const todayBloodSugars = ref<{ recordedAt: string; value: number }[]>([])

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

function getMeasureTimeLabel(key: string) {
  return MEASURE_TIME_LABELS[key] || key
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function getBsColor(value: number) {
  if (value < 3.9) return '#3B82F6'
  if (value <= 7.8) return '#1AAD6E'
  if (value <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

onMounted(async () => {
  try {
    const [s, bsToday, bsList, dietList, medList] = await Promise.all([
      getTodaySummary(),
      getBloodSugars(1),
      getBloodSugars(7),
      getDiets(7),
      getMedications(7),
    ])
    summary.value = s as any
    const bs = (bsList as any[]) || []
    todayBloodSugars.value = ((bsToday as any[]) || []).map((r) => ({ recordedAt: r.recordedAt, value: r.value }))

    const mixed: typeof recentMixedRecords.value = []
    for (const r of bs) {
      mixed.push({
        id: r.id,
        type: 'BS',
        title: (MEASURE_TIME_LABELS[r.measureTime] || r.measureTime) + '血糖',
        recordedAt: r.recordedAt,
        value: r.value,
      })
    }
    for (const r of (dietList as any[]) || []) {
      mixed.push({
        id: r.id,
        type: 'DIET',
        title: (MEAL_TYPE_LABELS[r.mealType] || r.mealType) + ' · 碳水 ' + r.totalCarbs + 'g',
        recordedAt: r.recordedAt,
      })
    }
    for (const r of (medList as any[]) || []) {
      mixed.push({
        id: 'med-' + r.id,
        type: 'MED',
        title: r.medName + ' · ' + r.dosage + r.dosageUnit,
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
.home-header {
  background: #1aad6e;
  padding: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bind-doctor-btn {
  color: #fff;
  padding: 4px;
}
.greeting-text {
  font-size: 15px;
}
.greeting-meta {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
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
</style>
