<template>
  <div class="settings-page">
    <van-nav-bar title="设置" left-arrow @click-left="$router.back()" />
    <van-cell-group inset style="margin-top: 12px">
      <van-cell title="个人信息" icon="user-o" is-link to="/health-profile/edit" />
      <van-cell title="账号与安全" icon="shield-o" is-link>
        <template #value>
          <span style="color: #969799">{{ phone }}</span>
        </template>
      </van-cell>
    </van-cell-group>
    <van-cell-group inset title="通知" style="margin-top: 12px">
      <van-cell title="消息通知" center>
        <template #right-icon>
          <van-switch v-model="msgNotify" size="22" />
        </template>
      </van-cell>
      <van-cell title="血糖异常提醒" center>
        <template #right-icon>
          <van-switch v-model="bsAlert" size="22" />
        </template>
      </van-cell>
    </van-cell-group>
    <van-cell-group inset title="其他" style="margin-top: 12px">
      <van-cell title="清除缓存" is-link @click="clearCache" />
      <van-cell title="隐私政策" is-link />
      <van-cell title="用户协议" is-link />
    </van-cell-group>
    <div style="padding: 24px 16px; text-align: center; color: #969799; font-size: 12px;">
      雷檬云 v0.1.0
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { showSuccessToast } from 'vant'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const phone = computed(() => {
  const p = (userStore.userInfo as any)?.phone || ''
  return p ? p.substring(0, 3) + '****' + p.substring(7) : ''
})
const msgNotify = ref(true)
const bsAlert = ref(true)

function clearCache() {
  showSuccessToast('缓存已清除')
}
</script>
