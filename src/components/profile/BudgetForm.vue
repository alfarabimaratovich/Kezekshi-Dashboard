<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Edit, Save, Users } from 'lucide-vue-next'

interface BudgetForm {
  regionId: string
  schoolId: string
  year: string
  month: string
  studentCount: string
  price: string
  planSumAll: string
}

const props = defineProps<{
  budgetForm: BudgetForm
  regions: any[]
  availableSchoolsForBudget: any[]
  years: number[]
  months: { value: string; label: string }[]
  isSavingBudget: boolean
  user: any
  isEditingExisting?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:budgetForm', value: BudgetForm): void
  (e: 'save'): void
}>()

const updateForm = (field: keyof BudgetForm, value: string) => {
  emit('update:budgetForm', { ...props.budgetForm, [field]: value })
}
</script>

<template>
  <Card>
    <CardHeader>
      <div class="flex items-center gap-2">
        <CardTitle>{{ isEditingExisting ? 'Редактирование плана' : 'Создание плана' }}</CardTitle>
        <Edit v-if="isEditingExisting" class="h-4 w-4 text-blue-500" />
      </div>
      <CardDescription>
        {{ isEditingExisting ? 'Обновите плановую сумму расходов' : 'Укажите плановую сумму расходов' }}
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Region Select -->
        <div class="space-y-2">
          <Label>Регион</Label>
          <Select 
            :model-value="budgetForm.regionId"
            @update:model-value="(v) => updateForm('regionId', String(v))"
            :disabled="!!user?.region_id"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Выберите регион" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="region in regions" :key="region.id" :value="String(region.id)">
                {{ region.name_ru }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- School Select -->
        <div class="space-y-2">
          <Label>Школа</Label>
          <Select 
            :model-value="budgetForm.schoolId"
            @update:model-value="(v) => updateForm('schoolId', String(v))"
            :disabled="!!user?.school_id || !budgetForm.regionId"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Выберите школу" class="text-left" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="school in availableSchoolsForBudget" :key="school.school_id" :value="String(school.school_id)">
                <span class="block truncate max-w-[300px] sm:max-w-[450px]" :title="school.school_name_ru">
                  {{ school.school_name_ru }}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Year Select -->
        <div class="space-y-2">
          <Label>Год</Label>
          <Select 
            :model-value="budgetForm.year"
            @update:model-value="(v) => updateForm('year', String(v))"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Год" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="year in years" :key="year" :value="String(year)">
                {{ year }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Month Select -->
        <div class="space-y-2">
          <Label>Месяц</Label>
          <Select 
            :model-value="budgetForm.month"
            @update:model-value="(v) => updateForm('month', String(v))"
          >
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Месяц" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="month in months" :key="month.value" :value="month.value">
                {{ month.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Student Count Input -->
        <div class="space-y-2">
          <Label>Количество учеников</Label>
          <div class="relative">
            <Users class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="number" 
              placeholder="Введите количество" 
              class="pl-9 w-full" 
              :model-value="budgetForm.studentCount"
              @update:model-value="(v) => updateForm('studentCount', String(v))"
            />
          </div>
        </div>

        <!-- Price Input -->
        <div class="space-y-2">
          <Label>Стоимость питания (за ед.)</Label>
          <div class="relative">
            <CreditCard class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="number" 
              placeholder="Цена за порцию" 
              class="pl-9 w-full" 
              :model-value="budgetForm.price"
              @update:model-value="(v) => updateForm('price', String(v))"
            />
          </div>
        </div>

        <!-- Plan Sum All Input -->
        <div class="space-y-2">
          <Label>Планируемая сумма расхода (на всех учеников)</Label>
          <div class="relative">
            <CreditCard class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="number" 
              placeholder="Введите сумму" 
              class="pl-9 w-full" 
              :model-value="budgetForm.planSumAll"
              @update:model-value="(v) => updateForm('planSumAll', String(v))"
            />
          </div>
        </div>
      </div>
    </CardContent>
    <CardFooter class="flex justify-end">
      <Button @click="$emit('save')" :disabled="isSavingBudget">
        <Save class="mr-2 h-4 w-4" />
        {{ isSavingBudget ? 'Сохранение...' : (isEditingExisting ? 'Обновить' : 'Сохранить') }}
      </Button>
    </CardFooter>
  </Card>
</template>