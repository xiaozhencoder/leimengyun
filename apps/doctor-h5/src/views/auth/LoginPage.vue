<template>
  <div class="login-page">
    <div class="logo-section">
      <div class="logo-icon">🍋</div>
      <h1 class="logo-text">雷檬云 · 医生版</h1>
      <p class="logo-desc">专业糖尿病患者管理平台</p>
    </div>
    <div class="form-section">
      <van-form @submit="onSubmit">
        <van-field v-model="phone" type="tel" placeholder="请输入手机号" maxlength="11"
          :rules="[{ required: true, message: '请输入手机号' }]" />
        <van-field v-model="code" type="digit" placeholder="请输入验证码" maxlength="6"
          :rules="[{ required: true, message: '请输入验证码' }]">
          <template #button>
            <van-button size="small" type="primary" @click.prevent="handleSendCode">获取验证码</van-button>
          </template>
        </van-field>
        <div style="margin: 24px 16px">
          <van-button round block type="primary" native-type="submit" :loading="loading">登录</van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { login, sendCode } from '@/api/auth'

const router = useRouter()
const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const loading = ref(false)

async function handleSendCode() {
  if (!phone.value || phone.value.length !== 11) { showToast('请输入正确的手机号'); return }
  try { await sendCode(phone.value); showToast('验证码已发送（开发环境输入任意6位数字）') } catch { showFailToast('发送失败') }
}

async function onSubmit() {
  loading.value = true
  try {
    const result: any = await login(phone.value, code.value)
    userStore.setToken(result.token)
    const userData = await userStore.fetchUser()
    if (userData == null) {
      showFailToast('登录失败，请重试')
      return
    }
    const hasProfile = !!(userData as any)?.doctorProfile
    if (result.isNewUser || !hasProfile) {
      router.push('/register')
    } else {
      router.push('/')
    }
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; background: #fff; }
.logo-section { text-align: center; padding: 60px 0 40px; }
.logo-icon { font-size: 64px; }
.logo-text { font-size: 22px; font-weight: 700; color: #3B82F6; margin-top: 8px; }
.logo-desc { font-size: 13px; color: #969799; margin-top: 4px; }
.form-section { padding: 0 16px; }
</style>
