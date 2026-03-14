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
            <van-tag plain type="primary" size="medium">{{ Array.isArray(template.questions) ? template.questions.length : 0 }}题</van-tag>
            <van-tag plain color="#999" size="medium">约{{ template.estimatedTime || 5 }}分钟</van-tag>
          </div>
        </div>
      </div>

      <div class="section-title">选择患者</div>
      <van-empty v-if="patients.length === 0" description="暂无绑定患者" />
      <div v-else class="patient-list">
        <div
          v-for="p in patients"
          :key="p.patientUserId"
          class="patient-item"
          @click="togglePatient(p.patientUserId)"
        >
          <van-checkbox
            :model-value="selectedPatients.includes(p.patientUserId)"
            @click.stop
            @update:model-value="togglePatient(p.patientUserId)"
          />
          <div class="patient-item__avatar">{{ (p.nickname || '?')[0] }}</div>
          <div class="patient-item__info">
            <div class="patient-item__name">{{ p.nickname || '未设置昵称' }}</div>
            <div class="patient-item__type">{{ diabetesTypeLabel(p.diabetesType) }} · {{ treatmentPlanLabel(p.treatmentPlan) }}</div>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showFailToast } from 'vant'
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
  TYPE_1: '1型',
  TYPE_2: '2型',
  GESTATIONAL: '妊娠期',
  OTHER: '其他',
}

const TREATMENT_PLAN_LABELS: Record<string, string> = {
  CSII: '胰岛素泵',
  MDI: '多次注射',
  ORAL: '口服药物',
  LIFESTYLE: '生活方式管理',
}

const pageLoading = ref(true)
const template = ref<any>(null)
const patients = ref<any[]>([])
const selectedPatients = ref<string[]>([])
const showDatePicker = ref(false)
const message = ref('')
const submitting = ref(false)

const now = new Date()
const defaultDeadline = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
const minDate = new Date()

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

function treatmentPlanLabel(plan: string) {
  return TREATMENT_PLAN_LABELS[plan] || ''
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
  submitting.value = true
  try {
    const deadlineISO = deadlineDisplay.value
      ? new Date(deadlineDisplay.value + 'T23:59:59').toISOString()
      : undefined
    const res = await createAssignments({
      templateId: route.query.templateId as string,
      patientIds: selectedPatients.value,
      deadline: deadlineISO as string,
      message: message.value || undefined,
    }) as any
    if (res?.successCount > 0) {
      showToast(`成功发送给 ${res.successCount} 位患者`)
      setTimeout(() => router.push('/questionnaire'), 800)
    } else if (res?.errors?.length > 0) {
      showFailToast(res.errors[0])
    } else {
      showFailToast('发送失败，请重试')
    }
  } catch (err: any) {
    const msg = err?.response?.data?.message
    showFailToast(Array.isArray(msg) ? msg[0] : (msg || '发送失败，请检查网络'))
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

.submit-area {
  padding: 20px 16px;
}
</style>
