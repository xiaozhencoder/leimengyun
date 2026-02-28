<template>
  <div class="login-page">
    <div class="login-header">
      <div class="login-logo">🍋</div>
      <div class="login-title">雷檬云 · 医生版</div>
      <div class="login-subtitle">专业糖尿病患者管理平台</div>
    </div>

    <div class="login-form">
      <van-cell-group inset>
        <van-field
          v-model="phone"
          type="tel"
          label="手机号"
          placeholder="请输入手机号"
          maxlength="11"
        />
        <van-field
          v-model="code"
          type="text"
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

      <div class="login-actions">
        <van-button type="primary" block round size="large" :loading="loading" @click="handleLogin">
          登录
        </van-button>
      </div>

      <div class="login-footer">
        <span>登录即表示同意</span>
        <a href="#">用户协议</a>
        <span>和</span>
        <a href="#">隐私政策</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import {
  Button as VanButton,
  Field as VanField,
  CellGroup as VanCellGroup,
} from 'vant'
import { useUserStore } from '@/stores/user'

const router = useRouter()
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
  countdown.value = 60
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
  showToast('验证码已发送')
}

async function handleLogin() {
  if (!phone.value || phone.value.length !== 11) {
    showToast('请输入正确的手机号')
    return
  }
  if (!code.value || code.value.length < 4) {
    showToast('请输入验证码')
    return
  }
  loading.value = true
  try {
    // Mock login for now
    userStore.setToken('mock-doctor-token')
    userStore.setDoctor({
      id: 'doc-1',
      phone: phone.value,
      realName: '李明华',
      hospital: '北京协和医院',
      department: '内分泌科',
      title: 'CHIEF',
      licenseNo: '110108199001011234',
      specialties: '1型糖尿病、胰岛素泵管理',
      bio: '从事内分泌科临床工作15年',
      verifyStatus: 'APPROVED',
    })
    const redirect = (router.currentRoute.value.query.redirect as string) || '/patients'
    router.push(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.login-header {
  text-align: center;
  padding: 60px 0 40px;
}

.login-logo {
  font-size: 64px;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--doctor-primary);
  margin-top: 8px;
}

.login-subtitle {
  font-size: 13px;
  color: var(--text-3);
  margin-top: 4px;
}

.login-form {
  padding: 0 16px;
}

.login-actions {
  margin-top: 32px;
  padding: 0 16px;
}

.login-footer {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-3);
}

.login-footer a {
  color: var(--doctor-primary);
}

:deep(.van-button--primary) {
  background-color: var(--doctor-primary);
  border-color: var(--doctor-primary);
}
</style>
