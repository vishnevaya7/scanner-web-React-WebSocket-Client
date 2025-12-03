import type { PlatformMap, ScannerInfoResponse } from '../types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
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
