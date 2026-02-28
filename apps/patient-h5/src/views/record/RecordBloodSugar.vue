<template>
  <div class="record-page">
    <van-nav-bar title="记录血糖" left-arrow @click-left="$router.back()" />
    <div class="bs-input-section">
      <p class="bs-label">血糖值 (mmol/L)</p>
      <input
        v-model="valueStr"
        type="number"
        step="0.1"
        class="bs-value-input"
        inputmode="decimal"
      />
      <van-tag :type="levelType" size="medium">{{ levelText }}</van-tag>
    </div>
    <van-cell-group inset>
      <van-cell title="测量时段" :value="selectedTimeLabel" is-link @click="showTimePicker = true" />
      <van-cell title="记录时间" :value="displayTime" is-link @click="showDatePicker = true" />
    </van-cell-group>
    <van-cell-group inset style="margin-top: 12px">
      <van-field v-model="note" label="备注" type="textarea" placeholder="可选" rows="2" maxlength="200" show-word-limit />
    </van-cell-group>
    <div style="padding: 24px 16px">
      <van-button round block type="primary" :loading="saving" @click="onSave">保存记录</van-button>
    </div>

    <van-action-sheet v-model:show="showTimePicker" title="选择测量时段" :actions="timeActions" @select="onTimeSelect" />
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
import { showSuccessToast, showFailToast } from 'vant'
import { createBloodSugar } from '@/api/health'
import { MEASURE_TIME_LABELS } from '@leimengyun/shared'

const router = useRouter()
const valueStr = ref('6.5')
const selectedTime = ref('BEFORE_LUNCH')
const note = ref('')
const saving = ref(false)
const showTimePicker = ref(false)
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

const selectedTimeLabel = computed(() => MEASURE_TIME_LABELS[selectedTime.value] || selectedTime.value)

const value = computed(() => parseFloat(valueStr.value) || 0)

const levelType = computed(() => {
  if (value.value < 3.9) return 'primary'
  if (value.value <= 6.1) return 'success'
  if (value.value <= 7.8) return 'warning'
  return 'danger'
})

const levelText = computed(() => {
  if (value.value < 3.9) return '偏低'
  if (value.value <= 6.1) return '正常'
  if (value.value <= 7.8) return '偏高'
  return '高'
})

const timeActions = Object.entries(MEASURE_TIME_LABELS).map(([value, name]) => ({ name, value }))

function onTimeSelect(action: any) {
  selectedTime.value = action.value
  showTimePicker.value = false
}

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  const d = new Date(`${selectedValues[0]}-${selectedValues[1]}-${selectedValues[2]}T${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:00`)
  recordedAt.value = d.toISOString()
  showDatePicker.value = false
}

async function onSave() {
  if (value.value < 1.0 || value.value > 33.3) {
    showFailToast('血糖值应在 1.0-33.3 之间')
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
    showSuccessToast('记录成功')
    setTimeout(() => router.back(), 500)
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '保存失败')
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
  font-size: 48px;
  font-weight: 700;
  color: #1aad6e;
  text-align: center;
  border: none;
  outline: none;
  background: transparent;
  width: 200px;
}
</style>
