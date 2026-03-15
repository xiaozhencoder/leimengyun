<template>
  <div class="questionnaire-result">
    <van-nav-bar title="问卷结果" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading" />
    <van-empty v-else-if="!result" description="未找到结果" />
    <template v-else>
      <div class="result-header">
        <div class="result-header__title">{{ result.template?.title || '问卷' }}</div>
        <div class="result-header__info">
          <span>{{ result.patientName || '患者' }}</span>
          <span>{{ formatDateTime(result.response?.submittedAt) }}</span>
        </div>
      </div>

      <div class="score-section">
        <div class="score-circle" :style="{ borderColor: levelColor }">
          <div class="score-circle__value" :style="{ color: levelColor }">{{ result.response?.totalScore ?? '-' }}</div>
          <div class="score-circle__max">/ {{ result.template?.totalScore ?? '-' }}</div>
          <div class="score-circle__label">总分</div>
        </div>
        <div v-if="result.level" class="score-level" :style="{ color: levelColor }">{{ result.level.level }}</div>
        <div v-if="result.level?.percentage != null" class="score-percentage">
          超过{{ result.level.percentage }}%的用户
        </div>
        <div v-if="result.level?.message" class="score-message">{{ result.level.message }}</div>
      </div>

      <div v-if="dimensions.length > 0" class="dimensions-section">
        <div class="section-title">各维度得分</div>
        <div v-for="dim in dimensions" :key="dim.name" class="dimension-bar">
          <div class="dimension-bar__label">{{ dim.name }}</div>
          <div class="dimension-bar__track">
            <div
              class="dimension-bar__fill"
              :style="{ width: (dim.score / (result.template?.totalScore || 100) * 100) + '%' }"
            />
          </div>
          <div class="dimension-bar__value">{{ dim.score }}</div>
        </div>
      </div>

      <div v-if="trendData.length > 1" class="trend-section">
        <div class="section-title">历史趋势</div>
        <div class="trend-chart-wrapper">
          <svg :viewBox="`0 0 ${trendWidth} ${trendHeight}`" class="trend-svg">
            <line
              v-for="(_, i) in trendData.slice(0, -1)"
              :key="'line-' + i"
              :x1="trendX(i)"
              :y1="trendY(trendData[i].score)"
              :x2="trendX(i + 1)"
              :y2="trendY(trendData[i + 1].score)"
              stroke="#3B82F6"
              stroke-width="2"
            />
            <circle
              v-for="(point, i) in trendData"
              :key="'dot-' + i"
              :cx="trendX(i)"
              :cy="trendY(point.score)"
              r="4"
              fill="#3B82F6"
            />
            <text
              v-for="(point, i) in trendData"
              :key="'score-' + i"
              :x="trendX(i)"
              :y="trendY(point.score) - 10"
              text-anchor="middle"
              fill="#333"
              font-size="11"
              font-weight="600"
            >{{ point.score }}</text>
            <text
              v-for="(point, i) in trendData"
              :key="'date-' + i"
              :x="trendX(i)"
              :y="trendHeight - 4"
              text-anchor="middle"
              fill="#999"
              font-size="9"
            >{{ point.date }}</text>
          </svg>
        </div>
      </div>

      <div v-if="answerDetails.length > 0" class="answers-section">
        <div class="section-title">答题详情</div>
        <div v-for="(answer, idx) in answerDetails" :key="idx" class="answer-item">
          <div class="answer-item__question">
            <span class="answer-item__num">{{ idx + 1 }}.</span>
            {{ answer.questionText }}
          </div>
          <div class="answer-item__response">
            <span class="answer-item__choice">{{ answer.selectedText }}</span>
            <span v-if="answer.score != null" class="answer-item__score">{{ answer.score }}分</span>
          </div>
        </div>
      </div>

      <div v-if="result.healthData" class="health-data-card">
        <div class="section-title">健康数据</div>
        <div class="health-data-row">
          <div class="health-data-item">
            <div class="health-data-item__value">{{ result.healthData.avgValue ?? '-' }}</div>
            <div class="health-data-item__label">平均血糖</div>
          </div>
          <div class="health-data-item">
            <div class="health-data-item__value">{{ result.healthData.recordCount ?? '-' }}</div>
            <div class="health-data-item__label">记录次数</div>
          </div>
          <div class="health-data-item">
            <div class="health-data-item__value">{{ result.healthData.inRangeRate != null ? result.healthData.inRangeRate + '%' : '-' }}</div>
            <div class="health-data-item__label">达标率</div>
          </div>
        </div>
      </div>

      <div class="note-section">
        <div class="section-title">医生批注</div>
        <div v-if="result.response?.doctorNote" class="existing-note">
          <div class="existing-note__text">{{ result.response.doctorNote }}</div>
          <div v-if="result.response.notedAt" class="existing-note__date">{{ formatDateTime(result.response.notedAt) }}</div>
        </div>
        <van-field
          v-model="doctorNote"
          type="textarea"
          rows="4"
          maxlength="500"
          show-word-limit
          placeholder="请输入批注内容..."
        />
        <van-button
          type="primary"
          block
          :loading="noteSaving"
          style="margin-top: 12px"
          @click="handleSaveNote"
        >保存批注</van-button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showFailToast } from 'vant'
import { getAssignmentResult, addDoctorNote, getPatientHistory } from '@/api/questionnaire'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const result = ref<any>(null)
const doctorNote = ref('')
const noteSaving = ref(false)
const historyData = ref<any[]>([])

const trendWidth = 300
const trendHeight = 140
const trendPadding = { top: 24, bottom: 20, left: 20, right: 20 }

