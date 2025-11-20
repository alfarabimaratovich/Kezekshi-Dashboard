export function getUserErrorMessage(error: any): string {
  if (!error) return 'Ошибка. Попробуйте еще раз';
  if (typeof error.detail === 'string') {
    if (error.detail.includes('уже зарегистрирован')) return 'Пользователь уже существует';
    if (error.detail.includes('Неверный код')) return 'Неверный номер или пароль';
    if (error.detail.includes('найден в')) return 'Пользователь найден в системе';
  }
  return 'Ошибка. Попробуйте еще раз';
}
