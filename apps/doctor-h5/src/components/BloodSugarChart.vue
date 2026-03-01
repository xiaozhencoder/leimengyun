<template>
  <div ref="chartRef" class="blood-sugar-chart" :style="{ height }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = withDefaults(
  defineProps<{
    data: { recordedAt: string; value: number }[]
    showNormalRange?: boolean
    mode?: 'today' | 'trend'
    days?: number
    height?: string
  }>(),
  {
    showNormalRange: true,
    mode: 'today',
    days: 1,
    height: '200px',
  }
)

const chartRef = ref<HTMLDivElement>()
let chart: echarts.ECharts | null = null
const handleResize = () => chart?.resize()

function initChart() {
  if (!chartRef.value) return

  const sorted = [...props.data].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  )

  let xData = sorted.map((d) => {
    const dt = new Date(d.recordedAt)
    if (props.mode === 'today') {
      return `${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`
    }
    return `${(dt.getMonth() + 1).toString().padStart(2, '0')}-${dt.getDate().toString().padStart(2, '0')}`
  })
  const yData = sorted.map((d) => d.value)

  if (sorted.length === 0 && props.mode === 'today') {
    xData = ['06:00', '12:00', '18:00']
  } else if (sorted.length === 0 && props.mode === 'trend') {
    xData = []
  }

  const minVal = yData.length ? Math.min(2, ...yData, 3.9) : 2
  const maxVal = yData.length ? Math.max(15, ...yData, 11.1) : 15

  const markArea = props.showNormalRange
    ? {
        itemStyle: {
          color: 'rgba(26, 173, 110, 0.12)',
        },
        data: [[{ yAxis: 3.9 }, { yAxis: 10 }]],
      }
    : undefined

  const series: echarts.SeriesOption[] = [
    {
      type: 'line',
      name: '血糖',
      data: yData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#1AAD6E', width: 2 },
      itemStyle: { color: '#1AAD6E' },
      markArea,
    },
  ]

  const option: echarts.EChartsOption = {
    grid: { left: 40, right: 16, top: 16, bottom: 32 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: '#ebedf0' } },
      axisLabel: { fontSize: 11, color: '#969799' },
    },
    yAxis: {
      type: 'value',
      min: minVal,
      max: maxVal,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#ebedf0', type: 'dashed' } },
      axisLabel: { fontSize: 11, color: '#969799' },
    },
    series,
  }

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  chart.setOption(option, true)
}

watch(
  () => [props.data, props.showNormalRange, props.mode, props.days],
  () => initChart(),
  { deep: true }
)

onMounted(() => {
  initChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.blood-sugar-chart {
  width: 100%;
}
</style>
