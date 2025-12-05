// Kezekshi API client
import { useAuth } from '../stores/useAuth';
import { clearOtp, verifyOtp as clientVerifyOtp, generateOtp, getRemainingTTL } from './otp';
import { normalizePhone } from './phone';

const BASE = 'https://api.kezekshi.kz:39443';

// Общий токен для всех запросов (используется для публичных эндпоинтов, где нужен токен приложения)
// const COMMON_TOKEN = import.meta.env.VITE_API_TEST_TOKEN || '0453ed44a13b074e68e3bd95da2dd24c0f6a8f967b7d739e0c13db621806061b'
import { COMMON_TOKEN } from "./token";

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

export async function sendOtp(phone: string) {
  // Legacy server-side OTP endpoint. Keep as-is for servers that support it.
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

export async function resetPassword(phone: string, newPassword: string) {
  // if (import.meta.env.DEV) {
  //   return { status: true, message: 'Мок: Пароль сброшен' };
  // }
  const res = await fetch(`${BASE}/basic/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      Authorization: `Bearer ${COMMON_TOKEN}`
    },
    body: JSON.stringify({ phone, new_password: newPassword })
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

export async function getSchools(regionId: string | number) {
  const res = await fetch(`${BASE}/basic/schools`, {
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

  if (String(regionId) === 'all') {
    return data;
  }

  // Filter schools by regionId on the client side since the API returns all schools
  return data.filter((school: any) => String(school.region_id) === String(regionId));
}

export async function getStudentsStats(regionId?: string | number, schoolId?: string | number, token?: string) {
  const params = new URLSearchParams();
  if (regionId && String(regionId) !== 'all') {
    params.append('id_region', String(regionId));
  }
  if (schoolId && String(schoolId) !== 'all') {
    params.append('school_id', String(schoolId));
  }

  const res = await fetch(`${BASE}/dashboard/students-stats?${params.toString()}`, {
    method: 'GET',
    headers:
    {
      'accept': 'application/json',
      'Authorization': `Bearer ${token || COMMON_TOKEN}`
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
  schoolId?: string | number,
  token?: string
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
      'Authorization': `Bearer ${token || COMMON_TOKEN}`
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
  schoolId?: string | number,
  token?: string
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
      'Authorization': `Bearer ${token || COMMON_TOKEN}`
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
  schoolId?: string | number,
  token?: string
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
      'Authorization': `Bearer ${token || COMMON_TOKEN}`
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
  token: string,
  startDate: string,
  endDate: string,
  regionId?: string | number,
  schoolId?: string | number,
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
      'Authorization': `Bearer ${token || COMMON_TOKEN}`
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

export async function getMonthlySavings(
  year: string | number,
  regionId?: string | number,
  schoolId?: string | number
) {
  // Real implementation: query /dashboard/get-food-expenses per month (month param = "YYYY-MM-01")
  const auth = useAuth();
  const token = auth.authToken.value || COMMON_TOKEN;

  const months = Array.from({ length: 12 }, (_, i) => i + 1) // 1..12

  const promises = months.map(async (m) => {
    const monthIso = `${year}-${String(m).padStart(2, '0')}-01`;
    try {
      // get planned budgets for this month (may return [] or array of plans)
      const plans = await getPlannedBudgets(monthIso, schoolId, regionId, token);

      // If API returned an array (multiple schools/plans) — aggregate them
      if (Array.isArray(plans)) {
        if (plans.length === 0) {
          return { month: m, saved_expense: 0, actual_expense: 0 };
        }

        // If array items already contain saved_expense/actual_expense — sum them directly
        const directHasValues = plans.every(p => p && (p.saved_expense != null || p.actual_expense != null));
        if (directHasValues) {
          const totalSaved = plans.reduce((acc, p) => acc + Number(p.saved_expense ?? 0), 0);
          const totalActual = plans.reduce((acc, p) => acc + Number(p.actual_expense ?? 0), 0);
          return { month: m, saved_expense: totalSaved, actual_expense: totalActual };
        }

        // Otherwise derive planned amount & price per plan and aggregate
        let plannedTotal = 0;
        let weightedPriceSum = 0;
        let studentsWeight = 0;

        for (const p of plans) {
          const price_i = Number(p.sum_per_student ?? p.price ?? p.unit_price ?? p.price_per_student ?? 0) || 0;
          let plannedAmount_i = Number(p.amount ?? p.plan_amount ?? p.planned_amount ?? 0);
          const students_i = Number(p.plan_students_count ?? p.students_count ?? 0) || 0;
          if (!plannedAmount_i && students_i && price_i) plannedAmount_i = students_i * price_i;

          plannedTotal += Number(plannedAmount_i || 0);
          weightedPriceSum += price_i * (students_i || 1);
          studentsWeight += (students_i || 1);
        }

        // fetch aggregated summary stats for period and compute actual using weighted avg price
        let actual = 0;
        try {
          const lastDay = new Date(Number(year), m, 0).getDate();
          const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
          const endDate = `${year}-${String(m).padStart(2, '0')}-${lastDay}`;
          const stats = await getSummaryStats(token, startDate, endDate, regionId, schoolId);
          const mealsCount = Number(stats?.students_with_meals_total ?? stats?.meals_total ?? 0) || 0;
          const avgPrice = studentsWeight ? (weightedPriceSum / studentsWeight) : (plans[0] ? Number(plans[0].price ?? plans[0].sum_per_student ?? 0) : 0);
          actual = mealsCount * (Number(avgPrice) || 0);
        } catch (e) {
          console.warn(`Failed to fetch summary stats for ${monthIso}`, e);
        }

        return {
          month: m,
          saved_expense: Number(plannedTotal) - Number(actual),
          actual_expense: Number(actual)
        };
      }

      // single plan object handling (backward compatible)
      const plan = plans;
      if (!plan) {
        return { month: m, saved_expense: 0, actual_expense: 0 };
      }

      const price = Number(plan.sum_per_student ?? plan.price ?? plan.unit_price ?? plan.sum ?? 0) || 0;
      let plannedAmount = Number(plan.amount ?? plan.plan_amount ?? plan.planned_amount ?? 0);
      if (!plannedAmount && (plan.plan_students_count ?? plan.students_count) && price) {
        plannedAmount = Number(plan.plan_students_count ?? plan.students_count) * price;
      }

      let actual = 0;
      try {
        const lastDay = new Date(Number(year), m, 0).getDate();
        const startDate = `${year}-${String(m).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(m).padStart(2, '0')}-${lastDay}`;
        const stats = await getSummaryStats(token, startDate, endDate, regionId, schoolId);
        const mealsCount = Number(stats?.students_with_meals_total ?? stats?.meals_total ?? 0) || 0;
        actual = mealsCount * price;
      } catch (e) {
        console.warn(`Failed to fetch summary stats for ${monthIso}`, e);
      }

      return {
        month: m,
        saved_expense: Number(plannedAmount) - Number(actual),
        actual_expense: Number(actual)
      };
    } catch (e) {
      console.warn(`Failed to fetch planned budgets for ${monthIso}`, e);
      return { month: m, saved_expense: 0, actual_expense: 0 };
    }
  });

  const results = await Promise.all(promises);
  return results;
}

export async function changeUserData(token: string, payload: {
  phone: string,
  new_fullname: string,
  new_iin: string,
  device_token: string
}) {
  const res = await fetch(`${BASE}/user/change-user-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })
  let data
  try { data = await res.json() } catch (e) { data = null }
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

export async function setPlannedBudget(payload: {
  month: number,
  amount: number,
  price: number,
  region_id?: number,
  school_id?: number,
  school_name?: string
}, token?: string) {
  // console.log('[API] Setting planned budget (MOCK):', payload);

  // // MOCK IMPLEMENTATION using localStorage
  // // Simulate network delay
  // await new Promise(resolve => setTimeout(resolve, 50));

  // const key = 'mock_budget_history';
  // const history = JSON.parse(localStorage.getItem(key) || '[]');

  // // Add timestamp or ID if needed, but payload is enough for now
  // history.unshift({ ...payload, created_at: new Date().toISOString() });

  // localStorage.setItem(key, JSON.stringify(history));

  // return { status: true, message: 'Бюджет успешно сохранен (локально)' };

  // Real API implementation (commented out until backend is ready)
  const res = await fetch(`${BASE}/dashboard/set-food-expense`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      Authorization: `Bearer ${token || COMMON_TOKEN}`
    },
    body: JSON.stringify(payload)
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

export async function getPlannedBudgets(
  month?: number | string,
  schoolId?: string | number,
  regionId?: string | number,
  token?: string
) {
  // Build query params (month is optional, school_id and region_id optional)
  const params = new URLSearchParams();
  if (month != null && String(month) !== '') {
    params.append('month', String(month));
  }
  if (schoolId != null && String(schoolId) !== '' && schoolId !== 0 && String(schoolId) !== 'all' && String(schoolId) !== 'NaN') {
    params.append('school_id', String(schoolId));
  }
  if (regionId != null && String(regionId) !== '' && String(regionId) !== 'all' && String(regionId) !== 'NaN') {
    params.append('id_region', String(regionId));
  }

  const url = `${BASE}/dashboard/get-food-expenses${params.toString() ? `?${params.toString()}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token || COMMON_TOKEN}`
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

export async function getParentData(token: string) {
  const res = await fetch(`${BASE}/user/parent-data`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
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

export async function getPupils(token: string) {
  const res = await fetch(`${BASE}/user/pupils`, {
    method: 'GET',
    headers: {
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
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

export async function getPupilEvents(
  token: string,
  startTime: string,
  endTime: string,
  eventClasses: string[] = [],
  pupilIin?: string,
  additionData: boolean = false
) {
  const params = new URLSearchParams();
  params.append('start_time', startTime);
  params.append('end_time', endTime);
  eventClasses.forEach(cls => params.append('event_classes', cls));
  if (pupilIin) params.append('pupil_iin', pupilIin);
  if (additionData) params.append('addition_data', 'true');

  const res = await fetch(`${BASE}/events/pupil-events?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: ''
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: text };
  }

  if (!res.ok) {
    console.error('[API Error] getPupilEvents:', data);
    throw { status: res.status, ...data };
  }
  return data;
}

