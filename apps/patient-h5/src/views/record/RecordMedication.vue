<template>
  <div class="record-page">
    <van-nav-bar title="记录用药" left-arrow @click-left="$router.back()" />
    <van-cell-group inset style="margin-top: 12px">
      <van-cell title="药物类型" :value="medTypeLabel" is-link @click="showTypePicker = true" />
      <van-cell title="药物名称" :value="medName || '请选择'" is-link @click="showNamePicker = true" />
      <van-field v-model.number="dosage" label="剂量" type="number" placeholder="请输入">
        <template #button><span style="color: #969799">{{ dosageUnit }}</span></template>
      </van-field>
      <van-cell
        v-if="medType === 'INSULIN'"
        title="注射部位"
        :value="siteLabel"
        is-link
        @click="showSitePicker = true"
      />
    </van-cell-group>

    <van-cell-group inset style="margin-top: 12px">
      <van-field v-model="note" label="备注" type="textarea" placeholder="可选" rows="2" maxlength="200" />
    </van-cell-group>

    <div style="padding: 24px 16px">
      <van-button round block type="primary" :loading="saving" @click="onSave">保存记录</van-button>
    </div>

    <van-action-sheet v-model:show="showTypePicker" :actions="typeActions" @select="onTypeSelect" />
    <van-action-sheet v-model:show="showNamePicker" :actions="nameActions" @select="onNameSelect" />
    <van-action-sheet v-model:show="showSitePicker" :actions="siteActions" @select="onSiteSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showFailToast } from 'vant'
import { createMedication } from '@/api/health'

const router = useRouter()
const saving = ref(false)
const medType = ref('INSULIN')
const medName = ref('诺和锐')
const dosage = ref(8)
const site = ref('ABDOMEN')
const note = ref('')
const showTypePicker = ref(false)
const showNamePicker = ref(false)
const showSitePicker = ref(false)

const typeActions = [{ name: '胰岛素', value: 'INSULIN' }, { name: '口服药', value: 'ORAL' }]
const siteActions = [
  { name: '腹部', value: 'ABDOMEN' }, { name: '大腿', value: 'THIGH' },
  { name: '手臂', value: 'ARM' }, { name: '臀部', value: 'BUTTOCK' },
]

const medTypeLabel = computed(() => typeActions.find((a) => a.value === medType.value)?.name || '')
const dosageUnit = computed(() => medType.value === 'INSULIN' ? 'U' : 'mg')
const siteLabel = computed(() => siteActions.find((a) => a.value === site.value)?.name || '请选择')

const nameActions = computed(() =>
  medType.value === 'INSULIN'
    ? [{ name: '诺和锐' }, { name: '来得时' }, { name: '诺和灵R' }, { name: '优泌乐' }]
    : [{ name: '二甲双胍' }, { name: '格列美脲' }, { name: '阿卡波糖' }],
)

function onTypeSelect(a: any) { medType.value = a.value; medName.value = ''; showTypePicker.value = false }
function onNameSelect(a: any) { medName.value = a.name; showNamePicker.value = false }
function onSiteSelect(a: any) { site.value = a.value; showSitePicker.value = false }

async function onSave() {
  if (!medName.value) { showFailToast('请选择药物名称'); return }
  if (!dosage.value || dosage.value <= 0) { showFailToast('请输入剂量'); return }
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
    showSuccessToast('记录成功')
    setTimeout(() => router.back(), 500)
  } catch (err: any) {
    showFailToast(err.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>
