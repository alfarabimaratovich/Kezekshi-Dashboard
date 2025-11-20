<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { getUserData, getRegions, getSchools, setPlannedBudget, getPlannedBudgets } from '@/lib/api'
import { useAuth } from '@/stores/useAuth'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Phone, Mail, Shield, Building, School, CreditCard, Wallet, Save, Search, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { notify } from '@/lib'

import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { authToken: token } = useAuth()
const isLoading = ref(true)
const user = ref<any>(null)
const regions = ref<any[]>([])
const schools = ref<any[]>([])

// Budget Planning State
const budgetForm = ref({
  regionId: '',
  schoolId: '',
  year: new Date().getFullYear().toString(),
  month: (new Date().getMonth() + 1).toString(),
  amount: '',
  price: ''
})
const isSavingBudget = ref(false)
const availableSchoolsForBudget = ref<any[]>([])
const budgetHistory = ref<any[]>([])
const activeTab = ref<'profile' | 'planning'>('profile')
const planningSubTab = ref<'new' | 'history'>('new')

// History Pagination & Search
const historySearch = ref('')
const historyPage = ref(1)
const historyItemsPerPage = ref('5')

const filteredBudgetHistory = computed(() => {
  if (!historySearch.value) return budgetHistory.value
  
  const query = historySearch.value.toLowerCase()
  return budgetHistory.value.filter(item => {
    const schoolName = getSchoolNameById(item.school_id, item.school_name).toLowerCase()
    const monthName = getMonthName(item.month).toLowerCase()
    const year = String(item.year)
    
    return schoolName.includes(query) || 
           monthName.includes(query) || 
           year.includes(query)
  })
})

const totalHistoryPages = computed(() => {
  return Math.ceil(filteredBudgetHistory.value.length / Number(historyItemsPerPage.value))
})

const paginatedBudgetHistory = computed(() => {
  const start = (historyPage.value - 1) * Number(historyItemsPerPage.value)
  const end = start + Number(historyItemsPerPage.value)
  return filteredBudgetHistory.value.slice(start, end)
})

watch(historySearch, () => {
  historyPage.value = 1
})

const years = [2024, 2025, 2026]
const months = [
  { value: '1', label: 'Январь' },
  { value: '2', label: 'Февраль' },
  { value: '3', label: 'Март' },
  { value: '4', label: 'Апрель' },
  { value: '5', label: 'Май' },
  { value: '6', label: 'Июнь' },
  { value: '7', label: 'Июль' },
  { value: '8', label: 'Август' },
  { value: '9', label: 'Сентябрь' },
  { value: '10', label: 'Октябрь' },
  { value: '11', label: 'Ноябрь' },
  { value: '12', label: 'Декабрь' },
]

const loadBudgetHistory = async () => {
  try {
    const history = await getPlannedBudgets()
    budgetHistory.value = history
  } catch (e) {
    console.error('Failed to load budget history', e)
  }
}

onMounted(async () => {
  try {
    if (route.query.tab === 'planning') {
      activeTab.value = 'planning'
    }

    if (token.value) {
      const [userData, regionsData] = await Promise.all([
        getUserData(token.value),
        getRegions()
      ])
      user.value = userData
      regions.value = Array.isArray(regionsData) ? regionsData : []

      if (user.value) {
        // Pre-fill budget form with user's region/school if available
        if (user.value.region_id) {
          budgetForm.value.regionId = String(user.value.region_id)
          const schoolsData = await getSchools(user.value.region_id)
          schools.value = Array.isArray(schoolsData) ? schoolsData : []
          availableSchoolsForBudget.value = schools.value
        }
        
        if (user.value.school_id) {
          budgetForm.value.schoolId = String(user.value.school_id)
        }
      }
      
      // Load history
      await loadBudgetHistory()
    }
  } catch (e) {
    console.error('Failed to fetch user data', e)
  } finally {
    isLoading.value = false
  }
})

watch(() => route.query.tab, (newTab) => {
  if (newTab === 'planning') {
    activeTab.value = 'planning'
  } else {
    activeTab.value = 'profile'
  }
})

