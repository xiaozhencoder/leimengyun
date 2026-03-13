<template>
  <div class="fill-page">
    <van-nav-bar title="填写问卷" left-arrow @click-left="handleBack" />

    <van-loading v-if="pageLoading" class="page-loading" />

    <template v-else-if="assignment">
      <!-- Progress bar -->
      <div class="progress-wrap">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: progressPercent + '%' }"
          />
        </div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ questions.length }}</span>
      </div>

      <!-- Submit confirmation overlay -->
      <template v-if="showConfirm">
        <div class="confirm-overlay">
          <div class="confirm-card">
            <h3>提交确认</h3>
            <div class="confirm-stats">
              <div class="confirm-stat">
                <span class="confirm-num">{{ answeredCount }}</span>
                <span class="confirm-label">已答</span>
              </div>
              <div class="confirm-stat">
                <span class="confirm-num unanswered">{{ unansweredCount }}</span>
                <span class="confirm-label">未答</span>
              </div>
              <div class="confirm-stat">
                <span class="confirm-num">{{ formattedDuration }}</span>
                <span class="confirm-label">用时</span>
              </div>
            </div>
            <div class="confirm-actions">
              <van-button plain round @click="handleReview">检查答案</van-button>
              <van-button
                type="primary"
                round
                :loading="submitting"
                class="submit-btn"
                @click="handleSubmit"
              >
                确认提交
              </van-button>
            </div>
          </div>
        </div>
      </template>

      <!-- Question area -->
      <template v-else>
        <div class="question-area">
          <div class="question-number">第 {{ currentIndex + 1 }} 题</div>
          <div class="question-title">
            {{ currentQuestion.title }}
            <span v-if="currentQuestion.required" class="required-mark">*</span>
          </div>

          <!-- single_choice -->
          <div v-if="currentQuestion.type === 'single_choice'" class="options-list">
            <div
              v-for="(opt, idx) in currentQuestion.options"
              :key="idx"
              class="option-item"
              :class="{ selected: answers[currentQuestion.id] === opt.value }"
              @click="setAnswer(currentQuestion.id, opt.value)"
            >
              <span class="option-letter">{{ String.fromCharCode(65 + idx) }}</span>
              <span class="option-text">{{ opt.label }}</span>
            </div>
          </div>

          <!-- multiple_choice -->
          <div v-if="currentQuestion.type === 'multiple_choice'" class="options-list">
            <div
              v-for="(opt, idx) in currentQuestion.options"
              :key="idx"
              class="option-item"
              :class="{ selected: (answers[currentQuestion.id] || []).includes(opt.value) }"
              @click="toggleMultiChoice(currentQuestion.id, opt.value)"
            >
              <span class="option-check">
                {{ (answers[currentQuestion.id] || []).includes(opt.value) ? '☑' : '☐' }}
              </span>
              <span class="option-text">{{ opt.label }}</span>
            </div>
          </div>

          <!-- rating -->
          <div v-if="currentQuestion.type === 'rating'" class="rating-area">
            <div class="rating-labels">
              <span>{{ currentQuestion.min ?? 1 }} - 非常不同意</span>
              <span>{{ currentQuestion.max ?? 5 }} - 非常同意</span>
            </div>
            <div class="rating-circles">
              <div
                v-for="n in (currentQuestion.max ?? 5) - (currentQuestion.min ?? 1) + 1"
                :key="n"
                class="rating-circle"
                :class="{ selected: answers[currentQuestion.id] === (currentQuestion.min ?? 1) + n - 1 }"
                @click="setAnswer(currentQuestion.id, (currentQuestion.min ?? 1) + n - 1)"
              >
                {{ (currentQuestion.min ?? 1) + n - 1 }}
              </div>
            </div>
          </div>

          <!-- number -->
          <div v-if="currentQuestion.type === 'number'" class="input-area">
            <van-field
              :model-value="answers[currentQuestion.id]"
              type="number"
              placeholder="请输入数值"
              :label="currentQuestion.unit || ''"
              @update:model-value="(v: string) => setAnswer(currentQuestion.id, v === '' ? undefined : Number(v))"
            />
            <div v-if="currentQuestion.min != null || currentQuestion.max != null" class="range-hint">
              范围:
              {{ currentQuestion.min != null ? currentQuestion.min : '' }}
              ~
              {{ currentQuestion.max != null ? currentQuestion.max : '' }}
              {{ currentQuestion.unit || '' }}
            </div>
          </div>

          <!-- text -->
          <div v-if="currentQuestion.type === 'text'" class="input-area">
            <van-field
              :model-value="answers[currentQuestion.id] || ''"
              type="textarea"
              placeholder="请输入..."
              :maxlength="currentQuestion.maxLength || 500"
              show-word-limit
              autosize
              @update:model-value="(v: string) => setAnswer(currentQuestion.id, v)"
            />
          </div>

          <!-- date -->
          <div v-if="currentQuestion.type === 'date'" class="input-area">
            <van-field
              :model-value="answers[currentQuestion.id] || ''"
              readonly
              placeholder="请选择日期"
              right-icon="calendar-o"
              @click="showDatePicker = true"
            />
            <van-popup v-model:show="showDatePicker" position="bottom" round>
              <van-date-picker
                :model-value="datePickerValue"
                title="选择日期"
                @confirm="onDateConfirm"
                @cancel="showDatePicker = false"
              />
            </van-popup>
          </div>
        </div>

        <!-- Navigation buttons -->
        <div class="nav-buttons">
          <van-button
            v-if="currentIndex > 0"
            plain
            round
            @click="prevQuestion"
          >
            上一题
          </van-button>
          <div v-else />
          <van-button
            v-if="currentIndex < questions.length - 1"
            type="primary"
            round
            class="next-btn"
            @click="nextQuestion"
          >
            下一题
          </van-button>
          <van-button
            v-else
            type="primary"
            round
            class="next-btn"
            @click="handleFinish"
          >
            完成
          </van-button>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showFailToast, showToast } from 'vant'
