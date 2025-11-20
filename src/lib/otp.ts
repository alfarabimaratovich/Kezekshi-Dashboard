// Client-side OTP manager
// Stores OTP in sessionStorage with expiry. Not cryptographically secure — mirrors project requirement.
const OTP_PREFIX = 'client_otp:'
const DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

function key(phone: string) {
  return OTP_PREFIX + phone
}

export function generateOtp(phone: string, length = 4, ttl = DEFAULT_TTL) {
  const chars = '0123456789'
  let code = ''
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)]
  const payload = { code, expiresAt: Date.now() + ttl }
  try { sessionStorage.setItem(key(phone), JSON.stringify(payload)) } catch (e) { }
  return code
}

export function verifyOtp(phone: string, value: string) {
  try {
    const raw = sessionStorage.getItem(key(phone))
    if (!raw) return false
    const { code, expiresAt } = JSON.parse(raw)
    if (Date.now() > expiresAt) {
      sessionStorage.removeItem(key(phone))
      return false
    }
    const ok = String(code) === String(value)
    if (ok) sessionStorage.removeItem(key(phone))
    return ok
  } catch (e) {
    return false
  }
}

export function clearOtp(phone: string) {
  try { sessionStorage.removeItem(key(phone)) } catch (e) { }
}

export function getRemainingTTL(phone: string) {
  try {
    const raw = sessionStorage.getItem(key(phone))
    if (!raw) return 0
    const { expiresAt } = JSON.parse(raw)
    return Math.max(0, expiresAt - Date.now())
  } catch (e) { return 0 }
}
