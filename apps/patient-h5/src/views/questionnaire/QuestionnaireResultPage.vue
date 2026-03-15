<template>
  <div class="result-page">
    <van-nav-bar title="问卷结果" left-arrow @click-left="$router.back()" />

    <van-loading v-if="loading" class="page-loading" />

    <template v-else-if="result">
      <!-- Header with template title -->
      <div class="result-header">
        <div class="template-title">{{ result.template?.title || '问卷结果' }}</div>
        <div class="submit-date">提交于 {{ formatDate(result.response?.submittedAt) }}</div>
      </div>

      <!-- Score circle -->
      <div v-if="result.response?.totalScore != null" class="score-section">
        <div class="score-circle" :style="{ borderColor: scoreColor }">
          <span class="score-value">{{ result.response.totalScore }}</span>
          <span class="score-total">/ {{ result.template?.totalScore }}</span>
        </div>
        <div class="score-level" :style="{ color: scoreColor }">{{ result.level?.level || levelText }}</div>
        <div v-if="result.level?.message" class="score-desc">{{ result.level.message }}</div>
      </div>

      <!-- Level description card -->
      <div v-if="result.level?.message && !result.response?.totalScore" class="card">
        <div class="card-title">评估说明</div>
        <div class="level-desc-text">{{ result.level.message }}</div>
      </div>

      <!-- Dimension scores -->
      <div v-if="dimensionList.length" class="card">
        <div class="card-title">各维度得分</div>
        <div
          v-for="dim in dimensionList"
          :key="dim.name"
          class="dimension-item"
        >
          <div class="dim-header">
            <span class="dim-name">{{ dim.name }}</span>
            <span class="dim-score">{{ dim.score }}</span>
          </div>
          <div class="dim-bar-bg">
            <div
              class="dim-bar-fill"
              :style="{
                width: maxDimScore > 0 ? (dim.score / maxDimScore * 100) + '%' : '0%',
                background: getDimColor(dim.score, maxDimScore),
              }"
            />
          </div>
        </div>
      </div>

      <!-- Doctor note -->
      <div v-if="result.response?.doctorNote" class="note-card">
        <div class="note-header">
          <span class="note-icon">📝</span>
          <span class="note-title">医生批注</span>
        </div>
        <div class="note-meta">
          {{ result.doctorName }} · {{ formatDate(result.response.notedAt) }}
        </div>
        <div class="note-content">{{ result.response.doctorNote }}</div>
      </div>

      <!-- Expandable answers section -->
      <div class="card">
        <div class="answers-header" @click="showAnswers = !showAnswers">
          <span class="card-title" style="margin-bottom: 0">查看我的答案</span>
          <van-icon :name="showAnswers ? 'arrow-up' : 'arrow-down'" />
        </div>
        <div v-if="showAnswers" class="answers-list">
          <div
            v-for="(item, idx) in answerList"
            :key="idx"
            class="answer-item"
          >
            <div class="answer-q">{{ idx + 1 }}. {{ item.questionTitle }}</div>
            <div class="answer-a">{{ formatAnswer(item.value, item.question) }}</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showFailToast } from 'vant'
import { getAssignmentResult } from '@/api/questionnaire'

const route = useRoute()
const result = ref<any>(null)
const loading = ref(true)
const showAnswers = ref(false)

const scorePercent = computed(() => {
  if (result.value?.level?.percentage != null) return Math.round(result.value.level.percentage)
  const score = result.value?.response?.totalScore
  const max = result.value?.template?.totalScore
  if (score == null || !max) return 0
  return Math.round((score / max) * 100)
})

const dimensionList = computed(() => {
  const scores = result.value?.response?.dimensionScores
  if (!scores || typeof scores !== 'object') return []
  return Object.entries(scores).map(([name, score]) => ({ name, score: score as number }))
})

const maxDimScore = computed(() => {
  if (!dimensionList.value.length) return 0
  return Math.max(...dimensionList.value.map((d) => d.score))
})

