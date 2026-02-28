<template>
  <div class="record-page">
    <van-nav-bar title="记录血糖" left-arrow @click-left="$router.back()" />
    <div class="bs-input-section">
      <p class="bs-label">血糖值 (mmol/L)</p>
      <van-field v-model="value" type="number" class="bs-value-input" input-align="center" />
      <van-tag :type="levelType" size="medium">{{ levelText }}</van-tag>
    </div>
    <van-cell-group inset>
      <van-cell title="测量时段" :value="selectedTime" is-link @click="showTimePicker = true" />
      <van-cell title="记录时间" :value="recordTime" is-link />
    </van-cell-group>
    <van-cell-group inset style="margin-top: 12px;">
      <van-field v-model="note" label="备注" type="textarea" placeholder="可选，记录一些相关信息..." rows="2" />
    </van-cell-group>
    <div style="padding: 24px 16px;">
      <van-button round block type="primary" @click="onSave">保存记录</van-button>
    </div>
    <van-action-sheet v-model:show="showTimePicker" title="选择测量时段" :actions="timeActions" @select="onTimeSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'

const router = useRouter()
const value = ref('6.5')
const selectedTime = ref('午餐前')
const recordTime = ref('2026-02-28 12:30')
const note = ref('')
const showTimePicker = ref(false)

const levelType = computed(() => {
  const v = parseFloat(value.value)
  if (v < 3.9) return 'primary'
  if (v <= 6.1) return 'success'
  if (v <= 7.8) return 'warning'
  return 'danger'
})

const levelText = computed(() => {
  const v = parseFloat(value.value)
  if (v < 3.9) return '偏低'
  if (v <= 6.1) return '正常'
  if (v <= 7.8) return '偏高'
  return '高'
})

const timeActions = [
  { name: '空腹' }, { name: '早餐前' }, { name: '早餐后' },
  { name: '午餐前' }, { name: '午餐后' }, { name: '晚餐前' },
  { name: '晚餐后' }, { name: '睡前' }, { name: '凌晨' }, { name: '随机' },
]

function onTimeSelect(action: { name: string }) {
  selectedTime.value = action.name
  showTimePicker.value = false
}

function onSave() {
  showSuccessToast('记录成功')
  setTimeout(() => router.back(), 500)
}
</script>

<style scoped>
.bs-input-section { text-align: center; padding: 24px 0; }
.bs-label { font-size: 13px; color: #969799; }
.bs-value-input { font-size: 48px; font-weight: 700; }
.bs-value-input :deep(input) { font-size: 48px; font-weight: 700; color: #1AAD6E; }
</style>
