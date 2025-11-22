<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { notify } from '@/lib/notifications'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', password: string): void
  (e: 'back'): void
}>()

const password = ref('')
const confirmPassword = ref('')
const passwordError = ref('')

const passwordsMatch = computed(() => password.value === confirmPassword.value && password.value.length > 0)
const passwordValid = computed(() => password.value.length >= 8 && passwordsMatch.value)

const onPasswordInput = () => {
  if (passwordError.value) passwordError.value = ''
}

const handleSubmit = (e: Event) => {
  e.preventDefault()
  passwordError.value = ''
  
  if (!password.value || password.value.length < 8) {
    passwordError.value = 'Пароль должен быть не менее 8 символов.'
    notify('Ошибка', passwordError.value, 'error')
    return
  }
  if (password.value !== confirmPassword.value) {
    passwordError.value = 'Пароли не совпадают.'
    notify('Ошибка', passwordError.value, 'error')
    return
  }
  
  emit('submit', password.value)
}
</script>

<template>
  <form @submit="handleSubmit" class="space-y-4">
    <FieldGroup>
      <Field>
        <FieldLabel for="new-password">Новый пароль</FieldLabel>
        <Input id="new-password" type="password" v-model="password" placeholder="Введите новый пароль" required :class="passwordError ? 'border-red-500 ring-1 ring-red-400' : ''" />
      </Field>
      <Field>
        <FieldLabel for="confirm-password">Повторите пароль</FieldLabel>
        <Input id="confirm-password" type="password" v-model="confirmPassword" @input="onPasswordInput" placeholder="Повторите новый пароль" required :class="passwordError ? 'border-red-500 ring-1 ring-red-400' : ''" />
      </Field>
      <div class="flex gap-2">
        <Button type="button" variant="outline" class="flex-1" @click="emit('back')">Назад</Button>
        <Button type="submit" :disabled="loading || !passwordValid" :loading="loading" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Сохранить</Button>
      </div>
    </FieldGroup>
  </form>
</template>
