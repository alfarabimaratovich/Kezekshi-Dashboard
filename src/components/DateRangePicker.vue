<script setup lang="ts">
import {
  DateFormatter,
  getLocalTimeZone,
  today,
} from '@internationalized/date'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import type { DateRange } from 'reka-ui'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RangeCalendar } from '@/components/ui/range-calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const df = new DateFormatter('ru-RU', {
  dateStyle: 'medium',
})

const value = defineModel<DateRange>({
  required: true,
  default: () => ({
    start: today(getLocalTimeZone()),
    end: today(getLocalTimeZone()).add({ days: 7 }),
  })
})
</script>

<template>
  <div :class="cn('flex items-center', $attrs.class ?? '')">
    <Popover>
      <PopoverTrigger as-child>
        <Button
          id="date"
          variant="outline"
          :class="cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )"
        >
          <CalendarIcon class="mr-2 h-4 w-4 shrink-0" />
          <span class="truncate">
            <template v-if="value.start">
              <template v-if="value.end">
                {{ df.format(value.start.toDate(getLocalTimeZone())) }} - {{ df.format(value.end.toDate(getLocalTimeZone())) }}
              </template>
              <template v-else>
                {{ df.format(value.start.toDate(getLocalTimeZone())) }}
              </template>
            </template>
            <template v-else>
              <span>Выберите дату</span>
            </template>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0 scrollbar-hide" align="end">
        <RangeCalendar
          v-model="value"
          :number-of-months="1"
          locale="ru-RU"
        />
      </PopoverContent>
    </Popover>
  </div>
</template>
