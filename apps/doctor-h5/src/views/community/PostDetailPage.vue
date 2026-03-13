<template>
  <div class="post-detail-page">
    <van-nav-bar title="文章详情" left-arrow @click-left="$router.back()">
      <template #right>
        <van-icon name="ellipsis" size="20" @click="showActions = true" />
      </template>
    </van-nav-bar>
    <van-loading v-if="!post" class="detail-loading" style="display:flex;justify-content:center;padding:60px" />
    <template v-else>
      <div class="page-body">
        <div class="detail-author">
          <div class="detail-avatar">{{ post.author?.nickname?.[0] || '?' }}</div>
          <div class="detail-author-info">
            <div class="detail-author-name">
              {{ post.author?.nickname || '医生' }}
              <span v-if="post.author?.verifyStatus === 'APPROVED'" class="doctor-badge">✓ 认证</span>
            </div>
            <div class="detail-author-meta">{{ timeAgo(post.createdAt) }}</div>
          </div>
          <button
            v-if="post.author?.id && post.author?.id !== myUserId"
            class="follow-btn"
            :class="{ followed: post.author?.isFollowed }"
            @click="handleFollow"
          >{{ post.author?.isFollowed ? '已关注' : '+ 关注' }}</button>
        </div>

        <div class="detail-title">{{ post.title }}</div>
        <div class="detail-content">{{ post.content }}</div>

        <div v-if="post.topic" class="detail-topic">
          <span class="post-tag">#{{ post.topic.name }}</span>
        </div>

        <div class="detail-actions">
          <div class="post-action" :class="{ liked: post.isLiked }" @click="handleLike">
            {{ post.isLiked ? '❤' : '♡' }} {{ post.likeCount }}
          </div>
          <div class="post-action">💬 {{ post.commentCount }}</div>
          <div class="post-action" :class="{ collected: post.isCollected }" @click="handleCollect">
            {{ post.isCollected ? '★' : '☆' }} {{ post.collectCount }}
          </div>
        </div>

        <div class="comments-section">
          <div class="comments-title">评论 ({{ post.commentCount }})</div>
          <van-empty v-if="!comments.length" description="暂无评论，来发表第一条评论吧" image="default" />
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="comment-avatar" :style="{ background: comment.author.role === 'DOCTOR' ? '#E8F0FE' : '#E8F8F0', color: comment.author.role === 'DOCTOR' ? '#3B82F6' : '#1AAD6E' }">
              {{ comment.author.nickname?.[0] || '?' }}
            </div>
            <div class="comment-body">
              <div class="comment-author-name">
                {{ comment.author.nickname }}
                <span v-if="comment.author.verifyStatus === 'APPROVED'" class="doctor-badge">✓ 认证</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-meta-row">
                <span class="comment-time">{{ timeAgo(comment.createdAt) }}</span>
                <span class="comment-like-btn" @click="likeComment(comment)">♡ {{ comment.likeCount || '' }}</span>
                <span class="comment-reply-btn" @click="startReply(comment)">回复</span>
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
                <div v-if="comment.replyCount > 3" class="view-more-replies">
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

      <van-action-sheet v-model:show="showActions" :actions="[{ name: '举报', color: '#FF4D4F' }]" @select="showActions = false; showToast('已收到举报')" cancel-text="取消" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast, showToast } from 'vant'
import { getPostById, togglePostLike, togglePostCollect, toggleFollow, getComments, createComment, toggleCommentLike } from '@/api/community'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()
const postId = route.params.id as string
const post = ref<any>(null)
const comments = ref<any[]>([])
const commentText = ref('')
const myUserId = computed(() => userStore.userInfo?.id || '')
const showActions = ref(false)
const replyTarget = ref<{ commentId: string; name: string; userId?: string } | null>(null)
const commentInputRef = ref<HTMLInputElement>()

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const time = new Date(dateStr).getTime()
  const diff = now - time
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString()
}

async function loadPost() {
  try {
    post.value = (await getPostById(postId)) as any
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '加载失败')
  }
}

async function loadComments() {
  try {
    const res = (await getComments(postId)) as any
    comments.value = res.list || []
  } catch { /* */ }
}

async function handleLike() {
  if (!post.value) return
  const prev = post.value.isLiked
  post.value.isLiked = !prev
  post.value.likeCount += prev ? -1 : 1
  try {
    await togglePostLike(postId)
  } catch {
    post.value.isLiked = prev
    post.value.likeCount += prev ? 1 : -1
    showFailToast('操作失败')
  }
}

