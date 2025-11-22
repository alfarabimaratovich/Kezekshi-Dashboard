<script setup lang="ts">
import { useMyChildren } from '@/composables/useMyChildren'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Components
import MyChildrenSidebar from '@/components/my-children/MyChildrenSidebar.vue'
import EventsFilter from '@/components/my-children/EventsFilter.vue'
import ChildrenTab from '@/components/my-children/ChildrenTab.vue'
import EventsTab from '@/components/my-children/EventsTab.vue'

const {
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
} = useMyChildren()
</script>

<template>
  <div class="mx-4 md:mx-8 py-4">
    <div class="flex flex-col md:flex-row gap-6">
      <MyChildrenSidebar 
        v-model="activeTab" 
        :items="menuItems" 
      />

      <main class="flex-1">
        <Card>
            <CardHeader>
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div class="shrink-0">
                        <CardTitle v-if="activeTab === 'children'">Мои дети</CardTitle>
                        <CardTitle v-if="activeTab === 'attendance'">Посещаемость</CardTitle>
                        <CardTitle v-if="activeTab === 'dining'">Льготное питание</CardTitle>
                    </div>
                    
                    <EventsFilter 
                      v-if="activeTab !== 'children'"
                      v-model:dateRange="dateRange"
                      v-model:selectedPeriod="selectedPeriod"
                      @periodChange="setPeriod"
                    />
                </div>
            </CardHeader>
            <CardContent>
                <ChildrenTab 
                  v-if="activeTab === 'children'"
                  :children="children"
                  :loading="loading"
                  :error="error"
                  @retry="fetchChildren"
                />
                
                <EventsTab 
                  v-if="activeTab === 'attendance' || activeTab === 'dining'"
                  :events="events"
                  :loading="eventsLoading"
                  :error="eventsError"
                  :activeTab="activeTab"
                  v-model:page="page"
                  v-model:perPage="perPage"
                  @retry="fetchEvents"
                />
            </CardContent>
        </Card>
      </main>
    </div>
  </div>
</template>
