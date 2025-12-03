export type PlatformId = number;
export type ProductId = number;

export type PlatformMap = Record<PlatformId, ProductId[]>;

export interface WSNewPairData {
  platform: PlatformId;
  product: ProductId;
  timestamp: string;
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