import { getAssignmentDetail, submitResponse } from '@/api/questionnaire'

const route = useRoute()
const router = useRouter()

const assignment = ref<any>(null)
const questions = ref<any[]>([])
const answers = ref<Record<string, any>>({})
const currentIndex = ref(0)
const showConfirm = ref(false)
const startTime = ref(Date.now())
const submitting = ref(false)
const pageLoading = ref(true)
const showDatePicker = ref(false)

const assignmentId = computed(() => route.params.id as string)
const storageKey = computed(() => `questionnaire_answers_${assignmentId.value}`)

const currentQuestion = computed(() => questions.value[currentIndex.value] || {})

const progressPercent = computed(() => {
  if (questions.value.length === 0) return 0
  return Math.round(((currentIndex.value + 1) / questions.value.length) * 100)
})

const answeredCount = computed(() => {
  return questions.value.filter((q) => {
    const val = answers.value[q.id]
    if (val == null) return false
    if (Array.isArray(val)) return val.length > 0
    if (typeof val === 'string') return val.trim() !== ''
    return true
  }).length
})

const unansweredCount = computed(() => questions.value.length - answeredCount.value)

const formattedDuration = computed(() => {
  const sec = Math.floor((Date.now() - startTime.value) / 1000)
  const min = Math.floor(sec / 60)
  const s = sec % 60
  return `${min}:${String(s).padStart(2, '0')}`
})

const datePickerValue = computed(() => {
  const val = answers.value[currentQuestion.value?.id]
  if (val) {
    const parts = val.split('-')
    return parts
  }
  const now = new Date()
  return [String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')]
})

function setAnswer(questionId: string, value: any) {
  answers.value[questionId] = value
  saveToStorage()
}

function toggleMultiChoice(questionId: string, value: string) {
  const current = answers.value[questionId] || []
  const idx = current.indexOf(value)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(value)
  }
  answers.value[questionId] = [...current]
  saveToStorage()
}

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  const dateStr = selectedValues.join('-')
  setAnswer(currentQuestion.value.id, dateStr)
  showDatePicker.value = false
}

function prevQuestion() {
  if (currentIndex.value > 0) currentIndex.value--
}

function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) currentIndex.value++
}

function handleFinish() {
  showConfirm.value = true
}

function handleReview() {
  showConfirm.value = false
  const firstUnanswered = questions.value.findIndex((q) => {
    const val = answers.value[q.id]
    if (val == null) return true
    if (Array.isArray(val)) return val.length === 0
    if (typeof val === 'string') return val.trim() === ''
    return false
  })
  currentIndex.value = firstUnanswered >= 0 ? firstUnanswered : 0
}

