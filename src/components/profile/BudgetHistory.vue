<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps<{
  historySearch: string
  historyPage: number
  historyItemsPerPage: string
  totalHistoryPages: number
  paginatedBudgetHistory: any[]
  months: { value: string; label: string }[]
  schools: any[]
  availableSchoolsForBudget: any[]
}>()

const emit = defineEmits<{
  (e: 'update:historySearch', value: string): void
  (e: 'update:historyPage', value: number): void
  (e: 'update:historyItemsPerPage', value: string): void
}>()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(value)
}

const getMonthName = (month: number) => {
  return props.months.find(m => Number(m.value) === month)?.label || month
}

const getSchoolNameById = (id: number, savedName?: string) => {
  if (savedName) return savedName
  if (!id) return 'Все школы'
  
  // Try to find in available schools first
  let s = props.availableSchoolsForBudget.find((s: any) => Number(s.school_id) === id)
  if (s) return s.school_name_ru
  
  // Try to find in user's schools list
  s = props.schools.find((s: any) => Number(s.school_id) === id)
  if (s) return s.school_name_ru
  
  return `Школа #${id}`
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>История планирования</CardTitle>
      <CardDescription>Ранее запланированные бюджеты</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex flex-col sm:flex-row gap-4 mb-6 justify-between">
        <div class="relative w-full sm:w-72">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            :model-value="historySearch"
            @update:model-value="(v) => $emit('update:historySearch', String(v))"
            placeholder="Поиск по школе, году..."
            class="pl-9"
          />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-muted-foreground whitespace-nowrap">Показывать по:</span>
          <Select 
            :model-value="historyItemsPerPage"
            @update:model-value="(v) => $emit('update:historyItemsPerPage', String(v))"
          >
            <SelectTrigger class="w-[70px]">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div v-if="paginatedBudgetHistory.length > 0">
        <div class="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Период</TableHead>
                <TableHead class="max-w-[200px]">Школа</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Цена</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="(item, index) in paginatedBudgetHistory" :key="index">
                <TableCell class="font-medium">
                  {{ getMonthName(item.month) }} {{ item.year }}
                </TableCell>
                <TableCell class="max-w-[200px]">
                  <div class="truncate" :title="getSchoolNameById(item.school_id, item.school_name)">
                    {{ getSchoolNameById(item.school_id, item.school_name) }}
                  </div>
                </TableCell>
                <TableCell>{{ formatCurrency(item.amount) }}</TableCell>
                <TableCell>{{ formatCurrency(item.price) }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <!-- Pagination Controls -->
        <div class="flex items-center justify-end space-x-2 py-4">
          <div class="text-sm text-muted-foreground mr-4">
            Страница {{ historyPage }} из {{ totalHistoryPages }}
          </div>
          <Button
            variant="outline"
            size="sm"
            :disabled="historyPage <= 1"
            @click="$emit('update:historyPage', historyPage - 1)"
          >
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="historyPage >= totalHistoryPages"
            @click="$emit('update:historyPage', historyPage + 1)"
          >
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div v-else class="text-center py-8 text-muted-foreground">
        {{ historySearch ? 'Ничего не найдено' : 'История пуста' }}
      </div>
    </CardContent>
  </Card>
</template>
