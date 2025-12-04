import { getDinnerStats, getPassageStats, getRegions, getSchools, getStudentsStats } from '@/lib/api'
import { useSecurityStore } from '@/stores/securityStore'
import { useAuth } from '@/stores/useAuth'
import { getLocalTimeZone, today } from '@internationalized/date'
import type { DateRange } from 'reka-ui'
import { computed, onMounted, ref, watch, type Ref } from 'vue'

export interface StatsRow {
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

export function useStats() {
  const selectedRegion = ref<string>('')
  const selectedSchool = ref<string>('')

  const security = useSecurityStore()
  const auth = useAuth()

  const dateRange = ref({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()),
  }) as Ref<DateRange>

  const regions = ref<{ value: string; label: string }[]>([])
  const availableSchools = ref<{ value: string; label: string }[]>([])
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

  const fetchStatsData = async () => {
    if (!selectedRegion.value) return
    const token = auth.authToken.value || ''
    try {
      const startDate = dateRange.value.start?.toString() || ''
      const endDate = dateRange.value.end?.toString() || startDate

      const [studentsData, passageData, dinnerData] = await Promise.all([
        getStudentsStats(selectedRegion.value, selectedSchool.value, token),
        getPassageStats(startDate, endDate, selectedRegion.value, selectedSchool.value, token),
        getDinnerStats(startDate, endDate, selectedRegion.value, selectedSchool.value, token)
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

        // If user is SC — restrict schools to his own school_id
        if (security.isSC && security.userSchoolId != null) {
          const mySchool = schools.find(s => Number(s.value) === Number(security.userSchoolId))
          if (mySchool) {
            availableSchools.value = [{ value: String(mySchool.value), label: mySchool.label }]
            selectedSchool.value = String(mySchool.value)
            return
          }
          availableSchools.value = []
          selectedSchool.value = ''
          return
        }

        // Default: all schools for region
        availableSchools.value = [{ value: 'all', label: 'Все школы' }, ...schools]
      }
    } catch (e) {
      console.error('Failed to fetch schools', e)
      availableSchools.value = []
    }
  }, { immediate: true })

  watch([selectedRegion, selectedSchool, dateRange], () => {
    fetchStatsData()
  })

  onMounted(async () => {
    // ensure profile loaded so security.userRegionId / userSchoolId are available
    if (auth.isAuth.value && !auth.userProfile?.value) {
      try { await auth.fetchProfile() } catch (e) { /* guard elsewhere will handle auth */ }
    }

    try {
      const data = await getRegions()
      if (Array.isArray(data)) {
        const mapped = data.map((r: any) => ({ value: String(r.id), label: r.name_ru, id: r.id }))

        // DE: restrict regions to user's region_id
        if (security.isDE && security.userRegionId != null) {
          const myRegion = mapped.find(r => Number(r.id) === Number(security.userRegionId))
          if (myRegion) {
            regions.value = [{ value: String(myRegion.id), label: myRegion.label }]
            selectedRegion.value = String(myRegion.id)
          } else {
            regions.value = []
            selectedRegion.value = ''
          }
        }
        // SC: find region that contains user's school and set both region & school
        else if (security.isSC && security.userSchoolId != null) {
          let foundRegion: { value: string; label: string; id: number } | null = null
          let foundSchool: any = null

          for (const r of mapped) {
            try {
              const schools = await getSchools(String(r.id))
              if (Array.isArray(schools)) {
                const s = schools.find((sch: any) => Number(sch.school_id) === Number(security.userSchoolId))
                if (s) {
                  foundRegion = r
                  foundSchool = s
                  break
                }
              }
            } catch (e) {
              // ignore errors and continue search
            }
          }

          if (foundRegion && foundSchool) {
            regions.value = [{ value: String(foundRegion.id), label: foundRegion.label }]
            selectedRegion.value = String(foundRegion.id)
            availableSchools.value = [{ value: String(foundSchool.school_id), label: foundSchool.school_name_ru }]
            selectedSchool.value = String(foundSchool.school_id)
          } else {
            regions.value = []
            selectedRegion.value = ''
            availableSchools.value = []
            selectedSchool.value = ''
          }
        }
        // Default: all regions
        else {
          regions.value = [
            { value: 'all', label: 'Все регионы' },
            ...mapped.map((r: any) => ({ value: String(r.id), label: r.label }))
          ]
        }
      }
    } catch (e) {
      console.error('Failed to fetch regions', e)
    }
  })

  return {
    selectedRegion,
    selectedSchool,
    dateRange,
    regions,
    availableSchools,
    statsData,
    page,
    perPage,
    total,
    paginatedStatsData,
    totalStats,
    fetchStatsData
  }
}