export async function getPupilStatuses(
  token: string,
  eventClasses: string[] = [],
  pupilIin?: string
) {
  const params = new URLSearchParams();
  eventClasses.forEach(cls => params.append('event_classes', cls));

  const body: any = {};
  if (pupilIin) body.pupil_iin = pupilIin;

  const res = await fetch(`${BASE}/events/pupil-statuses?${params.toString()}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw { status: res.status, message: 'Invalid JSON response', raw: text };
  }

  if (!res.ok) {
    console.error('[API Error] getPupilStatuses:', data);
    throw { status: res.status, ...data };
  }
  return data;
}

export async function downloadStudentPhoto(token: string, iin: string) {
  const res = await fetch(`${BASE}/user/download-student-photo/${iin}`, {
    method: 'GET',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'Authorization': `Bearer ${token}`
    }
  });

  if (res.status === 404) {
    return null;
  }

  const contentType = res.headers.get('content-type');

  if (res.ok && contentType && contentType.includes('image')) {
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const text = await res.text();

  if (!res.ok) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }
    throw { status: res.status, ...data };
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    // If it's not JSON, return as text (likely base64 string)
    return text;
  }
}

export async function downloadUserPhoto(token: string) {
  const res = await fetch(`${BASE}/user/download-user-photo`, {
    method: 'POST',
    headers: {
      'accept': 'application/json, text/plain, */*',
      'Authorization': `Bearer ${token}`
    },
    body: ''
  });

  if (res.status === 404) {
    return null;
  }

  const contentType = res.headers.get('content-type');

  if (res.ok && contentType && contentType.includes('image')) {
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const text = await res.text();

  if (!res.ok) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { raw: text };
    }
    throw { status: res.status, ...data };
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    // If it's not JSON, return as text (likely base64 string)
    return text;
  }
}

export function getLocalPlannedBudget(
  year: number,
  month: number,
  regionId?: string | number,
  schoolId?: string | number
) {
  const key = 'mock_budget_history';
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  return history.find((h: any) => {
    const yearMatch = Number(h.year) === year;
    const monthMatch = Number(h.month) === month;

    let regionMatch = true;
    if (regionId && String(regionId) !== 'all') {
      regionMatch = String(h.region_id) === String(regionId);
    }

    let schoolMatch = true;
    if (schoolId && String(schoolId) !== 'all') {
      schoolMatch = String(h.school_id) === String(schoolId);
    }

    return yearMatch && monthMatch && regionMatch && schoolMatch;
  });
}

