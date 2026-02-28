<template>
  <div class="home-page page-with-tabbar">
    <div class="header">
      <div class="greeting">
        <h2>你好 👋</h2>
        <p>今天也要注意血糖哦</p>
      </div>
      <div class="date">{{ today }}</div>
    </div>

    <div class="quick-actions section-card">
      <div class="section-title">快速记录</div>
      <div class="action-grid">
        <div class="action-item" @click="$router.push('/record/blood-sugar')">
          <div class="action-icon blood-sugar">🩸</div>
          <span>记录血糖</span>
        </div>
        <div class="action-item" @click="$router.push('/record/diet')">
          <div class="action-icon diet">🍚</div>
          <span>记录饮食</span>
        </div>
        <div class="action-item" @click="$router.push('/record/medication')">
          <div class="action-icon medication">💊</div>
          <span>记录用药</span>
        </div>
      </div>
    </div>

    <div class="today-stats section-card">
      <div class="section-title">今日概况</div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ dashboard.avgBloodSugar || '--' }}</div>
          <div class="stat-label">平均血糖(mmol/L)</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ dashboard.recordCount || 0 }}</div>
          <div class="stat-label">记录次数</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ dashboard.targetRate || '--' }}</div>
          <div class="stat-label">达标率</div>
        </div>
      </div>
    </div>

    <div class="chart-area section-card">
      <div class="section-title">血糖趋势</div>
      <div class="chart-placeholder">
        <p>📈 血糖趋势图</p>
        <p class="chart-hint">记录更多数据后展示趋势</p>
      </div>
    </div>

    <div class="recent-records section-card">
      <div class="section-title">最近记录</div>
      <van-empty v-if="recentRecords.length === 0" description="暂无记录" image="search" />
      <van-cell
        v-for="record in recentRecords"
        :key="record.id"
        :title="record.title"
        :value="record.value"
        :label="record.time"
      />
    </div>

    <TabBar />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import TabBar from '@/components/TabBar.vue'
import { getDashboard } from '@/api/health'

const today = new Date().toLocaleDateString('zh-CN', {
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

const dashboard = ref({
  avgBloodSugar: '',
  recordCount: 0,
  targetRate: '',
})

interface RecentRecord {
  id: string
  title: string
  value: string
  time: string
}
const recentRecords = ref<RecentRecord[]>([])

onMounted(() => {
  getDashboard()
    .then((res) => {
      dashboard.value = res.data
    })
    .catch(() => {
      /* use defaults */
    })
})
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #1aad6e, #0d8a52);
  padding: 48px 20px 32px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.greeting h2 {
  font-size: 22px;
  margin-bottom: 4px;
}

.greeting p {
  font-size: 14px;
  opacity: 0.85;
}

.date {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

.action-grid {
  display: flex;
  justify-content: space-around;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
}

.action-icon.blood-sugar {
  background: #fef0f0;
}

.action-icon.diet {
  background: #fff7e6;
}

.action-icon.medication {
  background: #e8f7ef;
}

.action-item span {
  font-size: 13px;
  color: var(--text);
}

.stats-grid {
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.stat-item {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.chart-placeholder {
  text-align: center;
  padding: 32px 0;
  color: var(--text-secondary);
}

.chart-placeholder p:first-child {
  font-size: 24px;
  margin-bottom: 8px;
}

.chart-hint {
  font-size: 12px;
}
</style>
