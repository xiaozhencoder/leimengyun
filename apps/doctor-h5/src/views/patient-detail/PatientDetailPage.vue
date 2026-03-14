<template>
  <div class="detail-page">
    <van-nav-bar title="患者详情" left-arrow @click-left="$router.back()" />
    <div v-if="data" class="detail-content">
      <div class="detail-header">
        <div class="detail-avatar">{{ data.profile?.nickname?.[0] || '?' }}</div>
        <div class="detail-info">
          <h3>{{ data.profile?.nickname }}</h3>
          <p>{{ formatDiabetes(data.profile?.diabetesType) }} · {{ formatTreatment(data.profile?.treatmentPlan) }}</p>
        </div>
      </div>

      <van-tabs v-model:active="activeTab" sticky>
        <van-tab title="血糖">
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
            <div v-else class="records-block">
              <div v-for="r in data.bloodSugars.slice(0, 10)" :key="r.id" class="record-item">
                <div class="record-icon record-icon-bs">🩸</div>
                <div class="record-content">
                  <div class="record-title">{{ formatMeasureTime(r.measureTime) }}</div>
                  <div class="record-meta">{{ formatTimeOnly(r.recordedAt) }}</div>
                </div>
                <div class="record-value" :style="{ color: getBsColor(r.value) }">{{ r.value }}</div>
              </div>
            </div>
          </van-cell-group>
        </van-tab>

        <van-tab title="饮食">
          <van-cell-group inset title="饮食记录" style="margin-top: 12px">
            <van-empty v-if="!data.diets.length" description="暂无记录" />
            <div v-else class="records-block">
              <div v-for="r in data.diets.slice(0, 10)" :key="r.id" class="record-item">
                <div class="record-icon record-icon-diet">🍱</div>
                <div class="record-content">
                  <div class="record-title">{{ formatDietTitle(r) }}</div>
                  <div class="record-meta">{{ formatTimeOnly(r.recordedAt) }}・碳水 {{ r.totalCarbs }}g</div>
                </div>
              </div>
            </div>
          </van-cell-group>
        </van-tab>

        <van-tab title="用药">
          <van-cell-group inset title="用药记录" style="margin-top: 12px">
            <van-empty v-if="!data.medications.length" description="暂无记录" />
            <div v-else class="records-block">
              <div v-for="r in data.medications.slice(0, 10)" :key="r.id" class="record-item">
                <div class="record-icon record-icon-med">💊</div>
                <div class="record-content">
                  <div class="record-title">{{ r.medName }}・{{ r.dosage }}{{ r.dosageUnit }}</div>
                  <div class="record-meta">{{ formatMedMeta(r) }}</div>
                </div>
              </div>
            </div>
          </van-cell-group>
        </van-tab>

        <van-tab title="问卷">
          <div v-if="questionnaireHistory" class="questionnaire-tab">
            <div v-if="questionnaireHistory.history.length > 0" class="assessment-overview">
              <div class="overview-title">📋 最近评估概览</div>
              <div v-for="item in latestByCategory" :key="item.category" class="overview-row">
                <span class="overview-name">{{ item.templateTitle }}</span>
                <span class="overview-score">{{ item.totalScore }}/{{ item.maxScore }}</span>
              </div>
            </div>

            <van-button round block type="primary" style="margin: 12px 0" @click="router.push(`/questionnaire/send?patientId=${patientUserId}`)">
              + 发送新问卷
            </van-button>

            <div class="section-label">问卷记录</div>
            <van-empty v-if="questionnaireHistory.history.length === 0" description="暂无问卷记录" />
            <div v-else class="qn-records">
              <div v-for="item in questionnaireHistory.history" :key="item.id" class="qn-record-item" @click="router.push(`/questionnaire/result/${item.id}`)">
                <div class="qn-record-title">{{ item.templateTitle }}</div>
                <div class="qn-record-info">
                  <span class="qn-record-score">{{ item.totalScore }}/{{ item.maxScore }}</span>
                  <span class="qn-record-date">{{ item.submittedAt?.slice(0,10) }}</span>
                </div>
              </div>
            </div>
          </div>
        </van-tab>
      </van-tabs>

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
import { getPatientHistory } from '@/api/questionnaire'
import { MEASURE_TIME_LABELS, MEAL_TYPE_LABELS, DIABETES_TYPE_LABELS, TREATMENT_PLAN_LABELS } from '@leimengyun/shared'
import BloodSugarChart from '@/components/BloodSugarChart.vue'

