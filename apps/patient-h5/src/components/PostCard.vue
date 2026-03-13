<template>
  <div class="post-card" @click="$emit('click')">
    <div class="post-author">
      <div class="post-avatar" :style="{ background: avatarBg, color: avatarColor }">
        {{ avatarText }}
      </div>
      <div class="post-author-info">
        <div class="post-author-name">
          {{ authorName }}
          <span v-if="post.author.diabetesType && !post.author.isAnonymous" class="post-tag tag-green">
            {{ DIABETES_TYPE_LABELS[post.author.diabetesType] || '' }}
          </span>
          <span v-if="post.author.verifyStatus === 'APPROVED'" class="doctor-badge">✓ 认证</span>
        </div>
        <div class="post-author-meta">
          <template v-if="post.author.department && !post.author.isAnonymous">{{ post.author.department }} · </template>
          {{ timeAgo(post.createdAt) }}
        </div>
      </div>
      <slot name="right" />
    </div>

    <div v-if="post.contentType === 'DOCTOR_ARTICLE' && post.title" class="post-article-title">
      📝 {{ post.title }}
    </div>

    <div v-if="post.contentType === 'BLOOD_SUGAR_DIARY' && post.bloodSugarData" class="bs-diary-card">
      <div class="bs-diary-title">📊 血糖日记 · {{ post.bloodSugarData.date || '' }}</div>
      <div class="bs-diary-stats">
        <div class="bs-diary-stat">
          <div class="bs-diary-stat-value">{{ post.bloodSugarData.average || '--' }}</div>
          <div class="bs-diary-stat-label">均值</div>
        </div>
        <div class="bs-diary-stat">
          <div class="bs-diary-stat-value">{{ post.bloodSugarData.records?.length || 0 }}次</div>
          <div class="bs-diary-stat-label">记录</div>
        </div>
        <div class="bs-diary-stat">
          <div class="bs-diary-stat-value" style="color: var(--van-primary-color, #1aad6e)">
            {{ post.bloodSugarData.inRangeRate ?? '--' }}%
          </div>
          <div class="bs-diary-stat-label">达标率</div>
        </div>
      </div>
      <div class="bs-diary-points" v-if="post.bloodSugarData.records?.length">
        <span
          v-for="(r, i) in post.bloodSugarData.records.slice(0, 6)"
          :key="i"
          class="bs-point"
          :style="{ color: getBsColor(r.value) }"
        >● {{ r.value }} {{ MEASURE_TIME_LABELS[r.measureTime] || r.time || '' }}</span>
      </div>
    </div>

    <div class="post-content" :class="{ expanded: isExpanded }">{{ post.content }}</div>
    <div v-if="post.content.length > 100 && !isExpanded" class="post-expand" @click.stop="isExpanded = true">
      展开全文
    </div>

    <div v-if="post.images?.length" class="post-images" :class="imageLayoutClass">
      <img v-for="(img, i) in post.images.slice(0, 9)" :key="i" :src="img" loading="lazy" alt="" />
    </div>

    <div v-if="post.topic" class="post-topic">
      <span class="post-tag tag-green">#{{ post.topic.name }}</span>
    </div>

    <div class="post-actions">
      <div class="post-action" :class="{ liked: post.isLiked }" @click.stop="$emit('like')">
        {{ post.isLiked ? '❤' : '♡' }} {{ post.likeCount || '' }}
      </div>
      <div class="post-action" @click.stop="$emit('comment')">
        💬 {{ post.commentCount || '' }}
      </div>
      <div class="post-action" :class="{ collected: post.isCollected }" @click.stop="$emit('collect')">
        {{ post.isCollected ? '★' : '☆' }} {{ post.collectCount || '' }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DIABETES_TYPE_LABELS, MEASURE_TIME_LABELS } from '@leimengyun/shared'

const props = defineProps<{
  post: any
}>()

defineEmits<{
  click: []
  like: []
  comment: []
  collect: []
}>()

const isExpanded = ref(false)

