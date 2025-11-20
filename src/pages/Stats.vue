<script setup lang="ts">
import { ref, computed, onMounted, watch, type Ref } from 'vue'
import DateRangePicker from '@/components/DateRangePicker.vue'
import { getRegions, getSchools, getStudentsStats, getPassageStats, getDinnerStats } from '@/lib/api'
import {
  Card,
  CardContent,
  CardFooter,
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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import Button from '@/components/ui/button/Button.vue'
import { 
  Check,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-vue-next'
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

// Global Filters State
const selectedRegion = ref<string>('')
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
})

const fetchStatsData = async () => {
  if (!selectedRegion.value) return
  
  try {
    const startDate = dateRange.value.start?.toString() || ''
    const endDate = dateRange.value.end?.toString() || startDate

    const [studentsData, passageData, dinnerData] = await Promise.all([
      getStudentsStats(selectedRegion.value, selectedSchool.value),
      getPassageStats(startDate, endDate, selectedRegion.value, selectedSchool.value),
      getDinnerStats(startDate, endDate, selectedRegion.value, selectedSchool.value)
    ])
    
    const rows: StatsRow[] = []
    let idCounter = 1

    // Helper to find school in passageData
    const findPassageSchool = (schoolId: number) => {
      if (!Array.isArray(passageData)) return null
      for (const region of passageData) {
        if (region.schools) {
          const found = region.schools.find((s: any) => s.school_id === schoolId)
          if (found) return found
        }
      }
      return null
    }

    // Helper to find school in dinnerData
    const findDinnerSchool = (schoolId: number) => {
      if (!Array.isArray(dinnerData)) return null
      for (const region of dinnerData) {
        if (region.schools) {
          const found = region.schools.find((s: any) => s.school_id === schoolId)
          if (found) return found
        }
      }
      return null
    }

    if (Array.isArray(studentsData)) {
      studentsData.forEach((region: any) => {
        if (region.schools && Array.isArray(region.schools)) {
          region.schools.forEach((school: any) => {
            let g1to4 = 0
            let g5to11 = 0
            let staff = 0

            // Calculate totals from studentsData
            if (school.classes && Array.isArray(school.classes)) {
              school.classes.forEach((c: any) => {
                const grade = String(c.grade).toLowerCase()
                const count = c.total_students || 0

                if (['0', '1', '2', '3', '4', 'kp', 'кп'].includes(grade)) {
                  g1to4 += count
                } else if (['5', '6', '7', '8', '9', '10', '11', '12'].includes(grade)) {
                  g5to11 += count
                } else if (grade.includes('персонал') || grade.includes('staff') || grade.includes('teacher')) {
                  staff += count
                } else {
                  const num = parseInt(grade)
                  if (!isNaN(num)) {
                    if (num >= 0 && num <= 4) g1to4 += count
                    else if (num >= 5 && num <= 12) g5to11 += count
                  }
                }
              })
            }

            // Calculate visited from passageData
            let v_g1to4 = 0
            let v_g5to11 = 0
            let v_staff = 0

            const passageSchool = findPassageSchool(school.school_id)
            if (passageSchool && passageSchool.classes) {
              passageSchool.classes.forEach((c: any) => {
                const grade = String(c.grade).toLowerCase()
                const visited = c.students_who_attended || 0

                if (['0', '1', '2', '3', '4', 'kp', 'кп'].includes(grade)) {
                  v_g1to4 += visited
                } else if (['5', '6', '7', '8', '9', '10', '11', '12'].includes(grade)) {
                  v_g5to11 += visited
                } else if (grade.includes('персонал') || grade.includes('staff') || grade.includes('teacher')) {
                  v_staff += visited
                } else {
                  const num = parseInt(grade)
                  if (!isNaN(num)) {
                    if (num >= 0 && num <= 4) v_g1to4 += visited
                    else if (num >= 5 && num <= 12) v_g5to11 += visited
                  }
                }
              })
            }

            // Calculate meals from dinnerData
            let m_g1to4_received = 0
            let m_g1to4_total = 0 // to calc %
            let m_g5to11_received = 0
            let m_g5to11_total = 0 // to calc %

            const dinnerSchool = findDinnerSchool(school.school_id)
            if (dinnerSchool && dinnerSchool.classes) {
              dinnerSchool.classes.forEach((c: any) => {
                const grade = String(c.grade).toLowerCase()
                const received = c.students_with_meals || 0
                const total = c.total_students || 0

                if (['0', '1', '2', '3', '4', 'kp', 'кп'].includes(grade)) {
                  m_g1to4_received += received
                  m_g1to4_total += total
                } else if (['5', '6', '7', '8', '9', '10', '11', '12'].includes(grade)) {
                  m_g5to11_received += received
                  m_g5to11_total += total
                } else {
                  const num = parseInt(grade)
                  if (!isNaN(num)) {
                    if (num >= 0 && num <= 4) {
                      m_g1to4_received += received
                      m_g1to4_total += total
                    }
                    else if (num >= 5 && num <= 12) {
                      m_g5to11_received += received
                      m_g5to11_total += total
                    }
                  }
                }
              })
            }

            rows.push({
              id: idCounter++,
              schoolName: school.school_name,
              city: region.region_name,
              totalSystem: {
                grades1to4: g1to4,
                grades5to11: g5to11,
                totalStudents: school.total_students,
                staff: staff
              },
              visited: {
                grades1to4: v_g1to4,
                grades5to11: v_g5to11,
                staff: v_staff
              },
              meals1to4: {
                received: m_g1to4_received,
                percentage: m_g1to4_total > 0 ? Math.round((m_g1to4_received / m_g1to4_total) * 100) : 0
              },
              meals5to11: {
                received: m_g5to11_received,
                percentage: m_g5to11_total > 0 ? Math.round((m_g5to11_received / m_g5to11_total) * 100) : 0
              }
            })
          })
        }
      })
    }
    statsData.value = rows
  } catch (e) {
    console.error('Failed to fetch stats', e)
    statsData.value = []
  }
}

