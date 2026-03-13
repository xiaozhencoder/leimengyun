<template>
  <div class="publish-page">
    <van-nav-bar left-text="取消" @click-left="$router.back()">
      <template #title>发布帖子</template>
      <template #right>
        <van-button type="primary" size="small" round :loading="publishing" :disabled="!canPublish" @click="onPublish">
          发布
        </van-button>
      </template>
    </van-nav-bar>

    <div class="publish-type-tabs">
      <div class="type-tab" :class="{ active: postType === 'NORMAL' }" @click="postType = 'NORMAL'">📝 普通帖子</div>
      <div class="type-tab" :class="{ active: postType === 'BLOOD_SUGAR_DIARY' }" @click="switchToDiary()">📊 血糖日记</div>
    </div>

    <div v-if="postType === 'BLOOD_SUGAR_DIARY' && bsData" class="bs-diary-preview">
      <div class="bs-diary-card">
        <div class="bs-diary-title">📊 今日血糖数据 · {{ bsData.date }}</div>
        <div class="bs-diary-stats">
          <div class="bs-stat"><span class="bs-stat-value">{{ bsData.average }}</span><span class="bs-stat-label">均值</span></div>
          <div class="bs-stat"><span class="bs-stat-value">{{ bsData.records?.length || 0 }}次</span><span class="bs-stat-label">记录</span></div>
          <div class="bs-stat"><span class="bs-stat-value" style="color:#1AAD6E">{{ bsData.inRangeRate }}%</span><span class="bs-stat-label">达标率</span></div>
        </div>
        <div class="bs-points">
          <span v-for="(r, i) in bsData.records" :key="i" class="bs-point" :style="{ color: getBsColor(r.value) }">
            ● {{ r.value }} {{ MEASURE_TIME_LABELS[r.measureTime] || r.time || '' }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="postType === 'BLOOD_SUGAR_DIARY' && !bsData && !bsLoading" class="bs-empty-tip">
      <van-empty description="今日暂无血糖记录，请先记录血糖" image="default">
        <van-button type="primary" size="small" @click="$router.push('/record/blood-sugar')">去记录血糖</van-button>
      </van-empty>
    </div>
    <van-loading v-if="bsLoading" style="display:flex;justify-content:center;padding:30px" />

    <div class="content-area">
      <textarea
        v-model="content"
        class="content-input"
        :placeholder="postType === 'BLOOD_SUGAR_DIARY' ? '说说今天的控糖心得...' : '分享你的控糖故事...'"
        maxlength="2000"
      />
      <div class="word-count">{{ content.length }}/2000</div>
    </div>

    <van-uploader
      v-if="postType === 'NORMAL'"
      v-model="imageFiles"
      :max-count="9"
      :max-size="10 * 1024 * 1024"
      :after-read="afterImageRead"
      accept="image/*"
      multiple
      class="image-uploader"
    />

    <div class="options-section">
      <div class="option-item" @click="showTopicPicker = true">
        <span class="option-icon">📌</span>
        <span class="option-label">选择话题</span>
        <span class="option-value">{{ selectedTopic?.name || '未选择' }}</span>
        <span class="option-arrow">›</span>
      </div>
      <div class="option-item" @click="isAnonymous = !isAnonymous">
        <span class="option-icon">🔒</span>
        <span class="option-label">匿名发布</span>
        <van-switch v-model="isAnonymous" size="20" style="margin-left: auto" @click.stop />
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
import { getBloodSugars, getLocalDayRange } from '@/api/health'
import { uploadImage } from '@/api/chat'
import { MEASURE_TIME_LABELS } from '@leimengyun/shared'

const router = useRouter()
const postType = ref<'NORMAL' | 'BLOOD_SUGAR_DIARY'>('NORMAL')
const content = ref('')
const imageFiles = ref<any[]>([])
const uploadedUrls = ref<string[]>([])
const selectedTopic = ref<any>(null)
const isAnonymous = ref(false)
const publishing = ref(false)
const showTopicPicker = ref(false)
const topics = ref<any[]>([])
const bsData = ref<any>(null)
const bsLoading = ref(false)

const canPublish = computed(() => {
  if (!content.value.trim()) return false
  if (postType.value === 'BLOOD_SUGAR_DIARY' && !bsData.value) return false
  return true
})

function getBsColor(value: number): string {
  if (value < 3.9) return '#3B82F6'
  if (value <= 7.8) return '#1AAD6E'
  if (value <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

async function switchToDiary() {
  postType.value = 'BLOOD_SUGAR_DIARY'
  if (bsData.value) return
  bsLoading.value = true
  try {
    const { start, end } = getLocalDayRange()
    const records = (await getBloodSugars(1, { start, end })) as unknown as any[]
    if (records && records.length > 0) {
      const values = records.map((r: any) => r.value)
      const average = Number((values.reduce((s: number, v: number) => s + v, 0) / values.length).toFixed(1))
      const inRange = values.filter((v: number) => v >= 3.9 && v <= 10.0).length
      const now = new Date()
      bsData.value = {
        date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
        records: records.map((r: any) => {
          const d = new Date(r.recordedAt)
          return { time: `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`, value: r.value, measureTime: r.measureTime }
        }),
        average,
        inRangeRate: Math.round((inRange / values.length) * 100),
      }
    }
  } catch { /* ignore */ }
  finally { bsLoading.value = false }
}

async function afterImageRead(file: any) {
  const files = Array.isArray(file) ? file : [file]
  for (const f of files) {
    if (!f.file) continue
    f.status = 'uploading'
    f.message = '上传中...'
    try {
      const url = await uploadImage(f.file)
      uploadedUrls.value.push(url)
      f.status = 'done'
      f.message = ''
    } catch {
      f.status = 'failed'
      f.message = '上传失败'
    }
  }
}

async function onPublish() {
  publishing.value = true
  try {
    const post = await createPost({
      contentType: postType.value,
      content: content.value.trim(),
      images: postType.value === 'NORMAL' ? uploadedUrls.value : undefined,
      topicId: selectedTopic.value?.id,
      bloodSugarData: postType.value === 'BLOOD_SUGAR_DIARY' ? bsData.value : undefined,
      isAnonymous: isAnonymous.value,
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
.publish-type-tabs { display: flex; gap: 12px; padding: 16px; }
.type-tab { flex: 1; text-align: center; padding: 10px; border-radius: 10px; background: #f7f8fa; font-size: 14px; cursor: pointer; border: 2px solid transparent; }
.type-tab.active { border-color: #1AAD6E; background: #E8F8F0; color: #1AAD6E; font-weight: 600; }
.bs-diary-preview { padding: 0 16px 12px; }
.bs-diary-card { background: linear-gradient(135deg, #E8F8F0, #fff); border: 1px solid #d0ead9; border-radius: 10px; padding: 12px; }
.bs-diary-title { font-size: 12px; color: #1AAD6E; font-weight: 600; margin-bottom: 8px; }
.bs-diary-stats { display: flex; gap: 16px; margin-bottom: 8px; }
.bs-stat { text-align: center; }
.bs-stat-value { font-size: 18px; font-weight: 700; display: block; }
.bs-stat-label { font-size: 10px; color: #969799; }
.bs-points { display: flex; gap: 6px; flex-wrap: wrap; }
.bs-point { font-size: 12px; background: #fff; padding: 2px 8px; border-radius: 10px; border: 1px solid #ebedf0; }
.bs-empty-tip { padding: 16px; }
.content-area { padding: 0 16px; }
.content-input { width: 100%; min-height: 150px; border: none; outline: none; font-size: 15px; line-height: 1.6; resize: none; color: #323233; }
.content-input::placeholder { color: #C8C9CC; }
.word-count { text-align: right; font-size: 12px; color: #C8C9CC; padding: 4px 0 12px; }
.image-uploader { padding: 0 16px 12px; }
.options-section { border-top: 8px solid #f7f8fa; }
.option-item { display: flex; align-items: center; padding: 14px 16px; border-bottom: 1px solid #ebedf0; cursor: pointer; }
.option-icon { font-size: 18px; margin-right: 10px; }
.option-label { font-size: 14px; color: #323233; flex: 1; }
.option-value { font-size: 13px; color: #969799; }
.option-arrow { color: #C8C9CC; margin-left: 4px; }
.topic-option { padding: 14px 16px; border-bottom: 1px solid #ebedf0; font-size: 15px; cursor: pointer; }
.topic-option:active { background: #f7f8fa; }
.topic-option.selected { color: #1AAD6E; font-weight: 500; }
</style>
