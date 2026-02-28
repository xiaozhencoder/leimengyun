<template>
  <div class="login-page">
    <div class="logo-section">
      <div class="logo-icon">🍋</div>
      <h1 class="logo-text">雷檬云</h1>
      <p class="logo-desc">您的糖尿病健康管理伙伴</p>
    </div>
    <div class="form-section">
      <van-form @submit="onSubmit">
        <van-field v-model="phone" type="tel" placeholder="请输入手机号" maxlength="11"
          :rules="[{ required: true, message: '请输入手机号' }]" />
        <van-field v-model="code" type="digit" placeholder="请输入验证码" maxlength="6"
          :rules="[{ required: true, message: '请输入验证码' }]">
          <template #button>
            <van-button size="small" type="primary" :disabled="countdown > 0" @click="sendCode">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>
        <div style="margin: 24px 16px;">
          <van-button round block type="primary" native-type="submit">登录 / 注册</van-button>
        </div>
      </van-form>
      <p class="agreement">登录即表示同意 <a>用户协议</a> 和 <a>隐私政策</a></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const phone = ref('')
const code = ref('')
const countdown = ref(0)

function sendCode() {
  if (!phone.value || phone.value.length !== 11) {
    showToast('请输入正确的手机号')
    return
  }
  countdown.value = 60
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
  showToast('验证码已发送')
}

function onSubmit() {
  userStore.setToken('demo-token-' + Date.now())
  showToast('登录成功')
  router.push('/')
}
</script>

<style scoped>
.login-page { min-height: 100vh; background: #fff; }
.logo-section { text-align: center; padding: 60px 0 40px; }
.logo-icon { font-size: 64px; }
.logo-text { font-size: 22px; font-weight: 700; color: #1AAD6E; margin-top: 8px; }
.logo-desc { font-size: 13px; color: #969799; margin-top: 4px; }
.form-section { padding: 0 16px; }
.agreement { text-align: center; font-size: 12px; color: #969799; margin-top: 16px; }
.agreement a { color: #1AAD6E; }
</style>
