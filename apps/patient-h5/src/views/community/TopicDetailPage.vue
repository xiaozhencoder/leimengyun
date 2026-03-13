<template>
  <div class="topic-detail">
    <van-nav-bar :title="topic?.name || '话题'" left-arrow @click-left="$router.back()" />
    <div v-if="topic" class="topic-header">
      <div class="topic-header-icon">{{ topic.icon }}</div>
      <div class="topic-header-name">{{ topic.name }}</div>
      <div class="topic-header-desc">{{ topic.description }}</div>
      <div class="topic-header-count">{{ topic.postCount }} 篇帖子</div>
    </div>
    <van-pull-refresh v-model="refreshing" @refresh="loadData(true)">
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadData()">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @click="$router.push('/community/post/' + post.id)"
          @like="handleLike(post)"
          @collect="handleCollect(post)"
          @comment="$router.push('/community/post/' + post.id)"
        />
        <van-empty v-if="!loading && !posts.length" description="该话题下暂无帖子" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { getTopics, getPosts, togglePostLike, togglePostCollect } from '@/api/community'
import PostCard from '@/components/PostCard.vue'

const route = useRoute()
const topicId = route.params.id as string
const topic = ref<any>(null)
const posts = ref<any[]>([])
const page = ref(1)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

async function loadData(reset = false) {
  if (reset) { page.value = 1; finished.value = false }
  loading.value = true
  try {
    const res = (await getPosts({ page: page.value, pageSize: 20, topicId })) as any
    if (reset) { posts.value = res.list || [] } else { posts.value.push(...(res.list || [])) }
    finished.value = !res.hasMore
    page.value++
  } catch { finished.value = true }
  finally { loading.value = false; refreshing.value = false }
}

async function handleLike(post: any) {
  const prev = post.isLiked; post.isLiked = !prev; post.likeCount += prev ? -1 : 1
  try { await togglePostLike(post.id) } catch { post.isLiked = prev; post.likeCount += prev ? 1 : -1; showFailToast('操作失败') }
}
async function handleCollect(post: any) {
  const prev = post.isCollected; post.isCollected = !prev; post.collectCount += prev ? -1 : 1
  try { await togglePostCollect(post.id) } catch { post.isCollected = prev; post.collectCount += prev ? 1 : -1; showFailToast('操作失败') }
}

onMounted(async () => {
  try {
    const all = (await getTopics()) as unknown as any[]
    topic.value = all.find((t: any) => t.id === topicId) || null
  } catch { /* */ }
  loadData(true)
})
</script>

<style scoped>
.topic-header { background: #1AAD6E; padding: 20px 16px; color: #fff; text-align: center; }
.topic-header-icon { font-size: 36px; }
.topic-header-name { font-size: 20px; font-weight: 700; margin-top: 4px; }
.topic-header-desc { font-size: 13px; opacity: .85; margin-top: 4px; }
.topic-header-count { font-size: 12px; opacity: .7; margin-top: 2px; }
</style>
