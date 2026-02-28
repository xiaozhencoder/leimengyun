<template>
  <div class="record-page">
    <van-nav-bar title="记录饮食" left-arrow @click-left="$router.back()" />

    <div class="section-card">
      <div class="section-title">餐次</div>
      <div class="chips">
        <span
          v-for="(label, key) in mealTypeLabels"
          :key="key"
          class="chip"
          :class="{ active: form.mealType === key }"
          @click="form.mealType = key"
        >
          {{ label }}
        </span>
      </div>
    </div>

    <div class="section-card">
      <div class="section-title">
        食物列表
        <van-button size="small" type="primary" plain @click="addFood">+ 添加</van-button>
      </div>

      <div v-for="(item, index) in form.foodItems" :key="index" class="food-item">
        <van-field v-model="item.name" label="食物" placeholder="食物名称" />
        <van-field v-model="item.quantity" label="份量" placeholder="如: 1碗" />
        <van-field v-model="item.carbs" label="碳水(g)" type="number" placeholder="碳水化合物" />
        <van-button
          v-if="form.foodItems.length > 1"
          size="small"
          type="danger"
          plain
          class="remove-btn"
          @click="removeFood(index)"
        >
          删除
        </van-button>
      </div>

      <div class="total-carbs">
        总碳水化合物: <strong>{{ totalCarbs }}</strong> g
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
import { MEAL_TYPE_LABELS } from '@leimengyun/shared'
import { createDiet } from '@/api/health'

const router = useRouter()
const loading = ref(false)
const showDatetime = ref(false)
const selectedDate = ref<string[]>([])
const mealTypeLabels = MEAL_TYPE_LABELS

const form = reactive({
  mealType: 'BREAKFAST',
  foodItems: [{ name: '', quantity: '', carbs: '' }] as { name: string; quantity: string; carbs: string }[],
  recordedAt: new Date().toLocaleDateString('zh-CN'),
  note: '',
})

const totalCarbs = computed(() => {
  return form.foodItems.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0)
})

function addFood() {
  form.foodItems.push({ name: '', quantity: '', carbs: '' })
}

function removeFood(index: number) {
  form.foodItems.splice(index, 1)
}

function onDateConfirm({ selectedValues }: { selectedValues: string[] }) {
  form.recordedAt = selectedValues.join('-')
  showDatetime.value = false
}

function handleSave() {
  const validItems = form.foodItems.filter((i) => i.name)
  if (validItems.length === 0) {
    showToast('请至少添加一种食物')
    return
  }

  loading.value = true
  createDiet({
    mealType: form.mealType as never,
    foodItems: validItems.map((i) => ({
      name: i.name,
      quantity: i.quantity,
      carbs: Number(i.carbs) || 0,
    })),
    totalCarbs: totalCarbs.value,
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
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

.food-item {
  border-bottom: 1px solid var(--border);
  padding-bottom: 8px;
  margin-bottom: 8px;
  position: relative;
}

.remove-btn {
  margin-top: 4px;
}

.total-carbs {
  text-align: right;
  font-size: 14px;
  padding-top: 8px;
  color: var(--text-secondary);
}

.total-carbs strong {
  color: var(--primary);
  font-size: 18px;
}

.btn-area {
  margin: 24px 16px;
}
</style>
