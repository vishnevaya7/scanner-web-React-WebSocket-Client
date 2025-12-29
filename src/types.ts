export type PlatformId = number;

export type ProductId = number;

export interface ProductScan {
    scanId: number | string; // Расширяем до string, так как Date.now() или UUID могут быть строками
    product: ProductId;
    timestamp?: number;      // Добавляем это поле (опционально)
}
export type PlatformMap = Record<PlatformId, ProductScan[]>;
export interface WSNewPairData {
    platform: PlatformId;
    product: ProductId;
    scanId?: number;
    timestamp?: string;
}
export interface WSChangePlatformData {
    platform: PlatformId;
    pairs: PlatformMap;
}
export type WSMessage =
    | { type?: 'new_pair'; data: WSNewPairData }
    | { type?: 'change_platform'; data: WSChangePlatformData }
    | { [key: string]: any };
export interface ScannerInfoResponse {
    scanners: any[];
    total_scanners: number;
}

export interface HistoryItem {
    id: number;
    login: string;
    platform: PlatformId;
    product: ProductId;
    timestamp: string;
    legacy_synced: number;     // 1=успех, 0=в процессе, -1=ошибка
    legacy_integration_error?: string | null;
    is_overwrite?: boolean;
}

export interface HistoryResponse {
    items: HistoryItem[];
    total: number;
    page: number;
    size: number;
    pages: number;
}