// Watch for region change in budget form to update schools list
watch(() => budgetForm.value.regionId, async (newRegionId) => {
  if (!newRegionId) {
    availableSchoolsForBudget.value = []
    budgetForm.value.schoolId = ''
    return
  }
  
  // If user is bound to a region, they can't change it, so this watch might be redundant for them,
  // but useful for admins who can select region.
  // If user is NOT bound to a region (e.g. superadmin), we fetch schools for the selected region.
  if (!user.value?.region_id || String(user.value.region_id) !== String(newRegionId)) {
     try {
       const data = await getSchools(newRegionId)
       availableSchoolsForBudget.value = Array.isArray(data) ? data : []
       budgetForm.value.schoolId = ''
     } catch (e) {
       console.error(e)
     }
  } else {
    // If it matches user's region, we already have schools loaded in onMounted
    availableSchoolsForBudget.value = schools.value
  }
})

const handleSaveBudget = async () => {
  if (!budgetForm.value.amount || !budgetForm.value.year || !budgetForm.value.month) {
    notify('Ошибка', 'Заполните все обязательные поля', 'warning')
    return
  }

  // Find school name
  let schoolName: string | undefined
  const selectedSchool = availableSchoolsForBudget.value.find(s => String(s.school_id) === budgetForm.value.schoolId)
  
  if (selectedSchool) {
    schoolName = selectedSchool.school_name_ru
  } else {
    // Fallback: try to find in user's schools list
    const s = schools.value.find(s => String(s.school_id) === budgetForm.value.schoolId)
    if (s) schoolName = s.school_name_ru
  }

  isSavingBudget.value = true
  try {
    await setPlannedBudget({
      year: Number(budgetForm.value.year),
      month: Number(budgetForm.value.month),
      amount: Number(budgetForm.value.amount),
      price: Number(budgetForm.value.price),
      region_id: budgetForm.value.regionId ? Number(budgetForm.value.regionId) : undefined,
      school_id: budgetForm.value.schoolId ? Number(budgetForm.value.schoolId) : undefined,
      school_name: schoolName
    })
    notify('Успешно', 'Бюджет запланирован', 'success')
    budgetForm.value.amount = '' // Reset amount
    await loadBudgetHistory() // Refresh history
  } catch (e: any) {
    notify('Ошибка', e.detail || 'Не удалось сохранить бюджет', 'error')
  } finally {
    isSavingBudget.value = false
  }
}

