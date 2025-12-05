<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { BarChart3, PieChart } from 'lucide-vue-next'
import { defineAsyncComponent, ref } from 'vue'

const AnalyticsChart = defineAsyncComponent({
  loader: () => import('@/components/AnalyticsChart.vue'),
  loadingComponent: Spinner,
  delay: 200
})

type ChartType = 'pie' | 'bar'
type FilterType = 'all' | '1-4' | '5-11' | 'staff'

interface TopicState {
  id: number
  title: string
  chartType: ChartType
  filter: FilterType
  options: { label: string; value: FilterType }[]
  colorClass: string
}

const props = defineProps<{
  chartsData: Record<number, any>
}>()

const topics = ref<TopicState[]>([
  {
    id: 1,
    title: 'Посещение учебного заведения',
    chartType: 'pie',
    filter: 'all',
    options: [
      { label: 'Все', value: 'all' },
      { label: '1-4 классы', value: '1-4' },
      { label: '5-11 классы', value: '5-11' },
      { label: 'Персонал', value: 'staff' },
    ],
    colorClass: 'shadow-lg shadow-blue-500/20'
  },
  {
    id: 2,
    title: 'Получение бесплатного питания',
    chartType: 'pie',
    filter: 'all',
    options: [
      { label: 'Все', value: 'all' },
      { label: '1-4 классы', value: '1-4' },
      { label: '5-11 классы', value: '5-11' },
    ],
    colorClass: 'shadow-lg shadow-orange-500/20'
  },
  {
    id: 3,
    title: 'Получение книг',
    chartType: 'pie',
    filter: 'all',
    options: [
      { label: 'Все', value: 'all' },
      { label: '1-4 классы', value: '1-4' },
      { label: '5-11 классы', value: '5-11' },
    ],
    colorClass: 'shadow-lg shadow-purple-500/20'
  }
])

const getChartData = (topicId: number, filter: FilterType) => {
  return props.chartsData[topicId]?.[filter] || []
}
</script>

<template>
  <div class="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-3">
    <Card v-for="topic in topics" :key="topic.id" class="flex flex-col h-full" :class="topic.colorClass">
      <CardHeader class="pb-4">
        <div class="flex flex-col space-y-4">
          <CardTitle class="text-xl font-semibold leading-none tracking-tight">
            {{ topic.title }}
          </CardTitle>
          
          <div class="flex flex-wrap items-center justify-between gap-2">
            <!-- Filter Select -->
            <Select v-model="topic.filter">
              <SelectTrigger class="w-[140px] h-9">
                <SelectValue placeholder="Выберите" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="opt in topic.options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </SelectItem>
              </SelectContent>
            </Select>

            <!-- Chart Type Toggle -->
            <div class="flex items-center border rounded-md bg-background">
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 rounded-none rounded-l-md"
                :class="{ 'bg-accent text-accent-foreground': topic.chartType === 'pie' }"
                @click="topic.chartType = 'pie'"
              >
                <PieChart class="h-4 w-4" />
              </Button>
              <div class="w-px h-4 bg-border"></div>
              <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 rounded-none rounded-r-md"
                :class="{ 'bg-accent text-accent-foreground': topic.chartType === 'bar' }"
                @click="topic.chartType = 'bar'"
              >
                <BarChart3 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent class="flex-1 min-h-[300px]">
        <AnalyticsChart
          :type="topic.chartType"
          :data="getChartData(topic.id, topic.filter)"
          :title="topic.title"
        />
      </CardContent>
    </Card>
  </div>
</template>