const AVATAR_COLORS = [
  { bg: '#E8F8F0', color: '#1AAD6E' },
  { bg: '#E8F0FE', color: '#3B82F6' },
  { bg: '#FFF0F5', color: '#E91E8C' },
  { bg: '#FFF8E6', color: '#B8860B' },
  { bg: '#F0E8FE', color: '#8B5CF6' },
]

const authorName = computed(() => props.post.author?.nickname || '用户')
const avatarText = computed(() => {
  if (props.post.author?.isAnonymous) return '匿'
  return authorName.value[0] || '?'
})
const colorIdx = computed(() => {
  const id = props.post.author?.id || props.post.id || ''
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i)
  return Math.abs(hash) % AVATAR_COLORS.length
})
const avatarBg = computed(() =>
  props.post.author?.isAnonymous ? '#F5F5F5' : AVATAR_COLORS[colorIdx.value].bg
)
const avatarColor = computed(() =>
  props.post.author?.isAnonymous ? '#969799' : AVATAR_COLORS[colorIdx.value].color
)

const imageLayoutClass = computed(() => {
  const len = props.post.images?.length || 0
  if (len === 1) return 'single'
  if (len === 2) return 'double'
  return 'multi'
})

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const diff = now - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}天前`
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function getBsColor(value: number): string {
  if (value < 3.9) return '#3B82F6'
  if (value <= 7.8) return '#1AAD6E'
  if (value <= 11.1) return '#FFB020'
  return '#FF4D4F'
}
</script>

<style scoped>
.post-card { background: #fff; padding: 16px; border-bottom: 8px solid #f7f8fa; }
.post-author { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.post-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 15px; flex-shrink: 0;
}
.post-author-info { flex: 1; min-width: 0; }
.post-author-name { font-size: 15px; font-weight: 500; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.post-author-meta { font-size: 12px; color: #969799; margin-top: 1px; }
.post-tag { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 500; }
.tag-green { background: #E8F8F0; color: #1AAD6E; }
.doctor-badge { display: inline-flex; align-items: center; gap: 2px; font-size: 10px; color: #3B82F6; background: #E8F0FE; padding: 1px 6px; border-radius: 3px; }
.post-article-title { font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #323233; }
.post-content { font-size: 14px; line-height: 1.6; color: #323233; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.post-content.expanded { -webkit-line-clamp: unset; }
.post-expand { color: #1AAD6E; font-size: 13px; cursor: pointer; margin-bottom: 8px; }
.post-images { display: flex; gap: 4px; margin-bottom: 10px; flex-wrap: wrap; }
.post-images img { border-radius: 6px; object-fit: cover; background: #f0f0f0; }
.post-images.single img { width: 60%; max-height: 240px; }
.post-images.double img { width: calc(50% - 2px); height: 140px; }
.post-images.multi img { width: calc(33.33% - 3px); height: 110px; }
.post-topic { margin-bottom: 8px; }
.post-actions { display: flex; border-top: 1px solid #ebedf0; padding-top: 10px; }
.post-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 13px; color: #969799; cursor: pointer; padding: 4px 0; }
.post-action:active { opacity: .6; }
.post-action.liked { color: #FF4D4F; }
.post-action.collected { color: #FFB020; }
.bs-diary-card { background: linear-gradient(135deg, #E8F8F0, #fff); border: 1px solid #d0ead9; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
.bs-diary-title { font-size: 12px; color: #1AAD6E; font-weight: 600; margin-bottom: 8px; }
.bs-diary-stats { display: flex; gap: 16px; margin-bottom: 8px; }
.bs-diary-stat { text-align: center; }
.bs-diary-stat-value { font-size: 18px; font-weight: 700; color: #323233; }
.bs-diary-stat-label { font-size: 10px; color: #969799; }
.bs-diary-points { display: flex; gap: 6px; flex-wrap: wrap; }
.bs-point { font-size: 12px; background: #fff; padding: 2px 8px; border-radius: 10px; border: 1px solid #ebedf0; }
</style>
