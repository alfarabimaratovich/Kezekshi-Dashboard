import { useToast, type ToastType } from './toastStore'

export type { ToastType }

export function notify(title: string, message: string, type: ToastType = 'info', ttl = 4000) {
  const { add } = useToast()
  add(title, message, type, ttl)
}