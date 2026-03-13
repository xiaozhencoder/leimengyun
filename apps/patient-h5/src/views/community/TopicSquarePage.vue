<template>
  <div class="topic-square">
    <van-nav-bar title="话题广场" left-arrow @click-left="$router.back()" />
    <van-loading v-if="loading" style="display:flex;justify-content:center;padding:60px" />
    <template v-else>
      <div class="section-title">🔥 热门话题</div>
      <div class="topic-grid">
        <div v-for="t in hotTopics" :key="t.id" class="topic-grid-item" @click="$router.push('/community/topic/' + t.id)">
          <div class="topic-grid-icon">{{ t.icon }}</div>
          <div class="topic-grid-name">{{ t.name }}</div>
          <div class="topic-grid-count">{{ t.postCount }}篇</div>
        </div>
      </div>
      <div class="section-title">全部话题</div>
      <div v-for="t in topics" :key="t.id" class="topic-list-item" @click="$router.push('/community/topic/' + t.id)">
        <span class="topic-list-icon">{{ t.icon }}</span>
        <div class="topic-list-info">
          <div class="topic-list-name">{{ t.name }}</div>
          <div class="topic-list-count">{{ t.postCount }}篇帖子 · {{ t.description }}</div>
        </div>
        <span style="color:#C8C9CC">›</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getTopics } from '@/api/community'

const topics = ref<any[]>([])
const loading = ref(true)
const hotTopics = computed(() => topics.value.filter(t => t.isHot))

onMounted(async () => {
  try {
    topics.value = (await getTopics()) as unknown as any[]
  } catch { /* */ }
  finally { loading.value = false }
})
</script>

<style scoped>
.section-title { padding: 16px 16px 8px; font-size: 15px; font-weight: 600; }
.topic-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 8px 16px 12px; }
.topic-grid-item { background: #fff; border-radius: 12px; padding: 14px 8px; text-align: center; cursor: pointer; }
.topic-grid-item:active { background: #f7f8fa; }
.topic-grid-icon { font-size: 28px; }
.topic-grid-name { font-size: 13px; font-weight: 500; margin-top: 4px; }
.topic-grid-count { font-size: 11px; color: #969799; margin-top: 2px; }
.topic-list-item { display: flex; align-items: center; padding: 14px 16px; background: #fff; border-bottom: 1px solid #ebedf0; cursor: pointer; }
.topic-list-item:active { background: #f7f8fa; }
.topic-list-icon { font-size: 24px; margin-right: 12px; }
.topic-list-info { flex: 1; }
.topic-list-name { font-size: 15px; font-weight: 500; }
.topic-list-count { font-size: 12px; color: #969799; margin-top: 2px; }
</style>
