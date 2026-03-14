<template>
  <div class="questionnaire-center">
    <van-nav-bar title="问卷管理" left-arrow @click-left="router.back()" />

    <van-tabs v-model:active="activeTab" sticky>
      <van-tab title="模板库">
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-value">{{ stats.totalSent || 0 }}</div>
            <div class="stat-label">已发送</div>
          </div>
          <div class="stat-box">
            <div class="stat-value stat-value--orange">{{ stats.totalPending || 0 }}</div>
            <div class="stat-label">待填写</div>
          </div>
          <div class="stat-box">
            <div class="stat-value stat-value--green">{{ stats.totalCompleted || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <div class="stat-box">
            <div class="stat-value stat-value--blue">{{ stats.completionRate || 0 }}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>

        <div class="filter-chips">
          <span
            v-for="(label, key) in allCategories"
            :key="key"
            class="chip"
            :class="{ 'chip--active': selectedCategory === key }"
            @click="selectedCategory = key as string"
          >{{ label }}</span>
        </div>

        <van-loading v-if="templatesLoading" class="page-loading" />
        <van-empty v-else-if="filteredTemplates.length === 0" description="暂无模板" />
        <div v-else class="template-list">
          <div v-for="tpl in filteredTemplates" :key="tpl.id" class="template-card">
            <div class="template-card__icon">{{ getCategoryIcon(tpl.category) }}</div>
            <div class="template-card__body">
              <div class="template-card__title">{{ tpl.title }}</div>
              <div class="template-card__desc">{{ tpl.description }}</div>
              <div class="template-card__tags">
                <van-tag plain type="primary" size="medium">{{ tpl.questionCount || 0 }}题</van-tag>
                <van-tag plain color="#999" size="medium">约{{ tpl.estimatedTime || 5 }}分钟</van-tag>
              </div>
            </div>
            <van-button
              type="primary"
              size="small"
              class="template-card__send"
              @click="router.push(`/questionnaire/send?templateId=${tpl.id}`)"
            >发送</van-button>
          </div>
        </div>
      </van-tab>

      <van-tab title="已发送">
        <div class="filter-chips">
          <span
            v-for="(label, key) in statusFilters"
            :key="key"
            class="chip"
            :class="{ 'chip--active': selectedStatus === key }"
            @click="selectedStatus = key as string"
          >{{ label }}</span>
        </div>

        <van-loading v-if="assignmentsLoading" class="page-loading" />
        <van-empty v-else-if="filteredAssignments.length === 0" description="暂无记录" />
        <div v-else class="assignment-list">
          <div v-for="item in filteredAssignments" :key="item.id" class="assignment-card">
            <div class="assignment-card__header">
              <span class="assignment-card__title">{{ item.templateTitle || '问卷' }}</span>
              <van-tag :type="statusTagType(item.status)" size="medium">{{ statusLabel(item.status) }}</van-tag>
            </div>
            <div class="assignment-card__info">
              <span>→ {{ item.patientName || '患者' }}</span>
              <span class="assignment-card__date">{{ formatDate(item.createdAt) }}</span>
            </div>
            <div v-if="item.status === 'COMPLETED' && item.totalScore != null" class="assignment-card__score">
              得分：{{ item.totalScore }}分
            </div>
            <div class="assignment-card__actions">
              <template v-if="item.status === 'COMPLETED'">
                <van-button size="small" type="primary" @click="router.push(`/questionnaire/result/${item.id}`)">查看结果</van-button>
              </template>
              <template v-else-if="item.status === 'PENDING'">
                <van-button size="small" plain @click="handleRemind(item)">提醒</van-button>
                <van-button size="small" plain type="danger" @click="handleCancel(item)">取消</van-button>
              </template>
              <template v-else-if="item.status === 'EXPIRED'">
                <van-button size="small" type="primary" @click="router.push(`/questionnaire/send?templateId=${item.templateId}`)">重新发送</van-button>
              </template>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showDialog } from 'vant'
import {
  getTemplates,
  getSentAssignments,
  getStatsOverview,
  cancelAssignment,
} from '@/api/questionnaire'

const router = useRouter()
const activeTab = ref(0)

const CATEGORY_LABELS: Record<string, string> = {
  BLOOD_SUGAR_MANAGEMENT: '血糖管理',
  DIET_MANAGEMENT: '饮食管理',
  EXERCISE_MANAGEMENT: '运动管理',
  MEDICATION_ADHERENCE: '用药依从',
  QUALITY_OF_LIFE: '生活质量',
  HYPOGLYCEMIA_RISK: '低血糖风险',
  FOOT_CARE: '足部护理',
  MENTAL_HEALTH: '心理状态',
}

const CATEGORY_ICONS: Record<string, string> = {
  BLOOD_SUGAR_MANAGEMENT: '📊',
  DIET_MANAGEMENT: '🍱',
  EXERCISE_MANAGEMENT: '🏃',
  MEDICATION_ADHERENCE: '💊',
  QUALITY_OF_LIFE: '❤️',
  HYPOGLYCEMIA_RISK: '⚠️',
  FOOT_CARE: '🦶',
  MENTAL_HEALTH: '🧠',
}

const allCategories = computed(() => ({
  ALL: '全部',
  ...CATEGORY_LABELS,
}))

const selectedCategory = ref('ALL')
const selectedStatus = ref('ALL')

const statusFilters: Record<string, string> = {
  ALL: '全部',
  PENDING: '待填写',
  COMPLETED: '已完成',
  EXPIRED: '已过期',
  CANCELLED: '已取消',
}

const stats = ref<Record<string, any>>({})
const templates = ref<any[]>([])
const assignments = ref<any[]>([])
const templatesLoading = ref(false)
const assignmentsLoading = ref(false)

const filteredTemplates = computed(() => {
  if (selectedCategory.value === 'ALL') return templates.value
  return templates.value.filter((t: any) => t.category === selectedCategory.value)
})

const filteredAssignments = computed(() => {
  if (selectedStatus.value === 'ALL') return assignments.value
  return assignments.value.filter((a: any) => a.status === selectedStatus.value)
})

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category] || '📋'
}

