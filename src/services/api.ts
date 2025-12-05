import type { PlatformMap, ScannerInfoResponse } from '../types'
import { auth } from './auth'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
      ...(auth.getToken() ? { Authorization: `Bearer ${auth.getToken()}` } : {}),
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  // Проверка токена: сервер вернет 200 если токен валиден
  checkAuth() {
    return request<{ ok: true } | { ok: false }>('/api/login')
  },
  // Логин: ожидаем { access_token, token_type }
  login(payload: { login: string }) {
    return request<{ access_token: string; token_type: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
  getPairs(params?: { platform?: number; product?: number; date_from?: string; date_to?: string; date?: string }) {
    const q = new URLSearchParams()
    if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null) q.append(k, String(v)) })
    const url = q.toString() ? `/api/scan/pairs?${q.toString()}` : '/api/scan/pairs'
    return request<PlatformMap>(url)
  },
  getScanners() {
    return request<ScannerInfoResponse>('/api/scanners')
  },
}
