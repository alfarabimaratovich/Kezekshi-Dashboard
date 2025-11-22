import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { resetPassword, sendClientOtp, verifyClientOtp } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import { getUserErrorMessage } from '@/lib/userError'
import { notify } from '@/lib/notifications'
import type RegisterOtpStep from '@/components/register/RegisterOtpStep.vue'

export function useReset() {
  const router = useRouter()
  const step = ref(1)
  const phone = ref('')
  const loading = ref(false)
  const otpStepRef = ref<InstanceType<typeof RegisterOtpStep> | null>(null)

  const handlePhoneSubmit = async (phoneNumber: string) => {
    phone.value = phoneNumber
    loading.value = true
    try {
      const apiPhone = normalizePhone(phone.value)
      await sendClientOtp(apiPhone, { length: 4, ttlMs: 5 * 60 * 1000 })
      step.value = 2
    } catch (e: any) {
      notify('Ошибка', getUserErrorMessage(e), 'error')
    } finally {
      loading.value = false
    }
  }

  const handleVerify = async (code: string) => {
    loading.value = true
    try {
      const apiPhone = normalizePhone(phone.value)
      const ok = verifyClientOtp(apiPhone, code)
      loading.value = false
      if (!ok) throw new Error('Неверный код')
      
      otpStepRef.value?.showSuccess()
      setTimeout(() => {
        step.value = 3
      }, 400)
    } catch (e: any) {
      loading.value = false
      otpStepRef.value?.resetOtp()
      notify('Ошибка', 'Неверный код', 'error')
    }
  }

  const handleResend = async () => {
    loading.value = true
    try {
      const apiPhone = normalizePhone(phone.value)
      await sendClientOtp(apiPhone, { length: 4, ttlMs: 5 * 60 * 1000 })
      loading.value = false
      notify('Успешно', 'Код отправлен повторно', 'success')
    } catch (e: any) {
      loading.value = false
      notify('Ошибка', 'Не удалось отправить код. Попробуйте позже.', 'error')
    }
  }

  const handlePasswordSubmit = async (password: string) => {
    loading.value = true
    try {
      const apiPhone = normalizePhone(phone.value)
      await resetPassword(apiPhone, password)
      loading.value = false
      step.value = 4
      setTimeout(() => { router.replace('/login') }, 2000)
    } catch (e: any) {
      loading.value = false
      notify('Ошибка', getUserErrorMessage(e), 'error')
    }
  }

  return {
    step,
    phone,
    loading,
    otpStepRef,
    handlePhoneSubmit,
    handleVerify,
    handleResend,
    handlePasswordSubmit
  }
}
