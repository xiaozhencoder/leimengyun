<template>
  <div class="patients-page">
    <van-nav-bar title="我的患者" />
    <van-search v-model="search" placeholder="搜索患者姓名" />

    <van-cell-group inset title="概览" style="margin-top: 12px">
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{{ stats.totalPatients }}</span>
          <span class="stat-label">管理患者</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" :style="{ color: stats.todayAlerts > 0 ? '#FFB020' : '#969799' }">
            {{ stats.todayAlerts }}
          </span>
          <span class="stat-label">今日异常</span>
        </div>
        <div class="stat-item">
          <span class="stat-value" :style="{ color: stats.pending > 0 ? '#FF4D4F' : '#969799' }">
            {{ stats.pending }}
          </span>
          <span class="stat-label">待处理</span>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group v-if="abnormalPatients.length" inset title="血糖异常患者" style="margin-top: 12px">
      <div
        v-for="p in abnormalPatients"
        :key="p.bindId"
        class="patient-card"
        @click="$router.push('/patient/' + p.patientUserId)"
      >
        <div class="patient-avatar" :style="avatarStyle(p.nickname, p.todayAvg)">{{ p.nickname?.[0] || '?' }}</div>
        <div class="patient-info">
          <div class="patient-name">
            {{ p.nickname }}
            <span v-if="p.todayAvg != null" :class="['patient-alert', p.todayAvg < 3.9 ? 'patient-alert--low' : 'patient-alert--high']">
              {{ p.todayAvg < 3.9 ? '偏低' : '高血糖' }}
            </span>
          </div>
          <div class="patient-tags">
            <span class="patient-tag patient-tag--type">{{ formatDiabetes(p.diabetesType) }}</span>
            <span v-if="p.treatmentPlan" class="patient-tag patient-tag--plan">{{ formatTreatment(p.treatmentPlan) }}</span>
          </div>
          <div class="patient-stats">
            <span class="patient-stat">今日血糖: <strong :style="{ color: getBsColor(p.todayAvg) }">{{ p.todayAvg }}</strong> mmol/L</span>
            <span v-if="p.todayCount" class="patient-stat">{{ p.todayCount }}次记录</span>
          </div>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group v-if="pendingBinds.length" inset title="待审核" style="margin-top: 12px">
      <div v-for="b in pendingBinds" :key="b.bindId" class="patient-card patient-card--pending">
        <div class="patient-avatar patient-avatar--pending">{{ b.nickname?.[0] || '?' }}</div>
        <div class="patient-info">
          <div class="patient-name">{{ b.nickname }}</div>
          <div class="patient-desc">申请绑定 · {{ formatDiabetes(b.diabetesType) }}</div>
        </div>
        <div class="patient-actions">
          <van-button size="small" type="primary" :loading="approvingId === b.bindId" @click.stop="handleApprove(b.bindId)">通过</van-button>
          <van-button size="small" plain :loading="rejectingId === b.bindId" @click.stop="handleReject(b.bindId)">拒绝</van-button>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group inset title="全部患者" style="margin-top: 12px">
      <van-pull-refresh v-model="refreshing" @refresh="loadData">
        <van-empty v-if="!patients.length && !loading" description="暂无患者" />
        <div
          v-for="p in filteredPatients"
          :key="p.bindId"
          class="patient-card"
          @click="$router.push('/patient/' + p.patientUserId)"
        >
          <div class="patient-avatar" :style="avatarStyle(p.nickname, p.todayAvg)">{{ p.nickname?.[0] || '?' }}</div>
          <div class="patient-info">
            <div class="patient-name">{{ p.nickname }}</div>
            <div class="patient-tags">
              <span class="patient-tag patient-tag--type">{{ formatDiabetes(p.diabetesType) }}</span>
              <span v-if="p.treatmentPlan" class="patient-tag patient-tag--plan">{{ formatTreatment(p.treatmentPlan) }}</span>
            </div>
            <div class="patient-stats">
              <span class="patient-stat">今日: <strong v-if="p.todayAvg != null" :style="{ color: getBsColor(p.todayAvg) }">{{ p.todayAvg }}</strong><template v-else>--</template> 均值</span>
              <span v-if="p.todayCount != null" class="patient-stat">{{ p.todayCount }}次记录</span>
            </div>
          </div>
        </div>
      </van-pull-refresh>
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showSuccessToast, showFailToast } from 'vant'
import { getMyPatients, getPendingBinds, approveBind, rejectBind } from '@/api/patients'
import { DIABETES_TYPE_LABELS, TREATMENT_PLAN_LABELS } from '@leimengyun/shared'

