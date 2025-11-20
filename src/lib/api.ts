// Kezekshi API client
import { generateOtp, verifyOtp as clientVerifyOtp, clearOtp, getRemainingTTL } from './otp'
import { normalizePhone } from './phone'

const BASE = '';

// Общий токен для всех запросов (используется для публичных эндпоинтов, где нужен токен приложения)
const COMMON_TOKEN = import.meta.env.VITE_API_TEST_TOKEN || '3ec66efa6a5ce64787037ee2b4dd994b3fd1405c095355df26803234b49c1aa5'

export async function getUserData(token: string, changesAfter?: string) {
  // if (import.meta.env.DEV) {
  //   return { id: 1, name: 'Моковый пользователь', phone: '+77001234567' };
  // }
  let url = `${BASE}/user/get-user-data`;
  if (changesAfter) {
    url += `?changes_after=${encodeURIComponent(changesAfter)}`;
  }
  const res = await fetch(url, {
    method: 'GET',
    headers:
     {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: await res.text() };
  }
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data;
}

export async function sendOtp(phone: string) {
  // Legacy server-side OTP endpoint. Keep as-is for servers that support it.
  if (import.meta.env.DEV) {
    return { status: true, message: 'Мок: OTP отправлен' };
  }
  const res = await fetch(`${BASE}/basic/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      Authorization: `Bearer ${COMMON_TOKEN}`
    },
    body: JSON.stringify({ phone })
  })
  let data
  try { data = await res.json() } catch (e) { data = null }
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export async function verifyOtp(phone: string, code: string) {
  if (import.meta.env.DEV) {
    if (code === '0000' || code === '1234') {
      return { status: true, message: 'Мок: OTP подтвержден' };
    }
    throw { status: 400, detail: 'Мок: Неверный код' };
  }
  const res = await fetch(`${BASE}/basic/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      Authorization: `Bearer ${COMMON_TOKEN}`
    },
    body: JSON.stringify({ phone, code })
  })
  let data
  try { data = await res.json() } catch (e) { data = null }
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export async function resetPassword(phone: string, code: string, newPassword: string) {
  if (import.meta.env.DEV) {
    return { status: true, message: 'Мок: Пароль сброшен' };
  }
  const res = await fetch(`${BASE}/basic/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      Authorization: `Bearer ${COMMON_TOKEN}`
    },
    body: JSON.stringify({ phone, code, password: newPassword })
  })
  let data
  try { data = await res.json() } catch (e) { data = null }
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

// ----- Client-side OTP helpers -----

export async function sendClientOtp(phone: string, opts?: { length?: number, ttlMs?: number }) {
  // Generate OTP client-side and send via SMS provider endpoint
  const length = opts?.length || 4
  const ttl = opts?.ttlMs
  const code = generateOtp(phone, length, ttl)
  
  console.log('[DEBUG] Generated OTP:', code, 'for phone:', phone);

  // Use the specific verification endpoint
  return await sendVerifySms(phone, code)
}

export function verifyClientOtp(phone: string, code: string) {
  return clientVerifyOtp(phone, code)
}

export function clearClientOtp(phone: string) {
  return clearOtp(phone)
}

export function clientOtpRemaining(phone: string) {
  return getRemainingTTL(phone)
}

export async function sendVerifySms(recipient: string, verifyCode: string, langCode: string = 'ru') {
  // if (import.meta.env.DEV) {
  //   return { status: true, message: 'Мок: СМС с кодом отправлено' };
  // }
  
  const normalizedPhone = normalizePhone(recipient);
  const params = new URLSearchParams({
    recipient: normalizedPhone,
    verify_code: verifyCode,
    lang_code: langCode
  });

  const res = await fetch(`${BASE}/basic/send-verify-sms/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });

  let data;
  try {
    data = await res.json();
    console.log('[DEBUG] sendVerifySms response:', data);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: await res.text() };
  }

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export async function registerUser(payload: any) {
  // if (import.meta.env.DEV) {
  //   return { status: true, message: 'Мок: Регистрация успешна' };
  // }
  const res = await fetch(`${BASE}/basic/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      Authorization: `Bearer ${COMMON_TOKEN}`
    },
    body: JSON.stringify(payload)
  })
  let data
  try { data = await res.json() } catch (e) { data = null }
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export async function login(phone: string, password: string, deviceToken: string = 'string') {
  // if (import.meta.env.DEV) {
  //   return { status: true, token: 'mock-token', user: { phone, name: 'Моковый пользователь' } };
  // }
  
  const normalizedPhone = normalizePhone(phone);

  const res = await fetch(`${BASE}/basic/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    },
    body: JSON.stringify({ phone: normalizedPhone, password, device_token: deviceToken })
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: await res.text() };
  }
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data;
}

