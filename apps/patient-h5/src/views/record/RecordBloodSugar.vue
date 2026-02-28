<template>
  <div class="record-page">
    <van-nav-bar title="记录血糖" left-arrow @click-left="$router.back()" />

    <div class="value-area section-card">
      <div class="value-display">
        <input
          v-model="form.value"
          type="number"
          step="0.1"
          min="1"
          max="33.3"
          class="big-input"
          placeholder="0.0"
        />
        <span class="unit">mmol/L</span>
      </div>
      <p class="value-hint" :class="levelClass">{{ levelText }}</p>
    </div>

    <div class="section-card">
      <div class="section-title">测量时段</div>
      <div class="chips">
        <span
          v-for="(label, key) in measureTimeLabels"
          :key="key"
          class="chip"
          :class="{ active: form.measureTime === key }"
          @click="form.measureTime = key"
        >
          {{ label }}
        </span>
      </div>
    </div>

    <van-cell-group inset>
      <van-field
        v-model="form.recordedAt"
        is-link
        readonly
        label="记录时间"
        placeholder="请选择时间"
        @click="showDatetime = true"
      />
      <van-field
        v-model="form.note"
        label="备注"
        type="textarea"
        placeholder="添加备注（选填）"
        maxlength="200"
        show-word-limit
        rows="2"
        autosize
      />
    </van-cell-group>

    <div class="btn-area">
      <van-button type="primary" block round size="large" :loading="loading" @click="handleSave">
        保存记录
      </van-button>
    </div>

    <van-popup v-model:show="showDatetime" position="bottom" round>
      <van-date-picker
        v-model="selectedDate"
        title="选择日期"
        @confirm="onDateConfirm"
        @cancel="showDatetime = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { MEASURE_TIME_LABELS } from '@leimengyun/shared'
import { createBloodSugar } from '@/api/health'

const router = useRouter()
const loading = ref(false)
const showDatetime = ref(false)
const selectedDate = ref<string[]>([])
const measureTimeLabels = MEASURE_TIME_LABELS

const form = reactive({
  value: '',
  measureTime: 'FASTING',
  recordedAt: new Date().toLocaleDateString('zh-CN'),
  note: '',
})

const levelClass = computed(() => {
  const v = Number(form.value)
  if (!v) return ''
  if (v < 3.9) return 'low'
  if (v > 10) return 'high'
  return 'normal'
})

const levelText = computed(() => {
  const v = Number(form.value)
  if (!v) return '请输入血糖值'
  if (v < 3.9) return '偏低'
  if (v <= 7.0) return '正常范围'
  if (v <= 10) return '偏高'
  return '过高'
})

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.recordedAt = selectedValues.join('-')
  showDatetime.value = false
}

function handleSave() {
  const value = Number(form.value)
  if (!value || value < 1 || value > 33.3) {
    showToast('请输入有效的血糖值(1.0-33.3)')
    return
  }

  loading.value = true
  createBloodSugar({
    value,
    measureTime: form.measureTime as never,
    recordedAt: form.recordedAt,
    note: form.note || undefined,
  })
    .then(() => {
      showToast('保存成功')
      router.back()
    })
    .catch(() => {
      showToast('保存失败，请重试')
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<style scoped>
.record-page {
  min-height: 100vh;
  background: var(--bg);
}

.value-area {
  text-align: center;
  padding: 32px 16px;
}

.value-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.big-input {
  width: 160px;
  font-size: 48px;
  font-weight: 700;
  text-align: center;
  border: none;
  background: transparent;
  color: var(--text);
  outline: none;
}

.big-input::placeholder {
  color: #ddd;
}

.unit {
  font-size: 16px;
  color: var(--text-secondary);
}

.value-hint {
  font-size: 14px;
  margin-top: 8px;
  color: var(--text-secondary);
}

.value-hint.low {
  color: var(--warning);
}

.value-hint.normal {
  color: var(--success);
}

.value-hint.high {
  color: var(--danger);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  background: #f2f3f5;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s;
}

.chip.active {
  background: var(--primary);
  color: #fff;
}

.btn-area {
  margin: 24px 16px;
}
</style>
