<template>
  <div class="messages-page">
    <van-nav-bar title="消息" />

    <div class="page-body">
      <div
        v-for="conv in conversations"
        :key="conv.id"
        class="msg-item"
        @click="goChat(conv.id)"
      >
        <div class="msg-avatar">
          <div class="avatar" :style="{ background: conv.avatarBg, color: conv.avatarColor }">
            {{ conv.name.charAt(0) }}
          </div>
          <div v-if="conv.unread" class="msg-unread">
            {{ conv.unread > 99 ? '99+' : conv.unread }}
          </div>
          <div v-if="conv.isAlert && !conv.unread" class="msg-alert">!</div>
        </div>
        <div class="msg-body">
          <div class="msg-name">
            {{ conv.name }}
            <van-tag v-if="conv.tag" :type="conv.tagType" size="medium" style="margin-left: 4px;">{{ conv.tag }}</van-tag>
          </div>
          <div class="msg-preview">{{ conv.lastMessage }}</div>
        </div>
        <div class="msg-time">{{ conv.time }}</div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NavBar as VanNavBar,
  Tag as VanTag,
} from 'vant'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()

const conversations = ref([
  {
    id: 'conv-1',
    name: '糖友小明',
    lastMessage: '好的，谢谢李医生！我试试减少碳水摄入',
    time: '10:32',
    unread: 2,
    isAlert: false,
    tag: '1型',
    tagType: 'primary' as const,
    avatarBg: '#E8F8F0',
    avatarColor: '#1AAD6E',
  },
  {
    id: 'conv-2',
    name: '王大明',
    lastMessage: '[血糖记录] 15.2 mmol/L · 晚餐后',
    time: '09:15',
    unread: 0,
    isAlert: true,
    tag: '⚠ 异常',
    tagType: 'danger' as const,
    avatarBg: '#FFF0F0',
    avatarColor: '#FF4D4F',
  },
  {
    id: 'conv-3',
    name: '陈大伟',
    lastMessage: '医生，我最近换了二甲双胍缓释片，需要注意什么？',
    time: '昨天',
    unread: 0,
    isAlert: false,
    tag: '2型',
    tagType: 'primary' as const,
    avatarBg: '#FFF8E6',
    avatarColor: '#B8860B',
  },
  {
    id: 'conv-4',
    name: '林小美',
    lastMessage: '产检报告出来了，帮我看看',
    time: '周三',
    unread: 0,
    isAlert: false,
    tag: '妊娠期',
    tagType: 'primary' as const,
    avatarBg: '#F0E8FE',
    avatarColor: '#8B5CF6',
  },
  {
    id: 'conv-5',
    name: '张小丽',
    lastMessage: '谢谢医生的建议，我已经调整了基础率',
    time: '周二',
    unread: 0,
    isAlert: false,
    tag: '1型',
    tagType: 'primary' as const,
    avatarBg: '#EBF5FF',
    avatarColor: '#3B82F6',
  },
])

function goChat(id: string) {
  router.push(`/chat/${id}`)
}
</script>

<style scoped>
.messages-page {
  min-height: 100vh;
  background: var(--bg);
  padding-bottom: 60px;
}

:deep(.van-nav-bar) {
  background: var(--doctor-primary);
}

:deep(.van-nav-bar .van-nav-bar__title) {
  color: #fff;
}

.page-body {
  background: #fff;
}

.msg-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.msg-item:active {
  background: #f9f9f9;
}

.msg-avatar {
  position: relative;
  margin-right: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
}

.msg-unread {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  background: var(--danger);
  color: #fff;
  font-size: 10px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.msg-alert {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  background: var(--warning);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.msg-body {
  flex: 1;
  min-width: 0;
}

.msg-name {
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.msg-preview {
  font-size: 13px;
  color: var(--text-3);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.msg-time {
  font-size: 11px;
  color: var(--text-4);
  margin-left: 8px;
  flex-shrink: 0;
  align-self: flex-start;
  margin-top: 2px;
}
</style>
