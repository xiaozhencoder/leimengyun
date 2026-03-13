<template>
  <div class="publish-page">
    <van-nav-bar left-text="取消" @click-left="$router.back()">
      <template #title>发布文章</template>
      <template #right>
        <van-button type="primary" size="small" round :loading="publishing" :disabled="!canPublish" @click="onPublish">
          发布
        </van-button>
      </template>
    </van-nav-bar>

    <div class="content-area">
      <input
        v-model="title"
        class="title-input"
        placeholder="输入文章标题..."
        maxlength="100"
      />
      <div class="divider"></div>
      <textarea
        v-model="content"
        class="content-input"
        placeholder="分享专业的糖尿病管理知识..."
        maxlength="10000"
      />
      <div class="word-count">{{ content.length }}/10000</div>
    </div>

    <div class="options-section">
      <div class="option-item" @click="showTopicPicker = true">
        <span class="option-icon">📌</span>
        <span class="option-label">选择话题</span>
        <span class="option-value">{{ selectedTopic?.name || '未选择' }}</span>
        <span class="option-arrow">›</span>
      </div>
    </div>

    <van-popup v-model:show="showTopicPicker" position="bottom" round style="max-height: 50vh">
      <div style="padding: 16px">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 12px">选择话题</div>
        <div
          v-for="t in topics"
          :key="t.id"
          class="topic-option"
          :class="{ selected: selectedTopic?.id === t.id }"
          @click="selectedTopic = t; showTopicPicker = false"
        >
          {{ t.icon }} {{ t.name }}
          <span style="color: #969799; font-size: 12px; margin-left: 8px">{{ t.postCount }}篇</span>
        </div>
        <div class="topic-option" @click="selectedTopic = null; showTopicPicker = false" style="color: #969799">
          不选择话题
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { createPost, getTopics } from '@/api/community'

const router = useRouter()
const title = ref('')
const content = ref('')
const selectedTopic = ref<any>(null)
const publishing = ref(false)
const showTopicPicker = ref(false)
const topics = ref<any[]>([])

const canPublish = computed(() => {
  return title.value.trim() && content.value.trim()
})

async function onPublish() {
  publishing.value = true
  try {
    const post = await createPost({
      contentType: 'DOCTOR_ARTICLE',
      title: title.value.trim(),
      content: content.value.trim(),
      topicId: selectedTopic.value?.id,
    }) as any
    showSuccessToast('发布成功')
    setTimeout(() => {
      router.replace('/community/post/' + post.id)
    }, 300)
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '发布失败')
  } finally {
    publishing.value = false
  }
}

onMounted(async () => {
  try { topics.value = (await getTopics()) as unknown as any[] } catch { /* */ }
})
</script>

<style scoped>
.publish-page { min-height: 100vh; background: #fff; }
.content-area { padding: 16px; }
.title-input { 
  width: 100%; 
  border: none; 
  outline: none; 
  font-size: 20px; 
  font-weight: 600; 
  line-height: 1.5;
  color: #323233;
  margin-bottom: 8px;
}
.title-input::placeholder { color: #C8C9CC; }
.divider { height: 1px; background: #ebedf0; margin: 8px 0 16px; }
.content-input { 
  width: 100%; 
  min-height: 300px; 
  border: none; 
  outline: none; 
  font-size: 15px; 
  line-height: 1.8; 
  resize: none; 
  color: #323233; 
}
.content-input::placeholder { color: #C8C9CC; }
.word-count { text-align: right; font-size: 12px; color: #C8C9CC; padding: 4px 0 12px; }
.options-section { border-top: 8px solid #f7f8fa; }
.option-item { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #ebedf0; cursor: pointer; }
.option-icon { font-size: 18px; margin-right: 10px; }
.option-label { font-size: 14px; color: #323233; flex: 1; }
.option-value { font-size: 13px; color: #969799; }
.option-arrow { color: #C8C9CC; margin-left: 4px; }
.topic-option { padding: 14px 16px; border-bottom: 1px solid #ebedf0; font-size: 15px; cursor: pointer; }
.topic-option:active { background: #f7f8fa; }
.topic-option.selected { color: #3B82F6; font-weight: 500; }
</style>
