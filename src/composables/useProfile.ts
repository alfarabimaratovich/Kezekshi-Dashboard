import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getUserData, getRegions, getSchools, setPlannedBudget, getPlannedBudgets, changeUserData, downloadUserPhoto } from '@/lib/api'
import { useAuth } from '@/stores/useAuth'
import { notify } from '@/lib'
import { getWorkingDaysInMonth } from '@/lib/utils'

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
    price: ''
  })
  const isSavingBudget = ref(false)
  const availableSchoolsForBudget = ref<any[]>([])
  const budgetHistory = ref<any[]>([])
  const activeTab = ref<'profile' | 'planning'>('profile')

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

  // Methods
  const loadBudgetHistory = async () => {
    try {
      const history = await getPlannedBudgets()
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
    if (!budgetForm.value.studentCount || !budgetForm.value.price || !budgetForm.value.year || !budgetForm.value.month) {
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
      
      await setPlannedBudget({
        year: Number(budgetForm.value.year),
        month: Number(budgetForm.value.month),
        amount: calculatedAmount,
        price: Number(budgetForm.value.price),
        region_id: budgetForm.value.regionId ? Number(budgetForm.value.regionId) : undefined,
        school_id: budgetForm.value.schoolId ? Number(budgetForm.value.schoolId) : undefined,
        school_name: schoolName
      })
      notify('Успешно', 'Бюджет запланирован', 'success')
      budgetForm.value.studentCount = '' // Reset student count
      await loadBudgetHistory() // Refresh history
    } catch (e: any) {
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
        
        await loadBudgetHistory()

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
    handleSaveProfile,
    cancelEdit,
    handleSaveBudget,
    getMonthName,
    getSchoolNameById
  }
}
