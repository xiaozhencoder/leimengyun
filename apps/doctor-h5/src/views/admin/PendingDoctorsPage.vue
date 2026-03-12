<template>
  <div class="pending-doctors-page">
    <van-nav-bar title="审核医生" left-arrow @click-left="$router.push('/profile')">
      <template #right>
        <span class="nav-logout" @click="handleLogout">退出</span>
      </template>
    </van-nav-bar>
    <van-pull-refresh v-model="refreshing" @refresh="loadList">
      <van-list v-if="list.length" finished-text="没有更多了">
        <div v-for="item in list" :key="item.userId" class="doctor-card">
          <div class="doctor-main">
            <div class="doctor-name">{{ item.realName }}</div>
            <div class="doctor-meta">{{ item.hospital }} · {{ item.department }}</div>
            <div class="doctor-extra">职称：{{ titleLabel(item.title) }} · 执业编号：{{ item.licenseNo }}</div>
            <div class="doctor-phone">手机：{{ item.user?.phone || '—' }}</div>
          </div>
          <div class="doctor-actions">
            <van-button size="small" type="primary" :loading="item._approving" @click="handleApprove(item)">
              通过
            </van-button>
            <van-button size="small" plain type="danger" :loading="item._rejecting" @click="showRejectDialog(item)">
              拒绝
            </van-button>
          </div>
        </div>
      </van-list>
      <van-empty v-else-if="!loading" description="暂无待审核医生" />
    </van-pull-refresh>

    <van-dialog
      v-model:show="rejectShow"
      title="拒绝原因（选填）"
      show-cancel-button
      :before-close="onRejectBeforeClose"
    >
      <van-field
        v-model="rejectReason"
        type="textarea"
        placeholder="请输入拒绝原因，将展示给医生"
        rows="3"
        maxlength="200"
        show-word-limit
        style="margin: 12px 16px;"
      />
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { getPendingDoctors, approveDoctor, rejectDoctor } from '@/api/admin'

const router = useRouter()
const userStore = useUserStore()
function handleLogout() {
  userStore.logout()
  router.replace('/login')
}
import type { PendingDoctorItem } from '@/api/admin'

const TITLE_LABELS: Record<string, string> = {
  CHIEF: '主任医师',
  ASSOCIATE_CHIEF: '副主任医师',
  ATTENDING: '主治医师',
  RESIDENT: '住院医师',
}

function titleLabel(title: string) {
  return TITLE_LABELS[title] || title
}

const list = ref<(PendingDoctorItem & { _approving?: boolean; _rejecting?: boolean })[]>([])
const loading = ref(true)
const refreshing = ref(false)
const rejectShow = ref(false)
const rejectReason = ref('')
const rejectTarget = ref<(PendingDoctorItem & { _rejecting?: boolean }) | null>(null)

async function loadList() {
  if (!refreshing.value) loading.value = true
  try {
    const res = await getPendingDoctors(1, 50)
    list.value = (res.list || []).map((d) => ({ ...d, _approving: false, _rejecting: false }))
  } catch (e: any) {
    showFailToast(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

async function handleApprove(item: PendingDoctorItem & { _approving?: boolean }) {
  item._approving = true
  try {
    await approveDoctor(item.userId)
    showSuccessToast('已通过')
    list.value = list.value.filter((d) => d.userId !== item.userId)
  } catch (e: any) {
    showFailToast(e.response?.data?.message || '操作失败')
  } finally {
    item._approving = false
  }
}

function showRejectDialog(item: PendingDoctorItem & { _rejecting?: boolean }) {
  rejectTarget.value = item
  rejectReason.value = ''
  rejectShow.value = true
}

function onRejectBeforeClose(action: string) {
  if (action !== 'confirm' || !rejectTarget.value) return Promise.resolve(true)
  const item = rejectTarget.value
  item._rejecting = true
  return rejectDoctor(item.userId, rejectReason.value.trim() || undefined)
    .then(() => {
      showSuccessToast('已拒绝')
      list.value = list.value.filter((d) => d.userId !== item.userId)
      rejectTarget.value = null
      return true
    })
    .catch((e: any) => {
      showFailToast(e.response?.data?.message || '操作失败')
      return false
    })
    .finally(() => {
      item._rejecting = false
    })
}

onMounted(loadList)
</script>

<style scoped>
.pending-doctors-page { min-height: 100vh; background: #f7f8fa; padding-bottom: 20px; }
.doctor-card {
  margin: 12px 16px;
  padding: 14px;
  background: #fff;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}
.doctor-main { flex: 1; min-width: 0; }
.doctor-name { font-size: 16px; font-weight: 600; color: #323233; }
.doctor-meta { font-size: 13px; color: #646566; margin-top: 4px; }
.doctor-extra { font-size: 12px; color: #969799; margin-top: 4px; }
.doctor-phone { font-size: 12px; color: #969799; margin-top: 2px; }
.doctor-actions { display: flex; flex-direction: column; gap: 8px; }
.nav-logout { font-size: 14px; color: #fff; }
</style>
