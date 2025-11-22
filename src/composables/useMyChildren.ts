import { ref, watch, onMounted, type Ref } from 'vue'
import { getPupils, getPupilStatuses, getPupilEvents, downloadStudentPhoto } from '@/lib/api'
import { useAuth } from '@/stores/useAuth'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { Baby, CalendarDays, Utensils } from 'lucide-vue-next'

export function useMyChildren() {
  const { authToken } = useAuth()
  const activeTab = ref('children')
  const children = ref<any[]>([])
  const loading = ref(false)
  const error = ref('')

  // Date filter state
  const dateRange = ref({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()),
  }) as Ref<DateRange>
  const selectedPeriod = ref('today')

  // Attendance/Dining state
  const events = ref<any[]>([])
  const eventsLoading = ref(false)
  const eventsError = ref('')
  const page = ref(1)
  const perPage = ref(10)

  const menuItems = [
    { id: 'children', label: 'Мои дети', icon: Baby },
    { id: 'attendance', label: 'Посещаемость', icon: CalendarDays },
    { id: 'dining', label: 'Льготное питание', icon: Utensils },
  ]

  const setPeriod = (period: string) => {
    selectedPeriod.value = period
    const now = today(getLocalTimeZone())
    
    switch (period) {
      case 'today':
        dateRange.value = { start: now, end: now }
        break
      case 'yesterday':
        const yest = now.subtract({ days: 1 })
        dateRange.value = { start: yest, end: yest }
        break
      case 'week':
        dateRange.value = { start: now.subtract({ days: 7 }), end: now }
        break
      case 'month':
        dateRange.value = { start: now.subtract({ days: 30 }), end: now }
        break
    }
  }

  const fetchChildren = async () => {
    if (!authToken.value) return
    loading.value = true
    error.value = ''
    try {
      const [pupilsData, statusData] = await Promise.all([
        getPupils(authToken.value),
        // 1=passage, 2=dining
        getPupilStatuses(authToken.value, ['1', '2'])
      ])
      
      children.value = pupilsData.map((child: any) => {
        const atSchool = statusData.pupils_at_school?.find((p: any) => p.id === child.id)?.status
        const hadLunch = statusData.pupils_had_lunch?.find((p: any) => p.id === child.id)?.status
        
        return { ...child, atSchool, hadLunch, photo_url: null }
      })

      // Fetch photos for each child
      children.value.forEach(async (child, index) => {
        try {
          const photoData = await downloadStudentPhoto(authToken.value!, child.iin)
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
              children.value[index].photo_url = url
            }
          }
        } catch (e: any) {
          console.warn(`Failed to load photo for child ${child.iin}:`, e)
        }
      })
    } catch (e: any) {
      console.error('Failed to fetch pupils:', e)
      error.value = 'Не удалось загрузить список детей'
    } finally {
      loading.value = false
    }
  }

  const fetchEvents = async () => {
    if (!authToken.value) return
    if (activeTab.value === 'children') return

    eventsLoading.value = true
    eventsError.value = ''
    events.value = []
    
    try {
      const start = dateRange.value.start?.toString()
      if (!start) return
      const end = dateRange.value.end?.toString() || start

      const eventClasses = activeTab.value === 'attendance' ? ['1'] : ['2']
      
      const data = await getPupilEvents(
        authToken.value!, 
        start, 
        end, 
        eventClasses,
        undefined, 
        true 
      )
      events.value = data.daily_events || []
      page.value = 1 
    } catch (e: any) {
      console.error('Failed to fetch events:', e)
      eventsError.value = 'Не удалось загрузить историю событий'
    } finally {
      eventsLoading.value = false
    }
  }

  watch(activeTab, (val) => {
    if (val !== 'children') {
      fetchEvents()
    }
  })

  watch(dateRange, () => {
    if (activeTab.value !== 'children') {
      fetchEvents()
    }
  })

  onMounted(fetchChildren)

  return {
    activeTab,
    children,
    loading,
    error,
    dateRange,
    selectedPeriod,
    events,
    eventsLoading,
    eventsError,
    page,
    perPage,
    menuItems,
    setPeriod,
    fetchChildren,
    fetchEvents
  }
}
