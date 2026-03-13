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

    <div class="fab" @click="$router.push('/community/publish')">📝</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showFailToast } from 'vant'
import { getPosts, getTopics, togglePostLike, togglePostCollect } from '@/api/community'
import PostCard from '@/components/PostCard.vue'

const topics = ref<any[]>([])
const posts = ref<any[]>([])
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
    const res = (await getPosts({ page: page.value, pageSize: 20 })) as any
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
.fab { position: fixed; bottom: 70px; right: 20px; width: 52px; height: 52px; background: #3B82F6; color: #fff; border: none; border-radius: 50%; font-size: 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(59,130,246,.4); cursor: pointer; z-index: 50; }
.fab:active { transform: scale(.9); }
:deep(.van-tabs__nav) { background: #fff; }
:deep(.van-tab--active) { color: #3B82F6; }
:deep(.van-tabs__line) { background: #3B82F6; }
</style>
