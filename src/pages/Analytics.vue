<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, watch, type Ref } from 'vue'
import DateRangePicker from '@/components/DateRangePicker.vue'
import { getRegions, getSchools, getStudentsStats, getPassageStats, getDinnerStats, getLibraryStats, getSummaryStats } from '@/lib/api'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Button from '@/components/ui/button/Button.vue'
import { 
  PieChart, 
  BarChart3, 
  Users, 
  School, 
  Utensils, 
  Wallet, 
  PiggyBank, 
  CreditCard,
  Check,
  ChevronsUpDown
} from 'lucide-vue-next'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateRange } from 'reka-ui'

const AnalyticsChart = defineAsyncComponent({
  loader: () => import('@/components/AnalyticsChart.vue'),
  loadingComponent: Spinner,
  delay: 200
})

const AnalyticsSavingsChart = defineAsyncComponent({
  loader: () => import('@/components/AnalyticsSavingsChart.vue'),
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
}

// Global Filters State
const selectedRegion = ref<string>('all')
const selectedSchool = ref<string>('')
const openSchool = ref(false)
const dateRange = ref({
  start: today(getLocalTimeZone()),
  end: today(getLocalTimeZone()),
}) as Ref<DateRange>

const regions = ref<{ value: string; label: string }[]>([])
const availableSchools = ref<{ value: string; label: string }[]>([])

onMounted(async () => {
  try {
    const data = await getRegions()
    if (Array.isArray(data)) {
      regions.value = [
        { value: 'all', label: 'Все регионы' },
        ...data.map((r: any) => ({ value: String(r.id), label: r.name_ru }))
      ]
    }
  } catch (e) {
    console.error('Failed to fetch regions', e)
  }
})

watch(selectedRegion, async (newRegion) => {
  selectedSchool.value = ''
  if (!newRegion) {
    availableSchools.value = []
    return
  }
  try {
    const data = await getSchools(newRegion)
    if (Array.isArray(data)) {
      const schools = data.map((s: any) => ({ value: String(s.school_id), label: s.school_name_ru }))
      availableSchools.value = [{ value: 'all', label: 'Все школы' }, ...schools]
    }
  } catch (e) {
    console.error('Failed to fetch schools', e)
    availableSchools.value = []
  }
}, { immediate: true })

const summaryData = ref({
  totalChildren: 0,
  visitedToday: 0,
  mealsToday: 0,
  meals1to4: 0,
  meals5to11: 0
})

// Store chart data for each topic
const chartsData = ref<Record<number, any>>({
  1: [], // Attendance
  2: [], // Meals
  3: []  // Books
})

const fetchSummaryData = async () => {
  // if (!selectedRegion.value) return // Allow fetching for 'all'
  
  try {
    const startDate = dateRange.value.start?.toString() || ''
    const endDate = dateRange.value.end?.toString() || startDate

    // Fetch summary stats for the top cards
    const summaryStats = await getSummaryStats(startDate, endDate, selectedRegion.value, selectedSchool.value)
    
    if (summaryStats) {
      summaryData.value.totalChildren = summaryStats.total_students || 0
      summaryData.value.visitedToday = summaryStats.students_who_attended_school || 0
      summaryData.value.mealsToday = summaryStats.students_with_meals_total || 0
      summaryData.value.meals1to4 = summaryStats.students_with_meals_1_4 || 0
      summaryData.value.meals5to11 = summaryStats.students_with_meals_5_11 || 0
      
      budgetData.value.planned = summaryStats.planned_expense || 0
      budgetData.value.spent = summaryStats.actual_expense || 0
      
      if (manualPlannedBudget.value) {
        budgetData.value.planned = Number(manualPlannedBudget.value)
      } else if (budgetData.value.planned > 0) {
        manualPlannedBudget.value = budgetData.value.planned
      }

      if (manualMealPrice.value) {
         budgetData.value.spent = (summaryStats.students_with_meals_total || 0) * Number(manualMealPrice.value)
      }

      budgetData.value.saved = budgetData.value.planned - budgetData.value.spent
    }

    // Fetch detailed stats for charts
    const [, passageData, dinnerData, libraryData] = await Promise.all([
      getStudentsStats(selectedRegion.value, selectedSchool.value),
      getPassageStats(startDate, endDate, selectedRegion.value, selectedSchool.value),
      getDinnerStats(startDate, endDate, selectedRegion.value, selectedSchool.value),
      getLibraryStats(startDate, endDate, selectedRegion.value, selectedSchool.value)
    ])
    
    // Note: We are using summaryStats for the top cards now, so we don't need to manually sum up 
    // totalChildren, visitedToday, mealsToday from the detailed arrays anymore.
    // However, we still need the detailed arrays to populate the charts (chartsData).

    // 2. Calculate Visited Today (from passageData) - ONLY FOR CHARTS BREAKDOWN
    let visitedToday = 0
    let visited1to4 = 0
    let visited5to11 = 0
    let visitedStaff = 0
    let absent1to4 = 0
    let absent5to11 = 0
    let absentStaff = 0

    if (Array.isArray(passageData)) {
      passageData.forEach((region: any) => {
        if (region.schools && Array.isArray(region.schools)) {
          region.schools.forEach((school: any) => {
            if (school.classes && Array.isArray(school.classes)) {
              school.classes.forEach((c: any) => {
                const grade = String(c.grade).toLowerCase()
                const visited = c.students_who_attended || 0
                const absent = c.students_who_didnt_attended || 0

                visitedToday += visited

                if (['0', '1', '2', '3', '4', 'kp', 'кп'].includes(grade)) {
                  visited1to4 += visited
                  absent1to4 += absent
                } else if (['5', '6', '7', '8', '9', '10', '11', '12'].includes(grade)) {
                  visited5to11 += visited
                  absent5to11 += absent
                } else if (grade.includes('персонал') || grade.includes('staff') || grade.includes('teacher')) {
                  visitedStaff += visited
                  absentStaff += absent
                } else {
                  const num = parseInt(grade)
                  if (!isNaN(num)) {
                    if (num >= 0 && num <= 4) {
                      visited1to4 += visited
                      absent1to4 += absent
                    }
                    else if (num >= 5 && num <= 12) {
                      visited5to11 += visited
                      absent5to11 += absent
                    }
                  }
                }
              })
            }
          })
        }
      })
    }
    // summaryData.value.visitedToday = visitedToday // Already set from summaryStats

    // 3. Calculate Meals (from dinnerData) - ONLY FOR CHARTS BREAKDOWN
    let mealsToday = 0
    let meals1to4 = 0
    let meals5to11 = 0
    let meals1to4_not = 0
    let meals5to11_not = 0

    if (Array.isArray(dinnerData)) {
      dinnerData.forEach((region: any) => {
        if (region.schools && Array.isArray(region.schools)) {
          region.schools.forEach((school: any) => {
            if (school.classes && Array.isArray(school.classes)) {
              school.classes.forEach((c: any) => {
                const grade = String(c.grade).toLowerCase()
                const received = c.students_with_meals || 0
                const notReceived = c.students_without_meals || 0

                mealsToday += received

                if (['0', '1', '2', '3', '4', 'kp', 'кп'].includes(grade)) {
                  meals1to4 += received
                  meals1to4_not += notReceived
                } else if (['5', '6', '7', '8', '9', '10', '11', '12'].includes(grade)) {
                  meals5to11 += received
                  meals5to11_not += notReceived
                } else {
                  const num = parseInt(grade)
                  if (!isNaN(num)) {
                    if (num >= 0 && num <= 4) {
                      meals1to4 += received
                      meals1to4_not += notReceived
                    }
                    else if (num >= 5 && num <= 12) {
                      meals5to11 += received
                      meals5to11_not += notReceived
                    }
                  }
                }
              })
            }
          })
        }
      })
    }
    // summaryData.value.mealsToday = mealsToday // Already set from summaryStats
    // summaryData.value.meals1to4 = meals1to4
    // summaryData.value.meals5to11 = meals5to11

    // 4. Update Charts Data
    
    // Topic 1: Attendance
    chartsData.value[1] = {
      'all': [
        { name: 'Присутствуют', value: visitedToday },
        { name: 'Отсутствуют', value: (visited1to4 + visited5to11 + visitedStaff + absent1to4 + absent5to11 + absentStaff) - visitedToday },
      ],
      '1-4': [
        { name: 'Присутствуют', value: visited1to4 },
        { name: 'Отсутствуют', value: absent1to4 },
      ],
      '5-11': [
        { name: 'Присутствуют', value: visited5to11 },
        { name: 'Отсутствуют', value: absent5to11 },
      ],
      'staff': [
        { name: 'Присутствуют', value: visitedStaff },
        { name: 'Отсутствуют', value: absentStaff },
      ]
    }

    // Topic 2: Meals
    chartsData.value[2] = {
      'all': [
        { name: 'Получено', value: mealsToday },
        { name: 'Не получено', value: meals1to4_not + meals5to11_not },
      ],
      '1-4': [
        { name: 'Получено', value: meals1to4 },
        { name: 'Не получено', value: meals1to4_not },
      ],
      '5-11': [
        { name: 'Получено', value: meals5to11 },
        { name: 'Не получено', value: meals5to11_not },
      ],
    }

    // Topic 3: Library
    let lib_visited = 0
    let lib_not_visited = 0
    let lib_1to4_visited = 0
    let lib_1to4_not = 0
    let lib_5to11_visited = 0
    let lib_5to11_not = 0

    if (Array.isArray(libraryData)) {
      libraryData.forEach((region: any) => {
        if (region.schools && Array.isArray(region.schools)) {
          region.schools.forEach((school: any) => {
            if (school.classes && Array.isArray(school.classes)) {
              school.classes.forEach((c: any) => {
                const grade = String(c.grade).toLowerCase()
                const visited = c.students_who_attended || 0
                const notVisited = c.students_who_didnt_attended || 0

                lib_visited += visited
                lib_not_visited += notVisited

                if (['0', '1', '2', '3', '4', 'kp', 'кп'].includes(grade)) {
                  lib_1to4_visited += visited
                  lib_1to4_not += notVisited
                } else if (['5', '6', '7', '8', '9', '10', '11', '12'].includes(grade)) {
                  lib_5to11_visited += visited
                  lib_5to11_not += notVisited
                } else {
                   const num = parseInt(grade)
                   if (!isNaN(num)) {
                     if (num >= 0 && num <= 4) {
                       lib_1to4_visited += visited
                       lib_1to4_not += notVisited
                     } else if (num >= 5 && num <= 12) {
                       lib_5to11_visited += visited
                       lib_5to11_not += notVisited
                     }
                   }
                }
              })
            }
          })
        }
      })
    }

    chartsData.value[3] = { 
      'all': [{ name: 'Посетили', value: lib_visited }, { name: 'Не посетили', value: lib_not_visited }],
      '1-4': [{ name: 'Посетили', value: lib_1to4_visited }, { name: 'Не посетили', value: lib_1to4_not }],
      '5-11': [{ name: 'Посетили', value: lib_5to11_visited }, { name: 'Не посетили', value: lib_5to11_not }],
    }

  } catch (e) {
    console.error('Failed to fetch summary stats', e)
  }
}

watch([selectedRegion, selectedSchool, dateRange], () => {
  fetchSummaryData()
}, { immediate: true })

const budgetData = ref({
  saved: 0,
  planned: 0,
  spent: 0
})

const manualPlannedBudget = ref<string | number>('')
const manualMealPrice = ref<string | number>('')

const applyBudget = () => {
  const planned = Number(manualPlannedBudget.value)
  const price = Number(manualMealPrice.value)
  
  if (!isNaN(planned)) {
    budgetData.value.planned = planned
  }
  
  if (!isNaN(price)) {
    // Calculate spent based on meals count
    budgetData.value.spent = summaryData.value.mealsToday * price
  }
  
  budgetData.value.saved = budgetData.value.planned - budgetData.value.spent
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(value)
}

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
    ]
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
    ]
  },
  {
    id: 3,
    title: 'Посещение библиотеки',
    chartType: 'pie',
    filter: 'all',
    options: [
      { label: 'Все', value: 'all' },
      { label: '1-4 классы', value: '1-4' },
      { label: '5-11 классы', value: '5-11' },
    ]
  }
])

