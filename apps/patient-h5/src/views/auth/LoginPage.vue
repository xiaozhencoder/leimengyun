<template>
  <div class="login-page">
    <div class="logo-section">
      <div class="logo-icon">🍋</div>
      <h1 class="logo-text">雷檬云</h1>
      <p class="logo-desc">您的糖尿病健康管理伙伴</p>
    </div>
    <div class="form-section">
      <van-form @submit="onSubmit">
        <van-field
          v-model="phone"
          type="tel"
          placeholder="请输入手机号"
          maxlength="11"
          :rules="[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '手机号格式不正确' }]"
        />
        <van-field
          v-model="code"
          type="digit"
          placeholder="请输入验证码"
          maxlength="6"
          :rules="[{ required: true, message: '请输入验证码' }]"
        >
          <template #button>
            <van-button size="small" type="primary" :disabled="countdown > 0" @click.prevent="handleSendCode">
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>
        <div style="margin: 24px 16px">
          <van-button round block type="primary" native-type="submit" :loading="loading">
            登录 / 注册
          </van-button>
        </div>
      </van-form>
      <p class="agreement">
        登录即表示同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a>
      </p>
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
const countdown = ref(0)
const loading = ref(false)

async function handleSendCode() {
  if (!phone.value || !/^1\d{10}$/.test(phone.value)) {
    showToast('请输入正确的手机号')
    return
  }
  try {
    await sendCode(phone.value)
    showToast('验证码已发送（开发环境输入任意6位数字）')
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch {
    showFailToast('发送失败')
  }
}

async function onSubmit() {
  loading.value = true
  try {
    const result = await login(phone.value, code.value)
    userStore.setToken(result.token)

    const userData = await userStore.fetchUser()

    // getMe 失败时（如网络/401）fetchUser 会 logout 并返回 null，不应跳转注册页
    if (userData == null) {
      showFailToast('登录失败，请重试')
      return
    }

    // 用接口返回的 userData 判断，避免 store 未及时更新导致误判
    const hasProfile = !!(userData as any)?.patientProfile
    if (result.isNewUser) {
      router.push('/role-select')
    } else if (!hasProfile) {
      showToast('请完善健康信息')
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
.login-page {
  min-height: 100vh;
  background: #fff;
}
.logo-section {
  text-align: center;
  padding: 60px 0 40px;
}
.logo-icon {
  font-size: 64px;
}
.logo-text {
  font-size: 22px;
  font-weight: 700;
  color: #1aad6e;
  margin-top: 8px;
}
.logo-desc {
  font-size: 13px;
  color: #969799;
  margin-top: 4px;
}
.form-section {
  padding: 0 16px;
}
.agreement {
  text-align: center;
  font-size: 12px;
  color: #969799;
  margin-top: 16px;
}
.agreement a {
  color: #1aad6e;
}
</style>
