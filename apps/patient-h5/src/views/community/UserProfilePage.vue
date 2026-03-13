<template>
  <div class="user-profile-page">
    <van-nav-bar title="" left-arrow @click-left="$router.back()" />
    <van-loading v-if="!profile" style="display:flex;justify-content:center;padding:80px" />
    <template v-else>
      <div class="profile-header">
        <div class="profile-avatar" :style="{ background: profile.role === 'DOCTOR' ? '#E8F0FE' : '#E8F8F0', color: profile.role === 'DOCTOR' ? '#3B82F6' : '#1AAD6E' }">
          {{ profile.nickname?.[0] || '?' }}
        </div>
        <div class="profile-name">{{ profile.nickname }}</div>
        <div class="profile-meta">
          <template v-if="profile.role === 'DOCTOR'">
            {{ profile.hospital }} · {{ profile.department }}
            <span v-if="profile.verifyStatus === 'APPROVED'" class="doctor-badge">✓ 认证</span>
          </template>
          <template v-else>
            {{ DIABETES_TYPE_LABELS[profile.diabetesType] || '' }}
            <template v-if="profile.treatmentPlan"> · {{ TREATMENT_PLAN_LABELS[profile.treatmentPlan] || '' }}</template>
            <template v-if="profile.managedDays != null"> · 已管理 {{ profile.managedDays }} 天</template>
          </template>
        </div>
        <div class="profile-stats">
          <div class="stat"><span class="stat-value">{{ profile.postCount }}</span><span class="stat-label">帖子</span></div>
          <div class="stat"><span class="stat-value">{{ profile.followerCount }}</span><span class="stat-label">粉丝</span></div>
          <div class="stat"><span class="stat-value">{{ profile.followingCount }}</span><span class="stat-label">关注</span></div>
        </div>
        <button
          v-if="profile.id !== myUserId"
          class="follow-btn"
          :class="{ followed: profile.isFollowed }"
          @click="handleFollow"
        >{{ profile.isFollowed ? '已关注' : '+ 关注' }}</button>
      </div>

      <van-pull-refresh v-model="refreshing" @refresh="loadPosts(true)">
        <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadPosts()">
          <PostCard
            v-for="post in posts"
            :key="post.id"
            :post="{ ...post, author: { id: profile.id, nickname: profile.nickname, avatarUrl: profile.avatarUrl, role: profile.role, diabetesType: profile.diabetesType, verifyStatus: profile.verifyStatus, isAnonymous: false } }"
            @click="$router.push('/community/post/' + post.id)"
          />
          <van-empty v-if="!loading && !posts.length" description="暂无帖子" />
        </van-list>
      </van-pull-refresh>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { getUserProfile, getUserPosts, toggleFollow } from '@/api/community'
import { useUserStore } from '@/stores/user'
import { DIABETES_TYPE_LABELS, TREATMENT_PLAN_LABELS } from '@leimengyun/shared'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const userStore = useUserStore()
const targetUserId = route.params.id as string
const myUserId = computed(() => userStore.userInfo?.id || '')
const profile = ref<any>(null)
const posts = ref<any[]>([])
const page = ref(1)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

async function loadProfile() {
  try {
    profile.value = await getUserProfile(targetUserId) as any
  } catch { showFailToast('用户不存在') }
}

async function loadPosts(reset = false) {
  if (reset) { page.value = 1; finished.value = false }
  loading.value = true
  try {
    const res = (await getUserPosts(targetUserId, { page: page.value, pageSize: 20 })) as any
    if (reset) posts.value = res.list || []
    else posts.value.push(...(res.list || []))
    finished.value = !res.hasMore
    page.value++
  } catch { finished.value = true }
  finally { loading.value = false; refreshing.value = false }
}

async function handleFollow() {
  if (!profile.value) return
  const prev = profile.value.isFollowed
  profile.value.isFollowed = !prev
  profile.value.followerCount += prev ? -1 : 1
  try { await toggleFollow(targetUserId) } catch {
    profile.value.isFollowed = prev
    profile.value.followerCount += prev ? 1 : -1
    showFailToast('操作失败')
  }
}

onMounted(() => {
  loadProfile()
  loadPosts(true)
})
</script>

<style scoped>
.profile-header { text-align: center; padding: 24px 16px 20px; background: #fff; margin-bottom: 8px; }
.profile-avatar { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 600; margin: 0 auto; }
.profile-name { font-size: 20px; font-weight: 600; margin-top: 12px; }
.profile-meta { font-size: 13px; color: #969799; margin-top: 4px; display: flex; align-items: center; justify-content: center; gap: 4px; }
.doctor-badge { font-size: 10px; color: #3B82F6; background: #E8F0FE; padding: 1px 6px; border-radius: 3px; }
.profile-stats { display: flex; justify-content: center; gap: 32px; margin-top: 16px; }
.stat { text-align: center; }
.stat-value { font-size: 18px; font-weight: 700; display: block; }
.stat-label { font-size: 12px; color: #969799; }
.follow-btn { display: block; margin: 16px auto 0; padding: 6px 32px; border-radius: 20px; font-size: 14px; font-weight: 500; border: 1px solid #1AAD6E; background: #1AAD6E; color: #fff; cursor: pointer; }
.follow-btn.followed { background: #fff; color: #C8C9CC; border-color: #C8C9CC; }
</style>
