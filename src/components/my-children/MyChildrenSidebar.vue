<script setup lang="ts">
import { Button } from '@/components/ui/button'
import type { Component } from 'vue'

interface MenuItem {
  id: string
  label: string
  icon: Component
}

defineProps<{
  modelValue: string
  items: MenuItem[]
}>()

defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <aside class="w-full md:w-64 shrink-0">
    <div class="flex md:flex-col h-full overflow-x-auto p-2 gap-2 rounded-xl border border-border bg-card shadow-sm">
      <Button
        v-for="item in items"
        :key="item.id"
        variant="ghost"
        :class="[
          'justify-start h-12 px-4 text-base transition-all whitespace-nowrap shrink-0 rounded-lg',
          modelValue === item.id 
            ? 'bg-accent text-accent-foreground shadow-sm' 
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          'w-auto md:w-full'
        ]"
        @click="$emit('update:modelValue', item.id)"
      >
        <component :is="item.icon" class="mr-3 h-5 w-5" />
        {{ item.label }}
      </Button>
    </div>
  </aside>
</template>
