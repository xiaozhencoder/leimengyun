<template>
  <div class="register-page">
    <van-nav-bar title="完善医生信息" />
    <div class="form-section">
      <p class="form-tip">请填写您的专业信息，提交后需管理员审核</p>
      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field v-model="form.realName" label="真实姓名" placeholder="请输入" :rules="[{ required: true }]" />
          <van-field v-model="form.hospital" label="所在医院" placeholder="请输入" :rules="[{ required: true }]" />
          <van-field v-model="form.department" label="科室" placeholder="请输入" :rules="[{ required: true }]" />
          <van-cell title="职称" :value="titleLabel" is-link @click="showTitle = true" />
          <van-field v-model="form.licenseNo" label="执业编号" placeholder="请输入" :rules="[{ required: true }]" />
        </van-cell-group>
        <van-cell-group inset title="选填信息" style="margin-top: 12px">
          <van-field v-model="form.specialties" label="擅长领域" type="textarea" placeholder="选填" rows="2" maxlength="200" />
          <van-field v-model="form.bio" label="个人简介" type="textarea" placeholder="选填" rows="3" maxlength="500" />
        </van-cell-group>
        <div style="padding: 24px 16px">
          <van-button round block type="primary" native-type="submit" :loading="loading">提交审核</van-button>
        </div>
      </van-form>
    </div>
    <van-action-sheet v-model:show="showTitle" :actions="titleActions" @select="onTitleSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { createDoctorProfile } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const showTitle = ref(false)

const form = ref({
  realName: '', hospital: '', department: '内分泌科', title: 'ATTENDING',
  licenseNo: '', specialties: '', bio: '',
})

const titleActions = [
  { name: '主任医师', value: 'CHIEF' }, { name: '副主任医师', value: 'ASSOCIATE_CHIEF' },
  { name: '主治医师', value: 'ATTENDING' }, { name: '住院医师', value: 'RESIDENT' },
]

const titleLabel = computed(() => titleActions.find((a) => a.value === form.value.title)?.name || '请选择')
function onTitleSelect(a: any) { form.value.title = a.value; showTitle.value = false }

async function onSubmit() {
  loading.value = true
  try {
    await createDoctorProfile({
      ...form.value,
      specialties: form.value.specialties || undefined,
      bio: form.value.bio || undefined,
    })
    await userStore.fetchUser()
    showSuccessToast('提交成功，等待审核')
    setTimeout(() => router.replace('/'), 500)
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '提交失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page { min-height: 100vh; background: #f7f8fa; }
.form-tip { padding: 16px; font-size: 14px; color: #646566; }
</style>
