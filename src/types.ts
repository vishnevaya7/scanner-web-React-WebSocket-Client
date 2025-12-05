export type PlatformId = number;
export type ProductId = number;

export interface ProductScan {
    scanId: number;
    product: ProductId
}

export type PlatformMap = Record<PlatformId, ProductScan[]>;

export interface WSNewPairData {
  platform: PlatformId;
  product: ProductId;
  // для совместимости: иногда может приходить scanId
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
