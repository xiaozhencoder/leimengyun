<template>
  <div class="record-page">
    <van-nav-bar title="记录饮食" left-arrow @click-left="$router.back()" />
    <van-cell-group inset style="margin-top: 12px;">
      <van-cell title="餐次" :value="mealType" is-link @click="showMealPicker = true" />
    </van-cell-group>
    <van-cell-group inset title="食物明细" style="margin-top: 12px;">
      <van-field v-for="(item, i) in foodItems" :key="i" v-model="item.name" :label="'食物' + (i+1)" placeholder="食物名称">
        <template #button>
          <span style="color: #1AAD6E; font-size: 13px;">{{ item.carbs }}g碳水</span>
        </template>
      </van-field>
      <van-cell>
        <van-button size="small" plain type="primary" icon="plus" @click="addFood">添加食物</van-button>
      </van-cell>
    </van-cell-group>
    <div style="padding: 24px 16px;">
      <van-button round block type="primary" @click="onSave">保存记录</van-button>
    </div>
    <van-action-sheet v-model:show="showMealPicker" title="选择餐次" :actions="mealActions" @select="onMealSelect" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'

const router = useRouter()
const mealType = ref('午餐')
const showMealPicker = ref(false)
const foodItems = ref([
  { name: '白米饭', carbs: 45 },
  { name: '清炒西蓝花', carbs: 8 },
])

const mealActions = [{ name: '早餐' }, { name: '午餐' }, { name: '晚餐' }, { name: '加餐' }]

function onMealSelect(a: { name: string }) { mealType.value = a.name; showMealPicker.value = false }
function addFood() { foodItems.value.push({ name: '', carbs: 0 }) }
function onSave() { showSuccessToast('记录成功'); setTimeout(() => router.back(), 500) }
</script>
