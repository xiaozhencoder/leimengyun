<template>
  <div class="patients-page">
    <van-nav-bar title="我的患者" />
    <van-search v-model="search" placeholder="搜索患者姓名" />

    <van-cell-group v-if="pendingBinds.length" inset title="待审核" style="margin-top: 12px">
      <van-cell v-for="b in pendingBinds" :key="b.bindId" :title="b.nickname" :label="formatDiabetes(b.diabetesType)">
        <template #right-icon>
          <div style="display: flex; gap: 8px;">
            <van-button size="small" type="primary" :loading="approvingId === b.bindId" @click.stop="handleApprove(b.bindId)">通过</van-button>
            <van-button size="small" plain :loading="rejectingId === b.bindId" @click.stop="handleReject(b.bindId)">拒绝</van-button>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset title="全部患者" style="margin-top: 12px">
      <van-pull-refresh v-model="refreshing" @refresh="loadData">
        <van-empty v-if="!patients.length && !loading" description="暂无患者" />
        <van-cell v-for="p in filteredPatients" :key="p.bindId" :title="p.nickname"
          :label="`${formatDiabetes(p.diabetesType)} · ${formatTreatment(p.treatmentPlan)} · ${p.todayCount}次记录`"
          is-link @click="$router.push('/patient/' + p.patientUserId)">
          <template #value>
            <span v-if="p.todayAvg" :style="{ color: getBsColor(p.todayAvg), fontWeight: 700 }">{{ p.todayAvg }}</span>
            <span v-else style="color: #969799">--</span>
          </template>
        </van-cell>
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

function formatDiabetes(t: string) { return DIABETES_TYPE_LABELS[t] || t }
function formatTreatment(t: string) { return TREATMENT_PLAN_LABELS[t] || t }
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