const route = useRoute()
const router = useRouter()
const patientUserId = route.params.id as string
const data = ref<any>(null)
const chartDays = ref<7 | 30>(7)
const chartBloodSugars = ref<{ recordedAt: string; value: number }[]>([])
const activeTab = ref(0)
const questionnaireHistory = ref<any>(null)

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

const latestByCategory = computed(() => {
  if (!questionnaireHistory.value?.history) return []
  const seen = new Set<string>()
  const result: any[] = []
  for (const item of questionnaireHistory.value.history) {
    if (!seen.has(item.category)) {
      seen.add(item.category)
      result.push(item)
    }
  }
  return result
})

const INJECTION_SITE_LABELS: Record<string, string> = {
  ABDOMEN: '腹部',
  THIGH: '大腿',
  ARM: '手臂',
  BUTTOCK: '臀部',
}

function formatDiabetes(t: string) { return DIABETES_TYPE_LABELS[t] || t }
function formatTreatment(t: string) { return TREATMENT_PLAN_LABELS[t] || t }
function formatMeasureTime(t: string) { return (MEASURE_TIME_LABELS[t] || t) + '血糖' }
function formatMealType(t: string) { return MEAL_TYPE_LABELS[t] || t }
function formatTimeOnly(s: string) {
  const d = new Date(s)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
function formatDietTitle(r: any) {
  const meal = formatMealType(r.mealType)
  const foodStr = Array.isArray(r.foodItems) && r.foodItems.length
    ? r.foodItems.map((f: any) => f.name || '').filter(Boolean).join('+')
    : ''
  return foodStr ? meal + '・' + foodStr : meal + '・碳水 ' + r.totalCarbs + 'g'
}
function formatMedMeta(r: any) {
  const time = formatTimeOnly(r.recordedAt)
  return r.injectionSite ? time + '・' + (INJECTION_SITE_LABELS[r.injectionSite] || r.injectionSite) : time
}
function getBsColor(v: number) {
  if (v < 3.9) return '#3B82F6'
  if (v <= 7.8) return '#1AAD6E'
  if (v <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

async function goChat() {
  try {
    const convs = (await getConversations()) as unknown as any[]
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

  try {
    questionnaireHistory.value = await getPatientHistory(patientUserId)
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

.records-block { padding: 0 16px; background: #fff; }
.record-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #ebedf0;
}
.record-item:last-child { border-bottom: none; }
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

.questionnaire-tab { padding: 12px; }
.assessment-overview { background: linear-gradient(135deg, #EFF6FF, #E0F2FE); border-radius: 12px; padding: 14px; margin-bottom: 12px; }
.overview-title { font-size: 14px; font-weight: 600; color: #3B82F6; margin-bottom: 10px; }
.overview-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
.overview-score { font-weight: 600; color: #1AAD6E; }

.section-label { font-size: 14px; font-weight: 600; color: #333; padding: 8px 0; }

.qn-records { }
.qn-record-item {
  background: #fff;
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  cursor: pointer;
}
.qn-record-title { font-size: 14px; font-weight: 600; color: #333; }
.qn-record-info { display: flex; justify-content: space-between; margin-top: 6px; font-size: 13px; }
.qn-record-score { color: #1AAD6E; font-weight: 600; }
.qn-record-date { color: #999; }
</style>
