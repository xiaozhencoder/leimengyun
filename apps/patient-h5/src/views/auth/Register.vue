<template>
  <div class="register-page">
    <van-nav-bar title="完善个人信息" />

    <van-form @submit="handleSubmit">
      <van-cell-group inset title="基本信息">
        <van-field
          v-model="form.nickname"
          label="昵称"
          placeholder="请输入昵称"
          :rules="[{ required: true, message: '请输入昵称' }]"
        />
        <van-field label="性别" :rules="[{ required: true, message: '请选择性别' }]">
          <template #input>
            <van-radio-group v-model="form.gender" direction="horizontal">
              <van-radio name="MALE">男</van-radio>
              <van-radio name="FEMALE">女</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field
          v-model="form.birthDate"
          is-link
          readonly
          label="出生日期"
          placeholder="请选择出生日期"
          @click="showDatePicker = true"
          :rules="[{ required: true, message: '请选择出生日期' }]"
        />
      </van-cell-group>

      <van-cell-group inset title="病情信息">
        <van-field label="糖尿病类型" :rules="[{ required: true, message: '请选择类型' }]">
          <template #input>
            <van-radio-group v-model="form.diabetesType" direction="horizontal">
              <van-radio name="TYPE_1">1型</van-radio>
              <van-radio name="TYPE_2">2型</van-radio>
              <van-radio name="GESTATIONAL">妊娠期</van-radio>
              <van-radio name="OTHER">其他</van-radio>
            </van-radio-group>
          </template>
        </van-field>
        <van-field label="治疗方案" :rules="[{ required: true, message: '请选择方案' }]">
          <template #input>
            <van-radio-group v-model="form.treatmentPlan">
              <van-radio name="CSII">胰岛素泵(CSII)</van-radio>
              <van-radio name="MDI">多次注射(MDI)</van-radio>
              <van-radio name="ORAL">口服药物</van-radio>
              <van-radio name="LIFESTYLE">生活方式管理</van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </van-cell-group>

      <van-cell-group inset title="身体数据（选填）">
        <van-field
          v-model="form.height"
          type="number"
          label="身高"
          placeholder="请输入身高"
        >
          <template #right-icon><span>cm</span></template>
        </van-field>
        <van-field
          v-model="form.weight"
          type="number"
          label="体重"
          placeholder="请输入体重"
        >
          <template #right-icon><span>kg</span></template>
        </van-field>
      </van-cell-group>

      <div class="btn-area">
        <van-button type="primary" block round size="large" native-type="submit" :loading="loading">
          提交
        </van-button>
      </div>
    </van-form>

    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        v-model="selectedDate"
        title="选择出生日期"
        :min-date="new Date(1940, 0, 1)"
        :max-date="new Date()"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { register } from '@/api/auth'

const router = useRouter()
const loading = ref(false)
const showDatePicker = ref(false)
const selectedDate = ref<string[]>([])

const form = reactive({
  nickname: '',
  gender: '',
  birthDate: '',
  diabetesType: '',
  treatmentPlan: '',
  height: '',
  weight: '',
})

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.birthDate = selectedValues.join('-')
  showDatePicker.value = false
}

function handleSubmit() {
  loading.value = true
  const data = {
    nickname: form.nickname,
    gender: form.gender,
    birthDate: form.birthDate,
    diabetesType: form.diabetesType,
    treatmentPlan: form.treatmentPlan,
    height: form.height ? Number(form.height) : undefined,
    weight: form.weight ? Number(form.weight) : undefined,
  }

  register(data)
    .then(() => {
      showToast('注册成功')
      router.push('/home')
    })
    .catch(() => {
      showToast('提交失败，请重试')
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: var(--bg);
}

.btn-area {
  margin: 24px 16px;
}
</style>