watch([selectedRegion, selectedSchool, dateRange], () => {
  fetchStatsData()
})

interface StatsRow {
  id: number
  schoolName: string
  city: string
  totalSystem: {
    grades1to4: number
    grades5to11: number
    totalStudents: number
    staff: number
  }
  visited: {
    grades1to4: number
    grades5to11: number
    staff: number
  }
  meals1to4: {
    received: number
    percentage: number
  }
  meals5to11: {
    received: number
    percentage: number
  }
}

const statsData = ref<StatsRow[]>([])
const page = ref(1)
const perPage = ref(10)

const total = computed(() => statsData.value.length)

const paginatedStatsData = computed(() => {
  const start = (page.value - 1) * perPage.value
  const end = start + perPage.value
  return statsData.value.slice(start, end)
})

const totalStats = computed(() => {
  if (statsData.value.length === 0) return null
  
  return statsData.value.reduce((acc, curr) => {
    return {
      totalSystem: {
        grades1to4: acc.totalSystem.grades1to4 + curr.totalSystem.grades1to4,
        grades5to11: acc.totalSystem.grades5to11 + curr.totalSystem.grades5to11,
        totalStudents: acc.totalSystem.totalStudents + curr.totalSystem.totalStudents,
        staff: acc.totalSystem.staff + curr.totalSystem.staff
      },
      visited: {
        grades1to4: acc.visited.grades1to4 + curr.visited.grades1to4,
        grades5to11: acc.visited.grades5to11 + curr.visited.grades5to11,
        staff: acc.visited.staff + curr.visited.staff
      },
      meals1to4: {
        received: acc.meals1to4.received + curr.meals1to4.received,
        percentage: 0 // Will calculate after
      },
      meals5to11: {
        received: acc.meals5to11.received + curr.meals5to11.received,
        percentage: 0 // Will calculate after
      }
    }
  }, {
    totalSystem: { grades1to4: 0, grades5to11: 0, totalStudents: 0, staff: 0 },
    visited: { grades1to4: 0, grades5to11: 0, staff: 0 },
    meals1to4: { received: 0, percentage: 0 },
    meals5to11: { received: 0, percentage: 0 }
  })
})
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

    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead rowspan="2" class="w-[50px] text-center border-r">№</TableHead>
              <TableHead rowspan="2" class="min-w-[200px] border-r">Школа</TableHead>
              <TableHead rowspan="2" class="min-w-[120px] border-r">Город</TableHead>
              <TableHead colspan="4" class="text-center border-r border-b">Всего занесено в систему</TableHead>
              <TableHead colspan="3" class="text-center border-r border-b">Посетило на дату</TableHead>
              <TableHead colspan="2" class="text-center border-r border-b">Питание 1-4 классы</TableHead>
              <TableHead colspan="2" class="text-center border-b">Питание 5-11 классы</TableHead>
            </TableRow>
            <TableRow>
              <!-- Всего занесено -->
              <TableHead class="text-center border-r text-xs">1-4</TableHead>
              <TableHead class="text-center border-r text-xs">5-11</TableHead>
              <TableHead class="text-center border-r text-xs">Всего уч.</TableHead>
              <TableHead class="text-center border-r text-xs">Персонал</TableHead>
              
              <!-- Посетило -->
              <TableHead class="text-center border-r text-xs">1-4</TableHead>
              <TableHead class="text-center border-r text-xs">5-11</TableHead>
              <TableHead class="text-center border-r text-xs">Персонал</TableHead>

              <!-- Питание 1-4 -->
              <TableHead class="text-center border-r text-xs">Получили</TableHead>
              <TableHead class="text-center border-r text-xs">%</TableHead>

              <!-- Питание 5-11 -->
              <TableHead class="text-center border-r text-xs">Получили</TableHead>
              <TableHead class="text-center text-xs">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="statsData.length === 0">
              <TableCell colspan="14" class="h-24 text-center">
                Нет данных
              </TableCell>
            </TableRow>
            <TableRow v-for="(row, index) in paginatedStatsData" :key="row.id" :class="index % 2 === 0 ? 'bg-blue-50/50 dark:bg-blue-900/20' : 'bg-background dark:bg-background'">
              <TableCell class="text-center border-r">{{ (page - 1) * perPage + index + 1 }}</TableCell>
              <TableCell class="font-medium border-r">{{ row.schoolName }}</TableCell>
              <TableCell class="border-r">{{ row.city }}</TableCell>
              
              <TableCell class="text-center border-r">{{ row.totalSystem.grades1to4 }}</TableCell>
              <TableCell class="text-center border-r">{{ row.totalSystem.grades5to11 }}</TableCell>
              <TableCell class="text-center border-r">{{ row.totalSystem.totalStudents }}</TableCell>
              <TableCell class="text-center border-r">{{ row.totalSystem.staff }}</TableCell>

              <TableCell class="text-center border-r">{{ row.visited.grades1to4 }}</TableCell>
              <TableCell class="text-center border-r">{{ row.visited.grades5to11 }}</TableCell>
              <TableCell class="text-center border-r">{{ row.visited.staff }}</TableCell>

              <TableCell class="text-center border-r">{{ row.meals1to4.received }}</TableCell>
              <TableCell class="text-center border-r">{{ row.meals1to4.percentage }}%</TableCell>

              <TableCell class="text-center border-r">{{ row.meals5to11.received }}</TableCell>
              <TableCell class="text-center">{{ row.meals5to11.percentage }}%</TableCell>
            </TableRow>
            <!-- Total Row -->
            <TableRow v-if="totalStats" class="bg-muted/50 font-bold">
              <TableCell class="text-center border-r" colspan="3">Итого</TableCell>
              
              <TableCell class="text-center border-r">{{ totalStats.totalSystem.grades1to4 }}</TableCell>
              <TableCell class="text-center border-r">{{ totalStats.totalSystem.grades5to11 }}</TableCell>
              <TableCell class="text-center border-r">{{ totalStats.totalSystem.totalStudents }}</TableCell>
              <TableCell class="text-center border-r">{{ totalStats.totalSystem.staff }}</TableCell>

              <TableCell class="text-center border-r">{{ totalStats.visited.grades1to4 }}</TableCell>
              <TableCell class="text-center border-r">{{ totalStats.visited.grades5to11 }}</TableCell>
              <TableCell class="text-center border-r">{{ totalStats.visited.staff }}</TableCell>

              <TableCell class="text-center border-r">{{ totalStats.meals1to4.received }}</TableCell>
              <TableCell class="text-center border-r">-</TableCell>

              <TableCell class="text-center border-r">{{ totalStats.meals5to11.received }}</TableCell>
              <TableCell class="text-center">-</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter class="flex items-center justify-end py-4 gap-4">
        <div class="flex items-center space-x-2">
          <Select
            :model-value="`${perPage}`"
            @update:model-value="(v) => perPage = Number(v)"
          >
            <SelectTrigger class="h-8 w-[70px]">
              <SelectValue :placeholder="`${perPage}`" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem v-for="pageSize in [10, 20, 30, 40, 50]" :key="pageSize" :value="`${pageSize}`">
                {{ pageSize }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination v-model:page="page" :total="total" :sibling-count="1" show-edges :items-per-page="perPage">
          <PaginationContent v-slot="{ items }">
            <PaginationFirst>
              <ChevronsLeft class="h-4 w-4" />
            </PaginationFirst>
            <PaginationPrevious>
              <ChevronLeft class="h-4 w-4" />
            </PaginationPrevious>

            <template v-for="(item, index) in items">
              <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" :is-active="item.value === page">
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" />
            </template>

            <PaginationNext>
              <ChevronRight class="h-4 w-4" />
            </PaginationNext>
            <PaginationLast>
              <ChevronsRight class="h-4 w-4" />
            </PaginationLast>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  </div>
</template>