export async function searchPhoneNumber(phone: string) {
  // if (import.meta.env.DEV) {
  //   return { userIsRegistered: true, foundIn: { on_kztk: true, on_trtk: false } };
  // }
  
  const normalizedPhone = normalizePhone(phone);

  const res = await fetch(`${BASE}/basic/search-phone-number`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      Authorization: `Bearer ${COMMON_TOKEN}`
    },
    body: JSON.stringify({ phone_number: normalizedPhone })
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: await res.text() };
  }
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data;
}

export async function sendSms(recipient: string, text: string) {
  if (import.meta.env.DEV) {
    return { status: true, message: 'Мок: СМС отправлено' };
  }
  if (text.length < 50) {
    throw new Error("Message text must be at least 50 characters long");
  }

  const res = await fetch(`${BASE}/basic/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      Authorization: `Bearer ${COMMON_TOKEN}`
    },
    body: JSON.stringify({ recipient, text })
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: await res.text() };
  }

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export async function getRegions() {
  // if (import.meta.env.DEV) {
  //   return [
  //     { id: 1, name: 'Алматы', code: 'almaty' },
  //     { id: 2, name: 'Астана', code: 'astana' },
  //     { id: 3, name: 'Шымкент', code: 'shymkent' }
  //   ];
  // }
  const res = await fetch(`${BASE}/basic/regions`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: await res.text() };
  }
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data;
}

export async function getSchools(regionId: string | number) {
  const res = await fetch(`${BASE}/basic/schools`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: await res.text() };
  }
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  
  if (String(regionId) === 'all') {
    return data;
  }

  // Filter schools by regionId on the client side since the API returns all schools
  return data.filter((school: any) => String(school.region_id) === String(regionId));
}

export async function getStudentsStats(regionId?: string | number, schoolId?: string | number) {
  const params = new URLSearchParams();
  if (regionId && String(regionId) !== 'all') {
    params.append('id_region', String(regionId));
  }
  if (schoolId && String(schoolId) !== 'all') {
    params.append('school_id', String(schoolId));
  }

  const res = await fetch(`${BASE}/dashboard/students-stats?${params.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: text };
  }

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export async function getPassageStats(
  startDate: string, 
  endDate: string, 
  regionId?: string | number, 
  schoolId?: string | number
) {
  const params = new URLSearchParams();
  params.append('start_date', startDate);
  params.append('end_date', endDate);
  if (regionId && String(regionId) !== 'all') {
    params.append('id_region', String(regionId));
  }
  if (schoolId && String(schoolId) !== 'all') {
    params.append('school_id', String(schoolId));
  }

  const res = await fetch(`${BASE}/dashboard/passage-stats?${params.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: text };
  }

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export async function getDinnerStats(
  startDate: string, 
  endDate: string, 
  regionId?: string | number, 
  schoolId?: string | number
) {
  const params = new URLSearchParams();
  params.append('start_date', startDate);
  params.append('end_date', endDate);
  if (regionId && String(regionId) !== 'all') {
    params.append('id_region', String(regionId));
  }
  if (schoolId && String(schoolId) !== 'all') {
    params.append('school_id', String(schoolId));
  }

  const res = await fetch(`${BASE}/dashboard/dinner-stats?${params.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: text };
  }

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export async function getLibraryStats(
  startDate: string, 
  endDate: string, 
  regionId?: string | number, 
  schoolId?: string | number
) {
  const params = new URLSearchParams();
  params.append('start_date', startDate);
  params.append('end_date', endDate);
  if (regionId && String(regionId) !== 'all') {
    params.append('id_region', String(regionId));
  }
  if (schoolId && String(schoolId) !== 'all') {
    params.append('school_id', String(schoolId));
  }

  const res = await fetch(`${BASE}/dashboard/library-stats?${params.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: text };
  }

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export async function getSummaryStats(
  startDate: string, 
  endDate: string, 
  regionId?: string | number, 
  schoolId?: string | number
) {
  const params = new URLSearchParams();
  params.append('start_date', startDate);
  params.append('end_date', endDate);
  
  if (regionId && String(regionId) !== 'all') {
    params.append('id_region', String(regionId));
  }
  if (schoolId && String(schoolId) !== 'all') {
    params.append('school_id', String(schoolId));
  }

  const res = await fetch(`${BASE}/dashboard/summary-stats?${params.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: text };
  }

  // --- MOCK INJECTION FOR DEMO ---
  // Inject planned budget from localStorage if available for the start date's month
  try {
    const start = new Date(startDate);
    const year = start.getFullYear();
    const month = start.getMonth() + 1;
    const storageKey = 'kezekshi_budget_plans';
    const plans = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const schoolKey = schoolId ? String(schoolId) : 'all';
    
    if (plans[year] && plans[year][schoolKey] && plans[year][schoolKey][month]) {
      const plan = plans[year][schoolKey][month];
      data.planned_expense = plan.amount;
      
      // Also calculate mock actual expense based on the price set in profile
      if (plan.price && data.students_with_meals_total) {
        data.actual_expense = data.students_with_meals_total * plan.price;
      }
    }
  } catch (e) {
    console.warn('Failed to inject mock budget data', e);
  }
  // -------------------------------

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export async function getMonthlySavings(
  year: string | number,
  regionId?: string | number,
  schoolId?: string | number
) {
  // For presentation: Try to get data from LocalStorage first
  const storageKey = 'kezekshi_budget_plans';
  const plans = JSON.parse(localStorage.getItem(storageKey) || '{}');
  const schoolKey = schoolId ? String(schoolId) : 'all';
  const yearKey = String(year);

  // If we have local plans for this year/school, use them to generate the chart
  if (plans[yearKey] && plans[yearKey][schoolKey]) {
    const yearPlans = plans[yearKey][schoolKey];
    const result = [];
    
    for (let i = 1; i <= 12; i++) {
      const plan = yearPlans[i] || { amount: 0, price: 0 };
      const planned = plan.amount;
      const price = plan.price || 0;
      
      // Mock actual meals count (random between 2000 and 3000 for demo purposes)
      // In a real app, this would come from historical stats
      const mockMealsCount = price > 0 ? Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000 : 0;
      
      const actual = mockMealsCount * price;
      const saved = planned - actual;
      
      result.push({
        month: i,
        saved_expense: saved,
        actual_expense: actual,
        planned_expense: planned
      });
    }
    return result;
  }

  // Fallback to API if no local data
  const params = new URLSearchParams();
  params.append('year', String(year));
  
  if (regionId && String(regionId) !== 'all') {
    params.append('id_region', String(regionId));
  }
  if (schoolId && String(schoolId) !== 'all') {
    params.append('school_id', String(schoolId));
  }

  const res = await fetch(`${BASE}/dashboard/monthly-savings?${params.toString()}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${COMMON_TOKEN}`
    }
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: text };
  }

  if (!res.ok) {
    throw { status: res.status, ...data };
  }

  return data;
}

export async function setPlannedBudget(payload: {
  year: number,
  month: number,
  amount: number,
  price: number,
  region_id?: number,
  school_id?: number,
  school_name?: string // Added for history display
}) {
  console.log('[API] Setting planned budget:', payload);
  
  // Save to localStorage for presentation
  const storageKey = 'kezekshi_budget_plans';
  let plans = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  const yearKey = String(payload.year);
  const schoolKey = payload.school_id ? String(payload.school_id) : 'all';
  
  if (!plans[yearKey]) plans[yearKey] = {};
  if (!plans[yearKey][schoolKey]) plans[yearKey][schoolKey] = {};
  
  plans[yearKey][schoolKey][payload.month] = {
    amount: payload.amount,
    price: payload.price,
    region_id: payload.region_id,
    school_id: payload.school_id,
    school_name: payload.school_name, // Save name
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem(storageKey, JSON.stringify(plans));

  return { status: true, message: 'Бюджет успешно сохранен (Local)' };
}

export async function getPlannedBudgets() {
  const storageKey = 'kezekshi_budget_plans';
  const plans = JSON.parse(localStorage.getItem(storageKey) || '{}');
  const result: any[] = [];

  // Iterate over years
  Object.keys(plans).forEach(year => {
    // Iterate over schools
    Object.keys(plans[year]).forEach(schoolId => {
      // Iterate over months
      Object.keys(plans[year][schoolId]).forEach(month => {
        const plan = plans[year][schoolId][month];
        result.push({
          year: parseInt(year),
          month: parseInt(month),
          school_id: schoolId === 'all' ? null : parseInt(schoolId),
          ...plan
        });
      });
    });
  });

  // Sort by date desc
  return result.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

