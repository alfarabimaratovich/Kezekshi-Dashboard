<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays, Utensils, Clock, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-vue-next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const props = defineProps<{
  events: any[]
  loading: boolean
  error: string
  activeTab: string
  page: number
  perPage: number
}>()

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'update:page', value: number): void
  (e: 'update:perPage', value: number): void
}>()

const flatEvents = computed(() => {
  const flat: any[] = []
  props.events.forEach(day => {
    if (day.events) {
      day.events.forEach((event: any) => {
        flat.push({ ...event, date: day.date })
      })
    }
  })
  return flat
})

const totalEvents = computed(() => flatEvents.value.length)

const paginatedEvents = computed(() => {
  const start = (props.page - 1) * props.perPage
  const end = start + props.perPage
  return flatEvents.value.slice(start, end)
})

const groupedPaginatedEvents = computed(() => {
  const groups: any[] = []
  let currentGroup: any = null

  paginatedEvents.value.forEach(event => {
    if (!currentGroup || currentGroup.date !== event.date) {
      if (currentGroup) groups.push(currentGroup)
      currentGroup = { date: event.date, events: [] }
    }
    currentGroup.events.push(event)
  })
  if (currentGroup) groups.push(currentGroup)
  
  return groups
})
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-6">
      <div v-for="i in 2" :key="i" class="space-y-3">
        <Skeleton class="h-5 w-32" />
        <div class="grid gap-3">
          <div v-for="j in 3" :key="j" class="flex items-center justify-between p-4 rounded-lg border border-border/50">
            <div class="flex items-center gap-4 w-full">
              <Skeleton class="h-10 w-10 rounded-full shrink-0" />
              <Skeleton class="h-5 w-1/3" />
            </div>
            <div class="flex flex-col items-end gap-2">
              <Skeleton class="h-4 w-16" />
              <Skeleton class="h-3 w-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="error" class="text-center py-12 text-red-500">
      <p>{{ error }}</p>
      <Button class="mt-4" variant="outline" @click="$emit('retry')">Повторить</Button>
    </div>
    <div v-else-if="events.length === 0" class="text-center py-12 text-muted-foreground">
      <component :is="activeTab === 'attendance' ? CalendarDays : Utensils" class="mx-auto h-12 w-12 mb-4 opacity-20" />
      <p>Нет событий за выбранный период</p>
    </div>
    <div v-else class="space-y-6">
      <div v-for="(day, dayIdx) in groupedPaginatedEvents" :key="dayIdx" class="space-y-3">
        <h3 class="font-medium text-sm text-muted-foreground sticky top-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 py-2 z-10">
          {{ day.date }}
        </h3>
        <div class="grid gap-3">
          <div v-for="(event, idx) in day.events" :key="idx" 
            class="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg transition-all duration-200 gap-3 sm:gap-4"
            :class="[
              activeTab === 'attendance' && event.event_type === 1 ? 'border border-palette-green-a/40 bg-palette-green-b/5 shadow-[0_2px_10px_-6px_var(--color-palette-green-a)]' : '',
              activeTab === 'attendance' && event.event_type === 2 ? 'border border-palette-red/40 bg-palette-red/5 shadow-[0_2px_10px_-6px_var(--color-palette-red)]' : '',
              activeTab === 'dining' ? 'border border-palette-blue-a/40 bg-palette-blue-b/5 shadow-[0_2px_10px_-6px_var(--color-palette-blue-a)]' : '',
              !((activeTab === 'attendance' && (event.event_type === 1 || event.event_type === 2)) || activeTab === 'dining') ? 'bg-card border border-border/50 hover:bg-accent/50' : ''
            ]"
          >
            <div class="flex items-center gap-4">
              <div :class="[
                'h-10 w-10 rounded-full flex items-center justify-center bg-transparent shrink-0',
              ]">
                <img v-if="activeTab === 'attendance' && event.event_type === 1" src="/right.svg" class="h-8 w-8" alt="Entry" />
                <img v-else-if="activeTab === 'attendance' && event.event_type === 2" src="/left.svg" class="h-8 w-8" alt="Exit" />
                <img v-else src="/true.svg" class="h-8 w-8" alt="Dining" />
              </div>
              <div class="min-w-0">
                <p class="font-medium truncate">{{ event.student_fullname }}</p>
              </div>
            </div>
            <div class="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pl-14 sm:pl-0">
              <p class="font-mono font-medium flex items-center justify-end gap-1">
                <Clock class="h-3 w-3 text-muted-foreground" />
                {{ event.time }}
              </p>
              <div v-if="activeTab === 'attendance'" :class="[
                'text-xs font-medium mt-0.5',
                event.event_type === 1 ? 'text-palette-green-a' : 'text-palette-red'
              ]">
                {{ event.event_type === 1 ? 'Пришел' : 'Ушел' }}
              </div>
              <div v-if="activeTab === 'dining'" class="text-xs text-palette-blue-a font-medium mt-0.5">
                Питание
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination Footer -->
      <div class="flex flex-col sm:flex-row items-center justify-between py-4 gap-4 border-t pt-6">
        <div class="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-start">
          <Select
            :model-value="`${perPage}`"
            @update:model-value="(v) => $emit('update:perPage', Number(v))"
          >
            <SelectTrigger class="h-8 w-[70px]">
              <SelectValue :placeholder="`${perPage}`" />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectItem v-for="pageSize in [10, 20, 30, 40, 50]" :key="pageSize" :value="`${pageSize}`">
                {{ pageSize }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination 
          :page="page" 
          :total="totalEvents" 
          :sibling-count="1" 
          show-edges 
          :items-per-page="perPage"
          @update:page="(v) => $emit('update:page', v)"
        >
          <PaginationContent v-slot="{ items }">
            <PaginationFirst>
              <ChevronsLeft class="h-4 w-4" />
            </PaginationFirst>
            <PaginationPrevious>
              <ChevronLeft class="h-4 w-4" />
            </PaginationPrevious>

            <template v-for="(item, index) in items">
              <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value" :is-active="item.value === page" class="hidden sm:block">
                {{ item.value }}
              </PaginationItem>
              <PaginationEllipsis v-else :key="item.type" :index="index" class="hidden sm:flex" />
            </template>

            <PaginationNext>
              <ChevronRight class="h-4 w-4" />
            </PaginationNext>
            <PaginationLast>
              <ChevronsRight class="h-4 w-4" />
            </PaginationLast>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
</template>
