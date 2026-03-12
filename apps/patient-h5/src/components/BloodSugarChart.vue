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
    mode?: 'today' | 'trend' // today: time of day; trend: date grouping
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

function getPointColor(value: number): string {
  if (value < 3.9) return '#3B82F6'
  if (value <= 7.8) return '#1AAD6E'
  if (value <= 11.1) return '#FFB020'
  return '#FF4D4F'
}

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
    return `${dt.getMonth() + 1}/${dt.getDate()}`
  })
  const yData = sorted.map((d) => d.value)

  if (sorted.length === 0 && props.mode === 'today') {
    xData = ['06:00', '12:00', '18:00']
  } else if (sorted.length === 0 && props.mode === 'trend') {
    xData = []
  }

  const minY = 2
  const maxY = 14
  const normalMin = 3.9
  const normalMax = 10

  const seriesData = yData.map((val) => ({
    value: val,
    itemStyle: { color: getPointColor(val) },
    label: {
      show: true,
      position: 'top' as const,
      formatter: () => Number(val).toFixed(1),
      fontSize: 11,
      fontWeight: 'bold' as const,
      color: getPointColor(val),
    },
  }))

  const series: echarts.SeriesOption[] = [
    {
      type: 'line',
      name: '血糖',
      data: seriesData,
      smooth: true,
      symbol: 'circle',
      symbolSize: 10,
      lineStyle: { color: '#1AAD6E', width: 2 },
      markArea: props.showNormalRange
        ? ({
            silent: true,
            itemStyle: { color: 'rgba(26, 173, 110, 0.08)' },
            data: [
              [
                { yAxis: normalMin, label: { show: true, formatter: '正常范围', color: 'rgba(26, 173, 110, 0.6)', fontSize: 9, position: 'insideLeft' } },
                { yAxis: normalMax },
              ],
            ],
          } as any)
        : undefined,
    },
  ]

  const option: echarts.EChartsOption = {
    grid: { left: 40, right: 16, top: 28, bottom: 32 },
    xAxis: {
      type: 'category',
      data: xData,
      axisLine: { lineStyle: { color: '#ebedf0' } },
      axisLabel: { fontSize: 10, color: '#969799' },
    },
    yAxis: {
      type: 'value',
      min: minY,
      max: maxY,
      interval: 2,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#ebedf0', type: 'dashed' } },
      axisLabel: { fontSize: 10, color: '#969799' },
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
