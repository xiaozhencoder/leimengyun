<template>
  <div class="post-detail-page">
    <van-nav-bar title="帖子详情" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="ellipsis" size="20" @click="showActions = true" />
      </template>
    </van-nav-bar>
    <van-loading v-if="!post" class="detail-loading" />
    <template v-else>
      <div class="page-body">
        <div class="detail-author">
          <div class="detail-avatar" :style="{ background: post.author?.isAnonymous ? '#F5F5F5' : '#E8F8F0', color: post.author?.isAnonymous ? '#969799' : '#1AAD6E' }">
            {{ post.author?.isAnonymous ? '匿' : (post.author?.nickname?.[0] || '?') }}
          </div>
          <div class="detail-author-info" @click="goToUser">
            <div class="detail-author-name">
              {{ post.author?.nickname || '用户' }}
              <span v-if="post.author?.verifyStatus === 'APPROVED'" class="doctor-badge">✓ 认证</span>
            </div>
            <div class="detail-author-meta">{{ authorMeta }}</div>
          </div>
          <button
            v-if="!post.author?.isAnonymous && post.author?.id !== myUserId"
            class="follow-btn"
            :class="{ followed: post.author?.isFollowed }"
            @click="handleFollow"
          >{{ post.author?.isFollowed ? '已关注' : '+ 关注' }}</button>
        </div>

        <div v-if="post.title" class="detail-title">{{ post.title }}</div>

        <div v-if="post.contentType === 'BLOOD_SUGAR_DIARY' && post.bloodSugarData" class="bs-diary-card" style="margin: 0 16px 12px">
          <div class="bs-diary-title">📊 血糖日记 · {{ post.bloodSugarData.date }}</div>
          <div class="bs-diary-stats">
            <div class="bs-diary-stat"><div class="bs-diary-stat-value">{{ post.bloodSugarData.average || '--' }}</div><div class="bs-diary-stat-label">均值</div></div>
            <div class="bs-diary-stat"><div class="bs-diary-stat-value">{{ post.bloodSugarData.records?.length || 0 }}次</div><div class="bs-diary-stat-label">记录</div></div>
            <div class="bs-diary-stat"><div class="bs-diary-stat-value" style="color:#1AAD6E">{{ post.bloodSugarData.inRangeRate ?? '--' }}%</div><div class="bs-diary-stat-label">达标率</div></div>
          </div>
        </div>

        <div class="detail-content">{{ post.content }}</div>

        <div v-if="post.images?.length" class="detail-images">
          <img v-for="(img, i) in post.images" :key="i" :src="img" @click="previewImage(i)" loading="lazy" alt="" />
        </div>

        <div v-if="post.topic" class="detail-topic">
          <span class="post-tag tag-green" @click="$router.push('/community/topic/' + post.topic.id)">#{{ post.topic.name }}</span>
        </div>

        <div class="detail-actions">
          <div class="post-action" :class="{ liked: post.isLiked }" @click="handleLike">
            {{ post.isLiked ? '❤' : '♡' }} {{ post.likeCount }} 点赞
          </div>
          <div class="post-action">💬 {{ post.commentCount }} 评论</div>
          <div class="post-action" :class="{ collected: post.isCollected }" @click="handleCollect">
            {{ post.isCollected ? '★' : '☆' }} {{ post.collectCount }} 收藏
          </div>
        </div>

        <div class="comments-section">
          <div class="comments-title">评论 ({{ post.commentCount }})</div>
          <van-empty v-if="!comments.length && !commentsLoading" description="暂无评论，来发表第一条评论吧" image="default" />
          <van-loading v-if="commentsLoading" style="display:flex;justify-content:center;padding:20px" />
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar" :style="{ background: comment.author.role === 'DOCTOR' ? '#E8F0FE' : '#E8F8F0', color: comment.author.role === 'DOCTOR' ? '#3B82F6' : '#1AAD6E' }">
              {{ comment.author.nickname?.[0] || '?' }}
            </div>
            <div class="comment-body">
              <div class="comment-author-name">
                {{ comment.author.nickname }}
                <span v-if="comment.author.verifyStatus === 'APPROVED'" class="doctor-badge">✓ 认证</span>
                <span v-if="comment.author.diabetesType" class="type-tag">{{ DIABETES_TYPE_LABELS[comment.author.diabetesType] || '' }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-meta-row">
                <span class="comment-time">{{ timeAgo(comment.createdAt) }}</span>
                <span class="comment-like-btn" :class="{ 'comment-liked': comment._liked }" @click="likeComment(comment)">{{ comment._liked ? '❤' : '♡' }} {{ comment.likeCount || '' }}</span>
                <span class="comment-reply-btn" @click="startReply(comment)">回复</span>
                <span v-if="comment.author.id === myUserId" class="comment-delete-btn" @click="deleteCommentById(comment)">删除</span>
              </div>
              <div v-if="comment.replies?.length" class="comment-replies">
                <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                  <span class="reply-author">{{ reply.author.nickname }}</span>
                  <span v-if="reply.author.verifyStatus === 'APPROVED'" class="doctor-badge" style="font-size:9px">✓</span>
                  <span class="reply-text"> {{ reply.content }}</span>
                  <div class="comment-meta-row" style="margin-top:4px">
                    <span class="comment-time">{{ timeAgo(reply.createdAt) }}</span>
                    <span class="comment-reply-btn" @click="startReply(comment, reply)">回复</span>
                  </div>
                </div>
                <div v-if="comment.replyCount > 3" class="view-more-replies" @click="$router.push('/community/post/' + postId)">
                  查看全部 {{ comment.replyCount }} 条回复 ›
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="comment-input-bar">
        <input
          class="comment-input"
          v-model="commentText"
          :placeholder="replyTarget ? `回复 ${replyTarget.name}...` : '写评论...'"
          @keyup.enter="submitComment"
          ref="commentInputRef"
        />
        <button class="send-btn" :disabled="!commentText.trim()" @click="submitComment">发送</button>
      </div>

      <van-action-sheet v-model:show="showActions" :actions="actionOptions" @select="onActionSelect" cancel-text="取消" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showFailToast, showImagePreview, showConfirmDialog, showSuccessToast } from 'vant'
