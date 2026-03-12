<template>
  <div class="role-select-page">
    <div class="page-header">
      <div class="header-title">您是？</div>
      <div class="header-desc">请选择您的身份，选择后不可更改</div>
    </div>

    <div class="role-cards">
      <div
        :class="['role-card', { 'role-card--selected': selectedRole === 'patient' }]"
        @click="selectedRole = 'patient'"
      >
        <div class="role-icon">🩸</div>
        <div class="role-title">我是患者</div>
        <div class="role-desc">记录血糖，获取指导</div>
      </div>
      <div
        :class="['role-card', { 'role-card--selected': selectedRole === 'doctor' }]"
        @click="selectedRole = 'doctor'"
      >
        <div class="role-icon">👨‍⚕️</div>
        <div class="role-title">我是医生</div>
        <div class="role-desc">管理患者，提供指导</div>
      </div>
    </div>

    <div class="confirm-section">
      <van-button
        round
        block
        type="primary"
        :disabled="!selectedRole"
        @click="onConfirm"
      >
        确认选择
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const selectedRole = ref<'patient' | 'doctor' | null>(null)

function onConfirm() {
  if (!selectedRole.value) return
  if (selectedRole.value === 'patient') {
    router.push('/register')
  } else {
    window.location.href = 'http://localhost:5174/register'
  }
}
</script>

<style scoped>
.role-select-page {
  min-height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.page-header {
  text-align: center;
  padding: 48px 24px 32px;
}
.header-title {
  font-size: 22px;
  font-weight: 700;
  color: #323233;
}
.header-desc {
  font-size: 13px;
  color: #969799;
  margin-top: 8px;
}
.role-cards {
  display: flex;
  gap: 16px;
  padding: 0 24px;
}
.role-card {
  flex: 1;
  border: 2px solid #ebedf0;
  border-radius: 16px;
  padding: 30px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}
.role-card--selected {
  border-color: #1aad6e;
  background: #e8f8f0;
}
.role-icon {
  font-size: 48px;
  margin-bottom: 10px;
}
.role-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}
.role-desc {
  font-size: 12px;
  color: #969799;
  margin-top: 6px;
}
.confirm-section {
  padding: 32px 24px;
  margin-top: auto;
}
</style>
