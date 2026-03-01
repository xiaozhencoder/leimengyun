<template>
  <div class="record-page">
    <van-nav-bar title="记录血糖" left-arrow @click-left="$router.back()" />
    <div class="bs-input-section">
      <p class="bs-label">血糖值 (mmol/L)</p>
      <input
        v-model="valueStr"
        type="number"
        step="0.1"
        :class="['bs-value-input', 'bs-value-input--' + levelClass]"
        inputmode="decimal"
        placeholder="0.0"
      />
      <span :class="['bs-level-label', 'bs-level-label--' + levelClass]">{{ levelText }}</span>
    </div>
    <van-cell-group inset>
      <div class="chip-field">
        <span class="chip-label">测量时段</span>
        <div class="chip-row">
          <span
            v-for="([val, name]) in timeOptions"
            :key="val"
            :class="['chip', { 'chip--active': selectedTime === val }]"
            @click="selectedTime = val"
          >{{ name }}</span>
        </div>
      </div>
      <van-cell title="记录时间" :value="displayTime" is-link @click="showDatePicker = true" />
    </van-cell-group>
    <van-cell-group inset style="margin-top: 12px">
      <van-field v-model="note" label="备注" type="textarea" placeholder="可选" rows="2" maxlength="200" show-word-limit />
    </van-cell-group>
    <div style="padding: 24px 16px">
      <van-button round block type="primary" :loading="saving" @click="onSave">保存记录</van-button>
    </div>

    <van-popup v-model:show="showDatePicker" position="bottom">
      <van-date-picker
        v-model="dateValues"
        :max-date="new Date()"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showError, showSuccess } from '@/utils/feedback'
import { createBloodSugar } from '@/api/health'
import { MEASURE_TIME_LABELS } from '@leimengyun/shared'

const router = useRouter()
const valueStr = ref('6.5')
const selectedTime = ref('BEFORE_LUNCH')
const note = ref('')
const saving = ref(false)
const showDatePicker = ref(false)

const now = new Date()
const recordedAt = ref(now.toISOString())
const dateValues = ref([
  now.getFullYear().toString(),
  (now.getMonth() + 1).toString().padStart(2, '0'),
  now.getDate().toString().padStart(2, '0'),
])

const displayTime = computed(() => {
  const d = new Date(recordedAt.value)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
})

const timeOptions = Object.entries(MEASURE_TIME_LABELS)

const value = computed(() => parseFloat(valueStr.value) || 0)

const levelClass = computed(() => {
  const v = value.value
  if (v < 1) return 'unknown'
  if (v < 3.9) return 'low'
  if (v <= 6.1) return 'normal'
  if (v <= 7.8) return 'high'
  return 'veryhigh'
})

const levelText = computed(() => {
  const v = value.value
  if (v < 1) return '—'
  if (v < 3.9) return '偏低'
  if (v <= 6.1) return '正常'
  if (v <= 7.8) return '偏高'
  return '高'
})

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  const d = new Date(`${selectedValues[0]}-${selectedValues[1]}-${selectedValues[2]}T${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:00`)
  recordedAt.value = d.toISOString()
  showDatePicker.value = false
}

async function onSave() {
  if (value.value < 1.0 || value.value > 33.3) {
    showError('血糖值应在 1.0-33.3 之间')
    return
  }
  saving.value = true
  try {
    await createBloodSugar({
      value: value.value,
      measureTime: selectedTime.value,
      recordedAt: recordedAt.value,
      note: note.value || undefined,
    })
    showSuccess('记录成功')
    setTimeout(() => router.back(), 500)
  } catch (err: any) {
    showError(err.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.bs-input-section {
  text-align: center;
  padding: 24px 0;
}
.bs-label {
  font-size: 13px;
  color: #969799;
}
.bs-value-input {
  display: block;
  margin: 8px auto;
  font-size: 56px;
  font-weight: 700;
  text-align: center;
  border: none;
  outline: none;
  background: transparent;
  width: 220px;
  transition: color 0.2s;
}
.bs-value-input--unknown { color: #c8c9cc; }
.bs-value-input--low { color: #1989fa; }
.bs-value-input--normal { color: #07c160; }
.bs-value-input--high { color: #ee0a24; }
.bs-value-input--veryhigh { color: #c41411; }
.bs-level-label {
  display: inline-block;
  margin-top: 8px;
  padding: 4px 14px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
}
.bs-level-label--unknown { background: #f2f3f5; color: #969799; }
.bs-level-label--low { background: #e6f7ff; color: #1989fa; }
.bs-level-label--normal { background: #e8f8f0; color: #07c160; }
.bs-level-label--high { background: #fff1f0; color: #ee0a24; }
.bs-level-label--veryhigh { background: #fff1f0; color: #c41411; }
.chip-field { padding: 14px 16px; }
.chip-label { font-size: 14px; color: #646566; display: block; margin-bottom: 10px; }
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  background: #f7f8fa;
  color: #646566;
  cursor: pointer;
  transition: all 0.2s;
}
.chip--active { background: #1aad6e; color: #fff; }
</style>
