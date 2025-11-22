<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field'

const props = defineProps<{
  loading: boolean
  phone: string
}>()

const emit = defineEmits<{
  (e: 'verify', code: string): void
  (e: 'resend'): void
  (e: 'back'): void
}>()

const otp = ref<string[]>(['', '', '', ''])
const otpRefs = ref<Array<any | null>>([])
const otpError = ref(false)
const otpShake = ref(false)
const otpSuccess = ref(false)
const countdown = ref(0)
let timerId: number | null = null

const startCountdown = () => {
  countdown.value = 60
  if (timerId) clearInterval(timerId)
  timerId = window.setInterval(() => {
    if (countdown.value > 0) countdown.value -= 1
    else if (timerId) { clearInterval(timerId); timerId = null }
  }, 1000)
}

onMounted(() => {
  startCountdown()
  nextTick(() => {
    otpRefs.value[0]?.focus()
  })
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

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

const handleVerify = (e: Event) => {
  e.preventDefault()
  const code = otp.value.join('')
  if (code.length !== 4) {
    otpError.value = true
    otpShake.value = true
    setTimeout(() => { otpShake.value = false }, 400)
    return
  }
  emit('verify', code)
}

const handleResend = () => {
  if (countdown.value > 0) return
  emit('resend')
  startCountdown()
  otp.value = ['', '', '', '']
  nextTick(() => {
    otpRefs.value[0]?.focus()
  })
}

// Expose method to reset OTP from parent if verification fails
const resetOtp = () => {
  otpError.value = true
  otpShake.value = true
  otp.value = ['', '', '', '']
  nextTick(() => {
    otpRefs.value[0]?.focus()
  })
  setTimeout(() => { otpShake.value = false }, 400)
}

const showSuccess = async () => {
  otpSuccess.value = true
  await new Promise(r => setTimeout(r, 350))
  otpSuccess.value = false
  otpError.value = false
}

defineExpose({ resetOtp, showSuccess })
</script>

<template>
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
        <Button type="button" variant="outline" class="" @click="emit('back')">Назад</Button>
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