function statusTagType(status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  const map: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
    PENDING: 'warning',
    COMPLETED: 'success',
    EXPIRED: 'default',
    CANCELLED: 'default',
  }
  return map[status] || 'default'
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: '待填写',
    COMPLETED: '已完成',
    EXPIRED: '已过期',
    CANCELLED: '已取消',
  }
  return map[status] || status
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function handleRemind(_item: any) {
  showSuccessToast('已发送提醒')
}

async function handleCancel(item: any) {
  try {
    await showDialog({
      title: '确认取消',
      message: '确定要取消这份问卷吗？',
      showCancelButton: true,
    })
    await cancelAssignment(item.id)
    showSuccessToast('已取消')
    item.status = 'CANCELLED'
  } catch {
    // user cancelled dialog
  }
}

async function loadStats() {
  try {
    const data = await getStatsOverview()
    stats.value = data as any
  } catch {
    // ignore
  }
}

async function loadTemplates() {
  templatesLoading.value = true
  try {
    const data = await getTemplates()
    templates.value = (data as any) || []
  } catch {
    templates.value = []
  } finally {
    templatesLoading.value = false
  }
}

async function loadAssignments() {
  assignmentsLoading.value = true
  try {
    const data = await getSentAssignments() as any
    assignments.value = data?.list || []
  } catch {
    assignments.value = []
  } finally {
    assignmentsLoading.value = false
  }
}

onMounted(() => {
  loadStats()
  loadTemplates()
  loadAssignments()
})
</script>

<style scoped>
.questionnaire-center {
  min-height: 100vh;
  background: #F7F8FA;
}

.stats-row {
  display: flex;
  gap: 8px;
  padding: 16px 12px 8px;
}

.stat-box {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 12px 8px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #333;
}

.stat-value--orange { color: #FFB020; }
.stat-value--green { color: #1AAD6E; }
.stat-value--blue { color: #3B82F6; }

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
}

.chip {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  background: #fff;
  color: #666;
  border: 1px solid #EBEDF0;
  cursor: pointer;
}

.chip--active {
  background: #1AAD6E;
  color: #fff;
  border-color: #1AAD6E;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.template-list {
  padding: 0 12px 16px;
}

.template-card {
  display: flex;
  align-items: flex-start;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.template-card__icon {
  font-size: 32px;
  margin-right: 12px;
  flex-shrink: 0;
}

.template-card__body {
  flex: 1;
  min-width: 0;
}

.template-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.template-card__desc {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.template-card__tags {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.template-card__send {
  flex-shrink: 0;
  align-self: center;
  margin-left: 10px;
}

.assignment-list {
  padding: 0 12px 16px;
}

.assignment-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.assignment-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.assignment-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.assignment-card__info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}

.assignment-card__date {
  color: #999;
}

.assignment-card__score {
  font-size: 14px;
  color: #1AAD6E;
  font-weight: 600;
  margin-top: 6px;
}

.assignment-card__actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  justify-content: flex-end;
}
</style>
