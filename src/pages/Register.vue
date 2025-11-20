<script setup lang="ts">
import { ref, nextTick, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { searchPhoneNumber, sendClientOtp, verifyClientOtp, registerUser } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import { getUserErrorMessage } from '@/lib/userError'
import { notify } from '@/lib/notifications'

const router = useRouter()
const step = ref(1)
const phone = ref('')
const phoneError = ref('')
const phoneTouched = ref(false)
const phoneInput = ref('')

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
const otp = ref<string[]>(['', '', '', ''])
const otpRefs = ref<Array<any | null>>([])
const otpError = ref(false)
const otpShake = ref(false)
const otpSuccess = ref(false)
const loading = ref(false)
const error = ref('')

const showPhoneConfirm = ref(false)
const showAlert = ref(false)
const alertTitle = ref('')
const alertDesc = ref('')
// previous dev-only code removed
const countdown = ref(0)
let timerId: number | null = null

// Personal info
const lastName = ref('')
const firstName = ref('')
const middleName = ref('')
const iin = ref('')
const finalPassword = ref('')
const finalConfirm = ref('')
const finalError = ref('')

const startCountdown = () => {
  countdown.value = 60
  if (timerId) clearInterval(timerId)
  timerId = window.setInterval(() => {
    if (countdown.value > 0) countdown.value -= 1
    else if (timerId) { clearInterval(timerId); timerId = null }
  }, 1000)
}

// real API will be used to check phone


const handlePhoneSubmit = (e: Event) => {
  e.preventDefault()
  error.value = ''
  if (!phone.value) {
    error.value = 'Введите номер телефона.'
    notify('Ошибка', error.value, 'error')
    return
  }
  console.log('[Register] handlePhoneSubmit, phone=', phone.value)
  showPhoneConfirm.value = true
}

const confirmPhone = async () => {
  showPhoneConfirm.value = false
  loading.value = true
    try {
      const apiPhone = normalizePhone(phone.value)
      const resp = await searchPhoneNumber(apiPhone)
      loading.value = false
      if (resp && resp.userIsRegistered) {
        alertTitle.value = 'Пользователь уже существует'
        alertDesc.value = 'Пользователь с таким номером уже зарегистрирован.'
        showAlert.value = true
        return
      }
      await sendClientOtp(apiPhone, { length: 4, ttlMs: 5 * 60 * 1000 })
      startCountdown()
      step.value = 2
      otp.value = ['', '', '', '']
      await nextTick()
      otpRefs.value[0]?.focus()
    } catch (e: any) {
      loading.value = false
      alertTitle.value = 'Ошибка'
      alertDesc.value = getUserErrorMessage(e)
      showAlert.value = true
    }
}

// password-before-OTP flow removed; password collected after OTP in personal info step

const handleVerify = async (e: Event) => {
  e.preventDefault()
  const code = otp.value.join('')
  if (code.length !== 4) {
    otpError.value = true
    otpShake.value = true
    setTimeout(() => { otpShake.value = false }, 400)
    return
  }
  loading.value = true
    try {
      const apiPhone = normalizePhone(phone.value)
      const ok = verifyClientOtp(apiPhone, code)
      loading.value = false
      if (!ok) throw new Error('Неверный код')
      otpSuccess.value = true
      await new Promise(r => setTimeout(r, 350))
      otpSuccess.value = false
      otpError.value = false
      step.value = 3
    } catch (e: any) {
      loading.value = false
      otpError.value = true
      otpShake.value = true
      otp.value = ['', '', '', '']
      await nextTick()
      otpRefs.value[0]?.focus()
      setTimeout(() => { otpShake.value = false }, 400)
    }
}

const handleResend = async () => {
  if (countdown.value > 0) return
  loading.value = true
    try {
      const apiPhone = normalizePhone(phone.value)
      await sendClientOtp(apiPhone, { length: 4, ttlMs: 5 * 60 * 1000 })
      loading.value = false
      startCountdown()
      otp.value = ['', '', '', '']
      await nextTick()
      otpRefs.value[0]?.focus()
    } catch (e: any) {
      loading.value = false
      console.error('sendClientOtp error', e)
      error.value = 'Не удалось отправить код. Попробуйте позже.'
      notify('Ошибка', error.value, 'error')
    }
}

const handleFinalSubmit = async (e: Event) => {
  e.preventDefault()
  finalError.value = ''
  if (!lastName.value || !firstName.value || !iin.value || !finalPassword.value || !finalConfirm.value) {
    finalError.value = 'Заполните все поля.'
    notify('Ошибка', finalError.value, 'error')
    return
  }
  if (finalPassword.value.length < 8) {
    finalError.value = 'Пароль должен быть не менее 8 символов.'
    notify('Ошибка', finalError.value, 'error')
    return
  }
  if (finalPassword.value !== finalConfirm.value) {
    finalError.value = 'Пароли не совпадают.'
    notify('Ошибка', finalError.value, 'error')
    return
  }
  loading.value = true
  try {
    const apiPhone = '+' + phone.value
    const payload = {
      phone: apiPhone,
      last_name: lastName.value,
      first_name: firstName.value,
      middle_name: middleName.value,
      iin: iin.value,
      password: finalPassword.value,
    }
    await registerUser(payload)
    loading.value = false
    router.replace('/login')
  } catch (e: any) {
    loading.value = false
    console.error('registerUser error', e)
    finalError.value = e?.detail ? (typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail)) : 'Ошибка регистрации'
    notify('Ошибка', finalError.value, 'error')
  }
}

