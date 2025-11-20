<script setup lang="ts">
import { ref, nextTick, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { resetPassword, sendClientOtp, verifyClientOtp } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getUserErrorMessage } from '@/lib/userError'
import { notify } from '@/lib/notifications'

const router = useRouter()

const step = ref(1)
const phone = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const countdown = ref(0)
let timerId: number | null = null

const startCountdown = () => {
  // 60 seconds countdown
  countdown.value = 60
  if (timerId) {
    clearInterval(timerId)
  }
  timerId = window.setInterval(() => {
    if (countdown.value > 0) {
      countdown.value -= 1
    } else {
      if (timerId) {
        clearInterval(timerId)
        timerId = null
      }
    }
  }, 1000)
}

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

// otp is an array of 4 single-digit strings
const otp = ref<string[]>(['', '', '', ''])
const otpRefs = ref<Array<any | null>>([])
const otpComplete = computed(() => otp.value.join('').length === 4)
const otpError = ref(false)
const otpShake = ref(false)
const otpSuccess = ref(false)
const passwordError = ref('')
const passwordsMatch = computed(() => password.value === confirmPassword.value && password.value.length > 0)
const passwordValid = computed(() => password.value.length >= 8 && passwordsMatch.value)
const errorInputClass = computed(() => error.value ? 'border-red-500 ring-1 ring-red-400' : '')

const sendSmsLocal = async (apiPhone: string) => {
  loading.value = true;
  try {
    await sendClientOtp(apiPhone, { length: 4, ttlMs: 5 * 60 * 1000 })
    startCountdown();
    loading.value = false;
  } catch (e: any) {
    loading.value = false;
    console.error('sendClientOtp error', e);
    throw e;
  }
};

const handlePhoneSubmit = async (e: Event) => {
  e.preventDefault()
  error.value = ''
  if (!phone.value) {
    error.value = 'Введите номер телефона.'
    notify('Ошибка', error.value, 'error')
    return
  }
  loading.value = true
    try {
      const apiPhone = normalizePhone(phone.value)
      await sendSmsLocal(apiPhone)
      step.value = 2
      otp.value = ['', '', '', '']
      await nextTick()
      otpRefs.value[0]?.focus()
    } catch (e: any) {
      error.value = getUserErrorMessage(e)
      notify('Ошибка', error.value, 'error')
    } finally {
      loading.value = false
    }
  otp.value = ['', '', '', '']
  await nextTick()
  otpRefs.value[0]?.focus()
}

const handleVerify = async (e: Event) => {
  e.preventDefault()
  error.value = ''
  const code = otp.value.join('')
  if (code.length !== 4) {
    // keep phone/password errors separate; mark OTP field invalid
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
      if (!ok) {
        throw new Error('Неверный код')
      }
      // success: briefly show green state, then go to next step
      otpSuccess.value = true
      await new Promise((r) => setTimeout(r, 350))
      otpSuccess.value = false
      otpError.value = false
      step.value = 3
      return
    } catch (e: any) {
      loading.value = false
      otpError.value = true
      otpShake.value = true
      notify('Ошибка', 'Неверный код', 'error')
      otp.value = ['', '', '', '']
      await nextTick()
      otpRefs.value[0]?.focus()
      setTimeout(() => { otpShake.value = false }, 400)
      return
    }
}

const handleResend = async () => {
  if (countdown.value > 0) return
    try {
      const apiPhone = normalizePhone(phone.value)
      await sendSmsLocal(apiPhone)
      // clear otp inputs and focus
      otp.value = ['', '', '', '']
      await nextTick()
      otpRefs.value[0]?.focus()
    } catch (e: any) {
      error.value = 'Не удалось отправить код. Попробуйте позже.'
      notify('Ошибка', error.value, 'error')
    }
}

const handlePasswordSubmit = async (e: Event) => {
  e.preventDefault()
  error.value = ''
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
  loading.value = true
  error.value = ''
    try {
      const apiPhone = normalizePhone(phone.value)
      const code = otp.value.join('')
      await resetPassword(apiPhone, code, password.value)
      loading.value = false
      step.value = 4
      // auto-redirect to login after short delay
      setTimeout(() => { router.replace('/login') }, 2000)
  } catch (e: any) {
    loading.value = false
    error.value = getUserErrorMessage(e)
    notify('Ошибка', error.value, 'error')
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

const onPasswordInput = () => {
  if (passwordError.value) passwordError.value = ''
}

</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4" style="background-image: url('/bg4.png');">
    <div class="w-full max-w-md">
      <Card class="overflow-hidden p-0 shadow-2xl rounded-xl bg-white">
        <CardContent class="p-8">
          <div class="mb-4 text-left">
            <h2 class="text-xl font-semibold text-black">Восстановление пароля</h2>
           
          </div>

          <div v-if="step === 1">
            <form @submit="handlePhoneSubmit" class="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel for="phone">Номер телефона</FieldLabel>
                  <Input id="phone" type="tel" placeholder="+7 777 777 77 77" v-model="phone" required :class="errorInputClass" />
                </Field>
                
                <Field>
                  <div class="flex flex-row gap-2">
                    <Button type="button" variant="outline" class="flex-1" @click="router.replace('/login')">Назад</Button>
                    <Button type="submit" :disabled="loading" :loading="loading" class="flex-1 bg-blue-600 text-white hover:bg-blue-700">Отправить код</Button>
                  </div>
                </Field>
              </FieldGroup>
            </form>
          </div>

          <div v-if="step === 2">
            <form @submit="handleVerify" class="space-y-4">
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
                  <Button type="button" variant="outline" class="" @click="() => { step = 1 }">Назад</Button>
                  <div class="text-right">
                    <button type="button" class="text-sm text-gray-600 underline" :disabled="countdown > 0" @click="handleResend">
                      <span v-if="countdown > 0">Отправить ещё раз ({{ countdown }})</span>
                      <span v-else>Отправить ещё раз</span>
                    </button>
                  </div>
                </div>
                <div class="mt-3">
                  <Button type="submit" :disabled="loading || !otpComplete" :loading="loading" class="w-full bg-blue-600 hover:bg-blue-700 text-white">Подтвердить</Button>
                </div>
              </FieldGroup>
            </form>
          </div>

          <div v-if="step === 3">
            <form @submit="handlePasswordSubmit" class="space-y-4">
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
                  <Button type="button" variant="outline" class="flex-1" @click="() => { step = 2 }">Назад</Button>
                  <Button type="submit" :disabled="loading || !passwordValid" :loading="loading" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white">Сохранить</Button>
                </div>
              </FieldGroup>
            </form>
          </div>

          <div v-if="step === 4" class="mt-4 text-center">
            <p class="text-green-600 text-sm mb-2">Пароль успешно сброшен!</p>
            <Button type="button" class="w-full bg-green-600 hover:bg-green-700 text-white mt-4" @click="router.replace('/')">На главную</Button>
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


