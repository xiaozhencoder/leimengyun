<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="profile-avatar">{{ userStore.nickname?.[0] || '?' }}</div>
      <div class="profile-info">
        <h2>{{ userStore.nickname }}</h2>
        <p v-if="userStore.profile">{{ diabetesLabel }} · {{ treatmentLabel }}</p>
      </div>
    </div>
    <van-cell-group inset style="margin-top: -12px">
      <van-cell title="健康档案" icon="description" is-link to="/health-profile" />
      <van-cell title="我的医生" icon="friends-o" is-link to="/bind-doctor" :value="doctorCount + '位'" />
      <van-cell title="健康报告" icon="chart-trending-o" is-link to="/health-report" />
    </van-cell-group>
    <van-cell-group inset style="margin-top: 12px">
      <van-cell title="设置" icon="setting-o" is-link to="/settings" />
      <van-cell title="帮助与反馈" icon="question-o" is-link to="/help" />
      <van-cell title="关于雷檬云" icon="info-o" is-link to="/about" />
    </van-cell-group>
    <div style="padding: 20px 16px">
      <van-button block plain type="danger" @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getMyDoctors } from '@/api/user'
import { DIABETES_TYPE_LABELS, TREATMENT_PLAN_LABELS } from '@leimengyun/shared'

const router = useRouter()
const userStore = useUserStore()
const doctorCount = ref(0)

const diabetesLabel = computed(() => userStore.profile ? DIABETES_TYPE_LABELS[userStore.profile.diabetesType] || '' : '')
const treatmentLabel = computed(() => userStore.profile ? TREATMENT_PLAN_LABELS[userStore.profile.treatmentPlan] || '' : '')

function handleLogout() { userStore.logout(); router.push('/login') }

onMounted(async () => {
  try {
    const docs = (await getMyDoctors()) as unknown as any[]
    doctorCount.value = docs.length
  } catch { /* ignore */ }
})
</script>

<style scoped>
.profile-header { background: #1AAD6E; padding: 30px 16px 36px; display: flex; align-items: center; gap: 14px; color: #fff; }
.profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 600; }
.profile-info h2 { font-size: 20px; }
.profile-info p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
</style>
