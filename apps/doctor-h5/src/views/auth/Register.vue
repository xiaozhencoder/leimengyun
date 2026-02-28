<template>
  <div class="register-page">
    <van-nav-bar title="完善医生信息" left-arrow @click-left="router.back()" />

    <div class="register-body">
      <div class="register-hint">请填写您的专业信息，提交后需要管理员审核</div>

      <van-cell-group inset>
        <van-field
          v-model="form.realName"
          label="真实姓名"
          placeholder="请输入真实姓名"
          required
        />
        <van-field
          v-model="form.hospital"
          label="所在医院"
          placeholder="请输入医院名称"
          required
        />
        <van-field
          v-model="form.department"
          label="科室"
          placeholder="请选择科室"
          required
          is-link
          readonly
          @click="showDeptPicker = true"
        />
        <van-field
          v-model="titleLabel"
          label="职称"
          placeholder="请选择职称"
          required
          is-link
          readonly
          @click="showTitlePicker = true"
        />
        <van-field
          v-model="form.licenseNo"
          label="执业编号"
          placeholder="请输入医师执业编号"
          required
        />
        <van-field
          v-model="form.specialties"
          label="擅长领域"
          type="textarea"
          placeholder="请描述您的擅长领域"
          rows="2"
          autosize
        />
        <van-field
          v-model="form.bio"
          label="个人简介"
          type="textarea"
          placeholder="请简要介绍自己"
          rows="3"
          autosize
        />
      </van-cell-group>

      <div class="register-actions">
        <van-button type="primary" block round size="large" :loading="loading" @click="handleSubmit">
          提交审核
        </van-button>
      </div>
    </div>

    <van-popup v-model:show="showDeptPicker" round position="bottom">
      <van-picker
        :columns="deptOptions"
        @cancel="showDeptPicker = false"
        @confirm="onDeptConfirm"
      />
    </van-popup>

    <van-popup v-model:show="showTitlePicker" round position="bottom">
      <van-picker
        :columns="titleOptions"
        @cancel="showTitlePicker = false"
        @confirm="onTitleConfirm"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import {
  NavBar as VanNavBar,
  Field as VanField,
  CellGroup as VanCellGroup,
  Button as VanButton,
  Popup as VanPopup,
  Picker as VanPicker,
} from 'vant'

const router = useRouter()
const loading = ref(false)

const form = ref({
  realName: '',
  hospital: '',
  department: '',
  title: '',
  licenseNo: '',
  specialties: '',
  bio: '',
})

const showDeptPicker = ref(false)
const showTitlePicker = ref(false)

const deptOptions = [
  { text: '内分泌科', value: '内分泌科' },
  { text: '营养科', value: '营养科' },
  { text: '全科', value: '全科' },
  { text: '心血管科', value: '心血管科' },
  { text: '肾病科', value: '肾病科' },
]

const titleOptions = [
  { text: '主任医师', value: 'CHIEF' },
  { text: '副主任医师', value: 'ASSOCIATE_CHIEF' },
  { text: '主治医师', value: 'ATTENDING' },
  { text: '住院医师', value: 'RESIDENT' },
]

const titleLabel = computed(() => {
  const opt = titleOptions.find((o) => o.value === form.value.title)
  return opt?.text || ''
})

function onDeptConfirm({ selectedOptions }: { selectedOptions: { text: string; value: string }[] }) {
  form.value.department = selectedOptions[0].value
  showDeptPicker.value = false
}

function onTitleConfirm({ selectedOptions }: { selectedOptions: { text: string; value: string }[] }) {
  form.value.title = selectedOptions[0].value
  showTitlePicker.value = false
}

async function handleSubmit() {
  if (!form.value.realName) { showToast('请输入真实姓名'); return }
  if (!form.value.hospital) { showToast('请输入医院名称'); return }
  if (!form.value.department) { showToast('请选择科室'); return }
  if (!form.value.title) { showToast('请选择职称'); return }
  if (!form.value.licenseNo) { showToast('请输入执业编号'); return }

  loading.value = true
  try {
    showToast('提交成功，等待审核')
    setTimeout(() => router.push('/patients'), 500)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: var(--bg);
}

.register-body {
  padding: 16px 0;
}

.register-hint {
  padding: 0 32px;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--text-2);
}

.register-actions {
  padding: 24px 32px;
}

:deep(.van-nav-bar) {
  background: var(--doctor-primary);
}

:deep(.van-nav-bar .van-nav-bar__title) {
  color: #fff;
}

:deep(.van-nav-bar .van-icon) {
  color: #fff !important;
}

:deep(.van-button--primary) {
  background-color: var(--doctor-primary);
  border-color: var(--doctor-primary);
}
</style>
