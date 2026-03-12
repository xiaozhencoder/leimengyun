<template>
  <div class="health-profile-page">
    <van-nav-bar
      title="健康档案"
      left-arrow
      @click-left="$router.back()"
    >
      <template #right>
        <span class="edit-btn" @click="$router.push('/health-profile/edit')">编辑</span>
      </template>
    </van-nav-bar>

    <div class="page-content">
      <van-cell-group inset title="基本信息">
        <van-cell title="昵称" :value="profile?.nickname || '—'" />
        <van-cell title="性别" :value="genderLabel" />
        <van-cell title="年龄" :value="ageText" />
        <van-cell title="出生日期" :value="formatDate(profile?.birthDate)" />
      </van-cell-group>

      <van-cell-group inset title="疾病信息" style="margin-top: 12px">
        <van-cell title="糖尿病类型" :value="diabetesLabel" />
        <van-cell title="确诊日期" :value="formatDate(profile?.diagnosisDate) || '未填写'" />
        <van-cell title="治疗方案" :value="treatmentLabel" />
      </van-cell-group>

      <van-cell-group inset title="身体指标" style="margin-top: 12px">
        <van-cell title="身高" :value="profile?.height ? profile.height + ' cm' : '未填写'" />
        <van-cell title="体重" :value="profile?.weight ? profile.weight + ' kg' : '未填写'" />
        <van-cell title="BMI" :value="bmiText" />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { DIABETES_TYPE_LABELS, TREATMENT_PLAN_LABELS } from '@leimengyun/shared'

const userStore = useUserStore()
const profile = computed(() => userStore.profile)

const genderLabel = computed(() => {
  const g = profile.value?.gender
  if (g === 'MALE') return '男'
  if (g === 'FEMALE') return '女'
  return '—'
})

const ageText = computed(() => {
  if (!profile.value?.birthDate) return '—'
  const birth = new Date(profile.value.birthDate)
  const now = new Date()
  const age = now.getFullYear() - birth.getFullYear()
  const hasBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  return (hasBirthday ? age : age - 1) + ' 岁'
})

const diabetesLabel = computed(() =>
  profile.value ? (DIABETES_TYPE_LABELS[profile.value.diabetesType] || profile.value.diabetesType) : '—'
)

const treatmentLabel = computed(() =>
  profile.value ? (TREATMENT_PLAN_LABELS[profile.value.treatmentPlan] || profile.value.treatmentPlan) : '—'
)

const bmiText = computed(() => {
  const h = profile.value?.height
  const w = profile.value?.weight
  if (!h || !w) return '—'
  const bmi = w / ((h / 100) * (h / 100))
  return bmi.toFixed(1)
})

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style scoped>
.health-profile-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.page-content {
  padding: 12px 0;
}
.edit-btn {
  font-size: 14px;
  color: #1aad6e;
  cursor: pointer;
}
</style>
