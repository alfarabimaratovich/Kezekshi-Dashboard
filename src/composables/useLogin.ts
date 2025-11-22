import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/stores/useAuth'
import { normalizePhone } from '@/lib/phone'
import { getUserErrorMessage } from '@/lib/userError'
import { notify } from '@/lib/notifications'

export function useLogin() {
  const phone = ref('')
  const password = ref('')
  const error = ref('')
  const loading = ref(false)
  const router = useRouter()
  const auth = useAuth()

  const errorInputClass = computed(() => error.value ? 'border-red-500 ring-1 ring-red-400' : '')

  const handleLogin = async (e: Event) => {
    e.preventDefault()
    error.value = ''
    if (!phone.value || !password.value) {
      error.value = 'Введите телефон и пароль.'
      notify('Ошибка', error.value, 'error')
      return
    }
    const cleanPhone = normalizePhone(phone.value)
    loading.value = true
    try {
      await auth.login(cleanPhone, password.value, '')
      router.replace('/')
    } catch (err: any) {
      error.value = getUserErrorMessage(err)
    } finally {
      loading.value = false
    }
  }

  return {
    phone,
    password,
    error,
    loading,
    errorInputClass,
    handleLogin
  }
}