async function handleSubmit() {
  const requiredUnanswered = questions.value.filter((q) => {
    if (!q.required) return false
    const val = answers.value[q.id]
    if (val == null) return true
    if (Array.isArray(val)) return val.length === 0
    if (typeof val === 'string') return val.trim() === ''
    return false
  })
  if (requiredUnanswered.length > 0) {
    showFailToast(`还有 ${requiredUnanswered.length} 道必答题未完成`)
    return
  }

  submitting.value = true
  try {
    const duration = Math.floor((Date.now() - startTime.value) / 1000)
    const answerList = Object.entries(answers.value)
      .filter(([, v]) => v != null && (Array.isArray(v) ? v.length > 0 : true))
      .map(([questionId, value]) => ({ questionId, value }))

    await submitResponse(assignmentId.value, { answers: answerList, duration })
    localStorage.removeItem(storageKey.value)
    showToast('提交成功')
    router.replace('/questionnaire/result/' + assignmentId.value)
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

function handleBack() {
  saveToStorage()
  router.back()
}

function saveToStorage() {
  try {
    localStorage.setItem(storageKey.value, JSON.stringify(answers.value))
  } catch { /* ignore */ }
}

function restoreFromStorage() {
  try {
    const saved = localStorage.getItem(storageKey.value)
    if (saved) {
      answers.value = JSON.parse(saved)
    }
  } catch { /* ignore */ }
}

async function loadAssignment() {
  pageLoading.value = true
  try {
    const res = (await getAssignmentDetail(assignmentId.value)) as any
    assignment.value = res
    questions.value = res?.template?.questions || []
    restoreFromStorage()
  } catch {
    showFailToast('加载问卷失败')
  } finally {
    pageLoading.value = false
  }
}

watch(answers, () => {
  saveToStorage()
}, { deep: true })

onMounted(() => {
  startTime.value = Date.now()
  loadAssignment()
})
</script>

<style scoped>
.fill-page {
  min-height: 100vh;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
}

.page-loading {
  display: flex;
  justify-content: center;
  padding: 80px;
}

.progress-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #ebedf0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1AAD6E, #0d8a50);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #969799;
  white-space: nowrap;
}

.question-area {
  flex: 1;
  padding: 20px 16px;
}

.question-number {
  font-size: 13px;
  color: #1AAD6E;
  font-weight: 600;
  margin-bottom: 8px;
}

.question-title {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  line-height: 1.5;
  margin-bottom: 24px;
}

.required-mark {
  color: #FF4D4F;
  margin-left: 4px;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 12px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.option-item:active {
  opacity: 0.7;
}

.option-item.selected {
  border-color: #1AAD6E;
  background: #E8F8F0;
}

.option-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #646566;
  flex-shrink: 0;
}

.option-item.selected .option-letter {
  background: #1AAD6E;
  color: #fff;
}

.option-check {
  font-size: 20px;
  color: #c8c9cc;
  flex-shrink: 0;
}

.option-item.selected .option-check {
  color: #1AAD6E;
}

.option-text {
  font-size: 15px;
  color: #323233;
}

.rating-area {
  padding: 8px 0;
}

.rating-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
  margin-bottom: 16px;
}

.rating-circles {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.rating-circle {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #ebedf0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #646566;
  cursor: pointer;
  transition: all 0.2s;
}

.rating-circle:active {
  transform: scale(0.9);
}

.rating-circle.selected {
  border-color: #1AAD6E;
  background: #1AAD6E;
  color: #fff;
}

.input-area {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.range-hint {
  font-size: 12px;
  color: #969799;
  padding: 0 16px 12px;
}

.nav-buttons {
  display: flex;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
  border-top: 1px solid #ebedf0;
}

.next-btn {
  background: #1AAD6E;
  border-color: #1AAD6E;
}

.confirm-overlay {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.confirm-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px 24px;
  width: 100%;
  max-width: 360px;
  text-align: center;
}

.confirm-card h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 24px;
  color: #323233;
}

.confirm-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 28px;
}

.confirm-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.confirm-num {
  font-size: 28px;
  font-weight: 700;
  color: #1AAD6E;
}

.confirm-num.unanswered {
  color: #FF4D4F;
}

.confirm-label {
  font-size: 13px;
  color: #969799;
  margin-top: 4px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.confirm-actions .van-button {
  flex: 1;
}

.submit-btn {
  background: #1AAD6E;
  border-color: #1AAD6E;
}
</style>
