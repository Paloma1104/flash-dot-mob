export interface Drop {
  id: string;
  latitude: number;
  longitude: number;
  amount: number;
  tokenSymbol: string;
  expiresAt: string | null;
  createdAt: string;
  claimedBy: string | null;
  isActive: boolean;
}

export interface DropCluster {
  id: string;
  latitude: number;
  longitude: number;
  count: number;
  totalAmount: number;
}

export type GeoJSONDrop = GeoJSON.Feature<GeoJSON.Point, Drop>;
export type GeoJSONDropCollection = GeoJSON.FeatureCollection<GeoJSON.Point, Drop>;
