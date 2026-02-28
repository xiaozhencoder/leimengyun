<template>
  <div class="login-page">
    <div class="logo-section">
      <div class="logo-icon">🍋</div>
      <h1 class="logo-text">雷檬云 · 医生版</h1>
      <p class="logo-desc">专业糖尿病患者管理平台</p>
    </div>
    <div class="form-section">
      <van-form @submit="onSubmit">
        <van-field v-model="phone" type="tel" placeholder="请输入手机号" maxlength="11" />
        <van-field v-model="code" type="digit" placeholder="请输入验证码" maxlength="6">
          <template #button>
            <van-button size="small" type="primary" @click="() => {}">获取验证码</van-button>
          </template>
        </van-field>
        <div style="margin: 24px 16px;">
          <van-button round block type="primary" native-type="submit">登录</van-button>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const phone = ref('13800138001')
const code = ref('')

function onSubmit() {
  userStore.setToken('demo-doctor-token')
  router.push('/')
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
