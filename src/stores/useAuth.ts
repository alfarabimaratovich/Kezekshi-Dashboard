import { ref, watch } from 'vue'
import { getUserData, login as apiLogin, downloadUserPhoto } from '@/lib/api'
import { notify } from '@/lib'

const AUTH_KEY = 'authToken'
const isAuth = ref<boolean>(!!localStorage.getItem(AUTH_KEY))
const authToken = ref<string | null>(localStorage.getItem(AUTH_KEY))
const userProfile = ref<any>(null)
const userPhotoUrl = ref<string | null>(null)

export function useAuth() {
  // Login: call API, store token, fetch profile
  const login = async (phone: string, password: string, deviceToken: string = '') => {
    // Use provided token for dev, or call API
    let token: string | null = null
    try {
      const resp = await apiLogin(phone, password, deviceToken)
      token = resp.access_token
    } catch (e: any) {
      notify('Ошибка авторизации', e?.detail || 'Не удалось войти. Проверьте данные и попробуйте снова.', 'error')
      throw e?.detail || 'Ошибка авторизации'
    }
    if (!token) {
      notify('Ошибка', 'Токен не получен. Попробуйте позже.', 'error')
      throw 'Токен не получен'
    }
    authToken.value = token
    localStorage.setItem(AUTH_KEY, token)
    isAuth.value = true
    notify('Успешный вход', 'Вы успешно вошли в систему.', 'success')
    await fetchProfile()
  }

  // Fetch user profile
  const fetchProfile = async () => {
    if (!authToken.value) {
      userProfile.value = null
      userPhotoUrl.value = null
      return
    }
    try {
      const profile = await getUserData(authToken.value)
      userProfile.value = profile
      
      // Fetch photo
      try {
        const photoData = await downloadUserPhoto(authToken.value)
        
        if (photoData) {
            let url = ''
            if (typeof photoData === 'string') {
                url = photoData
            } else if (typeof photoData === 'object' && photoData !== null) {
                    if ('photo' in photoData) url = photoData.photo
                    else if ('image' in photoData) url = photoData.image
                    else if ('data' in photoData) url = photoData.data
                    else if ('url' in photoData) url = photoData.url
            }

            if (url) {
                url = url.trim().replace(/^"|"$/g, '')
                if (!url.startsWith('http') && !url.startsWith('data:')) {
                    url = `data:image/jpeg;base64,${url}`
                }
                userPhotoUrl.value = url
            }
        }
      } catch (e) {
        console.warn('Failed to load user photo', e)
      }

    } catch (e: any) {
      userProfile.value = null
      userPhotoUrl.value = null
      if (e?.detail === 'Not authenticated') {
        notify('Сессия истекла', 'Пожалуйста, войдите снова.', 'warning')
        logout()
      } else {
        notify('Ошибка', 'Не удалось загрузить профиль. Попробуйте позже.', 'error')
      }
    }
  }

  // Logout: clear token/profile
  const logout = () => {
    localStorage.removeItem(AUTH_KEY)
    authToken.value = null
    isAuth.value = false
    userProfile.value = null
    userPhotoUrl.value = null
    notify('Выход из системы', 'Вы успешно вышли из системы.', 'info')
  }

  // Sync with other tabs
  const onStorage = (e: StorageEvent) => {
    if (e.key === AUTH_KEY) {
      authToken.value = e.newValue
      isAuth.value = !!e.newValue
      if (authToken.value) fetchProfile()
      else {
        userProfile.value = null
        notify('Сессия завершена', 'Вы были выведены из системы на другой вкладке.', 'info')
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage)
  }

  // ensure localStorage stays in sync if token changes inside tab
  watch(authToken, (val) => {
    if (val) localStorage.setItem(AUTH_KEY, val)
    else localStorage.removeItem(AUTH_KEY)
  })

  return {
    isAuth,
    authToken,
    userProfile,
    userPhotoUrl,
    login,
    logout,
    fetchProfile,
  }
}

