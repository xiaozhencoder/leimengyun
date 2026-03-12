<template>
  <div class="register-page">
    <van-nav-bar title="完善健康信息" left-arrow @click-left="handleUseOtherAccount" />
    <div class="form-section">
      <p class="form-tip">请填写您的基本健康信息，以便提供更好的管理服务</p>
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.nickname"
            label="昵称"
            placeholder="请输入昵称（2-20 个字符）"
            maxlength="20"
            show-word-limit
            :rules="[
              { required: true, message: '请输入昵称' },
              { validator: (v: string) => (v?.length ?? 0) >= 2 && (v?.length ?? 0) <= 20, message: '昵称需 2-20 个字符' },
            ]"
          />
          <van-field label="性别" :model-value="genderLabel" is-link readonly @click="showGender = true" />
          <van-field
            label="出生日期"
            :model-value="form.birthDate"
            is-link
            readonly
            placeholder="请选择"
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
            完成注册
          </van-button>
          <p class="switch-account" @click="handleUseOtherAccount">使用其他账号登录</p>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { createPatientProfile } from '@/api/auth'

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

function handleUseOtherAccount() {
  userStore.logout()
  router.replace('/login')
}

async function onSubmit() {
  if (!form.value.nickname || !form.value.birthDate) {
    showFailToast('请填写必要信息')
    return
  }
  loading.value = true
  try {
    await createPatientProfile({
      ...form.value,
      height: heightStr.value ? Number(heightStr.value) : undefined,
      weight: weightStr.value ? Number(weightStr.value) : undefined,
    })
    await userStore.fetchUser()
    showSuccessToast('注册成功')
    setTimeout(() => router.replace('/'), 500)
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.form-tip {
  padding: 16px;
  font-size: 14px;
  color: #646566;
}
.switch-account {
  margin-top: 16px;
  text-align: center;
  font-size: 14px;
  color: #1aad6e;
  cursor: pointer;
}
</style>
