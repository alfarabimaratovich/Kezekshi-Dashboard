<script setup lang="ts">
import { ref } from 'vue';
import BudgetForm from './BudgetForm.vue';
import BudgetHistory from './BudgetHistory.vue';

defineProps<{
  budgetForm: any
  regions: any[]
  availableSchoolsForBudget: any[]
  years: number[]
  months: any[]
  isSavingBudget: boolean
  user: any
  historySearch: string
  historyPage: number
  historyItemsPerPage: string
  totalHistoryPages: number
  paginatedBudgetHistory: any[]
  schools: any[]
  isEditingExistingBudget: boolean
}>()

const emit = defineEmits<{
  (e: 'update:budgetForm', value: any): void
  (e: 'saveBudget'): void
  (e: 'update:historySearch', value: string): void
  (e: 'update:historyPage', value: number): void
  (e: 'update:historyItemsPerPage', value: string): void
}>()

const planningSubTab = ref<'new' | 'history'>('new')
</script>

<template>
  <div class="space-y-6">
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

    <BudgetForm 
      v-if="planningSubTab === 'new'"
      :budget-form="budgetForm"
      :regions="regions"
      :available-schools-for-budget="availableSchoolsForBudget"
      :years="years"
      :months="months"
      :is-saving-budget="isSavingBudget"
      :user="user"
      :is-editing-existing="isEditingExistingBudget"
      @update:budget-form="(v) => $emit('update:budgetForm', v)"
      @save="$emit('saveBudget')"
    />

    <BudgetHistory 
      v-if="planningSubTab === 'history'"
      :history-search="historySearch"
      :history-page="historyPage"
      :history-items-per-page="historyItemsPerPage"
      :total-history-pages="totalHistoryPages"
      :paginated-budget-history="paginatedBudgetHistory"
      :months="months"
      :schools="schools"
      :available-schools-for-budget="availableSchoolsForBudget"
      @update:history-search="(v) => $emit('update:historySearch', v)"
      @update:history-page="(v) => $emit('update:historyPage', v)"
      @update:history-items-per-page="(v) => $emit('update:historyItemsPerPage', v)"
    />
  </div>
</template>