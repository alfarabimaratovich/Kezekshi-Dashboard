import { ref, onMounted, watch, type Ref } from 'vue'
import { getRegions, getSchools, getStudentsStats, getPassageStats, getDinnerStats, getLibraryStats, getSummaryStats } from '@/lib/api'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateRange } from 'reka-ui'

export function useDashboard() {
  // Global Filters State
  const selectedRegion = ref<string>('all')
  const selectedSchool = ref<string>('')
  const dateRange = ref({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()),
  }) as Ref<DateRange>

  const regions = ref<{ value: string; label: string }[]>([])
  const availableSchools = ref<{ value: string; label: string }[]>([])

  // Data States
  const summaryData = ref({
    totalChildren: 0,
    visitedToday: 0,
    mealsToday: 0,
    meals1to4: 0,
    meals5to11: 0
  })

  const chartsData = ref<Record<number, any>>({
    1: [], // Attendance
    2: [], // Meals
    3: []  // Books
  })

  const budgetData = ref({
    saved: 0,
    planned: 0,
    spent: 0
  })

  const manualStudentCount = ref<string | number>('')
  const manualMealPrice = ref<string | number>('')

  // Methods
  const applyBudget = () => {
    const students = Number(manualStudentCount.value)
    const price = Number(manualMealPrice.value)
    
    if (!isNaN(students) && !isNaN(price)) {
      budgetData.value.planned = students * price
    }
    
    if (!isNaN(price)) {
      budgetData.value.spent = summaryData.value.mealsToday * price
    }
    
    budgetData.value.saved = budgetData.value.planned - budgetData.value.spent
  }

  const fetchSummaryData = async () => {
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
        
        if (manualStudentCount.value && manualMealPrice.value) {
           budgetData.value.planned = Number(manualStudentCount.value) * Number(manualMealPrice.value)
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
      
      // Calculate Visited Today (from passageData)
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

      // Calculate Meals (from dinnerData)
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

  // Lifecycle & Watchers
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

  watch([selectedRegion, selectedSchool, dateRange], () => {
    fetchSummaryData()
  }, { immediate: true })

  return {
    selectedRegion,
    selectedSchool,
    dateRange,
    regions,
    availableSchools,
    summaryData,
    chartsData,
    budgetData,
    manualStudentCount,
    manualMealPrice,
    applyBudget
  }
}