// Mock data generator based on topic and filter
const getChartData = (topicId: number, filter: FilterType) => {
  return chartsData.value[topicId]?.[filter] || []
}

</script>

<template>
  <div class="p-4 md:p-8 space-y-4">
    <!-- Header Frame for Filters -->
    <Card>
      <CardContent class="p-2 flex justify-end">
        <div class="flex flex-wrap items-center gap-4">
          <Select v-model="selectedRegion">
            <SelectTrigger class="w-[180px]">
              <SelectValue placeholder="Выберите регион" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Регионы</SelectLabel>
                <SelectItem v-for="region in regions" :key="region.value" :value="region.value">
                  {{ region.label }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <span class="text-muted-foreground font-bold">-</span>

          <Popover v-model:open="openSchool">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="openSchool"
                class="w-[250px] justify-between"
                :disabled="!selectedRegion"
              >
                <span class="truncate">
                  {{ selectedSchool
                    ? availableSchools.find((school) => school.value === selectedSchool)?.label
                    : "Выберите школу" }}
                </span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[250px] p-0">
              <Command>
                <CommandInput class="h-9" placeholder="Поиск школы..." />
                <CommandEmpty>Школа не найдена.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    <CommandItem
                      v-for="school in availableSchools"
                      :key="school.value"
                      :value="school.value"
                      @select="(ev) => {
                        if (typeof ev.detail.value === 'string') {
                          selectedSchool = ev.detail.value
                          openSchool = false
                        }
                      }"
                    >
                      {{ school.label }}
                      <Check
                        :class="cn(
                          'ml-auto h-4 w-4',
                          selectedSchool === school.value ? 'opacity-100' : 'opacity-0'
                        )"
                      />
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <span class="text-muted-foreground font-bold">-</span>

          <DateRangePicker v-model="dateRange" />
        </div>
      </CardContent>
    </Card>

    <!-- Summary and Budget Stats -->
    <div class="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-medium">Сводные данные</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users class="h-4 w-4" />
              Всего детей в системе
            </div>
            <div class="text-lg font-bold">{{ summaryData.totalChildren }}</div>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <School class="h-4 w-4" />
              Посетили школу сегодня
            </div>
            <div class="text-lg font-bold">{{ summaryData.visitedToday }}</div>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Utensils class="h-4 w-4" />
              Получили питание
            </div>
            <div class="text-lg font-bold">{{ summaryData.mealsToday }}</div>
          </div>
          <div class="pl-6 space-y-2 border-l-2 ml-2">
             <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">1-4 классы</span>
                <span class="font-semibold">{{ summaryData.meals1to4 }}</span>
             </div>
             <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">5-11 классы</span>
                <span class="font-semibold">{{ summaryData.meals5to11 }}</span>
             </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-lg font-medium">Управление бюджетом</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Calculator Input Side -->
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="meal-price-input">Стоимость питания (за ед.)</Label>
                <Input id="meal-price-input" type="number" placeholder="Введите стоимость" v-model="manualMealPrice" />
              </div>
              <div class="space-y-2">
                <Label for="budget-input">Запланированный бюджет</Label>
                <div class="flex w-full max-w-sm items-center space-x-2">
                  <Input id="budget-input" type="number" placeholder="Введите сумму" v-model="manualPlannedBudget" />
                  <Button type="button" @click="applyBudget">Применить</Button>
                </div>
                <p class="text-xs text-muted-foreground">
                  Укажите сумму для расчета экономии по выбранным фильтрам.
                </p>
              </div>
            </div>

            <!-- Results Side -->
            <div class="space-y-6">
              <div class="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-900/50">
                <div class="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
                  Сэкономлено
                </div>
                <div class="text-2xl font-bold text-green-700 dark:text-green-400">{{ formatCurrency(budgetData.saved) }}</div>
              </div>
              <div class="space-y-4">
                <div class="space-y-2">
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2 text-muted-foreground">
                          <Wallet class="h-4 w-4" />
                          Запланировано
                        </div>
                        <span class="font-semibold">{{ formatCurrency(budgetData.planned) }}</span>
                    </div>
                    <div class="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div class="h-full bg-primary" :style="{ width: (budgetData.planned > 0 ? (budgetData.spent / budgetData.planned * 100) : 0) + '%' }"></div>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2 text-muted-foreground">
                          <CreditCard class="h-4 w-4" />
                          Потрачено
                        </div>
                        <span class="font-semibold">{{ formatCurrency(budgetData.spent) }}</span>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-3">
      <Card v-for="topic in topics" :key="topic.id" class="flex flex-col h-full">
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

    <AnalyticsSavingsChart 
      :region-id="selectedRegion"
      :school-id="selectedSchool"
    />
  </div>
</template>
