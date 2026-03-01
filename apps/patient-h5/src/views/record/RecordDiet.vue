<template>
  <div class="record-page">
    <van-nav-bar title="记录饮食" left-arrow @click-left="$router.back()" />
    <van-cell-group inset style="margin-top: 12px">
      <div class="chip-field">
        <span class="chip-label">餐次</span>
        <div class="chip-row">
          <span
            v-for="opt in mealOptions"
            :key="opt.value"
            :class="['chip', { 'chip--active': mealType === opt.value }]"
            @click="mealType = opt.value"
          >{{ opt.name }}</span>
        </div>
      </div>
    </van-cell-group>

    <van-cell-group inset title="食物明细" style="margin-top: 12px">
      <div v-for="(item, i) in foodItems" :key="i" class="food-row">
        <van-field v-model="item.name" placeholder="食物名称" class="food-field" />
        <van-field v-model="item.quantity" placeholder="数量" class="food-field-sm" />
        <van-field v-model.number="item.carbs" type="digit" placeholder="碳水(g)" class="food-field-sm" />
        <van-icon v-if="foodItems.length > 1" name="delete-o" class="food-del" @click="foodItems.splice(i, 1)" />
      </div>
      <van-cell>
        <van-button size="small" plain type="primary" icon="plus" @click="addFood">添加食物</van-button>
      </van-cell>
    </van-cell-group>

    <div class="carbs-total">
      <span>总碳水化合物</span>
      <span class="carbs-value">{{ totalCarbs }} g</span>
    </div>

    <van-cell-group inset title="食物拍照（可选）" style="margin-top: 12px">
      <van-uploader
        v-model="photoFileList"
        :max-count="1"
        accept="image/*"
        result-type="dataUrl"
      >
        <van-button icon="photograph" type="primary" plain size="small">拍照/选图</van-button>
      </van-uploader>
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
import { createDiet } from '@/api/health'

const router = useRouter()
const saving = ref(false)
const mealType = ref('LUNCH')
const note = ref('')
const photoFileList = ref<Array<{ content?: string }>>([])

const foodItems = ref([
  { name: '', quantity: '', carbs: 0 },
])

const mealOptions = [
  { name: '早餐', value: 'BREAKFAST' },
  { name: '午餐', value: 'LUNCH' },
  { name: '晚餐', value: 'DINNER' },
  { name: '加餐', value: 'SNACK' },
]
const totalCarbs = computed(() => foodItems.value.reduce((s, f) => s + (Number(f.carbs) || 0), 0))

function addFood() { foodItems.value.push({ name: '', quantity: '', carbs: 0 }) }

async function onSave() {
  const items = foodItems.value.filter((f) => f.name.trim())
  if (!items.length) { showError('请至少添加一项食物'); return }
  saving.value = true
  try {
    const photo = photoFileList.value[0]?.content
    await createDiet({
      mealType: mealType.value,
      foodItems: items,
      totalCarbs: totalCarbs.value,
      photoUrl: photo || undefined,
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
.food-row { display: flex; align-items: center; gap: 4px; padding: 4px 16px; }
.food-field { flex: 2; }
.food-field-sm { flex: 1; }
.food-del { color: #ff4d4f; font-size: 18px; cursor: pointer; padding: 4px; }
.carbs-total {
  margin: 12px 16px;
  background: #e8f8f0;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #646566;
}
.carbs-value { font-size: 20px; font-weight: 700; color: #1aad6e; }
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
