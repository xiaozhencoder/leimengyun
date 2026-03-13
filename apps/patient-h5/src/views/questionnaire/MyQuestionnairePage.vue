<template>
  <div class="my-questionnaire-page">
    <van-nav-bar title="我的问卷" left-arrow @click-left="$router.back()" />

    <van-tabs v-model:active="activeTab" shrink sticky>
      <van-tab name="pending">
        <template #title>
          待填写
          <van-badge v-if="pendingCount > 0" :content="pendingCount" />
        </template>
      </van-tab>
      <van-tab title="已完成" name="completed" />
    </van-tabs>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="loadMore"
      >
        <template v-if="activeTab === 'pending'">
          <div
            v-for="item in list"
            :key="item.id"
            class="assignment-card"
          >
            <div class="card-header">
              <span class="template-title">{{ item.templateTitle || '问卷' }}</span>
              <span v-if="item.deadline" class="deadline">
                截止 {{ formatDate(item.deadline) }}
              </span>
            </div>
            <div class="card-meta">
              <span class="doctor-name">👨‍⚕️ {{ item.doctorName || '医生' }}</span>
              <span v-if="item.message" class="message-preview">{{ item.message }}</span>
            </div>
            <div class="card-info">
              <span>{{ item.questionCount || 0 }} 题</span>
              <span v-if="item.estimatedTime">
                · 约 {{ item.estimatedTime }} 分钟
              </span>
            </div>
            <van-button
              type="primary"
              size="small"
              round
              class="fill-btn"
              @click="$router.push('/questionnaire/fill/' + item.id)"
            >
              去填写
            </van-button>
          </div>
        </template>

        <template v-if="activeTab === 'completed'">
          <div
            v-for="item in list"
            :key="item.id"
            class="assignment-card completed-card"
            @click="$router.push('/questionnaire/result/' + item.id)"
          >
            <div class="card-header">
              <span class="template-title">{{ item.templateTitle || '问卷' }}</span>
              <van-tag v-if="item.hasNote" type="warning" size="medium">有批注</van-tag>
            </div>
            <div class="card-score">
              <span class="score-text">{{ item.totalScore ?? '--' }}</span>
              <span class="score-max">/ {{ item.templateTotalScore ?? '--' }}</span>
              <span
                v-if="item.totalScore != null && item.templateTotalScore"
                class="score-percent"
                :style="{ color: getScoreColor(item.totalScore / item.templateTotalScore * 100) }"
              >
                {{ Math.round(item.totalScore / item.templateTotalScore * 100) }}%
              </span>
            </div>
            <div class="card-date">
              提交于 {{ formatDate(item.submittedAt) }}
            </div>
          </div>
        </template>

        <van-empty
          v-if="!loading && list.length === 0"
          :description="activeTab === 'pending' ? '暂无待填写问卷' : '暂无已完成问卷'"
        />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getReceivedAssignments } from '@/api/questionnaire'

const activeTab = ref('pending')
const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const pendingCount = ref(0)

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getScoreColor(percent: number) {
  if (percent >= 80) return '#1AAD6E'
  if (percent >= 60) return '#3B82F6'
  if (percent >= 40) return '#FFB020'
  return '#FF4D4F'
}

async function loadList(reset = false) {
  if (reset) {
    page.value = 1
    finished.value = false
  }
  loading.value = true
  try {
    const statusMap: Record<string, string> = { pending: 'PENDING', completed: 'COMPLETED' }
    const res = (await getReceivedAssignments({
      status: statusMap[activeTab.value],
      page: page.value,
      pageSize: 20,
    })) as any
    const items = res?.list || res?.data || []
    if (reset) {
      list.value = items
    } else {
      list.value.push(...items)
    }
    if (activeTab.value === 'pending' && reset) {
      pendingCount.value = res?.total ?? items.length
    }
    finished.value = !res?.hasMore && items.length < 20
    page.value++
  } catch {
    finished.value = true
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onRefresh() {
  loadList(true)
}

function loadMore() {
  loadList()
}

watch(activeTab, () => {
  list.value = []
  loadList(true)
}, { immediate: true })
</script>

<style scoped>
.my-questionnaire-page {
  min-height: 100vh;
  background: #f7f8fa;
}

:deep(.van-tabs__nav) {
  background: #fff;
}

:deep(.van-tab--active) {
  color: #1AAD6E;
}

:deep(.van-tabs__line) {
  background: #1AAD6E;
}

.assignment-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 16px;
  position: relative;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.template-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.deadline {
  font-size: 12px;
  color: #FF4D4F;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.doctor-name {
  font-size: 13px;
  color: #646566;
}

.message-preview {
  font-size: 13px;
  color: #969799;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-info {
  font-size: 12px;
  color: #969799;
  margin-bottom: 12px;
}

.fill-btn {
  background: #1AAD6E;
  border-color: #1AAD6E;
}

.completed-card {
  cursor: pointer;
}

.completed-card:active {
  opacity: 0.7;
}

.card-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 4px;
}

.score-text {
  font-size: 24px;
  font-weight: 700;
  color: #323233;
}

.score-max {
  font-size: 14px;
  color: #969799;
}

.score-percent {
  font-size: 14px;
  font-weight: 600;
  margin-left: 8px;
}

.card-date {
  font-size: 12px;
  color: #969799;
}
</style>