const getInitials = (name: string) => {
  if (!name) return 'U'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const regionName = computed(() => {
  if (!user.value || !user.value.region_id) return ''
  const r = regions.value.find((r: any) => r.id === user.value.region_id)
  return r ? r.name_ru : user.value.region_id
})

const schoolName = computed(() => {
  if (!user.value || !user.value.school_id) return ''
  const s = schools.value.find((s: any) => s.school_id === user.value.school_id)
  return s ? s.school_name_ru : user.value.school_id
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(value)
}

const getMonthName = (month: number) => {
  return months.find(m => Number(m.value) === month)?.label || month
}

const getSchoolNameById = (id: number, savedName?: string) => {
  if (savedName) return savedName
  if (!id) return 'Все школы'
  
  // Try to find in available schools first
  let s = availableSchoolsForBudget.value.find((s: any) => Number(s.school_id) === id)
  if (s) return s.school_name_ru
  
  // Try to find in user's schools list
  s = schools.value.find((s: any) => Number(s.school_id) === id)
  if (s) return s.school_name_ru
  
  return `Школа #${id}`
}
</script>

<template>
  <div class="container max-w-7xl py-6 mx-auto px-4 sm:px-6">
    <div v-if="isLoading" class="flex justify-center py-12">
      <Spinner />
    </div>

    <div v-else-if="user" class="grid gap-6 lg:grid-cols-[320px_1fr] md:grid-cols-[260px_1fr]">
      <!-- Sidebar / User Card -->
      <div class="space-y-6">
        <Card class="h-fit sticky top-6">
          <CardHeader class="text-center">
            <div class="flex justify-center mb-4">
              <Avatar class="w-24 h-24">
                <AvatarImage src="" alt="Avatar" />
                <AvatarFallback class="text-2xl">{{ getInitials(user.fullname) }}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{{ user.fullname || 'Пользователь' }}</CardTitle>
            <CardDescription>{{ user.roles && user.roles.length ? user.roles.join(', ') : 'Пользователь системы' }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone class="w-4 h-4" />
                <span>{{ user.phone }}</span>
              </div>
              <div v-if="user.iin" class="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard class="w-4 h-4" />
                <span>{{ user.iin }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Main Content / Details -->
      <div class="space-y-6">
        <!-- Tabs Toggle (Only visible if not coming from navbar planning link, or maybe always visible but redundant if we want strict separation) -->
        <!-- User asked to remove Planning to Profile button. So maybe hide this toggle if we are in 'planning' mode via route? 
             But user might want to switch back. Let's keep it simple: 
             If activeTab is planning, show the sub-toggle for History.
        -->
        
        <div v-if="activeTab === 'profile'" class="space-y-6">
          <div class="flex items-center justify-between">
             <h2 class="text-2xl font-bold tracking-tight">Личный кабинет</h2>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Личная информация</CardTitle>
              <CardDescription>Основные данные вашего профиля</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="grid gap-2">
                  <Label for="name">ФИО</Label>
                  <Input id="name" :model-value="user.fullname" readonly />
                </div>
                <div class="grid gap-2">
                  <Label for="phone">Номер телефона</Label>
                  <Input id="phone" :model-value="user.phone" readonly />
                </div>
                <div class="grid gap-2" v-if="user.iin">
                  <Label for="iin">ИИН</Label>
                  <Input id="iin" :model-value="user.iin" readonly />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card v-if="user.school_id || user.region_id">
            <CardHeader>
              <CardTitle>Организация</CardTitle>
              <CardDescription>Информация о месте работы</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="grid gap-2" v-if="user.school_id">
                  <Label>Школа</Label>
                  <div class="flex items-center gap-2 p-3 border rounded-md bg-muted/50 h-10">
                    <School class="w-4 h-4 text-muted-foreground shrink-0" />
                    <span class="truncate" :title="schoolName">{{ schoolName }}</span>
                  </div>
                </div>
                <div class="grid gap-2" v-if="user.region_id">
                  <Label>Регион</Label>
                  <div class="flex items-center gap-2 p-3 border rounded-md bg-muted/50 h-10">
                    <Building class="w-4 h-4 text-muted-foreground shrink-0" />
                    <span class="truncate" :title="regionName">{{ regionName }}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Planning Tab -->
        <div v-if="activeTab === 'planning'" class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h2 class="text-2xl font-bold tracking-tight">Планирование бюджета</h2>
             
             <!-- Sub-tab Toggle for Planning vs History -->
             <div class="flex p-1 space-x-1 bg-muted/50 rounded-lg w-full sm:w-fit">
                <button
                  @click="planningSubTab = 'new'"
                  class="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all"
                  :class="planningSubTab === 'new' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
                >
                  Новый план
                </button>
                <button
                  @click="planningSubTab = 'history'"
                  class="flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all"
                  :class="planningSubTab === 'history' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
                >
                  История
                </button>
             </div>
          </div>

          <Card v-if="planningSubTab === 'new'">
            <CardHeader>
              <CardTitle>Создание плана</CardTitle>
              <CardDescription>Укажите плановую сумму расходов</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Region Select -->
                <div class="space-y-2">
                  <Label>Регион</Label>
                  <Select v-model="budgetForm.regionId" :disabled="!!user.region_id">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="Выберите регион" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="region in regions" :key="region.id" :value="String(region.id)">
                        {{ region.name_ru }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <!-- School Select -->
                <div class="space-y-2">
                  <Label>Школа</Label>
                  <Select v-model="budgetForm.schoolId" :disabled="!!user.school_id || !budgetForm.regionId">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="Выберите школу" class="text-left" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="school in availableSchoolsForBudget" :key="school.school_id" :value="String(school.school_id)">
                        <span class="block truncate max-w-[300px] sm:max-w-[450px]" :title="school.school_name_ru">
                          {{ school.school_name_ru }}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <!-- Year Select -->
                <div class="space-y-2">
                  <Label>Год</Label>
                  <Select v-model="budgetForm.year">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="Год" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="year in years" :key="year" :value="String(year)">
                        {{ year }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <!-- Month Select -->
                <div class="space-y-2">
                  <Label>Месяц</Label>
                  <Select v-model="budgetForm.month">
                    <SelectTrigger class="w-full">
                      <SelectValue placeholder="Месяц" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="month in months" :key="month.value" :value="month.value">
                        {{ month.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <!-- Amount Input -->
                <div class="space-y-2">
                  <Label>Сумма (KZT)</Label>
                  <div class="relative">
                    <Wallet class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="Введите сумму" 
                      class="pl-9 w-full" 
                      v-model="budgetForm.amount"
                    />
                  </div>
                </div>

                <!-- Price Input -->
                <div class="space-y-2">
                  <Label>Стоимость питания (за ед.)</Label>
                  <div class="relative">
                    <CreditCard class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="number" 
                      placeholder="Цена за порцию" 
                      class="pl-9 w-full" 
                      v-model="budgetForm.price"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter class="flex justify-end">
              <Button @click="handleSaveBudget" :disabled="isSavingBudget">
                <Save class="mr-2 h-4 w-4" />
                {{ isSavingBudget ? 'Сохранение...' : 'Сохранить' }}
              </Button>
            </CardFooter>
          </Card>

          <!-- Budget History Card -->
          <Card v-if="planningSubTab === 'history'">
            <CardHeader>
              <CardTitle>История планирования</CardTitle>
              <CardDescription>Ранее запланированные бюджеты</CardDescription>
            </CardHeader>
            <CardContent>
              <div class="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
                <div class="relative w-full sm:w-72">
                  <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    v-model="historySearch"
                    placeholder="Поиск по школе, году..."
                    class="pl-9"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-muted-foreground whitespace-nowrap">Показывать по:</span>
                  <Select v-model="historyItemsPerPage">
                    <SelectTrigger class="w-[70px]">
                      <SelectValue placeholder="5" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div v-if="paginatedBudgetHistory.length > 0">
                <div class="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Период</TableHead>
                        <TableHead>Школа</TableHead>
                        <TableHead>Сумма</TableHead>
                        <TableHead>Цена</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow v-for="(item, index) in paginatedBudgetHistory" :key="index">
                        <TableCell class="font-medium">
                          {{ getMonthName(item.month) }} {{ item.year }}
                        </TableCell>
                        <TableCell>
                          <span class="truncate max-w-[150px] block" :title="getSchoolNameById(item.school_id, item.school_name)">
                            {{ getSchoolNameById(item.school_id, item.school_name) }}
                          </span>
                        </TableCell>
                        <TableCell>{{ formatCurrency(item.amount) }}</TableCell>
                        <TableCell>{{ formatCurrency(item.price) }}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <!-- Pagination Controls -->
                <div class="flex items-center justify-end space-x-2 py-4">
                  <div class="text-sm text-muted-foreground mr-4">
                    Страница {{ historyPage }} из {{ totalHistoryPages }}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="historyPage <= 1"
                    @click="historyPage--"
                  >
                    <ChevronLeft class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    :disabled="historyPage >= totalHistoryPages"
                    @click="historyPage++"
                  >
                    <ChevronRight class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div v-else class="text-center py-8 text-muted-foreground">
                {{ historySearch ? 'Ничего не найдено' : 'История пуста' }}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-12 text-center">
      <Shield class="w-12 h-12 mb-4 text-muted-foreground" />
      <h3 class="text-lg font-semibold">Не удалось загрузить профиль</h3>
      <p class="text-muted-foreground">Попробуйте обновить страницу или войти заново.</p>
    </div>
  </div>
</template>
