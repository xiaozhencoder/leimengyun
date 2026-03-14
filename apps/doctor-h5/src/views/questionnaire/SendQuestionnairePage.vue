<template>
  <div class="send-questionnaire">
    <van-nav-bar title="发送问卷" left-arrow @click-left="router.back()" />

    <van-loading v-if="pageLoading" class="page-loading" />
    <template v-else>
      <div v-if="template" class="template-info">
        <div class="template-info__icon">{{ getCategoryIcon(template.category) }}</div>
        <div class="template-info__body">
          <div class="template-info__title">{{ template.title }}</div>
          <div class="template-info__desc">{{ template.description }}</div>
          <div class="template-info__meta">
            <van-tag plain type="primary" size="medium">{{ template.questionCount || 0 }}题</van-tag>
            <van-tag plain color="#999" size="medium">约{{ template.estimatedMinutes || 5 }}分钟</van-tag>
          </div>
        </div>
      </div>

      <div class="section-title">选择患者</div>
      <van-field v-model="patientSearch" placeholder="搜索患者..." clearable class="patient-search" />
      <van-empty v-if="filteredPatients.length === 0" description="暂无患者" />
      <div v-else class="patient-list">
        <div
          v-for="p in filteredPatients"
          :key="p.id"
          class="patient-item"
          @click="togglePatient(p.id)"
        >
          <van-checkbox
            :model-value="selectedPatients.includes(p.id)"
            @click.stop
            @update:model-value="togglePatient(p.id)"
          />
          <div class="patient-item__avatar">{{ (p.realName || p.phone || '?')[0] }}</div>
          <div class="patient-item__info">
            <div class="patient-item__name">{{ p.realName || p.phone }}</div>
            <div class="patient-item__type">{{ diabetesTypeLabel(p.diabetesType) }}</div>
          </div>
        </div>
      </div>

      <div class="section-title">截止日期</div>
      <van-field
        v-model="deadlineDisplay"
        is-link
        readonly
        placeholder="请选择截止日期"
        @click="showDatePicker = true"
      />
      <van-popup v-model:show="showDatePicker" position="bottom" round>
        <van-date-picker
          v-model="datePickerValue"
          title="选择截止日期"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>

      <div class="section-title">附言（选填）</div>
      <van-field
        v-model="message"
        type="textarea"
        rows="3"
        maxlength="200"
        show-word-limit
        placeholder="给患者的附言..."
      />

      <div class="submit-area">
        <van-button
          type="primary"
          block
          :disabled="selectedPatients.length === 0"
          :loading="submitting"
          @click="handleSubmit"
        >确认发送 ({{ selectedPatients.length }}位患者)</van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { getTemplateById, createAssignments, getMyPatients } from '@/api/questionnaire'

const router = useRouter()
const route = useRoute()

const CATEGORY_ICONS: Record<string, string> = {
  BLOOD_SUGAR_MANAGEMENT: '📊',
  DIET_MANAGEMENT: '🍱',
  EXERCISE_MANAGEMENT: '🏃',
  MEDICATION_ADHERENCE: '💊',
  QUALITY_OF_LIFE: '❤️',
  HYPOGLYCEMIA_RISK: '⚠️',
  FOOT_CARE: '🦶',
  MENTAL_HEALTH: '🧠',
}

const DIABETES_TYPE_LABELS: Record<string, string> = {
  TYPE_1: '1型糖尿病',
  TYPE_2: '2型糖尿病',
  GESTATIONAL: '妊娠糖尿病',
  OTHER: '其他类型',
}

const pageLoading = ref(true)
const template = ref<any>(null)
const patients = ref<any[]>([])
const selectedPatients = ref<string[]>([])
const showDatePicker = ref(false)
const message = ref('')
const submitting = ref(false)
const patientSearch = ref('')

const filteredPatients = computed(() => {
  if (!patientSearch.value) return patients.value
  const keyword = patientSearch.value.toLowerCase()
  return patients.value.filter((p: any) => {
    const name = (p.realName || p.phone || '').toLowerCase()
    return name.includes(keyword)
  })
})

const now = new Date()
const defaultDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
const minDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())
const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

const datePickerValue = ref([
  String(defaultDeadline.getFullYear()),
  String(defaultDeadline.getMonth() + 1).padStart(2, '0'),
  String(defaultDeadline.getDate()).padStart(2, '0'),
])
const deadlineDisplay = ref(
  `${defaultDeadline.getFullYear()}-${String(defaultDeadline.getMonth() + 1).padStart(2, '0')}-${String(defaultDeadline.getDate()).padStart(2, '0')}`,
)

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || '📋'
}

function diabetesTypeLabel(type: string) {
  return DIABETES_TYPE_LABELS[type] || ''
}

function togglePatient(id: string) {
  const idx = selectedPatients.value.indexOf(id)
  if (idx >= 0) {
    selectedPatients.value.splice(idx, 1)
  } else {
    selectedPatients.value.push(id)
  }
}

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  deadlineDisplay.value = selectedValues.join('-')
  datePickerValue.value = selectedValues
  showDatePicker.value = false
}

async function handleSubmit() {
  if (selectedPatients.value.length === 0) return

  if (deadlineDisplay.value) {
    const deadlineDate = new Date(deadlineDisplay.value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffDays = Math.round((deadlineDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
    if (diffDays < 1 || diffDays > 30) {
      showFailToast('截止日期必须在1-30天内')
      return
    }
  }

  submitting.value = true
  try {
    await createAssignments({
      templateId: route.query.templateId as string,
      patientIds: selectedPatients.value,
      deadline: deadlineDisplay.value,
      message: message.value || undefined,
    })
    showSuccessToast('发送成功')
    router.push('/questionnaire')
  } catch {
    showFailToast('发送失败')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const templateId = route.query.templateId as string
    if (templateId) {
      const data = await getTemplateById(templateId)
      template.value = data
    }
    const pData = await getMyPatients()
    patients.value = (pData as any) || []

    const preSelectedPatientId = route.query.patientId as string
    if (preSelectedPatientId) {
      const found = patients.value.find((p: any) => p.id === preSelectedPatientId)
      if (found && !selectedPatients.value.includes(preSelectedPatientId)) {
        selectedPatients.value.push(preSelectedPatientId)
      }
    }
  } catch {
    // ignore
  } finally {
    pageLoading.value = false
  }
})
</script>

<style scoped>
.send-questionnaire {
  min-height: 100vh;
  background: #F7F8FA;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.template-info {
  display: flex;
  align-items: flex-start;
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.template-info__icon {
  font-size: 36px;
  margin-right: 12px;
  flex-shrink: 0;
}

.template-info__body {
  flex: 1;
  min-width: 0;
}

.template-info__title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.template-info__desc {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.template-info__meta {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.section-title {
  padding: 16px 16px 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.patient-list {
  margin: 0 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.patient-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  gap: 12px;
  border-bottom: 1px solid #EBEDF0;
  cursor: pointer;
}

.patient-item:last-child {
  border-bottom: none;
}

.patient-item__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #E8F5E9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #1AAD6E;
  flex-shrink: 0;
}

.patient-item__info {
  flex: 1;
}

.patient-item__name {
  font-size: 15px;
  color: #333;
}

.patient-item__type {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.patient-search {
  margin: 0 12px 8px;
  border-radius: 8px;
}

.submit-area {
  padding: 20px 16px;
}
</style>
