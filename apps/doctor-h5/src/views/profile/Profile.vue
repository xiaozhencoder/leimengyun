<template>
  <div class="profile-page">
    <!-- Profile Header -->
    <div class="profile-header">
      <div class="avatar-lg">{{ doctor.realName?.charAt(0) || '医' }}</div>
      <div class="profile-info">
        <div class="profile-name">{{ doctor.realName || '医生' }}</div>
        <div class="profile-meta">{{ doctor.hospital }} · {{ doctor.department }} · {{ titleLabel }}</div>
        <div class="verify-wrap">
          <van-tag v-if="doctor.verifyStatus === 'APPROVED'" type="success" size="medium">✓ 已认证</van-tag>
          <van-tag v-else-if="doctor.verifyStatus === 'PENDING'" type="warning" size="medium">审核中</van-tag>
          <van-tag v-else type="danger" size="medium">未认证</van-tag>
        </div>
      </div>
    </div>

    <div class="profile-body">
      <!-- Menu Group 1 -->
      <van-cell-group inset>
        <van-cell title="专业信息" icon="description" is-link @click="router.push('/register')" />
        <van-cell title="工作统计" icon="chart-trending-o" is-link :value="'管理' + patientCount + '位患者'" />
        <van-cell title="通知设置" icon="bell" is-link />
      </van-cell-group>

      <!-- Menu Group 2 -->
      <van-cell-group inset style="margin-top: 12px;">
        <van-cell title="设置" icon="setting-o" is-link />
        <van-cell title="帮助与反馈" icon="question-o" is-link />
        <van-cell title="关于雷檬云" icon="info-o" is-link />
      </van-cell-group>

      <!-- Logout -->
      <div class="logout-area">
        <van-button block round plain type="danger" @click="handleLogout">退出登录</van-button>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CellGroup as VanCellGroup,
  Cell as VanCell,
  Tag as VanTag,
  Button as VanButton,
} from 'vant'
import TabBar from '@/components/TabBar.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const doctor = computed(() => userStore.profile || {
  realName: '医生',
  hospital: '',
  department: '',
  title: '',
  verifyStatus: 'PENDING',
})

const titleMap: Record<string, string> = {
  CHIEF: '主任医师',
  ASSOCIATE_CHIEF: '副主任医师',
  ATTENDING: '主治医师',
  RESIDENT: '住院医师',
}

const titleLabel = computed(() => titleMap[doctor.value.title || ''] || '')
const patientCount = ref(28)

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 60px;
}

.profile-header {
  background: var(--doctor-primary);
  padding: 30px 16px 24px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.avatar-lg {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  flex-shrink: 0;
}

.profile-info {
  color: #fff;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
}

.profile-meta {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 4px;
}

.verify-wrap {
  margin-top: 6px;
}

.profile-body {
  margin-top: -12px;
  position: relative;
}

.logout-area {
  padding: 20px 16px;
}
</style>
