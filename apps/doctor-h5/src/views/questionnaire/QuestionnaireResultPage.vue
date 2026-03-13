<template>
  <div class="questionnaire-result">
    <van-nav-bar title="问卷结果" left-arrow @click-left="router.back()" />

    <van-loading v-if="loading" class="page-loading" />
    <van-empty v-else-if="!result" description="未找到结果" />
    <template v-else>
      <div class="result-header">
        <div class="result-header__title">{{ result.template?.title || '问卷' }}</div>
        <div class="result-header__info">
          <span>{{ result.patient?.realName || '患者' }}</span>
          <span>{{ formatDateTime(result.submittedAt) }}</span>
        </div>
      </div>

      <div class="score-section">
        <div class="score-circle">
          <div class="score-circle__value">{{ result.totalScore ?? '-' }}</div>
          <div class="score-circle__label">总分</div>
        </div>
        <div v-if="result.scoreLevel" class="score-level">{{ result.scoreLevel }}</div>
        <div v-if="result.scorePercentage != null" class="score-percentage">
          超过{{ result.scorePercentage }}%的用户
        </div>
      </div>

      <div v-if="result.dimensions && result.dimensions.length > 0" class="dimensions-section">
        <div class="section-title">各维度得分</div>
        <div v-for="dim in result.dimensions" :key="dim.name" class="dimension-bar">
          <div class="dimension-bar__label">{{ dim.name }}</div>
          <div class="dimension-bar__track">
            <div
              class="dimension-bar__fill"
              :style="{ width: (dim.score / dim.maxScore * 100) + '%' }"
            />
          </div>
          <div class="dimension-bar__value">{{ dim.score }}/{{ dim.maxScore }}</div>
        </div>
      </div>

      <div v-if="result.answers && result.answers.length > 0" class="answers-section">
        <div class="section-title">答题详情</div>
        <div v-for="(answer, idx) in result.answers" :key="idx" class="answer-item">
          <div class="answer-item__question">
            <span class="answer-item__num">{{ idx + 1 }}.</span>
            {{ answer.questionText }}
          </div>
          <div class="answer-item__response">
            <span class="answer-item__choice">{{ answer.selectedText || answer.answer }}</span>
            <span v-if="answer.score != null" class="answer-item__score">{{ answer.score }}分</span>
          </div>
        </div>
      </div>

      <div v-if="result.healthData" class="health-data-card">
        <div class="section-title">健康数据</div>
        <div class="health-data-row">
          <div class="health-data-item">
            <div class="health-data-item__value">{{ result.healthData.avgBloodSugar ?? '-' }}</div>
            <div class="health-data-item__label">平均血糖</div>
          </div>
          <div class="health-data-item">
            <div class="health-data-item__value">{{ result.healthData.recordCount ?? '-' }}</div>
            <div class="health-data-item__label">记录次数</div>
          </div>
          <div class="health-data-item">
            <div class="health-data-item__value">{{ result.healthData.inRangeRate ?? '-' }}</div>
            <div class="health-data-item__label">达标率</div>
          </div>
        </div>
      </div>

      <div class="note-section">
        <div class="section-title">医生批注</div>
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { getAssignmentResult, addDoctorNote } from '@/api/questionnaire'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const result = ref<any>(null)
const doctorNote = ref('')
const noteSaving = ref(false)

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
    showSuccessToast('批注已保存')
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
    doctorNote.value = (data as any)?.doctorNote || ''
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

.score-circle__label {
  font-size: 13px;
  color: #999;
}

.score-level {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-top: 12px;
}

.score-percentage {
  font-size: 13px;
  color: #999;
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
</style>
