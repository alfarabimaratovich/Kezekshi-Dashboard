<script setup lang="ts">
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { useProfile } from '@/composables/useProfile'
import { Shield } from 'lucide-vue-next'

import BudgetPlanning from '@/components/profile/BudgetPlanning.vue'
import ProfileInfo from '@/components/profile/ProfileInfo.vue'
import ProfileSidebar from '@/components/profile/ProfileSidebar.vue'
import { useSecurityStore } from '@/stores/securityStore'
import { watch } from 'vue'

const securityStore = useSecurityStore()

const {
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
  activeTab,
  historySearch,
  historyPage,
  historyItemsPerPage,
  totalHistoryPages,
  paginatedBudgetHistory,
  regionName,
  schoolName,
  years,
  months,
  handleSaveProfile,
  cancelEdit,
  handleSaveBudget,
  isEditingExistingBudget
} = useProfile()

watch(activeTab, (newTab) => {
  // If user tries to access 'planning' tab without permission, redirect to 'profile' tab
  if(newTab === 'planning' && securityStore.canAccessPage('planning') === false) {
    activeTab.value = 'profile'
  }
})
</script>

<template>
  <div class="mx-4 md:mx-8 py-4">
    <div v-if="isLoading" class="flex justify-center py-12">
      <Spinner />
    </div>

    <div v-else-if="user" class="grid gap-6 lg:grid-cols-[320px_1fr] md:grid-cols-[260px_1fr]">
      <!-- Sidebar / User Card -->
      <ProfileSidebar :user="user" :user-photo-url="userPhotoUrl" />

      <!-- Main Content / Details -->
      <div class="space-y-6">
        
        <div v-if="activeTab === 'profile'" class="space-y-6">
          <ProfileInfo 
            :user="user"
            v-model:is-editing="isEditing"
            v-model:edit-form="editForm"
            :is-saving-profile="isSavingProfile"
            :school-name="schoolName"
            :region-name="regionName"
            @save="handleSaveProfile"
            @cancel="cancelEdit"
          />
        </div>

        <!-- Planning Tab -->
        <div v-if="activeTab === 'planning' && securityStore.canAccessPage('planning')" class="space-y-6">
          <BudgetPlanning 
            v-model:budget-form="budgetForm"
            :regions="regions"
            :available-schools-for-budget="availableSchoolsForBudget"
            :years="years"
            :months="months"
            :is-saving-budget="isSavingBudget"
            :user="user"
            v-model:history-search="historySearch"
            v-model:history-page="historyPage"
            v-model:history-items-per-page="historyItemsPerPage"
            :total-history-pages="totalHistoryPages"
            :paginated-budget-history="paginatedBudgetHistory"
            :schools="schools"
            :is-editing-existing-budget="isEditingExistingBudget"
            @save-budget="handleSaveBudget"
          />
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
