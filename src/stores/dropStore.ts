import { create } from 'zustand';

import type { Drop, GeoJSONDropCollection } from '@/types/drop';

// Viewport bounds
interface Viewport {
  latitude: number;
  longitude: number;
  zoom: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

// Drop store state
interface DropState {
  // Cached drops
  drops: Drop[];
  dropsGeoJSON: GeoJSONDropCollection | null;
  
  // Current viewport
  viewport: Viewport | null;
  
  // Selected drop
  selectedDropId: string | null;
  nearbyDropId: string | null; // Drop user is within claiming range
  
  // Loading state
  isLoading: boolean;
  lastFetchedAt: number | null;
  
  // Actions
  setDrops: (drops: Drop[]) => void;
  setViewport: (viewport: Viewport) => void;
  selectDrop: (dropId: string | null) => void;
  setNearbyDrop: (dropId: string | null) => void;
  markDropClaimed: (dropId: string) => void;
  setLoading: (isLoading: boolean) => void;
  clearDrops: () => void;
}

// Helper to convert drops to GeoJSON
function dropsToGeoJSON(drops: Drop[]): GeoJSONDropCollection {
  return {
    type: 'FeatureCollection',
    features: drops
      .filter((drop) => drop.isActive && !drop.claimedBy)
      .map((drop) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [drop.longitude, drop.latitude],
        },
        properties: drop,
      })),
  };
}

export const useDropStore = create<DropState>()((set) => ({
  // Initial state
  drops: [],
  dropsGeoJSON: null,
  viewport: null,
  selectedDropId: null,
  nearbyDropId: null,
  isLoading: false,
  lastFetchedAt: null,

  // Actions
  setDrops: (drops) =>
    set({
      drops,
      dropsGeoJSON: dropsToGeoJSON(drops),
      lastFetchedAt: Date.now(),
    }),

  setViewport: (viewport) => set({ viewport }),

  selectDrop: (dropId) => set({ selectedDropId: dropId }),

  setNearbyDrop: (dropId) => set({ nearbyDropId: dropId }),

  markDropClaimed: (dropId) =>
    set((state) => {
      const updatedDrops = state.drops.map((drop) =>
        drop.id === dropId
          ? { ...drop, isActive: false, claimedBy: 'user' }
          : drop
      );
      return {
        drops: updatedDrops,
        dropsGeoJSON: dropsToGeoJSON(updatedDrops),
        selectedDropId: null,
        nearbyDropId: null,
      };
    }),

  setLoading: (isLoading) => set({ isLoading }),

  clearDrops: () =>
    set({
      drops: [],
      dropsGeoJSON: null,
      selectedDropId: null,
      nearbyDropId: null,
    }),
}));

