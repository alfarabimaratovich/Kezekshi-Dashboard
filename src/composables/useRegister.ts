import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { searchPhoneNumber, sendClientOtp, verifyClientOtp, registerUser } from '@/lib/api'
import { normalizePhone } from '@/lib/phone'
import { getUserErrorMessage } from '@/lib/userError'
import { notify } from '@/lib/notifications'
import type RegisterOtpStep from '@/components/register/RegisterOtpStep.vue'

export function useRegister() {
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
      const resp = await searchPhoneNumber(apiPhone)
      loading.value = false
      if (resp && resp.userIsRegistered) {
        notify('Пользователь уже существует', 'Пользователь с таким номером уже зарегистрирован.', 'error')
        return
      }
      await sendClientOtp(apiPhone, { length: 4, ttlMs: 5 * 60 * 1000 })
      step.value = 2
    } catch (e: any) {
      loading.value = false
      notify('Ошибка', getUserErrorMessage(e), 'error')
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
      console.error('sendClientOtp error', e)
      notify('Ошибка', 'Не удалось отправить код. Попробуйте позже.', 'error')
    }
  }

  const handleFinalSubmit = async (data: any) => {
    loading.value = true
    try {
      const apiPhone = '+' + phone.value
      const payload = {
        phone: apiPhone,
        password: data.password,
        fullname: `${data.lastName} ${data.firstName} ${data.middleName}`.trim(),
        iin: data.iin,
        device_token: ""
      }
      await registerUser(payload)
      loading.value = false
      router.replace('/login')
    } catch (e: any) {
      loading.value = false
      console.error('registerUser error', e)
      const msg = e?.detail ? (typeof e.detail === 'string' ? e.detail : JSON.stringify(e.detail)) : 'Ошибка регистрации'
      notify('Ошибка', msg, 'error')
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
    handleFinalSubmit
  }
}
