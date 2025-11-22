<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { notify } from '@/lib/notifications'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: any): void
  (e: 'back'): void
}>()

const lastName = ref('')
const firstName = ref('')
const middleName = ref('')
const iin = ref('')
const finalPassword = ref('')
const finalConfirm = ref('')

const handleSubmit = (e: Event) => {
  e.preventDefault()
  
  if (!lastName.value || !firstName.value || !iin.value || !finalPassword.value || !finalConfirm.value) {
    notify('Ошибка', 'Заполните все поля.', 'error')
    return
  }
  if (finalPassword.value.length < 8) {
    notify('Ошибка', 'Пароль должен быть не менее 8 символов.', 'error')
    return
  }
  if (finalPassword.value !== finalConfirm.value) {
    notify('Ошибка', 'Пароли не совпадают.', 'error')
    return
  }

  emit('submit', {
    lastName: lastName.value,
    firstName: firstName.value,
    middleName: middleName.value,
    iin: iin.value,
    password: finalPassword.value
  })
}
</script>

<template>
  <form @submit="handleSubmit" class="space-y-4">
    <FieldGroup>
      <Field>
        <FieldLabel for="lastName">Фамилия</FieldLabel>
        <Input id="lastName" v-model="lastName" placeholder="Фамилия" required />
      </Field>
      <Field>
        <FieldLabel for="firstName">Имя</FieldLabel>
        <Input id="firstName" v-model="firstName" placeholder="Имя" required />
      </Field>
      <Field>
        <FieldLabel for="middleName">Отчество</FieldLabel>
        <Input id="middleName" v-model="middleName" placeholder="Отчество" />
      </Field>
      <Field>
        <FieldLabel for="iin">ИИН</FieldLabel>
        <Input id="iin" v-model="iin" placeholder="ИИН" required />
      </Field>
      <Field>
        <FieldLabel for="finalPassword">Пароль</FieldLabel>
        <Input id="finalPassword" type="password" v-model="finalPassword" placeholder="Введите пароль" required />
      </Field>
      <Field>
        <FieldLabel for="finalConfirm">Повторите пароль</FieldLabel>
        <Input id="finalConfirm" type="password" v-model="finalConfirm" placeholder="Повторите пароль" required />
      </Field>
      
      <div class="flex gap-2">
        <Button type="button" variant="outline" class="flex-1" @click="emit('back')">Назад</Button>
        <Button type="submit" :disabled="loading" :loading="loading" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Завершить регистрацию</Button>
      </div>
    </FieldGroup>
  </form>
</template>
