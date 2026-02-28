<template>
  <div class="login-page">
    <div class="logo-area">
      <div class="logo-icon">🍋</div>
      <h1 class="logo-title">雷檬云</h1>
      <p class="logo-subtitle">糖尿病健康管理平台</p>
    </div>

    <div class="form-area">
      <van-cell-group inset>
        <van-field
          v-model="phone"
          type="tel"
          label="手机号"
          placeholder="请输入手机号"
          maxlength="11"
          :rules="[{ required: true, message: '请输入手机号' }]"
        />
        <van-field
          v-model="code"
          type="number"
          label="验证码"
          placeholder="请输入验证码"
          maxlength="6"
        >
          <template #button>
            <van-button
              size="small"
              type="primary"
              :disabled="countdown > 0"
              @click="handleSendCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
            </van-button>
          </template>
        </van-field>
      </van-cell-group>

      <div class="btn-area">
        <van-button type="primary" block round size="large" :loading="loading" @click="handleLogin">
          登录
        </van-button>
      </div>

      <div class="tips">
        <span>未注册用户将自动创建账号</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { sendCode, login } from '@/api/auth'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const phone = ref('')
const code = ref('')
const loading = ref(false)
const countdown = ref(0)

let timer: ReturnType<typeof setInterval> | null = null

function handleSendCode() {
  if (!phone.value || phone.value.length !== 11) {
    showToast('请输入正确的手机号')
    return
  }

  sendCode(phone.value)
    .then(() => {
      showToast('验证码已发送')
      countdown.value = 60
      timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0 && timer) {
          clearInterval(timer)
          timer = null
        }
      }, 1000)
    })
    .catch(() => {
      showToast('发送失败，请重试')
    })
}

function handleLogin() {
  if (!phone.value || phone.value.length !== 11) {
    showToast('请输入正确的手机号')
    return
  }
  if (!code.value || code.value.length < 4) {
    showToast('请输入验证码')
    return
  }

  loading.value = true
  login(phone.value, code.value)
    .then((res) => {
      const { token, user, isNewUser } = res.data
      userStore.login(token, user)
      if (isNewUser) {
        router.push('/register')
      } else {
        const redirect = (route.query.redirect as string) || '/home'
        router.push(redirect)
      }
    })
    .catch(() => {
      showToast('登录失败，请检查验证码')
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #1aad6e 0%, #f7f8fa 50%);
  padding-top: 80px;
}

.logo-area {
  text-align: center;
  padding: 40px 0;
}

.logo-icon {
  font-size: 64px;
  margin-bottom: 12px;
}

.logo-title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.logo-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.form-area {
  padding: 20px 16px;
}

.btn-area {
  margin: 24px 16px;
}

.tips {
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
