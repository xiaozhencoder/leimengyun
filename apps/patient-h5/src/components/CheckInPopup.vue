<template>
  <van-popup v-model:show="visible" round :style="{ width: '85%', maxWidth: '340px' }" @update:show="$emit('update:show', $event)">
    <div class="checkin-popup">
      <div class="checkin-icon">🏆</div>
      <div class="checkin-title">{{ justCheckedIn ? '打卡成功！' : '今日已打卡' }}</div>
      <div class="checkin-info">
        已连续打卡 <strong>{{ status.consecutiveDays }}</strong> 天
      </div>
      <div class="checkin-bs-info">
        今日血糖 {{ status.todayBsCount }} 次记录
        <span v-if="status.todayBsCount > 0">
          · {{ status.todayBsInRange ? '全部达标 ✓' : '部分未达标' }}
        </span>
      </div>

      <div class="checkin-calendar">
        <div v-for="label in ['一','二','三','四','五','六','日']" :key="label" class="cal-header">{{ label }}</div>
        <div v-for="(day, i) in calendarDays" :key="i" class="cal-day" :class="{ checked: day.checked, today: day.isToday, empty: !day.date }">
          {{ day.dayNum || '' }}
        </div>
      </div>

      <van-button type="primary" block round style="margin-top: 12px" @click="shareToFeed">
        分享到社区
      </van-button>
      <div class="checkin-close" @click="visible = false">关闭</div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getCheckInHistory } from '@/api/community'

const props = defineProps<{
  show: boolean
  status: { checkedInToday: boolean; consecutiveDays: number; totalDays: number; todayBsInRange: boolean; todayBsCount: number }
  justCheckedIn?: boolean
}>()

const emit = defineEmits<{ 'update:show': [boolean] }>()
const router = useRouter()
const visible = computed({ get: () => props.show, set: (v) => emit('update:show', v) })
const history = ref<{ date: string; checked: boolean; bsInRange: boolean }[]>([])

const calendarDays = computed(() => {
  if (!history.value.length) return []
  const firstDate = new Date(history.value[0].date + 'T00:00:00')
  const dayOfWeek = firstDate.getDay() === 0 ? 6 : firstDate.getDay() - 1
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const days: { date: string | null; dayNum: number | null; checked: boolean; isToday: boolean }[] = []
  for (let i = 0; i < dayOfWeek; i++) days.push({ date: null, dayNum: null, checked: false, isToday: false })
  for (const h of history.value) {
    const d = new Date(h.date + 'T00:00:00')
    days.push({ date: h.date, dayNum: d.getDate(), checked: h.checked, isToday: h.date === todayStr })
  }
  return days
})

async function loadHistory() {
  try {
    history.value = (await getCheckInHistory(30)) as unknown as any[]
  } catch { /* */ }
}

function shareToFeed() {
  visible.value = false
  router.push('/community/publish')
}

watch(() => props.show, (v) => { if (v) loadHistory() })
onMounted(() => { if (props.show) loadHistory() })
</script>

<style scoped>
.checkin-popup { padding: 30px 20px; text-align: center; }
.checkin-icon { font-size: 56px; }
.checkin-title { font-size: 20px; font-weight: 700; color: #1AAD6E; margin-top: 12px; }
.checkin-info { font-size: 14px; color: #646566; margin-top: 8px; }
.checkin-bs-info { font-size: 13px; color: #969799; margin-top: 4px; }
.checkin-calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin: 16px 0; text-align: center; }
.cal-header { font-size: 11px; color: #969799; font-weight: 500; padding: 4px 0; }
.cal-day { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; font-size: 12px; color: #969799; }
.cal-day.checked { background: #1AAD6E; color: #fff; }
.cal-day.today { background: #1AAD6E; color: #fff; font-weight: 700; box-shadow: 0 2px 8px rgba(26,173,110,.3); }
.cal-day.empty { visibility: hidden; }
.checkin-close { margin-top: 12px; font-size: 13px; color: #969799; cursor: pointer; }
</style>
