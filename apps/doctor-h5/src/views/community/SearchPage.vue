<template>
  <div class="search-page">
    <div class="search-header">
      <van-icon name="arrow-left" size="20" class="back-btn" @click="$router.back()" />
      <div class="search-input-wrap">
        <van-icon name="search" size="16" color="#969799" />
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索帖子、话题、用户"
          autofocus
          @keyup.enter="doSearch"
        />
        <van-icon v-if="keyword" name="clear" size="16" color="#C8C9CC" @click="keyword = ''; results = null" />
      </div>
      <span class="search-btn" @click="doSearch">搜索</span>
    </div>

    <van-tabs v-if="results" v-model:active="searchType" shrink @change="doSearch">
      <van-tab title="帖子" name="post" />
      <van-tab title="话题" name="topic" />
      <van-tab title="用户" name="user" />
    </van-tabs>

    <div class="search-body">
      <template v-if="!results && !searching">
        <div v-if="searchHistory.length" class="history-section">
          <div class="history-header">
            <span class="history-title">搜索历史</span>
            <span class="history-clear" @click="clearHistory">清除</span>
          </div>
          <div class="history-tags">
            <span v-for="h in searchHistory" :key="h" class="history-tag" @click="keyword = h; doSearch()">{{ h }}</span>
          </div>
        </div>
        <div class="hot-section">
          <div class="hot-title">热门话题</div>
          <div v-for="t in hotTopics" :key="t.id" class="hot-item" @click="$router.push('/community/topic/' + t.id)">
            {{ t.icon }} {{ t.name }}
            <span class="hot-count">{{ t.postCount }}篇</span>
          </div>
        </div>
      </template>

      <van-loading v-if="searching" style="display:flex;justify-content:center;padding:40px" />

      <template v-if="results && !searching">
        <!-- Post results -->
        <template v-if="searchType === 'post'">
          <PostCard
            v-for="post in results.list"
            :key="post.id"
            :post="post"
            @click="$router.push('/community/post/' + post.id)"
          />
          <van-empty v-if="!results.list.length" description="未找到相关帖子" />
        </template>

        <!-- Topic results -->
        <template v-if="searchType === 'topic'">
          <div v-for="t in results.list" :key="t.id" class="topic-result" @click="$router.push('/community/topic/' + t.id)">
            <span class="topic-icon">{{ t.icon }}</span>
            <div class="topic-info">
              <div class="topic-name">{{ t.name }}</div>
              <div class="topic-desc">{{ t.description }} · {{ t.postCount }}篇帖子</div>
            </div>
            <span style="color:#C8C9CC">›</span>
          </div>
          <van-empty v-if="!results.list.length" description="未找到相关话题" />
        </template>

        <!-- User results -->
        <template v-if="searchType === 'user'">
          <div v-for="u in results.list" :key="u.id" class="user-result" @click="$router.push('/community/user/' + u.id)">
            <div class="user-avatar" :style="{ background: u.role === 'DOCTOR' ? '#E8F0FE' : '#E8F8F0', color: u.role === 'DOCTOR' ? '#3B82F6' : '#1AAD6E' }">
              {{ u.nickname?.[0] || '?' }}
            </div>
            <div class="user-info">
              <div class="user-name">
                {{ u.nickname }}
                <span v-if="u.verifyStatus === 'APPROVED'" class="doctor-badge">✓ 认证</span>
              </div>
              <div class="user-meta">{{ u.department || (u.diabetesType ? (({TYPE_1:'1型',TYPE_2:'2型',GESTATIONAL:'妊娠期'} as Record<string, string>)[u.diabetesType] || '') : '') }}</div>
            </div>
            <span style="color:#C8C9CC">›</span>
          </div>
          <van-empty v-if="!results.list.length" description="未找到相关用户" />
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { searchCommunity, getTopics } from '@/api/community'
import PostCard from '@/components/PostCard.vue'

const keyword = ref('')
const searchType = ref('post')
const results = ref<any>(null)
const searching = ref(false)
const hotTopics = ref<any[]>([])

const HISTORY_KEY = 'community_search_history'
const searchHistory = ref<string[]>([])

function loadHistory() {
  try {
    searchHistory.value = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]').slice(0, 10)
  } catch { searchHistory.value = [] }
}

function saveHistory(kw: string) {
  const list = [kw, ...searchHistory.value.filter(h => h !== kw)].slice(0, 10)
  searchHistory.value = list
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
}

function clearHistory() {
  searchHistory.value = []
  localStorage.removeItem(HISTORY_KEY)
}

async function doSearch() {
  const kw = keyword.value.trim()
  if (!kw) return
  saveHistory(kw)
  searching.value = true
  try {
    results.value = await searchCommunity({ keyword: kw, type: searchType.value }) as any
  } catch { results.value = { list: [], total: 0 } }
  finally { searching.value = false }
}

onMounted(async () => {
  loadHistory()
  try { hotTopics.value = ((await getTopics()) as unknown as any[]).filter(t => t.isHot) } catch { /* */ }
})
</script>

<style scoped>
.search-page { min-height: 100vh; background: #f7f8fa; }
.search-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fff; border-bottom: 1px solid #ebedf0; }
.back-btn { padding: 4px; cursor: pointer; flex-shrink: 0; }
.search-input-wrap { flex: 1; display: flex; align-items: center; gap: 6px; background: #f7f8fa; border-radius: 20px; padding: 0 12px; height: 36px; }
.search-input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; }
.search-btn { color: #3B82F6; font-size: 14px; font-weight: 500; cursor: pointer; flex-shrink: 0; padding: 4px; }
.search-body { padding: 0; }
.history-section { padding: 16px; background: #fff; margin-bottom: 8px; }
.history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.history-title { font-size: 14px; font-weight: 500; }
.history-clear { font-size: 12px; color: #969799; cursor: pointer; }
.history-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.history-tag { padding: 6px 14px; border-radius: 16px; background: #f7f8fa; font-size: 13px; color: #646566; cursor: pointer; }
.history-tag:active { background: #ebedf0; }
.hot-section { padding: 16px; background: #fff; }
.hot-title { font-size: 14px; font-weight: 500; margin-bottom: 12px; }
.hot-item { padding: 12px 0; border-bottom: 1px solid #ebedf0; font-size: 14px; cursor: pointer; display: flex; align-items: center; }
.hot-item:last-child { border-bottom: none; }
.hot-count { margin-left: auto; font-size: 12px; color: #969799; }
.topic-result { display: flex; align-items: center; padding: 14px 16px; background: #fff; border-bottom: 1px solid #ebedf0; cursor: pointer; }
.topic-result:active { background: #f7f8fa; }
.topic-icon { font-size: 24px; margin-right: 12px; }
.topic-info { flex: 1; }
.topic-name { font-size: 15px; font-weight: 500; }
.topic-desc { font-size: 12px; color: #969799; margin-top: 2px; }
.user-result { display: flex; align-items: center; padding: 14px 16px; background: #fff; border-bottom: 1px solid #ebedf0; cursor: pointer; }
.user-result:active { background: #f7f8fa; }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; margin-right: 12px; }
.user-info { flex: 1; }
.user-name { font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
.user-meta { font-size: 12px; color: #969799; margin-top: 2px; }
.doctor-badge { font-size: 10px; color: #3B82F6; background: #E8F0FE; padding: 1px 6px; border-radius: 3px; }
:deep(.van-tabs__nav) { background: #fff; }
:deep(.van-tab--active) { color: #3B82F6; }
:deep(.van-tabs__line) { background: #3B82F6; }
</style>
