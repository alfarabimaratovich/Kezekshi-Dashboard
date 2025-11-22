<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-6 text-center space-y-4">
    <div class="rounded-full bg-green-100 p-3">
      <CheckCircle class="w-12 h-12 text-green-600" />
    </div>
    <div class="space-y-2">
      <h3 class="text-xl font-semibold text-gray-900">Пароль изменен</h3>
      <p class="text-sm text-gray-500">Ваш пароль был успешно обновлен. Теперь вы можете войти в систему, используя новый пароль.</p>
    </div>
    <Button type="button" class="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2" @click="router.replace('/')">
      Вернуться на главную
    </Button>
  </div>
</template>
