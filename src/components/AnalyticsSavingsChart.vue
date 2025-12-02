<script setup lang="ts">
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import {
  ChartContainer,
  ChartCrosshair,
  ChartTooltip,
  ChartTooltipContent,
  componentToString,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getMonthlySavings } from '@/lib/api'
import { VisAxis, VisGroupedBar, VisXYContainer } from "@unovis/vue"
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  regionId?: string
  schoolId?: string
}>()

const currentYear = new Date().getFullYear()
const years = [String(currentYear - 2), String(currentYear - 1), String(currentYear)]
const selectedYear = ref(String(currentYear))
const apiData = ref<any[]>([])

const fetchData = async () => {
  try {
    const data = await getMonthlySavings(selectedYear.value, props.regionId, props.schoolId)
    if (Array.isArray(data)) {
      apiData.value = data
    } else {
      apiData.value = []
    }
  } catch (e) {
    console.error(e)
    apiData.value = []
  }
}

watch([selectedYear, () => props.regionId, () => props.schoolId], fetchData, { immediate: true })

// Use explicit month index (0..11) as x-value to avoid duplicated/ambiguous tick labels
const MONTH_INDICES = Array.from({ length: 12 }, (_, i) => i)
const chartData = computed(() => {
  const yearInt = parseInt(selectedYear.value, 10)
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i, // 0..11 - will be used as x
    dateUtc: Date.UTC(yearInt, i, 1), // keep UTC timestamp for tooltip if needed
    savings: 0,
    expenses: 0
  }))

  // Fill with API data (item.month expected 1..12)
  apiData.value.forEach(item => {
    const m = Number(item.month)
    if (m >= 1 && m <= 12) {
      const savings = Math.max(0, Number(item.saved_expense) || 0)
      const expenses = Math.max(0, Number(item.actual_expense) || 0)
      months[m - 1].savings = savings
      months[m - 1].expenses = expenses
    }
  })

  // already ordered by month index
  return months
})

type Data = { month: number; dateUtc: number; savings: number; expenses: number }

const chartConfig = {
  savings: {
    label: "Экономия",
    color: "var(--chart-2)",
  },
  expenses: {
    label: "Расходы",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const activeChart = ref<keyof typeof chartConfig>("savings")

const total = computed(() => ({
  savings: chartData.value.reduce((acc, curr) => acc + curr.savings, 0),
  expenses: chartData.value.reduce((acc, curr) => acc + curr.expenses, 0),
}))

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(value)
}

const crosshairTemplate = componentToString(chartConfig, ChartTooltipContent, {
  labelFormatter(d: any) {
    // d can be fractional (position on axis) — round to nearest month and clamp to 0..11
    const raw = Number(d)
    const m = Math.min(11, Math.max(0, Math.round(raw)))
    const yr = Number(selectedYear.value)
    return new Date(Date.UTC(yr, m, 1)).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    })
  },
})
</script>

<template>
  <Card class="py-4 sm:py-0 shadow-lg shadow-green-500/20">
    <CardHeader class="flex flex-col items-stretch border-b p-0 sm:flex-row">
      <div class="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
        <div class="flex items-center justify-between">
            <CardTitle>Экономия бюджета</CardTitle>
            <Select v-model="selectedYear">
                <SelectTrigger class="w-[100px]">
                    <SelectValue placeholder="Год" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem v-for="year in years" :key="year" :value="year">
                        {{ year }}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
        <CardDescription>
          Показатели за {{ selectedYear }} год
        </CardDescription>
      </div>
      <div class="flex">
        <button
          v-for="(config, chart) in chartConfig"
          :key="chart"
          :data-active="activeChart === chart"
          class="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6 cursor-pointer hover:bg-muted/20 transition-colors"
          @click="activeChart = chart"
        >
          <span class="text-muted-foreground text-xs">
            {{ config.label }}
          </span>
          <span class="text-lg leading-none font-bold sm:text-xl">
            {{ formatCurrency(total[chart]) }}
          </span>
        </button>
      </div>
    </CardHeader>
    <CardContent class="px-2 sm:p-6">
      <ChartContainer :config="chartConfig" class="aspect-auto h-[250px] w-full" cursor>
        <VisXYContainer
          :data="chartData"
          :margin="{ left: 0, right: 0 }"
          :y-domain="[0, undefined]"
        >
          <VisGroupedBar
             :x="(d: Data) => d.month"
             :y="(d: Data) => d[activeChart]"
             :color="chartConfig[activeChart].color"
             :bar-padding="0.1"
             :rounded-corners="4"
           />
          <VisAxis
            type="x"
            :x="(d: Data) => d.month"
            :tick-line="false"
            :domain-line="false"
            :grid-line="false"
            :tick-values="MONTH_INDICES"
            :tick-format="(d: number) => {
              // map numeric month index to localized short month (UTC)
              return new Date(Date.UTC(2000, Math.round(d), 1)).toLocaleDateString('ru-RU', { month: 'short', timeZone: 'UTC' })
            }"
          />
          <VisAxis
            type="y"
            :num-ticks="3"
            :tick-line="false"
            :domain-line="false"
            :tick-format="(d: number) => d >= 1000000 ? `${(d / 1000000).toFixed(1)}M` : `${(d / 1000).toFixed(0)}K`"
          />
          <ChartTooltip />
          <ChartCrosshair
            :template="crosshairTemplate"
            color="#0000"
          />
        </VisXYContainer>
      </ChartContainer>
    </CardContent>
  </Card>
</template>
