<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import DateRangePicker from '@/components/DateRangePicker.vue'
import type { DateRange } from 'reka-ui'

defineProps<{
  dateRange: DateRange
  selectedPeriod: string
}>()

const emit = defineEmits<{
  (e: 'update:dateRange', value: DateRange): void
  (e: 'update:selectedPeriod', value: string): void
  (e: 'periodChange', period: string): void
}>()

const onPeriodClick = (period: string) => {
  emit('update:selectedPeriod', period)
  emit('periodChange', period)
}

const onDateRangeUpdate = (val: DateRange) => {
  emit('update:dateRange', val)
}
</script>

<template>
  <div class="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
    <ButtonGroup class="w-full sm:w-[260px] flex">
      <Button 
        variant="outline" 
        class="flex-1"
        :class="{ 'bg-accent text-accent-foreground': selectedPeriod === 'today' }"
        @click="onPeriodClick('today')"
      >
        Сегодня
      </Button>
      <Button 
        variant="outline" 
        class="flex-1"
        :class="{ 'bg-accent text-accent-foreground': selectedPeriod === 'week' }"
        @click="onPeriodClick('week')"
      >
        Неделя
      </Button>
      <Button 
        variant="outline" 
        class="flex-1"
        :class="{ 'bg-accent text-accent-foreground': selectedPeriod === 'month' }"
        @click="onPeriodClick('month')"
      >
        Месяц
      </Button>
    </ButtonGroup>
    <DateRangePicker 
      :model-value="dateRange" 
      @update:model-value="onDateRangeUpdate"
      class="w-full sm:w-[260px]" 
    />
  </div>
</template>