const dimensions = computed(() => {
  const scores = result.value?.response?.dimensionScores
  if (!scores || typeof scores !== 'object') return []
  return Object.entries(scores).map(([name, score]) => ({ name, score: score as number }))
})

const answerDetails = computed(() => {
  const answers = result.value?.response?.answers
  const questions = result.value?.template?.questions
  if (!answers || !Array.isArray(answers)) return []
  return answers.map((a: any) => {
    const q = Array.isArray(questions) ? questions.find((qq: any) => qq.id === a.questionId) : null
    let selectedText: string
    if (q?.options && Array.isArray(q.options)) {
      if (Array.isArray(a.value)) {
        selectedText = a.value
          .map((v: string) => {
            const opt = q.options.find((o: any) => o.value === v)
            return opt?.label || v
          })
          .join('、')
      } else {
        const opt = q.options.find((o: any) => String(o.value) === String(a.value))
        selectedText = opt?.label || String(a.value)
      }
    } else {
      selectedText = Array.isArray(a.value) ? a.value.join('、') : String(a.value ?? '--')
    }
    return {
      questionText: q?.title || a.questionId,
      selectedText,
      score: a.score,
    }
  })
})

const trendData = computed(() => {
  return historyData.value.map((item: any) => ({
    score: item.totalScore,
    date: item.submittedAt?.slice(5, 10) || '',
  }))
})

const levelColor = computed(() => {
  const level = result.value?.level?.level
  if (!level) return '#1AAD6E'
  if (level === '优秀' || level === '良好') return '#1AAD6E'
  if (level === '一般' || level === '中等') return '#FFB020'
  return '#FF4D4F'
})

function trendX(i: number) {
  const count = trendData.value.length
  if (count <= 1) return trendWidth / 2
  const usable = trendWidth - trendPadding.left - trendPadding.right
  return trendPadding.left + (i / (count - 1)) * usable
}

function trendY(score: number) {
  const scores = trendData.value.map((d: any) => d.score)
  const min = Math.min(...scores) - 5
  const max = Math.max(...scores) + 5
  const range = max - min || 1
  const usable = trendHeight - trendPadding.top - trendPadding.bottom
  return trendPadding.top + (1 - (score - min) / range) * usable
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function handleSaveNote() {
  const id = route.params.id as string
  noteSaving.value = true
  try {
    await addDoctorNote(id, doctorNote.value)
    showToast('批注已保存')
  } catch {
    showFailToast('保存失败')
  } finally {
    noteSaving.value = false
  }
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    const data = await getAssignmentResult(id)
    result.value = data
    doctorNote.value = (data as any)?.response?.doctorNote || ''

    const patientId = (data as any)?.patientUserId
    const category = (data as any)?.template?.category
    if (patientId) {
      try {
        const history = await getPatientHistory(patientId) as any
        if (history?.history && Array.isArray(history.history)) {
          historyData.value = category
            ? history.history.filter((h: any) => h.category === category)
            : history.history
        }
      } catch {
        // ignore history error
      }
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.questionnaire-result {
  min-height: 100vh;
  background: #F7F8FA;
  padding-bottom: 20px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 80px 0;
}

.result-header {
  background: #fff;
  padding: 16px;
  margin: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.result-header__title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
}

.result-header__info {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}

.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  margin: 0 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  border: 6px solid #1AAD6E;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.score-circle__value {
  font-size: 36px;
  font-weight: 700;
  color: #1AAD6E;
}

.score-circle__max {
  font-size: 13px;
  color: #999;
  margin-top: -4px;
}

.score-circle__label {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.score-level {
  font-size: 16px;
  font-weight: 600;
  margin-top: 12px;
}

.score-percentage {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.score-message {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.section-title {
  padding: 16px 4px 10px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.dimensions-section {
  padding: 0 12px;
  margin-top: 12px;
  background: #fff;
  margin-left: 12px;
  margin-right: 12px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  padding-bottom: 14px;
}

.dimension-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
}

.dimension-bar__label {
  width: 70px;
  font-size: 13px;
  color: #666;
  flex-shrink: 0;
}

.dimension-bar__track {
  flex: 1;
  height: 10px;
  background: #EBEDF0;
  border-radius: 5px;
  overflow: hidden;
}

.dimension-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #1AAD6E, #3B82F6);
  border-radius: 5px;
  transition: width 0.4s ease;
}

.dimension-bar__value {
  font-size: 12px;
  color: #999;
  width: 50px;
  text-align: right;
  flex-shrink: 0;
}

.trend-section {
  margin: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 0 14px 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.trend-chart-wrapper {
  width: 100%;
  overflow-x: auto;
}

.trend-svg {
  width: 100%;
  height: auto;
}

.answers-section {
  margin: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 0 14px 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.answer-item {
  padding: 10px 0;
  border-bottom: 1px solid #EBEDF0;
}

.answer-item:last-child {
  border-bottom: none;
}

.answer-item__question {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
}

.answer-item__num {
  font-weight: 600;
  color: #3B82F6;
}

.answer-item__response {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.answer-item__choice {
  font-size: 13px;
  color: #1AAD6E;
}

.answer-item__score {
  font-size: 13px;
  color: #999;
}

.health-data-card {
  margin: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 0 14px 14px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.health-data-row {
  display: flex;
  gap: 12px;
}

.health-data-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  background: #F7F8FA;
  border-radius: 8px;
}

.health-data-item__value {
  font-size: 20px;
  font-weight: 700;
  color: #3B82F6;
}

.health-data-item__label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.note-section {
  margin: 12px;
  background: #fff;
  border-radius: 12px;
  padding: 0 14px 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.existing-note {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.existing-note__text {
  font-size: 13px;
  color: #333;
  line-height: 1.5;
}

.existing-note__date {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}
</style>
