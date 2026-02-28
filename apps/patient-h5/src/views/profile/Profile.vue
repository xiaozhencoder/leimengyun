<template>
  <div class="profile-page page-with-tabbar">
    <div class="profile-header">
      <div class="avatar">
        {{ userStore.userInfo?.nickname?.charAt(0) || '用' }}
      </div>
      <div class="user-info">
        <h3>{{ userStore.userInfo?.nickname || '未登录' }}</h3>
        <p>{{ userStore.userInfo?.phone || '' }}</p>
      </div>
    </div>

    <van-cell-group inset class="menu-group">
      <van-cell
        title="健康档案"
        icon="records-o"
        is-link
        @click="$router.push('/profile/health')"
      />
      <van-cell
        title="我的医生"
        icon="friends-o"
        is-link
        @click="$router.push('/bind-doctor')"
      />
      <van-cell title="提醒设置" icon="clock-o" is-link />
      <van-cell title="数据导出" icon="description-o" is-link />
    </van-cell-group>

    <van-cell-group inset class="menu-group">
      <van-cell title="意见反馈" icon="comment-o" is-link />
      <van-cell title="关于我们" icon="info-o" is-link />
    </van-cell-group>

    <div class="btn-area">
      <van-button block plain type="danger" @click="handleLogout">退出登录</van-button>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { showDialog } from 'vant'
import TabBar from '@/components/TabBar.vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

function handleLogout() {
  showDialog({
    title: '提示',
    message: '确定要退出登录吗？',
    showCancelButton: true,
  }).then(() => {
    userStore.logout()
    router.push('/login')
  })
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: var(--bg);
}

.profile-header {
  background: linear-gradient(135deg, #1aad6e, #0d8a52);
  padding: 48px 20px 32px;
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

.user-info h3 {
  color: #fff;
  font-size: 20px;
  margin-bottom: 4px;
}

.user-info p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
}

.menu-group {
  margin-top: 12px;
}

.btn-area {
  margin: 24px 16px;
}
</style>
