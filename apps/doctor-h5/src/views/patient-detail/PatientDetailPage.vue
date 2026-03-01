<template>
  <div class="detail-page">
    <van-nav-bar title="患者详情" left-arrow @click-left="$router.back()" />
    <div v-if="data" class="detail-content">
      <div class="detail-header">
        <div class="detail-avatar">{{ data.profile?.nickname?.[0] || '?' }}</div>
        <div class="detail-info">
          <h3>{{ data.profile?.nickname }}</h3>
          <p>{{ data.profile?.gender === 'MALE' ? '男' : '女' }} · {{ formatDiabetes(data.profile?.diabetesType) }} · {{ formatTreatment(data.profile?.treatmentPlan) }}</p>
        </div>
      </div>

      <van-cell-group inset title="血糖趋势" style="margin-top: 12px">
        <div class="trend-header">
          <van-button
            size="small"
            :type="chartDays === 7 ? 'primary' : 'default'"
            @click="chartDays = 7; loadChartData()"
          >
            7天
          </van-button>
          <van-button
            size="small"
            :type="chartDays === 30 ? 'primary' : 'default'"
            @click="chartDays = 30; loadChartData()"
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

      <van-cell-group inset title="今日数据">
        <div class="stats-grid">
          <div class="stat-item"><span class="stat-value" :style="{ color: data.summary.average ? '#1AAD6E' : '#969799' }">{{ data.summary.average || '--' }}</span><span class="stat-label">平均血糖</span></div>
          <div class="stat-item"><span class="stat-value">{{ data.summary.count }}</span><span class="stat-label">记录次数</span></div>
          <div class="stat-item"><span class="stat-value" :style="{ color: data.summary.inRangeRate >= 70 ? '#1AAD6E' : '#FFB020' }">{{ data.summary.count ? data.summary.inRangeRate + '%' : '--' }}</span><span class="stat-label">达标率</span></div>
        </div>
      </van-cell-group>

      <van-cell-group inset title="血糖记录" style="margin-top: 12px">
        <van-empty v-if="!data.bloodSugars.length" description="暂无记录" />
        <van-cell v-for="r in data.bloodSugars.slice(0, 10)" :key="r.id" :title="formatMeasureTime(r.measureTime)" :label="formatDateTime(r.recordedAt)">
          <template #value><span :style="{ color: getBsColor(r.value), fontWeight: 700 }">{{ r.value }}</span></template>
        </van-cell>
      </van-cell-group>

      <van-cell-group inset title="饮食记录" style="margin-top: 12px">
        <van-empty v-if="!data.diets.length" description="暂无记录" />
        <van-cell v-for="r in data.diets.slice(0, 5)" :key="r.id" :title="formatMealType(r.mealType) + ' · 碳水 ' + r.totalCarbs + 'g'" :label="formatDateTime(r.recordedAt)" />
      </van-cell-group>

      <van-cell-group inset title="用药记录" style="margin-top: 12px">
        <van-empty v-if="!data.medications.length" description="暂无记录" />
        <van-cell v-for="r in data.medications.slice(0, 5)" :key="r.id" :title="r.medName + ' · ' + r.dosage + r.dosageUnit" :label="formatDateTime(r.recordedAt)" />
      </van-cell-group>

      <div style="padding: 16px">
        <van-button round block type="primary" @click="goChat">发送消息给该患者</van-button>
      </div>
    </div>
    <van-loading v-else style="text-align: center; padding: 40px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPatientHealthData } from '@/api/patients'
import { getConversations } from '@/api/chat'
import { MEASURE_TIME_LABELS, MEAL_TYPE_LABELS, DIABETES_TYPE_LABELS, TREATMENT_PLAN_LABELS } from '@leimengyun/shared'
import BloodSugarChart from '@/components/BloodSugarChart.vue'

const route = useRoute()
const router = useRouter()
const patientUserId = route.params.id as string
const data = ref<any>(null)
const chartDays = ref<7 | 30>(7)
const chartBloodSugars = ref<{ recordedAt: string; value: number }[]>([])

const trendChartData = computed(() => {
  const byDate: Record<string, number[]> = {}
  for (const r of chartBloodSugars.value) {
    const d = r.recordedAt.slice(0, 10)
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(r.value)
  }
  return Object.entries(byDate)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, vals]) => ({
      recordedAt: date + 'T12:00:00',
      value: vals.reduce((a, b) => a + b, 0) / vals.length,
    }))
})

function formatDiabetes(t: string) { return DIABETES_TYPE_LABELS[t] || t }
function formatTreatment(t: string) { return TREATMENT_PLAN_LABELS[t] || t }
function formatMeasureTime(t: string) { return (MEASURE_TIME_LABELS[t] || t) + '血糖' }
function formatMealType(t: string) { return MEAL_TYPE_LABELS[t] || t }
function formatDateTime(s: string) {
  const d = new Date(s)
  return `${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}
function getBsColor(v: number) {
  if (v < 3.9) return '#3B82F6'
  if (v <= 7.8) return '#1AAD6E'
  if (v <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

async function goChat() {
  try {
    const convs = (await getConversations()) as any[]
    const conv = convs.find((c: any) => c.otherUserId === patientUserId)
    if (conv) router.push(`/chat/${conv.id}`)
    else router.push(`/messages`)
  } catch { router.push('/messages') }
}

async function loadChartData() {
  try {
    const res = (await getPatientHealthData(patientUserId, chartDays.value)) as any
    chartBloodSugars.value = (res.bloodSugars || []).map((r: any) => ({
      recordedAt: r.recordedAt,
      value: r.value,
    }))
  } catch {
    chartBloodSugars.value = []
  }
}

onMounted(async () => {
  try {
    data.value = await getPatientHealthData(patientUserId, chartDays.value)
    chartBloodSugars.value = (data.value?.bloodSugars || []).map((r: any) => ({
      recordedAt: r.recordedAt,
      value: r.value,
    }))
  } catch { /* handle error */ }
})
</script>

<style scoped>
.detail-header { background: #3B82F6; padding: 16px; display: flex; align-items: center; gap: 12px; color: #fff; }
.detail-avatar { width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600; }
.detail-info h3 { font-size: 18px; }
.detail-info p { font-size: 12px; opacity: 0.85; margin-top: 4px; }
.stats-grid { display: flex; padding: 12px 0; }
.stat-item { flex: 1; text-align: center; }
.stat-item + .stat-item { border-left: 1px solid #ebedf0; }
.stat-value { font-size: 22px; font-weight: 700; display: block; }
.stat-label { font-size: 11px; color: #969799; display: block; margin-top: 2px; }
.trend-header { display: flex; gap: 8px; padding: 8px 0; }
</style>
