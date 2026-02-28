<template>
  <div class="record-page">
    <van-nav-bar title="记录用药" left-arrow @click-left="$router.back()" />
    <van-cell-group inset style="margin-top: 12px;">
      <van-cell title="药物类型" :value="medType" is-link @click="showTypePicker = true" />
      <van-cell title="药物名称" :value="medName" is-link @click="showNamePicker = true" />
      <van-field v-model="dosage" label="剂量" type="number" placeholder="请输入">
        <template #button><span style="color:#969799;">{{ dosageUnit }}</span></template>
      </van-field>
      <van-cell v-if="medType === '胰岛素'" title="注射部位" :value="site" is-link @click="showSitePicker = true" />
    </van-cell-group>
    <div style="padding: 24px 16px;">
      <van-button round block type="primary" @click="onSave">保存记录</van-button>
    </div>
    <van-action-sheet v-model:show="showTypePicker" :actions="[{name:'胰岛素'},{name:'口服药'}]" @select="(a:any)=>{medType=a.name;showTypePicker=false}" />
    <van-action-sheet v-model:show="showNamePicker" :actions="nameActions" @select="(a:any)=>{medName=a.name;showNamePicker=false}" />
    <van-action-sheet v-model:show="showSitePicker" :actions="[{name:'腹部'},{name:'大腿'},{name:'手臂'},{name:'臀部'}]" @select="(a:any)=>{site=a.name;showSitePicker=false}" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'

const router = useRouter()
const medType = ref('胰岛素')
const medName = ref('诺和锐')
const dosage = ref('8')
const site = ref('腹部')
const showTypePicker = ref(false)
const showNamePicker = ref(false)
const showSitePicker = ref(false)

const dosageUnit = computed(() => medType.value === '胰岛素' ? 'U' : 'mg')
const nameActions = computed(() =>
  medType.value === '胰岛素'
    ? [{ name: '诺和锐' }, { name: '来得时' }, { name: '诺和灵R' }, { name: '优泌乐' }]
    : [{ name: '二甲双胍' }, { name: '格列美脲' }, { name: '阿卡波糖' }]
)

function onSave() { showSuccessToast('记录成功'); setTimeout(() => router.back(), 500) }
</script>
