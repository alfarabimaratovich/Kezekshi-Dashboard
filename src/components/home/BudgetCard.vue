<script setup lang="ts">
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Wallet } from 'lucide-vue-next'

defineProps<{
  budgetData: {
    saved: number
    planned: number
    spent: number
  }
  manualStudentCount: string | number
  manualMealPrice: string | number
}>()

const emit = defineEmits<{
  (e: 'update:manualStudentCount', value: string | number): void
  (e: 'update:manualMealPrice', value: string | number): void
  (e: 'applyBudget'): void
}>()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(value)
}
</script>

<template>
  <Card class="shadow-lg shadow-green-500/20">
    <CardHeader class="pb-2">
      <CardTitle class="text-lg font-medium">Управление бюджетом</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Calculator Input Side -->
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="meal-price-input">Стоимость питания (за ед.)</Label>
            <Input 
              id="meal-price-input" 
              type="number" 
              placeholder="Введите стоимость" 
              readonly
              :model-value="manualMealPrice"
              @update:model-value="(v) => $emit('update:manualMealPrice', v)"
            />
          </div>
          <div class="space-y-2">
            <Label for="student-count-input">Количество учеников</Label>
            <div class="flex w-full items-center space-x-2">
              <Input 
                id="student-count-input" 
                type="number" 
                placeholder="Введите количество" 
                readonly
                :model-value="manualStudentCount"
                @update:model-value="(v) => $emit('update:manualStudentCount', v)"
              />
            </div>
          </div>
        </div>

        <!-- Results Side -->
        <div class="space-y-6">
          <div class="flex items-center justify-between p-4 bg-green-500/5 rounded-lg border border-green-500/10">
            <div class="flex items-center gap-3 text-sm font-medium text-green-700 dark:text-green-400">
              <div class="p-2 bg-green-500/10 rounded-full">
              </div>
              Сэкономлено
            </div>
            <div class="text-2xl font-bold text-green-700 dark:text-green-400">{{ formatCurrency(budgetData.saved) }}</div>
          </div>
          <div class="space-y-4">
            <div class="space-y-3">
                <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2 text-muted-foreground">
                      <div class="p-1.5 bg-blue-500/10 rounded-md">
                        <Wallet class="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Запланировано
                    </div>
                    <span class="font-semibold">{{ formatCurrency(budgetData.planned) }}</span>
                </div>
                <div class="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div class="h-full bg-primary transition-all duration-500" :style="{ width: (budgetData.planned > 0 ? (budgetData.spent / budgetData.planned * 100) : 0) + '%' }"></div>
                </div>
                <div class="flex items-center justify-between text-sm">
                    <div class="flex items-center gap-2 text-muted-foreground">
                      <div class="p-1.5 bg-red-500/10 rounded-md">
                        <CreditCard class="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      Потрачено
                    </div>
                    <span class="font-semibold">{{ formatCurrency(budgetData.spent) }}</span>
                </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