const search = ref('')
const patients = ref<any[]>([])
const pendingBinds = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const approvingId = ref('')
const rejectingId = ref('')

const filteredPatients = computed(() => {
  if (!search.value) return patients.value
  return patients.value.filter((p: any) => p.nickname?.includes(search.value))
})

const stats = computed(() => ({
  totalPatients: patients.value.length,
  todayAlerts: abnormalPatients.value.length,
  pending: pendingBinds.value.length,
}))

const abnormalPatients = computed(() =>
  patients.value.filter((p: any) => {
    const v = p.todayAvg
    return v != null && (v < 3.9 || v > 10)
  })
)

function formatDiabetes(t: string) { return DIABETES_TYPE_LABELS[t] || t }
function formatTreatment(t: string) { return TREATMENT_PLAN_LABELS[t] || t }
function avatarStyle(nickname: string, todayAvg?: number) {
  const char = (nickname?.[0] || '?').charCodeAt(0) % 6
  const colors = [
    { bg: '#E8F8F0', color: '#1AAD6E' },
    { bg: '#FFF8E6', color: '#B8860B' },
    { bg: '#E8F0FE', color: '#3B82F6' },
    { bg: '#F0E8FE', color: '#8B5CF6' },
    { bg: '#FFF0F0', color: '#FF4D4F' },
    { bg: '#EBF5FF', color: '#1989FA' },
  ]
  const c = colors[char]
  if (todayAvg != null && todayAvg < 3.9) return { background: '#EBF5FF', color: '#1989FA' }
  if (todayAvg != null && todayAvg > 10) return { background: '#FFF0F0', color: '#FF4D4F' }
  return { background: c.bg, color: c.color }
}
function getBsColor(v: number) {
  if (v < 3.9) return '#3B82F6'
  if (v <= 7.8) return '#1AAD6E'
  if (v <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

async function loadData() {
  loading.value = true
  refreshing.value = true
  try {
    const [p, b] = await Promise.all([getMyPatients(), getPendingBinds()])
    patients.value = p as any[]
    pendingBinds.value = b as any[]
  } catch { /* ignore */ }
  finally { loading.value = false; refreshing.value = false }
}

async function handleApprove(bindId: string) {
  approvingId.value = bindId
  try {
    await approveBind(bindId)
    showSuccessToast('已通过')
    await loadData()
  } catch (err: any) { showFailToast(err.response?.data?.message || '操作失败') }
  finally { approvingId.value = '' }
}

async function handleReject(bindId: string) {
  rejectingId.value = bindId
  try {
    await rejectBind(bindId)
    showSuccessToast('已拒绝')
    await loadData()
  } catch { showFailToast('操作失败') }
  finally { rejectingId.value = '' }
}

onMounted(loadData)
</script>

<style scoped>
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
  display: block;
  margin-top: 2px;
}
.patient-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
  cursor: pointer;
}
.patient-card:active { background: #f9f9f9; }
.patient-card--pending { cursor: default; }
.patient-card--pending:active { background: #fff; }
.patient-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}
.patient-avatar--pending { background: #fff0f5; color: #e91e8c; }
.patient-info { flex: 1; margin-left: 12px; min-width: 0; }
.patient-name { font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.patient-alert { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; }
.patient-alert--low { background: #fff8e6; color: #b8860b; }
.patient-alert--high { background: #fff0f0; color: #ff4d4f; }
.patient-desc { font-size: 12px; color: #969799; margin-top: 2px; }
.patient-tags { display: flex; gap: 6px; margin-top: 4px; flex-wrap: wrap; }
.patient-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}
.patient-tag--type { background: #e8f0fe; color: #3b82f6; }
.patient-tag--plan { background: #e8f8f0; color: #1aad6e; }
.patient-stats { display: flex; gap: 12px; margin-top: 4px; flex-wrap: wrap; }
.patient-stat { font-size: 11px; color: #969799; }
.patient-stat strong { font-size: 13px; }
.patient-actions { display: flex; gap: 8px; flex-shrink: 0; margin-left: 8px; }
</style>
