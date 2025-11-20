export function normalizePhoneToDigits(input: string) {
  if (!input) return ''
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('8')) digits = '7' + digits.slice(1)
  if (digits.startsWith('007')) digits = '7' + digits.slice(3)
  if (digits.startsWith('07')) digits = '7' + digits.slice(1)
  if (!digits.startsWith('7')) digits = '7' + digits
  // ensure max 11 digits
  if (digits.length > 11) digits = digits.slice(0, 11)
  return digits
}

export function normalizePhone(input: string) {
  const d = normalizePhoneToDigits(input)
  if (!d) return ''
  return `+${d}`
}

export function formatPhoneForDisplay(digits: string) {
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
