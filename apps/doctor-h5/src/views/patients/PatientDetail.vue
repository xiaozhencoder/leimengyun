<template>
  <div class="detail-page">
    <van-nav-bar title="患者详情" left-arrow @click-left="router.back()">
      <template #right>
        <van-icon name="chat-o" size="20" color="#fff" @click="goChat" />
      </template>
    </van-nav-bar>

    <!-- Patient Header -->
    <div class="detail-header">
      <div class="avatar-lg">{{ patient.name.charAt(0) }}</div>
      <div class="detail-info">
        <div class="detail-name">{{ patient.name }}</div>
        <div class="detail-meta">{{ patient.gender }} · {{ patient.age }}岁 · {{ patient.diabetesType }}糖尿病 · {{ patient.treatment }}</div>
        <div class="detail-meta">确诊时间: {{ patient.diagnosisDate }} · 已管理 {{ patient.manageDays }} 天</div>
      </div>
    </div>

    <div class="detail-body">
      <!-- Today Stats -->
      <div class="card">
        <div class="card-title">今日数据</div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value bs-normal">{{ todayStats.avgBs }}</div>
            <div class="stat-label">平均血糖</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ todayStats.records }}</div>
            <div class="stat-label">记录次数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value bs-normal">{{ todayStats.targetRate }}</div>
            <div class="stat-label">达标率</div>
          </div>
        </div>
      </div>

      <!-- Blood Sugar Trend Chart Placeholder -->
      <div class="card">
        <div class="card-title">
          <span>血糖趋势</span>
          <div class="filter-tabs">
            <span
              v-for="tab in ['7天', '30天']"
              :key="tab"
              :class="['filter-tab', { active: activeFilter === tab }]"
              @click="activeFilter = tab"
            >
              {{ tab }}
            </span>
          </div>
        </div>
        <div class="chart-placeholder">
          <div class="chart-bar" v-for="(val, i) in chartData" :key="i" :style="{ height: val + '%' }">
            <span class="chart-val">{{ chartValues[i] }}</span>
          </div>
        </div>
        <div class="chart-labels">
          <span v-for="label in chartLabels" :key="label">{{ label }}</span>
        </div>
      </div>

      <!-- Health Profile -->
      <div class="card">
        <div class="card-title">健康档案</div>
        <div class="health-grid">
          <div class="health-item"><span class="health-label">身高:</span> {{ patient.height }} cm</div>
          <div class="health-item"><span class="health-label">体重:</span> {{ patient.weight }} kg</div>
          <div class="health-item"><span class="health-label">BMI:</span> {{ patient.bmi }}</div>
          <div class="health-item"><span class="health-label">治疗:</span> {{ patient.treatment }}</div>
        </div>
      </div>

      <!-- Recent Records -->
      <div class="card">
        <div class="card-title">最近记录</div>
        <div
          v-for="record in recentRecords"
          :key="record.id"
          class="record-item"
        >
          <div class="record-icon" :style="{ background: record.iconBg }">{{ record.icon }}</div>
          <div class="record-content">
            <div class="record-title">{{ record.title }}</div>
            <div class="record-meta">{{ record.time }}</div>
          </div>
          <div v-if="record.value" class="record-value" :class="'bs-' + record.level">
            {{ record.value }}
          </div>
        </div>
      </div>

      <!-- Send Message -->
      <div class="action-area">
        <van-button type="primary" block round size="large" @click="goChat">发送消息给该患者</van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  NavBar as VanNavBar,
  Icon as VanIcon,
  Button as VanButton,
} from 'vant'

const router = useRouter()
const route = useRoute()

const patient = ref({
  id: route.params.id as string,
  name: '糖友小明',
  gender: '男',
  age: 35,
  diabetesType: '1型',
  treatment: '胰岛素泵(CSII)',
  diagnosisDate: '2025-04-10',
  manageDays: 328,
  height: 175,
  weight: 68,
  bmi: 22.2,
})

const todayStats = ref({
  avgBs: 6.2,
  records: 5,
  targetRate: '80%',
})

const activeFilter = ref('7天')

const chartValues = [5.8, 6.2, 7.1, 5.5, 6.0, 7.8, 6.2]
const chartData = chartValues.map((v) => Math.round(((v - 2) / 12) * 100))
const chartLabels = ['2/22', '2/23', '2/24', '2/25', '2/26', '2/27', '2/28']

const recentRecords = ref([
  { id: '1', icon: '🩸', iconBg: '#FFF0F0', title: '午餐后血糖', time: '今天 12:30', value: 8.5, level: 'high' },
  { id: '2', icon: '🍱', iconBg: '#FFF8E6', title: '午餐 · 米饭+青菜+鸡胸肉', time: '今天 12:00 · 碳水 65g', value: null, level: '' },
  { id: '3', icon: '💊', iconBg: '#E8F8F0', title: '诺和锐 · 8U · 腹部', time: '今天 11:55', value: null, level: '' },
  { id: '4', icon: '🩸', iconBg: '#FFF0F0', title: '午餐前血糖', time: '今天 11:50', value: 5.8, level: 'normal' },
  { id: '5', icon: '🩸', iconBg: '#FFF0F0', title: '空腹血糖', time: '今天 07:00', value: 5.2, level: 'normal' },
])

function goChat() {
  router.push(`/chat/${patient.value.id}`)
}
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: var(--bg);
}

:deep(.van-nav-bar) {
  background: var(--doctor-primary);
}

:deep(.van-nav-bar .van-nav-bar__title) {
  color: #fff;
}

:deep(.van-nav-bar .van-icon) {
  color: #fff !important;
}

:deep(.van-button--primary) {
  background-color: var(--doctor-primary);
  border-color: var(--doctor-primary);
}

.detail-header {
  background: var(--doctor-primary);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-lg {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  flex-shrink: 0;
}

.detail-info {
  color: #fff;
  flex: 1;
}

.detail-name {
  font-size: 18px;
  font-weight: 600;
}

.detail-meta {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
}

.detail-body {
  padding-bottom: 20px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 16px 0;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stats-grid {
  display: flex;
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

.stat-label {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 2px;
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

.filter-tabs {
  display: flex;
  gap: 4px;
}

.filter-tab {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  cursor: pointer;
  background: var(--bg);
  color: var(--text-2);
}

.filter-tab.active {
  background: var(--doctor-primary);
  color: #fff;
}

.chart-placeholder {
  height: 140px;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 0 4px;
}

.chart-bar {
  flex: 1;
  background: linear-gradient(180deg, var(--doctor-primary), #93C5FD);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  position: relative;
  transition: height 0.3s;
}

.chart-val {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--text-2);
  white-space: nowrap;
}

.chart-labels {
  display: flex;
  gap: 8px;
  padding: 6px 4px 0;
  font-size: 10px;
  color: var(--text-3);
}

.chart-labels span {
  flex: 1;
  text-align: center;
}

.health-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  font-size: 13px;
}

.health-label {
  color: var(--text-3);
}

.record-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}

.record-item:last-child {
  border-bottom: none;
}

.record-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-right: 10px;
  flex-shrink: 0;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-title {
  font-size: 14px;
  font-weight: 500;
}

.record-meta {
  font-size: 12px;
  color: var(--text-3);
  margin-top: 2px;
}

.record-value {
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 8px;
}

.action-area {
  padding: 16px;
}
</style>
