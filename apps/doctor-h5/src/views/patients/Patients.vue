<template>
  <div class="patients-page">
    <van-nav-bar title="我的患者">
      <template #right>
        <van-icon name="bell" size="20" color="#fff" />
      </template>
    </van-nav-bar>

    <van-search v-model="searchText" placeholder="搜索患者姓名" shape="round" />

    <div class="page-body">
      <!-- Stats Summary -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value primary">{{ stats.totalPatients }}</div>
          <div class="stat-label">管理患者数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value warning">{{ stats.todayAlerts }}</div>
          <div class="stat-label">今日异常</div>
        </div>
        <div class="stat-item">
          <div class="stat-value danger">{{ stats.pending }}</div>
          <div class="stat-label">待处理</div>
        </div>
      </div>

      <!-- Pending Bind Requests -->
      <div v-if="pendingRequests.length" class="section">
        <div class="section-title">
          待处理 <van-badge :content="pendingRequests.length" />
        </div>
        <div
          v-for="req in pendingRequests"
          :key="req.id"
          class="patient-card"
        >
          <div class="avatar" :style="{ background: req.avatarBg, color: req.avatarColor }">
            {{ req.name.charAt(0) }}
          </div>
          <div class="patient-info">
            <div class="patient-name">{{ req.name }}</div>
            <div class="patient-meta">申请绑定 · {{ req.time }}</div>
          </div>
          <div class="request-actions">
            <van-button type="primary" size="small" @click.stop="handleAccept(req.id)">通过</van-button>
            <van-button size="small" @click.stop="handleReject(req.id)">拒绝</van-button>
          </div>
        </div>
      </div>

      <!-- Alert Patients -->
      <div v-if="alertPatients.length" class="section">
        <div class="section-title">⚠️ 血糖异常患者</div>
        <div
          v-for="patient in alertPatients"
          :key="patient.id"
          class="patient-card"
          @click="goDetail(patient.id)"
        >
          <div class="avatar" :style="{ background: patient.avatarBg, color: patient.avatarColor }">
            {{ patient.name.charAt(0) }}
          </div>
          <div class="patient-info">
            <div class="patient-name">
              {{ patient.name }}
              <van-tag :type="patient.alertType === 'high' ? 'danger' : 'warning'" size="medium">
                {{ patient.alertLabel }}
              </van-tag>
            </div>
            <div class="patient-tags">
              <van-tag type="primary" plain size="medium">{{ patient.diabetesType }}</van-tag>
              <van-tag type="success" plain size="medium">{{ patient.treatment }}</van-tag>
            </div>
            <div class="patient-stats">
              <span>最近血糖: <strong :class="'bs-' + patient.alertType">{{ patient.latestBs }}</strong> mmol/L</span>
              <span>{{ patient.bsTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- All Patients -->
      <div class="section">
        <div class="section-title">全部患者</div>
        <div
          v-for="patient in filteredPatients"
          :key="patient.id"
          class="patient-card"
          @click="goDetail(patient.id)"
        >
          <div class="avatar" :style="{ background: patient.avatarBg, color: patient.avatarColor }">
            {{ patient.name.charAt(0) }}
          </div>
          <div class="patient-info">
            <div class="patient-name">{{ patient.name }}</div>
            <div class="patient-tags">
              <van-tag type="primary" plain size="medium">{{ patient.diabetesType }}</van-tag>
              <van-tag type="success" plain size="medium">{{ patient.treatment }}</van-tag>
            </div>
            <div class="patient-stats">
              <span>今日: <strong :class="'bs-' + patient.bsLevel">{{ patient.avgBs }}</strong> 均值</span>
              <span>{{ patient.recordCount }}次记录</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import {
  NavBar as VanNavBar,
  Search as VanSearch,
  Icon as VanIcon,
  Tag as VanTag,
  Badge as VanBadge,
  Button as VanButton,
} from 'vant'
import TabBar from '@/components/TabBar.vue'

const router = useRouter()
const searchText = ref('')

const stats = ref({
  totalPatients: 28,
  todayAlerts: 5,
  pending: 2,
})

const pendingRequests = ref([
  {
    id: 'req-1',
    name: '赵小红',
    time: '2分钟前',
    avatarBg: '#FFF0F5',
    avatarColor: '#E91E8C',
  },
])

const alertPatients = ref([
  {
    id: 'p-alert-1',
    name: '王大明',
    diabetesType: '1型',
    treatment: 'CSII',
    alertType: 'danger',
    alertLabel: '高血糖',
    latestBs: 15.2,
    bsTime: '30分钟前',
    avatarBg: '#FFF0F0',
    avatarColor: '#FF4D4F',
  },
  {
    id: 'p-alert-2',
    name: '张小丽',
    diabetesType: '1型',
    treatment: 'MDI',
    alertType: 'low',
    alertLabel: '偏低',
    latestBs: 3.2,
    bsTime: '1小时前',
    avatarBg: '#EBF5FF',
    avatarColor: '#3B82F6',
  },
])

const allPatients = ref([
  {
    id: 'p-1',
    name: '糖友小明',
    diabetesType: '1型',
    treatment: 'CSII',
    avgBs: 6.2,
    bsLevel: 'normal',
    recordCount: 5,
    avatarBg: '#E8F8F0',
    avatarColor: '#1AAD6E',
  },
  {
    id: 'p-2',
    name: '陈大伟',
    diabetesType: '2型',
    treatment: '口服药',
    avgBs: 7.0,
    bsLevel: 'normal',
    recordCount: 3,
    avatarBg: '#FFF8E6',
    avatarColor: '#B8860B',
  },
  {
    id: 'p-3',
    name: '林小美',
    diabetesType: '妊娠期',
    treatment: 'MDI',
    avgBs: 7.8,
    bsLevel: 'high',
    recordCount: 4,
    avatarBg: '#F0E8FE',
    avatarColor: '#8B5CF6',
  },
  {
    id: 'p-4',
    name: '刘强',
    diabetesType: '2型',
    treatment: '生活方式',
    avgBs: 5.9,
    bsLevel: 'normal',
    recordCount: 2,
    avatarBg: '#E8F8F0',
    avatarColor: '#1AAD6E',
  },
])

const filteredPatients = computed(() => {
  if (!searchText.value) return allPatients.value
  return allPatients.value.filter((p) => p.name.includes(searchText.value))
})

function goDetail(id: string) {
  router.push(`/patients/${id}`)
}

function handleAccept(id: string) {
  pendingRequests.value = pendingRequests.value.filter((r) => r.id !== id)
  showToast('已通过绑定申请')
}

function handleReject(id: string) {
  pendingRequests.value = pendingRequests.value.filter((r) => r.id !== id)
  showToast('已拒绝')
}
</script>

<style scoped>
.patients-page {
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

.stats-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  margin: 12px 16px;
  padding: 16px 0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-item + .stat-item {
  border-left: 1px solid var(--border);
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.stat-value.primary {
  color: var(--doctor-primary);
}

.stat-value.warning {
  color: var(--warning);
}

.stat-value.danger {
  color: var(--danger);
}

.stat-label {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
}

.section {
  margin-top: 4px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  padding: 16px 16px 10px;
  color: var(--text-1);
  display: flex;
  align-items: center;
  gap: 6px;
}

.patient-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.patient-card:active {
  background: #f9f9f9;
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
  flex-shrink: 0;
}

.patient-info {
  flex: 1;
  margin-left: 12px;
  min-width: 0;
}

.patient-name {
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.patient-meta {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}

.patient-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.patient-stats {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-3);
}

.patient-stats strong {
  font-size: 13px;
}

.bs-normal {
  color: #1AAD6E;
}

.bs-high {
  color: #FFB020;
}

.bs-danger {
  color: #FF4D4F;
}

.bs-low {
  color: #3B82F6;
}

.request-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

:deep(.van-button--primary) {
  background-color: var(--doctor-primary);
  border-color: var(--doctor-primary);
}

.page-body {
  overflow-y: auto;
}
</style>
