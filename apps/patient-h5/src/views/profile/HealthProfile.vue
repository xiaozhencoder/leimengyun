<template>
  <div class="health-page">
    <van-nav-bar title="健康档案" left-arrow @click-left="$router.back()" />

    <van-cell-group inset title="基本信息">
      <van-cell title="昵称" :value="profile.nickname || '--'" />
      <van-cell title="性别" :value="profile.gender === 'MALE' ? '男' : profile.gender === 'FEMALE' ? '女' : '--'" />
      <van-cell title="出生日期" :value="profile.birthDate || '--'" />
      <van-cell title="身高" :value="profile.height ? `${profile.height} cm` : '--'" />
      <van-cell title="体重" :value="profile.weight ? `${profile.weight} kg` : '--'" />
    </van-cell-group>

    <van-cell-group inset title="病情信息">
      <van-cell title="糖尿病类型" :value="diabetesTypeLabel" />
      <van-cell title="治疗方案" :value="treatmentPlanLabel" />
      <van-cell title="确诊日期" :value="profile.diagnosisDate || '--'" />
    </van-cell-group>

    <van-cell-group inset title="健康指标">
      <van-cell title="BMI" :value="bmi" />
    </van-cell-group>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { DIABETES_TYPE_LABELS, TREATMENT_PLAN_LABELS } from '@leimengyun/shared'
import { getProfile } from '@/api/auth'

interface ProfileData {
  nickname: string
  gender: string
  birthDate: string
  height?: number
  weight?: number
  diabetesType: string
  treatmentPlan: string
  diagnosisDate?: string
}

const profile = ref<ProfileData>({
  nickname: '',
  gender: '',
  birthDate: '',
  diabetesType: '',
  treatmentPlan: '',
})

const diabetesTypeLabel = computed(() => DIABETES_TYPE_LABELS[profile.value.diabetesType] || '--')
const treatmentPlanLabel = computed(() => TREATMENT_PLAN_LABELS[profile.value.treatmentPlan] || '--')

const bmi = computed(() => {
  const h = profile.value.height
  const w = profile.value.weight
  if (h && w) {
    const val = w / ((h / 100) * (h / 100))
    return val.toFixed(1)
  }
  return '--'
})

onMounted(() => {
  getProfile()
    .then((res) => {
      profile.value = res.data
    })
    .catch(() => {
      /* use defaults */
    })
})
</script>

<style scoped>
.health-page {
  min-height: 100vh;
  background: var(--bg);
}
</style>
