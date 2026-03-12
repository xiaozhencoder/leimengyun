<template>
  <div class="edit-profile-page">
    <van-nav-bar title="编辑健康档案" left-arrow @click-left="$router.back()" />
    <div class="form-section">
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.nickname"
            label="昵称"
            placeholder="请输入昵称"
            :rules="[{ required: true, message: '请输入昵称' }]"
          />
          <van-field label="性别" :model-value="genderLabel" is-link readonly @click="showGender = true" />
          <van-field
            label="出生日期"
            :model-value="form.birthDate"
            is-link
            readonly
            placeholder="请选择"
            :rules="[{ required: true, message: '请选择出生日期' }]"
            @click="showBirthDate = true"
          />
        </van-cell-group>

        <van-cell-group inset title="疾病信息" style="margin-top: 12px">
          <van-field label="糖尿病类型" :model-value="diabetesLabel" is-link readonly @click="showDiabetes = true" />
          <van-field label="治疗方案" :model-value="treatmentLabel" is-link readonly @click="showTreatment = true" />
          <van-field
            label="确诊日期"
            :model-value="form.diagnosisDate"
            is-link
            readonly
            placeholder="选填"
            @click="showDiagDate = true"
          />
        </van-cell-group>

        <van-cell-group inset title="身体指标（选填）" style="margin-top: 12px">
          <van-field v-model="heightStr" label="身高(cm)" type="digit" placeholder="选填" />
          <van-field v-model="weightStr" label="体重(kg)" type="digit" placeholder="选填" />
        </van-cell-group>

        <div style="padding: 24px 16px">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            保存修改
          </van-button>
        </div>
      </van-form>
    </div>

    <van-action-sheet v-model:show="showGender" :actions="genderActions" @select="onGenderSelect" />
    <van-action-sheet v-model:show="showDiabetes" :actions="diabetesActions" @select="onDiabetesSelect" />
    <van-action-sheet v-model:show="showTreatment" :actions="treatmentActions" @select="onTreatmentSelect" />
    <van-popup v-model:show="showBirthDate" position="bottom">
      <van-date-picker
        :min-date="new Date(1940, 0, 1)"
        :max-date="new Date()"
        @confirm="onBirthDateConfirm"
        @cancel="showBirthDate = false"
      />
    </van-popup>
    <van-popup v-model:show="showDiagDate" position="bottom">
      <van-date-picker
        :min-date="new Date(1980, 0, 1)"
        :max-date="new Date()"
        @confirm="onDiagDateConfirm"
        @cancel="showDiagDate = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { updatePatientProfile } from '@/api/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = ref({
  nickname: '',
  gender: 'MALE',
  birthDate: '',
  diabetesType: 'TYPE_1',
  treatmentPlan: 'CSII',
  diagnosisDate: '',
})
const heightStr = ref('')
const weightStr = ref('')

const showGender = ref(false)
const showDiabetes = ref(false)
const showTreatment = ref(false)
const showBirthDate = ref(false)
const showDiagDate = ref(false)

const genderActions = [
  { name: '男', value: 'MALE' },
  { name: '女', value: 'FEMALE' },
]
const diabetesActions = [
  { name: '1型糖尿病', value: 'TYPE_1' },
  { name: '2型糖尿病', value: 'TYPE_2' },
  { name: '妊娠期糖尿病', value: 'GESTATIONAL' },
  { name: '其他', value: 'OTHER' },
]
const treatmentActions = [
  { name: '胰岛素泵(CSII)', value: 'CSII' },
  { name: '多次注射(MDI)', value: 'MDI' },
  { name: '口服药物', value: 'ORAL' },
  { name: '生活方式管理', value: 'LIFESTYLE' },
]

const genderLabel = computed(() => genderActions.find((a) => a.value === form.value.gender)?.name || '请选择')
const diabetesLabel = computed(() => diabetesActions.find((a) => a.value === form.value.diabetesType)?.name || '请选择')
const treatmentLabel = computed(() => treatmentActions.find((a) => a.value === form.value.treatmentPlan)?.name || '请选择')

function onGenderSelect(action: any) { form.value.gender = action.value; showGender.value = false }
function onDiabetesSelect(action: any) { form.value.diabetesType = action.value; showDiabetes.value = false }
function onTreatmentSelect(action: any) { form.value.treatmentPlan = action.value; showTreatment.value = false }

function formatDate(vals: string[]) {
  return `${vals[0]}-${vals[1]}-${vals[2]}`
}

function onBirthDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.value.birthDate = formatDate(selectedValues)
  showBirthDate.value = false
}

function onDiagDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.value.diagnosisDate = formatDate(selectedValues)
  showDiagDate.value = false
}

function isoToDateStr(isoStr?: string | null): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  const p = userStore.profile
  if (p) {
    form.value.nickname = p.nickname || ''
    form.value.gender = p.gender || 'MALE'
    form.value.birthDate = isoToDateStr(p.birthDate)
    form.value.diabetesType = p.diabetesType || 'TYPE_1'
    form.value.treatmentPlan = p.treatmentPlan || 'CSII'
    form.value.diagnosisDate = isoToDateStr(p.diagnosisDate)
    heightStr.value = p.height ? String(p.height) : ''
    weightStr.value = p.weight ? String(p.weight) : ''
  }
})

async function onSubmit() {
  loading.value = true
  try {
    await updatePatientProfile({
      ...form.value,
      diagnosisDate: form.value.diagnosisDate || undefined,
      height: heightStr.value ? Number(heightStr.value) : undefined,
      weight: weightStr.value ? Number(weightStr.value) : undefined,
    })
    await userStore.fetchUser()
    showSuccessToast('保存成功')
    setTimeout(() => router.back(), 500)
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.edit-profile-page {
  min-height: 100vh;
  background: #f7f8fa;
}
</style>