import { getPostById, togglePostLike, togglePostCollect, toggleFollow, deletePost, deleteComment, getComments, createComment, toggleCommentLike } from '@/api/community'
import { useUserStore } from '@/stores/user'
import { DIABETES_TYPE_LABELS, TREATMENT_PLAN_LABELS } from '@leimengyun/shared'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const postId = route.params.id as string
const post = ref<any>(null)
const myUserId = computed(() => userStore.userInfo?.id || '')
const showActions = ref(false)
const comments = ref<any[]>([])
const commentsLoading = ref(false)
const commentText = ref('')
const replyTarget = ref<{ commentId: string; name: string; userId?: string } | null>(null)
const commentInputRef = ref<HTMLInputElement>()

async function loadComments() {
  commentsLoading.value = true
  try {
    const res = (await getComments(postId)) as any
    comments.value = res.list || []
  } catch { /* */ }
  finally { commentsLoading.value = false }
}

function startReply(comment: any, reply?: any) {
  const name = reply ? reply.author.nickname : comment.author.nickname
  const userId = reply ? reply.author.id : comment.author.id
  replyTarget.value = { commentId: comment.id, name, userId }
  commentInputRef.value?.focus()
}

async function submitComment() {
  const text = commentText.value.trim()
  if (!text) return
  try {
    const data: any = { content: text }
    if (replyTarget.value) {
      data.parentId = replyTarget.value.commentId
      data.replyToUserId = replyTarget.value.userId
    }
    await createComment(postId, data)
    commentText.value = ''
    replyTarget.value = null
    post.value.commentCount++
    loadComments()
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '评论失败')
  }
}