async function handleCollect() {
  if (!post.value) return
  const prev = post.value.isCollected
  post.value.isCollected = !prev
  post.value.collectCount += prev ? -1 : 1
  try {
    await togglePostCollect(postId)
  } catch {
    post.value.isCollected = prev
    post.value.collectCount += prev ? 1 : -1
    showFailToast('操作失败')
  }
}

async function handleFollow() {
  if (!post.value?.author?.id) return
  const prev = post.value.author.isFollowed
  post.value.author.isFollowed = !prev
  try { await toggleFollow(post.value.author.id) } catch {
    post.value.author.isFollowed = prev
    showFailToast('操作失败')
  }
}

function startReply(comment: any, reply?: any) {
  const name = reply ? reply.author.nickname : comment.author.nickname
  const userId = reply ? reply.author.id : comment.author.id
  replyTarget.value = { commentId: comment.id, name, userId }
  commentInputRef.value?.focus()
}

async function likeComment(comment: any) {
  try {
    await toggleCommentLike(comment.id)
    comment.likeCount = (comment.likeCount || 0) + 1
  } catch { /* */ }
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
    if (post.value) post.value.commentCount++
    loadComments()
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '评论失败')
  }
}

onMounted(() => {
  loadPost()
  loadComments()
})
</script>

<style scoped>
.post-detail-page { min-height: 100vh; background: #fff; padding-bottom: 56px; }
.page-body { padding: 16px; }
.detail-author { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.detail-avatar { width: 40px; height: 40px; border-radius: 50%; background: #E8F0FE; color: #3B82F6; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; }
.detail-author-info { flex: 1; }
.detail-author-name { font-size: 14px; font-weight: 600; color: #323233; }
.doctor-badge { font-size: 11px; color: #3B82F6; margin-left: 4px; }
.detail-author-meta { font-size: 12px; color: #969799; margin-top: 2px; }
.detail-title { font-size: 20px; font-weight: 700; line-height: 1.4; color: #323233; margin-bottom: 16px; }
.detail-content { font-size: 15px; line-height: 1.8; color: #646566; white-space: pre-wrap; margin-bottom: 16px; }
.detail-topic { margin-bottom: 16px; }
.post-tag { display: inline-flex; padding: 4px 12px; border-radius: 12px; background: #E8F0FE; color: #3B82F6; font-size: 12px; font-weight: 500; }
.detail-actions { display: flex; gap: 24px; padding: 16px 0; border-top: 1px solid #ebedf0; border-bottom: 1px solid #ebedf0; }
.post-action { font-size: 13px; color: #969799; cursor: pointer; transition: color .2s; }
.post-action.liked { color: #FF4D4F; }
.post-action.collected { color: #FFB020; }
.comments-section { padding-top: 16px; }
.comments-title { font-size: 15px; font-weight: 600; color: #323233; margin-bottom: 12px; }
.comment-item { display: flex; gap: 10px; margin-bottom: 16px; }
.comment-avatar { width: 32px; height: 32px; border-radius: 50%; background: #E8F8F0; color: #1AAD6E; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0; }
.comment-body { flex: 1; min-width: 0; }
.comment-author-name { font-size: 13px; font-weight: 600; color: #323233; margin-bottom: 4px; }
.comment-text { font-size: 14px; color: #646566; line-height: 1.5; word-break: break-word; }
.comment-meta-row { display: flex; gap: 16px; margin-top: 6px; font-size: 12px; color: #969799; }
.comment-time { }
.comment-like-btn, .comment-reply-btn { cursor: pointer; }
.comment-reply-btn { color: #3B82F6; }
.comment-replies { background: #f7f8fa; border-radius: 8px; padding: 10px 12px; margin-top: 8px; }
.reply-item { margin-bottom: 8px; font-size: 13px; line-height: 1.5; }
.reply-item:last-child { margin-bottom: 0; }
.reply-author { color: #3B82F6; font-weight: 500; }
.reply-text { color: #323233; }
.view-more-replies { font-size: 12px; color: #3B82F6; cursor: pointer; margin-top: 6px; }
.follow-btn { font-size: 12px; color: #3B82F6; border: 1px solid #3B82F6; background: #fff; border-radius: 14px; padding: 4px 14px; cursor: pointer; flex-shrink: 0; }
.follow-btn.followed { color: #C8C9CC; border-color: #C8C9CC; }
.comment-input-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 8px 16px; background: #fff; border-top: 1px solid #ebedf0; display: flex; gap: 8px; }
.comment-input { flex: 1; padding: 8px 12px; border-radius: 20px; background: #f7f8fa; border: none; outline: none; font-size: 14px; }
.send-btn { padding: 8px 20px; background: #3B82F6; color: #fff; border: none; border-radius: 20px; font-size: 14px; font-weight: 500; cursor: pointer; }
.send-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>