const answerList = computed(() => {
  const answers = result.value?.response?.answers || []
  const questions = result.value?.template?.questions || []
  return answers.map((a: any) => {
    const q = questions.find((q: any) => q.id === a.questionId)
    return {
      questionTitle: q?.title || a.questionId,
      value: a.value,
      question: q,
    }
  })
})

const scoreColor = computed(() => {
  const p = scorePercent.value
  if (p >= 80) return '#1AAD6E'
  if (p >= 60) return '#3B82F6'
  if (p >= 40) return '#FFB020'
  return '#FF4D4F'
})

const levelText = computed(() => {
  const p = scorePercent.value
  if (p >= 80) return '优秀'
  if (p >= 60) return '良好'
  if (p >= 40) return '一般'
  return '较差'
})

const levelDesc = computed(() => {
  const p = scorePercent.value
  if (p >= 80) return '您的健康状况非常好，请继续保持！'
  if (p >= 60) return '您的健康状况良好，仍有改善空间。'
  if (p >= 40) return '您的健康状况一般，建议关注相关指标。'
  if (p > 0) return '您的健康状况需要重点关注，请及时咨询医生。'
  return ''
})

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function formatAnswer(value: any, question: any) {
  if (!question?.options || !question.options.length) {
    if (Array.isArray(value)) return value.join('、')
    return String(value ?? '--')
  }
  if (Array.isArray(value)) {
    return value
      .map((v: string) => {
        const opt = question.options.find((o: any) => o.value === v)
        return opt?.label || v
      })
      .join('、')
  }
  const opt = question.options.find((o: any) => String(o.value) === String(value))
  return opt?.label || String(value ?? '--')
}

function getDimColor(score: number, maxScore: number) {
  if (maxScore === 0) return '#ebedf0'
  const p = (score / maxScore) * 100
  if (p >= 80) return '#1AAD6E'
  if (p >= 60) return '#3B82F6'
  if (p >= 40) return '#FFB020'
  return '#FF4D4F'
}

async function loadResult() {
  loading.value = true
  try {
    const id = route.params.id as string
    result.value = (await getAssignmentResult(id)) as any
  } catch {
    showFailToast('加载结果失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadResult)
</script>

<style scoped>
.result-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 24px;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 80px;
}

.result-header {
  background: #fff;
  padding: 20px 16px;
  text-align: center;
}

.template-title {
  font-size: 18px;
  font-weight: 700;
  color: #323233;
}

.submit-date {
  font-size: 13px;
  color: #969799;
  margin-top: 4px;
}

.score-section {
  background: #fff;
  padding: 32px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
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
  margin-bottom: 12px;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #323233;
}

.score-total {
  font-size: 14px;
  color: #969799;
}

.score-level {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.score-desc {
  font-size: 13px;
  color: #646566;
  text-align: center;
  max-width: 280px;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #323233;
}

.level-desc-text {
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
}

.dimension-item {
  margin-bottom: 16px;
}

.dimension-item:last-child {
  margin-bottom: 0;
}

.dim-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.dim-name {
  font-size: 14px;
  color: #323233;
}

.dim-score {
  font-size: 13px;
  color: #969799;
}

.dim-bar-bg {
  height: 8px;
  background: #ebedf0;
  border-radius: 4px;
  overflow: hidden;
}

.dim-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
}

.note-card {
  background: #FFF9E6;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 16px;
}

.note-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.note-icon {
  font-size: 18px;
}

.note-title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
}

.note-meta {
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.note-content {
  font-size: 14px;
  color: #646566;
  line-height: 1.6;
}

.answers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.answers-list {
  margin-top: 12px;
  border-top: 1px solid #ebedf0;
  padding-top: 12px;
}

.answer-item {
  margin-bottom: 12px;
}

.answer-item:last-child {
  margin-bottom: 0;
}

.answer-q {
  font-size: 14px;
  color: #323233;
  margin-bottom: 4px;
}

.answer-a {
  font-size: 14px;
  color: #1AAD6E;
  padding-left: 16px;
}
</style>
