<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Baby } from 'lucide-vue-next';

defineProps<{
  children: any[]
  loading: boolean
  error: string
}>()

defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div>
    <div v-if="loading" class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 3" :key="i" class="overflow-hidden border border-border/50">
        <CardHeader>
          <Skeleton class="h-6 w-3/4 mb-2" />
          <Skeleton class="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div class="flex items-start gap-4">
            <Skeleton class="h-16 w-16 rounded-full shrink-0" />
            <div class="space-y-2 w-full">
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-2/3" />
              <div class="flex gap-3 mt-4 pt-4 border-t border-border/50">
                <Skeleton class="h-4 w-20" />
                <Skeleton class="h-4 w-20" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    <div v-else-if="error" class="text-center py-12 text-red-500">
      <p>{{ error }}</p>
      <Button class="mt-4" variant="outline" @click="$emit('retry')">Повторить</Button>
    </div>
    <div v-else-if="children.length === 0" class="text-center py-12 text-muted-foreground">
      <Baby class="mx-auto h-12 w-12 mb-4 opacity-20" />
      <p>У вас пока нет добавленных детей</p>
      <Button class="mt-4" variant="outline">Добавить ребенка</Button>
    </div>
    <div v-else class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <Card v-for="child in children" :key="child.id" class="overflow-hidden border border-palette-purple-b/40 shadow-[0_4px_20px_-12px_var(--color-palette-purple-b)] hover:shadow-[0_4px_20px_-8px_var(--color-palette-purple-a)] hover:border-palette-purple-a/40 transition-all duration-300 bg-card">
        <CardHeader>
          <CardTitle>{{ child.fullname }}</CardTitle>
          <CardDescription>ИИН: {{ child.iin }}</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="flex items-start gap-4">
            <div class="h-16 w-16 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              <img v-if="child.photo_url" :src="child.photo_url" alt="Avatar" class="h-full w-full object-cover" />
              <Baby v-else class="h-8 w-8 text-muted-foreground" />
            </div>
            <div class="text-sm space-y-1">
              <p><span class="font-medium">Школа:</span> {{ child.school_name_ru || 'Не указана' }}</p>
              <p><span class="font-medium">Класс:</span> {{ child.class_number || 'Не указан' }}</p>
              
              <div class="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/50">
                <div :class="[
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  child.atSchool 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-muted-foreground'
                ]">
                  <img v-if="child.atSchool" src="/book.svg" class="h-8 w-8" alt="In School" />
                  <div v-else class="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                  {{ child.atSchool ? 'Еще в школе' : 'Не в школе' }}
                </div>
                
                <div class="h-4 w-px bg-border"></div>

                <div :class="[
                  'flex items-center gap-2 text-sm font-medium transition-colors',
                  child.hadLunch 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-muted-foreground'
                ]">
                  <img :src="child.hadLunch ? '/true.svg' : '/false.svg'" class="h-8 w-8" alt="Lunch" />
                  {{ child.hadLunch ? 'Еда выдана' : 'Еда не выдана' }}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
