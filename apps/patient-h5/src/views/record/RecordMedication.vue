<template>
  <div class="record-page">
    <van-nav-bar title="记录用药" left-arrow @click-left="$router.back()" />
    <van-cell-group inset style="margin-top: 12px">
      <div class="chip-field">
        <span class="chip-label">药物类型</span>
        <div class="chip-row">
          <span
            v-for="opt in typeOptions"
            :key="opt.value"
            :class="['chip', { 'chip--active': medType === opt.value }]"
            @click="onTypeSelect(opt.value)"
          >{{ opt.name }}</span>
        </div>
      </div>
      <div class="chip-field">
        <span class="chip-label">药物名称</span>
        <div class="chip-row">
          <span
            v-for="opt in nameOptions"
            :key="opt.name"
            :class="['chip', { 'chip--active': medName === opt.name }]"
            @click="medName = opt.name"
          >{{ opt.name }}</span>
        </div>
      </div>
      <van-field v-model.number="dosage" label="剂量" type="number" placeholder="请输入">
        <template #button><span style="color: #969799">{{ dosageUnit }}</span></template>
      </van-field>
      <div v-if="medType === 'INSULIN'" class="chip-field">
        <span class="chip-label">注射部位</span>
        <div class="chip-row">
          <span
            v-for="opt in siteOptions"
            :key="opt.value"
            :class="['chip', { 'chip--active': site === opt.value }]"
            @click="site = opt.value"
          >{{ opt.name }}</span>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group inset style="margin-top: 12px">
      <van-field v-model="note" label="备注" type="textarea" placeholder="可选" rows="2" maxlength="200" />
    </van-cell-group>

    <div style="padding: 24px 16px">
      <van-button round block type="primary" :loading="saving" @click="onSave">保存记录</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showError, showSuccess } from '@/utils/feedback'
import { createMedication } from '@/api/health'

const router = useRouter()
const saving = ref(false)
const medType = ref('INSULIN')
const medName = ref('诺和锐')
const dosage = ref(8)
const site = ref('ABDOMEN')
const note = ref('')

const typeOptions = [{ name: '胰岛素', value: 'INSULIN' }, { name: '口服药', value: 'ORAL' }]
const siteOptions = [
  { name: '腹部', value: 'ABDOMEN' }, { name: '大腿', value: 'THIGH' },
  { name: '手臂', value: 'ARM' }, { name: '臀部', value: 'BUTTOCK' },
]

const dosageUnit = computed(() => medType.value === 'INSULIN' ? 'U' : 'mg')
const nameOptions = computed(() =>
  medType.value === 'INSULIN'
    ? [{ name: '诺和锐' }, { name: '来得时' }, { name: '诺和灵R' }, { name: '优泌乐' }]
    : [{ name: '二甲双胍' }, { name: '格列美脲' }, { name: '阿卡波糖' }],
)

function onTypeSelect(val: string) {
  medType.value = val
  medName.value = medType.value === 'INSULIN' ? '诺和锐' : '二甲双胍'
}

async function onSave() {
  if (!medName.value) { showError('请选择药物名称'); return }
  if (!dosage.value || dosage.value <= 0) { showError('请输入剂量'); return }
  saving.value = true
  try {
    await createMedication({
      medType: medType.value,
      medName: medName.value,
      dosage: dosage.value,
      dosageUnit: dosageUnit.value,
      injectionSite: medType.value === 'INSULIN' ? site.value : undefined,
      recordedAt: new Date().toISOString(),
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
