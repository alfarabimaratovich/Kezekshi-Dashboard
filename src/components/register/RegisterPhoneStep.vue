<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { useRouter } from 'vue-router'

const props = defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', phone: string): void
}>()

const router = useRouter()
const phone = ref('')
const phoneError = ref('')
const phoneTouched = ref(false)
const phoneInput = ref('')
const showPhoneConfirm = ref(false)

const formatPhone = (digits: string) => {
  const s = (digits || '').replace(/\D/g, '')
  if (!s) return ''
  const a = s.slice(0, 1)
  const b = s.slice(1, 4)
  const c = s.slice(4, 7)
  const d = s.slice(7, 9)
  const e = s.slice(9, 11)
  let out = '+' + a
  if (b) out += ' (' + b
  if (b && b.length === 3) out += ')'
  if (c) out += ' ' + c
  if (d) out += '-' + d
  if (e) out += '-' + e
  return out
}

const formattedPhone = computed(() => formatPhone(phone.value))
// initialize visible value
phoneInput.value = formattedPhone.value

const validPhone = computed(() => {
  const d = (phone.value || '').replace(/\D/g, '')
  return d.length === 11 && d.startsWith('7')
})

const onPhoneInput = (e: Event) => {
  const el = e.target as HTMLInputElement
  const raw = (el.value || '')
  phoneInput.value = raw
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (digits.length > 11) digits = digits.slice(0, 11)
  phone.value = digits
  if (!validPhone.value) phoneError.value = 'Неверный формат. Ожидается 11 цифр, начинается с 7.'
  else phoneError.value = ''
}

const onPhoneBlur = () => {
  phoneTouched.value = true
  phoneInput.value = formatPhone(phone.value)
  if (!validPhone.value) phoneError.value = 'Введите корректный номер телефона в формате +7 (700) 123-45-67.'
  else phoneError.value = ''
}

const onPhonePaste = (e: ClipboardEvent) => {
  const text = (e.clipboardData || (window as any).clipboardData)?.getData('text') || ''
  const digits = text.replace(/\D/g, '').slice(0, 11)
  if (digits) {
    e.preventDefault()
    phone.value = digits
    phoneInput.value = formatPhone(digits)
    if (!validPhone.value) phoneError.value = 'Введите корректный номер телефона в формате +7 (700) 123-45-67.'
    else phoneError.value = ''
  }
}

watch(formattedPhone, (v) => {
  const active = document.activeElement as HTMLElement | null
  if (!active || active.id !== 'phone') phoneInput.value = v
})

const errorInputClass = computed(() => phoneError.value ? 'border-red-500 ring-1 ring-red-400' : '')

const handleSubmit = (e: Event) => {
  e.preventDefault()
  if (!phone.value) {
    phoneError.value = 'Введите номер телефона.'
    return
  }
  showPhoneConfirm.value = true
}

const confirmPhone = () => {
  showPhoneConfirm.value = false
  emit('submit', phone.value)
}
</script>

<template>
  <form @submit="handleSubmit" class="space-y-4">
    <FieldGroup>
      <Field>
        <FieldLabel for="phone">Номер телефона</FieldLabel>
        <Input 
          id="phone" 
          type="tel" 
          placeholder="+7 (700) 123-45-67" 
          v-model="phoneInput" 
          @input="onPhoneInput" 
          @blur="onPhoneBlur" 
          @paste="onPhonePaste" 
          required 
          :class="errorInputClass" 
        />
        <p v-if="phoneError" class="text-xs text-red-500 mt-1">{{ phoneError }}</p>
      </Field>
      
      <div class="flex gap-2">
        <Button type="button" variant="outline" class="flex-1" @click="router.replace('/login')">Назад</Button>
        <Button type="submit" :disabled="loading" :loading="loading" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Далее</Button>
      </div>
    </FieldGroup>

    <!-- Phone confirm dialog -->
    <AlertDialog :open="showPhoneConfirm" @update:open="(v) => (showPhoneConfirm = v)">
      <AlertDialogContent>
        <AlertDialogTitle>Это верный номер?</AlertDialogTitle>
        <AlertDialogDescription>
          <span class="font-semibold">{{ formatPhone(phone) }}</span>
          <br />Проверьте правильность номера телефона.
        </AlertDialogDescription>
        <div class="flex flex-col sm:flex-row gap-2 mt-4 justify-end">
          <AlertDialogCancel class="w-full sm:w-auto">Отмена</AlertDialogCancel>
          <AlertDialogAction @click="confirmPhone" class="w-full sm:w-auto bg-blue-600 text-white">Подтвердить</AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  </form>
</template>
