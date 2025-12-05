import { notify } from '@/lib'
import { changeUserData, downloadUserPhoto, getPlannedBudgets, getRegions, getSchools, getUserData, setPlannedBudget } from '@/lib/api'
import { getWorkingDaysInMonth } from '@/lib/utils'
import { useAuth } from '@/stores/useAuth'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

export function useProfile() {
  const route = useRoute()
  const { authToken: token } = useAuth()

  const isLoading = ref(true)
  const user = ref<any>(null)
  const userPhotoUrl = ref('')
  const regions = ref<any[]>([])
  const schools = ref<any[]>([])

  // Profile Edit State
  const isEditing = ref(false)
  const isSavingProfile = ref(false)
  const editForm = ref({
    fullname: '',
    phone: '',
    iin: ''
  })

  // Budget Planning State
  const budgetForm = ref({
    regionId: '',
    schoolId: '',
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    studentCount: '',
    price: '',
    planSumAll: ''
  })
  const isSavingBudget = ref(false)
  const availableSchoolsForBudget = ref<any[]>([])
  const budgetHistory = ref<any[]>([])
  const activeTab = ref<'profile' | 'planning'>('profile')
  const existingBudgetId = ref<number | null>(null) // Track existing budget ID
  const hasLoadedExistingBudget = ref(false) // Track if we've loaded existing budget for current selection

  // History Pagination & Search
  const historySearch = ref('')
  const historyPage = ref(1)
  const historyItemsPerPage = ref('5')

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

  // Helpers
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

  // Find existing budget for selected school/month/year
  const findExistingBudget = () => {
    if (!budgetForm.value.schoolId || !budgetForm.value.year || !budgetForm.value.month) {
      existingBudgetId.value = null
      return null
    }

    const existing = budgetHistory.value.find(item => {
      const schoolMatch = budgetForm.value.schoolId
        ? Number(item.school_id) === Number(budgetForm.value.schoolId)
        : !item.school_id

      return schoolMatch &&
        Number(item.year) === Number(budgetForm.value.year) &&
        Number(item.month) === Number(budgetForm.value.month)
    })

    return existing
  }

  // helper: build ISO-like month string "YYYY-MM-01" or return undefined
  const buildMonthIso = (year?: string | number, month?: string | number) => {
    if (!year || !month) return undefined
    const y = String(year).trim()
    const m = String(month).trim().padStart(2, '0')
    if (!y || !m) return undefined
    return `${y}-${m}-01`
  }

  // Load existing budget data into form
  const loadExistingBudgetToForm = () => {
    const existing = findExistingBudget()

    if (existing) {
      existingBudgetId.value = existing.id

      // Calculate student count from existing data
      const workingDays = getWorkingDaysInMonth(Number(existing.year), Number(existing.month))
      const studentCount = existing.price && workingDays
        ? Math.round(existing.amount / (existing.price * workingDays))
        : ''

      budgetForm.value.studentCount = studentCount.toString()
      budgetForm.value.price = existing.price ? existing.price.toString() : ''

      notify('Информация', 'Загружены данные существующего плана', 'info')
    } else {
      existingBudgetId.value = null
      // Don't clear the form, just reset the tracking ID
    }
  }

  // Computed
  const filteredBudgetHistory = computed(() => {
    if (!historySearch.value) return budgetHistory.value

    const query = historySearch.value.toLowerCase()
    return budgetHistory.value.filter(item => {
      const schoolName = getSchoolNameById(item.school_id, item.school_name).toLowerCase()
      const monthName = String(getMonthName(item.month)).toLowerCase()
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

  const isEditingExistingBudget = computed(() => {
    return existingBudgetId.value !== null
  })

  // Methods
  // monthParam may be either numeric month (1..12) or already formatted string "YYYY-MM-01"
  const loadBudgetHistory = async (monthParam?: number | string, school_id?: number) => {
    try {
      let monthArg: string | undefined
      if (monthParam != null && String(monthParam).trim() !== '') {
        // if numeric month passed (1..12) -> use current budgetForm.year for year
        const num = Number(monthParam)
        if (!isNaN(num) && num >= 1 && num <= 12) {
          monthArg = buildMonthIso(budgetForm.value.year, num)
        } else {
          // assume already a proper string (e.g. "2025-12-01")
          monthArg = String(monthParam)
        }
      } else {
        // fallback to current selection in form
        monthArg = buildMonthIso(budgetForm.value.year, budgetForm.value.month)
      }

      const history = await getPlannedBudgets(monthArg, school_id, undefined, token.value)
      budgetHistory.value = history
    } catch (e) {
      console.error('Failed to load budget history', e)
    }
  }

  const handleSaveProfile = async () => {
    if (!token.value) return
    isSavingProfile.value = true
    try {
      await changeUserData(token.value, {
        phone: editForm.value.phone,
        new_fullname: editForm.value.fullname,
        new_iin: editForm.value.iin,
        device_token: ''
      })

      notify('Успешно', 'Данные профиля обновлены', 'success')
      isEditing.value = false
      // Refresh user data
      const userData = await getUserData(token.value)
      user.value = userData
    } catch (e: any) {
      notify('Ошибка', e.detail || 'Не удалось сохранить данные', 'error')
    } finally {
      isSavingProfile.value = false
    }
  }

  const cancelEdit = () => {
    isEditing.value = false
    if (user.value) {
      editForm.value = {
        fullname: user.value.fullname || '',
        phone: user.value.phone || '',
        iin: user.value.iin || ''
      }
    }
  }

  const handleSaveBudget = async () => {
    if (!budgetForm.value.studentCount || !budgetForm.value.price || !budgetForm.value.year || !budgetForm.value.month || !budgetForm.value.planSumAll) {
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
      const workingDays = getWorkingDaysInMonth(Number(budgetForm.value.year), Number(budgetForm.value.month))
      const calculatedAmount = Number(budgetForm.value.studentCount) * Number(budgetForm.value.price) * workingDays

      // Check if we're updating an existing budget
      const existingBudget = findExistingBudget()

      if (existingBudget) {
        // Update existing budget in local state
        const index = budgetHistory.value.findIndex(item => item.id === existingBudget.id)
        if (index !== -1) {
          budgetHistory.value[index] = {
            ...budgetHistory.value[index],
            plan_students_count: Number(budgetForm.value.studentCount),
            sum_per_student: Number(budgetForm.value.price),
            plan_sum_all: Number(budgetForm.value.planSumAll),
          }
        }
      }

      // send month as "YYYY-MM-01"
      const monthIso = buildMonthIso(budgetForm.value.year, budgetForm.value.month)
      const payload: any = {
        month: monthIso,
        plan_students_count: Number(budgetForm.value.studentCount),
        sum_per_student: Number(budgetForm.value.price),
        school_id: budgetForm.value.schoolId ? Number(budgetForm.value.schoolId) : undefined,
        plan_sum_all: Number(budgetForm.value.planSumAll),
      }

      // Add ID if updating existing budget
      if (existingBudget && existingBudget.id) {
        payload.id = existingBudget.id
      }

      console.log('Saving budget with payload:', payload) // Debug log
      await setPlannedBudget(payload, token.value)

      const message = existingBudget
        ? 'Бюджет успешно обновлен'
        : 'Бюджет запланирован'

      notify('Успешно', message, 'success')
      budgetForm.value.studentCount = '' // Reset student count
      budgetForm.value.price = '' // Reset price
      existingBudgetId.value = null // Reset tracking ID
      hasLoadedExistingBudget.value = false // Reset loaded flag
      // Refresh history for the same month/school we just saved
      await loadBudgetHistory(monthIso, budgetForm.value.schoolId ? Number(budgetForm.value.schoolId) : undefined)
    } catch (e: any) {
      console.error('Budget save error:', e) // Debug log
      notify('Ошибка', e.detail || 'Не удалось сохранить бюджет', 'error')
    } finally {
      isSavingBudget.value = false
    }
  }

  // Watchers
  watch(user, (newUser) => {
    if (newUser) {
      editForm.value = {
        fullname: newUser.fullname || '',
        phone: newUser.phone || '',
        iin: newUser.iin || ''
      }
    }
  })

  watch(historySearch, () => {
    historyPage.value = 1
  })

  watch(() => route.query.tab, (newTab) => {
    if (newTab === 'planning') {
      activeTab.value = 'planning'
    } else {
      activeTab.value = 'profile'
    }
  })

  watch(() => budgetForm.value.regionId, async (newRegionId) => {
    if (!newRegionId) {
      availableSchoolsForBudget.value = []
      budgetForm.value.schoolId = ''
      return
    }

    if (!user.value?.region_id || String(user.value.region_id) !== String(newRegionId)) {
      try {
        const data = await getSchools(newRegionId)
        availableSchoolsForBudget.value = Array.isArray(data) ? data : []
        budgetForm.value.schoolId = ''
      } catch (e) {
        console.error(e)
      }
    } else {
      availableSchoolsForBudget.value = schools.value
    }
  })

  // Watch for changes in school, year, or month to load existing budget
  watch(
    () => [budgetForm.value.schoolId, budgetForm.value.year, budgetForm.value.month],
    (newVal, oldVal) => {
      // Check if values actually changed
      const hasActuallyChanged = !oldVal ||
        newVal[0] !== oldVal[0] ||
        newVal[1] !== oldVal[1] ||
        newVal[2] !== oldVal[2]

      console.log('Watch triggered - schoolId/year/month changed:', {
        old: oldVal,
        new: newVal,
        hasLoaded: hasLoadedExistingBudget.value,
        hasActuallyChanged
      })

      // Only proceed if values actually changed
      if (!hasActuallyChanged) {
        console.log('Values are the same, skipping reload')
        return
      }

      // Reset the loaded flag when selection changes
      hasLoadedExistingBudget.value = false

      // Only load if all required fields are filled
      if (budgetForm.value.schoolId && budgetForm.value.year && budgetForm.value.month) {
        loadExistingBudgetToForm()
      }
    }
  )

  // Lifecycle
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

        // load history for current selection (will format month as YYYY-MM-01)
        await loadBudgetHistory()

        // Load existing budget if school is already selected
        if (budgetForm.value.schoolId && budgetForm.value.year && budgetForm.value.month) {
          loadExistingBudgetToForm()
        }

        try {
          const photoData = await downloadUserPhoto(token.value)
          if (photoData) {
            let url = ''
            if (typeof photoData === 'string') {
              url = photoData
            } else if (typeof photoData === 'object' && photoData !== null) {
              if ('photo' in photoData) url = photoData.photo
              else if ('image' in photoData) url = photoData.image
              else if ('data' in photoData) url = photoData.data
              else if ('url' in photoData) url = photoData.url
            }

            if (url) {
              url = url.trim().replace(/^"|"$/g, '')
              if (!url.startsWith('http') && !url.startsWith('data:')) {
                url = `data:image/jpeg;base64,${url}`
              }
              userPhotoUrl.value = url
            }
          }
        } catch (e) {
          console.warn('Failed to load user photo', e)
        }
      }
    } catch (e) {
      console.error('Failed to fetch user data', e)
    } finally {
      isLoading.value = false
    }
  })

  return {
    isLoading,
    user,
    userPhotoUrl,
    regions,
    schools,
    isEditing,
    isSavingProfile,
    editForm,
    budgetForm,
    isSavingBudget,
    availableSchoolsForBudget,
    budgetHistory,
    activeTab,
    historySearch,
    historyPage,
    historyItemsPerPage,
    filteredBudgetHistory,
    totalHistoryPages,
    paginatedBudgetHistory,
    regionName,
    schoolName,
    years,
    months,
    isEditingExistingBudget,
    handleSaveProfile,
    cancelEdit,
    handleSaveBudget,
    getMonthName,
    getSchoolNameById
  }
}