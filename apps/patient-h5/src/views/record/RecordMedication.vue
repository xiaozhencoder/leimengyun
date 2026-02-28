<template>
  <div class="record-page">
    <van-nav-bar title="记录用药" left-arrow @click-left="$router.back()" />

    <div class="section-card">
      <div class="section-title">药物类型</div>
      <div class="chips">
        <span
          class="chip"
          :class="{ active: form.medType === 'INSULIN' }"
          @click="form.medType = 'INSULIN'"
        >
          💉 胰岛素
        </span>
        <span
          class="chip"
          :class="{ active: form.medType === 'ORAL' }"
          @click="form.medType = 'ORAL'"
        >
          💊 口服药
        </span>
      </div>
    </div>

    <van-cell-group inset>
      <van-field
        v-model="form.medName"
        label="药物名称"
        placeholder="请输入药物名称"
        :rules="[{ required: true, message: '请输入药物名称' }]"
      />
      <van-field v-model="form.dosage" label="剂量" type="number" placeholder="请输入剂量">
        <template #right-icon>
          <span>{{ form.medType === 'INSULIN' ? 'IU' : 'mg' }}</span>
        </template>
      </van-field>

      <van-field
        v-if="form.medType === 'INSULIN'"
        label="注射部位"
      >
        <template #input>
          <van-radio-group v-model="form.injectionSite" direction="horizontal">
            <van-radio name="ABDOMEN">腹部</van-radio>
            <van-radio name="THIGH">大腿</van-radio>
            <van-radio name="ARM">手臂</van-radio>
            <van-radio name="BUTTOCK">臀部</van-radio>
          </van-radio-group>
        </template>
      </van-field>

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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { createMedication } from '@/api/health'

const router = useRouter()
const loading = ref(false)
const showDatetime = ref(false)
const selectedDate = ref<string[]>([])

const form = reactive({
  medType: 'INSULIN',
  medName: '',
  dosage: '',
  injectionSite: '',
  recordedAt: new Date().toLocaleDateString('zh-CN'),
  note: '',
})

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.recordedAt = selectedValues.join('-')
  showDatetime.value = false
}

function handleSave() {
  if (!form.medName) {
    showToast('请输入药物名称')
    return
  }
  if (!form.dosage) {
    showToast('请输入剂量')
    return
  }

  loading.value = true
  createMedication({
    medType: form.medType as never,
    medName: form.medName,
    dosage: Number(form.dosage),
    dosageUnit: form.medType === 'INSULIN' ? 'IU' : 'mg',
    injectionSite: form.medType === 'INSULIN' ? (form.injectionSite as never) : undefined,
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

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.chips {
  display: flex;
  gap: 12px;
}

.chip {
  flex: 1;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  background: #f2f3f5;
  color: var(--text);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.chip.active {
  background: var(--primary-light);
  color: var(--primary);
  border: 1px solid var(--primary);
}

.btn-area {
  margin: 24px 16px;
}
</style>
