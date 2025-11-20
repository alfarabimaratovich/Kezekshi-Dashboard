<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Construction } from 'lucide-vue-next'
</script>

<template>
  <div class="flex items-center justify-center min-h-[80vh] p-4">
    <Card class="w-full max-w-md text-center border-none shadow-none bg-transparent">
      <CardContent class="flex flex-col items-center gap-6 pt-6">
        <div class="p-4 bg-muted rounded-full">
          <Construction class="w-12 h-12 text-muted-foreground" />
        </div>
        <div class="space-y-2">
          <h1 class="text-2xl font-bold tracking-tight">Страница в разработке</h1>
          <p class="text-muted-foreground">
            Мы работаем над улучшением этой страницы. Пожалуйста, загляните позже.
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
