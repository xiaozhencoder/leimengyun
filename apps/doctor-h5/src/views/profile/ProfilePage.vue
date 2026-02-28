<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="profile-avatar">李</div>
      <div class="profile-info">
        <h2>李明华</h2>
        <p>北京协和医院 · 内分泌科 · 主任医师</p>
        <van-tag type="success" style="margin-top: 6px;">✓ 已认证</van-tag>
      </div>
    </div>
    <van-cell-group inset style="margin-top: -12px;">
      <van-cell title="专业信息" icon="description" is-link />
      <van-cell title="工作统计" icon="chart-trending-o" is-link value="管理28位患者" />
      <van-cell title="通知设置" icon="bell" is-link />
    </van-cell-group>
    <van-cell-group inset style="margin-top: 12px;">
      <van-cell title="设置" icon="setting-o" is-link />
      <van-cell title="帮助与反馈" icon="question-o" is-link />
      <van-cell title="关于雷檬云" icon="info-o" is-link />
    </van-cell-group>
    <div style="padding: 20px 16px;">
      <van-button block plain type="danger" @click="handleLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
function handleLogout() { userStore.logout(); router.push('/login') }
</script>

<style scoped>
.profile-header { background: #3B82F6; padding: 30px 16px 36px; display: flex; align-items: center; gap: 14px; color: #fff; }
.profile-avatar { width: 64px; height: 64px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 600; }
.profile-info h2 { font-size: 20px; }
.profile-info p { font-size: 13px; opacity: 0.85; margin-top: 4px; }
</style>
