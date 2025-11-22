<script setup lang="ts">
import { useStats } from '@/composables/useStats'
import StatsFilters from '@/components/stats/StatsFilters.vue'
import StatsTable from '@/components/stats/StatsTable.vue'

const {
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
  totalStats
} = useStats()
</script>

<template>
  <div class="mx-4 md:mx-8 py-6 space-y-4">
    <!-- Header Frame for Filters -->
    <StatsFilters 
      v-model:selected-region="selectedRegion"
      v-model:selected-school="selectedSchool"
      v-model:date-range="dateRange"
      :regions="regions"
      :available-schools="availableSchools"
    />

    <StatsTable 
      :stats-data="statsData"
      v-model:page="page"
      v-model:per-page="perPage"
      :total="total"
      :paginated-stats-data="paginatedStatsData"
      :total-stats="totalStats"
    />
  </div>
</template>
