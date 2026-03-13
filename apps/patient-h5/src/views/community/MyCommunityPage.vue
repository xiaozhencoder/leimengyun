<template>
  <div class="my-community">
    <van-nav-bar title="我的社区" left-arrow @click-left="$router.back()" />
    <van-tabs v-model:active="activeTab" shrink sticky @change="onTabChange">
      <van-tab title="我的帖子" name="posts" />
      <van-tab title="我的收藏" name="collected" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="loadData(true)">
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadData()">
        <PostCard
          v-for="post in posts"
          :key="post.id"
          :post="activeTab === 'posts' ? { ...post, author: myAuthorInfo } : post"
          @click="$router.push('/community/post/' + post.id)"
        >
          <template v-if="activeTab === 'posts'" #right>
            <van-icon name="delete-o" size="18" color="#969799" @click.stop="confirmDelete(post)" />
          </template>
        </PostCard>
        <van-empty v-if="!loading && !posts.length" :description="activeTab === 'posts' ? '还没有发过帖子' : '还没有收藏'" />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showConfirmDialog, showSuccessToast, showFailToast } from 'vant'
import { getMyPosts, getCollectedPosts, deletePost } from '@/api/community'
import { useUserStore } from '@/stores/user'
import PostCard from '@/components/PostCard.vue'

const userStore = useUserStore()
const activeTab = ref('posts')
const posts = ref<any[]>([])
const page = ref(1)
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)

const myAuthorInfo = computed(() => ({
  id: userStore.userInfo?.id,
  nickname: userStore.nickname || '我',
  avatarUrl: (userStore.userInfo as any)?.avatarUrl,
  role: (userStore.userInfo as any)?.role || 'PATIENT',
  diabetesType: userStore.profile?.diabetesType,
  isAnonymous: false,
}))

async function loadData(reset = false) {
  if (reset) { page.value = 1; finished.value = false }
  loading.value = true
  try {
    const fn = activeTab.value === 'posts' ? getMyPosts : getCollectedPosts
    const res = (await fn({ page: page.value, pageSize: 20 })) as any
    if (reset) posts.value = res.list || []
    else posts.value.push(...(res.list || []))
    finished.value = !res.hasMore
    page.value++
  } catch { finished.value = true }
  finally { loading.value = false; refreshing.value = false }
}

function onTabChange() {
  posts.value = []
  loadData(true)
}

async function confirmDelete(post: any) {
  try {
    await showConfirmDialog({ title: '删除帖子', message: '确定要删除这条帖子吗？删除后不可恢复。' })
    await deletePost(post.id)
    posts.value = posts.value.filter(p => p.id !== post.id)
    showSuccessToast('已删除')
  } catch { /* cancelled */ }
}

onMounted(() => loadData(true))
</script>

<style scoped>
:deep(.van-tabs__nav) { background: #fff; }
:deep(.van-tab--active) { color: #1AAD6E; }
:deep(.van-tabs__line) { background: #1AAD6E; }
</style>