async function likeComment(comment: any) {
  const prevLiked = comment._liked || false
  comment._liked = !prevLiked
  comment.likeCount = (comment.likeCount || 0) + (prevLiked ? -1 : 1)
  try {
    await toggleCommentLike(comment.id)
  } catch {
    comment._liked = prevLiked
    comment.likeCount = (comment.likeCount || 0) + (prevLiked ? 1 : -1)
  }
}

async function deleteCommentById(comment: any) {
  try {
    await showConfirmDialog({ title: '删除评论', message: '确定删除这条评论？' })
    await deleteComment(comment.id)
    post.value.commentCount--
    loadComments()
    showSuccessToast('已删除')
  } catch { /* cancelled or error */ }
}

const actionOptions = computed(() => {
  if (post.value?.author?.id === myUserId.value) {
    return [
      { name: '删除帖子', color: '#FF4D4F' },
    ]
  }
  return [
    { name: '举报', color: '#FF4D4F' },
  ]
})

async function onActionSelect(action: any) {
  showActions.value = false
  if (action.name === '删除帖子') {
    try {
      await showConfirmDialog({ title: '删除帖子', message: '确定删除？删除后不可恢复。' })
      await deletePost(postId)
      showSuccessToast('已删除')
      setTimeout(() => router.back(), 300)
    } catch { /* cancelled */ }
  } else if (action.name === '举报') {
    showToast('已收到举报，我们会尽快处理')
  }
}

const TITLE_LABELS: Record<string, string> = {
  CHIEF: '主任医师', ASSOCIATE_CHIEF: '副主任医师', ATTENDING: '主治医师', RESIDENT: '住院医师',
}

const authorMeta = computed(() => {
  if (!post.value?.author) return ''
  const a = post.value.author
  if (a.isAnonymous) return timeAgo(post.value.createdAt)
  if (a.role === 'DOCTOR') {
    const parts = [a.hospital, a.department, TITLE_LABELS[a.title]].filter(Boolean)
    return parts.join(' · ') + ' · ' + timeAgo(post.value.createdAt)
  }
  const parts = [DIABETES_TYPE_LABELS[a.diabetesType], TREATMENT_PLAN_LABELS[a.treatmentPlan]].filter(Boolean)
  return parts.join(' · ') + ' · ' + timeAgo(post.value.createdAt)
})

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
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

function goToUser() {
  if (post.value?.author?.id && !post.value.author.isAnonymous) {
    router.push('/community/user/' + post.value.author.id)
  }
}

function previewImage(idx: number) {
  showImagePreview({ images: post.value.images, startPosition: idx })
}

async function handleLike() {
  const prev = post.value.isLiked
  post.value.isLiked = !prev
  post.value.likeCount += prev ? -1 : 1
  try { await togglePostLike(postId) } catch {
    post.value.isLiked = prev; post.value.likeCount += prev ? 1 : -1
    showFailToast('操作失败')
  }
}

async function handleCollect() {
  const prev = post.value.isCollected
  post.value.isCollected = !prev
  post.value.collectCount += prev ? -1 : 1
  try { await togglePostCollect(postId) } catch {
    post.value.isCollected = prev; post.value.collectCount += prev ? 1 : -1
    showFailToast('操作失败')
  }
}

async function handleFollow() {
  const prev = post.value.author.isFollowed
  post.value.author.isFollowed = !prev
  try { await toggleFollow(post.value.author.id) } catch {
    post.value.author.isFollowed = prev
    showFailToast('操作失败')
  }
}

onMounted(async () => {
  try {
    post.value = await getPostById(postId) as any
    loadComments()
  } catch {
    showFailToast('帖子不存在')
    router.back()
  }
})
</script>