const onOtpInput = (index: number, e: Event) => {
  const el = e.target as HTMLInputElement
  const val = el.value.replace(/[^0-9]/g, '').slice(0, 1)
  otp.value[index] = val
  el.value = val
  if (otpError.value) otpError.value = false
  if (otpShake.value) otpShake.value = false
  if (otpSuccess.value) otpSuccess.value = false
  if (val && index < 3) {
    otpRefs.value[index + 1]?.focus()
  }
}

const onOtpKeydown = (index: number, e: KeyboardEvent) => {
  const el = e.target as HTMLInputElement
  if (e.key === 'Backspace' && !el.value && index > 0) {
    otpRefs.value[index - 1]?.focus()
  }
}

const errorInputClass = computed(() => error.value ? 'border-red-500 ring-1 ring-red-400' : '')
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4" style="background-image: url('/bg4.png');">
    <div class="w-full max-w-md">
      <Card class="overflow-hidden p-0 shadow-2xl rounded-xl bg-white">
        <CardContent class="p-8">
          <div class="mb-4 text-left">
            <h2 class="text-xl font-semibold text-black">Регистрация</h2>
            <p class="text-sm text-gray-600">Создайте новый аккаунт Kezekshi</p>
          </div>


          <!-- Step 1: Phone check -->
          <div v-if="showPhoneConfirm" class="mb-2 text-sm text-blue-600">DEBUG: showPhoneConfirm = {{ showPhoneConfirm }}</div>
          <form v-if="step === 1" @submit="handlePhoneSubmit" class="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel for="phone">Номер телефона</FieldLabel>
                <Input id="phone" type="tel" placeholder="+7 (700) 123-45-67" v-model="phoneInput" @input="onPhoneInput" @blur="onPhoneBlur" @paste="onPhonePaste" required :class="errorInputClass" />
              </Field>
              
              <div class="flex gap-2">
                <Button type="button" variant="outline" class="flex-1" @click="router.replace('/login')">Назад</Button>
                <Button type="submit" :disabled="loading" :loading="loading" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Далее</Button>
              </div>
            </FieldGroup>
          </form>

          <!-- Phone confirm dialog (accessible AlertDialog) -->
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

          <!-- Step 2: OTP (after confirming phone) -->
          <form v-if="step === 2" @submit="handleVerify" class="space-y-4">
            <FieldGroup>
              <Field>
                <FieldLabel>Код подтверждения (4 цифры)</FieldLabel>
                <div class="inline-block p-1">
                  <div class="flex gap-2 justify-center mt-2">
                    <input
                      v-for="(_, i) in otp"
                      :key="i"
                      :ref="el => otpRefs[i] = el"
                      maxlength="1"
                      inputmode="numeric"
                      @input="(e) => onOtpInput(i, e)"
                      @keydown="(e) => onOtpKeydown(i, e)"
                      :class="[
                        'w-12 h-12 text-center rounded-md border',
                        otpError ? 'border-red-300 ring-1 ring-red-300' : '',
                        otpSuccess ? 'border-green-300 ring-1 ring-green-300' : '',
                        otpShake ? 'animate-shake' : ''
                      ]"
                    />
                  </div>
                </div>
                <FieldDescription class="text-center mt-2">Мы отправили 4-значный код на указанный номер.</FieldDescription>
              </Field>
              <div class="flex items-center justify-between gap-2">
                <Button type="button" variant="outline" class="" @click="step = 1">Назад</Button>
                <div class="text-right">
                  <button type="button" class="text-sm text-gray-600 underline" :disabled="countdown > 0" @click="handleResend">
                    <span v-if="countdown > 0">Отправить ещё раз ({{ countdown }})</span>
                    <span v-else>Отправить ещё раз</span>
                  </button>
                </div>
              </div>
              <div class="mt-3">
                <Button type="submit" :disabled="loading || otp.join('').length !== 4" class="w-full bg-blue-600 hover:bg-blue-700 text-white">Подтвердить</Button>
              </div>
            </FieldGroup>
          </form>

          

          <!-- Step 3: Personal info -->
          <form v-if="step === 3" @submit="handleFinalSubmit" class="space-y-4">
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
                <Button type="button" variant="outline" class="flex-1" @click="step = 2">Назад</Button>
                <Button type="submit" :disabled="loading" :loading="loading" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Завершить регистрацию</Button>
              </div>
            </FieldGroup>
          </form>

          <!-- Simple alert modal -->
          <div v-if="showAlert" class="fixed inset-0 z-50 flex items-center justify-center">
            <div class="absolute inset-0 bg-black/50" @click="showAlert = false"></div>
            <div class="relative z-10 w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
              <h3 class="text-lg font-semibold mb-2">{{ alertTitle }}</h3>
              <p class="text-sm text-gray-600 mb-4">{{ alertDesc }}</p>
              <div class="flex justify-end">
                <button class="px-4 py-2 rounded-md bg-blue-600 text-white" @click="showAlert = false">Ок</button>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.animate-shake {
  animation: shake 0.35s ease-in-out;
}
@keyframes shake {
  0% { transform: translateX(0) }
  25% { transform: translateX(-6px) }
  50% { transform: translateX(6px) }
  75% { transform: translateX(-4px) }
  100% { transform: translateX(0) }
}
</style>
