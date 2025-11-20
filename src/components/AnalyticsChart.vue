<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import { useResizeObserver } from '@vueuse/core'
import { useDark } from '@vueuse/core'

const props = defineProps<{
  type: 'pie' | 'bar'
  data: { name: string; value: number }[]
  title?: string
  colorPalette?: string[]
}>()

const chartRef = ref<HTMLElement | null>(null)
let chartInstance: echarts.ECharts | null = null
const isDark = useDark()

const initChart = () => {
  if (!chartRef.value) return
  
  const theme = isDark.value ? 'dark' : 'light'
  // Dispose if exists to handle theme change cleanly or re-init
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(chartRef.value, theme, {
    renderer: 'canvas'
  })
  
  setOptions()
}

const setOptions = () => {
  if (!chartInstance) return

  const colors = props.colorPalette || [
    '#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6', '#ec4899'
  ]

  const negativeNames = ['Отсутствуют', 'Не получено', 'Не посетили']
  const processedData = props.data.map(item => {
    if (negativeNames.includes(item.name)) {
      return {
        ...item,
        itemStyle: { color: '#ef4444' }
      }
    }
    return item
  })

  const option: echarts.EChartsOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: props.type === 'pie' ? 'item' : 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: {
        color: isDark.value ? '#e2e8f0' : '#64748b'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true,
      show: props.type === 'bar'
    },
    xAxis: props.type === 'bar' ? {
      type: 'category',
      data: props.data.map(d => d.name),
      axisLabel: {
        color: isDark.value ? '#e2e8f0' : '#64748b'
      },
      axisLine: {
        lineStyle: {
          color: isDark.value ? '#475569' : '#cbd5e1'
        }
      }
    } : undefined,
    yAxis: props.type === 'bar' ? {
      type: 'value',
      axisLabel: {
        color: isDark.value ? '#e2e8f0' : '#64748b'
      },
      splitLine: {
        lineStyle: {
          color: isDark.value ? '#334155' : '#e2e8f0',
          type: 'dashed'
        }
      }
    } : undefined,
    series: [
      {
        name: props.title || 'Data',
        type: props.type,
        radius: props.type === 'pie' ? ['50%', '80%'] : undefined,
        center: props.type === 'pie' ? ['50%', '45%'] : undefined,
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: props.type === 'pie' ? 10 : 4,
          borderColor: isDark.value ? '#1e293b' : '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: processedData,
        color: colors
      }
    ] as any
  }

  chartInstance.setOption(option)
}

watch(() => [props.data, props.type, isDark.value], () => {
  if (chartInstance) {
    // If theme changed, we might need to re-init, but setOption with new colors works for most parts
    // For full theme switch (background etc), dispose and re-init is safer but heavier.
    // Let's try just updating options first.
    // Actually, echarts theme is set at init. So if dark mode changes, we must re-init.
    // We can check if isDark changed by comparing current theme? 
    // Simpler: just re-init if theme changes.
    // But for data/type change, setOption is enough.
    
    // Let's just re-init to be safe and simple for now, or optimize later.
    initChart()
  }
}, { deep: true })

useResizeObserver(chartRef, () => {
  chartInstance?.resize()
})

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  chartInstance?.dispose()
})
</script>

<template>
  <div ref="chartRef" class="w-full h-full min-h-[300px]"></div>
</template>
