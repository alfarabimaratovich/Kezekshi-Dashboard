<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { useDashboard } from '@/composables/useDashboard'

import DashboardFilters from '@/components/home/DashboardFilters.vue'
import SummaryCards from '@/components/home/SummaryCards.vue'
import BudgetCard from '@/components/home/BudgetCard.vue'
import ChartsGrid from '@/components/home/ChartsGrid.vue'

const AnalyticsSavingsChart = defineAsyncComponent({
  loader: () => import('@/components/AnalyticsSavingsChart.vue'),
  loadingComponent: Spinner,
  delay: 200
})

const {
  selectedRegion,
  selectedSchool,
  dateRange,
  regions,
  availableSchools,
  summaryData,
  chartsData,
  budgetData,
} = useDashboard()
</script>

<template>
  <div class="mx-4 md:mx-8 py-6 space-y-4">
    <!-- Header Frame for Filters -->
    <DashboardFilters 
      v-model:selected-region="selectedRegion"
      v-model:selected-school="selectedSchool"
      v-model:date-range="dateRange"
      :regions="regions"
      :available-schools="availableSchools"
    />

    <!-- Summary and Budget Stats -->
    <div class="grid gap-4 md:gap-8 grid-cols-1 md:grid-cols-2">
      <SummaryCards :summary-data="summaryData" />

      <BudgetCard 
        :budget-data="budgetData"
      />
    </div>

    <ChartsGrid :charts-data="chartsData" />

    <AnalyticsSavingsChart 
      :region-id="selectedRegion"
      :school-id="selectedSchool"
    />
  </div>
</template>
