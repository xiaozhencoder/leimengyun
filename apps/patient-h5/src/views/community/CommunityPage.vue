<template>
  <div class="community-page">
    <van-nav-bar title="糖友社区">
      <template #right>
        <van-icon name="notes-o" size="20" @click="$router.push('/community/topics')" />
      </template>
    </van-nav-bar>

    <div class="topic-scroll">
      <span
        v-for="topic in topics"
        :key="topic.id"
        class="topic-chip"
        :class="{ hot: topic.isHot }"
        @click="$router.push('/community/topic/' + topic.id)"
      >{{ topic.icon }} {{ topic.name }}</span>
    </div>

    <div class="checkin-card">
      <div class="checkin-left">
        <div class="checkin-days">🏆 每日血糖打卡</div>
        <div class="checkin-sub">记录血糖，坚持打卡</div>
      </div>
      <button class="checkin-btn" @click="showToast('打卡功能即将上线')">打卡</button>
    </div>

    <van-tabs v-model:active="activeTab" shrink sticky @change="onTabChange">
      <van-tab title="推荐" name="recommend" />
      <van-tab title="关注" name="following" />
      <van-tab title="医生专栏" name="doctor" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @click="$router.push('/community/post/' + post.id)"
          @like="handleLike(post)"
          @collect="handleCollect(post)"
          @comment="$router.push('/community/post/' + post.id)"
        />
        <van-empty v-if="!loading && !posts.length" description="暂无帖子" />
      </van-list>
    </van-pull-refresh>

    <div class="fab" @click="$router.push('/community/publish')">＋</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showFailToast } from 'vant'
import { getPosts, getTopics, togglePostLike, togglePostCollect } from '@/api/community'
import PostCard from '@/components/PostCard.vue'

const topics = ref<any[]>([])
const posts = ref<any[]>([])
const activeTab = ref('recommend')
const page = ref(1)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

async function loadTopics() {
  try {
    topics.value = (await getTopics()) as unknown as any[]
  } catch { /* ignore */ }
}

async function loadPosts(reset = false) {
  if (reset) {
    page.value = 1
    finished.value = false
  }
  loading.value = true
  try {
    const res = (await getPosts({ page: page.value, pageSize: 20, tab: activeTab.value })) as any
    if (reset) {
      posts.value = res.list || []
    } else {
      posts.value.push(...(res.list || []))
    }
    finished.value = !res.hasMore
    page.value++
  } catch {
    finished.value = true
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onRefresh() {
  loadPosts(true)
}

function loadMore() {
  loadPosts()
}

function onTabChange() {
  posts.value = []
  loadPosts(true)
}

async function handleLike(post: any) {
  const prev = post.isLiked
  post.isLiked = !prev
  post.likeCount += prev ? -1 : 1
  try {
    await togglePostLike(post.id)
  } catch {
    post.isLiked = prev
    post.likeCount += prev ? 1 : -1
    showFailToast('操作失败')
  }
}

async function handleCollect(post: any) {
  const prev = post.isCollected
  post.isCollected = !prev
  post.collectCount += prev ? -1 : 1
  try {
    await togglePostCollect(post.id)
  } catch {
    post.isCollected = prev
    post.collectCount += prev ? 1 : -1
    showFailToast('操作失败')
  }
}

onMounted(() => {
  loadTopics()
  loadPosts(true)
})
</script>

<style scoped>
.community-page { min-height: 100vh; background: #f7f8fa; padding-bottom: 70px; }
.topic-scroll { padding: 10px 16px; background: #fff; display: flex; gap: 8px; overflow-x: auto; border-bottom: 1px solid #ebedf0; }
.topic-scroll::-webkit-scrollbar { display: none; }
.topic-chip { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 20px; background: #E8F8F0; color: #1AAD6E; font-size: 13px; white-space: nowrap; cursor: pointer; flex-shrink: 0; font-weight: 500; }
.topic-chip:active { opacity: .7; }
.topic-chip.hot { background: #FFF0F0; color: #FF4D4F; }
.checkin-card { margin: 12px 16px; background: linear-gradient(135deg, #1AAD6E, #0d8a50); border-radius: 12px; padding: 14px 16px; color: #fff; display: flex; align-items: center; justify-content: space-between; }
.checkin-left { display: flex; flex-direction: column; gap: 2px; }
.checkin-days { font-size: 16px; font-weight: 700; }
.checkin-sub { font-size: 12px; opacity: .85; }
.checkin-btn { background: rgba(255,255,255,.95); color: #1AAD6E; border: none; border-radius: 20px; padding: 8px 20px; font-size: 14px; font-weight: 600; cursor: pointer; }
.checkin-btn:active { opacity: .7; }
.fab { position: fixed; bottom: 70px; right: 20px; width: 52px; height: 52px; background: #1AAD6E; color: #fff; border: none; border-radius: 50%; font-size: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(26,173,110,.4); cursor: pointer; z-index: 50; }
.fab:active { transform: scale(.9); }
:deep(.van-tabs__nav) { background: #fff; }
:deep(.van-tab--active) { color: #1AAD6E; }
:deep(.van-tabs__line) { background: #1AAD6E; }
</style>
