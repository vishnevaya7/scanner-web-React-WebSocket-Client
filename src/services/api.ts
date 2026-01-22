import type { PlatformMap, ScannerInfoResponse, HistoryResponse } from '../types';
import { auth } from './auth';


async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = auth.getToken();

    // Склеиваем базовый URL и путь. Убираем двойные слэши если они возникнут.
    const fullUrl = `${path.startsWith('/') ? path : '/' + path}`;

    const res = await fetch(fullUrl, {
        ...init,
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    if (!res.ok) {
        // Если пришла ошибка 404, выведем в консоль полный URL для отладки
        if (res.status === 404) {
            console.error(`Ошибка 404: Ресурс не найден по адресу ${fullUrl}`);
        }
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.detail || `${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
}

export const api = {
    login(payload: { login: string }) {
        return request<{ login: string; token: string; message?: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    getPairs(params?: { platform?: number; date?: string }) {
        const q = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined && v !== null) q.append(k, String(v));
            });
        }
        return request<PlatformMap>(`/api/scan/pairs?${q.toString()}`);
    },

    getScanners() {
        return request<ScannerInfoResponse>('/api/scanners');
    },

    getGraphics(params?: {
        date_from?: string;
        date_to?: string;
        platform?: number;
    }) {
        const q = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
            });
        }
        return request<{
            by_date: { date: string, count: number }[],
            by_platform: { platform: number, count: number }[],
            by_user: { login: string, count: number }[],
            summary: { total: number, overwrites: number, errors: number }
        }>(`/api/graphics?${q.toString()}`);
    },

    getHistory(params?: {
        date_from?: string;
        date_to?: string;
        platform?: number;
        product?: number;
        login?: string;
        legacy_synced?: number;
        is_overwrite?: boolean;
        page?: number;
        size?: number;
        sort?: string;
        order?: 'asc' | 'desc';
    }): Promise<HistoryResponse> {
        const q = new URLSearchParams();

        if (params) {
            const { sort, order, ...rest } = params;

            // Формируем строку сортировки: sort=timestamp,desc
            if (sort) {
                const sortValue = order ? `${sort},${order}` : sort;
                q.append('sort', sortValue);
            }

            // Добавляем все остальные параметры
            Object.entries(rest).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== '') {
                    // Для boolean параметров (is_overwrite) передаем строку
                    q.append(k, String(v));
                }
            });
        }

        const queryString = q.toString();
        const path = `/api/history${queryString ? `?${queryString}` : ''}`;

        return request<HistoryResponse>(path);
    },
};
