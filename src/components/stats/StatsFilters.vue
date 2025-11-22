<script setup lang="ts">
import { ref } from 'vue'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Button from '@/components/ui/button/Button.vue'
import { 
  Check,
  ChevronsUpDown,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import DateRangePicker from '@/components/DateRangePicker.vue'
import type { DateRange } from 'reka-ui'

defineProps<{
  selectedRegion: string
  selectedSchool: string
  dateRange: DateRange
  regions: { value: string; label: string }[]
  availableSchools: { value: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:selectedRegion', value: string): void
  (e: 'update:selectedSchool', value: string): void
  (e: 'update:dateRange', value: DateRange): void
}>()

const openSchool = ref(false)
</script>

<template>
  <Card>
    <CardContent class="p-2 flex justify-end">
      <div class="flex flex-wrap items-center gap-4">
        <Select 
          :model-value="selectedRegion"
          @update:model-value="(v) => $emit('update:selectedRegion', v ? String(v) : '')"
        >
          <SelectTrigger class="w-[180px]">
            <SelectValue placeholder="Выберите регион" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Регионы</SelectLabel>
              <SelectItem v-for="region in regions" :key="region.value" :value="region.value">
                {{ region.label }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <span class="text-muted-foreground font-bold">-</span>

        <Popover v-model:open="openSchool">
          <PopoverTrigger as-child>
            <Button
              variant="outline"
              role="combobox"
              :aria-expanded="openSchool"
              class="w-[250px] justify-between"
              :disabled="!selectedRegion"
            >
              <span class="truncate">
                {{ selectedSchool
                  ? availableSchools.find((school) => school.value === selectedSchool)?.label
                  : "Выберите школу" }}
              </span>
              <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-[250px] p-0">
            <Command>
              <CommandInput class="h-9" placeholder="Поиск школы..." />
              <CommandEmpty>Школа не найдена.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  <CommandItem
                    v-for="school in availableSchools"
                    :key="school.value"
                    :value="school.value"
                    @select="(ev) => {
                      if (typeof ev.detail.value === 'string') {
                        $emit('update:selectedSchool', ev.detail.value)
                        openSchool = false
                      }
                    }"
                  >
                    {{ school.label }}
                    <Check
                      :class="cn(
                        'ml-auto h-4 w-4',
                        selectedSchool === school.value ? 'opacity-100' : 'opacity-0'
                      )"
                    />
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <span class="text-muted-foreground font-bold">-</span>

        <DateRangePicker 
          :model-value="dateRange"
          @update:model-value="(v) => $emit('update:dateRange', v)"
        />
      </div>
    </CardContent>
  </Card>
</template>
