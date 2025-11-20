<script setup lang="ts">
import { computed } from 'vue'
import type { Toast } from '@/lib/toastStore'
import { useToast } from '@/lib/toastStore'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-vue-next'

const props = defineProps<{ toast: Toast }>()
const { remove } = useToast()

const icon = computed(() => {
  switch (props.toast.type) {
    case 'success': return CheckCircle
    case 'error': return AlertCircle
    case 'warning': return AlertTriangle
    default: return Info
  }
})

const bgClass = computed(() => {
  switch (props.toast.type) {
    case 'success': return 'bg-green-50 border-green-200 text-green-800'
    case 'error': return 'bg-red-50 border-red-200 text-red-800'
    case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    default: return 'bg-white border-gray-200 text-gray-800'
  }
})
</script>

<template>
  <div
    class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg ring-1 ring-black/5"
    :class="bgClass"
    role="alert"
  >
    <div class="p-4">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <component :is="icon" class="h-5 w-5" aria-hidden="true" />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium">{{ toast.title }}</p>
          <p class="mt-1 text-sm opacity-90">{{ toast.message }}</p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            type="button"
            class="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 opacity-70 hover:opacity-100"
            @click="remove(toast.id)"
          >
            <span class="sr-only">Close</span>
            <X class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
