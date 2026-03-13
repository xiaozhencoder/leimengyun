<template>
  <div class="report-page">
    <van-nav-bar title="健康报告" left-arrow @click-left="$router.back()" />
    <div class="report-period">
      <van-tabs v-model:active="activePeriod" @change="loadReport">
        <van-tab title="近7天" name="7" />
        <van-tab title="近30天" name="30" />
      </van-tabs>
    </div>
    <van-loading v-if="loading" class="report-loading" />
    <template v-else>
      <div class="card">
        <div class="card-title">血糖概览</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ report.bsCount }}</span>
            <span class="stat-label">记录次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" :style="{ color: '#1AAD6E' }">{{ report.bsAvg || '--' }}</span>
            <span class="stat-label">平均血糖</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" :style="{ color: report.inRangeRate >= 70 ? '#1AAD6E' : '#FFB020' }">{{ report.bsCount > 0 ? report.inRangeRate + '%' : '--' }}</span>
            <span class="stat-label">达标率</span>
          </div>
        </div>
        <div class="report-row">
          <span>最高血糖</span>
          <span class="report-val" style="color: #FF4D4F">{{ report.bsMax || '--' }} mmol/L</span>
        </div>
        <div class="report-row">
          <span>最低血糖</span>
          <span class="report-val" style="color: #3B82F6">{{ report.bsMin || '--' }} mmol/L</span>
        </div>
      </div>
      <div class="card">
        <div class="card-title">血糖趋势</div>
        <BloodSugarChart :data="bsData" mode="trend" :days="Number(activePeriod)" height="200px" />
      </div>
      <div class="card">
        <div class="card-title">饮食统计</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ report.dietCount }}</span>
            <span class="stat-label">记录次数</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" style="color: #1AAD6E">{{ report.avgCarbs || '--' }}</span>
            <span class="stat-label">日均碳水(g)</span>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">用药统计</div>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">{{ report.medCount }}</span>
            <span class="stat-label">记录次数</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getBloodSugars, getMergedRecords } from '@/api/health'
import BloodSugarChart from '@/components/BloodSugarChart.vue'

const activePeriod = ref('7')
const loading = ref(true)
const bsData = ref<{ recordedAt: string; value: number }[]>([])
const report = ref({
  bsCount: 0,
  bsAvg: '',
  bsMax: '',
  bsMin: '',
  inRangeRate: 0,
  dietCount: 0,
  avgCarbs: '',
  medCount: 0,
})

async function loadReport() {
  loading.value = true
  try {
    const days = Number(activePeriod.value)
    const records = (await getMergedRecords(days, 1, 1000)) as any
    const list = records?.list || []
    const bsList = list.filter((r: any) => r.type === 'blood_sugar')
    const dietList = list.filter((r: any) => r.type === 'diet')
    const medList = list.filter((r: any) => r.type === 'medication')

    const bsValues = bsList.map((r: any) => r.raw?.value ?? 0).filter((v: number) => v > 0)
    const bsCount = bsValues.length
    const bsAvg = bsCount > 0 ? (bsValues.reduce((s: number, v: number) => s + v, 0) / bsCount).toFixed(1) : ''
    const bsMax = bsCount > 0 ? Math.max(...bsValues).toFixed(1) : ''
    const bsMin = bsCount > 0 ? Math.min(...bsValues).toFixed(1) : ''
    const inRange = bsValues.filter((v: number) => v >= 3.9 && v <= 10.0).length
    const inRangeRate = bsCount > 0 ? Math.round((inRange / bsCount) * 100) : 0

    const totalCarbs = dietList.reduce((s: number, r: any) => s + (r.raw?.totalCarbs || 0), 0)
    const avgCarbs = dietList.length > 0 ? Math.round(totalCarbs / Math.min(days, dietList.length)) : ''

    report.value = { bsCount, bsAvg, bsMax, bsMin, inRangeRate, dietCount: dietList.length, avgCarbs: String(avgCarbs), medCount: medList.length }

    const bsRecords = (await getBloodSugars(days)) as unknown as any[]
    bsData.value = (bsRecords || []).map((r: any) => ({ recordedAt: r.recordedAt, value: r.value }))
  } catch {
    /* ignore */
  } finally {
    loading.value = false
  }
}

onMounted(loadReport)
</script>

<style scoped>
.report-loading { display: flex; justify-content: center; padding: 60px; }
.card { background: #fff; border-radius: 12px; padding: 16px; margin: 12px 16px; }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.stats-grid { display: flex; }
.stat-item { flex: 1; text-align: center; padding: 8px 0; }
.stat-item + .stat-item { border-left: 1px solid #ebedf0; }
.stat-value { font-size: 22px; font-weight: 700; display: block; }
.stat-label { font-size: 11px; color: #969799; margin-top: 2px; display: block; }
.report-row { display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid #ebedf0; font-size: 14px; color: #646566; }
.report-val { font-weight: 600; }
</style>
