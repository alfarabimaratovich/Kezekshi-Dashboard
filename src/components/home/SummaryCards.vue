<script setup lang="ts">
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Users, School, Utensils } from 'lucide-vue-next'

defineProps<{
  summaryData: {
    totalChildren: number
    visitedToday: number
    mealsToday: number
    meals1to4: number
    meals5to11: number
  }
}>()
</script>

<template>
  <Card class="shadow-lg shadow-blue-500/20">
    <CardHeader class="pb-2">
      <CardTitle class="text-lg font-medium">Сводные данные</CardTitle>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <div class="p-2 bg-blue-500/10 rounded-lg">
            <Users class="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          Всего детей в системе
        </div>
        <div class="text-2xl font-bold">{{ summaryData.totalChildren }}</div>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <div class="p-2 bg-indigo-500/10 rounded-lg">
            <School class="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          Посетили школу сегодня
        </div>
        <div class="text-2xl font-bold">{{ summaryData.visitedToday }}</div>
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <div class="p-2 bg-orange-500/10 rounded-lg">
            <Utensils class="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          Получили питание
        </div>
        <div class="text-2xl font-bold">{{ summaryData.mealsToday }}</div>
      </div>
      <div class="pl-12 space-y-3 border-l-2 border-muted ml-4">
         <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">1-4 классы</span>
            <span class="font-semibold bg-secondary px-2 py-0.5 rounded text-foreground">{{ summaryData.meals1to4 }}</span>
         </div>
         <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">5-11 классы</span>
            <span class="font-semibold bg-secondary px-2 py-0.5 rounded text-foreground">{{ summaryData.meals5to11 }}</span>
         </div>
      </div>
    </CardContent>
  </Card>
</template>