<style scoped>
.post-detail-page { display: flex; flex-direction: column; height: 100vh; background: #fff; }
.detail-loading { display: flex; justify-content: center; padding: 80px; }
.page-body { flex: 1; overflow-y: auto; }
.detail-author { display: flex; align-items: center; gap: 10px; padding: 16px; }
.detail-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; flex-shrink: 0; }
.detail-author-info { flex: 1; cursor: pointer; }
.detail-author-name { font-size: 16px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
.detail-author-meta { font-size: 12px; color: #969799; margin-top: 2px; }
.follow-btn { font-size: 12px; color: #1AAD6E; border: 1px solid #1AAD6E; background: #fff; border-radius: 14px; padding: 4px 14px; cursor: pointer; flex-shrink: 0; }
.follow-btn.followed { color: #C8C9CC; border-color: #C8C9CC; }
.doctor-badge { display: inline-flex; align-items: center; font-size: 10px; color: #3B82F6; background: #E8F0FE; padding: 1px 6px; border-radius: 3px; }
.detail-title { font-size: 18px; font-weight: 600; padding: 0 16px 12px; }
.detail-content { font-size: 15px; line-height: 1.8; padding: 0 16px 12px; color: #323233; white-space: pre-wrap; }
.detail-images { padding: 0 16px 12px; }
.detail-images img { width: 100%; border-radius: 8px; margin-bottom: 8px; display: block; }
.detail-topic { padding: 0 16px 12px; }
.post-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 500; cursor: pointer; }
.tag-green { background: #E8F8F0; color: #1AAD6E; }
.detail-actions { display: flex; padding: 12px 16px; border-top: 1px solid #ebedf0; border-bottom: 1px solid #ebedf0; }
.post-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 4px; font-size: 13px; color: #969799; cursor: pointer; }
.post-action.liked { color: #FF4D4F; }
.post-action.collected { color: #FFB020; }
.comments-section { padding: 16px; }
.comments-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.comment-item { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #ebedf0; }
.comment-item:last-child { border-bottom: none; }
.comment-avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; flex-shrink: 0; }
.comment-body { flex: 1; min-width: 0; }
.comment-author-name { font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 4px; }
.type-tag { font-size: 10px; color: #1AAD6E; background: #E8F8F0; padding: 0 4px; border-radius: 2px; }
.comment-text { font-size: 14px; color: #323233; margin-top: 4px; line-height: 1.5; }
.comment-meta-row { display: flex; gap: 16px; margin-top: 6px; font-size: 12px; color: #969799; }
.comment-like-btn, .comment-reply-btn { cursor: pointer; }
.comment-liked { color: #FF4D4F; }
.comment-delete-btn { color: #FF4D4F; cursor: pointer; }
.comment-reply-btn { color: #1AAD6E; }
.comment-replies { background: #f7f8fa; border-radius: 8px; padding: 10px 12px; margin-top: 8px; }
.reply-item { margin-bottom: 8px; font-size: 13px; line-height: 1.5; }
.reply-item:last-child { margin-bottom: 0; }
.reply-author { color: #1AAD6E; font-weight: 500; }
.reply-text { color: #323233; }
.view-more-replies { font-size: 12px; color: #1AAD6E; cursor: pointer; margin-top: 6px; }
.comment-input-bar { display: flex; align-items: center; padding: 8px 12px; background: #fff; border-top: 1px solid #ebedf0; gap: 8px; flex-shrink: 0; }
.comment-input-bar .send-btn:disabled { opacity: 0.5; }
.comment-input { flex: 1; height: 36px; border: 1px solid #ebedf0; border-radius: 18px; padding: 0 14px; font-size: 14px; outline: none; background: #f7f8fa; }
.send-btn { height: 36px; padding: 0 16px; border-radius: 18px; background: #1AAD6E; color: #fff; border: none; font-size: 14px; cursor: pointer; }
.bs-diary-card { background: linear-gradient(135deg, #E8F8F0, #fff); border: 1px solid #d0ead9; border-radius: 10px; padding: 12px; }
.bs-diary-title { font-size: 12px; color: #1AAD6E; font-weight: 600; margin-bottom: 8px; }
.bs-diary-stats { display: flex; gap: 16px; margin-bottom: 8px; }
.bs-diary-stat { text-align: center; }
.bs-diary-stat-value { font-size: 18px; font-weight: 700; }
.bs-diary-stat-label { font-size: 10px; color: #969799; }
</style>
